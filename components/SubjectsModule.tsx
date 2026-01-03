
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
  onAddEssence?: (amount: number) => void;
}

const SubjectsModule: React.FC<SubjectsModuleProps> = ({ subjects, onAdd, onDelete, onUpdate, isMobile, onMaterialUpload, onAddEssence }) => {
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
            onAddEssence={onAddEssence}
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
  onAddEssence?: (amount: number) => void;
}

const SubjectDetail: React.FC<DetailProps> = ({ subject, onClose, onUpdate, onStatusChange, isMobile, onMaterialUpload, onAddEssence }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'lab' | 'notas'>('info');
  const [loadingIa, setLoadingIa] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ia', text: string}[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNoteFocused, setIsNoteFocused] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<StudyMaterial | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const programaInputRef = useRef<HTMLInputElement>(null);
  const contenidoInputRef = useRef<HTMLInputElement>(null);
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

  const handleProgramaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileType = file.type.includes('pdf') ? 'PDF' : 
                      file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx') ? 'Word' :
                      file.type.includes('powerpoint') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ? 'PPT' : 'Syllabus';
      
      const newMaterial: StudyMaterial = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: fileType,
        date: new Date().toISOString(),
        content: event.target?.result as string,
        category: 'programa'
      };
      
      // Si ya existe un programa, reemplazarlo
      const existingPrograma = subject.materials.find(m => m.category === 'programa');
      const otherMaterials = subject.materials.filter(m => m.category !== 'programa');
      
      onUpdate({ ...subject, materials: existingPrograma ? [...otherMaterials, newMaterial] : [...subject.materials, newMaterial] });
      onMaterialUpload();
    };
    reader.readAsDataURL(file);
  };

  const handleContenidoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileType = file.type.includes('pdf') ? 'PDF' : 
                      file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx') ? 'Word' :
                      file.type.includes('powerpoint') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ? 'PPT' : 'PDF';
      
      const newMaterial: StudyMaterial = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: fileType,
        date: new Date().toISOString(),
        content: event.target?.result as string,
        category: 'contenido'
      };
      onUpdate({ ...subject, materials: [...subject.materials, newMaterial] });
      onMaterialUpload();
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMaterial = (materialId: string) => {
    onUpdate({ ...subject, materials: subject.materials.filter(m => m.id !== materialId) });
  };

  const handleViewPdf = (material: StudyMaterial) => {
    setSelectedPdf(material);
    setShowPdfModal(true);
  };

  const handleDownloadMaterial = (material: StudyMaterial) => {
    if (material.content) {
      const link = document.createElement('a');
      link.href = material.content;
      link.download = material.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const programaMaterial = subject.materials.find(m => m.category === 'programa');
  const contenidoMaterials = subject.materials.filter(m => !m.category || m.category === 'contenido');

  const handleIaQuery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = queryInputRef.current?.value;
    if (!query || loadingIa) return;

    if (queryInputRef.current) queryInputRef.current.value = '';
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setLoadingIa(true);
    
    const selectedMaterials = subject.materials.filter(m => selectedContextIds.includes(m.id));
    const contextStr = `
      Materia: ${subject.name}
      Materiales seleccionados: ${selectedMaterials.map(m => m.name).join(', ')}
      Apuntes seleccionados: ${subject.notes.filter(n => selectedContextIds.includes(n.id)).map(n => n.title).join(', ')}
    `;
    
    const res = await geminiService.queryAcademicOracle(subject.name, query, contextStr, {});
    setChatHistory(prev => [...prev, { role: 'ia', text: res || '' }]);
    setLoadingIa(false);
  };

  const downloadDossier = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    const lineHeight = 7;
    const sectionSpacing = 10;
    
    // Colores de marca
    const plumColor = [74, 35, 62]; // #4A233E
    const goldColor = [212, 175, 55]; // #D4AF37
    
    // Función helper para dibujar línea dorada
    const drawGoldLine = (y: number) => {
      doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
    };
    
    // Función helper para agregar nueva página si es necesario
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };
    
    // ========== CABECERA ELEGANTE ==========
    doc.setFont("times", "bold");
    doc.setTextColor(plumColor[0], plumColor[1], plumColor[2]);
    doc.setFontSize(28);
    doc.text("DOSSIER ACADÉMICO", pageWidth / 2, yPos, { align: "center" });
    yPos += lineHeight * 2;
    
    doc.setFontSize(20);
    doc.text(subject.name.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += lineHeight * 1.5;
    
    drawGoldLine(yPos);
    yPos += sectionSpacing;
    
    // ========== INFORMACIÓN DE CÁTEDRA ==========
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(plumColor[0], plumColor[1], plumColor[2]);
    doc.text("INFORMACIÓN DE CÁTEDRA", margin, yPos);
    yPos += lineHeight * 1.2;
    
    drawGoldLine(yPos);
    yPos += lineHeight;
    
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    doc.text(`Carrera: ${subject.career || 'N/A'}`, margin, yPos);
    yPos += lineHeight;
    
    doc.text(`Profesor Titular: ${subject.professor || 'N/A'}`, margin, yPos);
    yPos += lineHeight;
    
    doc.text(`Email / Contacto: ${subject.email || 'N/A'}`, margin, yPos);
    yPos += lineHeight;
    
    if (subject.aula) {
      doc.text(`Aula: ${subject.aula}`, margin, yPos);
      yPos += lineHeight;
    }
    
    if (subject.termStart && subject.termEnd) {
      const startDate = new Date(subject.termStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const endDate = new Date(subject.termEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Período: ${startDate} - ${endDate}`, margin, yPos);
      yPos += lineHeight;
    }
    
    doc.text(`Estado: ${subject.status}`, margin, yPos);
    yPos += lineHeight;
    
    if (subject.grade) {
      doc.text(`Calificación Final: ${subject.grade}`, margin, yPos);
      yPos += lineHeight;
    }
    
    yPos += sectionSpacing;
    checkNewPage(sectionSpacing * 2);
    
    // ========== HORARIOS DE CURSADA ==========
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(plumColor[0], plumColor[1], plumColor[2]);
    doc.text("HORARIOS DE CURSADA", margin, yPos);
    yPos += lineHeight * 1.2;
    
    drawGoldLine(yPos);
    yPos += lineHeight;
    
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    if (subject.schedules.length === 0) {
      doc.text("Sin horarios registrados", margin, yPos);
      yPos += lineHeight;
    } else {
      subject.schedules.forEach(schedule => {
        checkNewPage(lineHeight * 2);
        doc.text(`${schedule.day}: ${schedule.startTime} - ${schedule.endTime}`, margin + 5, yPos);
        yPos += lineHeight;
      });
    }
    
    yPos += sectionSpacing;
    checkNewPage(sectionSpacing * 2);
    
    // ========== FECHAS IMPORTANTES ==========
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(plumColor[0], plumColor[1], plumColor[2]);
    doc.text("FECHAS IMPORTANTES", margin, yPos);
    yPos += lineHeight * 1.2;
    
    drawGoldLine(yPos);
    yPos += lineHeight;
    
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    if (subject.milestones.length === 0) {
      doc.text("No hay hitos registrados", margin, yPos);
      yPos += lineHeight;
    } else {
      subject.milestones.forEach(milestone => {
        checkNewPage(lineHeight * 3);
        const milestoneDate = new Date(milestone.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.setFont("times", "bold");
        doc.text(`${milestone.title}`, margin + 5, yPos);
        yPos += lineHeight * 0.8;
        doc.setFont("times", "normal");
        doc.text(`  Fecha: ${milestoneDate} | Tipo: ${milestone.type}`, margin + 5, yPos);
        yPos += lineHeight * 1.2;
      });
    }
    
    yPos += sectionSpacing;
    checkNewPage(sectionSpacing * 2);
    
    // ========== ÍNDICE DE APUNTES ==========
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(plumColor[0], plumColor[1], plumColor[2]);
    doc.text("ÍNDICE DE APUNTES", margin, yPos);
    yPos += lineHeight * 1.2;
    
    drawGoldLine(yPos);
    yPos += lineHeight;
    
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    if (subject.notes.length === 0) {
      doc.text("No hay apuntes registrados", margin, yPos);
      yPos += lineHeight;
    } else {
      // Ordenar notas por fecha (más recientes primero)
      const sortedNotes = [...subject.notes].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      sortedNotes.forEach((note, index) => {
        checkNewPage(lineHeight * 2);
        const noteDate = new Date(note.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`${index + 1}. ${note.title}`, margin + 5, yPos);
        yPos += lineHeight * 0.8;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`   ${noteDate}`, margin + 5, yPos);
        yPos += lineHeight * 1.2;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
      });
    }
    
    // Guardar el PDF
    doc.save(`Dossier_${subject.name.replace(/\s+/g, '_')}.pdf`);
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
                {getIcon('sparkles', 'w-4 h-4 text-[#D4AF37]')} Dossier
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Profesor Titular</label>
                  <input type="text" value={subject.professor || ''} onChange={(e) => onUpdate({...subject, professor: e.target.value})} placeholder="Nombre..." className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Email / Contacto</label>
                  <input type="email" value={subject.email || ''} onChange={(e) => onUpdate({...subject, email: e.target.value})} placeholder="Email..." className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75]">Aula</label>
                  <input type="text" value={subject.aula || ''} onChange={(e) => onUpdate({...subject, aula: e.target.value})} placeholder="Aula donde está cursando..." className="w-full bg-white/40 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm outline-none" />
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
              </div>
              
              <div className="border-t border-[#F8C8DC] pt-6">
                <h4 className="font-cinzel text-sm text-[#4A233E] mb-4 flex items-center gap-2 font-bold uppercase tracking-widest">
                  {getIcon('book', "w-4 h-4")} Programa / Syllabus
                </h4>
                <div className="space-y-4">
                  {programaMaterial ? (
                    <div className="bg-white/60 p-4 rounded-xl flex items-center justify-between border-l-4 border-l-[#D4AF37] shadow-sm">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-[#D4AF37]">{getIcon('book', 'w-6 h-6')}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#4A233E] truncate">{programaMaterial.name}</h4>
                          <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-widest mt-1">
                            {new Date(programaMaterial.date).toLocaleDateString()} • {programaMaterial.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(programaMaterial.type === 'PDF' || programaMaterial.content) && (
                          <button onClick={() => handleViewPdf(programaMaterial)} className="text-[#D4AF37] hover:text-[#4A233E] p-2" title="Leer">
                            {getIcon('eye', 'w-5 h-5')}
                          </button>
                        )}
                        <button onClick={() => handleDownloadMaterial(programaMaterial)} className="text-[#4A233E] hover:text-[#E35B8F] p-2" title="Descargar">
                          {getIcon('download', 'w-5 h-5')}
                        </button>
                        <button onClick={() => programaInputRef.current?.click()} className="text-[#8B5E75] hover:text-[#D4AF37] p-2" title="Reemplazar">
                          {getIcon('edit', 'w-5 h-5')}
                        </button>
                        <button onClick={() => handleDeleteMaterial(programaMaterial.id)} className="text-red-300 hover:text-red-500 p-2" title="Eliminar">
                          {getIcon('trash', 'w-5 h-5')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-[#F8C8DC] rounded-xl">
                      <p className="text-sm text-[#8B5E75] mb-4 italic opacity-50">No hay programa cargado</p>
                      <input type="file" ref={programaInputRef} className="hidden" onChange={handleProgramaUpload} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                      <button onClick={() => programaInputRef.current?.click()} className="px-6 py-3 rounded-xl border-2 border-dashed border-[#E35B8F] text-[#E35B8F] text-[10px] font-bold uppercase tracking-widest hover:bg-[#E35B8F]/5">
                        Agregar Programa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="glass-card p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-cinzel text-lg text-[#4A233E] mb-6 flex items-center gap-3 font-bold uppercase tracking-widest border-b pb-4">
                {getIcon('sparkles', "w-5 h-5")} Contenido de la Asignatura
              </h3>
              <div className="space-y-3 mb-4">
                {contenidoMaterials.length === 0 ? (
                  <p className="text-center italic text-[#8B5E75] py-4 text-sm opacity-50">No hay contenido agregado.</p>
                ) : (
                  contenidoMaterials.map(m => (
                    <div key={m.id} className="bg-white/60 p-4 rounded-xl flex items-center justify-between border-l-4 border-l-[#E35B8F] shadow-sm">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-[#E35B8F]">{getIcon('file', 'w-6 h-6')}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#4A233E] truncate">{m.name}</h4>
                          <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-widest mt-1">
                            {new Date(m.date).toLocaleDateString()} • {m.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(m.type === 'PDF' || m.content) && (
                          <button onClick={() => handleViewPdf(m)} className="text-[#D4AF37] hover:text-[#4A233E] p-2" title="Leer">
                            {getIcon('eye', 'w-5 h-5')}
                          </button>
                        )}
                        <button onClick={() => handleDownloadMaterial(m)} className="text-[#4A233E] hover:text-[#E35B8F] p-2" title="Descargar">
                          {getIcon('download', 'w-5 h-5')}
                        </button>
                        <button onClick={() => handleDeleteMaterial(m.id)} className="text-red-300 hover:text-red-500 p-2" title="Eliminar">
                          {getIcon('trash', 'w-5 h-5')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <input type="file" ref={contenidoInputRef} className="hidden" onChange={handleContenidoUpload} accept=".pdf,.doc,.docx,.ppt,.pptx" />
              <button onClick={() => contenidoInputRef.current?.click()} className="w-full py-3 rounded-xl border-2 border-dashed border-[#E35B8F] text-[#E35B8F] text-[10px] font-bold uppercase tracking-widest hover:bg-[#E35B8F]/5">
                {getIcon('plus', 'w-4 h-4 inline mr-2')} Agregar Contenido (PDF/Word/PPT)
              </button>
            </section>

          </div>
        )}

        {activeTab === 'notas' && (
          <div className={`space-y-6 animate-fade-in transition-all duration-500 ${isNoteFocused ? 'scale-105 opacity-95' : ''}`}>
            {/* Header con búsqueda */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
              <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest">Cuaderno de Foco Profundo</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  placeholder="Buscar en apuntes..."
                  className="flex-1 sm:flex-none sm:w-64 bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-2 text-sm outline-none"
                />
                <button 
                  onClick={() => setShowImportantOnly(!showImportantOnly)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${showImportantOnly ? 'bg-[#D4AF37] text-white' : 'bg-white/60 text-[#8B5E75]'}`}
                >
                  {getIcon('sparkles', 'w-4 h-4 inline mr-1')} Importantes
                </button>
                <button 
                  onClick={() => { 
                    setEditingNote(null); 
                    setShowNoteModal(true); 
                    setIsNoteFocused(true);
                  }} 
                  className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl font-cinzel text-[10px] font-bold uppercase"
                >
                  {getIcon('plus', "w-4 h-4")} Nueva Clase
                </button>
              </div>
            </div>

            {/* Línea de Tiempo Vertical */}
            <div className="relative">
              {subject.notes
                .filter(n => {
                  const matchesSearch = !noteSearchQuery || 
                    n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
                    n.content.toLowerCase().includes(noteSearchQuery.toLowerCase());
                  const matchesImportant = !showImportantOnly || (n.importantFragments && n.importantFragments.length > 0);
                  return matchesSearch && matchesImportant;
                })
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((n, idx) => {
                  const noteDate = new Date(n.date);
                  const isToday = noteDate.toDateString() === new Date().toDateString();
                  return (
                    <div key={n.id} className="relative flex gap-6 mb-8">
                      {/* Línea de tiempo vertical */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isToday ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-white/60 border-[#F8C8DC]'}`}>
                          {getIcon('calendar', 'w-6 h-6 text-[#4A233E]')}
                        </div>
                        {idx < subject.notes.length - 1 && (
                          <div className="w-0.5 h-full bg-gradient-to-b from-[#F8C8DC] to-transparent mt-2 min-h-[80px]" />
                        )}
                      </div>
                      
                      {/* Contenido de la nota */}
                      <div 
                        onClick={() => { setEditingNote(n); setShowNoteModal(true); setIsNoteFocused(true); }} 
                        className="flex-1 glass-card p-6 rounded-[2rem] border-l-4 border-l-[#D4AF37] active:scale-[0.98] transition-all bg-white/60 cursor-pointer hover:shadow-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase mb-1">{n.title}</h4>
                            <span className="text-[9px] text-[#8B5E75] font-black uppercase font-inter">
                              {isToday ? 'Hoy' : noteDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {n.isSealed && (
                              <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded-full font-bold uppercase">
                                {getIcon('sparkles', 'w-3 h-3 inline mr-1')} Sellada
                              </span>
                            )}
                            {n.importantFragments && n.importantFragments.length > 0 && (
                              <span className="text-[8px] bg-[#E35B8F]/20 text-[#E35B8F] px-2 py-1 rounded-full font-bold uppercase">
                                {n.importantFragments.length} Importante{n.importantFragments.length > 1 ? 's' : ''}
                              </span>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(n);
                              }}
                              className="text-red-300 hover:text-red-500 p-1"
                              title="Eliminar"
                            >
                              {getIcon('trash', 'w-4 h-4')}
                            </button>
                          </div>
                        </div>
                        <p className="font-garamond text-[#4A233E] leading-relaxed text-base line-clamp-3 italic opacity-80">{n.content}</p>
                      </div>
                    </div>
                  );
                })}
              
              {subject.notes.length === 0 && (
                <div className="text-center py-16 bg-white/40 rounded-[2rem] border-2 border-dashed border-[#F8C8DC]">
                  <p className="font-garamond italic text-xl opacity-40">Tu cuaderno académico aguarda su primera página...</p>
                </div>
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
                  {subject.materials.filter(m => m.category === 'contenido').map(m => (
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
            <section className="glass-card p-6 rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase tracking-widest">Cronograma de exámenes y otras fechas</h3>
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

            <section className="glass-card p-6 rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase tracking-widest">Horarios de cursada</h3>
                <button onClick={() => setShowScheduleModal(true)} className="bg-[#D4AF37] text-white p-2 rounded-xl">
                  {getIcon('plus', "w-5 h-5")}
                </button>
              </div>
              <div className="space-y-3">
                {subject.schedules.length === 0 ? (
                  <p className="text-center italic text-[#8B5E75] py-4 text-sm opacity-50">Sin horarios definidos.</p>
                ) : (
                  subject.schedules.map(s => (
                    <div key={s.id} className="bg-white/60 p-4 rounded-xl flex items-center justify-between border-l-4 border-l-[#E35B8F] shadow-sm">
                       <div>
                          <h4 className="text-sm font-bold text-[#4A233E] uppercase">{s.day}</h4>
                          <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-widest mt-1">
                            {s.startTime} — {s.endTime}
                          </p>
                       </div>
                       <button onClick={() => onUpdate({...subject, schedules: subject.schedules.filter(sched => sched.id !== s.id)})} className="text-red-300 hover:text-red-500 p-2">
                         {getIcon('trash', 'w-5 h-5')}
                       </button>
                    </div>
                  ))
                )}
              </div>
            </section>
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
        <NoteEditorModal
          subject={subject}
          note={editingNote}
          onClose={() => { 
            setShowNoteModal(false); 
            setEditingNote(null); 
            setIsNoteFocused(false);
          }}
          onSave={(note) => {
            if (editingNote) {
              onUpdate({...subject, notes: subject.notes.map(n => n.id === editingNote.id ? note : n)});
            } else {
              onUpdate({...subject, notes: [note, ...subject.notes]});
            }
            setShowNoteModal(false);
            setEditingNote(null);
            setIsNoteFocused(false);
          }}
          onSeal={(note) => {
            const sealedNote = {...note, isSealed: true};
            if (editingNote) {
              onUpdate({...subject, notes: subject.notes.map(n => n.id === editingNote.id ? sealedNote : n)});
            } else {
              onUpdate({...subject, notes: [sealedNote, ...subject.notes]});
            }
            if (onAddEssence) {
              onAddEssence(3);
            }
            setShowNoteModal(false);
            setEditingNote(null);
            setIsNoteFocused(false);
          }}
          onFocusChange={setIsNoteFocused}
        />
      )}

      {noteToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4">
          <div className="glass-card max-w-sm w-full p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-center shadow-2xl">
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-4 font-bold uppercase tracking-widest">¿Eliminar Apunte?</h2>
            <p className="text-sm text-[#8B5E75] mb-8 font-garamond italic">Se perderá permanentemente "{noteToDelete.title}".</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onUpdate({...subject, notes: subject.notes.filter(note => note.id !== noteToDelete.id)});
                  setNoteToDelete(null);
                }} 
                className="bg-red-500 text-white w-full py-4 rounded-2xl font-cinzel text-xs font-bold uppercase"
              >
                ELIMINAR
              </button>
              <button 
                onClick={() => setNoteToDelete(null)} 
                className="text-[#8B5E75] w-full py-3 rounded-2xl font-inter text-xs font-bold uppercase"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfModal && selectedPdf && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-[#4A233E]/95 backdrop-blur-lg">
          <div className="bg-white/90 border-b border-[#F8C8DC] p-4 flex justify-between items-center shrink-0">
            <h2 className="font-cinzel text-lg text-[#4A233E] font-bold uppercase">{selectedPdf.name}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => handleDownloadMaterial(selectedPdf)} className="px-4 py-2 bg-[#D4AF37] text-white rounded-xl text-[10px] font-bold uppercase">
                {getIcon('download', 'w-4 h-4 inline mr-2')} Descargar
              </button>
              <button onClick={() => { setShowPdfModal(false); setSelectedPdf(null); }} className="p-2 text-[#8B5E75] hover:bg-[#FFD1DC] rounded-full">
                {getIcon('close', 'w-6 h-6')}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-white">
            {selectedPdf.type === 'PDF' && selectedPdf.content ? (
              <iframe 
                src={selectedPdf.content} 
                className="w-full h-full min-h-[600px] border-0 rounded-xl"
                title={selectedPdf.name}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-[#8B5E75] text-lg mb-4">Este tipo de archivo no se puede visualizar en el navegador.</p>
                  <button onClick={() => handleDownloadMaterial(selectedPdf)} className="btn-primary px-6 py-3 rounded-xl font-cinzel text-sm">
                    Descargar para ver
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface NoteEditorModalProps {
  subject: Subject;
  note: Note | null;
  onClose: () => void;
  onSave: (note: Note) => void;
  onSeal: (note: Note) => void;
  onFocusChange: (focused: boolean) => void;
}

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ subject, note, onClose, onSave, onSeal, onFocusChange }) => {
  const [title, setTitle] = useState(note?.title || `Clase de ${subject.name} - ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  const [content, setContent] = useState(note?.content || '');
  const [importantFragments, setImportantFragments] = useState<string[]>(note?.importantFragments || []);
  const [selectedText, setSelectedText] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onFocusChange(true);
    return () => onFocusChange(false);
  }, [onFocusChange]);

  useEffect(() => {
    // Auto-guardado silencioso cada 3 segundos después de dejar de escribir
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (content.trim() && title.trim()) {
        const autoSavedNote: Note = {
          id: note?.id || Math.random().toString(36),
          title,
          content,
          date: note?.date || new Date().toISOString(),
          importantFragments,
          isSealed: note?.isSealed || false,
        };
        // Auto-guardar silenciosamente (sin cerrar el modal)
        // Esto se haría con una función de auto-guardado separada
      }
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, title, importantFragments]);

  const handleTextSelection = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    
    if (selected.trim()) {
      setSelectedText(selected);
      const rect = textarea.getBoundingClientRect();
      const scrollTop = textarea.scrollTop;
      const lineHeight = 32; // Aproximadamente el line-height
      const lineNumber = Math.floor((textarea.selectionStart - content.substring(0, start).split('\n').length) / 50);
      
      setToolbarPosition({
        top: rect.top + (lineNumber * lineHeight) - 50,
        left: rect.left + 20,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const handleMarkImportant = () => {
    if (selectedText && !importantFragments.includes(selectedText)) {
      setImportantFragments([...importantFragments, selectedText]);
    }
    setShowToolbar(false);
    setSelectedText('');
  };

  const handleInsertBullet = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + '• ' + content.substring(start);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
    setShowToolbar(false);
  };

  const handleInsertQuote = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + `"${selected}"` + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1 + selected.length);
    }, 0);
    setShowToolbar(false);
  };

  const handleSave = () => {
    const newNote: Note = {
      id: note?.id || Math.random().toString(36),
      title,
      content,
      date: note?.date || new Date().toISOString(),
      importantFragments,
      isSealed: note?.isSealed || false,
    };
    onSave(newNote);
  };

  const handleSeal = () => {
    const newNote: Note = {
      id: note?.id || Math.random().toString(36),
      title,
      content,
      date: note?.date || new Date().toISOString(),
      importantFragments,
      isSealed: true,
    };
    onSeal(newNote);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/90 backdrop-blur-lg p-4 transition-all duration-500">
      <div className="glass-card w-full max-w-5xl h-[90vh] flex flex-col rounded-[2rem] md:rounded-[3rem] animate-fade-in border-2 border-[#D4AF37] overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 border-b border-[#F8C8DC] p-4 flex justify-between items-center shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg font-cinzel font-bold text-[#4A233E] uppercase"
            placeholder="Título de la clase..."
          />
          <button onClick={onClose} className="p-2 text-[#8B5E75] hover:bg-[#FFD1DC] rounded-full">
            {getIcon('close', 'w-6 h-6')}
          </button>
        </div>

        {/* Lienzo de Escritura con Líneas de Cuaderno */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-[#FFF9FB] to-[#FDF2F7]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 31px,
                rgba(139, 94, 117, 0.1) 31px,
                rgba(139, 94, 117, 0.1) 32px
              )`,
            }}
          />
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleTextSelection}
            onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
            className="absolute inset-0 w-full h-full bg-transparent border-none outline-none p-8 font-garamond text-[20px] leading-[1.6] text-[#4A233E] resize-none"
            placeholder="Escribe tus apuntes aquí... El conocimiento se consagra con cada palabra."
            style={{ fontFamily: "'EB Garamond', serif" }}
          />
        </div>

        {/* Barra de Herramientas Flotante */}
        {showToolbar && (
          <div
            className="fixed z-[500] bg-[#D4AF37] rounded-xl shadow-2xl p-2 flex items-center gap-2 animate-fade-in"
            style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}
          >
            <button
              onClick={handleMarkImportant}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              title="Marcar como importante"
            >
              {getIcon('sparkles', 'w-5 h-5 text-white')}
            </button>
            <button
              onClick={handleInsertBullet}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white font-bold"
              title="Lista de viñetas"
            >
              •
            </button>
            <button
              onClick={handleInsertQuote}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white font-bold"
              title="Cita literal"
            >
              "
            </button>
          </div>
        )}

        {/* Footer con acciones */}
        <div className="bg-white/80 border-t border-[#F8C8DC] p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {importantFragments.length > 0 && (
              <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full font-bold uppercase">
                {getIcon('sparkles', 'w-3 h-3 inline mr-1')} {importantFragments.length} Fragmento{importantFragments.length > 1 ? 's' : ''} Importante{importantFragments.length > 1 ? 's' : ''}
              </span>
            )}
            {note?.isSealed && (
              <span className="text-[10px] bg-[#4A233E]/20 text-[#4A233E] px-3 py-1 rounded-full font-bold uppercase">
                {getIcon('sparkles', 'w-3 h-3 inline mr-1')} Consagrada al Oráculo
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-xs font-black text-[#8B5E75] uppercase hover:bg-white/50 rounded-xl transition-all"
            >
              Descartar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-[#E35B8F] text-white rounded-xl font-cinzel text-xs font-black uppercase shadow-lg hover:bg-[#D14A7A] transition-all"
            >
              Guardar
            </button>
            {!note?.isSealed && (
              <button
                onClick={handleSeal}
                className="px-6 py-3 bg-[#D4AF37] text-white rounded-xl font-cinzel text-xs font-black uppercase shadow-lg hover:bg-[#C19D2E] transition-all flex items-center gap-2"
              >
                {getIcon('sparkles', 'w-4 h-4')} Sellar Nota (+3 Esencia)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectsModule;
