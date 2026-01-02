
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
      if (selectedSubjectId === subjectToDelete.id) {
        setSelectedSubjectId(null);
      }
      setSubjectToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-2">
        <div>
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#4A233E]">Laboratorio de Saberes</h1>
          <p className="text-sm text-[#8B5E75] font-inter">Tu legado intelectual en construcción activa.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-cinzel text-xs font-bold shadow-lg"
        >
          {getIcon('plus', 'w-4 h-4')}
          Inaugurar Cátedra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {subjects.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <p className="font-garamond italic text-lg">Inicia tu camino registrando tu primera asignatura.</p>
          </div>
        )}
        {subjects.map(subject => (
          <div 
            key={subject.id} 
            className={`glass-card p-5 md:p-6 rounded-[2.5rem] cursor-pointer transition-all duration-300 hover:scale-[1.02] border-l-4 group relative ${subject.status === 'Aprobada' ? 'border-l-[#D4AF37]' : 'border-l-[#E35B8F]'}`}
            onClick={() => setSelectedSubjectId(subject.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[8px] uppercase font-bold px-3 py-1 rounded-full font-inter tracking-wider ${subject.status === 'Aprobada' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#E35B8F]/10 text-[#E35B8F]'}`}>
                {subject.status}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSubjectToDelete(subject); }}
                className="text-[#8B5E75] hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              >
                {getIcon('trash', 'w-4 h-4')}
              </button>
            </div>
            <h3 className="font-cinzel text-lg md:text-xl text-[#4A233E] mb-1 truncate font-bold">{subject.name}</h3>
            <p className="text-xs text-[#8B5E75] font-garamond italic">{subject.career}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-[#D4AF37] font-bold font-inter">
                 {getIcon('sparkles', 'w-3 h-3')}
                 <span>{subject.materials.length} Materiales</span>
              </div>
              <div className="text-[#E35B8F] group-hover:translate-x-1 transition-transform">{getIcon('chevron', 'w-4 h-4')}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedSubject && (
        <div className="fixed inset-0 z-[150] bg-[#FFF0F5] overflow-hidden animate-in slide-in-from-right duration-500">
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
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-6">
          <div className="glass-card max-w-sm w-full p-8 md:p-10 rounded-[3rem] text-center shadow-2xl animate-in zoom-in duration-300">
             <h2 className="font-cinzel text-xl text-[#4A233E] mb-4 font-bold uppercase tracking-widest">¿Confirmar Destrucción?</h2>
             <p className="text-sm text-[#8B5E75] mb-8 font-garamond italic">Estás a punto de borrar los registros de "{subjectToDelete.name}".</p>
             <div className="flex flex-col gap-3">
               <button onClick={executeDelete} className="bg-red-500 text-white w-full py-3.5 rounded-2xl font-cinzel text-xs font-bold uppercase shadow-lg shadow-red-100">ELIMINAR ASIGNATURA</button>
               <button onClick={() => setSubjectToDelete(null)} className="text-[#8B5E75] w-full py-2.5 rounded-2xl font-inter text-xs font-bold uppercase">CANCELAR</button>
             </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#E35B8F]/30 backdrop-blur-md p-6">
          <div className="glass-card max-w-sm w-full p-8 md:p-12 rounded-[3rem] text-center shadow-2xl animate-in zoom-in duration-500">
             <h2 className="font-cinzel text-3xl text-[#4A233E] mb-2 font-bold tracking-widest uppercase">¡TRIUNFO!</h2>
             <div className="mb-8">
               <label className="block text-[10px] uppercase font-bold text-[#8B5E75] mb-2 font-inter tracking-widest">Nota de Excelencia (0-10)</label>
               <input type="number" step="0.1" value={finalGrade} onChange={(e) => setFinalGrade(e.target.value)} className="w-full text-center bg-white/60 border border-[#D4AF37] rounded-xl px-4 py-3 font-inter text-2xl text-[#4A233E] outline-none shadow-inner" placeholder="0.0" />
             </div>
             <button onClick={submitFinalGrade} className="btn-primary w-full py-4 rounded-2xl font-cinzel text-xs tracking-widest font-black uppercase shadow-lg shadow-pink-200">SELLAR VICTORIA (+50 ESENCIA)</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAdd} className="glass-card w-full max-w-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">REGISTRAR SABIDURÍA</h2>
            <div className="space-y-4 font-inter">
              <input required name="name" type="text" placeholder="Nombre de la Cátedra" className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:outline-none" />
              <input required name="career" type="text" placeholder="Carrera / Área" className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:outline-none" />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-bold text-[#8B5E75] uppercase font-inter">Cerrar</button>
              <button type="submit" className="flex-[2] btn-primary py-3 rounded-xl font-cinzel text-xs font-black uppercase tracking-widest">Inaugurar</button>
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
    if (activeTab === 'lab') {
      scrollToBottom();
    }
  }, [chatHistory, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleContext = (id: string) => {
    setSelectedContextIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleIaQuery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = queryInputRef.current?.value;
    if (!query || loadingIa) return;

    if (queryInputRef.current) queryInputRef.current.value = '';
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setLoadingIa(true);
    
    const contextStr = `
      --- SYLLABUS Y CONTEXTO ---
      Asignatura: ${subject.name} - ${subject.career}.
      Profesor: ${subject.professor || 'No especificado'} (${subject.email || 'No email'}).
      
      --- APUNTES SELECCIONADOS ---
      ${subject.notes.filter(n => selectedContextIds.includes(n.id)).map(n => `TEMA: ${n.title}\nCONTENIDO: ${n.content}`).join('\n\n')}
      
      --- MATERIALES Y PDFS ---
      ${subject.materials.filter(m => selectedContextIds.includes(m.id)).map(m => `Archivo: ${m.name}`).join('\n')}
    `;
    
    const res = await geminiService.queryAcademicOracle(subject.name, query, contextStr, { mood: 'Enfocada' });
    setChatHistory(prev => [...prev, { role: 'ia', text: res || '' }]);
    setLoadingIa(false);
  };

  const addMilestone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMilestone: Milestone = {
      id: Math.random().toString(36).substring(7),
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      type: formData.get('type') as any
    };
    onUpdate({ ...subject, milestones: [newMilestone, ...subject.milestones] });
    setShowMilestoneModal(false);
  };

  const addSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSchedule: Schedule = {
      id: Math.random().toString(36).substring(7),
      day: formData.get('day') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
    };
    onUpdate({ ...subject, schedules: [...subject.schedules, newSchedule] });
    setShowScheduleModal(false);
  };

  const saveNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    if (editingNote) {
      const updatedNotes = subject.notes.map(n => n.id === editingNote.id ? { ...n, title, content } : n);
      onUpdate({ ...subject, notes: updatedNotes });
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substring(7),
        title: title || `Clase de ${subject.name} - ${new Date().toLocaleDateString()}`,
        content,
        date: new Date().toISOString()
      };
      onUpdate({ ...subject, notes: [newNote, ...subject.notes] });
    }
    setShowNoteModal(false);
    setEditingNote(null);
  };

  const downloadDossier = () => {
    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text(`DOSSIER ACADÉMICO: ${subject.name.toUpperCase()}`, 20, 30);
    
    doc.setFontSize(12);
    doc.setFont("times", "italic");
    doc.text(`${subject.career} • Studianta Sanctuary`, 20, 38);
    
    doc.line(20, 42, 190, 42);
    
    doc.setFont("times", "bold");
    doc.text("Información de Cátedra", 20, 52);
    doc.setFont("times", "normal");
    doc.text(`Profesor: ${subject.professor || 'No asignado'}`, 25, 60);
    doc.text(`Email: ${subject.email || 'No asignado'}`, 25, 66);
    doc.text(`Aula: ${subject.room || 'No asignado'}`, 25, 72);

    let y = 85;
    if (subject.schedules.length > 0) {
      doc.setFont("times", "bold");
      doc.text("Horarios de Cursada", 20, y);
      y += 8;
      doc.setFont("times", "normal");
      subject.schedules.forEach(s => {
        doc.text(`• ${s.day}: ${s.startTime} - ${s.endTime}`, 25, y);
        y += 6;
      });
      y += 6;
    }

    if (subject.milestones.length > 0) {
      doc.setFont("times", "bold");
      doc.text("Exámenes e Hitos", 20, y);
      y += 8;
      doc.setFont("times", "normal");
      subject.milestones.forEach(m => {
        doc.text(`• ${m.title} (${m.date}) - ${m.type}`, 25, y);
        y += 6;
      });
      y += 6;
    }

    doc.setFont("times", "bold");
    doc.text("Apuntes Registrados", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    subject.notes.forEach(n => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("times", "bold");
      doc.text(`${n.title}`, 25, y);
      y += 6;
      doc.setFont("times", "normal");
      const splitContent = doc.splitTextToSize(n.content, 160);
      doc.text(splitContent, 30, y);
      y += (splitContent.length * 5) + 5;
    });

    doc.save(`Dossier_${subject.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#FFF0F5] to-[#FDEEF4] flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="bg-white/40 border-b border-[#F8C8DC] p-4 md:p-8 shrink-0 backdrop-blur-md z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 text-[#8B5E75] hover:bg-[#FFD1DC] rounded-full transition-all">
               <div className="rotate-180">{getIcon('chevron', 'w-6 h-6')}</div>
            </button>
            <div>
              <h1 className="font-cinzel text-2xl md:text-4xl font-bold text-[#4A233E] tracking-tight">{subject.name}</h1>
              <p className="text-xs text-[#8B5E75] uppercase font-bold tracking-widest font-inter">{subject.career}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button 
                onClick={downloadDossier}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/60 border-2 border-[#D4AF37] rounded-xl text-[10px] font-cinzel font-bold text-[#4A233E] uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-all shadow-sm h-[42px]"
              >
                {getIcon('sparkles', 'w-4 h-4 text-[#D4AF37]')} Dossier PDF
              </button>
             <select 
                value={subject.status} 
                onChange={(e) => onStatusChange(e.target.value as SubjectStatus)}
                className="flex-1 md:flex-none bg-white/80 border border-[#D4AF37] rounded-xl px-4 py-2.5 text-[10px] font-cinzel font-bold text-[#4A233E] uppercase tracking-widest outline-none shadow-sm h-[42px]"
              >
                <option value="Cursando">Cursando</option>
                <option value="Final Pendiente">Final Pendiente</option>
                <option value="Aprobada">Aprobada</option>
              </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-[100vw] mx-auto w-full p-4 md:p-8 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full flex-1 min-h-0">
          
          {/* Sidebar de Navegación */}
          <div className="lg:col-span-2 space-y-2 overflow-y-auto no-scrollbar">
            {[
              { id: 'info', label: 'Cátedra', icon: 'book' },
              { id: 'plan', label: 'Horarios', icon: 'calendar' },
              { id: 'notas', label: 'Apuntes', icon: 'pen' },
              { id: 'lab', label: 'Mentor IA', icon: 'brain' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-cinzel text-xs tracking-widest uppercase font-bold ${activeTab === tab.id ? 'bg-[#E35B8F] text-white shadow-xl shadow-pink-200 translate-x-2' : 'bg-white/40 text-[#8B5E75] hover:bg-white/60'}`}
              >
                {getIcon(tab.icon, "w-5 h-5")}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Área de Contenido Principal */}
          <div className="lg:col-span-10 flex flex-col h-full min-h-0 font-inter">
            
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500 overflow-y-auto pr-2 scroll-sm h-full pb-20">
                <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC] shadow-lg">
                  <h3 className="font-cinzel text-xl text-[#4A233E] mb-6 flex items-center gap-3 font-bold uppercase tracking-widest">
                    {getIcon('users', "w-6 h-6")} Datos de Cátedra
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Profesor Titular</label>
                      <input 
                        type="text" value={subject.professor || ''} 
                        onChange={(e) => onUpdate({...subject, professor: e.target.value})}
                        placeholder="Nombre del docente..."
                        className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Email de Contacto</label>
                      <input 
                        type="email" value={subject.email || ''} 
                        onChange={(e) => onUpdate({...subject, email: e.target.value})}
                        placeholder="profesor@universidad.edu"
                        className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Teléfono / Despacho</label>
                      <input 
                        type="text" value={subject.phone || ''} 
                        onChange={(e) => onUpdate({...subject, phone: e.target.value})}
                        placeholder="+54 9 1234 5678"
                        className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Aula / Ubicación</label>
                      <input 
                        type="text" value={subject.room || ''} 
                        onChange={(e) => onUpdate({...subject, room: e.target.value})}
                        placeholder="Aula 302, Edificio A"
                        className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC] shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Exámenes e Hitos</h3>
                    <button onClick={() => setShowMilestoneModal(true)} className="bg-[#E35B8F] text-white p-2 rounded-xl hover:scale-110 shadow-md transition-all">
                      {getIcon('plus', "w-5 h-5")}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {subject.milestones.length === 0 ? (
                      <p className="text-center italic text-[#8B5E75] py-6 font-garamond opacity-50">Sin hitos registrados.</p>
                    ) : (
                      subject.milestones.map(m => (
                        <div key={m.id} className="bg-white/60 p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#D4AF37] shadow-sm">
                          <div>
                            <h4 className="text-sm font-bold text-[#4A233E] uppercase">{m.title}</h4>
                            <p className="text-[10px] text-[#8B5E75] uppercase tracking-widest font-black">
                              {new Date(m.date).toLocaleDateString()} {m.time ? `@ ${m.time}` : ''} • {m.type}
                            </p>
                          </div>
                          <button onClick={() => onUpdate({...subject, milestones: subject.milestones.filter(mil => mil.id !== m.id)})} className="text-[#8B5E75] hover:text-red-500 p-2 transition-opacity">
                            {getIcon('trash', 'w-4 h-4')}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC] shadow-lg animate-in slide-in-from-bottom duration-500 overflow-y-auto pr-2 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Horarios de Cursada</h3>
                  <button onClick={() => setShowScheduleModal(true)} className="bg-[#D4AF37] text-white p-2 rounded-xl hover:scale-110 shadow-md transition-all">
                    {getIcon('plus', "w-5 h-5")}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subject.schedules.length === 0 ? (
                    <p className="col-span-full text-center py-12 italic opacity-50 font-garamond text-2xl">Sin horarios definidos.</p>
                  ) : (
                    subject.schedules.map(s => (
                      <div key={s.id} className="bg-white/60 p-5 rounded-xl flex items-center justify-between border border-[#F8C8DC] shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="text-[#E35B8F] bg-[#E35B8F]/5 p-2.5 rounded-xl">{getIcon('calendar', "w-5 h-5")}</div>
                            <div>
                              <p className="text-sm font-bold text-[#4A233E] uppercase tracking-widest">{s.day}</p>
                              <p className="text-xl text-[#4A233E] font-black font-inter">{s.startTime} - {s.endTime}</p>
                            </div>
                         </div>
                         <button onClick={() => onUpdate({...subject, schedules: subject.schedules.filter(sched => sched.id !== s.id)})} className="text-[#8B5E75] hover:text-red-500 p-2">
                           {getIcon('trash', 'w-4 h-4')}
                         </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notas' && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500 overflow-y-auto pr-2 scroll-sm h-full pb-20">
                 <div className="flex justify-between items-center px-4">
                    <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Apuntes Académicos</h3>
                    <button onClick={() => { setEditingNote(null); setShowNoteModal(true); }} className="btn-primary flex items-center gap-2 px-8 py-2.5 rounded-xl font-cinzel text-[10px] font-bold uppercase shadow-lg">
                      {getIcon('plus', "w-4 h-4")} Iniciar Apunte
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                    {subject.notes.length === 0 ? (
                      <div className="text-center py-20 bg-white/40 rounded-[3rem] border-2 border-dashed border-[#F8C8DC]">
                         <p className="font-garamond italic text-3xl opacity-40">Las páginas aguardan tus revelaciones.</p>
                      </div>
                    ) : (
                      subject.notes.map(n => (
                        <div key={n.id} onClick={() => { setEditingNote(n); setShowNoteModal(true); }} className="glass-card p-10 rounded-[3rem] hover:shadow-2xl transition-all border-l-8 border-l-[#D4AF37] group cursor-pointer relative overflow-hidden bg-white/60">
                          <div className="flex justify-between items-start mb-6">
                             <h4 className="font-cinzel text-2xl text-[#4A233E] font-bold uppercase tracking-tight">{n.title}</h4>
                             <span className="text-xs text-[#8B5E75] font-black uppercase">{new Date(n.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                          </div>
                          <p className="font-garamond text-[#4A233E] leading-relaxed text-2xl line-clamp-3 italic opacity-90">{n.content}</p>
                          <div className="mt-8 pt-6 border-t border-[#F8C8DC]/40 flex justify-between items-center">
                             <div className="flex items-center gap-3 text-xs text-[#D4AF37] font-bold uppercase tracking-widest">
                                {getIcon('sparkles', 'w-4 h-4')} Sincronizado
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); onUpdate({...subject, notes: subject.notes.filter(note => note.id !== n.id)}); }} className="text-xs text-red-500 font-black uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                               Eliminar
                             </button>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'lab' && (
              <div className="flex-1 flex flex-col h-full min-h-0 glass-card rounded-[4rem] overflow-hidden shadow-2xl border-2 border-[#D4AF37]/40 bg-white/10 animate-in slide-in-from-bottom duration-500">
                {/* Ribbon de Fuentes */}
                <div className="bg-[#E35B8F] px-10 py-4 flex items-center justify-between text-white shadow-sm shrink-0">
                  <div className="flex items-center gap-6 overflow-hidden">
                    <span className="font-marcellus text-sm font-black uppercase tracking-[0.25em] shrink-0">Sincronía:</span>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                      {subject.materials.filter(m => selectedContextIds.includes(m.id)).map(m => (
                        <span key={m.id} className="bg-white/25 px-5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border border-white/20">📄 {m.name}</span>
                      ))}
                      {subject.notes.filter(n => selectedContextIds.includes(n.id)).map(n => (
                        <span key={n.id} className="bg-white/25 px-5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border border-white/20">📝 {n.title}</span>
                      ))}
                      {selectedContextIds.length === 0 && <span className="text-[11px] italic opacity-80">Sincroniza para iniciar el Oráculo...</span>}
                    </div>
                  </div>
                  <button onClick={() => setShowMilestoneModal(true)} className="w-10 h-10 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all shrink-0 ml-4">
                    {getIcon('plus', 'w-5 h-5')}
                  </button>
                </div>

                {/* Título */}
                <div className="bg-[#4A233E] p-6 text-white flex justify-between items-center shadow-xl border-b border-[#D4AF37]/40 shrink-0">
                  <div className="flex items-center gap-4">
                    {getIcon('brain', "w-8 h-8 text-[#D4AF37]")}
                    <span className="font-marcellus text-lg tracking-[0.35em] font-black uppercase">Oráculo Académico Maestro</span>
                  </div>
                </div>
                  
                {/* Ventana de Diálogo */}
                <div className="flex-1 p-10 overflow-y-auto space-y-10 bg-[#FFF9FB]/70 relative z-10 font-garamond">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-16 opacity-60">
                      <div className="w-28 h-28 rounded-full border-4 border-dashed border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-8 animate-pulse">
                        {getIcon('chat', 'w-12 h-12')}
                      </div>
                      <h4 className="font-marcellus text-3xl font-bold text-[#4A233E] mb-4 uppercase tracking-[0.25em]">Cámara de Revelación</h4>
                      <p className="text-[#8B5E75] text-2xl leading-relaxed max-w-3xl">"Invoca la sabiduría de tus pergaminos sincronizados."</p>
                    </div>
                  )}
                    
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-700`}>
                      <div className={`max-w-[92%] p-10 rounded-[4rem] shadow-2xl ${chat.role === 'user' ? 'bg-[#E35B8F] text-white rounded-tr-none' : 'bg-white/95 border border-[#F8C8DC] text-[#4A233E] rounded-tl-none text-2xl leading-relaxed'}`}>
                        {chat.text.split('\n').map((line, lidx) => (
                          <p key={lidx} className={line.startsWith('📌') || line.startsWith('📖') || line.startsWith('💡') || line.startsWith('📚') || line.startsWith('❓') ? 'font-black font-marcellus text-[#E35B8F] mt-8 mb-4 tracking-[0.25em] text-[15px] uppercase border-b border-[#F8C8DC] pb-1 inline-block' : 'mb-3'}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                    
                  {loadingIa && (
                    <div className="flex justify-start">
                      <div className="bg-white/80 p-8 rounded-[4rem] rounded-tl-none animate-pulse flex items-center gap-4 border border-[#F8C8DC]">
                         <div className="w-4 h-4 bg-[#D4AF37] rounded-full animate-bounce shadow-[0_0_15px_#D4AF37]" />
                         <div className="w-4 h-4 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_15px_#D4AF37]" />
                         <div className="w-4 h-4 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_15px_#D4AF37]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Maestro */}
                <div className="p-10 bg-white/95 border-t border-[#F8C8DC] shadow-inner shrink-0">
                  <form onSubmit={handleIaQuery} className="flex gap-6 items-center max-w-7xl mx-auto">
                    <input ref={queryInputRef} name="query" placeholder="Invoca la sabiduría del Oráculo..." disabled={loadingIa} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIaQuery(e as any); } }} className="flex-1 bg-white border-4 border-[#F8C8DC]/50 rounded-[3rem] px-12 py-6 text-2xl font-garamond focus:border-[#E35B8F] outline-none shadow-inner transition-all disabled:opacity-50 text-[#4A233E]" />
                    <button type="submit" disabled={loadingIa} className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all ${loadingIa ? 'bg-[#D4AF37]/50' : 'bg-[#E35B8F] hover:scale-105 active:scale-90'}`}>
                      {loadingIa ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : getIcon('chat', 'w-10 h-10 text-white')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selector de Contexto IA */}
      {showMilestoneModal && (activeTab === 'lab') && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#4A233E]/80 backdrop-blur-xl p-4">
          <div className="glass-card w-full max-w-xl p-12 rounded-[4rem] animate-in zoom-in duration-500 border-2 border-[#D4AF37]">
            <h2 className="font-marcellus text-2xl text-[#4A233E] mb-8 text-center font-bold tracking-[0.3em] uppercase">Vínculo de Sabiduría</h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 scroll-sm">
               <p className="text-[12px] uppercase font-black tracking-[0.3em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3">Pergaminos de Cátedra</p>
               {subject.materials.map(m => (
                 <button key={m.id} onClick={() => toggleContext(m.id)} className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${selectedContextIds.includes(m.id) ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-lg' : 'bg-white/40 text-[#4A233E] border-[#F8C8DC]'}`}>
                   📄 {m.name}
                 </button>
               ))}
               <p className="text-[12px] uppercase font-black tracking-[0.3em] text-[#8B5E75] border-b border-[#F8C8DC] pt-8 pb-3">Registros de Apunte</p>
               {subject.notes.map(n => (
                 <button key={n.id} onClick={() => toggleContext(n.id)} className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${selectedContextIds.includes(n.id) ? 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-lg' : 'bg-white/40 text-[#4A233E] border-[#F8C8DC]'}`}>
                   📝 {n.title}
                 </button>
               ))}
            </div>
            <button onClick={() => setShowMilestoneModal(false)} className="btn-primary w-full py-5 mt-10 rounded-[2.5rem] font-marcellus text-sm font-black uppercase tracking-[0.4em] shadow-2xl">
              Consagrar Sincronía
            </button>
          </div>
        </div>
      )}

      {/* Modal Horario */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={addSchedule} className="glass-card w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">Definir Horario</h2>
            <div className="space-y-4 font-inter font-bold text-[#4A233E]">
              <select name="day" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input required name="startTime" type="time" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
                <input required name="endTime" type="time" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-xs font-bold text-[#8B5E75] uppercase hover:bg-white/50 rounded-xl">Cerrar</button>
              <button type="submit" className="flex-[2] btn-primary py-3 rounded-xl font-cinzel text-xs font-black uppercase tracking-widest">Programar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Apunte */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/80 backdrop-blur-lg p-4">
          <form onSubmit={saveNote} className="glass-card w-full max-w-5xl p-12 rounded-[5rem] animate-in zoom-in duration-500 border-2 border-[#D4AF37]" style={{ background: 'linear-gradient(to bottom right, #FFF9FB, #FDF2F7)' }}>
            <div className="flex justify-between items-center mb-10 border-b-2 border-[#F8C8DC] pb-6">
               <h2 className="font-cinzel text-3xl text-[#4A233E] font-bold uppercase tracking-[0.3em]">{editingNote ? 'Refinar Saber' : 'Trascender la Lección'}</h2>
               <div className="text-[12px] font-black font-inter text-[#D4AF37] uppercase tracking-[0.4em]">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
            <div className="space-y-8 font-inter">
              <input required name="title" defaultValue={editingNote?.title || `Clase de ${subject.name} - ${new Date().toLocaleDateString()}`} className="w-full bg-white/60 border-2 border-[#F8C8DC] rounded-[2rem] px-8 py-5 text-2xl focus:border-[#E35B8F] outline-none font-bold text-[#4A233E] font-cinzel shadow-inner" placeholder="Título del Pergamino..." />
              <textarea required name="content" defaultValue={editingNote?.content || ''} className="w-full bg-white/30 border-2 border-dashed border-[#F8C8DC] rounded-[3rem] p-10 text-3xl font-garamond leading-relaxed text-[#4A233E] h-96 focus:outline-none focus:border-[#D4AF37] resize-none shadow-sm" placeholder="Canaliza tu conocimiento aquí..." />
            </div>
            <div className="flex gap-8 mt-12">
              <button type="button" onClick={() => { setShowNoteModal(false); setEditingNote(null); }} className="flex-1 py-5 text-sm font-black text-[#8B5E75] uppercase tracking-[0.4em] hover:bg-[#FDEEF4] rounded-[2rem] transition-all">Descartar</button>
              <button type="submit" className="flex-[2] btn-primary py-5 rounded-[2rem] font-cinzel text-sm font-black uppercase tracking-[0.5em] shadow-2xl">
                {editingNote ? 'Actualizar Registro' : 'Sellar en Grimorio (+3 Mérito)'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubjectsModule;
