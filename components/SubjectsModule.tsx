
import React, { useState, useRef, useEffect } from 'react';
import { Subject, SubjectStatus, Milestone, Note, StudyMaterial, Schedule, StudentProfileContext } from '../types';
import { getIcon, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import OracleTextRenderer from './OracleTextRenderer';
import { addSealToPDF } from '../utils/pdfSeal';
import { processMarkdownToHTML } from '../utils/markdownProcessor';
import PetAnimation from './PetAnimation';

// Importación dinámica de html2canvas para evitar problemas con esbuild
let html2canvas: any;
const loadHtml2Canvas = async () => {
  if (!html2canvas) {
    const module = await import('html2canvas');
    html2canvas = module.default || module;
  }
  return html2canvas;
};

interface SubjectsModuleProps {
  subjects: Subject[];
  onAdd: (name: string, career: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (subject: Subject) => void;
  isMobile: boolean;
  onMaterialUpload: () => void;
  studentProfileContext?: StudentProfileContext;
  isNightMode?: boolean;
}

const SubjectsModule: React.FC<SubjectsModuleProps> = ({ subjects, onAdd, onDelete, onUpdate, isMobile, onMaterialUpload, studentProfileContext, isNightMode = false }) => {
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
          <h1 className={`font-cinzel text-2xl md:text-4xl font-bold transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>Laboratorio de Saberes</h1>
          <p className={`text-xs md:text-sm font-inter transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>Tu legado intelectual en construcción.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-cinzel text-xs sm:text-sm font-bold shadow-lg min-h-[48px] touch-manipulation active:scale-95"
        >
          {getIcon('plus', 'w-5 h-5')}
          Inaugurar Asignatura
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
            className={`p-5 sm:p-6 md:p-6 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] cursor-pointer transition-all duration-300 active:scale-95 border-l-4 group relative touch-manipulation min-h-[140px] backdrop-blur-[15px] ${
              isNightMode 
                ? subject.status === 'Aprobada' 
                  ? 'bg-[rgba(48,43,79,0.6)] border-l-[#A68A56] shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                  : 'bg-[rgba(48,43,79,0.6)] border-l-[#C77DFF] shadow-[0_0_20px_rgba(199,125,255,0.2)]'
                : subject.status === 'Aprobada' 
                  ? 'glass-card border-l-[#D4AF37]' 
                  : 'glass-card border-l-[#E35B8F]'
            }`}
            onClick={() => setSelectedSubjectId(subject.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[8px] md:text-[9px] uppercase font-bold px-3 py-1 rounded-full font-inter tracking-wider ${subject.status === 'Aprobada' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#E35B8F]/10 text-[#E35B8F]'}`}>
                {subject.status}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSubjectToDelete(subject); }}
                className={`transition-colors duration-500 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg touch-manipulation ${
                  isNightMode 
                    ? 'text-[#7A748E] hover:text-red-400 active:bg-red-900/20' 
                    : 'text-[#8B5E75] hover:text-red-500 active:bg-red-50'
                }`}
                aria-label="Eliminar asignatura"
              >
                {getIcon('trash', 'w-5 h-5')}
              </button>
            </div>
            <h3 className={`font-cinzel text-lg md:text-xl mb-1 truncate font-bold transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>{subject.name}</h3>
            <p className={`text-xs font-garamond italic transition-colors duration-500 ${
              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
            }`}>{subject.career}</p>
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
        <div className={`fixed inset-0 z-[200] overflow-hidden flex flex-col transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
        }`}>
          <SubjectDetail 
            subject={selectedSubject} 
            onClose={() => setSelectedSubjectId(null)} 
            onUpdate={onUpdate}
            onStatusChange={handleStatusChange}
            isMobile={isMobile}
            onMaterialUpload={onMaterialUpload}
            studentProfileContext={studentProfileContext}
            isNightMode={isNightMode}
          />
        </div>
      )}

      {subjectToDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4" onClick={() => setSubjectToDelete(null)}>
          <div className={`max-w-sm w-full p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-center shadow-2xl backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card'
          }`} onClick={(e) => e.stopPropagation()}>
             <h2 className={`font-cinzel text-xl mb-4 font-bold uppercase tracking-widest transition-colors duration-500 ${
               isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
             }`}>¿Borrar Asignatura?</h2>
             <p className={`text-sm mb-8 font-garamond italic transition-colors duration-500 ${
               isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
             }`}>Se perderán todos los registros de "{subjectToDelete.name}".</p>
             <div className="flex flex-col gap-3">
               <button onClick={executeDelete} className="bg-red-500 text-white w-full py-4 rounded-2xl font-cinzel text-xs font-bold uppercase">ELIMINAR</button>
               <button onClick={() => setSubjectToDelete(null)} className={`w-full py-3 rounded-2xl font-inter text-xs font-bold uppercase transition-colors duration-500 ${
                 isNightMode ? 'text-[#7A748E] hover:text-[#E0E1DD]' : 'text-[#8B5E75]'
               }`}>CANCELAR</button>
             </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className={`fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-md p-4 transition-colors duration-500 ${
          isNightMode ? 'bg-[#C77DFF]/20' : 'bg-[#E35B8F]/30'
        }`} onClick={() => setShowCelebration(false)}>
          <div className={`max-w-sm w-full p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] text-center shadow-2xl mx-4 backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card'
          }`} onClick={(e) => e.stopPropagation()}>
             <h2 className={`font-cinzel text-2xl sm:text-3xl mb-4 font-bold uppercase tracking-widest transition-colors duration-500 ${
               isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
             }`}>¡TRIUNFO!</h2>
             <div className="mb-6 sm:mb-8">
               <label className={`block text-xs sm:text-[10px] uppercase font-bold mb-3 font-inter transition-colors duration-500 ${
                 isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
               }`}>Nota Obtenida</label>
               <input 
                 type="number" 
                 step="0.1" 
                 value={finalGrade} 
                 onChange={(e) => setFinalGrade(e.target.value)} 
                 className={`w-full text-center border-2 rounded-xl px-4 py-4 font-inter text-2xl sm:text-3xl outline-none min-h-[56px] transition-colors duration-500 ${
                   isNightMode 
                     ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56] text-[#E0E1DD] focus:border-[#C77DFF]' 
                     : 'bg-white/60 border-[#D4AF37] text-[#4A233E] focus:border-[#D4AF37]'
                 }`} 
                 placeholder="0.0"
                 autoFocus
               />
             </div>
             <button 
               onClick={submitFinalGrade} 
               className="btn-primary w-full py-4 rounded-xl sm:rounded-2xl font-cinzel text-sm sm:text-xs tracking-widest font-black uppercase shadow-lg min-h-[48px] touch-manipulation active:scale-95"
             >
               GUARDAR NOTA
             </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm p-4 safe-area-inset transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-[#4A233E]/60'
        }`} onClick={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className={`w-full max-w-md p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-cinzel text-lg sm:text-xl mb-6 text-center font-bold tracking-widest uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>REGISTRAR ASIGNATURA</h2>
            <div className="space-y-4 font-inter">
              <input 
                required 
                name="name" 
                type="text" 
                placeholder="Nombre de la Asignatura" 
                className={`w-full border-2 rounded-xl px-4 py-4 text-base focus:outline-none min-h-[48px] transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]' 
                    : 'bg-white/40 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:border-[#E35B8F]'
                }`}
              />
              <input 
                required 
                name="career" 
                type="text" 
                placeholder="Carrera / Área" 
                className={`w-full border-2 rounded-xl px-4 py-4 text-base focus:outline-none min-h-[48px] transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]' 
                    : 'bg-white/40 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:border-[#E35B8F]'
                }`} 
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="flex-1 py-3.5 sm:py-4 text-sm font-bold text-[#8B5E75] uppercase min-h-[48px] touch-manipulation active:bg-white/40 rounded-xl"
              >
                Cerrar
              </button>
              <button 
                type="submit" 
                className="flex-[2] btn-primary py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-cinzel text-sm font-black uppercase tracking-widest min-h-[48px] touch-manipulation active:scale-95"
              >
                Inaugurar
              </button>
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
  studentProfileContext?: StudentProfileContext;
  isNightMode?: boolean;
}

const SubjectDetail: React.FC<DetailProps> = ({ subject, onClose, onUpdate, onStatusChange, isMobile, onMaterialUpload, studentProfileContext, isNightMode = false }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'lab' | 'notas'>('info');
  const [loadingIa, setLoadingIa] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ia', text: string}[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [chatDownloaded, setChatDownloaded] = useState(false);
  const [showChatWarning, setShowChatWarning] = useState(false);
  const [showPetFirstTime, setShowPetFirstTime] = useState(true);
  
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

  // Resetear estado de descarga cuando se cambia de tab o se limpia el chat
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatDownloaded(false);
    }
  }, [chatHistory.length]);

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
    setChatDownloaded(false); // Nuevo mensaje, no descargado aún
    
    const selectedMaterials = subject.materials.filter(m => selectedContextIds.includes(m.id));
    const contextStr = `
      Materia: ${subject.name}
      Materiales seleccionados: ${selectedMaterials.map(m => m.name).join(', ')}
      Apuntes seleccionados: ${subject.notes.filter(n => selectedContextIds.includes(n.id)).map(n => n.title).join(', ')}
    `;
    
    const res = await geminiService.queryAcademicOracle(subject.name, query, contextStr, studentProfileContext);
    setChatHistory(prev => [...prev, { role: 'ia', text: res || '' }]);
    setLoadingIa(false);
    // Después de la primera respuesta, no mostrar la mascota de nuevo
    if (showPetFirstTime) {
      setShowPetFirstTime(false);
    }
  };

  const handleDownloadChat = async () => {
    if (chatHistory.length === 0) return;

    try {
      // Crear un elemento HTML temporal oculto con el contenido estilizado
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // Ancho A4
      tempDiv.style.backgroundColor = '#FFFFFF';
      tempDiv.style.fontFamily = "'EB Garamond', 'Times New Roman', serif";

      // Generar el HTML del chat con estilos
      const chatHTML = chatHistory.map((chat) => {
        const processedText = processMarkdownToHTML(chat.text);
        const roleColor = chat.role === 'user' ? '#E35B8F' : '#D4AF37';
        const roleLabel = chat.role === 'user' ? 'Tú' : 'Oráculo';
        
        return `
          <div style="margin-bottom: 24px;">
            <div style="
              color: ${roleColor};
              font-family: 'Marcellus', 'Cinzel', serif;
              font-size: 13pt;
              font-weight: 600;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            ">${roleLabel}:</div>
            <div style="
              color: #374151;
              font-family: 'EB Garamond', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.7;
              text-align: justify;
              padding-left: 12px;
            ">${processedText}</div>
          </div>
        `;
      }).join('');

      // Crear el HTML completo del pergamino (sin el recuadro, se agregará en cada página del PDF)
      tempDiv.innerHTML = `
        <div style="
          background-color: #FFFFFF;
          position: relative;
          padding: 15mm 20mm;
          box-sizing: border-box;
        ">
          <!-- Encabezado (solo en primera página) -->
          <div id="header-section" style="
            margin-bottom: 25mm;
            position: relative;
            padding-top: 5mm;
          ">
            <h1 style="
              font-family: 'Marcellus', 'Cinzel', 'Times New Roman', serif;
              color: #4A233E;
              font-size: 24pt;
              font-weight: 700;
              margin: 0 0 8px 0;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            ">ORÁCULO DE ESTUDIO</h1>
            
            <h2 style="
              font-family: 'Marcellus', 'Cinzel', 'Times New Roman', serif;
              color: #4A233E;
              font-size: 18pt;
              font-weight: 500;
              margin: 0;
              letter-spacing: 0.04em;
            ">${subject.name.toUpperCase()}</h2>
            
            <!-- Sello en esquina superior derecha -->
            <img 
              src="/seal.png" 
              alt="Sello de Studianta"
              style="
                position: absolute;
                top: 0;
                right: 0;
                width: 22mm;
                height: 22mm;
                object-fit: contain;
              "
              onerror="this.style.display='none'"
            />
          </div>

          <!-- Cuerpo del chat -->
          <div style="
            color: #374151;
            font-family: 'EB Garamond', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.7;
          ">
            ${chatHTML}
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Esperar a que las fuentes y la imagen se carguen
      await new Promise(resolve => setTimeout(resolve, 500));

      // Cargar html2canvas dinámicamente
      const html2canvasLib = await loadHtml2Canvas();
      
      // Renderizar el HTML a canvas con html2canvas
      // No limitar la altura para que renderice todo el contenido
      const canvas = await html2canvasLib(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 210 * 3.779527559, // Convertir mm a px (1mm = 3.779527559px a 96dpi)
        // No especificar height para que renderice todo el contenido
      });

      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);

      // Crear el PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Convertir píxeles a mm (96 DPI: 1px = 0.264583mm)
      const pxToMm = 0.264583;
      const imgWidthMm = imgWidth * pxToMm;
      const imgHeightMm = imgHeight * pxToMm;
      
      // Calcular escala para que la imagen quepa en el ancho del PDF
      const scale = pdfWidth / imgWidthMm;
      const imgScaledWidth = pdfWidth;
      const imgScaledHeight = imgHeightMm * scale;

      // Calcular cuántas páginas necesitamos basado en el área útil
      const usableHeightMm = pdfHeight - 20; // Altura útil dentro del recuadro
      const totalPages = Math.ceil(imgScaledHeight / usableHeightMm);

      // Agregar el sello en la primera página
      await addSealToPDF(pdf);

      // Dividir la imagen en páginas respetando el área del recuadro dorado
      // El área útil ya está calculada arriba
      const usableHeightPx = Math.floor(usableHeightMm / (pxToMm * scale));
      
      let sourceY = 0;
      let pageIndex = 0;
      
      while (sourceY < imgHeight && pageIndex < totalPages) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Calcular la altura de la porción para esta página
        const remainingHeight = imgHeight - sourceY;
        let currentPageHeightPx = Math.min(usableHeightPx, remainingHeight);
        
        // Ajustar para evitar cortes muy pequeños al final
        if (remainingHeight - currentPageHeightPx < 50 && remainingHeight - currentPageHeightPx > 0) {
          // Si queda muy poco, incluir todo en esta página
          currentPageHeightPx = remainingHeight;
        }
        
        if (currentPageHeightPx <= 0) {
          break;
        }
        
        // Calcular altura en mm - usar altura completa del área útil excepto en la última página
        const currentPageHeightMm = (pageIndex === totalPages - 1 && remainingHeight <= usableHeightPx)
          ? (currentPageHeightPx * pxToMm * scale)
          : usableHeightMm;

        // Crear un canvas temporal para esta página
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = currentPageHeightPx;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (!pageCtx) {
          console.error('No se pudo obtener el contexto del canvas');
          break;
        }

        // Rellenar el canvas con fondo blanco primero
        pageCtx.fillStyle = '#FFFFFF';
        pageCtx.fillRect(0, 0, imgWidth, currentPageHeightPx);
        
        // Copiar la porción correspondiente de la imagen original
        try {
          pageCtx.drawImage(
            canvas,
            0, sourceY, imgWidth, currentPageHeightPx,  // source (x, y, width, height)
            0, 0, imgWidth, currentPageHeightPx          // destination (x, y, width, height)
          );
          
          // Convertir a PNG
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          
          // Agregar la imagen al PDF, posicionada dentro del recuadro (10mm desde arriba)
          if (pageImgData && pageImgData.startsWith('data:image/png')) {
            pdf.addImage(pageImgData, 'PNG', 0, 10, imgScaledWidth, currentPageHeightMm);
          } else {
            throw new Error('DataURL inválido');
          }
        } catch (drawError) {
          console.error(`Error al procesar página ${pageIndex + 1}:`, drawError);
          break;
        }

        sourceY += currentPageHeightPx;
        pageIndex++;
      }

      // Agregar numeración de páginas y marco decorativo en cada página
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Marco decorativo dorado (se dibuja en cada página, siempre completo)
        pdf.setDrawColor(212, 175, 55); // #D4AF37
        pdf.setLineWidth(0.5);
        pdf.rect(10, 10, pdfWidth - 20, pdfHeight - 20);
        
        // Numeración de página (footer, abajo a la derecha)
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Página ${i}`,
          pdfWidth - 15,
          pdfHeight - 10,
          { align: 'right' }
        );
      }

      pdf.save(`Chat_Oráculo_${subject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      setChatDownloaded(true);
    } catch (error) {
      console.error('Error al generar el PDF del chat:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    }
  };

  const handleCloseWithCheck = () => {
    if (chatHistory.length > 0 && !chatDownloaded) {
      setShowChatWarning(true);
    } else {
      onClose();
    }
  };

  const downloadDossier = async () => {
    const doc = new jsPDF();
    
    // Agregar sello en la primera página
    await addSealToPDF(doc);
    
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
    
    // Agregar numeración de páginas en el footer, abajo a la derecha
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i}`,
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
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
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
    }`}>
      {/* Detail Header */}
      <header className={`border-b p-4 md:p-6 shrink-0 backdrop-blur-md z-30 transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40' 
          : 'bg-white/70 border-[#F8C8DC]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleCloseWithCheck} className={`p-2 rounded-full transition-colors duration-500 ${
              isNightMode ? 'text-[#7A748E] hover:bg-[rgba(199,125,255,0.2)]' : 'text-[#8B5E75] hover:bg-[#FFD1DC]'
            }`}>
               <div className="rotate-180">{getIcon('chevron', 'w-6 h-6')}</div>
            </button>
            <div className="overflow-hidden">
              <h1 className={`font-cinzel text-lg md:text-2xl font-bold truncate transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>{subject.name}</h1>
              <p className={`text-[10px] uppercase font-bold tracking-widest font-inter transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>{subject.career}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button onClick={downloadDossier} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-[10px] font-cinzel font-bold uppercase tracking-widest transition-colors duration-500 ${
               isNightMode 
                 ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56] text-[#E0E1DD] hover:bg-[rgba(48,43,79,0.6)]' 
                 : 'bg-white/60 border-[#D4AF37] text-[#4A233E]'
             }`}>
                {getIcon('sparkles', `w-4 h-4 ${isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'}`)} Dossier
              </button>
             <select 
                value={subject.status} 
                onChange={(e) => onStatusChange(e.target.value as SubjectStatus)}
                className={`flex-1 sm:flex-none border rounded-xl px-2 py-2.5 text-[10px] font-cinzel font-bold uppercase outline-none transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56] text-[#E0E1DD]' 
                    : 'bg-white border-[#D4AF37] text-[#4A233E]'
                }`}
              >
                <option value="Cursando">Cursando</option>
                <option value="Final Pendiente">Pendiente</option>
                <option value="Aprobada">Aprobada</option>
              </select>
          </div>
        </div>
      </header>

      {/* Tabs Navigation (Scrollable) */}
      <nav className={`border-b overflow-x-auto no-scrollbar shrink-0 backdrop-blur-md transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
          : 'bg-white/40 border-[#F8C8DC]'
      }`}>
        <div className="max-w-7xl mx-auto flex px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] flex flex-col items-center gap-1 py-4 px-2 transition-all border-b-2 font-cinzel text-[10px] font-bold uppercase tracking-widest ${
                activeTab === tab.id 
                  ? isNightMode
                    ? 'border-[#C77DFF] text-[#C77DFF] bg-[#C77DFF]/10'
                    : 'border-[#E35B8F] text-[#E35B8F] bg-[#E35B8F]/5'
                  : isNightMode
                    ? 'border-transparent text-[#7A748E]'
                    : 'border-transparent text-[#8B5E75]'
              }`}
            >
              {getIcon(tab.icon, "w-5 h-5")}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Detail Content Area */}
      <main className={`flex-1 overflow-hidden max-w-7xl mx-auto w-full ${activeTab === 'lab' ? 'p-0' : 'overflow-y-auto p-4 md:p-8 scroll-sm pb-24'}`}>
        
        {activeTab === 'info' && (
          <div className="space-y-6 animate-fade-in">
            <section className={`p-6 rounded-[2rem] shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                : 'glass-card'
            }`}>
              <h3 className={`font-cinzel text-lg mb-6 flex items-center gap-3 font-bold uppercase tracking-widest border-b pb-4 transition-colors duration-500 ${
                isNightMode 
                  ? 'text-[#E0E1DD] border-[#A68A56]/40' 
                  : 'text-[#4A233E] border-[#F8C8DC]'
              }`}>
                {getIcon('users', "w-5 h-5")} Información de Cátedra
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className={`text-[10px] uppercase font-bold transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Profesor Titular</label>
                  <input type="text" value={subject.professor || ''} onChange={(e) => onUpdate({...subject, professor: e.target.value})} placeholder="Nombre..." className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50' 
                      : 'bg-white/40 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
                  }`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] uppercase font-bold transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Email / Contacto</label>
                  <input type="email" value={subject.email || ''} onChange={(e) => onUpdate({...subject, email: e.target.value})} placeholder="Email..." className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50' 
                      : 'bg-white/40 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
                  }`} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] uppercase font-bold transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Aula</label>
                  <input type="text" value={subject.aula || ''} onChange={(e) => onUpdate({...subject, aula: e.target.value})} placeholder="Aula donde está cursando..." className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50' 
                      : 'bg-white/40 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
                  }`} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={`text-[10px] uppercase font-bold transition-colors duration-500 ${
                      isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                    }`}>Inicio</label>
                    <input type="date" value={subject.termStart || ''} onChange={(e) => onUpdate({...subject, termStart: e.target.value})} className={`w-full border rounded-xl px-2 py-3 text-xs outline-none transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD]' 
                        : 'bg-white border-[#F8C8DC] text-[#4A233E]'
                    }`} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] uppercase font-bold transition-colors duration-500 ${
                      isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                    }`}>Fin</label>
                    <input type="date" value={subject.termEnd || ''} onChange={(e) => onUpdate({...subject, termEnd: e.target.value})} className={`w-full border rounded-xl px-2 py-3 text-xs outline-none transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD]' 
                        : 'bg-white border-[#F8C8DC] text-[#4A233E]'
                    }`} />
                  </div>
                </div>
              </div>
              
              <div className={`border-t pt-6 transition-colors duration-500 ${
                isNightMode ? 'border-[#A68A56]/40' : 'border-[#F8C8DC]'
              }`}>
                <h4 className={`font-cinzel text-sm mb-4 flex items-center gap-2 font-bold uppercase tracking-widest transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>
                  {getIcon('book', "w-4 h-4")} Programa / Syllabus
                </h4>
                <div className="space-y-4">
                  {programaMaterial ? (
                    <div className={`p-4 rounded-xl flex items-center justify-between border-l-4 shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-l-[#A68A56] shadow-[0_0_10px_rgba(199,125,255,0.1)]' 
                        : 'bg-white/60 border-l-[#D4AF37]'
                    }`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`transition-colors duration-500 ${
                          isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                        }`}>{getIcon('book', 'w-6 h-6')}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-bold truncate transition-colors duration-500 ${
                            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                          }`}>{programaMaterial.name}</h4>
                          <p className={`text-[9px] uppercase font-black tracking-widest mt-1 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>
                            {new Date(programaMaterial.date).toLocaleDateString()} • {programaMaterial.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(programaMaterial.type === 'PDF' || programaMaterial.content) && (
                          <button onClick={() => handleViewPdf(programaMaterial)} className={`p-2 transition-colors duration-500 ${
                            isNightMode ? 'text-[#A68A56] hover:text-[#C77DFF]' : 'text-[#D4AF37] hover:text-[#4A233E]'
                          }`} title="Leer">
                            {getIcon('eye', 'w-5 h-5')}
                          </button>
                        )}
                        <button onClick={() => handleDownloadMaterial(programaMaterial)} className={`p-2 transition-colors duration-500 ${
                          isNightMode ? 'text-[#E0E1DD] hover:text-[#C77DFF]' : 'text-[#4A233E] hover:text-[#E35B8F]'
                        }`} title="Descargar">
                          {getIcon('download', 'w-5 h-5')}
                        </button>
                        <button onClick={() => programaInputRef.current?.click()} className={`p-2 transition-colors duration-500 ${
                          isNightMode ? 'text-[#7A748E] hover:text-[#A68A56]' : 'text-[#8B5E75] hover:text-[#D4AF37]'
                        }`} title="Reemplazar">
                          {getIcon('edit', 'w-5 h-5')}
                        </button>
                        <button onClick={() => handleDeleteMaterial(programaMaterial.id)} className="text-red-300 hover:text-red-500 p-2" title="Eliminar">
                          {getIcon('trash', 'w-5 h-5')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-8 border-2 border-dashed rounded-xl backdrop-blur-[15px] transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
                        : 'border-[#F8C8DC]'
                    }`}>
                      <p className={`text-sm mb-4 italic opacity-50 transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>No hay programa cargado</p>
                      <input type="file" ref={programaInputRef} className="hidden" onChange={handleProgramaUpload} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                      <button onClick={() => programaInputRef.current?.click()} className={`px-6 py-3 rounded-xl border-2 border-dashed text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                        isNightMode 
                          ? 'border-[#C77DFF] text-[#C77DFF] hover:bg-[#C77DFF]/10' 
                          : 'border-[#E35B8F] text-[#E35B8F] hover:bg-[#E35B8F]/5'
                      }`}>
                        Agregar Programa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className={`p-6 rounded-[2rem] shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                : 'glass-card'
            }`}>
              <h3 className={`font-cinzel text-lg mb-6 flex items-center gap-3 font-bold uppercase tracking-widest border-b pb-4 transition-colors duration-500 ${
                isNightMode 
                  ? 'text-[#E0E1DD] border-[#A68A56]/40' 
                  : 'text-[#4A233E] border-[#F8C8DC]'
              }`}>
                {getIcon('sparkles', "w-5 h-5")} Contenido de la Asignatura
              </h3>
              <div className="space-y-3 mb-4">
                {contenidoMaterials.length === 0 ? (
                  <p className={`text-center italic py-4 text-sm opacity-50 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>No hay contenido agregado.</p>
                ) : (
                  contenidoMaterials.map(m => (
                    <div key={m.id} className={`p-4 rounded-xl flex items-center justify-between border-l-4 shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-l-[#C77DFF] shadow-[0_0_10px_rgba(199,125,255,0.1)]' 
                        : 'bg-white/60 border-l-[#E35B8F]'
                    }`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`transition-colors duration-500 ${
                          isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                        }`}>{getIcon('file', 'w-6 h-6')}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-bold truncate transition-colors duration-500 ${
                            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                          }`}>{m.name}</h4>
                          <p className={`text-[9px] uppercase font-black tracking-widest mt-1 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>
                            {new Date(m.date).toLocaleDateString()} • {m.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(m.type === 'PDF' || m.content) && (
                          <button onClick={() => handleViewPdf(m)} className={`p-2 transition-colors duration-500 ${
                            isNightMode ? 'text-[#A68A56] hover:text-[#C77DFF]' : 'text-[#D4AF37] hover:text-[#4A233E]'
                          }`} title="Leer">
                            {getIcon('eye', 'w-5 h-5')}
                          </button>
                        )}
                        <button onClick={() => handleDownloadMaterial(m)} className={`p-2 transition-colors duration-500 ${
                          isNightMode ? 'text-[#E0E1DD] hover:text-[#C77DFF]' : 'text-[#4A233E] hover:text-[#E35B8F]'
                        }`} title="Descargar">
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
              <button onClick={() => contenidoInputRef.current?.click()} className={`w-full py-3 rounded-xl border-2 border-dashed text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                isNightMode 
                  ? 'border-[#C77DFF] text-[#C77DFF] hover:bg-[#C77DFF]/10' 
                  : 'border-[#E35B8F] text-[#E35B8F] hover:bg-[#E35B8F]/5'
              }`}>
                {getIcon('plus', 'w-4 h-4 inline mr-2')} Agregar Contenido (PDF/Word/PPT)
              </button>
            </section>

          </div>
        )}

        {activeTab === 'notas' && (
          <div className={`space-y-6 animate-fade-in transition-all duration-500 ${isNoteFocused ? 'scale-105 opacity-95' : ''}`}>
            {/* Header con búsqueda */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
              <h3 className={`font-cinzel text-xl font-bold uppercase tracking-widest transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>Cuaderno de Foco Profundo</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  placeholder="Buscar en apuntes..."
                  className={`flex-1 sm:flex-none sm:w-64 border rounded-xl px-4 py-2 text-sm outline-none transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50' 
                      : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
                  }`}
                />
                <button 
                  onClick={() => setShowImportantOnly(!showImportantOnly)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                    showImportantOnly 
                      ? isNightMode
                        ? 'bg-[#A68A56] text-white'
                        : 'bg-[#D4AF37] text-white'
                      : isNightMode
                        ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border border-[#A68A56]/40'
                        : 'bg-white/60 text-[#8B5E75]'
                  }`}
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
                    // Buscar en el texto plano del HTML (sin etiquetas)
                    (n.content && n.content.replace(/<[^>]*>/g, '').toLowerCase().includes(noteSearchQuery.toLowerCase()));
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                          isToday 
                            ? isNightMode
                              ? 'bg-[#A68A56] border-[#A68A56]'
                              : 'bg-[#D4AF37] border-[#D4AF37]'
                            : isNightMode
                              ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                              : 'bg-white/60 border-[#F8C8DC]'
                        }`}>
                          {getIcon('calendar', `w-6 h-6 ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'}`)}
                        </div>
                        {idx < subject.notes.length - 1 && (
                          <div className={`w-0.5 h-full bg-gradient-to-b to-transparent mt-2 min-h-[80px] transition-colors duration-500 ${
                            isNightMode ? 'from-[#A68A56]/40' : 'from-[#F8C8DC]'
                          }`} />
                        )}
                      </div>
                      
                      {/* Contenido de la nota */}
                      <div 
                        onClick={() => { setEditingNote(n); setShowNoteModal(true); setIsNoteFocused(true); }} 
                        className={`flex-1 p-6 rounded-[2rem] border-l-4 active:scale-[0.98] transition-all cursor-pointer hover:shadow-lg backdrop-blur-[15px] ${
                          isNightMode 
                            ? 'bg-[rgba(48,43,79,0.6)] border-l-[#A68A56] shadow-[0_0_15px_rgba(199,125,255,0.2)] hover:shadow-[0_0_25px_rgba(199,125,255,0.3)]' 
                            : 'glass-card border-l-[#D4AF37] bg-white/60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className={`font-cinzel text-lg font-bold uppercase mb-1 transition-colors duration-500 ${
                              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                            }`}>{n.title}</h4>
                            <span className={`text-[9px] font-black uppercase font-inter transition-colors duration-500 ${
                              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                            }`}>
                              {isToday ? 'Hoy' : noteDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {n.isSealed && (
                              <span className={`text-[8px] px-2 py-1 rounded-full font-bold uppercase transition-colors duration-500 ${
                                isNightMode 
                                  ? 'bg-[#A68A56]/20 text-[#A68A56]' 
                                  : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                              }`}>
                                {getIcon('sparkles', 'w-3 h-3 inline mr-1')} Sellada
                              </span>
                            )}
                            {n.importantFragments && n.importantFragments.length > 0 && (
                              <span className={`text-[8px] px-2 py-1 rounded-full font-bold uppercase transition-colors duration-500 ${
                                isNightMode 
                                  ? 'bg-[#C77DFF]/20 text-[#C77DFF]' 
                                  : 'bg-[#E35B8F]/20 text-[#E35B8F]'
                              }`}>
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
                        <div 
                          className={`font-garamond leading-relaxed text-base line-clamp-3 opacity-80 prose prose-sm max-w-none transition-colors duration-500 ${
                            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                          }`}
                          dangerouslySetInnerHTML={{ __html: n.content.replace(/\n/g, '<br>') }}
                        />
                      </div>
                    </div>
                  );
                })}
              
              {subject.notes.length === 0 && (
                <div className={`text-center py-16 rounded-[2rem] border-2 border-dashed backdrop-blur-[15px] transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
                    : 'bg-white/40 border-[#F8C8DC]'
                }`}>
                  <p className={`font-garamond italic text-xl opacity-40 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Tu cuaderno académico aguarda su primera página...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* RAG Sincronización - Arriba, bordeando con las tabs */}
            <div className={`px-4 py-2.5 flex items-center justify-between shadow-sm shrink-0 border-b transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[#C77DFF] text-white border-[#A68A56]/30 shadow-[0_0_20px_rgba(199,125,255,0.3)]' 
                : 'bg-[#E35B8F] text-white border-[#D4AF37]/30'
            }`}>
              <div className="flex items-center gap-4 overflow-hidden w-full">
                <span className="font-marcellus text-[9px] font-black uppercase tracking-widest shrink-0">Contexto:</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                  {subject.materials.filter(m => m.category === 'contenido').map(m => (
                    <button key={m.id} onClick={() => toggleContext(m.id)} className={`px-3 py-1.5 rounded-full text-[8px] font-bold whitespace-nowrap border transition-all ${
                      selectedContextIds.includes(m.id) 
                        ? isNightMode
                          ? 'bg-[#A68A56] border-[#A68A56] text-white'
                          : 'bg-[#D4AF37] border-[#D4AF37] text-white'
                        : 'bg-white/20 border-white/40 text-white'
                    }`}>
                      📄 {m.name}
                    </button>
                  ))}
                  {subject.notes.map(n => (
                    <button key={n.id} onClick={() => toggleContext(n.id)} className={`px-3 py-1.5 rounded-full text-[8px] font-bold whitespace-nowrap border transition-all ${
                      selectedContextIds.includes(n.id) 
                        ? isNightMode
                          ? 'bg-[rgba(26,26,46,0.8)] border-[rgba(26,26,46,0.8)] text-white'
                          : 'bg-[#4A233E] border-[#4A233E] text-white'
                        : 'bg-white/20 border-white/40 text-white'
                    }`}>
                      📝 {n.title}
                    </button>
                  ))}
                </div>
                {chatHistory.length > 0 && (
                  <button
                    onClick={handleDownloadChat}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-white text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                      isNightMode 
                        ? 'bg-[#A68A56] hover:bg-[#8B6F45]' 
                        : 'bg-[#D4AF37] hover:bg-[#C19D2E]'
                    }`}
                    title="Descargar chat"
                  >
                    {getIcon('download', 'w-3 h-3')}
                    Descargar
                  </button>
                )}
              </div>
            </div>

            {/* Chat - Ocupa todo el espacio libre con márgenes pequeños */}
            <div className={`flex-1 mx-2 my-3 p-4 md:p-6 overflow-y-auto space-y-6 font-garamond rounded-[2rem] backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
                : 'bg-[#FFF9FB]/60 glass-card border-[#F8C8DC]'
            }`}>
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                  <div className={`w-16 h-16 rounded-full border border-dashed flex items-center justify-center mb-4 transition-colors duration-500 ${
                    isNightMode 
                      ? 'border-[#A68A56] text-[#A68A56]' 
                      : 'border-[#D4AF37] text-[#D4AF37]'
                  }`}>
                    {getIcon('chat', 'w-8 h-8')}
                  </div>
                  <h4 className={`font-marcellus text-xl font-bold mb-2 uppercase tracking-widest transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  }`}>Oráculo de Estudio</h4>
                  <p className={`text-sm italic transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Sincroniza fuentes arriba y pregunta cualquier duda.</p>
                </div>
              )}
                
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-md transition-colors duration-500 ${
                    chat.role === 'user' 
                      ? isNightMode
                        ? 'bg-[#C77DFF] text-white rounded-tr-none'
                        : 'bg-[#E35B8F] text-white rounded-tr-none'
                      : isNightMode
                        ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 text-[#E0E1DD] rounded-tl-none'
                        : 'bg-white/95 border border-[#F8C8DC] text-[#4A233E] rounded-tl-none'
                  }`}>
                    {chat.role === 'user' ? (
                      <p className="font-garamond text-lg md:text-xl leading-relaxed">{chat.text}</p>
                    ) : (
                      <div className="oracle-response">
                        <OracleTextRenderer text={chat.text} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loadingIa && (
                <div className="flex justify-start">
                  <div className={`p-4 rounded-[1.5rem] rounded-tl-none border backdrop-blur-[15px] transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                      : 'bg-white border-[#F8C8DC]'
                  }`}>
                    {showPetFirstTime ? (
                      <div className="flex items-center justify-center py-2">
                        <PetAnimation show={true} />
                      </div>
                    ) : (
                      <div className="animate-pulse flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-bounce transition-colors duration-500 ${
                          isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                        }`} />
                        <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] transition-colors duration-500 ${
                          isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                        }`} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input - Fijo en la parte baja */}
            <div className={`p-4 border-t shrink-0 mx-2 mb-2 rounded-[1.5rem] shadow-lg backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                : 'bg-white/95 border-[#F8C8DC]'
            }`}>
              <form onSubmit={handleIaQuery} className="flex gap-2 items-center">
                <input ref={queryInputRef} placeholder="Pregunta al Oráculo..." className={`flex-1 border rounded-[1.5rem] px-6 py-3 text-lg font-garamond outline-none shadow-inner transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]' 
                    : 'bg-white border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:border-[#E35B8F]'
                }`} />
                <button type="submit" disabled={loadingIa} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[#C77DFF] hover:bg-[#B56DE6] shadow-[0_0_15px_rgba(199,125,255,0.3)]' 
                    : 'bg-[#E35B8F] hover:bg-[#D1477A]'
                }`}>
                  {loadingIa ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : getIcon('chat', 'w-6 h-6 text-white')}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-fade-in">
            <section className={`p-6 rounded-[2rem] shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                : 'glass-card'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-cinzel text-lg font-bold uppercase tracking-widest transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>Cronograma de exámenes y otras fechas</h3>
                <button onClick={() => setShowMilestoneModal(true)} className={`p-2 rounded-xl transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[#C77DFF] text-white hover:bg-[#B56DE6]' 
                    : 'bg-[#E35B8F] text-white hover:bg-[#D1477A]'
                }`}>
                  {getIcon('plus', "w-5 h-5")}
                </button>
              </div>
              <div className="space-y-3">
                {subject.milestones.length === 0 ? (
                  <p className={`text-center italic py-4 text-sm opacity-50 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>No hay hitos registrados.</p>
                ) : (
                  subject.milestones.map(m => (
                    <div key={m.id} className={`p-4 rounded-xl flex items-center justify-between border-l-4 shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-l-[#A68A56] shadow-[0_0_10px_rgba(199,125,255,0.1)]' 
                        : 'bg-white/60 border-l-[#D4AF37]'
                    }`}>
                       <div>
                          <h4 className={`text-sm font-bold uppercase transition-colors duration-500 ${
                            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                          }`}>{m.title}</h4>
                          <p className={`text-[9px] uppercase font-black tracking-widest mt-1 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>
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

            <section className={`p-6 rounded-[2rem] shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                : 'glass-card'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-cinzel text-lg font-bold uppercase tracking-widest transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>Horarios de cursada</h3>
                <button onClick={() => setShowScheduleModal(true)} className={`p-2 rounded-xl transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[#A68A56] text-white hover:bg-[#8B6F45]' 
                    : 'bg-[#D4AF37] text-white hover:bg-[#C19D2E]'
                }`}>
                  {getIcon('plus', "w-5 h-5")}
                </button>
              </div>
              <div className="space-y-3">
                {subject.schedules.length === 0 ? (
                  <p className={`text-center italic py-4 text-sm opacity-50 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Sin horarios definidos.</p>
                ) : (
                  subject.schedules.map(s => (
                    <div key={s.id} className={`p-4 rounded-xl flex items-center justify-between border-l-4 shadow-sm backdrop-blur-[15px] transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.4)] border-l-[#C77DFF] shadow-[0_0_10px_rgba(199,125,255,0.1)]' 
                        : 'bg-white/60 border-l-[#E35B8F]'
                    }`}>
                       <div>
                          <h4 className={`text-sm font-bold uppercase transition-colors duration-500 ${
                            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                          }`}>{s.day}</h4>
                          <p className={`text-[9px] uppercase font-black tracking-widest mt-1 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>
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
        <div className={`fixed inset-0 z-[400] flex items-center justify-center backdrop-blur-sm p-4 transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-[#4A233E]/60'
        }`} onClick={() => setShowMilestoneModal(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onUpdate({...subject, milestones: [...subject.milestones, {id: Math.random().toString(36), title: fd.get('title') as string, date: fd.get('date') as string, type: fd.get('type') as any}]});
            setShowMilestoneModal(false);
          }} className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl font-inter backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.3)]' 
              : 'glass-card'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-cinzel text-lg mb-6 text-center font-bold tracking-widest uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>Nuevo Hito</h2>
            <div className="space-y-4">
              <input required name="title" placeholder="Título..." className={`w-full border rounded-xl px-4 py-4 outline-none text-sm transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50' 
                  : 'bg-white border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
              }`} />
              <input required name="date" type="date" className={`w-full border rounded-xl px-4 py-4 outline-none text-sm transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD]' 
                  : 'bg-white border-[#F8C8DC] text-[#4A233E]'
              }`} />
              <select name="type" className={`w-full border rounded-xl px-4 py-4 outline-none text-sm transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD]' 
                  : 'bg-white border-[#F8C8DC] text-[#4A233E]'
              }`}>
                <option value="Examen">Examen</option><option value="Parcial">Parcial</option><option value="Entrega">Entrega</option><option value="Trabajo Práctico">TP</option>
              </select>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowMilestoneModal(false)} className={`flex-1 py-4 text-xs font-bold uppercase transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E] hover:text-[#E0E1DD]' : 'text-[#8B5E75]'
              }`}>Cerrar</button>
              <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl font-cinzel text-xs font-black uppercase">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {showScheduleModal && (
        <div className={`fixed inset-0 z-[400] flex items-center justify-center backdrop-blur-sm p-4 transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-[#4A233E]/60'
        }`} onClick={() => setShowScheduleModal(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onUpdate({...subject, schedules: [...subject.schedules, {id: Math.random().toString(36), day: fd.get('day') as string, startTime: fd.get('start') as string, endTime: fd.get('end') as string}]});
            setShowScheduleModal(false);
          }} className={`w-full max-w-sm p-8 rounded-[2rem] shadow-2xl font-inter backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.3)]' 
              : 'glass-card'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-cinzel text-lg mb-6 text-center font-bold tracking-widest uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>Horario</h2>
            <div className="space-y-4">
              <select name="day" className={`w-full border rounded-xl px-4 py-4 outline-none text-sm transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD]' 
                  : 'bg-white border-[#F8C8DC] text-[#4A233E]'
              }`}>
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
            setShowNoteModal(false);
            setEditingNote(null);
            setIsNoteFocused(false);
          }}
          onFocusChange={setIsNoteFocused}
        />
      )}

      {noteToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4" onClick={() => setNoteToDelete(null)}>
          <div className="glass-card max-w-sm w-full p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

      {showChatWarning && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4" onClick={() => setShowChatWarning(false)}>
          <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-cinzel text-xl text-[#4A233E] mb-4 font-bold uppercase tracking-widest">Chat sin Descargar</h2>
            <p className="text-sm text-[#8B5E75] mb-8 font-garamond italic">
              Tienes un chat activo que no ha sido descargado. Si sales ahora, se perderá permanentemente.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  handleDownloadChat();
                  setShowChatWarning(false);
                  setTimeout(() => onClose(), 500);
                }} 
                className="bg-[#D4AF37] text-white w-full py-4 rounded-2xl font-cinzel text-xs font-bold uppercase shadow-lg hover:bg-[#C19D2E] transition-all flex items-center justify-center gap-2"
              >
                {getIcon('download', 'w-4 h-4')}
                Descargar y Salir
              </button>
              <button 
                onClick={() => {
                  setChatHistory([]);
                  setChatDownloaded(false);
                  setShowChatWarning(false);
                  onClose();
                }} 
                className="bg-red-500 text-white w-full py-4 rounded-2xl font-cinzel text-xs font-bold uppercase shadow-lg hover:bg-red-600 transition-all"
              >
                Salir sin Guardar
              </button>
              <button 
                onClick={() => setShowChatWarning(false)} 
                className="text-[#8B5E75] w-full py-3 rounded-2xl font-inter text-xs font-bold uppercase hover:bg-white/50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfModal && selectedPdf && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-[#4A233E]/95 backdrop-blur-lg" onClick={() => { setShowPdfModal(false); setSelectedPdf(null); }}>
          <div className="bg-white/90 border-b border-[#F8C8DC] p-4 flex justify-between items-center shrink-0" onClick={(e) => e.stopPropagation()}>
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
          <div className="flex-1 overflow-auto p-4 bg-white" onClick={(e) => e.stopPropagation()}>
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
  const contentRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onFocusChange(true);
    // Cargar contenido HTML si existe
    if (contentRef.current && note?.content) {
      contentRef.current.innerHTML = note.content;
      setContent(note.content);
    } else if (contentRef.current && !note) {
      contentRef.current.innerHTML = '';
      setContent('');
    }
    return () => onFocusChange(false);
  }, [onFocusChange, note]);

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
    const editor = contentRef.current;
    if (!editor) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setToolbarPosition({
        top: rect.top - 60,
        left: rect.left + (rect.width / 2) - 100,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const handleContentChange = () => {
    const editor = contentRef.current;
    if (!editor) return;
    setContent(editor.innerHTML);
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
    contentRef.current?.focus();
  };

  const insertHeading = (level: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Si no hay selección, insertar al final
      if (contentRef.current) {
        const heading = document.createElement(`h${level}`);
        heading.className = `font-cinzel font-bold text-[#4A233E] mb-2 mt-4 ${
          level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'
        }`;
        heading.textContent = 'Título';
        contentRef.current.appendChild(heading);
        setContent(contentRef.current.innerHTML);
        // Mover el cursor dentro del título
        const range = document.createRange();
        range.selectNodeContents(heading);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        contentRef.current.focus();
      }
      return;
    }
    
    const range = selection.getRangeAt(0);
    const heading = document.createElement(`h${level}`);
    heading.className = `font-cinzel font-bold text-[#4A233E] mb-2 mt-4 ${
      level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'
    }`;
    
    if (range.collapsed) {
      heading.textContent = 'Título';
    } else {
      heading.textContent = range.toString();
      range.deleteContents();
    }
    
    range.insertNode(heading);
    // Mover el cursor después del título
    range.setStartAfter(heading);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    setContent(contentRef.current?.innerHTML || '');
    contentRef.current?.focus();
  };

  const insertSeparator = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Si no hay selección, insertar al final
      if (contentRef.current) {
        const hr = document.createElement('hr');
        hr.className = 'my-4 border-t-2 border-[#D4AF37]/30';
        contentRef.current.appendChild(hr);
        setContent(contentRef.current.innerHTML);
        contentRef.current.focus();
      }
      return;
    }
    
    const range = selection.getRangeAt(0);
    const hr = document.createElement('hr');
    hr.className = 'my-4 border-t-2 border-[#D4AF37]/30';
    
    range.insertNode(hr);
    // Mover el cursor después del separador
    range.setStartAfter(hr);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    setContent(contentRef.current?.innerHTML || '');
    contentRef.current?.focus();
  };

  const handleMarkImportant = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    
    if (selectedText && !importantFragments.includes(selectedText)) {
      setImportantFragments([...importantFragments, selectedText]);
    }
    setShowToolbar(false);
  };

  const handleInsertBullet = () => {
    applyFormat('insertUnorderedList');
    contentRef.current?.focus();
  };

  const handleInsertQuote = () => {
    applyFormat('formatBlock', 'blockquote');
    contentRef.current?.focus();
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
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/90 backdrop-blur-lg p-4 transition-all duration-500" onClick={onClose}>
      <div className="glass-card w-full max-w-5xl h-[90vh] flex flex-col rounded-[2rem] md:rounded-[3rem] animate-fade-in border-2 border-[#D4AF37] overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
            {getIcon('x', 'w-6 h-6')}
          </button>
        </div>

        {/* Barra de Herramientas de Formato */}
        <div className="bg-white/60 border-b border-[#F8C8DC] p-3 flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1 border-r border-[#F8C8DC] pr-3">
            <button
              onClick={() => insertHeading(1)}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
              title="Título 1"
            >
              H1
            </button>
            <button
              onClick={() => insertHeading(2)}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
              title="Título 2"
            >
              H2
            </button>
            <button
              onClick={() => insertHeading(3)}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
              title="Título 3"
            >
              H3
            </button>
          </div>
          <div className="flex items-center gap-1 border-r border-[#F8C8DC] pr-3">
            <button
              onClick={() => applyFormat('bold')}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
              title="Negrita"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => applyFormat('italic')}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel italic text-[#4A233E] transition-all"
              title="Itálica"
            >
              I
            </button>
          </div>
          <div className="flex items-center gap-1 border-r border-[#F8C8DC] pr-3">
            <button
              onClick={handleInsertBullet}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
              title="Lista de viñetas"
            >
              •
            </button>
            <button
              onClick={handleInsertQuote}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
              title="Cita literal"
            >
              "
            </button>
            <button
              onClick={handleMarkImportant}
              className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs transition-all"
              title="Marcar como importante"
            >
              {getIcon('sparkles', 'w-4 h-4 text-[#D4AF37]')}
            </button>
          </div>
          <button
            onClick={insertSeparator}
            className="px-3 py-1.5 bg-white/80 hover:bg-[#FFD1DC] rounded-lg text-xs font-cinzel font-bold text-[#4A233E] transition-all"
            title="Separador horizontal"
          >
            ─
          </button>
        </div>

        {/* Lienzo de Escritura con Líneas de Cuaderno */}
        <div className="flex-1 relative overflow-auto">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-[#FFF9FB] to-[#FDF2F7] pointer-events-none"
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
          <div
            ref={contentRef}
            contentEditable
            onInput={(e) => handleContentChange(e as React.FormEvent<HTMLDivElement>)}
            onSelect={handleTextSelection}
            onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
            className="relative w-full h-full bg-transparent border-none outline-none p-8 font-garamond text-[20px] leading-[1.6] text-[#4A233E] min-h-full"
            style={{ fontFamily: "'EB Garamond', serif" }}
            data-placeholder="Escribe tus apuntes aquí... El conocimiento se consagra con cada palabra."
            suppressContentEditableWarning
          />
        </div>


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
                {getIcon('sparkles', 'w-4 h-4')} Sellar Nota
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectsModule;
