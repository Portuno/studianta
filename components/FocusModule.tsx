
import React, { useState, useEffect, useRef } from 'react';
import { Subject, NavView, CustomCalendarEvent } from '../types';
import { getIcon, COLORS } from '../constants';
import { saveFocusSession } from '../utils/focusTracker';

interface FocusModuleProps {
  subjects: Subject[];
  onUpdateSubject: (subject: Subject) => void;
  onAddCalendarEvent?: (event: Omit<CustomCalendarEvent, 'id'>) => void;
  isMobile: boolean;
  // Estado global del focus
  focusState?: {
    isActive: boolean;
    isPaused: boolean;
    timeLeft: number;
    totalTime: number;
    selectedSubjectId: string | null;
    sanctuaryMode: boolean;
  };
  onFocusStateChange?: (state: {
    isActive: boolean;
    isPaused: boolean;
    timeLeft: number;
    totalTime: number;
    selectedSubjectId: string | null;
    sanctuaryMode: boolean;
  }) => void;
  isNightMode?: boolean;
}

const FocusModule: React.FC<FocusModuleProps> = ({ 
  subjects, 
  onUpdateSubject, 
  onAddCalendarEvent, 
  isMobile,
  focusState,
  onFocusStateChange,
  isNightMode = false
}) => {
  // Usar estado global si está disponible, sino usar estado local
  const [localIsActive, setLocalIsActive] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(25 * 60);
  const [localTotalTime, setLocalTotalTime] = useState(25 * 60);
  const [localSelectedSubjectId, setLocalSelectedSubjectId] = useState<string | null>(subjects[0]?.id || null);
  const [localIsPaused, setLocalIsPaused] = useState(false);
  const [localSanctuaryMode, setLocalSanctuaryMode] = useState(false);

  // Usar estado global o local
  const isActive = focusState?.isActive ?? localIsActive;
  const timeLeft = focusState?.timeLeft ?? localTimeLeft;
  const totalTime = focusState?.totalTime ?? localTotalTime;
  const selectedSubjectId = focusState?.selectedSubjectId ?? localSelectedSubjectId;
  const isPaused = focusState?.isPaused ?? localIsPaused;
  const sanctuaryMode = focusState?.sanctuaryMode ?? localSanctuaryMode;

  const [showReflection, setShowReflection] = useState(false);
  const [reflectionData, setReflectionData] = useState({
    motivation: 5,
    harvest: '',
    reason: '',
    wasInterrupted: false
  });
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Función para actualizar estado (global o local)
  const updateState = (updates: Partial<{
    isActive: boolean;
    isPaused: boolean;
    timeLeft: number;
    totalTime: number;
    selectedSubjectId: string | null;
    sanctuaryMode: boolean;
  }>) => {
    if (onFocusStateChange && focusState) {
      onFocusStateChange({ ...focusState, ...updates });
    } else {
      if (updates.isActive !== undefined) setLocalIsActive(updates.isActive);
      if (updates.isPaused !== undefined) setLocalIsPaused(updates.isPaused);
      if (updates.timeLeft !== undefined) setLocalTimeLeft(updates.timeLeft);
      if (updates.totalTime !== undefined) setLocalTotalTime(updates.totalTime);
      if (updates.selectedSubjectId !== undefined) setLocalSelectedSubjectId(updates.selectedSubjectId);
      if (updates.sanctuaryMode !== undefined) setLocalSanctuaryMode(updates.sanctuaryMode);
    }
  };

  useEffect(() => {
    // Si estamos usando estado global, NO ejecutar timer aquí (se maneja en App.tsx)
    if (onFocusStateChange && focusState) {
      // El timer global en App.tsx maneja la actualización
      if (timeLeft === 0 && isActive && !isPaused) {
        handleCompleteSession();
      }
      return;
    }

    // Solo ejecutar timer local si NO estamos usando estado global
    if (isActive && !isPaused && timeLeft >= 0) {
      timerRef.current = setInterval(() => {
        setLocalTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime >= 0) {
            return newTime;
          } else {
            handleCompleteSession();
            return 0;
          }
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive && !isPaused) {
      handleCompleteSession();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, timeLeft, focusState, onFocusStateChange]);

  const handleStart = () => {
    // Ya no requiere asignatura - es opcional
    // Auto-iniciar deep focus (sanctuary mode)
    updateState({ 
      isActive: true, 
      isPaused: false,
      sanctuaryMode: true 
    });
  };

  const handlePause = () => {
    updateState({ isPaused: true });
  };

  const handleResume = () => {
    updateState({ isPaused: false });
  };

  const handleStop = () => {
    updateState({ isActive: false, isPaused: false, sanctuaryMode: false });
    setReflectionData(prev => ({ ...prev, wasInterrupted: true }));
    setShowReflection(true);
  };

  const handleCompleteSession = () => {
    updateState({ isActive: false, isPaused: false, sanctuaryMode: false });
    setReflectionData(prev => ({ ...prev, wasInterrupted: false }));
    setShowReflection(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const fillProgress = 100 - progress; // Para el efecto de llenado desde abajo

  const handleCustomTime = () => {
    const minutes = parseInt(customMinutes);
    if (minutes > 0 && minutes <= 240) {
      const newTime = minutes * 60;
      updateState({ timeLeft: newTime, totalTime: newTime });
      setShowCustomTimeModal(false);
      setCustomMinutes('');
    }
  };

  const submitReflection = () => {
    const minutesStudied = Math.floor((totalTime - timeLeft) / 60);

    const subject = subjects.find(s => s.id === selectedSubjectId);
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    // Guardar sesión de enfoque en localStorage
    if (minutesStudied > 0) {
      saveFocusSession({
        date: new Date().toISOString(),
        duration_minutes: minutesStudied,
        subject_id: selectedSubjectId || undefined,
        completed: !reflectionData.wasInterrupted && timeLeft === 0,
      });
    }

    if (reflectionData.harvest && subject) {
      const newNote = {
        id: Math.random().toString(36).substring(7),
        title: `Cosecha de Enfoque - ${new Date().toLocaleDateString()}`,
        content: reflectionData.harvest,
        date: new Date().toISOString()
      };
      onUpdateSubject({
        ...subject,
        notes: [newNote, ...subject.notes]
      });
    }

    // Agregar evento al calendario
    if (onAddCalendarEvent && subject) {
      const calendarEvent: Omit<CustomCalendarEvent, 'id'> = {
        title: `Sesión de Enfoque: ${subject.name}`,
        description: `${minutesStudied} minutos de estudio${reflectionData.wasInterrupted ? ' (Interrumpida)' : ' (Completada)'}${reflectionData.harvest ? ` - ${reflectionData.harvest.substring(0, 50)}${reflectionData.harvest.length > 50 ? '...' : ''}` : ''}`,
        date: currentDate,
        time: currentTime,
        color: reflectionData.wasInterrupted ? COLORS.primary : COLORS.gold,
        priority: reflectionData.wasInterrupted ? 'low' : 'high'
      };
      onAddCalendarEvent(calendarEvent);
    }

    setShowReflection(false);
    updateState({ isActive: false, isPaused: false, sanctuaryMode: false, timeLeft: totalTime });
    setReflectionData({ motivation: 5, harvest: '', reason: '', wasInterrupted: false });
  };


  return (
    <div className="h-full flex flex-col items-center justify-center relative px-4 py-8 md:py-0 transition-all duration-1000 overflow-hidden">
      {/* Partículas de fondo para modo Santuario */}
      {sanctuaryMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#D4AF37]/20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`
              }}
            />
          ))}
        </div>
      )}

      {!sanctuaryMode && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F8C8DC]/20 z-20 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#E35B8F] via-[#D4AF37] to-[#E35B8F] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="max-w-4xl w-full flex flex-col items-center gap-8 lg:gap-12 animate-fade-in transition-all duration-500 overflow-visible">
        <header className="text-center">
          <h1 className={`font-cinzel text-xl md:text-2xl lg:text-3xl tracking-[0.4em] uppercase opacity-60 mb-2 transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>
            El Reloj de Arena
          </h1>
          <div className="h-0.5 w-16 lg:w-24 bg-[#D4AF37] mx-auto opacity-30" />
        </header>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E35B8F]/10 to-[#D4AF37]/10 rounded-full blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className={`w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl relative z-10 overflow-hidden backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
              : 'glass-card border-[#F8C8DC]/40'
          }`}>
            {/* Efecto de llenado con líquido rosado traslúcido */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#E35B8F]/40 via-[#E35B8F]/30 to-[#E35B8F]/20 transition-all duration-1000 ease-out"
              style={{ 
                height: `${fillProgress}%`,
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              }}
            />
            {/* Partículas doradas flotantes */}
            {fillProgress > 10 && Array.from({ length: Math.floor(fillProgress / 10) }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-[#D4AF37]/60 animate-pulse"
                style={{
                  bottom: `${Math.random() * fillProgress}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 6 + 3}px`,
                  height: `${Math.random() * 6 + 3}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`
                }}
              />
            ))}
            <span className={`font-mono text-5xl md:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter relative z-10 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              {formatTime(timeLeft)}
            </span>
            <div className="mt-4 lg:mt-6 flex flex-col items-center gap-3 relative z-10">
              {!isActive ? (
                <button 
                  onClick={handleStart}
                  className="btn-primary w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button 
                      onClick={handleResume}
                      className="btn-primary w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <svg className="w-7 h-7 lg:w-8 lg:h-8 ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  ) : (
                    <button 
                      onClick={handlePause}
                      className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37]/10 transition-colors shadow-lg"
                    >
                      {getIcon('pause', 'w-4 h-4 lg:w-5 lg:h-5')}
                    </button>
                  )}
                  <button 
                    onClick={handleStop}
                    className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#E35B8F] text-[#E35B8F] flex items-center justify-center hover:bg-[#E35B8F]/10 transition-colors shadow-lg"
                  >
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-current rounded-sm" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl lg:max-w-3xl">
          <div className={`p-6 lg:p-8 rounded-[2.5rem] shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/30' 
              : 'glass-card border-[#F8C8DC]/30'
          }`}>
            <p className={`text-[10px] lg:text-[11px] uppercase font-black tracking-widest mb-5 border-b pb-2 transition-colors duration-500 ${
              isNightMode 
                ? 'text-[#7A748E] border-[#A68A56]/30' 
                : 'text-[#8B5E75] border-[#F8C8DC]/30'
            }`}>Vínculo Académico</p>
            <div className="space-y-5">
              <select 
                disabled={isActive}
                value={selectedSubjectId || ''}
                onChange={(e) => updateState({ selectedSubjectId: e.target.value || null })}
                className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3.5 text-base font-garamond focus:outline-none focus:border-[#E35B8F] disabled:opacity-50 appearance-none shadow-inner"
              >
                <option value="">Sin asignatura (Enfoque General)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex gap-3 flex-wrap">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    disabled={isActive}
                    onClick={() => { 
                      const newTime = m * 60;
                      updateState({ timeLeft: newTime, totalTime: newTime });
                    }}
                    className={`flex-1 min-w-[80px] py-3 rounded-xl font-cinzel text-[10px] lg:text-[11px] border-2 transition-all ${
                      totalTime === m * 60 
                        ? isNightMode
                          ? 'bg-[#C77DFF] text-white border-[#C77DFF] shadow-md shadow-[#C77DFF]/30 scale-[1.03]'
                          : 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-md scale-[1.03]'
                        : isNightMode
                          ? 'text-[#7A748E] border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.6)]'
                          : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60'
                    }`}
                  >
                    {m} MIN
                  </button>
                ))}
                <button
                  disabled={isActive}
                  onClick={() => setShowCustomTimeModal(true)}
                  className={`flex-1 min-w-[80px] py-3 rounded-xl font-cinzel text-[10px] lg:text-[11px] border-2 transition-all disabled:opacity-50 ${
                    isNightMode 
                      ? 'text-[#7A748E] border-[#A68A56] hover:bg-[rgba(199,125,255,0.2)]' 
                      : 'text-[#8B5E75] border-[#D4AF37] hover:bg-[#D4AF37]/10'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modo Santuario - Solo efectos visuales de fondo, sin bloquear interacción */}

      {/* Modal para tiempo personalizado */}
      {showCustomTimeModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/80 backdrop-blur-xl p-4" onClick={() => { setShowCustomTimeModal(false); setCustomMinutes(''); }}>
          <div className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border-2 backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card border-[#D4AF37]/40'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-cinzel text-lg mb-6 text-center font-bold uppercase tracking-widest transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>Tiempo Personalizado</h2>
            <div className="space-y-4">
              <input
                type="number"
                min="1"
                max="240"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Minutos (1-240)"
                className="w-full bg-white/30 border-0 border-b-2 border-[#D4AF37] rounded-none px-4 py-3.5 text-sm outline-none font-bold focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)] transition-all"
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setShowCustomTimeModal(false); setCustomMinutes(''); }}
                className="flex-1 py-3 text-[10px] font-black text-[#8B5E75] uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomTime}
                className="flex-[2] btn-primary py-3.5 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showReflection && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-6" onClick={() => setShowReflection(false)}>
          <div className={`w-full max-w-lg lg:max-w-xl p-8 lg:p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] animate-in zoom-in duration-500 overflow-y-auto max-h-[90vh] no-scrollbar backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_30px_60px_rgba(199,125,255,0.3)]' 
              : 'glass-card'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-cinzel text-2xl lg:text-3xl text-[#4A233E] mb-3 font-black text-center uppercase tracking-widest">
              {reflectionData.wasInterrupted ? "Sesión Interrumpida" : "Sesión Completada"}
            </h2>
            <p className="text-sm lg:text-base text-[#8B5E75] text-center mb-10 font-garamond italic px-6">
              {reflectionData.wasInterrupted ? "Tu sesión fue interrumpida. Reflexiona sobre lo aprendido para no perder el progreso." : "¡Excelente trabajo! Has completado tu sesión de estudio."}
            </p>

            <div className="space-y-10">
              <div className="px-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-[#8B5E75]">Frecuencia Motivacional</label>
                  <span className="text-lg font-cinzel text-[#E35B8F] font-black">{reflectionData.motivation}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={reflectionData.motivation}
                  onChange={(e) => setReflectionData({...reflectionData, motivation: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-[#F8C8DC] rounded-lg appearance-none cursor-pointer accent-[#E35B8F] shadow-inner"
                />
              </div>

              <div className="px-4">
                <label className="block text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-[#8B5E75] mb-4 px-1">
                  {reflectionData.wasInterrupted ? "Anotaciones Clave para Recordar" : "¿Qué Hemos Aprendido Hoy?"}
                </label>
                <textarea 
                  value={reflectionData.harvest}
                  onChange={(e) => setReflectionData({...reflectionData, harvest: e.target.value})}
                  placeholder={reflectionData.wasInterrupted ? "Anotaciones clave para recordar..." : "¿Qué hemos aprendido hoy?"}
                  className="w-full bg-white/80 border-2 border-[#F8C8DC] rounded-[2rem] p-6 text-base lg:text-lg font-garamond h-40 focus:outline-none focus:border-[#D4AF37] transition-all resize-none shadow-inner"
                />
              </div>

              {reflectionData.wasInterrupted && (
                <div className="px-4 animate-in slide-in-from-top-2">
                  <label className="block text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-[#E35B8F] mb-4 px-1">Motivo de la Interrupción</label>
                  <input 
                    type="text"
                    value={reflectionData.reason}
                    onChange={(e) => setReflectionData({...reflectionData, reason: e.target.value})}
                    placeholder="¿Qué te distrajo?"
                    className="w-full bg-[#E35B8F]/5 border-2 border-[#E35B8F]/20 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#E35B8F]"
                  />
                </div>
              )}

              <button 
                onClick={submitReflection}
                className="btn-primary w-full py-5 rounded-[2rem] font-cinzel text-xs lg:text-sm tracking-[0.3em] font-black uppercase shadow-2xl hover:brightness-105"
              >
                Finalizar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusModule;
