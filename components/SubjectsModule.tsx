
import React, { useState, useRef, useEffect } from 'react';
import { Subject, SubjectStatus, Milestone, Note, StudyMaterial, Schedule } from '../types';
import { getIcon, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { jsPDF } from 'jspdf';

interface SubjectsModuleProps {
  subjects: Subject[];
  onAdd: (name: string, career: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (subject: Subject) => void;
  isMobile: boolean;
  onMaterialUpload: () => void;
}

const SubjectsModule: React.FC<SubjectsModuleProps> = ({ subjects, onAdd, onDelete, onUpdate, isMobile, onMaterialUpload }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [finalGrade, setFinalGrade] = useState('');
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAdd(formData.get('name') as string, formData.get('career') as string);
    setShowAddModal(false);
  };

  const handleStatusChange = (status: SubjectStatus) => {
    if (!selectedSubject) return;
    if (status === 'Aprobada') {
      setShowCelebration(true);
    }
    onUpdate({ ...selectedSubject, status });
  };

  const submitFinalGrade = () => {
    if (!selectedSubject) return;
    onUpdate({ ...selectedSubject, status: 'Aprobada', grade: parseFloat(finalGrade) });
    setShowCelebration(false);
    setFinalGrade('');
  };

  const executeDelete = () => {
    if (subjectToDelete) {
      onDelete(subjectToDelete.id);
      if (selectedSubjectId === subjectToDelete.id) setSelectedSubjectId(null);
      setSubjectToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-cinzel text-2xl md:text-4xl font-bold text-[#4A233E]">Laboratorio de Saberes</h1>
          <p className="text-xs md:text-sm text-[#8B5E75] font-inter">Tu legado intelectual en construcción.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-cinzel text-xs font-bold shadow-lg"
        >
          {getIcon('plus', 'w-4 h-4')}
          Inaugurar Cátedra
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {subjects.length === 0 && (
          <div className="col-span-full py-16 text-center opacity-40">
            <p className="font-garamond italic text-lg">Registra tu primera asignatura para comenzar.</p>
          </div>
        )}
        {subjects.map(subject => (
          <div 
            key={subject.id} 
            className={`glass-card p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] cursor-pointer transition-all duration-300 active:scale-95 border-l-4 group relative ${subject.status === 'Aprobada' ? 'border-l-[#D4AF37]' : 'border-l-[#E35B8F]'}`}
            onClick={() => setSelectedSubjectId(subject.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[8px] md:text-[9px] uppercase font-bold px-3 py-1 rounded-full font-inter tracking-wider ${subject.status === 'Aprobada' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#E35B8F]/10 text-[#E35B8F]'}`}>
                {subject.status}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSubjectToDelete(subject); }}
                className="text-[#8B5E75] hover:text-red-500 p-2"
              >
                {getIcon('trash', 'w-4 h-4')}
              </button>
            </div>
            <h3 className="font-cinzel text-lg md:text-xl text-[#4A233E] mb-1 truncate font-bold">{subject.name}</h3>
            <p className="text-xs text-[#8B5E75] font-garamond italic">{subject.career}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-[#D4AF37] font-bold font-inter">
                 {getIcon('sparkles', 'w-3 h-3')}
                 <span>{subject.materials.length} Materiales</span>
              </div>
              <div className="text-[#E35B8F]">{getIcon('chevron', 'w-4 h-4')}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedSubject && (
        <div className="fixed inset-0 z-[200] bg-[#FFF0F5] overflow-hidden flex flex-col">
          <SubjectDetail 
            subject={selectedSubject} 
            onClose={() => setSelectedSubjectId(null)} 
            onUpdate={onUpdate}
            onStatusChange={handleStatusChange}
            isMobile={isMobile}
            onMaterialUpload={onMaterialUpload}
          />
        </div>
      )}

      {subjectToDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4">
          <div className="glass-card max-w-sm w-full p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-center shadow-2xl">
             <h2 className="font-cinzel text-xl text-[#4A233E] mb-4 font-bold uppercase tracking-widest">¿Borrar Cátedra?</h2>
             <p className="text-sm text-[#8B5E75] mb-8 font-garamond italic">Se perderán todos los registros de "{subjectToDelete.name}".</p>
             <div className="flex flex-col gap-3">
               <button onClick={executeDelete} className="bg-red-500 text-white w-full py-4 rounded-2xl font-cinzel text-xs font-bold uppercase">ELIMINAR</button>
               <button onClick={() => setSubjectToDelete(null)} className="text-[#8B5E75] w-full py-3 rounded-2xl font-inter text-xs font-bold uppercase">CANCELAR</button>
             </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#E35B8F]/30 backdrop-blur-md p-4">
          <div className="glass-card max-w-sm w-full p-8 rounded-[2rem] md:rounded-[3rem] text-center shadow-2xl">
             <h2 className="font-cinzel text-3xl text-[#4A233E] mb-2 font-bold uppercase tracking-widest">¡TRIUNFO!</h2>
             <div className="mb-8">
               <label className="block text-[10px] uppercase font-bold text-[#8B5E75] mb-2 font-inter">Nota Obtenida</label>
               <input type="number" step="0.1" value={finalGrade} onChange={(e) => setFinalGrade(e.target.value)} className="w-full text-center bg-white/60 border border-[#D4AF37] rounded-xl px-4 py-4 font-inter text-3xl text-[#4A233E] outline-none" placeholder="0.0" />
             </div>
             <button onClick={submitFinalGrade} className="btn-primary w-full py-4 rounded-2xl font-cinzel text-xs tracking-widest font-black uppercase shadow-lg">GUARDAR NOTA</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAdd} className="glass-card w-full max-w-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl animate-fade-in">
            <h2 className="font-cinzel text-lg md:text-xl text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">REGISTRAR CÁTEDRA</h2>
            <div className="space-y-4 font-inter">
              <input required name="name" type="text" placeholder="Nombre de la Cátedra" className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-4 text-sm focus:outline-none" />
              <input required name="career" type="text" placeholder="Carrera / Área" className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-4 text-sm focus:outline-none" />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-xs font-bold text-[#8B5E75] uppercase">Cerrar</button>
              <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl font-cinzel text-xs font-black uppercase tracking-widest">Inaugurar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

interface DetailProps {
  subject: Subject;
  onClose: () => void;
  onUpdate: (s: Subject) => void;
  onStatusChange: (status: SubjectStatus) => void;
  isMobile: boolean;
  onMaterialUpload: () => void;
}

const SubjectDetail: React.FC<DetailProps> = ({ subject, onClose, onUpdate, onStatusChange, isMobile, onMaterialUpload }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'lab' | 'notas'>('info');
  const [loadingIa, setLoadingIa] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ia', text: string}[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'lab') scrollToBottom();
  }, [chatHistory, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleContext = (id: string) => {
    setSelectedContextIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newMaterial: StudyMaterial = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'Syllabus',
        date: new Date().toISOString(),
        content: `Contenido extraído del documento: ${file.name}`
      };
      onUpdate({ ...subject, materials: [...subject.materials, newMaterial] });
      onMaterialUpload();
    };
    reader.readAsDataURL(file);
  };

  const handleIaQuery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = queryInputRef.current?.value;
    if (!query || loadingIa) return;

    if (queryInputRef.current) queryInputRef.current.value = '';
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setLoadingIa(true);
    
    const contextStr = `
      Materia: ${subject.name}
      Materiales seleccionados: ${subject.materials.filter(m => selectedContextIds.includes(m.id)).map(m => m.name).join(', ')}
      Apuntes seleccionados: ${subject.notes.filter(n => selectedContextIds.includes(n.id)).map(n => n.title).join(', ')}
    `;
    
    const res = await geminiService.queryAcademicOracle(subject.name, query, contextStr, {});
    setChatHistory(prev => [...prev, { role: 'ia', text: res || '' }]);
    setLoadingIa(false);
  };

  const downloadDossier = () => {
    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text(`DOSSIER: ${subject.name.toUpperCase()}`, 20, 30);
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(`Carrera: ${subject.career}`, 20, 40);
    doc.text(`Profesor: ${subject.professor || 'N/A'}`, 20, 48);
    doc.text(`Email: ${subject.email || 'N/A'}`, 20, 54);
    doc.text(`Schedules: ${subject.schedules.length}`, 20, 60);
    doc.save(`Dossier_${subject.name}.pdf`);
  };

  const tabs = [
    { id: 'info', label: 'Cátedra', icon: 'book' },
    { id: 'plan', label: 'Horarios', icon: 'calendar' },
    { id: 'notas', label: 'Apuntes', icon: 'pen' },
    { id: 'lab', label: 'Mentor IA', icon: 'brain' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FFF0F5]">
      {/* Detail Header */}
      <header className="bg-white/70 border-b border-[#F8C8DC] p-4 md:p-6 shrink-0 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 text-[#8B5E75] hover:bg-[#FFD1DC] rounded-full">
               <div className="rotate-180">{getIcon('chevron', 'w-6 h-6')}</div>
            </button>
            <div className="overflow-hidden">
              <h1 className="font-cinzel text-lg md:text-2xl font-bold text-[#4A233E] truncate">{subject.name}</h1>
              <p className="text-[10px] text-[#8B5E75] uppercase font-bold tracking-widest font-inter">{subject.career}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button onClick={downloadDossier} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-white/60 border border-[#D4AF37] rounded-xl text-[10px] font-cinzel font-bold text-[#4A233E] uppercase tracking-widest">
                {getIcon('sparkles', 'w-4 h-4 text-[#D4AF37]')} PDF
              </button>
             <select 
                value={subject.status} 
                onChange={(e) => onStatusChange(e.target.value as SubjectStatus)}
                className="flex-1 sm:flex-none bg-white border border-[#D4AF37] rounded-xl px-2 py-2.5 text-[10px] font-cinzel font-bold text-[#4A233E] uppercase outline-none"
              >
                <option value="Cursando">Cursando</option>
                <option value="Final Pendiente">Pendiente</option>
                <option value="Aprobada">Aprobada</option>
              </select>
          </div>
        </div>
      </header>

      {/* Tabs Navigation (Scrollable) */}
      <nav className="bg-white/40 border-b border-[#F8C8DC] overflow-x-auto no-scrollbar shrink-0">
        <div className="max-w-7xl mx-auto flex px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] flex flex-col items-center gap-1 py-4 px-2 transition-all border-b-2 font-cinzel text-[10px] font-bold uppercase tracking-widest ${activeTab === tab.id ? 'border-[#E35B8F] text-[#E35B8F] bg-[#E35B8F]/5' : 'border-transparent text-[#8B5E75]'}`}
            >
              {getIcon(tab.icon, "w-5 h-5")}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Detail Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-sm max-w-7xl mx-auto w-full pb-24">
        
        {activeTab === 'info' && (
          <div className="space-y-6 animate-fade-in">
            <section className="glass-card p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-cinzel text-lg text-[#4A233E] mb-6 flex items-center gap-3 font-bold uppercase tracking-widest border-b pb-4">
                {getIcon('users', "w-5 h-5")} Información de Cátedra
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Profesor Titular</label>
                  <input type="text" value={subject.professor || ''} onChange={(e) => onUpdate({...subject, professor: e.target.value})} placeholder="Nombre..." className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Email / Contacto</label>
                  <input type="email" value={subject.email || ''} onChange={(e) => onUpdate({...subject, email: e.target.value})} placeholder="Email..." className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Inicio</label>
                    <input type="date" value={subject.termStart || ''} onChange={(e) => onUpdate({...subject, termStart: e.target.value})} className="w-full bg-white border border-[#F8C8DC] rounded-xl px-2 py-3 text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Fin</label>
                    <input type="date" value={subject.termEnd || ''} onChange={(e) => onUpdate({...subject, termEnd: e.target.value})} className="w-full bg-white border border-[#F8C8DC] rounded-xl px-2 py-3 text-xs outline-none" />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.doc" />
                   <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-xl border-2 border-dashed border-[#E35B8F] text-[#E35B8F] text-[10px] font-bold uppercase tracking-widest hover:bg-[#E35B8F]/5">
                     Cargar Syllabus / Guía
                   </button>
                </div>
              </div>
            </section>

            <section className="glass-card p-6 rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase tracking-widest">Cronograma de Hitos</h3>
                <button onClick={() => setShowMilestoneModal(true)} className="bg-[#E35B8F] text-white p-2 rounded-xl">
                  {getIcon('plus', "w-5 h-5")}
                </button>
              </div>
              <div className="space-y-3">
                {subject.milestones.length === 0 ? (
                  <p className="text-center italic text-[#8B5E75] py-4 text-sm opacity-50">No hay hitos registrados.</p>
                ) : (
                  subject.milestones.map(m => (
                    <div key={m.id} className="bg-white/60 p-4 rounded-xl flex items-center justify-between border-l-4 border-l-[#D4AF37] shadow-sm">
                       <div>
                          <h4 className="text-sm font-bold text-[#4A233E] uppercase">{m.title}</h4>
                          <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-widest mt-1">
                            {m.date} • {m.type}
                          </p>
                       </div>
                       <button onClick={() => onUpdate({...subject, milestones: subject.milestones.filter(mil => mil.id !== m.id)})} className="text-red-300 hover:text-red-500 p-2">
                         {getIcon('trash', 'w-5 h-5')}
                       </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'notas' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center px-2">
                <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Mis Apuntes</h3>
                <button onClick={() => { setEditingNote(null); setShowNoteModal(true); }} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl font-cinzel text-[10px] font-bold uppercase">
                  {getIcon('plus', "w-4 h-4")} Nuevo
                </button>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {subject.notes.length === 0 ? (
                  <div className="text-center py-16 bg-white/40 rounded-[2rem] border-2 border-dashed border-[#F8C8DC]">
                     <p className="font-garamond italic text-xl opacity-40">Tus páginas académicas aguardan...</p>
                  </div>
                ) : (
                  subject.notes.map(n => (
                    <div key={n.id} onClick={() => { setEditingNote(n); setShowNoteModal(true); }} className="glass-card p-6 rounded-[2rem] border-l-4 border-l-[#D4AF37] active:scale-[0.98] transition-all bg-white/60">
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase">{n.title}</h4>
                         <span className="text-[9px] text-[#8B5E75] font-black uppercase font-inter">{new Date(n.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-garamond text-[#4A233E] leading-relaxed text-lg line-clamp-2 italic opacity-80">{n.content}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="flex flex-col h-[calc(100vh-320px)] glass-card rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl border-2 border-[#D4AF37]/40 bg-white/10 relative">
            {/* RAG Sincronización */}
            <div className="bg-[#E35B8F] px-4 py-2 flex items-center justify-between text-white shadow-sm shrink-0">
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="font-marcellus text-[8px] font-black uppercase tracking-widest shrink-0">Contexto:</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {subject.materials.map(m => (
                    <button key={m.id} onClick={() => toggleContext(m.id)} className={`px-3 py-1 rounded-full text-[8px] font-bold whitespace-nowrap border transition-all ${selectedContextIds.includes(m.id) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-white/20 border-white/40'}`}>
                      📄 {m.name}
                    </button>
                  ))}
                  {subject.notes.map(n => (
                    <button key={n.id} onClick={() => toggleContext(n.id)} className={`px-3 py-1 rounded-full text-[8px] font-bold whitespace-nowrap border transition-all ${selectedContextIds.includes(n.id) ? 'bg-[#4A233E] border-[#4A233E]' : 'bg-white/20 border-white/40'}`}>
                      📝 {n.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 bg-[#FFF9FB]/60 font-garamond">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                  <div className="w-16 h-16 rounded-full border border-dashed border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-4">
                    {getIcon('chat', 'w-8 h-8')}
                  </div>
                  <h4 className="font-marcellus text-xl font-bold text-[#4A233E] mb-2 uppercase tracking-widest">Oráculo de Estudio</h4>
                  <p className="text-[#8B5E75] text-sm italic">Sincroniza fuentes arriba y pregunta cualquier duda.</p>
                </div>
              )}
                
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-md ${chat.role === 'user' ? 'bg-[#E35B8F] text-white rounded-tr-none' : 'bg-white border border-[#F8C8DC] text-[#4A233E] rounded-tl-none text-xl md:text-2xl font-garamond'}`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {loadingIa && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none animate-pulse flex items-center gap-3 border border-[#F8C8DC]">
                     <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" />
                     <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/95 border-t border-[#F8C8DC] shrink-0">
              <form onSubmit={handleIaQuery} className="flex gap-2 items-center">
                <input ref={queryInputRef} placeholder="Pregunta al Oráculo..." className="flex-1 bg-white border border-[#F8C8DC] rounded-[1.5rem] px-6 py-3 text-lg font-garamond focus:border-[#E35B8F] outline-none shadow-inner" />
                <button type="submit" disabled={loadingIa} className="w-12 h-12 bg-[#E35B8F] rounded-2xl flex items-center justify-center shadow-lg active:scale-90">
                  {loadingIa ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : getIcon('chat', 'w-6 h-6 text-white')}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Mis Horarios</h3>
              <button onClick={() => setShowScheduleModal(true)} className="bg-[#D4AF37] text-white p-3 rounded-xl shadow-md active:scale-90">
                {getIcon('plus', "w-5 h-5")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subject.schedules.length === 0 ? (
                <p className="col-span-full text-center py-12 italic opacity-40 font-garamond text-xl">Sin horarios definidos.</p>
              ) : (
                subject.schedules.map(s => (
                  <div key={s.id} className="bg-white/70 p-5 rounded-[1.5rem] flex items-center justify-between border border-[#F8C8DC]/30 shadow-sm transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="text-[#E35B8F] bg-[#E35B8F]/5 p-2 rounded-xl">{getIcon('calendar', "w-6 h-6")}</div>
                        <div>
                          <p className="text-[10px] font-bold text-[#8B5E75] uppercase tracking-widest">{s.day}</p>
                          <p className="text-lg text-[#4A233E] font-black font-inter tracking-tighter">{s.startTime} — {s.endTime}</p>
                        </div>
                     </div>
                     <button onClick={() => onUpdate({...subject, schedules: subject.schedules.filter(sched => sched.id !== s.id)})} className="text-red-300 hover:text-red-500 p-2">
                       {getIcon('trash', 'w-5 h-5')}
                     </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Internal Full-Screen Modals for Mobile */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onUpdate({...subject, milestones: [...subject.milestones, {id: Math.random().toString(36), title: fd.get('title') as string, date: fd.get('date') as string, type: fd.get('type') as any}]});
            setShowMilestoneModal(false);
          }} className="glass-card w-full max-w-sm p-8 rounded-[2rem] shadow-2xl font-inter">
            <h2 className="font-cinzel text-lg text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">Nuevo Hito</h2>
            <div className="space-y-4">
              <input required name="title" placeholder="Título..." className="w-full bg-white border border-[#F8C8DC] rounded-xl px-4 py-4 outline-none text-sm" />
              <input required name="date" type="date" className="w-full bg-white border border-[#F8C8DC] rounded-xl px-4 py-4 outline-none text-sm" />
              <select name="type" className="w-full bg-white border border-[#F8C8DC] rounded-xl px-4 py-4 outline-none text-sm">
                <option value="Examen">Examen</option><option value="Parcial">Parcial</option><option value="Entrega">Entrega</option><option value="Trabajo Práctico">TP</option>
              </select>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowMilestoneModal(false)} className="flex-1 py-4 text-xs font-bold text-[#8B5E75] uppercase">Cerrar</button>
              <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl font-cinzel text-xs font-black uppercase">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onUpdate({...subject, schedules: [...subject.schedules, {id: Math.random().toString(36), day: fd.get('day') as string, startTime: fd.get('start') as string, endTime: fd.get('end') as string}]});
            setShowScheduleModal(false);
          }} className="glass-card w-full max-w-sm p-8 rounded-[2rem] shadow-2xl font-inter">
            <h2 className="font-cinzel text-lg text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">Horario</h2>
            <div className="space-y-4">
              <select name="day" className="w-full bg-white border border-[#F8C8DC] rounded-xl px-4 py-4 outline-none text-sm">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input required name="start" type="time" className="w-full bg-white border border-[#F8C8DC] rounded-xl px-4 py-4 outline-none text-sm" />
                <input required name="end" type="time" className="w-full bg-white border border-[#F8C8DC] rounded-xl px-4 py-4 outline-none text-sm" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 text-xs font-bold text-[#8B5E75] uppercase">Cerrar</button>
              <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl font-cinzel text-xs font-black uppercase">Programar</button>
            </div>
          </form>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/80 backdrop-blur-lg p-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const title = fd.get('title') as string;
            const content = fd.get('content') as string;
            if (editingNote) {
              onUpdate({...subject, notes: subject.notes.map(n => n.id === editingNote.id ? {...n, title, content} : n)});
            } else {
              onUpdate({...subject, notes: [{id: Math.random().toString(36), title, content, date: new Date().toISOString()}, ...subject.notes]});
            }
            setShowNoteModal(false); setEditingNote(null);
          }} className="glass-card w-full max-w-4xl p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] animate-fade-in border-2 border-[#D4AF37]">
            <h2 className="font-cinzel text-xl md:text-2xl text-[#4A233E] font-bold uppercase tracking-widest border-b pb-6 mb-8">{editingNote ? 'Editar Apunte' : 'Nuevo Apunte'}</h2>
            <div className="space-y-6">
              <input required name="title" defaultValue={editingNote?.title} className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-6 py-4 text-lg font-cinzel font-bold text-[#4A233E] outline-none" placeholder="Título..." />
              <textarea required name="content" defaultValue={editingNote?.content} className="w-full bg-white/30 border-2 border-dashed border-[#F8C8DC] rounded-[2rem] p-6 text-xl font-garamond leading-relaxed text-[#4A233E] h-80 focus:outline-none focus:border-[#D4AF37] resize-none" placeholder="Escribe aquí..." />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => { setShowNoteModal(false); setEditingNote(null); }} className="flex-1 py-4 text-xs font-black text-[#8B5E75] uppercase hover:bg-white/50 rounded-xl">Descartar</button>
              <button type="submit" className="flex-[2] btn-primary py-4 rounded-xl font-cinzel text-xs font-black uppercase shadow-lg">Guardar Registro</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubjectsModule;
