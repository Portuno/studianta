
import React, { useState, useRef, useMemo, useEffect, useId } from 'react';
import { JournalEntry, MoodType } from '../types';
import { getIcon, COLORS } from '../constants';

interface DiaryModuleProps {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  isMobile: boolean;
  securityModuleActive?: boolean;
  securityPin?: string;
  onVerifyPin?: (pin: string) => Promise<boolean>;
}

// Componente para iconos de ánimos con degradados
const MoodIcon: React.FC<{ type: MoodType; className?: string }> = ({ type, className = "w-6 h-6" }) => {
  const id = useId();
  switch (type) {
    case 'Radiante':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`sunGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FF6347" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="5" fill={`url(#sunGradient-${id})`} />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54M4.93 19.07l3.54-3.54M15.54 8.46l3.54-3.54" stroke={`url(#sunGradient-${id})`} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'Enfocada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`moonGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9370DB" />
              <stop offset="50%" stopColor="#BA55D3" />
              <stop offset="100%" stopColor="#E35B8F" />
            </linearGradient>
          </defs>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={`url(#moonGradient-${id})`} />
        </svg>
      );
    case 'Equilibrada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`cloudGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" />
              <stop offset="50%" stopColor="#9370DB" />
              <stop offset="100%" stopColor="#8B5E75" />
            </linearGradient>
          </defs>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill={`url(#cloudGradient-${id})`} />
        </svg>
      );
    case 'Agotada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`crystalGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A233E" />
              <stop offset="50%" stopColor="#6B4C7A" />
              <stop offset="100%" stopColor="#8B5E75" />
            </linearGradient>
          </defs>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={`url(#crystalGradient-${id})`} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'Estresada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`lightningGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FF6347" />
              <stop offset="100%" stopColor="#E35B8F" />
            </linearGradient>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={`url(#lightningGradient-${id})`} />
        </svg>
      );
    default:
      return null;
  }
};

const MOODS: { type: MoodType; icon: string; color: string; label: string }[] = [
  { type: 'Radiante', icon: 'sun', color: '#D4AF37', label: 'Radiante' },
  { type: 'Enfocada', icon: 'moon', color: '#E35B8F', label: 'Enfocada' },
  { type: 'Equilibrada', icon: 'cloud', color: '#8B5E75', label: 'Equilibrada' },
  { type: 'Agotada', icon: 'crystal', color: '#4A233E', label: 'Agotada' },
  { type: 'Estresada', icon: 'lightning', color: '#E35B8F', label: 'Estresada' },
];

const PROMPTS = [
  "¿Qué susurro del universo resonó en tu alma hoy?",
  "¿Qué fragmento de eternidad capturaste en este instante?",
  "Describe el eco de tu esencia en este momento sagrado.",
  "¿Qué verdad velada se reveló ante tus ojos?",
  "¿Cómo danzó la luz en tu corazón esta jornada?",
  "¿Qué misterio del cosmos se desplegó en tu camino?",
  "¿Qué semilla de sabiduría plantaste en tu jardín interior?",
  "¿Qué melodía silenciosa escuchaste en el viento?"
];

// Componente del Sello de Studianta
const StudiantaSeal: React.FC<{ className?: string; size?: number }> = ({ className = "w-8 h-8", size = 32 }) => {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`sealGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E35B8F" />
          <stop offset="50%" stopColor="#C94A7A" />
          <stop offset="100%" stopColor="#B8396A" />
        </linearGradient>
        <filter id={`sealShadow-${id}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Cera del sello - Rosa Intenso */}
      <circle cx="32" cy="32" r="30" fill={`url(#sealGradient-${id})`} filter={`url(#sealShadow-${id})`} />
      
      {/* Relieve en Oro Antiguo - Borde exterior */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.8" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
      
      {/* Laurel izquierdo */}
      <path d="M18 24 Q16 20 18 18 Q20 16 22 18 Q20 20 20 24 Q20 28 22 30 Q24 32 22 34 Q20 36 20 40 Q20 44 22 46" 
            stroke="#D4AF37" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 24 Q16 28 18 30 Q20 32 22 30 Q20 28 20 24" 
            stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.7" />
      
      {/* Laurel derecho */}
      <path d="M46 24 Q48 20 46 18 Q44 16 42 18 Q44 20 44 24 Q44 28 42 30 Q40 32 42 34 Q44 36 44 40 Q44 44 42 46" 
            stroke="#D4AF37" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M46 24 Q48 28 46 30 Q44 32 42 30 Q44 28 44 24" 
            stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.7" />
      
      {/* S estilizada de Studianta */}
      <path d="M28 20 Q24 20 24 24 Q24 28 28 28 Q32 28 32 24 Q32 20 36 20 Q40 20 40 24 Q40 28 36 28 Q32 28 32 32 Q32 36 36 36 Q40 36 40 40 Q40 44 36 44 Q32 44 32 40" 
            stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Detalles de relieve interno */}
      <circle cx="32" cy="32" r="24" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
};

