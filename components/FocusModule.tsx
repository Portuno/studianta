
import React, { useState, useEffect, useRef } from 'react';
import { Subject, NavView } from '../types';
import { getIcon, COLORS } from '../constants';

interface FocusModuleProps {
  subjects: Subject[];
  onUpdateSubject: (subject: Subject) => void;
  onAddEssence: (amount: number) => void;
  isMobile: boolean;
}

type AmbientType = 'none' | 'rain' | 'fire' | 'monastic';

const SOUND_URLS: Record<AmbientType, string> = {
  none: '',
  rain: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3497d51965.mp3?filename=rain-sound-1188.mp3',
  fire: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_5132205018.mp3?filename=fire-sound-123.mp3',
  monastic: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_145d8b7654.mp3?filename=monks-chanting-123.mp3'
};

const FocusModule: React.FC<FocusModuleProps> = ({ subjects, onUpdateSubject, onAddEssence, isMobile }) => {
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Engine
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

  const submitReflection = () => {
    const minutesStudied = Math.floor((totalTime - timeLeft) / 60);
    let essenceEarned = minutesStudied;
    
    if (!reflectionData.wasInterrupted && timeLeft === 0) {
      essenceEarned += 5;
    }

    onAddEssence(essenceEarned);

    if (reflectionData.harvest && selectedSubjectId) {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      if (subject) {
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

  return (
    <div className="h-full flex flex-col items-center justify-center relative px-4 md:px-0">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#F8C8DC]/20 z-20">
        <div 
          className="h-full bg-gradient-to-r from-[#E35B8F] to-[#D4AF37] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center gap-12">
        <header className="text-center">
          <h1 className="font-cinzel text-xl md:text-2xl text-[#8B5E75] tracking-[0.4em] uppercase opacity-60 mb-2">
            El Reloj de Arena
          </h1>
          <div className="h-0.5 w-16 bg-[#D4AF37] mx-auto opacity-30" />
        </header>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E35B8F]/5 to-[#D4AF37]/5 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="glass-card w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center border-2 border-[#F8C8DC]/40 shadow-2xl relative z-10">
            <span className="font-mono text-5xl md:text-7xl font-black text-[#4A233E] tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </span>
            <div className="mt-4 flex gap-3">
              {!isActive ? (
                <button 
                  onClick={handleStart}
                  className="btn-primary w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {getIcon('plus', 'w-6 h-6 rotate-45')}
                </button>
              ) : (
                <button 
                  onClick={handleStop}
                  className="w-12 h-12 rounded-full border border-[#E35B8F] text-[#E35B8F] flex items-center justify-center hover:bg-[#E35B8F]/10 transition-colors"
                >
                  <div className="w-3 h-3 bg-current rounded-sm" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <div className="glass-card p-6 rounded-[2rem] border-[#F8C8DC]/30">
            <p className="text-[10px] uppercase font-black text-[#8B5E75] tracking-widest mb-4">Intención de Estudio</p>
            <div className="space-y-4">
              <select 
                disabled={isActive}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm font-garamond focus:outline-none focus:border-[#E35B8F] disabled:opacity-50"
              >
                <option value="" disabled>Seleccionar Asignatura</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                {[25, 45].map(m => (
                  <button
                    key={m}
                    disabled={isActive}
                    onClick={() => { setTimeLeft(m * 60); setTotalTime(m * 60); }}
                    className={`flex-1 py-2 rounded-xl font-cinzel text-[10px] border transition-all ${totalTime === m * 60 ? 'bg-[#E35B8F] text-white border-[#E35B8F]' : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60'}`}
                  >
                    {m} MIN
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border-[#F8C8DC]/30">
            <p className="text-[10px] uppercase font-black text-[#8B5E75] tracking-widest mb-4">Ambiente Sensorial</p>
            <div className="grid grid-cols-4 gap-2">
              {ambientSounds.map(snd => (
                <button
                  key={snd.id}
                  onClick={() => setAmbient(snd.id as AmbientType)}
                  className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all ${ambient === snd.id ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60'}`}
                >
                  {getIcon(snd.icon, "w-5 h-5")}
                  <span className="text-[8px] uppercase font-bold text-center">{snd.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center opacity-40">
          <p className="font-garamond italic">"El tiempo es la materia prima de la genialidad."</p>
        </div>
      </div>

      {showReflection && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-md p-6">
          <div className="glass-card w-full max-w-lg p-8 md:p-10 rounded-[3rem] shadow-2xl animate-in zoom-in duration-500 overflow-y-auto max-h-[90vh]">
            <h2 className="font-cinzel text-2xl text-[#4A233E] mb-2 font-black text-center uppercase tracking-widest">
              Cosecha de Conocimiento
            </h2>
            <p className="text-xs text-[#8B5E75] text-center mb-8 font-garamond italic">
              {reflectionData.wasInterrupted ? "La forja ha sido suspendida. Reflexiona sobre el motivo." : "Santuario completado. Tu voluntad se ha fortalecido."}
            </p>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#8B5E75]">Nivel de Motivación</label>
                  <span className="text-sm font-cinzel text-[#E35B8F]">{reflectionData.motivation}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={reflectionData.motivation}
                  onChange={(e) => setReflectionData({...reflectionData, motivation: parseInt(e.target.value)})}
                  className="w-full h-1 bg-[#F8C8DC] rounded-lg appearance-none cursor-pointer accent-[#E35B8F]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-[#8B5E75] mb-3 px-1">Cosecha Intelectual</label>
                <textarea 
                  value={reflectionData.harvest}
                  onChange={(e) => setReflectionData({...reflectionData, harvest: e.target.value})}
                  placeholder="¿Cuál fue el descubrimiento más valioso de esta sesión?"
                  className="w-full bg-white/60 border border-[#F8C8DC] rounded-2xl p-4 text-sm font-garamond h-32 focus:outline-none focus:border-[#E35B8F] resize-none"
                />
              </div>

              {reflectionData.wasInterrupted && (
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-[#E35B8F] mb-3 px-1">Interrupción de la Forja</label>
                  <input 
                    type="text"
                    value={reflectionData.reason}
                    onChange={(e) => setReflectionData({...reflectionData, reason: e.target.value})}
                    placeholder="Justificación del desvío..."
                    className="w-full bg-[#E35B8F]/5 border border-[#E35B8F]/30 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              )}

              <button 
                onClick={submitReflection}
                className="btn-primary w-full py-4 rounded-2xl font-cinzel text-xs tracking-[0.2em] font-black uppercase shadow-xl"
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
