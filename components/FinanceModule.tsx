
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getIcon, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import TreasuryChronicles from './TreasuryChronicles';

interface FinanceModuleProps {
  transactions: Transaction[];
  budget: number;
  onUpdateBudget: (val: number) => void;
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdate: (t: Transaction) => void;
  isMobile: boolean;
}

const GASTO_CATEGORIES = [
  "Alquiler",
  "Apuntes",
  "Comida",
  "Otros"
];

const INGRESO_CATEGORIES = [
  "Mesada",
  "Beca",
  "Sueldo",
  "Venta",
  "Otros"
];

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, budget, onUpdateBudget, onAdd, onDelete, onUpdate, isMobile }) => {
  const [loadingOracle, setLoadingOracle] = useState(false);
  const [oracleDiagnosis, setOracleDiagnosis] = useState<string>('');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [transType, setTransType] = useState<'Ingreso' | 'Gasto'>('Gasto');
  const [rightPanelTab, setRightPanelTab] = useState<'history' | 'oracle'>('history');

  const totalSpent = transactions.filter(t => t.type === 'Gasto').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'Ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = (budget + totalIncome) - totalSpent;
  
  const isCritical = balance < 0;

  // Función para resaltar montos de dinero en el texto
  const highlightAmounts = (text: string, lineIndex: number) => {
    const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const parts: string[] = [];
    const matches: RegExpMatchArray[] = [];
    let lastIndex = 0;
    let match;

    while ((match = amountRegex.exec(text)) !== null) {
      parts.push(text.substring(lastIndex, match.index));
      matches.push(match);
      lastIndex = match.index + match[0].length;
    }
    parts.push(text.substring(lastIndex));

    const result: (string | JSX.Element)[] = [];
    parts.forEach((part, index) => {
      result.push(part);
      if (matches[index]) {
        result.push(
          <span key={`amount-${lineIndex}-${index}`} className="text-[#D4AF37] font-bold">
            {matches[index][0]}
          </span>
        );
      }
    });
    return result;
  };

  // Función para generar PDF del oráculo
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Estilo Rose-Academic
    doc.setFont('helvetica');
    doc.setTextColor(74, 35, 62); // #4A233E
    
    // Título
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('El Veredicto de la Balanza', 105, 30, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(212, 175, 55); // #D4AF37
    doc.setLineWidth(0.5);
    doc.line(60, 35, 150, 35);
    
    // Texto del oráculo con resaltado de montos
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 50;
    const pageWidth = 170;
    const margin = 20;
    
    const paragraphs = oracleDiagnosis.split('\n');
    
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === '') {
        yPos += 5;
        return;
      }
      
      // Procesar cada párrafo línea por línea
      const lines = doc.splitTextToSize(paragraph, pageWidth);
      
      lines.forEach((line: string) => {
        const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
        let xPos = margin;
        let lastIndex = 0;
        let match;
        
        // Procesar la línea buscando montos
        while ((match = amountRegex.exec(line)) !== null) {
          // Texto antes del monto
          if (match.index > lastIndex) {
            const textBefore = line.substring(lastIndex, match.index);
            doc.setTextColor(74, 35, 62);
            doc.setFont('helvetica', 'normal');
            doc.text(textBefore, xPos, yPos);
            xPos += doc.getTextWidth(textBefore);
          }
          
          // Monto resaltado
          doc.setTextColor(212, 175, 55); // #D4AF37
          doc.setFont('helvetica', 'bold');
          doc.text(match[0], xPos, yPos);
          xPos += doc.getTextWidth(match[0]);
          
          lastIndex = match.index + match[0].length;
        }
        
        // Texto restante después del último monto
        if (lastIndex < line.length) {
          doc.setTextColor(74, 35, 62);
          doc.setFont('helvetica', 'normal');
          doc.text(line.substring(lastIndex), xPos, yPos);
        }
        
        yPos += 7;
        
        // Nueva página si es necesario
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      yPos += 3; // Espacio entre párrafos
    });
    
    doc.save('veredicto-balanza.pdf');
  };

  const handleConsultOracle = async () => {
    setRightPanelTab('oracle');
    setLoadingOracle(true);
    const diagnosis = await geminiService.analyzeFinancialHealth(budget, transactions);
    setOracleDiagnosis(diagnosis || '');
    setLoadingOracle(false);
  };

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;

    if (isNaN(amount)) return;

    const newT: Transaction = {
      id: Math.random().toString(36).substring(7),
      type: transType,
      category: category,
      amount: amount,
      date: date || new Date().toISOString().split('T')[0],
      description: description.trim() || category,
    };
    onAdd(newT);
    e.currentTarget.reset();
  };

  const handleSaveBudget = () => {
    onUpdateBudget(parseFloat(tempBudget) || 0);
    setShowBudgetInput(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-inter bg-[#FFF0F5]">
      {/* Header Compacto */}
      <header className="pt-4 pb-2 px-4 flex-shrink-0 bg-[#FFF0F5]/80 backdrop-blur-md border-b border-[#F8C8DC]/30">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-marcellus text-lg md:text-2xl font-black text-[#4A233E] tracking-widest uppercase">Balanza de Latón</h1>
            <button 
              onClick={handleConsultOracle}
              className="px-4 py-2 bg-[#4A233E] text-[#D4AF37] rounded-xl font-marcellus text-xs font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all hover:bg-[#321829] flex items-center gap-2"
            >
              {getIcon('sparkles', 'w-4 h-4')}
              Consultar Oráculo
            </button>
          </div>

          {/* Dashboard de Balance Compacto */}
          <div className="grid grid-cols-2 gap-2 max-w-xl">
            <div className="glass-card p-3 rounded-[1.25rem] border-[#F8C8DC] shadow-sm">
              <p className="text-[7px] md:text-[9px] uppercase font-black tracking-[0.2em] text-[#8B5E75] mb-0.5 opacity-60">Presupuesto</p>
              {showBudgetInput ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#E35B8F] text-base font-marcellus text-[#4A233E] outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveBudget} className="p-1.5 bg-[#E35B8F] text-white rounded-lg shadow-sm">{getIcon('check', 'w-3 h-3')}</button>
                </div>
              ) : (
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowBudgetInput(true)}>
                  <h2 className="font-marcellus text-lg md:text-2xl font-black text-[#4A233E] tracking-tighter">${budget}</h2>
                  {getIcon('pen', 'w-3 h-3 text-[#8B5E75] opacity-0 group-hover:opacity-40 transition-opacity')}
                </div>
              )}
            </div>
            <div className={`glass-card p-3 rounded-[1.25rem] border-2 shadow-sm ${isCritical ? 'border-red-400 bg-red-50' : 'border-[#D4AF37]/30'}`}>
              <p className="text-[7px] md:text-[9px] uppercase font-black tracking-[0.2em] text-[#8B5E75] mb-0.5 opacity-60">Capital Residual</p>
              <h2 className={`font-marcellus text-lg md:text-2xl font-black tracking-tighter ${isCritical ? 'text-red-500' : 'text-[#4A233E]'}`}>${balance}</h2>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-7xl mx-auto w-full pt-3 overflow-hidden">
        {/* Layout Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          
          {/* LADO IZQUIERDO: Registrar Operación */}
          <section className="glass-card p-4 md:p-6 rounded-[2.5rem] border-[#F8C8DC] shadow-2xl bg-white/70 overflow-y-auto no-scrollbar">
            <h3 className="font-marcellus text-sm md:text-base font-black text-[#4A233E] mb-4 text-center tracking-[0.3em] uppercase border-b border-[#F8C8DC] pb-2">Registrar Operación</h3>
            
            <div className="flex bg-[#FDEEF4] p-1 rounded-xl border border-[#F8C8DC] mb-4 shadow-inner">
               <button onClick={() => setTransType('Gasto')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${transType === 'Gasto' ? 'bg-[#E35B8F] text-white shadow-md scale-[1.02]' : 'text-[#8B5E75] hover:bg-white/40'}`}>Gasto</button>
               <button onClick={() => setTransType('Ingreso')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${transType === 'Ingreso' ? 'bg-[#D4AF37] text-white shadow-md scale-[1.02]' : 'text-[#8B5E75] hover:bg-white/40'}`}>Ingreso</button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Concepto de la Transacción</label>
                <input required name="description" type="text" placeholder="Ej: Inscripción Congreso, Apuntes Bioética..." className="w-full bg-white/80 border border-[#F8C8DC] rounded-xl px-4 py-2.5 text-xs text-[#4A233E] font-bold outline-none focus:border-[#E35B8F] transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Monto de Operación</label>
                  <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-white/80 border border-[#F8C8DC] rounded-xl px-4 py-2.5 text-xs text-[#4A233E] font-black outline-none focus:border-[#E35B8F] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Esfera de Gasto</label>
                  <select name="category" className="w-full bg-white/80 border border-[#F8C8DC] rounded-xl px-3 py-2.5 text-xs font-bold text-[#4A233E] outline-none focus:border-[#E35B8F] transition-all">
                    {(transType === 'Gasto' ? GASTO_CATEGORIES : INGRESO_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Fecha del Sello</label>
                <input name="date" type="date" className="w-full bg-white/80 border border-[#F8C8DC] rounded-xl px-4 py-2.5 text-xs text-[#4A233E] font-bold outline-none focus:border-[#E35B8F]" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>

              <button type="submit" className={`w-full py-3 rounded-[1.5rem] font-marcellus text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all active:scale-95 hover:brightness-105 mt-3 ${transType === 'Gasto' ? 'bg-[#E35B8F]' : 'bg-[#D4AF37]'}`}>
                Sellar Operación Financiera
              </button>
            </form>
          </section>

          {/* LADO DERECHO: Crónicas de la Tesorería */}
          <TreasuryChronicles transactions={transactions} onDelete={onDelete} />

        </div>
      </main>

      {/* Oracle Modal Overlay */}
      {loadingOracle && (
        <div className="fixed inset-0 z-[400] bg-[#FFF0F5]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
           <div className="w-24 h-24 border-[6px] border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-10 shadow-2xl" />
           <p className="font-marcellus text-lg font-black text-[#4A233E] tracking-[0.4em] uppercase animate-pulse">Consultando los Pesos Celestiales...</p>
        </div>
      )}

      {oracleDiagnosis && rightPanelTab === 'oracle' && !loadingOracle && (
        <div className="fixed inset-0 z-[400] bg-[#FFF0F5]/95 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col glass-card rounded-[3rem] border-[#F8C8DC] shadow-2xl bg-white/80 overflow-hidden">
            {/* Header del Modal */}
            <div className="flex-shrink-0 text-center pt-8 pb-6 px-8 border-b border-[#F8C8DC]/50">
              <h2 className="font-marcellus text-2xl md:text-4xl font-black text-[#4A233E] mb-3 uppercase tracking-[0.3em]">El Veredicto de la Balanza</h2>
              <div className="h-1 w-20 bg-[#D4AF37] mx-auto rounded-full" />
            </div>

            {/* Contenido con scroll interno */}
            <div className="flex-1 overflow-y-auto px-8 py-6 relative">
              {/* Watermark sutil */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                {getIcon('scale', 'w-[30rem] h-[30rem]')}
              </div>
              
              <div className="relative z-10 text-[#4A233E] font-garamond text-lg md:text-xl leading-[1.8] text-justify space-y-6">
                {oracleDiagnosis.split('\n').map((line, i) => (
                  <p key={i}>
                    {highlightAmounts(line, i)}
                  </p>
                ))}
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex-shrink-0 flex gap-4 p-6 border-t border-[#F8C8DC]/50 bg-white/60 backdrop-blur-sm">
              <button 
                onClick={handleDownloadPDF}
                className="flex-1 py-4 glass-card rounded-[2rem] border-[#F8C8DC] text-[#4A233E] font-marcellus text-sm font-black uppercase tracking-[0.3em] shadow-lg hover:bg-white/80 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {getIcon('download', 'w-5 h-5')}
                Descargar Pergamino
              </button>
              <button 
                onClick={() => {
                  setRightPanelTab('history');
                  setOracleDiagnosis('');
                }}
                className="flex-1 py-4 bg-[#4A233E] text-[#D4AF37] rounded-[2rem] font-marcellus text-sm font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:bg-[#321829] active:scale-95"
              >
                Sellar Veredicto y Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
