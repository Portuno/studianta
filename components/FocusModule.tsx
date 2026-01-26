
import React, { useState, useEffect, useRef } from 'react';
import { Subject, NavView, CustomCalendarEvent } from '../types';
import { getIcon, COLORS } from '../constants';
import { saveFocusSession } from '../utils/focusTracker';
import { supabaseService } from '../services/supabaseService';

interface FocusModuleProps {
  subjects: Subject[];
  onUpdateSubject: (subject: Subject) => void;
  onAddCalendarEvent?: (event: Omit<CustomCalendarEvent, 'id'>) => void;
  isMobile: boolean;
  userId?: string;
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
  userId,
  focusState,
  onFocusStateChange,
  isNightMode = false
}) => {
  // Usar estado global si está disponible, sino usar estado local
  const [localIsActive, setLocalIsActive] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(25 * 60);
  const [localTotalTime, setLocalTotalTime] = useState(25 * 60);
  const [localSelectedSubjectId, setLocalSelectedSubjectId] = useState<string | null>(null);
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
  const [showFocusAnnotations, setShowFocusAnnotations] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionHandledRef = useRef(false);

  // Cargar preferencia de mostrar anotaciones de enfoque
  useEffect(() => {
    const loadFocusPreference = async () => {
      if (userId) {
        try {
          const profile = await supabaseService.getProfile(userId);
          if (profile) {
            setShowFocusAnnotations(profile.show_focus_annotations ?? false);
          }
        } catch (error) {
          console.error('Error loading focus preference:', error);
        }
      }
    };
    loadFocusPreference();
  }, [userId]);

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

  // Detectar cuando el timer se completa (llega a 0)
  useEffect(() => {
    // Si estamos usando estado global, NO ejecutar timer aquí (se maneja en App.tsx)
    if (onFocusStateChange && focusState) {
      // El timer global en App.tsx maneja la actualización usando timestamps
      // Detectar cuando el timer llega a 0 y se desactiva (completado)
      if (timeLeft === 0 && !isActive && !isPaused && focusState.timeLeft === 0) {
        // Pequeño delay para asegurar que el estado se actualizó completamente
        const timeoutId = setTimeout(() => {
          if (!showReflection) {
            handleCompleteSession();
          }
        }, 200);
        return () => clearTimeout(timeoutId);
      }
      // También detectar si está activo pero llegó a 0 (caso edge)
      if (timeLeft === 0 && isActive && !isPaused) {
        const timeoutId = setTimeout(() => {
          if (!showReflection) {
            handleCompleteSession();
          }
        }, 200);
        return () => clearTimeout(timeoutId);
      }
      return;
    }

    // Solo ejecutar timer local si NO estamos usando estado global (fallback)
    // Este timer local también debería usar timestamps para consistencia, pero por ahora
    // mantenemos la lógica simple para el modo local
    if (isActive && !isPaused && timeLeft > 0) {
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
    // Asegurar que se incluya totalTime al iniciar para que el sistema de timestamps funcione correctamente
    completionHandledRef.current = false; // Resetear el flag cuando se inicia
    updateState({ 
      isActive: true, 
      isPaused: false,
      sanctuaryMode: true,
      totalTime: totalTime, // Incluir totalTime para que el sistema de timestamps lo use
      timeLeft: totalTime // Inicializar timeLeft con totalTime
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
    if (completionHandledRef.current) return; // Evitar múltiples llamadas
    completionHandledRef.current = true;
    updateState({ isActive: false, isPaused: false, sanctuaryMode: false });
    setReflectionData(prev => ({ ...prev, wasInterrupted: false }));
    setShowReflection(true);
  };
  
  // Detectar específicamente cuando el timer se completa (timeLeft === 0 y no está activo)
  useEffect(() => {
    if (onFocusStateChange && focusState) {
      // Detectar cuando el timer se completa: timeLeft es 0, no está activo, y no está pausado
      if (timeLeft === 0 && !isActive && !isPaused && !completionHandledRef.current) {
        const timeoutId = setTimeout(() => {
          handleCompleteSession();
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [timeLeft, isActive, isPaused, focusState, onFocusStateChange]);

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

    // Agregar evento al calendario solo si la preferencia está activada
    if (onAddCalendarEvent && subject && showFocusAnnotations) {
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

      <div className="max-w-7xl w-full flex flex-col items-center gap-6 lg:gap-8 animate-fade-in transition-all duration-500 overflow-visible px-4">
        {/* Título visible y destacado */}
        <header className="text-center w-full mb-4">
          <h1 className={`font-cinzel text-3xl md:text-4xl lg:text-5xl tracking-[0.3em] uppercase font-bold mb-3 transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>
            El Reloj de Arena
          </h1>
          <div className="h-1 w-24 lg:w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto opacity-60" />
        </header>

        {/* Layout: Reloj de arena a la izquierda, Temporizador a la derecha */}
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12 mb-6">
          {/* Columna izquierda: Reloj de Arena */}
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <div className="relative w-56 h-72 md:w-72 md:h-96 lg:w-80 lg:h-[26rem] flex items-center justify-center">
              {/* Sombra del reloj */}
              <div className="absolute bottom-0 w-3/4 h-6 bg-black/25 blur-2xl rounded-full" />
              
              {/* Contenedor del reloj de arena - Estética Premium con Curvas Orgánicas */}
              <svg 
                viewBox="0 0 100 150" 
                className="w-full h-full relative z-10"
                preserveAspectRatio="xMidYMid meet"
              >
              {/* Defs para efectos premium */}
              <defs>
                {/* Gradiente neón para el marco (rosa a dorado a rosa) */}
                <linearGradient id={`neonFrameGrad-${selectedSubjectId || 'default'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isNightMode ? '#a855f7' : '#ff6ec4'} stopOpacity="1" />
                  <stop offset="50%" stopColor={isNightMode ? '#d8b4fe' : '#ffd700'} stopOpacity="1" />
                  <stop offset="100%" stopColor={isNightMode ? '#a855f7' : '#ff6ec4'} stopOpacity="1" />
                </linearGradient>
                
                {/* Gradiente radial para la arena (centro claro, bordes oscuros) */}
                <radialGradient id={`sandGrad-${selectedSubjectId || 'default'}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor={isNightMode ? '#fff5e6' : '#fff5e6'} stopOpacity="1" />
                  <stop offset="80%" stopColor={isNightMode ? '#d8b4fe' : '#fca5a5'} stopOpacity="1" />
                  <stop offset="100%" stopColor={isNightMode ? '#a855f7' : '#dba3a3'} stopOpacity="1" />
                </radialGradient>
                
                {/* Filtro de brillo neón externo (con feColorMatrix para intensidad) */}
                <filter id={`outerGlow-${selectedSubjectId || 'default'}`} height="300%" width="300%" x="-75%" y="-75%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feColorMatrix 
                    in="blur" 
                    type="matrix" 
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
                    result="goo" 
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="over" />
                </filter>
                
              </defs>
              
              {/* Cuerpo del vidrio (fondo translúcido) */}
              <path 
                d={`M30,10 
                    C15,10 15,65 48,75 
                    C15,85 15,140 30,140 
                    H70 
                    C85,140 85,85 52,75 
                    C85,65 85,10 70,10 
                    Z`}
                fill={isNightMode ? 'rgba(50, 20, 40, 0.2)' : 'rgba(50, 20, 40, 0.2)'} 
                stroke="none" 
              />
              
              {/* Arena Superior - Dinámica según progreso */}
              {progress < 100 && (() => {
                const progressDecimal = progress / 100;
                const sandHeight = 55 * (1 - progressDecimal);
                const topY = 70 - sandHeight;
                const widthAtTop = 20 * (1 - progressDecimal * 0.4);
                const widthAtBottom = 20;
                
                return (
                  <path 
                    d={`M${32 + (widthAtTop/2)},${topY} 
                        C${20 + (widthAtTop/2)},${topY} ${20},${topY + 10} ${32},${70} 
                        L${68},${70} 
                        C${80},${topY + 10} ${80 - (widthAtTop/2)},${topY} ${68 - (widthAtTop/2)},${topY} 
                        Z`}
                    fill={`url(#sandGrad-${selectedSubjectId || 'default'})`} 
                    opacity="0.9"
                    style={{
                      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                );
              })()}
              
              {/* Arena Inferior - Dinámica según progreso */}
              {progress > 0 && (() => {
                const progressDecimal = progress / 100;
                const sandHeight = 55 * progressDecimal;
                const bottomY = 135 - sandHeight;
                const widthAtTop = 20;
                const widthAtBottom = 20 * (0.6 + progressDecimal * 0.4);
                
                // Forma de montículo
                const moundOffset = Math.min(12, 10 * progressDecimal);
                
                return (
                  <path 
                    d={`M${32},${135} 
                        L${68},${135} 
                        C${80},${135 - moundOffset} ${80},${bottomY + 5} ${68 - (widthAtBottom/2)},${bottomY} 
                        C${50},${bottomY - 2} ${50},${bottomY - 2} ${32 + (widthAtBottom/2)},${bottomY} 
                        C${20},${bottomY + 5} ${20},${135 - moundOffset} ${32},${135} 
                        Z`}
                    fill={`url(#sandGrad-${selectedSubjectId || 'default'})`} 
                    opacity="0.9"
                    style={{
                      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                );
              })()}
              
              {/* Hilo de arena (solo cuando está activo) */}
              {isActive && !isPaused && progress > 0 && progress < 100 && (
                <line 
                  x1="50" 
                  y1="70" 
                  x2="50" 
                  y2="135" 
                  stroke={`url(#sandGrad-${selectedSubjectId || 'default'})`} 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  opacity="0.8"
                  style={{
                    animation: 'sandFlow 1.5s linear infinite, sandFlicker 2s ease-in-out infinite',
                  }}
                />
              )}
              
              {/* Reflejos de luz en los bordes (glassmorphism) */}
              <path 
                d="M32,15 C20,20 20,60 45,68" 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
                opacity="0.4" 
              />
              <path 
                d="M28,135 C20,130 20,90 45,82" 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
                opacity="0.3" 
              />
              
              {/* Marco neón del reloj (con filtro de brillo) */}
              <path 
                d={`M30,10 
                    C15,10 15,65 48,75 
                    C15,85 15,140 30,140 
                    H70 
                    C85,140 85,85 52,75 
                    C85,65 85,10 70,10 
                    Z`}
                fill="none" 
                stroke={`url(#neonFrameGrad-${selectedSubjectId || 'default'})`} 
                strokeWidth="2.5" 
                filter={`url(#outerGlow-${selectedSubjectId || 'default'})`} 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              
              {/* Puntos de luz decorativos */}
              <circle 
                cx="30" 
                cy="20" 
                r="1.5" 
                fill="white" 
                opacity="0.8" 
                filter={`url(#outerGlow-${selectedSubjectId || 'default'})`}
              />
              <circle 
                cx="70" 
                cy="130" 
                r="1" 
                fill="white" 
                opacity="0.6" 
                filter={`url(#outerGlow-${selectedSubjectId || 'default'})`}
              />
              
              {/* Línea de separación cuando está pausado */}
              {isPaused && (
                <line
                  x1="47"
                  y1="70"
                  x2="53"
                  y2="135"
                  stroke={isNightMode ? '#a855f7' : '#ff6ec4'}
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                  opacity="0.8"
                  strokeLinecap="round"
                  filter={`url(#outerGlow-${selectedSubjectId || 'default'})`}
                />
              )}
              
              
              {/* Arena Superior - Con Textura Granular y Degradado Radial */}
              {progress < 100 && (() => {
                const progressDecimal = progress / 100;
                const sandHeightTop = 65 * (1 - progressDecimal);
                const topY = 100 - sandHeightTop;
                const widthAtTop = 35 * (1 - progressDecimal * 0.4);
                const widthAtBottom = 35;
                
                // Superficie cóncava de la arena
                const surfaceCurve = Math.max(0, 5 * (1 - progressDecimal));
                
                return (
                  <g>
                    <path
                      d={`M ${50 - widthAtTop} ${topY} 
                          Q ${50 - widthAtTop/2} ${topY + surfaceCurve} ${50} ${topY + surfaceCurve}
                          Q ${50 + widthAtTop/2} ${topY + surfaceCurve} ${50 + widthAtTop} ${topY}
                          L ${50 + widthAtBottom} 100
                          Q ${50 + widthAtBottom/2} 95 ${50} 100
                          Q ${50 - widthAtBottom/2} 95 ${50 - widthAtBottom} 100 Z`}
                      fill={`url(#sandGradientTop-${selectedSubjectId || 'default'})`}
                      filter={`url(#sandTexture-${selectedSubjectId || 'default'})`}
                      opacity="0.95"
                      style={{
                        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: isNightMode 
                          ? 'drop-shadow(0 0 6px rgba(216, 180, 254, 0.5))'
                          : 'drop-shadow(0 0 6px rgba(248, 200, 220, 0.4))',
                      }}
                    />
                    {/* Brillo en la superficie de la arena */}
                    <ellipse
                      cx="50"
                      cy={topY + surfaceCurve}
                      rx={widthAtTop * 0.6}
                      ry={surfaceCurve + 2}
                      fill="rgba(255, 255, 255, 0.4)"
                      opacity={0.6}
                    />
                  </g>
                );
              })()}
              
              {/* Hilo de arena animado (solo cuando está activo) - Con Parpadeo */}
              {isActive && !isPaused && progress > 0 && progress < 100 && (
                <g>
                  {/* Línea del hilo de arena con efecto neón y parpadeo */}
                  <line
                    x1="50"
                    y1="100"
                    x2="50"
                    y2="120"
                    stroke={isNightMode ? '#d8b4fe' : '#f8c8dc'}
                    strokeWidth="1.5"
                    strokeDasharray="2 3"
                    style={{
                      animation: 'sandFlow 1.5s linear infinite, sandFlicker 2s ease-in-out infinite',
                      filter: isNightMode 
                        ? 'drop-shadow(0 0 4px rgba(216, 180, 254, 0.8))'
                        : 'drop-shadow(0 0 4px rgba(248, 200, 220, 0.7))',
                    }}
                  />
                  
                  {/* Partículas de arena cayendo - más granulares */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const randomOffset = (Math.sin(i * 0.8) + Math.cos(i * 1.2)) * 1.2;
                    const delay = i * 0.12;
                    return (
                      <circle
                        key={`falling-${i}`}
                        cx={50 + randomOffset}
                        cy={100}
                        r={0.8 + (i % 2) * 0.3}
                        fill={isNightMode ? '#d8b4fe' : '#f8c8dc'}
                        opacity={0.85 - (i * 0.08)}
                        style={{
                          animation: `sandFall ${0.7 + (i * 0.1)}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                          animationDelay: `${delay}s`,
                          filter: isNightMode 
                            ? 'drop-shadow(0 0 2px rgba(216, 180, 254, 0.6))'
                            : 'drop-shadow(0 0 2px rgba(248, 200, 220, 0.5))',
                        }}
                      />
                    );
                  })}
                </g>
              )}
              
              {/* Arena Inferior - Con Montículo y Textura Granular */}
              {progress > 0 && (() => {
                const progressDecimal = progress / 100;
                const sandHeightBottom = 65 * progressDecimal;
                const bottomY = 120 + sandHeightBottom;
                const widthAtTop = 35;
                const widthAtBottom = 35 * (0.6 + progressDecimal * 0.4);
                
                // Forma de montículo (más redondeado cuando hay más arena)
                const moundHeight = Math.min(15, 12 * progressDecimal);
                const moundWidth = Math.min(30, 25 * progressDecimal);
                
                return (
                  <g>
                    <path
                      d={`M ${50 - widthAtTop} 120 
                          Q ${50 - widthAtTop/2} 115 ${50} 120
                          Q ${50 + widthAtTop/2} 115 ${50 + widthAtTop} 120
                          L ${50 + widthAtBottom} ${bottomY}
                          Q ${50 + widthAtBottom/2} ${bottomY + 5} ${50} ${bottomY}
                          Q ${50 - widthAtBottom/2} ${bottomY + 5} ${50 - widthAtBottom} ${bottomY} Z`}
                      fill={`url(#sandGradientBottom-${selectedSubjectId || 'default'})`}
                      filter={`url(#sandTexture-${selectedSubjectId || 'default'})`}
                      opacity="0.95"
                      style={{
                        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: isNightMode 
                          ? 'drop-shadow(0 0 6px rgba(216, 180, 254, 0.5))'
                          : 'drop-shadow(0 0 6px rgba(248, 200, 220, 0.4))',
                      }}
                    />
                    {/* Montículo superior de la arena */}
                    {progressDecimal > 0.1 && (
                      <ellipse
                        cx="50"
                        cy={bottomY - moundHeight}
                        rx={moundWidth}
                        ry={moundHeight}
                        fill={isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 250, 240, 0.6)'}
                        opacity={0.7}
                        style={{
                          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    )}
                    {/* Brillo en el centro del montículo */}
                    {progressDecimal > 0.15 && (
                      <ellipse
                        cx="50"
                        cy={bottomY - moundHeight - 2}
                        rx={moundWidth * 0.6}
                        ry={moundHeight * 0.5}
                        fill="rgba(255, 255, 255, 0.4)"
                        opacity={0.8}
                        style={{
                          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    )}
                  </g>
                );
              })()}
              
              {/* Línea de separación cuando está pausado - estilo neón */}
              {isPaused && (
                <line
                  x1="47"
                  y1="100"
                  x2="53"
                  y2="120"
                  stroke={isNightMode ? '#a855f7' : '#E35B8F'}
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                  opacity="0.8"
                  strokeLinecap="round"
                  style={{
                    filter: isNightMode 
                      ? 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.9))'
                      : 'drop-shadow(0 0 5px rgba(227, 91, 143, 0.8))',
                  }}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Columna derecha: Temporizador y Controles */}
        <div className="flex flex-col items-center gap-6 flex-1 max-w-md w-full">
          {/* Display del temporizador */}
          <div className={`relative w-full max-w-sm flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl backdrop-blur-xl transition-all duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.7)] border-2 border-[#A68A56]/40' 
              : 'glass-card border-2 border-[#D4AF37]/40'
          }`}>
            {/* Tiempo restante grande y claro */}
            <div className="mb-6">
              <span className={`font-mono text-7xl md:text-8xl lg:text-9xl font-black tabular-nums tracking-tighter transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            {/* Barra de progreso visual */}
            <div className="w-full h-2 bg-[#F8C8DC]/20 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-[#E35B8F] via-[#D4AF37] to-[#E35B8F] transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Controles del timer - Mejorados y más visibles */}
            <div className="flex items-center justify-center gap-4">
              {!isActive ? (
                <button 
                  onClick={handleStart}
                  className="btn-primary w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl hover:shadow-[#E35B8F]/50"
                  aria-label="Iniciar temporizador"
                >
                  <svg className="w-10 h-10 md:w-12 md:h-12 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button 
                      onClick={handleResume}
                      className="btn-primary w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl hover:shadow-[#E35B8F]/50"
                      aria-label="Reanudar temporizador"
                    >
                      <svg className="w-10 h-10 md:w-12 md:h-12 ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  ) : (
                    <button 
                      onClick={handlePause}
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-3 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl ${
                        isNightMode 
                          ? 'border-[#A68A56] text-[#A68A56] hover:bg-[#A68A56]/20' 
                          : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/20'
                      }`}
                      aria-label="Pausar temporizador"
                    >
                      {getIcon('pause', 'w-8 h-8 md:w-10 md:h-10')}
                    </button>
                  )}
                  <button 
                    onClick={handleStop}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-3 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl ${
                      isNightMode 
                        ? 'border-[#E35B8F] text-[#E35B8F] hover:bg-[#E35B8F]/20' 
                        : 'border-[#E35B8F] text-[#E35B8F] hover:bg-[#E35B8F]/20'
                    }`}
                    aria-label="Detener temporizador"
                  >
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-current rounded-sm" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Cierra el layout flex principal (línea 322) */}
        </div>

        {/* Sección Vínculo Académico - Debajo del layout principal */}
        <div className="w-full max-w-4xl mt-4">
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
                value={selectedSubjectId ?? ''}
                onChange={(e) => {
                  const newValue = e.target.value === '' ? null : e.target.value;
                  updateState({ selectedSubjectId: newValue });
                }}
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
            <h2 className={`font-cinzel text-xl mb-6 text-center font-bold uppercase tracking-widest transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Tiempo Personalizado</h2>
            <div className="space-y-4">
              <input
                type="number"
                min="1"
                max="240"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Minutos (1-240)"
                className="w-full bg-white/30 border-0 border-b-2 border-[#D4AF37] rounded-none px-4 py-3.5 text-base outline-none font-bold focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)] transition-all"
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
            <h2 className="font-cinzel text-3xl lg:text-4xl text-[#2D1A26] mb-3 font-black text-center uppercase tracking-widest">
              {reflectionData.wasInterrupted ? "Sesión Interrumpida" : "Sesión Completada"}
            </h2>
            <p className="text-base lg:text-base text-[#8B5E75] text-center mb-10 font-garamond italic px-6">
              {reflectionData.wasInterrupted ? "Tu sesión fue interrumpida. Reflexiona sobre lo aprendido para no perder el progreso." : "¡Excelente trabajo! Has completado tu sesión de estudio."}
            </p>

            <div className="space-y-10">
              <div className="px-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-[#8B5E75]">Frecuencia Motivacional</label>
                  <span className="text-xl font-cinzel text-[#E35B8F] font-black">{reflectionData.motivation}/10</span>
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
                  className="w-full bg-white/80 border-2 border-[#F8C8DC] rounded-[2rem] p-6 text-base lg:text-xl font-garamond h-40 focus:outline-none focus:border-[#D4AF37] transition-all resize-none shadow-inner"
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
                    className="w-full bg-[#E35B8F]/5 border-2 border-[#E35B8F]/20 rounded-2xl px-6 py-4 text-base focus:outline-none focus:border-[#E35B8F]"
                  />
                </div>
              )}

              <button 
                onClick={submitReflection}
                className="btn-primary w-full py-5 rounded-[2rem] font-cinzel text-xs lg:text-base tracking-[0.3em] font-black uppercase shadow-2xl hover:brightness-105"
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
