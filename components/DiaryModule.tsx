
import React, { useState, useRef, useMemo } from 'react';
import { JournalEntry, MoodType } from '../types';
import { getIcon, COLORS } from '../constants';

interface DiaryModuleProps {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  isMobile: boolean;
}

const MOODS: { type: MoodType; icon: string; color: string; label: string }[] = [
  { type: 'Radiante', icon: 'sun', color: '#D4AF37', label: 'Radiante' },
  { type: 'Enfocada', icon: 'target', color: '#E35B8F', label: 'Enfocada' },
  { type: 'Equilibrada', icon: 'wind', color: '#8B5E75', label: 'Equilibrada' },
  { type: 'Agotada', icon: 'low-battery', color: '#4A233E', label: 'Agotada' },
  { type: 'Estresada', icon: 'storm', color: '#E35B8F', label: 'Estresada' },
];

const PROMPTS = [
  "¿Qué fue lo más lindo que aprendiste hoy?",
  "¿Cómo te sientes para tu próximo examen?",
  "Tres cosas por las que estás agradecida hoy.",
  "¿Qué misterio académico lograste desentrañar?",
  "Describe un momento de paz en tu santuario de estudio.",
  "¿Qué parte de tu Atanor personal brilló más hoy?"
];

const DiaryModule: React.FC<DiaryModuleProps> = ({ entries, onAddEntry, onDeleteEntry, onUpdateEntry, isMobile }) => {
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const randomPrompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
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
      sentiment: 0 // In a real app, calculate sentiment
    };

    onAddEntry(newEntry);
    // Reset form
    setActiveMood(null);
    setContent('');
    setPhoto(null);
    setIsLocked(false);
  };

  return (
    <div className="h-full flex flex-col pb-10 max-w-6xl mx-auto">
      <header className="mb-8 px-2 flex justify-between items-end">
        <div>
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#4A233E]">Cofre de Memorias</h1>
          <p className="text-sm text-[#8B5E75] font-inter italic">Tu bitácora emocional y trascendental.</p>
        </div>
        <div className="hidden md:block">
           <p className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-[0.3em] font-cinzel">Grimorio Digital</p>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Editor Section */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 scroll-sm">
          <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC] shadow-xl relative">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
               <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest mb-3 block">Estado Emocional</label>
                  <div className="flex justify-between items-center gap-2">
                    {MOODS.map(mood => (
                      <button
                        key={mood.type}
                        onClick={() => setActiveMood(mood.type)}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${activeMood === mood.type ? 'bg-[#E35B8F] text-white border-[#E35B8F] scale-105 shadow-md' : 'bg-white/40 text-[#8B5E75] border-[#F8C8DC] hover:border-[#E35B8F]/30'}`}
                        title={mood.label}
                      >
                        {getIcon(mood.icon, "w-5 h-5")}
                        <span className="text-[8px] font-bold uppercase tracking-tighter md:block hidden">{mood.label}</span>
                      </button>
                    ))}
                  </div>
               </div>
               <div className="w-full md:w-40">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest mb-3 block">Fecha Vital</label>
                  <input 
                    type="date" 
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#E35B8F] text-[#4A233E] font-bold"
                  />
               </div>
            </div>

            <div className="relative mb-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={randomPrompt}
                className="w-full bg-white/20 border-2 border-dashed border-[#F8C8DC]/40 rounded-[2rem] p-8 text-lg font-garamond leading-relaxed text-[#4A233E] min-h-[300px] focus:outline-none focus:border-[#E35B8F]/30 transition-all placeholder:italic placeholder:opacity-40"
              />
              {photo && (
                <div className="absolute bottom-6 right-6 w-32 h-32 md:w-48 md:h-48 p-2 bg-white shadow-2xl rotate-3 border-2 border-[#F8C8DC]/20 animate-in zoom-in duration-300 group">
                   <img src={photo} alt="Daily Moment" className="w-full h-full object-cover grayscale-[30%]" />
                   <button 
                    onClick={() => setPhoto(null)}
                    className="absolute -top-2 -right-2 bg-red-400 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     {getIcon('trash', 'w-3 h-3')}
                   </button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/60 text-[#8B5E75] font-inter text-[10px] font-bold uppercase tracking-widest border border-[#F8C8DC] hover:bg-[#FFD1DC]/40 transition-all"
                >
                  {getIcon('camera', 'w-4 h-4')} Añadir Momento
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                
                <button 
                  onClick={() => setIsLocked(!isLocked)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-inter text-[10px] font-bold uppercase tracking-widest border transition-all ${isLocked ? 'bg-[#4A233E] text-[#D4AF37] border-[#4A233E]' : 'bg-white/60 text-[#8B5E75] border-[#F8C8DC] hover:bg-[#FFD1DC]/40'}`}
                >
                  {getIcon(isLocked ? 'lock' : 'unlock', 'w-4 h-4')} {isLocked ? 'Sello Activo' : 'Cierre Biométrico'}
                </button>
              </div>

              <button 
                onClick={handleSave}
                className="btn-primary px-12 py-3.5 rounded-2xl font-cinzel text-xs font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
              >
                Sellar Crónica
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-4 flex flex-col overflow-hidden">
          <div className="glass-card flex-1 rounded-[3rem] p-8 flex flex-col border-[#F8C8DC]">
            <h3 className="font-cinzel text-lg text-[#4A233E] mb-6 uppercase tracking-widest font-bold">Grimorio de Memorias</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-sm">
              {entries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-6">
                   <div className="w-16 h-16 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-4">
                     {getIcon('pen', 'w-8 h-8')}
                   </div>
                   <p className="font-garamond italic text-lg leading-tight">"Las páginas aguardan tu voluntad para ser escritas."</p>
                </div>
              ) : (
                entries.map(entry => {
                  const mood = MOODS.find(m => m.type === entry.mood);
                  return (
                    <div key={entry.id} className="bg-white/60 border border-[#F8C8DC] p-5 rounded-[2rem] group hover:border-[#E35B8F]/30 transition-all relative overflow-hidden">
                      {entry.isLocked && (
                        <div className="absolute top-0 left-0 w-full h-full bg-[#4A233E]/10 backdrop-blur-[2px] z-10 flex items-center justify-center">
                           <div className="text-[#D4AF37]">{getIcon('lock', 'w-6 h-6')}</div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg" style={{ backgroundColor: `${mood?.color}20`, color: mood?.color }}>
                             {getIcon(mood?.icon || 'sun', 'w-4 h-4')}
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-[#4A233E] uppercase tracking-tighter">
                                {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-[8px] text-[#8B5E75] uppercase font-bold tracking-widest">{entry.mood}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-[#8B5E75] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        >
                          {getIcon('trash', 'w-3 h-3')}
                        </button>
                      </div>
                      <p className="text-xs text-[#8B5E75] font-garamond italic line-clamp-2 leading-relaxed">
                        {entry.content || "Sin reflexiones registradas..."}
                      </p>
                      {entry.photo && (
                        <div className="mt-3 w-full h-12 bg-[#FFF0F5] rounded-xl flex items-center justify-center text-[#E35B8F]">
                           {getIcon('camera', 'w-4 h-4 opacity-40')}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryModule;