// Componente de Botón con Sello
interface SealButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SealButton: React.FC<SealButtonProps> = ({ onClick, label = "Sellar Crónica", className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-6 py-2.5 text-[9px]',
    md: 'px-8 py-3 text-[10px]',
    lg: 'px-12 py-4 text-xs'
  };
  
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${sizeClasses[size]} rounded-full font-cinzel font-black uppercase tracking-[0.4em] shadow-[0_8px_20px_rgba(227,91,143,0.5),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:scale-[1.03] active:scale-[0.98] transition-all relative flex items-center justify-center gap-2 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #E35B8F 0%, #C94A7A 100%)',
        filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.4))'
      }}
    >
      <StudiantaSeal className={iconSizes[size]} />
      <span className="text-white">{label}</span>
    </button>
  );
};

const DiaryModule: React.FC<DiaryModuleProps> = ({ 
  entries, 
  onAddEntry, 
  onDeleteEntry, 
  onUpdateEntry, 
  isMobile,
  securityModuleActive = false,
  securityPin,
  onVerifyPin
}) => {
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGrimorioOpen, setIsGrimorioOpen] = useState(false);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingEntryToView, setPendingEntryToView] = useState<JournalEntry | null>(null);
  const [unlockedEntries, setUnlockedEntries] = useState<Set<string>>(new Set()); // IDs de entradas desbloqueadas en esta sesión
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const randomPrompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);
  
  // Filtrar entradas basado en búsqueda semántica
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase().trim();
    return entries.filter(entry => {
      // Si hay búsqueda activa, excluir entradas bloqueadas por PIN
      if (entry.isLocked && securityModuleActive) {
        return false;
      }
      
      // Búsqueda en contenido
      const contentMatch = entry.content.toLowerCase().includes(query);
      // Búsqueda en ánimo
      const moodMatch = entry.mood.toLowerCase().includes(query);
      // Búsqueda en fecha
      const dateStr = new Date(entry.date).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).toLowerCase();
      const dateMatch = dateStr.includes(query);
      
      return contentMatch || moodMatch || dateMatch;
    });
  }, [entries, searchQuery, securityModuleActive]);
  
  // Generar rotación aleatoria para fotos Polaroid
  useEffect(() => {
    if (photo) {
      setPhotoRotation(Math.random() * 4 - 2); // Entre -2 y 2 grados
    }
  }, [photo]);

  // Función para ver entrada completa
  const handleViewEntry = async (entry: JournalEntry) => {
    // Si la entrada está bloqueada y el módulo de seguridad está activo, pedir PIN
    if (entry.isLocked && securityModuleActive && onVerifyPin) {
      setPendingEntryToView(entry);
      setShowPinModal(true);
      setPinInput('');
      setPinError('');
    } else {
      setSelectedEntry(entry);
    }
  };

  // Función para verificar PIN y abrir entrada
  const handleVerifyPin = async (providedPin?: string) => {
    // Usar el PIN proporcionado o el del estado
    const pinToVerify = (providedPin || pinInput).trim();
    
    // Validar que el PIN tenga exactamente 4 dígitos
    if (pinToVerify.length !== 4 || !/^\d{4}$/.test(pinToVerify)) {
      setPinError('El PIN debe tener 4 dígitos');
      return;
    }

    // Dar tiempo para que React actualice el estado antes de verificar
    setTimeout(async () => {
      if (onVerifyPin) {
        const isValid = await onVerifyPin(pinToVerify);
        if (isValid) {
          if (pendingEntryToView) {
            // Marcar la entrada como desbloqueada en esta sesión
            setUnlockedEntries(prev => new Set(prev).add(pendingEntryToView.id));
            setSelectedEntry(pendingEntryToView);
          }
          setShowPinModal(false);
          setPinInput('');
          setPinError('');
          setPendingEntryToView(null);
        } else {
          setPinError('PIN incorrecto');
          setPinInput('');
        }
      } else if (securityPin && pinToVerify === securityPin) {
        if (pendingEntryToView) {
          // Marcar la entrada como desbloqueada en esta sesión
          setUnlockedEntries(prev => new Set(prev).add(pendingEntryToView.id));
          setSelectedEntry(pendingEntryToView);
        }
        setShowPinModal(false);
        setPinInput('');
        setPinError('');
        setPendingEntryToView(null);
      } else {
        setPinError('PIN incorrecto');
        setPinInput('');
      }
    }, 50);
  };

  // Función para confirmar borrado
  const handleDeleteClick = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(entryId);
  };

  const handleConfirmDelete = (entryId: string) => {
    onDeleteEntry(entryId);
    setShowDeleteConfirm(null);
  };

  // Función determinista para calcular rotación basada en el ID de la entrada
  const getEntryPhotoRotation = (entryId: string): number => {
    // Usar el ID para generar un número determinista entre -2 y 2
    let hash = 0;
    for (let i = 0; i < entryId.length; i++) {
      hash = entryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ((hash % 400) / 100) - 2; // Entre -2 y 2
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!activeMood) {
      alert("Por favor, selecciona un cristal de ánimo antes de sellar tu memoria.");
      return;
    }
    
    const newEntry: JournalEntry = {
      id: Math.random().toString(36).substring(7),
      date: entryDate,
      mood: activeMood,
      content: content,
      photo: photo || undefined,
      isLocked: isLocked,
      sentiment: 0
    };

    onAddEntry(newEntry);
    setActiveMood(null);
    setContent('');
    setPhoto(null);
    setIsLocked(false);
  };

  const insertQuote = () => {
    setContent(prev => prev + '\n"Revelación: ..."\n');
  };

  // Componente Modal de Pantalla Completa
  const EntryModal: React.FC<{ entry: JournalEntry; onClose: () => void }> = ({ entry, onClose }) => {
    const mood = MOODS.find(m => m.type === entry.mood);
    const entryPhotoRotation = getEntryPhotoRotation(entry.id);
    // Verificar si la entrada está desbloqueada (ya sea porque no está bloqueada o porque fue desbloqueada en esta sesión)
    const isUnlocked = !entry.isLocked || unlockedEntries.has(entry.id);
    
    return (
      <div 
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
            backgroundColor: '#FFFEF7'
          }}
        >
          {/* Header del Modal */}
          <div className="flex-none p-6 border-b border-[#D4AF37]/30 bg-white/80">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#FFF0F5] shadow-inner border border-[#F8C8DC]">
                  {mood && <MoodIcon type={mood.type} className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-lg font-serif font-bold text-[#4A233E] italic" style={{ fontFamily: 'Georgia, serif' }}>
                    {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-[#8B5E75] uppercase font-black tracking-widest opacity-60">{entry.mood}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-[#8B5E75] hover:text-[#4A233E] transition-colors p-2"
              >
                {getIcon('x', 'w-6 h-6')}
              </button>
            </div>
          </div>

          {/* Contenido del Modal */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {entry.isLocked && securityModuleActive && !isUnlocked ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-24 h-24 rounded-full bg-[#4A233E]/10 flex items-center justify-center mb-6">
                  {getIcon('lock', 'w-12 h-12 text-[#D4AF37]')}
                </div>
                <p className="text-xl font-cinzel text-[#4A233E] mb-2">Contenido Protegido</p>
                <p className="text-sm font-garamond text-[#8B5E75] italic">
                  Esta entrada está protegida. Debes ingresar el PIN para ver su contenido.
                </p>
              </div>
            ) : (
              <>
                {entry.photo && (
                  <div className="flex justify-center">
                    <div 
                      className="w-full max-w-md p-4 bg-white"
                      style={{ 
                        transform: `rotate(${entryPhotoRotation}deg)`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 0 0 12px white, 0 0 0 14px rgba(248,200,220,0.2)'
                      }}
                    >
                      <img src={entry.photo} alt="Memoria" className="w-full h-auto object-cover" />
                    </div>
                  </div>
                )}
                <div className="prose max-w-none">
                  <p className="text-xl text-[#4A233E] font-garamond leading-relaxed italic first-letter:text-4xl first-letter:font-marcellus first-letter:mr-2">
                    {entry.content}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-[#FFF0F5] -mt-4 -mx-4 font-inter">
        <header className="flex-none p-4 pt-6 bg-white/40 border-b border-[#F8C8DC] shadow-sm z-20">
          <div className="text-center mb-4">
            <h1 className="font-cinzel text-xl font-black text-[#4A233E] tracking-[0.25em] uppercase">Diario</h1>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#8B5E75]">Estado Vital</span>
                <span className="text-[9px] font-black text-[#E35B8F] uppercase tracking-widest">{activeMood || ''}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {MOODS.map(mood => (
                  <button
                    key={mood.type}
                    onClick={() => setActiveMood(mood.type)}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${activeMood === mood.type ? 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-md scale-105' : 'bg-white/60 text-[#8B5E75] border-[#F8C8DC]'}`}
                  >
                    <MoodIcon type={mood.type} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-none w-32">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8B5E75] mb-2 block px-1">Sello Cronológico</span>
              <div className="relative border-[0.5px] border-[#D4AF37] rounded-xl overflow-hidden shadow-inner bg-white/60">
                <input 
                  type="date" 
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-[10px] font-garamond font-bold text-[#4A233E] outline-none"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden p-6 relative bg-white/20">
          <div className="relative h-full flex flex-col">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={randomPrompt}
              className="w-full h-full bg-transparent text-xl font-garamond leading-relaxed text-[#4A233E] placeholder:italic placeholder:opacity-20 focus:outline-none resize-none overflow-y-auto"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
                backgroundColor: '#FFFEF7'
              }}
            />
            {photo && (
              <div 
                className="mt-4 w-36 h-36 p-2 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] relative self-end mb-20"
                style={{ 
                  transform: `rotate(${photoRotation}deg)`,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15), 0 0 0 8px white, 0 0 0 10px rgba(248,200,220,0.3)'
                }}
              >
                <img src={photo} alt="Daily Moment" className="w-full h-full object-cover" />
                <button onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 bg-red-400 text-white p-1 rounded-full shadow-lg z-10">{getIcon('trash', 'w-3 h-3')}</button>
              </div>
            )}
          </div>
        </main>

        <div className="fixed bottom-28 left-4 right-4 z-[120] flex justify-between items-center pointer-events-none">
           <div className="flex gap-2 pointer-events-auto">
             <button onClick={insertQuote} className="w-11 h-11 bg-white border border-[#D4AF37] text-[#D4AF37] rounded-full flex items-center justify-center shadow-lg active:scale-90">
               <span className="font-serif font-bold text-lg">“</span>
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-white border border-[#F8C8DC] text-[#8B5E75] rounded-full flex items-center justify-center shadow-lg active:scale-90">
               {getIcon('camera', 'w-4 h-4')}
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
           </div>
           <div className="pointer-events-auto">
             <button 
               onClick={handleSave}
               className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(227,91,143,0.5),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] active:scale-95 transition-all relative"
               style={{
                 background: 'linear-gradient(135deg, #E35B8F 0%, #C94A7A 100%)',
                 filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.4))'
               }}
             >
               <StudiantaSeal className="w-10 h-10" />
             </button>
           </div>
        </div>

        <div className={`fixed inset-x-0 bottom-0 z-[150] bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(74,35,62,0.2)] border-t border-[#F8C8DC] transition-all duration-500 ease-in-out ${isGrimorioOpen ? 'h-[85vh]' : 'h-20'}`}>
          <div className="w-full h-full flex flex-col relative overflow-hidden">
            <div onClick={() => setIsGrimorioOpen(!isGrimorioOpen)} className="flex-none py-5 px-10 flex items-center justify-between cursor-pointer group">
              <h3 className="font-marcellus text-[11px] font-black text-[#4A233E] uppercase tracking-[0.4em]">Grimorio de Memorias</h3>
              <div className={`transition-all duration-500 text-[#D4AF37] ${isGrimorioOpen ? 'rotate-180 scale-125' : 'animate-bounce'}`}>
                {getIcon('chevron', 'w-4 h-4')}
              </div>
            </div>
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 pb-10 min-h-0" 
              style={{ 
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")', 
                backgroundColor: '#FFF9FB', 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                maxHeight: '100%'
              }}
            >
              {/* Buscador */}
              <div className="sticky top-0 z-10 mb-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-[#D4AF37]/20 shadow-sm">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en el cuaderno..."
                    className="w-full bg-transparent px-4 py-2 pr-10 text-sm font-garamond text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:outline-none border border-[#F8C8DC] rounded-xl"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5E75]/50">
                    {getIcon('search', 'w-4 h-4') || (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                {searchQuery && (
                  <p className="text-xs text-[#8B5E75] mt-2 px-1">
                    {filteredEntries.length} {filteredEntries.length === 1 ? 'entrada encontrada' : 'entradas encontradas'}
                  </p>
                )}
              </div>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#8B5E75] font-garamond italic">No se encontraron entradas que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                const mood = MOODS.find(m => m.type === entry.mood);
                const entryPhotoRotation = getEntryPhotoRotation(entry.id);
                return (
                  <div 
                    key={entry.id} 
                    onClick={() => handleViewEntry(entry)}
                    className="relative p-7 border-2 border-[#D4AF37]/30 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all"
                    style={{
                      borderImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(212,175,55,0.3) 8px, rgba(212,175,55,0.3) 16px) 1',
                      borderStyle: 'solid',
                      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4 relative z-20">
                       <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-[#FFF0F5] text-[#D4AF37] shadow-inner border border-[#F8C8DC]">
                            {mood && <MoodIcon type={mood.type} className="w-4 h-4" />}
                          </div>
                          <div>
                             <p className="text-[12px] font-serif font-bold text-[#4A233E] tracking-wide italic" style={{ fontFamily: 'Georgia, serif' }}>
                               {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                             </p>
                             <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-[0.2em] opacity-60">{entry.mood}</p>
                          </div>
                       </div>
                       <button 
                         onClick={(e) => handleDeleteClick(entry.id, e)} 
                         className="text-[#8B5E75]/40 hover:text-red-400 transition-colors p-2 relative z-30"
                       >
                         {getIcon('trash', 'w-4 h-4')}
                       </button>
                    </div>
                    {entry.photo && (
                      <div className="mb-4 flex justify-center">
                        <div 
                          className="w-32 h-32 p-2 bg-white"
                          style={{ 
                            transform: `rotate(${entryPhotoRotation}deg)`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 6px white, 0 0 0 8px rgba(248,200,220,0.3)'
                          }}
                        >
                          <img src={entry.photo} alt="Memoria" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {entry.isLocked && securityModuleActive ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-[#8B5E75] font-garamond italic text-sm">
                          {getIcon('lock', 'w-5 h-5')}
                          <span>Contenido protegido - Toca para desbloquear</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[17px] text-[#4A233E] font-garamond leading-relaxed italic opacity-90 first-letter:text-3xl first-letter:font-marcellus first-letter:mr-1 line-clamp-3">{entry.content}</p>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Modal de Entrada Completa */}
        {selectedEntry && (
          <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}

        {/* Modal de Confirmación de Borrado - Mobile */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
            <div className="glass-card rounded-2xl p-6 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-cinzel text-xl text-[#4A233E] mb-4">Confirmar Eliminación</h3>
              <p className="font-garamond text-[#8B5E75] mb-6 text-sm">
                ¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-3 rounded-xl font-cinzel text-xs font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDelete(showDeleteConfirm)}
                  className="px-6 py-3 rounded-xl font-cinzel text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de PIN - Mobile */}
        {showPinModal && (
          <PinInputModal
            onVerify={handleVerifyPin}
            onCancel={() => {
              setShowPinModal(false);
              setPinInput('');
              setPinError('');
              setPendingEntryToView(null);
            }}
            pinInput={pinInput}
            setPinInput={setPinInput}
            pinError={pinError}
            setPinError={setPinError}
          />
        )}
      </div>
    );
  }

  // Tablet & Desktop Version
  return (
    <div className="h-full flex flex-col pb-4 max-w-7xl mx-auto px-4 lg:px-0">
      <header className="mb-4 flex items-center border-b border-[#D4AF37]/20 pb-3">
        <h1 className="font-marcellus text-2xl lg:text-3xl font-bold text-[#4A233E] tracking-tight">Diario</h1>
      </header>

      <div className="flex flex-col md:grid md:grid-cols-12 gap-4 lg:gap-6 flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4 overflow-y-auto pr-2 scroll-sm no-scrollbar">
          <div className="glass-card p-4 lg:p-6 rounded-[2rem] lg:rounded-[3rem] border-[#F8C8DC] shadow-2xl relative bg-white/70">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black text-[#8B5E75] tracking-[0.2em]">Ánimo Académico</label>
                    <span className="text-[10px] font-black text-[#E35B8F] uppercase tracking-[0.2em]">{activeMood || 'Seleccionar'}</span>
                  </div>
                  <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                    {MOODS.map(mood => (
                      <button
                        key={mood.type}
                        onClick={() => setActiveMood(mood.type)}
                        className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${activeMood === mood.type ? 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-xl scale-110' : 'bg-white/40 text-[#8B5E75] border-[#F8C8DC] hover:border-[#E35B8F]/30'}`}
                      >
                        <MoodIcon type={mood.type} className="w-6 h-6 lg:w-7 lg:h-7" />
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-[#8B5E75] tracking-[0.2em]">Sello Cronológico</label>
                  <div className="border-[0.5px] border-[#D4AF37] rounded-2xl overflow-hidden p-1 shadow-inner bg-white/40">
                    <input 
                      type="date" 
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full bg-transparent px-4 py-3.5 text-sm font-garamond font-bold text-[#4A233E] outline-none"
                    />
                  </div>
               </div>
            </div>

            <div className="relative mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={randomPrompt}
                className="w-full bg-transparent border-2 border-dashed border-[#F8C8DC] rounded-[2rem] lg:rounded-[2.5rem] p-4 lg:p-6 text-lg lg:text-xl font-garamond leading-relaxed text-[#4A233E] min-h-[200px] lg:min-h-[250px] focus:outline-none focus:border-[#D4AF37]/40 transition-all placeholder:italic placeholder:opacity-20 resize-none"
                style={{
                  backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
                  backgroundColor: '#FFFEF7'
                }}
              />
              {photo && (
                <div 
                  className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 w-40 h-40 lg:w-64 lg:h-64 p-3 bg-white"
                  style={{ 
                    transform: `rotate(${photoRotation}deg)`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 0 0 12px white, 0 0 0 14px rgba(248,200,220,0.2)'
                  }}
                >
                   <img src={photo} alt="Daily Moment" className="w-full h-full object-cover" />
                   <button onClick={() => setPhoto(null)} className="absolute -top-3 -right-3 bg-red-400 text-white p-2 rounded-full shadow-lg z-10">{getIcon('trash', 'w-4 h-4')}</button>
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#8B5E75] font-inter text-[10px] font-black uppercase tracking-widest border border-[#F8C8DC] hover:bg-[#FFF0F5]">
                  {getIcon('camera', 'w-4 h-4')} <span className="hidden lg:inline">Imagen</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <button onClick={() => setIsLocked(!isLocked)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-inter text-[10px] font-black uppercase tracking-widest border transition-all ${isLocked ? 'bg-[#4A233E] text-[#D4AF37] border-[#4A233E]' : 'bg-white text-[#8B5E75] border-[#F8C8DC] hover:bg-[#FFF0F5]'}`}>
                  {getIcon(isLocked ? 'lock' : 'unlock', 'w-4 h-4')} <span className="hidden lg:inline">{isLocked ? 'Cierre Activo' : 'Biometría'}</span>
                </button>
              </div>
              <SealButton onClick={handleSave} size="md" className="w-full lg:w-auto" />
            </div>
          </div>
        </div>

        {/* History Area - Persists on Tablet */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col overflow-hidden h-[400px] md:h-full">
          <div className="glass-card flex-1 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-6 flex flex-col border-[#D4AF37]/20 shadow-xl bg-white/40 overflow-hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
            <h3 className="font-marcellus text-lg lg:text-xl text-[#4A233E] mb-4 lg:mb-5 uppercase tracking-widest font-bold border-b border-[#D4AF37]/30 pb-3 flex-shrink-0">Historias Pasadas</h3>
            
            {/* Buscador Desktop */}
            <div className="mb-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 border border-[#D4AF37]/20 shadow-sm flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en el cuaderno..."
                  className="w-full bg-transparent px-3 py-2 pr-8 text-xs font-garamond text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:outline-none border border-[#F8C8DC] rounded-lg"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B5E75]/50">
                  {getIcon('search', 'w-3 h-3') || (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
              </div>
              {searchQuery && (
                <p className="text-[10px] text-[#8B5E75] mt-1 px-1">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'encontrada' : 'encontradas'}
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[#8B5E75] font-garamond italic">No se encontraron entradas que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                const mood = MOODS.find(m => m.type === entry.mood);
                const entryPhotoRotation = getEntryPhotoRotation(entry.id);
                return (
                  <div 
                    key={entry.id}
                    onClick={() => handleViewEntry(entry)}
                    className="bg-white/80 border-2 border-[#F8C8DC] p-4 group hover:border-[#D4AF37]/40 transition-all relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md"
                    style={{
                      borderImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(212,175,55,0.2) 6px, rgba(212,175,55,0.2) 12px) 1',
                      borderStyle: 'solid',
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                    }}
                  >
                    {entry.isLocked && <div className="absolute inset-0 bg-[#4A233E]/10 backdrop-blur-[4px] z-10 flex items-center justify-center text-[#D4AF37] shadow-inner pointer-events-none">{getIcon('lock', 'w-8 h-8')}</div>}
                    <div className="flex justify-between items-start mb-3 relative z-20">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-xl border border-[#F8C8DC] shadow-inner" style={{ backgroundColor: `${mood?.color}15`, color: mood?.color }}>
                           {mood && <MoodIcon type={mood.type} className="w-4 h-4" />}
                         </div>
                         <div>
                            <p className="text-[10px] font-serif font-bold text-[#4A233E] italic" style={{ fontFamily: 'Georgia, serif' }}>
                              {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[8px] text-[#8B5E75] uppercase font-black tracking-widest opacity-60">{entry.mood}</p>
                         </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(entry.id, e);
                        }} 
                        className="text-[#8B5E75]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 relative z-30"
                      >
                        {getIcon('trash', 'w-3 h-3')}
                      </button>
                    </div>
                    {entry.photo && (
                      <div className="mb-3 flex justify-center">
                        <div 
                          className="w-24 h-24 lg:w-32 lg:h-32 p-2 bg-white"
                          style={{ 
                            transform: `rotate(${entryPhotoRotation}deg)`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 6px white, 0 0 0 8px rgba(248,200,220,0.3)'
                          }}
                        >
                          <img src={entry.photo} alt="Memoria" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {entry.isLocked && securityModuleActive ? (
                      <div className="text-center py-2">
                        <div className="inline-flex items-center gap-2 text-[#8B5E75] font-garamond italic text-xs">
                          {getIcon('lock', 'w-4 h-4')}
                          <span>Contenido protegido</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm lg:text-base text-[#4A233E] font-garamond italic line-clamp-3 leading-relaxed opacity-80">{entry.content}</p>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Entrada Completa - Desktop */}
      {selectedEntry && (
        <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}

      {/* Modal de Confirmación de Borrado - Desktop */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-cinzel text-xl lg:text-2xl text-[#4A233E] mb-4">Confirmar Eliminación</h3>
            <p className="font-garamond text-[#8B5E75] mb-6">
              ¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="px-6 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de PIN - Desktop */}
      {showPinModal && (
        <PinInputModal
          onVerify={handleVerifyPin}
          onCancel={() => {
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
            setPendingEntryToView(null);
          }}
          pinInput={pinInput}
          setPinInput={setPinInput}
          pinError={pinError}
          setPinError={setPinError}
        />
      )}
    </div>
  );
};

// Componente Modal de PIN con auto-focus
const PinInputModal: React.FC<{
  onVerify: (pin?: string) => void;
  onCancel: () => void;
  pinInput: string;
  setPinInput: (pin: string) => void;
  pinError: string;
  setPinError: (error: string) => void;
}> = ({ onVerify, onCancel, pinInput, setPinInput, pinError, setPinError }) => {
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Auto-focus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (pinRefs[0].current) {
      pinRefs[0].current.focus();
    }
  }, []);

  const handlePinChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 1) return; // Solo un dígito por campo

    const currentPinArray = pinInput.split('');
    currentPinArray[index] = numericValue;
    const updatedPin = currentPinArray.join('').slice(0, 4);
    setPinInput(updatedPin);
    setPinError('');

    // Auto-focus al siguiente campo si hay un valor
    if (numericValue && index < 3 && pinRefs[index + 1].current) {
      setTimeout(() => {
        pinRefs[index + 1].current?.focus();
      }, 10);
    }

    // Si se completaron los 4 dígitos, verificar automáticamente
    // Pasar el PIN actualizado directamente para evitar problemas de sincronización de estado
    if (updatedPin.length === 4) {
      setTimeout(() => {
        // Verificar que el PIN tenga exactamente 4 dígitos antes de verificar
        if (updatedPin.length === 4 && /^\d{4}$/.test(updatedPin)) {
          onVerify(updatedPin);
        }
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
      // Si el campo está vacío y presionas backspace, ir al anterior
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleNumberClick = (num: string) => {
    const currentIndex = pinInput.length;
    if (currentIndex < 4) {
      handlePinChange(currentIndex, num);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4A233E]/10 flex items-center justify-center">
            {getIcon('lock', 'w-8 h-8 text-[#D4AF37]')}
          </div>
          <h3 className="font-cinzel text-xl lg:text-2xl text-[#4A233E] mb-2">Entrada Protegida</h3>
          <p className="font-garamond text-[#8B5E75] text-sm">
            Ingresa tu PIN de 4 dígitos para acceder
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={pinRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={pinInput[index] || ''}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 text-center text-2xl font-cinzel font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
                  pinInput.length > index
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#4A233E]'
                    : 'border-[#F8C8DC] bg-white/40 text-[#8B5E75]/30'
                }`}
              />
            ))}
          </div>
          {pinError && (
            <p className="text-red-500 text-sm text-center mt-4 font-garamond">{pinError}</p>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#4A233E] font-cinzel text-xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-sm font-black hover:bg-[#FFF0F5] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#4A233E] font-cinzel text-xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={() => {
              setPinInput(pinInput.slice(0, -1));
              setPinError('');
              const lastIndex = Math.max(0, pinInput.length - 1);
              pinRefs[lastIndex].current?.focus();
            }}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-sm font-black hover:bg-[#FFF0F5] transition-all"
          >
            ←
          </button>
        </div>

      </div>
    </div>
  );
};

export default DiaryModule;
