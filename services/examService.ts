/**
 * Servicio para gestionar exámenes generados con IA
 */

import { supabase } from './supabaseService';
import { geminiService } from './geminiService';
import { extractTextFromMultiplePDFs, isValidPDFUrl } from './pdfTextExtractor';
import type {
  Exam,
  ExamQuestion,
  ExamResponse,
  ExamResult,
  ExamFlashcard,
  ExamGenerationRequest,
  Subject,
  StudyMaterial,
} from '../types';

export class ExamService {
  /**
   * Genera un examen usando IA basado en materiales de estudio
   */
  async generateExam(
    request: ExamGenerationRequest,
    subject: Subject
  ): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
    try {
      // Obtener materiales seleccionados
      const selectedMaterials = subject.materials.filter(m => 
        request.materialIds.includes(m.id)
      );

      if (selectedMaterials.length === 0) {
        throw new Error('No se encontraron los materiales seleccionados');
      }

      // Extraer texto de los PDFs
      // Los materiales pueden tener fileUrl (Supabase Storage) o content (base64)
      const materialUrls: string[] = [];
      
      console.log('[ExamService] Materiales seleccionados:', selectedMaterials.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        hasFileUrl: !!m.fileUrl,
        hasContent: !!m.content,
        contentLength: m.content?.length || 0,
        fileUrl: m.fileUrl?.substring(0, 100) || 'N/A'
      })));
      
      for (const material of selectedMaterials) {
        // Prioridad 1: Material con URL de Supabase Storage
        if (material.fileUrl) {
          const isValid = isValidPDFUrl(material.fileUrl);
          console.log(`[ExamService] Material ${material.name}: fileUrl=${material.fileUrl.substring(0, 50)}..., isValid=${isValid}`);
          if (isValid) {
            materialUrls.push(material.fileUrl);
            continue;
          }
        }
        
        // Prioridad 2: Material con content base64 (PDF o tipo que pueda ser PDF)
        if (material.content) {
          const isPDFType = material.type === 'PDF' || material.name.toLowerCase().endsWith('.pdf');
          console.log(`[ExamService] Material ${material.name}: hasContent=true, isPDFType=${isPDFType}, contentLength=${material.content.length}`);
          
          if (isPDFType) {
            try {
              // Extraer el base64 (puede venir con prefijo data:application/pdf;base64,)
              let base64Data = material.content;
              if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
              }
              
              // Decodificar base64 a bytes
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              
              // Crear blob y URL temporal
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              materialUrls.push(blobUrl);
              console.log(`[ExamService] Material ${material.name}: Convertido a blob URL exitosamente`);
              continue;
            } catch (error) {
              console.error(`[ExamService] Error converting base64 to blob for material ${material.name}:`, error);
              // Continuar con otros materiales
            }
          }
        }
        
        // Si llegamos aquí, el material no pudo ser procesado
        console.warn(`[ExamService] Material ${material.name} no pudo ser procesado: type=${material.type}, hasFileUrl=${!!material.fileUrl}, hasContent=${!!material.content}`);
      }
      
      console.log(`[ExamService] Total de URLs de materiales válidos: ${materialUrls.length}`);

      if (materialUrls.length === 0) {
        const materialInfo = selectedMaterials.map(m => 
          `- ${m.name} (${m.type}${m.fileUrl ? ', tiene URL' : m.content ? ', tiene contenido base64' : ', sin archivo'})`
        ).join('\n');
        throw new Error(
          `No se encontraron PDFs válidos en los materiales seleccionados.\n\n` +
          `Materiales seleccionados:\n${materialInfo}\n\n` +
          `Asegúrate de que:\n` +
          `1. Los materiales sean archivos PDF\n` +
          `2. Los archivos estén correctamente cargados\n` +
          `3. Si usas Supabase Storage, verifica que los archivos estén subidos correctamente`
        );
      }

      // Extraer texto de todos los PDFs
      let materialsText: string;
      try {
        materialsText = await extractTextFromMultiplePDFs(materialUrls);
        
        // Limpiar blob URLs temporales
        materialUrls.forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      } catch (error) {
        // Limpiar blob URLs temporales en caso de error
        materialUrls.forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        throw error;
      }

      // Generar examen con Gemini
      console.log('[ExamService] Generando examen con Gemini...');
      const examData = await geminiService.generateExam(
        subject.name,
        materialsText,
        request.examType,
        request.questionCount,
        request.difficulty
      );

      console.log('[ExamService] Respuesta de Gemini recibida:', {
        hasExam: !!examData?.exam,
        hasQuestions: !!examData?.exam?.questions,
        questionsCount: examData?.exam?.questions?.length || 0,
        examDataKeys: examData ? Object.keys(examData) : []
      });

      if (!examData) {
        throw new Error('No se recibió respuesta del generador de exámenes. Por favor, intenta nuevamente.');
      }

      // Aceptar tanto { exam: {...} } como directamente { questions: [...] }
      let examQuestions;
      let examTitle;
      
      if (examData.exam) {
        examQuestions = examData.exam.questions;
        examTitle = examData.exam.title;
      } else if (examData.questions && Array.isArray(examData.questions)) {
        examQuestions = examData.questions;
        examTitle = examData.title;
      } else {
        console.error('[ExamService] Estructura inválida recibida:', examData);
        throw new Error('La respuesta del examen no tiene el formato esperado. Debe contener "exam.questions" o "questions".');
      }

      if (!examQuestions || !Array.isArray(examQuestions) || examQuestions.length === 0) {
        throw new Error('No se generaron preguntas. El material puede ser insuficiente o el formato no es válido.');
      }

      // Crear examen en la base de datos
      const exam = await this.saveExam({
        user_id: '', // Se llenará en saveExam
        subject_id: request.subjectId,
        title: examTitle || `Examen de ${subject.name}`,
        exam_type: request.examType,
        difficulty: request.difficulty,
        question_count: examQuestions.length,
        mode: request.mode,
        material_ids: request.materialIds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Guardar preguntas
      const questions: ExamQuestion[] = [];
      for (const q of examQuestions) {
        const question = await this.saveQuestion({
          exam_id: exam.id,
          question_number: q.number || questions.length + 1,
          question_type: q.type || request.examType,
          question_text: q.text,
          options: q.options || null,
          correct_answer: String(q.correctAnswer),
          explanation: q.explanation || null,
          rationale: q.rationale || null,
          source_material: q.sourceMaterial || null,
          difficulty_level: q.difficulty || 'intermediate',
          created_at: new Date().toISOString(),
        });
        questions.push(question);
      }

      return { exam, questions };
    } catch (error: any) {
      console.error('Error generating exam:', error);
      throw new Error(`Error al generar el examen: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Guarda un examen en la base de datos
   */
  async saveExam(exam: Omit<Exam, 'id'>): Promise<Exam> {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('exams')
        .insert({
          user_id: user.id,
          subject_id: exam.subject_id,
          title: exam.title,
          exam_type: exam.exam_type,
          difficulty: exam.difficulty,
          question_count: exam.question_count,
          mode: exam.mode,
          material_ids: exam.material_ids,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Exam;
    } catch (error: any) {
      console.error('Error saving exam:', error);
      throw error;
    }
  }

  /**
   * Guarda una pregunta en la base de datos
   */
  async saveQuestion(question: Omit<ExamQuestion, 'id'>): Promise<ExamQuestion> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: question.exam_id,
          question_number: question.question_number,
          question_type: question.question_type,
          question_text: question.question_text,
          options: question.options || null,
          correct_answer: question.correct_answer,
          explanation: question.explanation || null,
          rationale: question.rationale || null,
          source_material: question.source_material || null,
          difficulty_level: question.difficulty_level,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ExamQuestion;
    } catch (error: any) {
      console.error('Error saving question:', error);
      throw error;
    }
  }

  /**
   * Guarda respuestas del usuario
   */
  async saveResponses(examId: string, responses: Omit<ExamResponse, 'id' | 'created_at'>[]): Promise<ExamResponse[]> {
    try {
      const { data, error } = await supabase
        .from('exam_responses')
        .insert(
          responses.map(r => ({
            exam_id: examId,
            question_id: r.question_id,
            user_answer: r.user_answer,
            is_correct: r.is_correct,
            time_spent_seconds: r.time_spent_seconds,
          }))
        )
        .select();

      if (error) throw error;
      return data as ExamResponse[];
    } catch (error: any) {
      console.error('Error saving responses:', error);
      throw error;
    }
  }

  /**
   * Calcula resultados del examen
   */
  async calculateResults(examId: string, responses: ExamResponse[]): Promise<ExamResult> {
    try {
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const scorePercentage = (correctAnswers / totalQuestions) * 100;
      const timeSpentTotal = responses.reduce((sum, r) => sum + r.time_spent_seconds, 0);

      // Calcular nivel de dominio
      const masteryLevel = this.calculateMasteryLevel(scorePercentage);

      // Guardar resultado
      const { data, error } = await supabase
        .from('exam_results')
        .insert({
          exam_id: examId,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          score_percentage: scorePercentage,
          time_spent_total: timeSpentTotal,
          mastery_level: masteryLevel,
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar examen como completado
      await supabase
        .from('exams')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', examId);

      return data as ExamResult;
    } catch (error: any) {
      console.error('Error calculating results:', error);
      throw error;
    }
  }

  /**
   * Calcula el nivel de dominio basado en el puntaje
   */
  private calculateMasteryLevel(scorePercentage: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (scorePercentage >= 90) return 'expert';
    if (scorePercentage >= 75) return 'advanced';
    if (scorePercentage >= 60) return 'intermediate';
    return 'beginner';
  }

  /**
   * Genera flashcards de preguntas fallidas
   */
  async generateFlashcards(examId: string, questions: ExamQuestion[], responses: ExamResponse[]): Promise<ExamFlashcard[]> {
    try {
      const failedQuestions = questions.filter(q => {
        const response = responses.find(r => r.question_id === q.id);
        return response && !response.is_correct;
      });

      const flashcards: ExamFlashcard[] = [];

      for (const question of failedQuestions) {
        const frontText = question.question_text;
        const backText = `${question.explanation || 'Respuesta correcta'}\n\n${question.rationale || ''}`;

        const { data, error } = await supabase
          .from('exam_flashcards')
          .insert({
            exam_id: examId,
            question_id: question.id,
            front_text: frontText,
            back_text: backText,
            reviewed_count: 0,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating flashcard:', error);
          continue;
        }

        flashcards.push(data as ExamFlashcard);
      }

      return flashcards;
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de exámenes
   */
  async getExamHistory(userId: string, subjectId?: string): Promise<Exam[]> {
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Exam[];
    } catch (error: any) {
      console.error('Error getting exam history:', error);
      throw error;
    }
  }

  /**
   * Obtiene un examen con sus preguntas
   */
  async getExamWithQuestions(examId: string): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
    try {
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      const { data: questions, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;

      return {
        exam: exam as Exam,
        questions: (questions || []) as ExamQuestion[],
      };
    } catch (error: any) {
      console.error('Error getting exam with questions:', error);
      throw error;
    }
  }

  /**
   * Obtiene respuestas de un examen
   */
  async getExamResponses(examId: string): Promise<ExamResponse[]> {
    try {
      const { data, error } = await supabase
        .from('exam_responses')
        .select('*')
        .eq('exam_id', examId);

      if (error) throw error;
      return (data || []) as ExamResponse[];
    } catch (error: any) {
      console.error('Error getting exam responses:', error);
      throw error;
    }
  }

  /**
   * Obtiene flashcards de un examen
   */
  async getExamFlashcards(examId: string): Promise<ExamFlashcard[]> {
    try {
      const { data, error } = await supabase
        .from('exam_flashcards')
        .select('*')
        .eq('exam_id', examId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ExamFlashcard[];
    } catch (error: any) {
      console.error('Error getting exam flashcards:', error);
      throw error;
    }
  }

  /**
   * Obtiene resultados de un examen
   */
  async getExamResults(examId: string): Promise<ExamResult | null> {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', examId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró resultado
          return null;
        }
        throw error;
      }
      return data as ExamResult;
    } catch (error: any) {
      console.error('Error getting exam results:', error);
      throw error;
    }
  }
}

export const examService = new ExamService();
