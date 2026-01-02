
import React, { useState, useRef } from 'react';
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

  const triggerDelete = (e: React.MouseEvent, subject: Subject) => {
    e.stopPropagation();
    setSubjectToDelete(subject);
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
                onClick={(e) => triggerDelete(e, subject)}
                className="text-[#8B5E75] hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                title="Eliminar Asignatura"
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

      {/* Detail View */}
      {selectedSubject && (
        <div className="fixed inset-0 z-[150] bg-[#FFF0F5] overflow-y-auto overflow-x-hidden animate-in slide-in-from-right duration-500">
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

      {/* custom Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-6">
          <div className="glass-card max-w-sm w-full p-8 md:p-10 rounded-[3rem] text-center shadow-2xl animate-in zoom-in duration-300 border-red-200">
             <div className="mb-6 flex justify-center text-red-500">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  {getIcon('trash', 'w-8 h-8')}
                </div>
             </div>
             <h2 className="font-cinzel text-xl text-[#4A233E] mb-4 font-bold uppercase tracking-widest">¿Confirmar Destrucción?</h2>
             <p className="text-sm text-[#8B5E75] mb-8 font-garamond italic leading-relaxed">
                Estás a punto de borrar los registros de <span className="font-bold text-[#4A233E]">"{subjectToDelete.name}"</span>. Esta acción eliminará permanentemente toda la sabiduría acumulada en el Atanor.
             </p>
             
             <div className="flex flex-col gap-3">
               <button 
                 onClick={executeDelete}
                 className="bg-red-500 text-white w-full py-3.5 rounded-2xl font-cinzel text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
               >
                 ELIMINAR ASIGNATURA
               </button>
               <button 
                 onClick={() => setSubjectToDelete(null)}
                 className="text-[#8B5E75] w-full py-2.5 rounded-2xl font-inter text-xs font-bold uppercase tracking-widest hover:bg-[#F8C8DC]/30 transition-all"
               >
                 PRESERVAR CONOCIMIENTO
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#E35B8F]/30 backdrop-blur-md p-6">
          <div className="glass-card max-w-sm w-full p-8 md:p-12 rounded-[3rem] text-center shadow-2xl animate-in zoom-in duration-500">
             <div className="mb-6 flex justify-center">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shadow-inner">
                 {getIcon('sparkles', 'w-8 h-8 md:w-10 md:h-10 animate-pulse')}
               </div>
             </div>
             <h2 className="font-cinzel text-3xl text-[#4A233E] mb-2 font-bold tracking-widest uppercase">¡TRIUNFO!</h2>
             <p className="text-sm text-[#8B5E75] mb-8 font-garamond italic">Has dominado los misterios de esta asignatura con gran voluntad.</p>
             
             <div className="mb-8">
               <label className="block text-[10px] uppercase font-bold text-[#8B5E75] mb-2 font-inter tracking-widest">Nota de Excelencia (0-10)</label>
               <input 
                 type="number" 
                 step="0.1" 
                 value={finalGrade}
                 onChange={(e) => setFinalGrade(e.target.value)}
                 className="w-full text-center bg-white/60 border border-[#D4AF37] rounded-xl px-4 py-3 font-inter text-2xl text-[#4A233E] focus:outline-none"
                 placeholder="0.0"
               />
             </div>

             <button 
               onClick={submitFinalGrade}
               className="btn-primary w-full py-4 rounded-2xl font-cinzel text-xs tracking-widest font-black uppercase shadow-lg shadow-pink-200"
             >
               SELLAR VICTORIA (+50 ESENCIA)
             </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAdd} className="glass-card w-full max-w-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">REGISTRAR SABIDURÍA</h2>
            <div className="space-y-4 font-inter">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-2 px-1">Nombre de la Cátedra</label>
                <input required name="name" type="text" placeholder="Ej: Metafísica de la Estética" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E35B8F] text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-2 px-1">Carrera / Área</label>
                <input required name="career" type="text" placeholder="Ej: Diseño y Bellas Artes" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 focus:outline-none focus:border-[#E35B8F] text-sm" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-bold text-[#8B5E75] hover:bg-[#FFD1DC] rounded-xl transition-colors uppercase font-inter">Cerrar</button>
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
  
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'info', label: 'Cátedra', icon: 'book' },
    { id: 'plan', label: 'Horarios', icon: 'calendar' },
    { id: 'notas', label: 'Notas', icon: 'pen' },
    { id: 'lab', label: 'Lab IA', icon: 'brain' },
  ];

  const handleIaQuery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get('query') as string;
    if (!query) return;

    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setLoadingIa(true);
    
    const context = `
      Asignatura: ${subject.name}.
      Contenido de Notas: ${subject.notes.map(n => `${n.title}: ${n.content}`).join('\n')}.
      Materiales cargados: ${subject.materials.map(m => m.name).join(', ')}.
    `;
    
    const res = await geminiService.queryLaboratory(query, context);
    setChatHistory(prev => [...prev, { role: 'ia', text: res || 'El Atanor está procesando...' }]);
    setLoadingIa(false);
    e.currentTarget.reset();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newMaterial: StudyMaterial = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: 'PDF',
        date: new Date().toISOString()
      };
      onUpdate({ ...subject, materials: [newMaterial, ...subject.materials] });
      onMaterialUpload();
    }
  };

  const generateDossier = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFontSize(22);
    doc.setTextColor(74, 35, 62); 
    doc.text('Dossier Académico: ' + subject.name, margin, y);
    y += 12;
    
    doc.setFontSize(14);
    doc.setTextColor(139, 94, 117);
    doc.text(subject.career, margin, y);
    y += 18;

    doc.setFontSize(16);
    doc.setTextColor(74, 35, 62);
    doc.text('Datos de Cátedra', margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Profesor: ${subject.professor || 'No especificado'}`, margin, y); y += 6;
    doc.text(`Email: ${subject.email || 'No especificado'}`, margin, y); y += 6;
    doc.text(`Aula: ${subject.room || 'No especificada'}`, margin, y); y += 6;
    doc.text(`Cursada: ${subject.termStart || '?'} hasta ${subject.termEnd || '?'}`, margin, y); y += 15;

    doc.setFontSize(16);
    doc.setTextColor(74, 35, 62);
    doc.text('Hitos y Exámenes', margin, y);
    y += 10;
    doc.setFontSize(10);
    if (subject.milestones.length === 0) {
      doc.text('Sin hitos registrados.', margin, y); y += 12;
    } else {
      subject.milestones.forEach(m => {
        doc.text(`- ${m.title} (${m.type}): ${m.date} ${m.time || ''}`, margin, y);
        y += 7;
      });
      y += 8;
    }

    doc.setFontSize(16);
    doc.setTextColor(74, 35, 62);
    doc.text('Horarios de Cursada', margin, y);
    y += 10;
    doc.setFontSize(10);
    if (subject.schedules.length === 0) {
      doc.text('Sin horarios registrados.', margin, y); y += 12;
    } else {
      subject.schedules.forEach(s => {
        doc.text(`- ${s.day}: ${s.startTime} - ${s.endTime}`, margin, y);
        y += 7;
      });
      y += 12;
    }

    doc.setFontSize(16);
    doc.setTextColor(74, 35, 62);
    doc.text('Bitácora Académica', margin, y);
    y += 10;
    doc.setFontSize(10);
    if (subject.notes.length === 0) {
      doc.text('Sin notas registradas.', margin, y); y += 10;
    } else {
      subject.notes.forEach(n => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text(`${n.title} (${new Date(n.date).toLocaleDateString()})`, margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(n.content, 170);
        doc.text(splitText, margin, y);
        y += (splitText.length * 6) + 8;
      });
    }

    doc.save(`Dossier_${subject.name.replace(/\s+/g, '_')}.pdf`);
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
    onUpdate({ ...subject, schedules: [newSchedule, ...subject.schedules] });
    setShowScheduleModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] to-[#FDEEF4]">
      {/* Sticky Header */}
      <div className="bg-white/40 border-b border-[#F8C8DC] p-4 md:p-8 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                onClick={generateDossier}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-2xl font-cinzel text-[10px] font-bold uppercase shadow-md transition-all hover:scale-105 active:scale-95"
             >
               {getIcon('book', 'w-4 h-4')} Descargar Dossier
             </button>
             <select 
                value={subject.status} 
                onChange={(e) => onStatusChange(e.target.value as SubjectStatus)}
                className="flex-1 md:flex-none bg-white/80 border border-[#D4AF37] rounded-xl px-4 py-2.5 text-[10px] font-cinzel font-bold text-[#4A233E] uppercase tracking-widest font-inter"
              >
                <option value="Cursando">Cursando</option>
                <option value="Final Pendiente">Final Pendiente</option>
                <option value="Aprobada">Aprobada</option>
              </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-8">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map(tab => (
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

        {/* Content Area */}
        <div className="lg:col-span-9 animate-in slide-in-from-bottom duration-500 font-inter">
          
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC]">
                <h3 className="font-cinzel text-xl text-[#4A233E] mb-6 flex items-center gap-3 font-bold">
                  {getIcon('users', "w-6 h-6")} Datos de Cátedra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Profesor Titular</label>
                    <input 
                      type="text" value={subject.professor || ''} 
                      onChange={(e) => onUpdate({...subject, professor: e.target.value})}
                      placeholder="Nombre del docente..."
                      className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Correo Electrónico</label>
                    <input 
                      type="email" value={subject.email || ''} 
                      onChange={(e) => onUpdate({...subject, email: e.target.value})}
                      placeholder="docente@universidad.edu"
                      className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Aula / Ubicación</label>
                    <input 
                      type="text" value={subject.room || ''} 
                      onChange={(e) => onUpdate({...subject, room: e.target.value})}
                      placeholder="Aula 304, Edificio B..."
                      className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 gap-6 pt-4 border-t border-[#F8C8DC]/30">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Inicio de Cursada</label>
                      <input 
                        type="date" value={subject.termStart || ''} 
                        onChange={(e) => onUpdate({...subject, termStart: e.target.value})}
                        className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest">Fin de Cursada</label>
                      <input 
                        type="date" value={subject.termEnd || ''} 
                        onChange={(e) => onUpdate({...subject, termEnd: e.target.value})}
                        className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none mt-1 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones inside info */}
              <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Exámenes y Hitos</h3>
                    <button 
                      onClick={() => setShowMilestoneModal(true)}
                      className="bg-[#E35B8F] text-white p-2 rounded-xl hover:scale-110 transition-transform shadow-md shadow-pink-100"
                    >
                      {getIcon('plus', "w-5 h-5")}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {subject.milestones.length === 0 ? (
                      <p className="text-center py-10 font-garamond italic opacity-50">No hay hitos trazados en esta línea temporal.</p>
                    ) : (
                      subject.milestones.map(m => (
                        <div key={m.id} className="bg-white/60 p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-[#D4AF37] group hover:bg-white/80 transition-all">
                           <div>
                             <h4 className="text-sm font-bold text-[#4A233E]">{m.title}</h4>
                             <p className="text-[10px] text-[#8B5E75] font-inter uppercase tracking-widest font-bold">
                               {new Date(m.date).toLocaleDateString('es-ES', { dateStyle: 'long' })} {m.time ? `@ ${m.time}` : ''} • {m.type}
                             </p>
                           </div>
                           <button 
                             onClick={() => onUpdate({...subject, milestones: subject.milestones.filter(mil => mil.id !== m.id)})}
                             className="text-[#8B5E75] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                           >
                             {getIcon('trash', 'w-4 h-4')}
                           </button>
                        </div>
                      ))
                    )}
                  </div>
               </div>

              <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Repositorio de Saberes</h3>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-inter font-bold text-[#E35B8F] flex items-center gap-2 hover:underline uppercase tracking-widest"
                  >
                    {getIcon('plus', "w-4 h-4")} Subir Material (+5 Esencia)
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subject.materials.length === 0 ? (
                    <p className="col-span-full text-center py-10 italic text-[#8B5E75] font-garamond opacity-50">Aún no has cargado materiales de estudio.</p>
                  ) : (
                    subject.materials.map(m => (
                      <div key={m.id} className="bg-white/60 p-4 rounded-2xl flex items-center justify-between border border-[#F8C8DC] hover:border-[#D4AF37] transition-all group">
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                               {getIcon('book', "w-5 h-5")}
                            </div>
                            <div className="overflow-hidden">
                               <p className="text-xs font-bold text-[#4A233E] truncate">{m.name}</p>
                               <p className="text-[8px] text-[#8B5E75] uppercase font-inter font-bold tracking-widest">{m.type} • {new Date(m.date).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => onUpdate({...subject, materials: subject.materials.filter(mat => mat.id !== m.id)})}
                            className="text-[#8B5E75] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                          >
                            {getIcon('trash', "w-4 h-4")}
                          </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-8">
               <div className="glass-card p-8 rounded-[3rem] border-[#F8C8DC]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Horarios de Cursada</h3>
                    <button 
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-[#D4AF37] text-white p-2 rounded-xl hover:scale-110 transition-transform shadow-md shadow-amber-100"
                    >
                      {getIcon('plus', "w-5 h-5")}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-inter">
                    {subject.schedules.length === 0 ? (
                      <p className="col-span-full text-center py-10 font-garamond italic opacity-50">Configura tus días y horarios de clase.</p>
                    ) : (
                      subject.schedules.map(s => (
                        <div key={s.id} className="bg-white/60 p-4 rounded-xl flex items-center justify-between border border-[#F8C8DC] group hover:border-[#D4AF37] transition-all">
                           <div className="flex items-center gap-3">
                              <div className="text-[#E35B8F] bg-[#E35B8F]/5 p-2 rounded-lg">{getIcon('calendar', "w-4 h-4")}</div>
                              <div>
                                <p className="text-xs font-bold text-[#4A233E] uppercase tracking-widest">{s.day}</p>
                                <p className="text-[10px] text-[#8B5E75] font-bold">{s.startTime} - {s.endTime}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => onUpdate({...subject, schedules: subject.schedules.filter(sched => sched.id !== s.id)})}
                             className="text-[#8B5E75] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                           >
                             {getIcon('trash', 'w-4 h-4')}
                           </button>
                        </div>
                      ))
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center px-4">
                  <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Bitácora Académica</h3>
                  <button className="btn-primary flex items-center gap-2 px-6 py-2 rounded-xl font-cinzel text-[10px] font-bold uppercase shadow-md active:scale-95">
                    {getIcon('plus', "w-4 h-4")} Nueva Crónica
                  </button>
               </div>
               <div className="grid grid-cols-1 gap-6 font-inter">
                  {subject.notes.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 rounded-[3rem] border-2 border-dashed border-[#F8C8DC]">
                       <p className="font-garamond italic text-lg opacity-40">Las páginas aguardan tus revelaciones académicas.</p>
                    </div>
                  ) : (
                    subject.notes.map(n => (
                      <div key={n.id} className="glass-card p-8 rounded-[3rem] hover:shadow-xl transition-all border-l-4 border-l-[#F8C8DC]">
                        <div className="flex justify-between items-start mb-4">
                           <h4 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase tracking-tight">{n.title}</h4>
                           <span className="text-[9px] text-[#8B5E75] font-bold uppercase font-inter">{new Date(n.date).toLocaleDateString()}</span>
                        </div>
                        <p className="font-garamond text-[#8B5E75] leading-relaxed whitespace-pre-wrap text-sm">{n.content}</p>
                        <div className="mt-6 pt-4 border-t border-[#F8C8DC]/30 flex gap-4">
                           <button className="text-[10px] text-[#E35B8F] font-bold uppercase hover:underline tracking-widest">Editar</button>
                           <button 
                             onClick={() => onUpdate({...subject, notes: subject.notes.filter(note => note.id !== n.id)})}
                             className="text-[10px] text-red-400 font-bold uppercase hover:underline tracking-widest"
                           >
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
            <div className="flex flex-col h-[600px] glass-card rounded-[3rem] overflow-hidden shadow-2xl relative border-2 border-[#D4AF37]/30 font-inter">
              <div className="bg-[#4A233E] p-4 text-white flex justify-between items-center shadow-lg">
                 <div className="flex items-center gap-3">
                   {getIcon('brain', "w-5 h-5 text-[#D4AF37]")}
                   <span className="font-cinzel text-xs tracking-[0.2em] font-bold uppercase">Mentor del Atanor</span>
                 </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-6 font-inter bg-white/10">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-10">
                    <div className="w-16 h-16 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-4">
                      {getIcon('chat', 'w-8 h-8 animate-pulse')}
                    </div>
                    <h4 className="font-cinzel text-sm font-bold text-[#4A233E] mb-2 uppercase tracking-widest">Consulta al Oráculo</h4>
                    <p className="font-garamond italic text-[#8B5E75] text-sm">
                      "Utiliza el conocimiento destilado en tus notas y materiales para desentrañar cualquier enigma académico."
                    </p>
                  </div>
                )}
                
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${chat.role === 'user' ? 'bg-[#E35B8F] text-white rounded-tr-none' : 'bg-white/80 border border-[#F8C8DC] text-[#4A233E] rounded-tl-none font-inter text-sm leading-relaxed'}`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                
                {loadingIa && (
                  <div className="flex justify-start">
                    <div className="bg-white/40 p-5 rounded-2xl rounded-tl-none animate-pulse h-16 w-24 flex items-center justify-center">
                       <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-[#E35B8F] rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-[#E35B8F] rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-[#E35B8F] rounded-full animate-bounce [animation-delay:0.4s]" />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleIaQuery} className="p-4 bg-white/60 border-t border-[#F8C8DC] flex gap-3">
                <input 
                  name="query" 
                  placeholder="¿En qué misterio debo profundizar hoy?..." 
                  className="flex-1 bg-white border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#E35B8F] font-inter shadow-inner" 
                />
                <button type="submit" className="btn-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group shrink-0">
                  {getIcon('chat', 'w-6 h-6 group-hover:scale-110 transition-transform')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={addMilestone} className="glass-card w-full max-w-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 font-inter">
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">Programar Hito</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Nombre del Evento</label>
                <input required name="title" type="text" placeholder="Ej: Primer Parcial" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Fecha</label>
                  <input required name="date" type="date" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Hora</label>
                  <input name="time" type="time" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Tipo</label>
                <select name="type" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none">
                  <option value="Examen">Examen</option>
                  <option value="Entrega">Entrega</option>
                  <option value="Parcial">Parcial</option>
                  <option value="Trabajo Práctico">Trabajo Práctico</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowMilestoneModal(false)} className="flex-1 py-3 text-xs font-bold text-[#8B5E75] uppercase">Cancelar</button>
              <button type="submit" className="flex-[2] btn-primary py-3 rounded-2xl font-cinzel text-xs font-bold uppercase tracking-widest">Añadir</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/60 backdrop-blur-sm p-4">
          <form onSubmit={addSchedule} className="glass-card w-full max-w-md p-6 md:p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 font-inter">
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-6 text-center font-bold tracking-widest uppercase">Definir Horario</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Día de la semana</label>
                <select name="day" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none">
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Desde</label>
                  <input required name="startTime" type="time" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#8B5E75] mb-1">Hasta</label>
                  <input required name="endTime" type="time" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:border-[#E35B8F] outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-xs font-bold text-[#8B5E75] uppercase">Cancelar</button>
              <button type="submit" className="flex-[2] btn-primary py-3 rounded-2xl font-cinzel text-xs font-bold uppercase tracking-widest">Programar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubjectsModule;
