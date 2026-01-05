import React, { useState, useRef, useEffect, useId } from 'react';
import { StudentProfileContext, JournalEntry, MoodType } from '../types';
import { useInteractionAggregator } from '../hooks/useInteractionAggregator';
import { geminiService } from '../services/geminiService';
import { getIcon } from '../constants';
import OracleTextRenderer from './OracleTextRenderer';
import { addSealToPDF } from '../utils/pdfSeal';
import { jsPDF } from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  timestamp: Date;
}

interface OraculoPageProps {
  userProfile: any;
  subjects: any[];
  transactions: any[];
  journalEntries: JournalEntry[];
  customEvents: any[];
  modules: any[];
  monthlyBudget: number;
  isMobile: boolean;
  onAddJournalEntry?: (entry: Omit<JournalEntry, 'id'>) => void;
}

// Componente del Sello de Lacre Rosado
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

// Animación de partículas de luz (Esencia)
const EssenceParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#D4AF37] rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Animación de pluma escribiendo
const WritingQuill: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-2 text-[#D4AF37]">
      <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <path d="M12 2v20" />
      </svg>
      <span className="font-garamond italic text-sm">El Oráculo medita...</span>
    </div>
  );
};

const OraculoPage: React.FC<OraculoPageProps> = ({
  userProfile,
  subjects,
  transactions,
  journalEntries,
  customEvents,
  modules,
  monthlyBudget,
  isMobile,
  onAddJournalEntry,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Obtener el SPC más fresco antes de cada consulta
  const studentProfileContext = useInteractionAggregator({
    userProfile,
    subjects,
    transactions,
    journalEntries,
    customEvents,
    modules,
    monthlyBudget,
  });

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus en el input cuando se carga la página
  useEffect(() => {
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // El SPC ya está actualizado automáticamente por el hook
      // Preparar historial de mensajes (últimos 10 intercambios para mantener contexto sin sobrecargar)
      const recentHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'oracle' as const,
        content: msg.content,
      }));

      const response = await geminiService.queryPersonalOracle(
        userMessage.content,
        studentProfileContext,
        recentHistory
      );

      const oracleMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'oracle',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, oracleMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'oracle',
        content: `📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: ${error.message || 'Error desconocido'}\n\n💡 EXPLICACIÓN: Por favor, intenta nuevamente o verifica tu conexión.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSealVerdict = () => {
    if (!onAddJournalEntry || messages.length === 0) return;

    const lastOracleMessage = [...messages].reverse().find(m => m.role === 'oracle');
    if (!lastOracleMessage) {
      alert('No hay un veredicto del Oráculo para sellar.');
      return;
    }

    // Crear entrada de diario con el último mensaje del Oráculo
    const entry: Omit<JournalEntry, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      mood: 'Equilibrada' as MoodType,
      content: `**Veredicto del Oráculo Personal**\n\n${lastOracleMessage.content}`,
      isLocked: false,
    };

    onAddJournalEntry(entry);
    alert('El veredicto ha sido sellado en tu Diario.');
  };

  const handleDownloadParchment = async () => {
    if (messages.length === 0) {
      alert('No hay conversación para descargar.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Agregar el sello
      await addSealToPDF(doc);

      // Configurar estilos
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin + 30; // Espacio para el sello

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 35, 62); // #4A233E
      doc.text('Oráculo Personal de la Logia Studianta', margin, yPosition);
      yPosition += 10;

      // Fecha
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 94, 117); // #8B5E75
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}`, margin, yPosition);
      yPosition += 15;

      // Línea decorativa
      doc.setDrawColor(212, 175, 55); // #D4AF37
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Mensajes
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81); // #374151

      for (const message of messages) {
        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          await addSealToPDF(doc);
          yPosition = margin + 20;
        }

        // Encabezado del mensaje
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(74, 35, 62);
        const roleLabel = message.role === 'user' ? 'Buscadora de Luz' : 'Oráculo de la Logia';
        doc.text(roleLabel, margin, yPosition);
        yPosition += 5;

        // Contenido del mensaje
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        // Procesar el texto (soporte básico para markdown)
        const lines = doc.splitTextToSize(message.content, maxWidth);
        for (const line of lines) {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            await addSealToPDF(doc);
            yPosition = margin + 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += 6;
        }

        yPosition += 8; // Espacio entre mensajes
      }

      // Guardar PDF
      doc.save(`oraculo-personal-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el pergamino. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FFF9FB] relative overflow-hidden">
      {/* Fondo con textura de papel antiguo */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
        }}
      />

      {/* Header */}
      <header className="flex-none p-4 md:p-6 border-b border-[#D4AF37]/40 bg-white/60 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-cinzel text-2xl md:text-3xl font-black text-[#4A233E] tracking-[0.2em] uppercase mb-2">
            Oráculo Personal
          </h1>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Contenedor de mensajes con bordes dorados */}
          <div 
            className="min-h-full p-6 md:p-8 rounded-[2rem] border-2 border-[#D4AF37]/40 bg-white/80 backdrop-blur-sm shadow-xl"
            style={{
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
              backgroundColor: '#FFFEF7',
            }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div className="mb-6">
                  <StudiantaSeal className="w-20 h-20" />
                </div>
                <h2 className="font-marcellus text-2xl md:text-3xl text-[#4A233E] mb-4">
                  Salve, Buscadora de Luz
                </h2>
                <p className="font-garamond text-lg text-[#8B5E75] italic max-w-md">
                  El Oráculo de la Logia Studianta está listo para escuchar tus consultas. 
                  Formula tu pregunta y recibirás sabiduría arcana basada en tu perfil completo.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-6 ${
                        message.role === 'user'
                          ? 'bg-[#E35B8F]/10 border border-[#E35B8F]/30'
                          : 'bg-[#FFF9FB] border border-[#D4AF37]/30'
                      }`}
                    >
                      {message.role === 'oracle' ? (
                        <OracleTextRenderer text={message.content} />
                      ) : (
                        <p className="font-garamond text-[#4A233E] text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#FFF9FB] border border-[#D4AF37]/30 rounded-2xl p-4 md:p-6">
                      <WritingQuill />
                      <EssenceParticles />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area - Estilo escritorio de madera */}
      <div className="flex-none p-4 md:p-6 border-t border-[#D4AF37]/40 bg-white/80 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 md:gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta al Oráculo..."
                className="w-full min-h-[60px] md:min-h-[80px] max-h-[200px] p-4 rounded-xl border-2 border-[#D4AF37]/40 bg-white/90 font-garamond text-[#4A233E] text-base md:text-lg placeholder:text-[#8B5E75]/50 focus:outline-none focus:border-[#D4AF37] resize-none"
                style={{
                  backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")',
                  backgroundColor: '#F5E6D3',
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(227,91,143,0.5),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:scale-[1.05] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #E35B8F 0%, #C94A7A 100%)',
                filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.4))',
              }}
            >
              <StudiantaSeal className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          </div>

          {/* Botones de acción */}
          {messages.length > 0 && (
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={handleDownloadParchment}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#4A233E] font-cinzel text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37]/20 transition-all"
              >
                {getIcon('download', 'w-4 h-4')}
                <span>Descargar Pergamino</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OraculoPage;

