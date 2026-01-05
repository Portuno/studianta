import { FocusSession } from '../types';

const STORAGE_KEY = 'studianta_focus_sessions';
const MAX_AGE_DAYS = 180; // 6 meses

/**
 * Guarda una sesión de enfoque completada en localStorage
 */
export const saveFocusSession = (session: FocusSession): void => {
  try {
    const sessions = getFocusSessions();
    sessions.unshift(session); // Agregar al inicio (más recientes primero)
    
    // Limpiar sesiones antiguas (más de 6 meses)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
    
    const filteredSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= cutoffDate;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
  } catch (error) {
    console.error('Error saving focus session:', error);
  }
};

/**
 * Obtiene todas las sesiones de enfoque guardadas
 */
export const getFocusSessions = (): FocusSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const sessions = JSON.parse(stored) as FocusSession[];
    // Validar que sean objetos válidos
    return sessions.filter(s => 
      s.date && 
      typeof s.duration_minutes === 'number' && 
      typeof s.completed === 'boolean'
    );
  } catch (error) {
    console.error('Error reading focus sessions:', error);
    return [];
  }
};

/**
 * Limpia todas las sesiones de enfoque (útil para reset)
 */
export const clearFocusSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing focus sessions:', error);
  }
};

/**
 * Obtiene sesiones de una semana específica
 */
export const getSessionsThisWeek = (): FocusSession[] => {
  const sessions = getFocusSessions();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  return sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= weekAgo && sessionDate <= now;
  });
};

