/**
 * Hook personalizado para manejar el estado del generador de exámenes
 */

import { useState, useCallback } from 'react';
import { examService } from '../services/examService';
import type {
  Exam,
  ExamQuestion,
  ExamResponse,
  ExamResult,
  ExamFlashcard,
  ExamGenerationRequest,
  ExamConfig,
  Subject,
} from '../types';

interface UseExamGeneratorReturn {
  // Estado
  currentExam: Exam | null;
  questions: ExamQuestion[];
  responses: ExamResponse[];
  examResults: ExamResult | null;
  flashcards: ExamFlashcard[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  generateExam: (config: ExamConfig, subject: Subject) => Promise<void>;
  submitResponse: (questionId: string, answer: string, timeSpent: number) => void;
  finishExam: () => Promise<void>;
  resetExam: () => void;
  loadExam: (examId: string) => Promise<void>;
}

export const useExamGenerator = (): UseExamGeneratorReturn => {
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [responses, setResponses] = useState<ExamResponse[]>([]);
  const [examResults, setExamResults] = useState<ExamResult | null>(null);
  const [flashcards, setFlashcards] = useState<ExamFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera un nuevo examen
   */
  const generateExam = useCallback(async (config: ExamConfig, subject: Subject) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const request: ExamGenerationRequest = {
        subjectId: config.subjectId,
        materialIds: config.materialIds,
        examType: config.examType,
        questionCount: config.questionCount,
        difficulty: config.difficulty,
        mode: config.mode,
      };

      const { exam, questions: generatedQuestions } = await examService.generateExam(request, subject);
      
      setCurrentExam(exam);
      setQuestions(generatedQuestions);
      setResponses([]);
      setExamResults(null);
      setFlashcards([]);
    } catch (err: any) {
      setError(err.message || 'Error al generar el examen');
      console.error('Error generating exam:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Envía una respuesta a una pregunta
   */
  const submitResponse = useCallback((questionId: string, answer: string, timeSpent: number) => {
    if (!currentExam || !questions.length) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // Verificar si la respuesta es correcta
    const isCorrect = String(answer) === String(question.correct_answer);

    // Actualizar o agregar respuesta
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.question_id === questionId);
      const newResponse: ExamResponse = {
        id: '', // Se asignará al guardar
        exam_id: currentExam.id,
        question_id: questionId,
        user_answer: answer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
        created_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      } else {
        return [...prev, newResponse];
      }
    });
  }, [currentExam, questions]);

  /**
   * Finaliza el examen y calcula resultados
   */
  const finishExam = useCallback(async () => {
    if (!currentExam || !responses.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Guardar respuestas en la base de datos
      const savedResponses = await examService.saveResponses(
        currentExam.id,
        responses.map(r => ({
          exam_id: r.exam_id,
          question_id: r.question_id,
          user_answer: r.user_answer,
          is_correct: r.is_correct,
          time_spent_seconds: r.time_spent_seconds,
        }))
      );

      // Calcular resultados
      const results = await examService.calculateResults(currentExam.id, savedResponses);
      setExamResults(results);

      // Generar flashcards de preguntas fallidas
      const failedQuestions = questions.filter(q => {
        const response = savedResponses.find(r => r.question_id === q.id);
        return response && !response.is_correct;
      });

      if (failedQuestions.length > 0) {
        const generatedFlashcards = await examService.generateFlashcards(
          currentExam.id,
          questions,
          savedResponses
        );
        setFlashcards(generatedFlashcards);
      }
    } catch (err: any) {
      setError(err.message || 'Error al finalizar el examen');
      console.error('Error finishing exam:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentExam, questions, responses]);

  /**
   * Resetea el estado del generador
   */
  const resetExam = useCallback(() => {
    setCurrentExam(null);
    setQuestions([]);
    setResponses([]);
    setExamResults(null);
    setFlashcards([]);
    setError(null);
  }, []);

  /**
   * Carga un examen existente
   */
  const loadExam = useCallback(async (examId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { exam, questions: loadedQuestions } = await examService.getExamWithQuestions(examId);
      const loadedResponses = await examService.getExamResponses(examId);
      const loadedFlashcards = await examService.getExamFlashcards(examId);
      
      // Intentar cargar resultados si existen
      try {
        const resultsData = await examService.getExamResults(examId);
        if (resultsData) {
          setExamResults(resultsData);
        }
      } catch {
        // Los resultados pueden no existir aún
      }

      setCurrentExam(exam);
      setQuestions(loadedQuestions);
      setResponses(loadedResponses);
      setFlashcards(loadedFlashcards);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el examen');
      console.error('Error loading exam:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentExam,
    questions,
    responses,
    examResults,
    flashcards,
    isLoading,
    error,
    generateExam,
    submitResponse,
    finishExam,
    resetExam,
    loadExam,
  };
};
