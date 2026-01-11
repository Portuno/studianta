/**
 * Gestión de localStorage para la calculadora
 */

import { CalculatorHistoryItem, CalculatorMemory, CalculatorSettings } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'calculator_history',
  MEMORY: 'calculator_memory',
  NOTES: 'calculator_notes',
  SETTINGS: 'calculator_settings',
};

const MAX_HISTORY_ITEMS = 50;

/**
 * Guarda un item en el historial
 */
export const saveToHistory = (item: CalculatorHistoryItem): void => {
  try {
    const history = getHistory();
    history.unshift(item); // Agregar al inicio
    
    // Limitar a MAX_HISTORY_ITEMS
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
};

/**
 * Obtiene el historial completo
 */
export const getHistory = (): CalculatorHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

/**
 * Limpia el historial
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};

/**
 * Elimina un item específico del historial
 */
export const removeHistoryItem = (id: string): void => {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing history item:', error);
  }
};

/**
 * Guarda valores de memoria
 */
export const saveMemory = (memory: CalculatorMemory): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(memory));
  } catch (error) {
    console.error('Error saving memory:', error);
  }
};

/**
 * Obtiene valores de memoria
 */
export const getMemory = (): CalculatorMemory => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MEMORY);
    if (!stored) {
      return { M1: 0, M2: 0, M3: 0, M4: 0 };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting memory:', error);
    return { M1: 0, M2: 0, M3: 0, M4: 0 };
  }
};

/**
 * Limpia toda la memoria
 */
export const clearMemory = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify({ M1: 0, M2: 0, M3: 0, M4: 0 }));
  } catch (error) {
    console.error('Error clearing memory:', error);
  }
};

/**
 * Guarda una nota asociada a una operación
 */
export const saveNote = (operationId: string, note: string): void => {
  try {
    const notes = getNotes();
    notes[operationId] = note;
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving note:', error);
  }
};

/**
 * Obtiene todas las notas
 */
export const getNotes = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting notes:', error);
    return {};
  }
};

/**
 * Obtiene una nota específica
 */
export const getNote = (operationId: string): string | undefined => {
  const notes = getNotes();
  return notes[operationId];
};

/**
 * Elimina una nota
 */
export const removeNote = (operationId: string): void => {
  try {
    const notes = getNotes();
    delete notes[operationId];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Error removing note:', error);
  }
};

/**
 * Guarda configuración
 */
export const saveSettings = (settings: CalculatorSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Obtiene configuración
 */
export const getSettings = (): CalculatorSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      return {
        soundEnabled: true,
        soundVolume: 0.3,
        angleMode: 'deg',
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      soundEnabled: true,
      soundVolume: 0.3,
      angleMode: 'deg',
    };
  }
};
