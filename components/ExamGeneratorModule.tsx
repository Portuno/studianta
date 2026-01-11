import React, { useState, useEffect, useRef } from 'react';
import { Subject, ExamType, ExamMode, ExamDifficulty, ExamConfig, Exam } from '../types';
import { getIcon } from '../constants';
import { useExamGenerator } from '../hooks/useExamGenerator';
import { exportExamToPDF } from '../utils/examPdfExporter';
import { examService } from '../services/examService';
import { supabase } from '../services/supabaseService';
import {
  calculateMasteryLevel,
  formatTimeSpent,
  getMasteryColor,
  getMasteryText,
  getDifficultyColor,
  getDifficultyText,
  isAnswerCorrect,
  formatScore,
  getExamTypeText,
} from '../utils/examUtils';

interface ExamGeneratorModuleProps {
  subjects: Subject[];
  isMobile: boolean;
  isNightMode?: boolean;
}

type View = 'config' | 'exam' | 'results' | 'flashcards' | 'history';

const ExamGeneratorModule: React.FC<ExamGeneratorModuleProps> = ({
  subjects,
  isMobile,
  isNightMode = false,
}) => {
  const [view, setView] = useState<View>('config');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    subjectId: '',
    materialIds: [],
    examType: 'multiple-choice',
    questionCount: 10,
    difficulty: 'mixed',
    mode: 'guided',
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [examHistory, setExamHistory] = useState<Exam[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const {
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
  } = useExamGenerator();

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Inicializar timer cuando comienza el examen
  useEffect(() => {
    if (view === 'exam' && currentExam && timerIntervalRef.current === null) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [view, currentExam]);

  // Actualizar tiempo de inicio de pregunta
  useEffect(() => {
    if (view === 'exam' && questions.length > 0) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, view, questions.length]);

  // Cargar historial cuando se abre la vista de historial
  useEffect(() => {
    const loadHistory = async () => {
      if (view === 'history') {
        setLoadingHistory(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const history = await examService.getExamHistory(user.id);
            setExamHistory(history);
          }
        } catch (error: any) {
          console.error('Error loading exam history:', error);
        } finally {
          setLoadingHistory(false);
        }
      }
    };
    loadHistory();
  }, [view]);

  // Resetear estado de flashcards cuando cambia la vista o se cargan nuevas flashcards
  useEffect(() => {
    if (view === 'flashcards') {
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
    }
  }, [view, flashcards.length]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedMaterialIds([]);
    setExamConfig(prev => ({ ...prev, subjectId, materialIds: [] }));
  };

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterialIds(prev => {
      const newIds = prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId];
      setExamConfig(prev => ({ ...prev, materialIds: newIds }));
      return newIds;
    });
  };

  const handleGenerateExam = async () => {
    if (!selectedSubject) {
      alert('Por favor, selecciona una asignatura');
      return;
    }

    if (selectedMaterialIds.length === 0) {
      alert('Por favor, selecciona al menos un material');
      return;
    }

    const config: ExamConfig = {
      ...examConfig,
      subjectId: selectedSubjectId,
      materialIds: selectedMaterialIds,
    };

    await generateExam(config, selectedSubject);
    if (!error) {
      setView('exam');
      setCurrentQuestionIndex(0);
      setTimer(0);
    }
  };

  const handleAnswerSubmit = (answer: string) => {
    if (!questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    submitResponse(question.id, answer, timeSpent);

    // En modo guiado, mostrar feedback inmediato
    if (examConfig.mode === 'guided') {
      // La respuesta ya se guardó, solo avanzar
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
        }, 2000); // Esperar 2 segundos para ver feedback
      }
    } else {
      // Modo real: avanzar inmediatamente
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handleFinishExam = async () => {
    // Guardar respuesta de la pregunta actual si existe
    if (questions[currentQuestionIndex]) {
      const question = questions[currentQuestionIndex];
      const existingResponse = responses.find(r => r.question_id === question.id);
      if (!existingResponse) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        submitResponse(question.id, '', timeSpent);
      }
    }

    await finishExam();
    if (!error) {
      setView('results');
    }
  };

  const handleExportPDF = async () => {
    if (!currentExam || !questions.length) return;

    try {
      await exportExamToPDF(currentExam, questions, responses);
    } catch (error: any) {
      alert(`Error al exportar PDF: ${error.message}`);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = currentQuestion
    ? responses.find(r => r.question_id === currentQuestion.id)
    : null;

  // Vista de configuración
  if (view === 'config') {
    return (
      <div className={`h-full flex flex-col pb-10 max-w-7xl mx-auto w-full transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
      }`}>
        <div className="mb-8">
          <h1 className={`font-cinzel text-3xl md:text-5xl font-bold transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>Generador de Exámenes</h1>
          <p className={`text-sm md:text-base font-inter transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>Crea tests personalizados a partir de tus apuntes mediante IA</p>
        </div>

        {/* Botón Ver Historial */}
        <div className="mb-6">
          <button
            onClick={() => setView('history')}
            className={`w-full py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
                : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
            }`}
          >
            Ver Exámenes Generados
          </button>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-xl border-2 whitespace-pre-line ${
            isNightMode 
              ? 'bg-red-900/20 border-red-500/50 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="font-cinzel font-bold mb-2">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        <div className={`space-y-6 ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
          {/* Selector de Asignatura */}
          <div>
            <label className={`block text-sm font-bold mb-2 font-cinzel transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Asignatura</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className={`w-full p-3 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD]'
                  : 'bg-white/40 border-[#F8C8DC] text-[#2D1A26]'
              }`}
            >
              <option value="">Selecciona una asignatura</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Materiales */}
          {selectedSubject && (
            <div>
              <label className={`block text-sm font-bold mb-2 font-cinzel transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>Materiales (selecciona uno o más)</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedSubject.materials.filter(m => 
                  m.category === 'contenido' && 
                  (m.type === 'PDF' || m.type === 'Apunte' || m.fileUrl || m.content)
                ).map(material => (
                  <label
                    key={material.id}
                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedMaterialIds.includes(material.id)
                        ? isNightMode
                          ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]'
                          : 'bg-[#FFF0F5] border-[#E35B8F]'
                        : isNightMode
                          ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 hover:border-[#A68A56]'
                          : 'bg-white/40 border-[#F8C8DC] hover:border-[#E35B8F]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterialIds.includes(material.id)}
                      onChange={() => handleMaterialToggle(material.id)}
                      className="mr-3"
                    />
                    <span className="flex-1">{material.name}</span>
                    <span className={`text-xs ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                      {material.type}
                    </span>
                  </label>
                ))}
              </div>
              {selectedSubject.materials.filter(m => 
                m.category === 'contenido' && 
                (m.type === 'PDF' || m.type === 'Apunte' || m.fileUrl || m.content)
              ).length === 0 && (
                <p className={`text-sm mt-2 ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                  No hay materiales de contenido disponibles. Sube materiales PDF en la sección de Asignaturas.
                </p>
              )}
            </div>
          )}

          {/* Tipo de Examen */}
          <div>
            <label className={`block text-sm font-bold mb-2 font-cinzel transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Tipo de Examen</label>
            <select
              value={examConfig.examType}
              onChange={(e) => setExamConfig(prev => ({ ...prev, examType: e.target.value as ExamType }))}
              className={`w-full p-3 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD]'
                  : 'bg-white/40 border-[#F8C8DC] text-[#2D1A26]'
              }`}
            >
              <option value="multiple-choice">Opción Múltiple</option>
              <option value="true-false">Verdadero/Falso</option>
              <option value="open-ended">Preguntas Abiertas</option>
              <option value="cloze">Completar Párrafo</option>
              <option value="case-study">Casos Prácticos</option>
            </select>
          </div>

          {/* Cantidad de Preguntas */}
          <div>
            <label className={`block text-sm font-bold mb-2 font-cinzel transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Cantidad de Preguntas</label>
            <input
              type="number"
              min="5"
              max="50"
              value={examConfig.questionCount}
              onChange={(e) => setExamConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 10 }))}
              className={`w-full p-3 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD]'
                  : 'bg-white/40 border-[#F8C8DC] text-[#2D1A26]'
              }`}
            />
          </div>

          {/* Dificultad */}
          <div>
            <label className={`block text-sm font-bold mb-2 font-cinzel transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Dificultad</label>
            <select
              value={examConfig.difficulty}
              onChange={(e) => setExamConfig(prev => ({ ...prev, difficulty: e.target.value as ExamDifficulty }))}
              className={`w-full p-3 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD]'
                  : 'bg-white/40 border-[#F8C8DC] text-[#2D1A26]'
              }`}
            >
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
              <option value="mixed">Mixta</option>
            </select>
          </div>

          {/* Modo */}
          <div>
            <label className={`block text-sm font-bold mb-2 font-cinzel transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Modo</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExamConfig(prev => ({ ...prev, mode: 'real' }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  examConfig.mode === 'real'
                    ? isNightMode
                      ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]'
                      : 'bg-[#FFF0F5] border-[#E35B8F]'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                      : 'bg-white/40 border-[#F8C8DC]'
                }`}
              >
                <div className="font-cinzel font-bold mb-1">Examen Real</div>
                <div className={`text-xs ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                  Sin feedback inmediato
                </div>
              </button>
              <button
                onClick={() => setExamConfig(prev => ({ ...prev, mode: 'guided' }))}
                className={`p-4 rounded-xl border-2 transition-all ${
                  examConfig.mode === 'guided'
                    ? isNightMode
                      ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]'
                      : 'bg-[#FFF0F5] border-[#E35B8F]'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                      : 'bg-white/40 border-[#F8C8DC]'
                }`}
              >
                <div className="font-cinzel font-bold mb-1">Estudio Guiado</div>
                <div className={`text-xs ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                  Con feedback instantáneo
                </div>
              </button>
            </div>
          </div>

          {/* Botón Generar */}
          <button
            onClick={handleGenerateExam}
            disabled={isLoading || !selectedSubjectId || selectedMaterialIds.length === 0}
            className={`w-full py-4 rounded-xl font-cinzel text-lg font-bold transition-all ${
              isLoading || !selectedSubjectId || selectedMaterialIds.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            } ${
              isNightMode
                ? 'bg-[#A68A56] text-[#1A1A2E]'
                : 'bg-[#E35B8F] text-white'
            }`}
          >
            {isLoading ? 'Generando Examen...' : 'Generar Examen'}
          </button>
        </div>
      </div>
    );
  }

  // Vista de examen
  if (view === 'exam' && currentExam && currentQuestion) {
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className={`h-full flex flex-col pb-10 max-w-4xl mx-auto w-full transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
      }`}>
        {/* Header con timer y progreso */}
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
            : 'bg-white/40 border-[#F8C8DC]'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <div className={`font-cinzel font-bold ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </div>
            {examConfig.mode === 'real' && (
              <div className={`font-cinzel font-bold ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
                {formatTimeSpent(timer)}
              </div>
            )}
          </div>
          <div className={`w-full h-2 rounded-full ${
            isNightMode ? 'bg-[rgba(166,138,86,0.2)]' : 'bg-[#F8C8DC]'
          }`}>
            <div
              className={`h-full rounded-full transition-all ${
                isNightMode ? 'bg-[#A68A56]' : 'bg-[#E35B8F]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div className={`mb-6 p-6 rounded-xl border-2 ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
            : 'bg-white/40 border-[#F8C8DC]'
        }`}>
          <div className={`font-cinzel text-lg font-bold mb-4 ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
            {currentQuestion.question_text}
          </div>

          {/* Opciones (para multiple-choice y true-false) */}
          {currentQuestion.options && currentQuestion.options.length > 0 && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLabel = ['A', 'B', 'C', 'D', 'E', 'F'][index] || String(index);
                const isSelected = currentResponse?.user_answer === String(index);
                const correctAnswerIndex = parseInt(currentQuestion.correct_answer);
                const isCorrectAnswer = index === correctAnswerIndex;
                const showFeedback = examConfig.mode === 'guided' && currentResponse;
                
                // Determinar el estado visual de la opción
                let optionState: 'correct' | 'incorrect' | 'neutral' = 'neutral';
                if (showFeedback) {
                  if (isCorrectAnswer) {
                    optionState = 'correct';
                  } else if (isSelected && !currentResponse.is_correct) {
                    optionState = 'incorrect';
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => !currentResponse && handleAnswerSubmit(String(index))}
                    disabled={!!currentResponse}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      optionState === 'correct'
                        ? isNightMode
                          ? 'bg-green-900/30 border-green-500'
                          : 'bg-green-50 border-green-500'
                        : optionState === 'incorrect'
                          ? isNightMode
                            ? 'bg-red-900/30 border-red-500'
                            : 'bg-red-50 border-red-500'
                          : isSelected
                            ? isNightMode
                              ? 'bg-[rgba(199,125,255,0.2)] border-[#C77DFF]'
                              : 'bg-[#FFF0F5] border-[#E35B8F]'
                            : isNightMode
                              ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 hover:border-[#A68A56]'
                              : 'bg-white/40 border-[#F8C8DC] hover:border-[#E35B8F]'
                    } ${currentResponse ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-cinzel font-bold ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
                        {optionLabel}) {option}
                      </span>
                      {showFeedback && (
                        <span className={`text-xl ${
                          optionState === 'correct' 
                            ? 'text-green-500' 
                            : optionState === 'incorrect'
                              ? 'text-red-500'
                              : ''
                        }`}>
                          {optionState === 'correct' ? '✓' : optionState === 'incorrect' ? '✗' : ''}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input para preguntas abiertas */}
          {(!currentQuestion.options || currentQuestion.options.length === 0) && (
            <textarea
              value={currentResponse?.user_answer || ''}
              onChange={(e) => {
                if (!currentResponse) {
                  // Guardar respuesta mientras escribe (solo en modo guiado)
                  if (examConfig.mode === 'guided') {
                    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
                    submitResponse(currentQuestion.id, e.target.value, timeSpent);
                  }
                }
              }}
              onBlur={() => {
                if (currentResponse && examConfig.mode === 'guided') {
                  // Verificar respuesta al perder foco
                  const isCorrect = isAnswerCorrect(
                    currentResponse.user_answer,
                    currentQuestion.correct_answer,
                    currentQuestion.question_type
                  );
                  // La respuesta ya se guardó, solo mostrar feedback
                }
              }}
              disabled={!!currentResponse && examConfig.mode === 'real'}
              placeholder="Escribe tu respuesta aquí..."
              className={`w-full p-4 rounded-xl border-2 min-h-[120px] transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD]'
                  : 'bg-white/40 border-[#F8C8DC] text-[#2D1A26]'
              }`}
            />
          )}

          {/* Feedback en modo guiado */}
          {examConfig.mode === 'guided' && currentResponse && (
            <div className={`mt-4 p-4 rounded-xl ${
              currentResponse.is_correct
                ? isNightMode
                  ? 'bg-green-900/20 border-green-500/50'
                  : 'bg-green-50 border-green-200'
                : isNightMode
                  ? 'bg-red-900/20 border-red-500/50'
                  : 'bg-red-50 border-red-200'
            } border-2`}>
              <div className={`font-cinzel font-bold mb-2 ${
                currentResponse.is_correct
                  ? isNightMode ? 'text-green-300' : 'text-green-700'
                  : isNightMode ? 'text-red-300' : 'text-red-700'
              }`}>
                {currentResponse.is_correct ? '✓ Correcto' : '✗ Incorrecto'}
              </div>
              {currentQuestion.explanation && (
                <div className={`text-sm ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                  {currentQuestion.explanation}
                </div>
              )}
              {currentQuestion.source_material && (
                <div className={`text-xs mt-2 italic ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                  Fuente: {currentQuestion.source_material}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
              }
            }}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all ${
              currentQuestionIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
                : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
            }`}
          >
            Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleFinishExam}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              } ${
                isNightMode
                  ? 'bg-[#A68A56] text-[#1A1A2E]'
                  : 'bg-[#E35B8F] text-white'
              }`}
            >
              {isLoading ? 'Finalizando...' : 'Finalizar Examen'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(prev => prev + 1);
                }
              }}
              disabled={!currentResponse && examConfig.mode === 'real'}
              className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all ${
                !currentResponse && examConfig.mode === 'real'
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              } ${
                isNightMode
                  ? 'bg-[#A68A56] text-[#1A1A2E]'
                  : 'bg-[#E35B8F] text-white'
              }`}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista de resultados
  if (view === 'results' && examResults && currentExam) {
    const masteryLevel = calculateMasteryLevel(examResults.score_percentage);
    const masteryColor = getMasteryColor(masteryLevel);

    return (
      <div className={`h-full flex flex-col pb-10 max-w-4xl mx-auto w-full transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
      }`}>
        <div className="mb-8">
          <h1 className={`font-cinzel text-3xl md:text-5xl font-bold transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>Resultados del Examen</h1>
        </div>

        {/* Resumen */}
        <div className={`mb-6 p-6 rounded-xl border-2 ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
            : 'bg-white/40 border-[#F8C8DC]'
        }`}>
          <div className="text-center mb-6">
            <div className={`text-6xl font-cinzel font-bold mb-2`} style={{ color: masteryColor }}>
              {formatScore(examResults.score_percentage)}
            </div>
            <div className={`text-xl font-cinzel font-bold mb-4 ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
              {getMasteryText(masteryLevel)}
            </div>
            <div className={`text-sm ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
              {examResults.correct_answers} de {examResults.total_questions} preguntas correctas
            </div>
            <div className={`text-sm mt-2 ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
              Tiempo: {formatTimeSpent(examResults.time_spent_total)}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className={`w-full h-4 rounded-full ${
            isNightMode ? 'bg-[rgba(166,138,86,0.2)]' : 'bg-[#F8C8DC]'
          }`}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${examResults.score_percentage}%`,
                backgroundColor: masteryColor,
              }}
            />
          </div>
        </div>

        {/* Preguntas fallidas */}
        {flashcards.length > 0 && (
          <div className={`mb-6 p-6 rounded-xl border-2 ${
            isNightMode
              ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
              : 'bg-white/40 border-[#F8C8DC]'
          }`}>
            <h2 className={`font-cinzel text-xl font-bold mb-4 ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
              Preguntas para Revisar ({flashcards.length})
            </h2>
            <button
              onClick={() => setView('flashcards')}
              className={`w-full py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
                isNightMode
                  ? 'bg-[#A68A56] text-[#1A1A2E]'
                  : 'bg-[#E35B8F] text-white'
              }`}
            >
              Ver Flashcards
            </button>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-4">
          <button
            onClick={handleExportPDF}
            className={`flex-1 py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
                : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
            }`}
          >
            Descargar PDF
          </button>
          <button
            onClick={() => {
              resetExam();
              setView('config');
            }}
            className={`flex-1 py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
              isNightMode
                ? 'bg-[#A68A56] text-[#1A1A2E]'
                : 'bg-[#E35B8F] text-white'
            }`}
          >
            Nuevo Examen
          </button>
        </div>
      </div>
    );
  }

  // Vista de historial
  if (view === 'history') {
    return (
      <div className={`h-full flex flex-col pb-10 max-w-7xl mx-auto w-full transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
      }`}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`font-cinzel text-3xl md:text-5xl font-bold transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Exámenes Generados</h1>
            <button
              onClick={() => setView('config')}
              className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
                  : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
              }`}
            >
              Volver
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className={`text-center py-12 ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
            <div className="font-cinzel">Cargando historial...</div>
          </div>
        ) : examHistory.length === 0 ? (
          <div className={`text-center py-12 ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
            <div className="font-cinzel text-xl mb-2">No hay exámenes generados aún</div>
            <div className="text-sm">Genera tu primer examen para verlo aquí</div>
          </div>
        ) : (
          <div className="space-y-4">
            {examHistory.map((exam) => {
              const subject = subjects.find(s => s.id === exam.subject_id);
              const examDate = new Date(exam.created_at);
              const formattedDate = examDate.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={exam.id}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    isNightMode
                      ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                      : 'bg-white/40 border-[#F8C8DC]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`font-cinzel text-xl font-bold mb-2 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                      }`}>
                        {exam.title}
                      </h3>
                      <div className={`space-y-1 text-sm ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`}>
                        <div>
                          <span className="font-semibold">Asignatura:</span> {subject?.name || 'Desconocida'}
                        </div>
                        <div>
                          <span className="font-semibold">Tipo:</span> {getExamTypeText(exam.exam_type)}
                        </div>
                        <div>
                          <span className="font-semibold">Preguntas:</span> {exam.question_count}
                        </div>
                        <div>
                          <span className="font-semibold">Dificultad:</span> {getDifficultyText(exam.difficulty)}
                        </div>
                        <div>
                          <span className="font-semibold">Modo:</span> {exam.mode === 'real' ? 'Examen Real' : 'Estudio Guiado'}
                        </div>
                        <div>
                          <span className="font-semibold">Fecha:</span> {formattedDate}
                        </div>
                        {exam.completed_at && (
                          <div className={`text-xs ${isNightMode ? 'text-green-400' : 'text-green-600'}`}>
                            ✓ Completado
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <button
                        onClick={async () => {
                          try {
                            await loadExam(exam.id);
                            if (exam.completed_at) {
                              // Si está completado, mostrar resultados
                              setView('results');
                            } else {
                              // Si no está completado, continuar el examen
                              setView('exam');
                              setCurrentQuestionIndex(0);
                              setTimer(0);
                            }
                          } catch (error: any) {
                            alert(`Error al cargar el examen: ${error.message}`);
                          }
                        }}
                        className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
                          isNightMode
                            ? 'bg-[#A68A56] text-[#1A1A2E]'
                            : 'bg-[#E35B8F] text-white'
                        }`}
                      >
                        {exam.completed_at ? 'Ver Resultados' : 'Continuar'}
                      </button>
                      {exam.completed_at && (
                        <button
                          onClick={async () => {
                            try {
                              await loadExam(exam.id);
                              const { questions: examQuestions } = await examService.getExamWithQuestions(exam.id);
                              const examResponses = await examService.getExamResponses(exam.id);
                              await exportExamToPDF(exam, examQuestions, examResponses);
                            } catch (error: any) {
                              alert(`Error al exportar PDF: ${error.message}`);
                            }
                          }}
                          className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
                            isNightMode
                              ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
                              : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
                          }`}
                        >
                          Descargar PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Vista de flashcards
  if (view === 'flashcards' && flashcards.length > 0) {
    const currentFlashcard = flashcards[currentFlashcardIndex];

    return (
      <div className={`h-full flex flex-col pb-10 max-w-4xl mx-auto w-full transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
      }`}>
        <div className="mb-8">
          <h1 className={`font-cinzel text-3xl md:text-5xl font-bold transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>Flashcards de Revisión</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full max-w-2xl h-96 p-8 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                : 'bg-white/40 border-[#F8C8DC]'
            }`}
          >
            <div className={`h-full flex items-center justify-center text-center ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>
              <div className="font-cinzel text-xl">
                {isFlipped ? currentFlashcard.back_text : currentFlashcard.front_text}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => {
              if (currentFlashcardIndex > 0) {
                setCurrentFlashcardIndex(prev => prev - 1);
                setIsFlipped(false);
              }
            }}
            disabled={currentFlashcardIndex === 0}
            className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all ${
              currentFlashcardIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            } ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
                : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
            }`}
          >
            Anterior
          </button>

          <div className={`font-cinzel font-bold ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'}`}>
            {currentFlashcardIndex + 1} de {flashcards.length}
          </div>

          <button
            onClick={() => {
              if (currentFlashcardIndex < flashcards.length - 1) {
                setCurrentFlashcardIndex(prev => prev + 1);
                setIsFlipped(false);
              }
            }}
            disabled={currentFlashcardIndex === flashcards.length - 1}
            className={`px-6 py-3 rounded-xl font-cinzel font-bold transition-all ${
              currentFlashcardIndex === flashcards.length - 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            } ${
              isNightMode
                ? 'bg-[#A68A56] text-[#1A1A2E]'
                : 'bg-[#E35B8F] text-white'
            }`}
          >
            Siguiente
          </button>
        </div>

        <button
          onClick={() => setView('results')}
          className={`mt-6 w-full py-3 rounded-xl font-cinzel font-bold transition-all hover:scale-105 active:scale-95 ${
            isNightMode
              ? 'bg-[rgba(48,43,79,0.6)] text-[#E0E1DD] border-2 border-[#A68A56]/40'
              : 'bg-white/40 text-[#2D1A26] border-2 border-[#F8C8DC]'
          }`}
        >
          Volver a Resultados
        </button>
      </div>
    );
  }

  return null;
};

export default ExamGeneratorModule;
