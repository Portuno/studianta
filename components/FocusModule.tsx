
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
    <div className="h-full flex flex-col items-center justify-center relative px-4 py-8 md:py-0">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F8C8DC]/20 z-20 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#E35B8F] via-[#D4AF37] to-[#E35B8F] transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center gap-8 lg:gap-12 animate-fade-in">
        <header className="text-center">
          <h1 className="font-cinzel text-xl md:text-2xl lg:text-3xl text-[#8B5E75] tracking-[0.4em] uppercase opacity-60 mb-2">
            El Reloj de Arena
          </h1>
          <div className="h-0.5 w-16 lg:w-24 bg-[#D4AF37] mx-auto opacity-30" />
        </header>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E35B8F]/10 to-[#D4AF37]/10 rounded-full blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="glass-card w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full flex flex-col items-center justify-center border-2 border-[#F8C8DC]/40 shadow-2xl relative z-10">
            <span className="font-mono text-5xl md:text-7xl lg:text-8xl font-black text-[#4A233E] tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </span>
            <div className="mt-4 lg:mt-6 flex gap-4">
              {!isActive ? (
                <button 
                  onClick={handleStart}
                  className="btn-primary w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  {getIcon('plus', 'w-8 h-8 rotate-45')}
                </button>
              ) : (
                <button 
                  onClick={handleStop}
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#E35B8F] text-[#E35B8F] flex items-center justify-center hover:bg-[#E35B8F]/10 transition-colors shadow-lg"
                >
                  <div className="w-4 h-4 lg:w-5 lg:h-5 bg-current rounded-sm" />
                </button>
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
              <div className="flex gap-3">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    disabled={isActive}
                    onClick={() => { setTimeLeft(m * 60); setTotalTime(m * 60); }}
                    className={`flex-1 py-3 rounded-xl font-cinzel text-[10px] lg:text-[11px] border-2 transition-all ${totalTime === m * 60 ? 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-md scale-[1.03]' : 'text-[#8B5E75] border-[#F8C8DC] hover:bg-white/60'}`}
                  >
                    {m} MIN
                  </button>
                ))}
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

      {showReflection && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-6">
          <div className="glass-card w-full max-w-lg lg:max-w-xl p-8 lg:p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] animate-in zoom-in duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
            <h2 className="font-cinzel text-2xl lg:text-3xl text-[#4A233E] mb-3 font-black text-center uppercase tracking-widest">
              Cosecha de Gnosis
            </h2>
            <p className="text-sm lg:text-base text-[#8B5E75] text-center mb-10 font-garamond italic px-6">
              {reflectionData.wasInterrupted ? "La forja ha sido interrumpida. Reflexiona para no perder la esencia." : "Misión cumplida. Tu voluntad ha transmutado el tiempo en poder real."}
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
                <label className="block text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-[#8B5E75] mb-4 px-1">Hallazgo Trascendental</label>
                <textarea 
                  value={reflectionData.harvest}
                  onChange={(e) => setReflectionData({...reflectionData, harvest: e.target.value})}
                  placeholder="¿Qué concepto clave has transmutado hoy?"
                  className="w-full bg-white/80 border-2 border-[#F8C8DC] rounded-[2rem] p-6 text-base lg:text-lg font-garamond h-40 focus:outline-none focus:border-[#D4AF37] transition-all resize-none shadow-inner"
                />
              </div>

              {reflectionData.wasInterrupted && (
                <div className="px-4 animate-in slide-in-from-top-2">
                  <label className="block text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-[#E35B8F] mb-4 px-1">Obstáculo en el Camino</label>
                  <input 
                    type="text"
                    value={reflectionData.reason}
                    onChange={(e) => setReflectionData({...reflectionData, reason: e.target.value})}
                    placeholder="Identifica la distracción..."
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
