
import React, { useState, useEffect, useRef } from 'react';
import { Subject, NavView, CustomCalendarEvent } from '../types';
import { getIcon, COLORS } from '../constants';

interface FocusModuleProps {
  subjects: Subject[];
  onUpdateSubject: (subject: Subject) => void;
  onAddEssence: (amount: number) => void;
  onAddCalendarEvent?: (event: Omit<CustomCalendarEvent, 'id'>) => void;
  isMobile: boolean;
}

type AmbientType = 'none' | 'rain' | 'fire' | 'monastic';

const SOUND_URLS: Record<AmbientType, string> = {
  none: '',
  rain: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3497d51965.mp3?filename=rain-sound-1188.mp3',
  fire: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_5132205018.mp3?filename=fire-sound-123.mp3',
  monastic: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_145d8b7654.mp3?filename=monks-chanting-123.mp3'
};

const FocusModule: React.FC<FocusModuleProps> = ({ subjects, onUpdateSubject, onAddEssence, onAddCalendarEvent, isMobile }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [ambient, setAmbient] = useState<AmbientType>('none');
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionData, setReflectionData] = useState({
    motivation: 5,
    harvest: '',
    reason: '',
    wasInterrupted: false
  });
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [sanctuaryMode, setSanctuaryMode] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    if (ambient !== 'none' && isActive) {
      audioRef.current.src = SOUND_URLS[ambient];
      audioRef.current.play().catch(e => console.log("User interaction required for audio"));
    } else {
      audioRef.current.pause();
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [ambient, isActive]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleCompleteSession();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleStart = () => {
    if (!selectedSubjectId) {
      alert("Por favor, selecciona una asignatura para vincular tu energía.");
      return;
    }
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
    setReflectionData(prev => ({ ...prev, wasInterrupted: true }));
    setShowReflection(true);
  };

  const handleCompleteSession = () => {
    setIsActive(false);
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
      setTimeLeft(minutes * 60);
      setTotalTime(minutes * 60);
      setShowCustomTimeModal(false);
      setCustomMinutes('');
    }
  };

  const submitReflection = () => {
    const minutesStudied = Math.floor((totalTime - timeLeft) / 60);
    let essenceEarned = minutesStudied;
    
    if (!reflectionData.wasInterrupted && timeLeft === 0) {
      essenceEarned += 5;
    }

    onAddEssence(essenceEarned);

    const subject = subjects.find(s => s.id === selectedSubjectId);
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

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
    setIsActive(false);
    setTimeLeft(totalTime);
    setReflectionData({ motivation: 5, harvest: '', reason: '', wasInterrupted: false });
  };

  const ambientSounds = [
    { id: 'none', label: 'Silencio', icon: 'volume' },
    { id: 'rain', label: 'Lluvia', icon: 'rain' },
    { id: 'fire', label: 'Chimenea', icon: 'fire' },
    { id: 'monastic', label: 'Monacal', icon: 'moon' },
  ];

  // Efectos visuales según el sonido ambiente
  const getAmbientAura = () => {
    switch (ambient) {
      case 'rain':
        return 'bg-gradient-to-b from-blue-200/20 via-blue-300/10 to-transparent';
      case 'monastic':
        return 'bg-gradient-radial from-yellow-200/30 via-yellow-100/20 to-transparent';
      case 'fire':
        return 'bg-gradient-to-b from-orange-200/20 via-red-200/10 to-transparent';
      default:
        return '';
    }
  };

  return (
    <div className={`h-full flex flex-col items-center justify-center relative px-4 py-8 md:py-0 transition-all duration-1000 ${getAmbientAura()}`}>
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

      <div className={`max-w-4xl w-full flex flex-col items-center gap-8 lg:gap-12 animate-fade-in transition-all duration-500 ${sanctuaryMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <header className="text-center">
          <h1 className="font-cinzel text-xl md:text-2xl lg:text-3xl text-[#8B5E75] tracking-[0.4em] uppercase opacity-60 mb-2">
            El Reloj de Arena
          </h1>
          <div className="h-0.5 w-16 lg:w-24 bg-[#D4AF37] mx-auto opacity-30" />
        </header>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E35B8F]/10 to-[#D4AF37]/10 rounded-full blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="glass-card w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full flex flex-col items-center justify-center border-2 border-[#F8C8DC]/40 shadow-2xl relative z-10 overflow-hidden">
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
            <span className="font-mono text-5xl md:text-7xl lg:text-8xl font-black text-[#4A233E] tabular-nums tracking-tighter relative z-10">
              {formatTime(timeLeft)}
            </span>
            <div className="mt-4 lg:mt-6 flex flex-col items-center gap-3 relative z-10">
              {!isActive ? (
                <button 
                  onClick={handleStart}
                  className="btn-primary w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  {getIcon('play', 'w-7 h-7 lg:w-8 lg:h-8 ml-1')}
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleStop}
                    className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#E35B8F] text-[#E35B8F] flex items-center justify-center hover:bg-[#E35B8F]/10 transition-colors shadow-lg"
                  >
                    <div className="w-4 h-4 lg:w-5 lg:h-5 bg-current rounded-sm" />
                  </button>
                  <button
                    onClick={() => setSanctuaryMode(!sanctuaryMode)}
                    className={`px-4 py-2 rounded-xl font-cinzel text-[9px] uppercase font-bold border-2 transition-all ${sanctuaryMode ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-md' : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60 bg-white/80'}`}
                    title="Modo Santuario (Deep Work)"
                  >
                    {getIcon('moon', 'w-3 h-3 inline mr-1')} Santuario
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl lg:max-w-3xl">
          <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-[#F8C8DC]/30 shadow-sm">
            <p className="text-[10px] lg:text-[11px] uppercase font-black text-[#8B5E75] tracking-widest mb-5 border-b border-[#F8C8DC]/30 pb-2">Vínculo Académico</p>
            <div className="space-y-5">
              <select 
                disabled={isActive}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3.5 text-base font-garamond focus:outline-none focus:border-[#E35B8F] disabled:opacity-50 appearance-none shadow-inner"
              >
                <option value="" disabled>Seleccionar Asignatura</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex gap-3 flex-wrap">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    disabled={isActive}
                    onClick={() => { setTimeLeft(m * 60); setTotalTime(m * 60); }}
                    className={`flex-1 min-w-[80px] py-3 rounded-xl font-cinzel text-[10px] lg:text-[11px] border-2 transition-all ${totalTime === m * 60 ? 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-md scale-[1.03]' : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60'}`}
                  >
                    {m} MIN
                  </button>
                ))}
                <button
                  disabled={isActive}
                  onClick={() => setShowCustomTimeModal(true)}
                  className={`flex-1 min-w-[80px] py-3 rounded-xl font-cinzel text-[10px] lg:text-[11px] border-2 transition-all text-[#8B5E75] border-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-50`}
                >
                  Personalizado
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-[#F8C8DC]/30 shadow-sm">
            <p className="text-[10px] lg:text-[11px] uppercase font-black text-[#8B5E75] tracking-widest mb-5 border-b border-[#F8C8DC]/30 pb-2">Canalización de Sonido</p>
            <div className="grid grid-cols-4 gap-3">
              {ambientSounds.map(snd => (
                <button
                  key={snd.id}
                  onClick={() => setAmbient(snd.id as AmbientType)}
                  className={`flex flex-col items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all ${ambient === snd.id ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-md scale-[1.03]' : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60'}`}
                >
                  {getIcon(snd.icon, "w-6 h-6 lg:w-7 lg:h-7")}
                  <span className="text-[8px] lg:text-[9px] uppercase font-black text-center leading-tight">{snd.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center opacity-30 max-w-md">
          <p className="font-garamond italic text-lg lg:text-xl">"Cada grano de arena que cae es un peldaño más hacia la cúspide de la Logia."</p>
        </div>
      </div>

      {/* Temporizador flotante en modo Santuario */}
      {sanctuaryMode && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[200]"
          onClick={(e) => {
            // Si se hace clic fuera del temporizador, salir del modo Santuario
            if (e.target === e.currentTarget) {
              setSanctuaryMode(false);
            }
          }}
        >
          <div 
            className="relative group pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#E35B8F]/10 to-[#D4AF37]/10 rounded-full blur-[80px] opacity-50" />
            <div className="glass-card w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full flex flex-col items-center justify-center border-2 border-[#F8C8DC]/40 shadow-2xl relative z-10 overflow-hidden">
              {/* Efecto de llenado */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#E35B8F]/40 via-[#E35B8F]/30 to-[#E35B8F]/20 transition-all duration-1000 ease-out"
                style={{ 
                  height: `${fillProgress}%`,
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                }}
              />
              {/* Partículas doradas */}
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
              <span className="font-mono text-5xl md:text-7xl lg:text-8xl font-black text-[#4A233E] tabular-nums tracking-tighter relative z-10">
                {formatTime(timeLeft)}
              </span>
              <div className="mt-4 lg:mt-6 flex flex-col items-center gap-3 relative z-10">
                {isActive ? (
                  <>
                    <button 
                      onClick={handleStop}
                      className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#E35B8F] text-[#E35B8F] flex items-center justify-center hover:bg-[#E35B8F]/10 transition-colors shadow-lg bg-white/80"
                    >
                      <div className="w-4 h-4 lg:w-5 lg:h-5 bg-current rounded-sm" />
                    </button>
                    <button
                      onClick={() => setSanctuaryMode(false)}
                      className={`px-4 py-2 rounded-xl font-cinzel text-[9px] uppercase font-bold border-2 transition-all bg-[#D4AF37] text-white border-[#D4AF37] shadow-md`}
                      title="Salir del Modo Santuario"
                    >
                      {getIcon('moon', 'w-3 h-3 inline mr-1')} Salir
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleStart}
                    className="btn-primary w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                  >
                    {getIcon('play', 'w-7 h-7 lg:w-8 lg:h-8 ml-1')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para tiempo personalizado */}
      {showCustomTimeModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/80 backdrop-blur-xl p-4" onClick={() => { setShowCustomTimeModal(false); setCustomMinutes(''); }}>
          <div className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border-2 border-[#D4AF37]/40" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-cinzel text-lg text-[#4A233E] mb-6 text-center font-bold uppercase tracking-widest">Tiempo Personalizado</h2>
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
          <div className="glass-card w-full max-w-lg lg:max-w-xl p-8 lg:p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] animate-in zoom-in duration-500 overflow-y-auto max-h-[90vh] no-scrollbar" onClick={(e) => e.stopPropagation()}>
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
                Transmutar en Esencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusModule;
