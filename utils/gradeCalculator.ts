/**
 * Calculadora de promedios académicos
 */

export interface GradeCalculation {
  currentAverage: number;
  neededGrade: number | null;
  isPassing: boolean;
  message: string;
}

/**
 * Calcula el promedio de un array de notas
 */
export const calculateAverage = (grades: number[]): number => {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  return sum / grades.length;
};

/**
 * Calcula la nota necesaria para alcanzar un promedio objetivo
 */
export const calculateNeededGrade = (
  currentGrades: number[],
  targetAverage: number,
  upcomingExamsCount: number = 1
): number | null => {
  if (upcomingExamsCount <= 0) return null;
  
  const currentAverage = calculateAverage(currentGrades);
  const totalExams = currentGrades.length + upcomingExamsCount;
  const totalPointsNeeded = targetAverage * totalExams;
  const currentPoints = currentGrades.reduce((acc, grade) => acc + grade, 0);
  const pointsNeeded = totalPointsNeeded - currentPoints;
  
  return pointsNeeded / upcomingExamsCount;
};

/**
 * Calcula la nota necesaria para aprobar (promedio >= 6)
 */
export const calculateNeededToPass = (
  currentGrades: number[],
  upcomingExamsCount: number = 1
): number | null => {
  return calculateNeededGrade(currentGrades, 6, upcomingExamsCount);
};

/**
 * Calcula información completa sobre el promedio
 */
export const calculateGradeInfo = (
  currentGrades: number[],
  targetAverage?: number,
  upcomingExamsCount: number = 1
): GradeCalculation => {
  const currentAverage = calculateAverage(currentGrades);
  const passingGrade = 6;
  const isPassing = currentAverage >= passingGrade;
  
  let neededGrade: number | null = null;
  let message = '';
  
  if (targetAverage !== undefined) {
    neededGrade = calculateNeededGrade(currentGrades, targetAverage, upcomingExamsCount);
    
    if (neededGrade === null) {
      message = 'No se puede calcular la nota necesaria';
    } else if (neededGrade > 10) {
      message = `Necesitás ${neededGrade.toFixed(2)} en el próximo examen (imposible)`;
    } else if (neededGrade < 0) {
      message = 'Ya alcanzaste tu meta, podés relajarte';
    } else {
      message = `Necesitás ${neededGrade.toFixed(2)} en el próximo examen para alcanzar ${targetAverage}`;
    }
  } else {
    // Solo verificar si está aprobando
    if (isPassing) {
      message = `Tu promedio es ${currentAverage.toFixed(2)}, estás aprobando`;
    } else {
      const neededToPass = calculateNeededToPass(currentGrades, upcomingExamsCount);
      if (neededToPass !== null && neededToPass <= 10) {
        message = `Necesitás ${neededToPass.toFixed(2)} en el próximo examen para aprobar`;
      } else {
        message = 'Tu promedio es muy bajo, necesitás mejorar significativamente';
      }
    }
  }
  
  return {
    currentAverage,
    neededGrade,
    isPassing,
    message,
  };
};

/**
 * Valida que una nota esté en el rango válido (0-10)
 */
export const isValidGrade = (grade: number): boolean => {
  return grade >= 0 && grade <= 10;
};
