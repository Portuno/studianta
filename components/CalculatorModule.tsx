import React, { useState, useEffect, useCallback } from 'react';
import { getIcon } from '../constants';
import { useCalculator } from '../hooks/useCalculator';
import { useCalculatorSounds } from '../hooks/useCalculatorSounds';
import { CalculatorHistoryItem } from '../types';
import { getUnitsForCategory, getCategories, convertUnit, getCategoryName, UnitCategory } from '../utils/unitConverter';
import { calculateGradeInfo, isValidGrade } from '../utils/gradeCalculator';
import { getSettings } from '../utils/calculatorStorage';

interface CalculatorModuleProps {
  isMobile: boolean;
  isNightMode?: boolean;
  onFloatingMode?: () => void;
}

type TabType = 'calculator' | 'grades' | 'converter';

const CalculatorModule: React.FC<CalculatorModuleProps> = ({
  isMobile,
  isNightMode = false,
  onFloatingMode,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [showHistory, setShowHistory] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  
  // Settings
  const settings = getSettings();
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [soundVolume, setSoundVolume] = useState(settings.soundVolume);
  
  // Calculator hook
  const calculator = useCalculator({
    angleMode: settings.angleMode || 'deg',
    soundEnabled,
    soundVolume,
  });
  
  // Sounds hook
  const sounds = useCalculatorSounds({
    enabled: soundEnabled,
    volume: soundVolume,
  });
  
  // Grade calculator state
  const [grades, setGrades] = useState<string[]>(['']);
  const [targetAverage, setTargetAverage] = useState<string>('');
  const [gradeInfo, setGradeInfo] = useState<any>(null);
  
  // Unit converter state
  const [converterCategory, setConverterCategory] = useState<UnitCategory>('length');
  const [converterFromUnit, setConverterFromUnit] = useState<string>('');
  const [converterToUnit, setConverterToUnit] = useState<string>('');
  const [converterValue, setConverterValue] = useState<string>('');
  const [converterResult, setConverterResult] = useState<number | null>(null);
  
  // Load units when category changes
  useEffect(() => {
    const units = getUnitsForCategory(converterCategory);
    const unitKeys = Object.keys(units);
    if (unitKeys.length > 0) {
      if (!converterFromUnit || !units[converterFromUnit]) {
        setConverterFromUnit(unitKeys[0]);
      }
      if (!converterToUnit || !units[converterToUnit]) {
        setConverterToUnit(unitKeys[1] || unitKeys[0]);
      }
    }
  }, [converterCategory]);
  
  // Calculate converter result
  useEffect(() => {
    if (converterValue && converterFromUnit && converterToUnit) {
      const value = parseFloat(converterValue);
      if (!isNaN(value)) {
        const result = convertUnit(value, converterFromUnit, converterToUnit, converterCategory);
        setConverterResult(result);
      } else {
        setConverterResult(null);
      }
    } else {
      setConverterResult(null);
    }
  }, [converterValue, converterFromUnit, converterToUnit, converterCategory]);
  
  // Calculate grade info
  useEffect(() => {
    const validGrades = grades
      .map(g => parseFloat(g))
      .filter(g => !isNaN(g) && isValidGrade(g));
    
    if (validGrades.length > 0) {
      const target = targetAverage ? parseFloat(targetAverage) : undefined;
      const info = calculateGradeInfo(validGrades, target, 1);
      setGradeInfo(info);
    } else {
      setGradeInfo(null);
    }
  }, [grades, targetAverage]);
  
  const handleButtonClick = useCallback((value: string, type: 'number' | 'operator' | 'function' | 'equals' | 'control' = 'number', buttonId?: string) => {
    setPressedButton(buttonId || value);
    setTimeout(() => setPressedButton(null), 150);
    
    if (type === 'number') {
      sounds.playNumberSound();
      calculator.handleInput(value);
    } else if (type === 'operator') {
      sounds.playOperatorSound();
      calculator.handleOperator(value);
    } else if (type === 'equals') {
      sounds.playEqualsSound();
      calculator.handleEquals();
    } else if (type === 'control') {
      sounds.playOperatorSound();
    }
  }, [sounds, calculator]);
  
  const handleCopy = useCallback(async () => {
    const textToCopy = calculator.result !== null 
      ? calculator.result.toString() 
      : calculator.display;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [calculator]);
  
  const handleAddNote = useCallback((item: CalculatorHistoryItem) => {
    setShowNoteModal(item.id);
    setNoteInput(calculator.notes[item.id] || '');
  }, [calculator.notes]);
  
  const handleSaveNote = useCallback(() => {
    if (showNoteModal) {
      if (noteInput.trim()) {
        calculator.handleAddNote(showNoteModal, noteInput.trim());
      } else {
        calculator.handleRemoveNote(showNoteModal);
      }
      setShowNoteModal(null);
      setNoteInput('');
    }
  }, [showNoteModal, noteInput, calculator]);
  
  const renderCalculatorTab = () => {
    // Layout: 4 columnas estándar
    // Fila 1: C, ⌫, %, ÷
    // Fila 2: 7, 8, 9, ×
    // Fila 3: 4, 5, 6, -
    // Fila 4: 1, 2, 3, +
    // Fila 5: 0 (span 2), ., =
    
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        {/* Display - Glassmorphism - Tercio superior */}
        <div className={`mb-6 p-6 rounded-2xl backdrop-blur-[15px] border transition-all duration-300 ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
            : 'bg-[rgba(255,240,245,0.6)] border-[#D4AF37]/20 shadow-[0_8px_32px_rgba(212,175,55,0.15)]'
        }`}>
          {/* Controls row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => calculator.setIsScientific(!calculator.isScientific)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  calculator.isScientific
                    ? isNightMode
                      ? 'bg-[#C77DFF]/80 text-white shadow-sm'
                      : 'bg-[#E35B8F]/80 text-white shadow-sm'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] border border-[#A68A56]/30'
                      : 'bg-white/40 text-[#8B5E75] border border-[#F8C8DC]/50'
                }`}
              >
                {calculator.isScientific ? 'Científica' : 'Básica'}
              </button>
              <button
                onClick={calculator.toggleAngleMode}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] border border-[#A68A56]/30'
                    : 'bg-white/40 text-[#8B5E75] border border-[#F8C8DC]/50'
                }`}
              >
                {calculator.angleMode === 'deg' ? 'DEG' : 'RAD'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-lg transition-all ${
                  copyFeedback
                    ? isNightMode ? 'bg-[#A68A56] text-white' : 'bg-[#D4AF37] text-white'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.7)]'
                      : 'bg-white/40 text-[#8B5E75] hover:bg-white/60'
                }`}
                aria-label="Copiar"
              >
                {getIcon('copy', 'w-3.5 h-3.5')}
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`p-1.5 rounded-lg transition-all ${
                  showHistory
                    ? isNightMode ? 'bg-[#C77DFF]/80 text-white' : 'bg-[#E35B8F]/80 text-white'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.7)]'
                      : 'bg-white/40 text-[#8B5E75] hover:bg-white/60'
                }`}
                aria-label="Historial"
              >
                {getIcon('history', 'w-3.5 h-3.5')}
              </button>
              {onFloatingMode && (
                <button
                  onClick={onFloatingMode}
                  className={`p-1.5 rounded-lg transition-all ${
                    isNightMode
                      ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.7)]'
                      : 'bg-white/40 text-[#8B5E75] hover:bg-white/60'
                  }`}
                  aria-label="Flotante"
                >
                  {getIcon('minimize', 'w-3.5 h-3.5')}
                </button>
              )}
            </div>
          </div>
          
          {/* Expression (small, gray) */}
          <div className={`text-right mb-2 transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]/70' : 'text-[#8B5E75]/60'
          }`}>
            <div className="text-xs font-mono font-light">{calculator.expression || '0'}</div>
          </div>
          
          {/* Result (large, sans-serif thin) */}
          <div className={`text-right font-sans text-4xl md:text-5xl font-light tracking-tight transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>
            {calculator.result !== null
              ? calculator.formatNumber(calculator.result)
              : calculator.display}
          </div>
        </div>
        
        {/* Memory indicators - compact */}
        {(calculator.memory.M1 !== 0 || calculator.memory.M2 !== 0 || 
          calculator.memory.M3 !== 0 || calculator.memory.M4 !== 0) && (
          <div className="flex gap-1.5 mb-4 justify-center">
            {['M1', 'M2', 'M3', 'M4'].map((slot, idx) => {
              const memValue = calculator.memory[slot as keyof typeof calculator.memory];
              if (memValue === 0) return null;
              return (
                <div
                  key={slot}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    isNightMode
                      ? 'bg-[rgba(199,125,255,0.15)] text-[#C77DFF] border border-[#A68A56]/20'
                      : 'bg-[#E35B8F]/8 text-[#E35B8F] border border-[#F8C8DC]/40'
                  }`}
                >
                  {slot}: {calculator.formatNumber(memValue)}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Keyboard - Compact 4x5 grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1: C, ⌫, %, ÷ */}
          <button
            onClick={() => handleButtonClick('C', 'control', 'clear')}
            className={`h-12 rounded-lg text-sm font-semibold transition-all duration-150 ${
              pressedButton === 'clear'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(227,91,143,0.3)] text-[#E35B8F] border border-[#A68A56]/30 hover:bg-[rgba(227,91,143,0.4)]'
                : 'bg-[rgba(227,91,143,0.15)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.25)]'
            }`}
          >
            C
          </button>
          <button
            onClick={() => handleButtonClick('⌫', 'control', 'backspace')}
            className={`h-12 rounded-lg text-sm font-semibold transition-all duration-150 ${
              pressedButton === 'backspace'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(227,91,143,0.3)] text-[#E35B8F] border border-[#A68A56]/30 hover:bg-[rgba(227,91,143,0.4)]'
                : 'bg-[rgba(227,91,143,0.15)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.25)]'
            }`}
          >
            ⌫
          </button>
          <button
            onClick={() => handleButtonClick('%', 'control', 'percent')}
            className={`h-12 rounded-lg text-sm font-semibold transition-all duration-150 ${
              pressedButton === 'percent'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(227,91,143,0.3)] text-[#E35B8F] border border-[#A68A56]/30 hover:bg-[rgba(227,91,143,0.4)]'
                : 'bg-[rgba(227,91,143,0.15)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.25)]'
            }`}
          >
            %
          </button>
          <button
            onClick={() => handleButtonClick('÷', 'operator', 'divide')}
            className={`h-12 rounded-lg text-lg font-semibold transition-all duration-150 ${
              pressedButton === 'divide'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(199,125,255,0.25)] text-[#C77DFF] border border-[#A68A56]/30 hover:bg-[rgba(199,125,255,0.35)]'
                : 'bg-[rgba(227,91,143,0.12)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.22)]'
            }`}
          >
            ÷
          </button>
          
          {/* Row 2: 7, 8, 9, × */}
          {['7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleButtonClick(num, 'number', `num-${num}`)}
              className={`h-12 rounded-lg text-base font-medium transition-all duration-150 ${
                pressedButton === `num-${num}`
                  ? 'scale-95 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'active:scale-95'
              } ${
                isNightMode
                  ? 'bg-white/10 text-[#E0E1DD] border border-[#A68A56]/20 hover:bg-white/15'
                  : 'bg-white/40 text-[#4A233E] border border-[#D4AF37]/20 hover:bg-white/50'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleButtonClick('×', 'operator', 'multiply')}
            className={`h-12 rounded-lg text-lg font-semibold transition-all duration-150 ${
              pressedButton === 'multiply'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(199,125,255,0.25)] text-[#C77DFF] border border-[#A68A56]/30 hover:bg-[rgba(199,125,255,0.35)]'
                : 'bg-[rgba(227,91,143,0.12)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.22)]'
            }`}
          >
            ×
          </button>
          
          {/* Row 3: 4, 5, 6, - */}
          {['4', '5', '6'].map((num) => (
            <button
              key={num}
              onClick={() => handleButtonClick(num, 'number', `num-${num}`)}
              className={`h-12 rounded-lg text-base font-medium transition-all duration-150 ${
                pressedButton === `num-${num}`
                  ? 'scale-95 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'active:scale-95'
              } ${
                isNightMode
                  ? 'bg-white/10 text-[#E0E1DD] border border-[#A68A56]/20 hover:bg-white/15'
                  : 'bg-white/40 text-[#4A233E] border border-[#D4AF37]/20 hover:bg-white/50'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleButtonClick('-', 'operator', 'subtract')}
            className={`h-12 rounded-lg text-lg font-semibold transition-all duration-150 ${
              pressedButton === 'subtract'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(199,125,255,0.25)] text-[#C77DFF] border border-[#A68A56]/30 hover:bg-[rgba(199,125,255,0.35)]'
                : 'bg-[rgba(227,91,143,0.12)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.22)]'
            }`}
          >
            −
          </button>
          
          {/* Row 4: 1, 2, 3, + */}
          {['1', '2', '3'].map((num) => (
            <button
              key={num}
              onClick={() => handleButtonClick(num, 'number', `num-${num}`)}
              className={`h-12 rounded-lg text-base font-medium transition-all duration-150 ${
                pressedButton === `num-${num}`
                  ? 'scale-95 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'active:scale-95'
              } ${
                isNightMode
                  ? 'bg-white/10 text-[#E0E1DD] border border-[#A68A56]/20 hover:bg-white/15'
                  : 'bg-white/40 text-[#4A233E] border border-[#D4AF37]/20 hover:bg-white/50'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleButtonClick('+', 'operator', 'add')}
            className={`h-12 rounded-lg text-lg font-semibold transition-all duration-150 ${
              pressedButton === 'add'
                ? 'scale-95 shadow-inner'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(199,125,255,0.25)] text-[#C77DFF] border border-[#A68A56]/30 hover:bg-[rgba(199,125,255,0.35)]'
                : 'bg-[rgba(227,91,143,0.12)] text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-[rgba(227,91,143,0.22)]'
            }`}
          >
            +
          </button>
          
          {/* Row 5: 0 (span 2), ., = */}
          <button
            onClick={() => handleButtonClick('0', 'number', 'num-0')}
            className={`h-12 col-span-2 rounded-lg text-base font-medium transition-all duration-150 ${
              pressedButton === 'num-0'
                ? 'scale-95 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-white/10 text-[#E0E1DD] border border-[#A68A56]/20 hover:bg-white/15'
                : 'bg-white/40 text-[#4A233E] border border-[#D4AF37]/20 hover:bg-white/50'
            }`}
          >
            0
          </button>
          <button
            onClick={() => handleButtonClick('.', 'number', 'decimal')}
            className={`h-12 rounded-lg text-base font-medium transition-all duration-150 ${
              pressedButton === 'decimal'
                ? 'scale-95 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-white/10 text-[#E0E1DD] border border-[#A68A56]/20 hover:bg-white/15'
                : 'bg-white/40 text-[#4A233E] border border-[#D4AF37]/20 hover:bg-white/50'
            }`}
          >
            .
          </button>
          <button
            onClick={() => handleButtonClick('=', 'equals', 'equals')}
            className={`h-12 rounded-lg text-lg font-semibold transition-all duration-150 ${
              pressedButton === 'equals'
                ? 'scale-95 shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                : 'active:scale-95'
            } ${
              isNightMode
                ? 'bg-[#A68A56]/80 text-white border border-[#A68A56] shadow-[0_0_8px_rgba(166,138,86,0.3)] hover:bg-[#A68A56]'
                : 'bg-[#D4AF37]/90 text-[#4A233E] border border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.2)] hover:bg-[#D4AF37]'
            }`}
          >
            =
          </button>
        </div>
      </div>
    );
  };
  
  const renderGradesTab = () => {
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto max-w-2xl mx-auto">
        <div className={`p-6 rounded-2xl backdrop-blur-[15px] border transition-colors duration-500 ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
            : 'bg-[rgba(255,240,245,0.6)] border-[#D4AF37]/20'
        }`}>
          <h3 className={`font-marcellus text-lg font-black mb-4 transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>
            Calculadora de Promedios
          </h3>
          
          <div className="space-y-3">
            <label className={`block text-sm font-semibold transition-colors duration-500 ${
              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
            }`}>
              Notas Actuales (0-10)
            </label>
            {grades.map((grade, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={grade}
                  onChange={(e) => {
                    const newGrades = [...grades];
                    newGrades[index] = e.target.value;
                    setGrades(newGrades);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                    isNightMode
                      ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                      : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                  }`}
                  placeholder="Nota"
                />
                {index === grades.length - 1 && (
                  <button
                    onClick={() => setGrades([...grades, ''])}
                    className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                      isNightMode
                        ? 'bg-[#C77DFF]/80 text-white hover:bg-[#C77DFF]'
                        : 'bg-[#E35B8F]/80 text-white hover:bg-[#E35B8F]'
                    }`}
                  >
                    +
                  </button>
                )}
                {grades.length > 1 && (
                  <button
                    onClick={() => {
                      const newGrades = grades.filter((_, i) => i !== index);
                      setGrades(newGrades.length > 0 ? newGrades : ['']);
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                      isNightMode
                        ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]'
                        : 'bg-white/60 text-[#8B5E75] border border-[#F8C8DC] hover:bg-white/80'
                    }`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
            }`}>
              Meta de Promedio (opcional)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={targetAverage}
              onChange={(e) => setTargetAverage(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                  : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
              }`}
              placeholder="Ej: 7.5"
            />
          </div>
          
          {gradeInfo && (
            <div className={`mt-4 p-4 rounded-lg border transition-colors duration-500 ${
              gradeInfo.isPassing
                ? isNightMode
                  ? 'bg-[rgba(166,138,86,0.15)] border-[#A68A56]/40'
                  : 'bg-[#D4AF37]/10 border-[#D4AF37]/40'
                : isNightMode
                  ? 'bg-[rgba(199,125,255,0.15)] border-[#C77DFF]/40'
                  : 'bg-[#E35B8F]/10 border-[#E35B8F]/40'
            }`}>
              <div className={`text-lg font-black mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                Promedio Actual: {gradeInfo.currentAverage.toFixed(2)}
              </div>
              <div className={`text-sm transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                {gradeInfo.message}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderConverterTab = () => {
    const categories = getCategories();
    const units = getUnitsForCategory(converterCategory);
    const unitKeys = Object.keys(units);
    
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto max-w-2xl mx-auto">
        <div className={`p-6 rounded-2xl backdrop-blur-[15px] border transition-colors duration-500 ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
            : 'bg-[rgba(255,240,245,0.6)] border-[#D4AF37]/20'
        }`}>
          <h3 className={`font-marcellus text-lg font-black mb-4 transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>
            Conversor de Unidades
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                Categoría
              </label>
              <select
                value={converterCategory}
                onChange={(e) => setConverterCategory(e.target.value as UnitCategory)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                De
              </label>
              <select
                value={converterFromUnit}
                onChange={(e) => setConverterFromUnit(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                }`}
              >
                {unitKeys.map((key) => (
                  <option key={key} value={key}>
                    {units[key].name} ({units[key].symbol})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                A
              </label>
              <select
                value={converterToUnit}
                onChange={(e) => setConverterToUnit(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                }`}
              >
                {unitKeys.map((key) => (
                  <option key={key} value={key}>
                    {units[key].name} ({units[key].symbol})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                Valor
              </label>
              <input
                type="number"
                value={converterValue}
                onChange={(e) => setConverterValue(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                }`}
                placeholder="0"
              />
            </div>
            
            {converterResult !== null && (
              <div className={`p-4 rounded-lg border transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(199,125,255,0.15)] border-[#C77DFF]/40'
                  : 'bg-[#E35B8F]/10 border-[#E35B8F]/40'
              }`}>
                <div className={`text-2xl font-black font-mono transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>
                  {calculator.formatNumber(converterResult)} {units[converterToUnit]?.symbol}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`h-full flex flex-col transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
    }`}>
      {/* Header - Minimalist tabs */}
      <div className={`p-4 border-b transition-colors duration-500 ${
        isNightMode
          ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/20'
          : 'bg-[rgba(255,240,245,0.4)] border-[#F8C8DC]/30'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className={`font-marcellus text-lg md:text-xl font-black tracking-wider uppercase transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>
            Calculadora Académica
          </h1>
        </div>
        
        {/* Minimalist tabs */}
        <div className="flex gap-1">
          {(['calculator', 'grades', 'converter'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-t-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] text-[#C77DFF] border-t border-x border-[#A68A56]/40'
                    : 'bg-[rgba(255,240,245,0.8)] text-[#E35B8F] border-t border-x border-[#D4AF37]/40'
                  : isNightMode
                    ? 'bg-[rgba(48,43,79,0.3)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.5)]'
                    : 'bg-white/30 text-[#8B5E75] hover:bg-white/50'
              }`}
            >
              {tab === 'calculator' ? 'Calculadora' : tab === 'grades' ? 'Promedios' : 'Conversor'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full p-4 md:p-6 overflow-y-auto">
          {activeTab === 'calculator' && renderCalculatorTab()}
          {activeTab === 'grades' && renderGradesTab()}
          {activeTab === 'converter' && renderConverterTab()}
        </div>
        
        {/* History Drawer - Sidebar from right */}
        {showHistory && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[190] bg-black/20 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            />
            
            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full md:w-96 z-[200] shadow-2xl transition-transform duration-300 ${
              isNightMode
                ? 'bg-[rgba(26,26,46,0.98)] backdrop-blur-[20px] border-l border-[#A68A56]/30'
                : 'bg-[rgba(255,240,245,0.98)] backdrop-blur-[20px] border-l border-[#F8C8DC]/50'
            }`}>
              <div className={`p-4 border-b sticky top-0 backdrop-blur-[20px] ${
                isNightMode ? 'border-[#A68A56]/30' : 'border-[#F8C8DC]/50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-marcellus text-base font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  }`}>
                    Historial
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={calculator.handleClearHistory}
                      className={`px-2 py-1 rounded text-[10px] font-semibold uppercase transition-colors ${
                        isNightMode
                          ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] border border-[#A68A56]/30 hover:bg-[rgba(48,43,79,0.7)]'
                          : 'bg-white/40 text-[#8B5E75] border border-[#F8C8DC]/50 hover:bg-white/60'
                      }`}
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowHistory(false)}
                      className={`p-1 rounded transition-colors ${
                        isNightMode
                          ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.7)]'
                          : 'bg-white/40 text-[#8B5E75] hover:bg-white/60'
                      }`}
                    >
                      {getIcon('x', 'w-3.5 h-3.5')}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-80px)] p-4">
                {calculator.history.length === 0 ? (
                  <div className={`text-center py-8 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    <p className="text-sm">No hay historial</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {calculator.history.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                          isNightMode
                            ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30 hover:border-[#C77DFF]/50'
                            : 'bg-white/50 border-[#F8C8DC]/50 hover:border-[#E35B8F]/50'
                        }`}
                        onClick={() => calculator.handleLoadFromHistory(item)}
                      >
                        <div className={`text-[10px] font-mono mb-1 transition-colors duration-500 ${
                          isNightMode ? 'text-[#7A748E]/70' : 'text-[#8B5E75]/60'
                        }`}>
                          {item.expression}
                        </div>
                        <div className={`text-base font-light font-sans transition-colors duration-500 ${
                          isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                        }`}>
                          = {calculator.formatNumber(item.result)}
                        </div>
                        {(item.note || calculator.notes[item.id]) && (
                          <div className={`text-[10px] mt-1.5 italic transition-colors duration-500 ${
                            isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                          }`}>
                            📝 {item.note || calculator.notes[item.id]}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNote(item);
                          }}
                          className={`mt-2 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            isNightMode
                              ? 'bg-[rgba(48,43,79,0.5)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.7)]'
                              : 'bg-white/40 text-[#8B5E75] hover:bg-white/60'
                          }`}
                        >
                          {item.note || calculator.notes[item.id] ? 'Editar nota' : 'Agregar nota'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Note modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 shadow-2xl max-w-md w-full backdrop-blur-[15px] border transition-colors duration-500 ${
            isNightMode
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40'
              : 'bg-[rgba(255,240,245,0.95)] border-[#D4AF37]/30'
          }`}>
            <h3 className={`font-marcellus text-lg font-black mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Agregar Nota
            </h3>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Ej: Cuota alquiler"
              className={`w-full px-4 py-3 rounded-lg border mb-4 transition-colors ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]'
                  : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveNote();
                } else if (e.key === 'Escape') {
                  setShowNoteModal(null);
                  setNoteInput('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNoteModal(null);
                  setNoteInput('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]'
                    : 'bg-white/60 text-[#8B5E75] border border-[#F8C8DC] hover:bg-white/80'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isNightMode
                    ? 'bg-[#C77DFF]/80 text-white hover:bg-[#C77DFF]'
                    : 'bg-[#E35B8F]/80 text-white hover:bg-[#E35B8F]'
                }`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorModule;
