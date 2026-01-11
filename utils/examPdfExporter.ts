/**
 * Exportador de exámenes a PDF
 * Genera PDFs con preguntas y opciones a un lado, respuestas al final
 */

import { jsPDF } from 'jspdf';
import { addSealToPDF } from './pdfSeal';
import type { Exam, ExamQuestion, ExamResponse } from '../types';

/**
 * Exporta un examen a PDF con formato especial
 * Opciones a un lado, respuestas correctas al final
 */
export const exportExamToPDF = async (
  exam: Exam,
  questions: ExamQuestion[],
  responses?: ExamResponse[]
): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin + 20;

    // Agregar sello en la primera página
    await addSealToPDF(doc);

    // Título del examen
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 26, 38); // #2D1A26
    doc.text(exam.title, margin, yPosition);
    yPosition += 10;

    // Información del examen
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(139, 94, 117); // #8B5E75
    doc.text(`Tipo: ${getExamTypeText(exam.exam_type)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Dificultad: ${getDifficultyText(exam.difficulty)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Preguntas: ${exam.question_count}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Modo: ${exam.mode === 'real' ? 'Examen Real' : 'Estudio Guiado'}`, margin, yPosition);
    yPosition += 10;

    // Línea separadora
    doc.setDrawColor(139, 94, 117);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Preguntas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 26, 38);

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const response = responses?.find(r => r.question_id === question.id);

      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        await addSealToPDF(doc);
        yPosition = margin + 20;
      }

      // Número de pregunta
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 26, 38);
      doc.text(`Pregunta ${question.question_number}`, margin, yPosition);
      yPosition += 7;

      // Texto de la pregunta
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(question.question_text, contentWidth);
      doc.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * 5 + 3;

      // Opciones (si es multiple-choice o true-false)
      if (question.options && question.options.length > 0) {
        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const leftColumnX = margin;
        const rightColumnX = margin + contentWidth / 2 + 5;
        let currentColumnX = leftColumnX;
        let columnY = yPosition;

        for (let index = 0; index < question.options.length; index++) {
          const option = question.options[index];
          
          // Cambiar de columna cada 2 opciones
          if (index > 0 && index % 2 === 0) {
            currentColumnX = rightColumnX;
            columnY = yPosition;
          }

          // Verificar si necesitamos nueva página
          if (columnY > pageHeight - 30) {
            doc.addPage();
            await addSealToPDF(doc);
            columnY = margin + 20;
            currentColumnX = leftColumnX;
          }

          const optionText = `${optionLabels[index]}) ${option}`;
          const optionLines = doc.splitTextToSize(optionText, contentWidth / 2 - 5);
          
          // Marcar respuesta del usuario si existe
          if (response) {
            const isUserAnswer = String(response.user_answer) === String(index);
            const isCorrect = response.is_correct && isUserAnswer;
            
            if (isUserAnswer) {
              doc.setFont('helvetica', 'bold');
              if (isCorrect) {
                doc.setTextColor(76, 175, 80); // Verde
              } else {
                doc.setTextColor(244, 67, 54); // Rojo
              }
            } else {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(139, 94, 117);
            }
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(139, 94, 117);
          }

          doc.text(optionLines, currentColumnX, columnY);
          columnY += optionLines.length * 5 + 2;

          // Si es la última opción de la columna izquierda, resetear Y para la derecha
          if (index === 1) {
            columnY = yPosition;
          }
        }

        yPosition = Math.max(columnY, yPosition) + 5;
      }

      // Respuesta del usuario (si existe y es modo guiado)
      if (response && exam.mode === 'guided') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        if (response.is_correct) {
          doc.setTextColor(76, 175, 80); // Verde
        } else {
          doc.setTextColor(244, 67, 54); // Rojo
        }
        const userAnswerText = response.is_correct 
          ? '✓ Respuesta correcta' 
          : `✗ Tu respuesta: ${response.user_answer}`;
        doc.text(userAnswerText, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 5;

      // Línea separadora entre preguntas
      doc.setDrawColor(248, 200, 220); // #F8C8DC
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    }

    // Nueva página para respuestas correctas
    doc.addPage();
    await addSealToPDF(doc);
    yPosition = margin + 20;

    // Título de respuestas
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 26, 38);
    doc.text('Respuestas Correctas', margin, yPosition);
    yPosition += 10;

    // Línea separadora
    doc.setDrawColor(139, 94, 117);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Lista de respuestas correctas
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    for (const question of questions) {
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        await addSealToPDF(doc);
        yPosition = margin + 20;
      }

      // Pregunta número y respuesta
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 26, 38);
      doc.text(`Pregunta ${question.question_number}:`, margin, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 94, 117);
      
      let answerText = '';
      if (question.options && question.options.length > 0) {
        const correctIndex = parseInt(question.correct_answer);
        const optionLabel = ['A', 'B', 'C', 'D', 'E', 'F'][correctIndex] || String(correctIndex);
        answerText = `${optionLabel}) ${question.options[correctIndex]}`;
      } else {
        answerText = question.correct_answer;
      }

      const answerLines = doc.splitTextToSize(answerText, contentWidth - 20);
      doc.text(answerLines, margin + 15, yPosition);
      yPosition += answerLines.length * 5 + 3;

      // Explicación (si existe)
      if (question.explanation) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(139, 94, 117);
        const explanationLines = doc.splitTextToSize(question.explanation, contentWidth - 20);
        doc.text(explanationLines, margin + 15, yPosition);
        yPosition += explanationLines.length * 4 + 5;
      }

      yPosition += 3;
    }

    // Guardar PDF
    const fileName = `Examen_${exam.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting exam to PDF:', error);
    throw new Error('Error al generar el PDF del examen');
  }
};

/**
 * Obtiene el texto del tipo de examen
 */
const getExamTypeText = (type: string): string => {
  const types: Record<string, string> = {
    'multiple-choice': 'Opción Múltiple',
    'true-false': 'Verdadero/Falso',
    'open-ended': 'Preguntas Abiertas',
    'cloze': 'Completar Párrafo',
    'case-study': 'Casos Prácticos',
  };
  return types[type] || type;
};

/**
 * Obtiene el texto de la dificultad
 */
const getDifficultyText = (difficulty: string): string => {
  const difficulties: Record<string, string> = {
    'easy': 'Fácil',
    'medium': 'Media',
    'hard': 'Difícil',
    'mixed': 'Mixta',
  };
  return difficulties[difficulty] || difficulty;
};
