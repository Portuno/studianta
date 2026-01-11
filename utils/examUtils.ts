/**
 * Utilidades para el sistema de exámenes
 */

import type { MasteryLevel, QuestionDifficulty } from '../types';

/**
 * Calcula el nivel de dominio basado en el puntaje
 */
export const calculateMasteryLevel = (score: number): MasteryLevel => {
  if (score >= 90) return 'expert';
  if (score >= 75) return 'advanced';
  if (score >= 60) return 'intermediate';
  return 'beginner';
};

/**
 * Formatea el tiempo transcurrido en segundos a formato legible
 */
export const formatTimeSpent = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

/**
 * Mezcla un array (útil para mezclar opciones de respuesta)
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Obtiene el color asociado al nivel de dominio
 */
export const getMasteryColor = (level: MasteryLevel): string => {
  switch (level) {
    case 'expert':
      return '#D4AF37'; // Gold
    case 'advanced':
      return '#4A90E2'; // Blue
    case 'intermediate':
      return '#8B5E75'; // Mauve
    case 'beginner':
      return '#E35B8F'; // Pink
    default:
      return '#8B5E75';
  }
};

/**
 * Obtiene el texto del nivel de dominio
 */
export const getMasteryText = (level: MasteryLevel): string => {
  switch (level) {
    case 'expert':
      return 'Experto';
    case 'advanced':
      return 'Avanzado';
    case 'intermediate':
      return 'Intermedio';
    case 'beginner':
      return 'Principiante';
    default:
      return 'Desconocido';
  }
};

/**
 * Obtiene el color asociado a la dificultad de la pregunta
 */
export const getDifficultyColor = (difficulty: QuestionDifficulty): string => {
  switch (difficulty) {
    case 'easy':
      return '#4CAF50'; // Green
    case 'intermediate':
      return '#FF9800'; // Orange
    case 'hard':
      return '#F44336'; // Red
    default:
      return '#8B5E75';
  }
};

/**
 * Obtiene el texto de la dificultad
 */
export const getDifficultyText = (difficulty: QuestionDifficulty): string => {
  switch (difficulty) {
    case 'easy':
      return 'Fácil';
    case 'intermediate':
      return 'Intermedio';
    case 'hard':
      return 'Difícil';
    default:
      return 'Desconocido';
  }
};

/**
 * Valida si una respuesta es correcta
 */
export const isAnswerCorrect = (
  userAnswer: string,
  correctAnswer: string,
  questionType: string
): boolean => {
  if (questionType === 'multiple-choice' || questionType === 'true-false') {
    // Para opción múltiple y verdadero/falso, comparar índices
    return String(userAnswer) === String(correctAnswer);
  }
  
  // Para otros tipos, comparar texto (case-insensitive)
  return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
};

/**
 * Formatea el porcentaje de puntaje
 */
export const formatScore = (score: number): string => {
  return `${score.toFixed(1)}%`;
};
