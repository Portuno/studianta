
import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  "¿Qué destello de sabiduría iluminó tu jornada?",
  "¿Cómo resuena tu espíritu ante los desafíos venideros?",
  "Tres gratitudes que perfuman tu santuario hoy.",
  "¿Qué enigma del conocimiento lograste descifrar?",
  "Describe la quietud de tu estudio en este instante.",
  "¿En qué rincón de tu Atanor personal hallaste paz?"
];

const DiaryModule: React.FC<DiaryModuleProps> = ({ entries, onAddEntry, onDeleteEntry, onUpdateEntry, isMobile }) => {
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGrimorioOpen, setIsGrimorioOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const randomPrompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

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

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-[#FFF0F5] -mt-4 -mx-4 pb-24 font-inter">
        {/* Zona 1: El Ritual Compacto (Superior) */}
        <header className="flex-none p-5 pt-8 bg-white/40 border-b border-[#F8C8DC] shadow-sm z-20">
          <div className="text-center mb-6">
            <h1 className="font-cinzel text-2xl font-black text-[#4A233E] tracking-[0.25em] uppercase">Grimorio de Recuerdos</h1>
            <p className="font-garamond italic text-[13px] text-[#8B5E75] mt-1 leading-relaxed px-4">Crónicas del alma transmutando hacia la excelencia intelectual.</p>
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
                    {getIcon(mood.icon, "w-4 h-4")}
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

        {/* Zona 2: El Sanctum de Escritura (Centro) */}
        <main className="flex-1 overflow-y-auto p-6 relative bg-white/20">
          <div className="relative h-full flex flex-col">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={randomPrompt}
              className="flex-1 w-full bg-transparent text-xl font-garamond leading-relaxed text-[#4A233E] placeholder:italic placeholder:opacity-20 focus:outline-none resize-none"
            />
            {photo && (
              <div className="mt-4 w-36 h-36 p-2 bg-white shadow-2xl rotate-2 border border-[#F8C8DC] relative self-end mb-20">
                <img src={photo} alt="Daily Moment" className="w-full h-full object-cover grayscale-[20%]" />
                <button onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 bg-red-400 text-white p-1 rounded-full shadow-lg">{getIcon('trash', 'w-3 h-3')}</button>
              </div>
            )}
          </div>
        </main>

        {/* Barra de Herramientas de Foco Académico (Flotante) */}
        <div className="fixed bottom-28 left-4 right-4 z-[120] flex justify-between items-center pointer-events-none">
           <div className="flex gap-2 pointer-events-auto">
             <button onClick={() => setContent(prev => `**${prev}**`)} className="w-11 h-11 bg-white border border-[#F8C8DC] text-[#4A233E] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
               <span className="font-bold">B</span>
             </button>
             <button onClick={insertQuote} className="w-11 h-11 bg-white border border-[#D4AF37] text-[#D4AF37] rounded-full flex items-center justify-center shadow-lg active:scale-90">
               <span className="font-serif font-bold text-lg">“</span>
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-white border border-[#F8C8DC] text-[#8B5E75] rounded-full flex items-center justify-center shadow-lg active:scale-90">
               {getIcon('camera', 'w-4 h-4')}
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
           </div>
           
           <button 
             onClick={handleSave}
             className="pointer-events-auto w-14 h-14 bg-[#E35B8F] border-2 border-[#D4AF37] rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(227,91,143,0.4)] active:scale-90 transition-all"
           >
             <div className="absolute inset-0 bg-gradient-to-tr from-[#E35B8F] to-[#FFD1DC] opacity-30 rounded-full" />
             {getIcon('pen', 'w-6 h-6 text-white relative z-10')}
           </button>
        </div>

        {/* Zona 3: El Cajón del Grimorio (Bottom Sheet) */}
        <div 
          className={`fixed inset-x-0 bottom-0 z-[150] bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(74,35,62,0.2)] border-t border-[#F8C8DC] transition-all duration-500 ease-in-out ${isGrimorioOpen ? 'h-[85vh]' : 'h-20'}`}
        >
          <div className="w-full h-full flex flex-col relative overflow-hidden">
            {/* Pestaña de Arrastre */}
            <div 
              onClick={() => setIsGrimorioOpen(!isGrimorioOpen)}
              className="flex-none py-5 px-10 flex items-center justify-between cursor-pointer group"
            >
              <h3 className="font-marcellus text-[11px] font-black text-[#4A233E] uppercase tracking-[0.4em]">Grimorio de Memorias</h3>
              <div className={`transition-all duration-500 text-[#D4AF37] ${isGrimorioOpen ? 'rotate-180 scale-125' : 'animate-bounce'}`}>
                {getIcon('chevron', 'w-4 h-4')}
              </div>
            </div>

            {/* Contenido del Historial con Textura */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-10" style={{
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")',
              backgroundColor: '#FFF9FB'
            }}>
              {entries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                   {getIcon('book', 'w-16 h-16 mb-6')}
                   <p className="font-garamond italic text-2xl">El Grimorio está ansioso por tus relatos.</p>
                </div>
              ) : (
                entries.map(entry => {
                  const mood = MOODS.find(m => m.type === entry.mood);
                  return (
                    <div 
                      key={entry.id} 
                      className="relative p-7 rounded-[2.5rem] border border-[#D4AF37]/20 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-[#FFF0F5] text-[#D4AF37] shadow-inner border border-[#F8C8DC]">
                              {getIcon(mood?.icon || 'sun', 'w-4 h-4')}
                            </div>
                            <div>
                               <p className="text-[12px] font-marcellus font-black text-[#4A233E] tracking-widest uppercase">
                                 {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                               </p>
                               <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-[0.2em] opacity-60">{entry.mood}</p>
                            </div>
                         </div>
                         <button onClick={() => onDeleteEntry(entry.id)} className="text-[#8B5E75]/40 hover:text-red-400 transition-colors p-2">{getIcon('trash', 'w-4 h-4')}</button>
                      </div>
                      <p className="text-[17px] text-[#4A233E] font-garamond leading-relaxed italic opacity-90 first-letter:text-3xl first-letter:font-marcellus first-letter:mr-1">
                        {entry.content}
                      </p>
                      {entry.photo && <div className="mt-4 rounded-2xl overflow-hidden border border-[#F8C8DC] h-32 w-full grayscale-[30%] opacity-80"><img src={entry.photo} className="w-full h-full object-cover" /></div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Version
  return (
    <div className="h-full flex flex-col pb-10 max-w-6xl mx-auto">
      <header className="mb-10 px-2 flex justify-between items-end border-b border-[#D4AF37]/20 pb-4">
        <div>
          <h1 className="font-marcellus text-4xl font-bold text-[#4A233E] tracking-tight">Grimorio de Recuerdos</h1>
          <p className="text-sm text-[#8B5E75] font-garamond italic mt-1 text-lg">Crónicas del alma transmutando hacia la excelencia intelectual.</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] uppercase font-black text-[#D4AF37] tracking-[0.4em] font-cinzel">Archivo de Saberes</p>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 flex-1 overflow-hidden">
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-4 scroll-sm">
          <div className="glass-card p-10 rounded-[4rem] border-[#F8C8DC] shadow-2xl relative bg-white/70">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] uppercase font-black text-[#8B5E75] tracking-[0.2em] block">Estado Emocional</label>
                    <span className="text-[10px] font-black text-[#E35B8F] uppercase tracking-[0.2em]">{activeMood || ''}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    {MOODS.map(mood => (
                      <button
                        key={mood.type}
                        onClick={() => setActiveMood(mood.type)}
                        className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border-2 ${activeMood === mood.type ? 'bg-[#E35B8F] text-white border-[#E35B8F] scale-105 shadow-xl' : 'bg-white/40 text-[#8B5E75] border-[#F8C8DC] hover:border-[#E35B8F]/30'}`}
                      >
                        {getIcon(mood.icon, "w-6 h-6")}
                        <span className="text-[9px] font-black uppercase tracking-tighter md:block hidden">{mood.label}</span>
                      </button>
                    ))}
                  </div>
               </div>
               <div className="w-full md:w-52">
                  <label className="text-[10px] uppercase font-black text-[#8B5E75] tracking-[0.2em] mb-4 block">Sello Cronológico</label>
                  <div className="border-[0.5px] border-[#D4AF37] rounded-2xl overflow-hidden p-1 shadow-inner">
                    <input 
                      type="date" 
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full bg-transparent px-5 py-4 text-sm font-garamond font-bold text-[#4A233E] outline-none"
                    />
                  </div>
               </div>
            </div>

            <div className="relative mb-8">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={randomPrompt}
                className="w-full bg-transparent border-2 border-dashed border-[#F8C8DC] rounded-[3rem] p-10 text-2xl font-garamond leading-relaxed text-[#4A233E] min-h-[400px] focus:outline-none focus:border-[#D4AF37]/40 transition-all placeholder:italic placeholder:opacity-20 resize-none"
              />
              {photo && (
                <div className="absolute bottom-10 right-10 w-48 h-48 md:w-64 md:h-64 p-3 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] rotate-3 border-2 border-[#F8C8DC]/40 animate-in zoom-in duration-300">
                   <img src={photo} alt="Daily Moment" className="w-full h-full object-cover grayscale-[30%]" />
                   <button onClick={() => setPhoto(null)} className="absolute -top-3 -right-3 bg-red-400 text-white p-2 rounded-full shadow-lg">{getIcon('trash', 'w-4 h-4')}</button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-white text-[#8B5E75] font-inter text-[11px] font-black uppercase tracking-widest border border-[#F8C8DC] hover:bg-[#FFF0F5] transition-all">
                  {getIcon('camera', 'w-5 h-5')} Añadir Momento
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <button onClick={() => setIsLocked(!isLocked)} className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-inter text-[11px] font-black uppercase tracking-widest border transition-all ${isLocked ? 'bg-[#4A233E] text-[#D4AF37] border-[#4A233E]' : 'bg-white text-[#8B5E75] border-[#F8C8DC] hover:bg-[#FFF0F5]'}`}>
                  {getIcon(isLocked ? 'lock' : 'unlock', 'w-5 h-5')} {isLocked ? 'Cierre Activo' : 'Cierre Biométrico'}
                </button>
              </div>
              <button onClick={handleSave} className="btn-primary px-16 py-4.5 rounded-3xl font-cinzel text-xs font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.03] transition-all">
                Sellar Crónica
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col overflow-hidden">
          <div className="glass-card flex-1 rounded-[4rem] p-10 flex flex-col border-[#D4AF37]/20 shadow-xl bg-white/40" style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'
          }}>
            <h3 className="font-marcellus text-2xl text-[#4A233E] mb-8 uppercase tracking-widest font-bold border-b border-[#D4AF37]/30 pb-4">Grimorio de Memorias</h3>
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 scroll-sm">
              {entries.map(entry => {
                const mood = MOODS.find(m => m.type === entry.mood);
                return (
                  <div key={entry.id} className="bg-white/80 border border-[#F8C8DC] p-7 rounded-[3rem] group hover:border-[#D4AF37]/40 transition-all relative overflow-hidden shadow-sm">
                    {entry.isLocked && <div className="absolute inset-0 bg-[#4A233E]/10 backdrop-blur-[4px] z-10 flex items-center justify-center text-[#D4AF37] shadow-inner">{getIcon('lock', 'w-8 h-8')}</div>}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                         <div className="p-2.5 rounded-xl border border-[#F8C8DC] shadow-inner" style={{ backgroundColor: `${mood?.color}15`, color: mood?.color }}>{getIcon(mood?.icon || 'sun', 'w-5 h-5')}</div>
                         <div>
                            <p className="text-[12px] font-marcellus font-black text-[#4A233E] uppercase tracking-tighter">{new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                            <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-widest opacity-60">{entry.mood}</p>
                         </div>
                      </div>
                      <button onClick={() => onDeleteEntry(entry.id)} className="text-[#8B5E75]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">{getIcon('trash', 'w-4 h-4')}</button>
                    </div>
                    <p className="text-[16px] text-[#4A233E] font-garamond italic line-clamp-3 leading-relaxed opacity-80">{entry.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryModule;
