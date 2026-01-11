/**
 * Hook principal para la calculadora
 */

import { useState, useEffect, useCallback } from 'react';
import { evaluateExpression, isValidExpression, calculatePercentage, AngleMode } from '../utils/calculatorEngine';
import {
  saveToHistory,
  getHistory,
  clearHistory,
  saveMemory,
  getMemory,
  saveNote,
  getNotes,
  removeNote,
  saveSettings,
  getSettings,
} from '../utils/calculatorStorage';
import { CalculatorHistoryItem, CalculatorMemory } from '../types';

interface UseCalculatorProps {
  angleMode?: AngleMode;
  soundEnabled?: boolean;
  soundVolume?: number;
}

export const useCalculator = ({
  angleMode: initialAngleMode = 'deg',
  soundEnabled = true,
  soundVolume = 0.3,
}: UseCalculatorProps = {}) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<CalculatorHistoryItem[]>([]);
  const [memory, setMemory] = useState<CalculatorMemory>({ M1: 0, M2: 0, M3: 0, M4: 0 });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [angleMode, setAngleMode] = useState<AngleMode>(initialAngleMode);
  const [isScientific, setIsScientific] = useState(false);
  
  // Cargar datos al inicializar
  useEffect(() => {
    setHistory(getHistory());
    setMemory(getMemory());
    setNotes(getNotes());
    const settings = getSettings();
    setAngleMode(settings.angleMode || 'deg');
  }, []);
  
  // Guardar memoria cuando cambia
  useEffect(() => {
    saveMemory(memory);
  }, [memory]);
  
  // Guardar configuración cuando cambia
  useEffect(() => {
    saveSettings({
      soundEnabled,
      soundVolume,
      angleMode,
    });
  }, [soundEnabled, soundVolume, angleMode]);
  
  // Calcular resultado en tiempo real
  useEffect(() => {
    if (expression && isValidExpression(expression)) {
      const calculated = evaluateExpression(expression, angleMode);
      setResult(calculated);
    } else {
      setResult(null);
    }
  }, [expression, angleMode]);
  
  const handleInput = useCallback((value: string) => {
    setDisplay(prev => {
      if (prev === '0' && value !== '.') {
        setExpression(value);
        return value;
      } else {
        const newDisplay = prev + value;
        setExpression(newDisplay);
        return newDisplay;
      }
    });
  }, []);
  
  const handleOperator = useCallback((operator: string) => {
    setDisplay(prev => {
      if (result !== null) {
        const newExpr = result.toString() + operator;
        setExpression(newExpr);
        setResult(null);
        return result.toString();
      } else {
        const newExpr = prev + operator;
        setExpression(newExpr);
        return prev + operator;
      }
    });
  }, [result]);
  
  const formatNumber = useCallback((num: number): string => {
    if (num > 1e10 || num < -1e10) {
      return num.toExponential(6);
    }
    if (Math.abs(num) < 0.0001 && num !== 0) {
      return num.toExponential(6);
    }
    const rounded = Math.round(num * 1e10) / 1e10;
    return rounded.toString();
  }, []);
  
  const handleEquals = useCallback(() => {
    if (!expression) return;
    
    const calculated = evaluateExpression(expression, angleMode);
    if (calculated !== null) {
      setResult(calculated);
      const formattedResult = formatNumber(calculated);
      setDisplay(formattedResult);
      
      // Guardar en historial
      const historyItem: CalculatorHistoryItem = {
        id: Date.now().toString(),
        expression,
        result: calculated,
        timestamp: new Date().toISOString(),
        note: notes[Date.now().toString()], // Nota si existe
      };
      saveToHistory(historyItem);
      setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
    }
  }, [expression, angleMode, notes, formatNumber]);
  
  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setResult(null);
  }, []);
  
  const handleBackspace = useCallback(() => {
    setDisplay(prev => {
      if (prev.length > 1) {
        const newDisplay = prev.slice(0, -1);
        setExpression(newDisplay);
        return newDisplay;
      } else {
        setExpression('');
        return '0';
      }
    });
  }, []);
  
  const handlePercentage = useCallback(() => {
    if (result !== null) {
      const percentValue = result / 100;
      setDisplay(percentValue.toString());
      setExpression(percentValue.toString());
      setResult(percentValue);
    }
  }, [result]);
  
  const handleMemoryOperation = useCallback((operation: 'M+' | 'M-' | 'MR' | 'MC', slot: 'M1' | 'M2' | 'M3' | 'M4' = 'M1') => {
    const currentValue = result !== null ? result : parseFloat(display) || 0;
    
    if (operation === 'M+') {
      setMemory(prev => ({
        ...prev,
        [slot]: prev[slot] + currentValue,
      }));
    } else if (operation === 'M-') {
      setMemory(prev => ({
        ...prev,
        [slot]: prev[slot] - currentValue,
      }));
    } else if (operation === 'MR') {
      const memValue = memory[slot];
      setDisplay(memValue.toString());
      setExpression(memValue.toString());
      setResult(memValue);
    } else if (operation === 'MC') {
      setMemory(prev => ({
        ...prev,
        [slot]: 0,
      }));
    }
  }, [result, display, memory]);
  
  const handleAddNote = useCallback((operationId: string, note: string) => {
    saveNote(operationId, note);
    setNotes(prev => ({ ...prev, [operationId]: note }));
  }, []);
  
  const handleRemoveNote = useCallback((operationId: string) => {
    removeNote(operationId);
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[operationId];
      return updated;
    });
  }, []);
  
  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);
  
  const handleLoadFromHistory = useCallback((item: CalculatorHistoryItem) => {
    const formatted = formatNumber(item.result);
    setDisplay(formatted);
    setExpression(formatted);
    setResult(item.result);
  }, [formatNumber]);
  
  const toggleAngleMode = useCallback(() => {
    const newMode = angleMode === 'deg' ? 'rad' : 'deg';
    setAngleMode(newMode);
  }, [angleMode]);
  
  return {
    display,
    expression,
    result,
    history,
    memory,
    notes,
    angleMode,
    isScientific,
    setIsScientific,
    handleInput,
    handleOperator,
    handleEquals,
    handleClear,
    handleBackspace,
    handlePercentage,
    handleMemoryOperation,
    handleAddNote,
    handleRemoveNote,
    handleClearHistory,
    handleLoadFromHistory,
    toggleAngleMode,
    formatNumber,
  };
};
