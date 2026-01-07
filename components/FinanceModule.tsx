
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getIcon, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import TreasuryChronicles from './TreasuryChronicles';
import { addSealToPDF } from '../utils/pdfSeal';
import { processMarkdownToHTML } from '../utils/markdownProcessor';
import { parseOracleText } from '../utils/oracleTextParser';
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
  const [showPetFirstTime, setShowPetFirstTime] = useState(true);

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

  // Función para generar PDF del oráculo - Pergamino Académico de alta fidelidad
  const handleDownloadPDF = async () => {
    try {
      // Crear un elemento HTML temporal oculto con el contenido estilizado
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // Ancho A4
      tempDiv.style.backgroundColor = '#FFFFFF';
      tempDiv.style.fontFamily = "'EB Garamond', 'Times New Roman', serif";

      // Procesar el markdown del oráculo
      const processedHTML = processMarkdownToHTML(oracleDiagnosis);

      // Crear el HTML completo del pergamino (sin el recuadro, se agregará en cada página del PDF)
      tempDiv.innerHTML = `
        <div style="
          background-color: #FFFFFF;
          position: relative;
          padding: 15mm 20mm;
          box-sizing: border-box;
        ">
          <!-- Encabezado -->
          <div style="
            text-align: center;
            margin-bottom: 25mm;
            position: relative;
            padding-top: 5mm;
          ">
            <h1 style="
              font-family: 'Marcellus', 'Cinzel', 'Times New Roman', serif;
              color: #4A233E;
              font-size: 24pt;
              font-weight: 700;
              margin: 0;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            ">EL VEREDICTO DEL ORÁCULO</h1>
            
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

          <!-- Cuerpo del texto -->
          <div style="
            color: #374151;
            font-family: 'EB Garamond', 'Times New Roman', serif;
            font-size: 11.5pt;
            line-height: 1.8;
            text-align: justify;
          ">
            ${processedHTML}
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
      const scale = pdfWidth / imgWidthMm;
      const ratio = scale;
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
        
        // Ajustar para evitar cortes muy pequeños al final (menos de 50px)
        if (remainingHeight - currentPageHeightPx < 50 && remainingHeight - currentPageHeightPx > 0) {
          // Si queda muy poco, incluir todo en esta página para evitar páginas casi vacías
          currentPageHeightPx = remainingHeight;
        }
        
        if (currentPageHeightPx <= 0) {
          break;
        }
        
        // Calcular altura en mm - usar altura completa del área útil excepto en la última página si es más pequeña
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

      pdf.save('veredicto-oraculo.pdf');
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    }
  };

  const handleConsultOracle = async () => {
    setRightPanelTab('oracle');
    setLoadingOracle(true);
    const diagnosis = await geminiService.analyzeFinancialHealth(budget, transactions);
    setOracleDiagnosis(diagnosis || '');
    setLoadingOracle(false);
    // Después de la primera consulta, no mostrar la mascota de nuevo
    if (showPetFirstTime) {
      setShowPetFirstTime(false);
    }
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
          {/* Desktop: Título y botón en fila superior */}
          <div className="hidden md:flex justify-between items-center mb-3">
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
          {/* Mobile: 3 columnas (Presupuesto, Capital, Consultar Oráculo) */}
          {/* Desktop: 2 columnas (Presupuesto, Capital) + botón arriba */}
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-3' : 'md:grid-cols-2 max-w-xl'}`}>
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
            {/* Botón Consultar Oráculo solo visible en mobile */}
            {isMobile && (
              <button 
                onClick={handleConsultOracle}
                className="glass-card p-3 rounded-[1.25rem] border-[#F8C8DC] shadow-sm bg-[#4A233E] text-[#D4AF37] flex flex-col items-center justify-center font-marcellus text-[7px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all hover:bg-[#321829]"
              >
                {getIcon('sparkles', 'w-4 h-4 mb-1')}
                <span className="text-center leading-tight">Consultar<br />Oráculo</span>
              </button>
            )}
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
          {showPetFirstTime && (
            <div className="mb-8">
              <PetAnimation show={true} size="xlarge" />
            </div>
          )}
          {!showPetFirstTime && (
            <div className="w-24 h-24 border-[6px] border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-10 shadow-2xl" />
          )}
           <p className="font-marcellus text-lg font-black text-[#4A233E] tracking-[0.4em] uppercase animate-pulse">Consultando los Pesos Celestiales...</p>
        </div>
      )}

      {oracleDiagnosis && rightPanelTab === 'oracle' && !loadingOracle && (
        <div className="fixed inset-0 z-[400] bg-[#FFF0F5]/95 backdrop-blur-2xl flex items-center justify-center p-6" onClick={() => { setRightPanelTab('history'); setOracleDiagnosis(''); }}>
          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col glass-card rounded-[3rem] border-[#F8C8DC] shadow-2xl bg-white/80 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div className="flex-shrink-0 text-center pt-8 pb-6 px-8 border-b border-[#F8C8DC]/50">
              <h2 className="font-marcellus text-2xl md:text-4xl font-black text-[#4A233E] mb-3 uppercase tracking-[0.3em]">El Veredicto de la Balanza</h2>
              <div className="h-1 w-20 bg-[#D4AF37] mx-auto rounded-full" />
            </div>

            {/* Contenido con scroll interno - Pergamino Digital */}
            <div className="flex-1 overflow-y-auto px-8 py-6 relative">
              {/* Watermark sutil */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                {getIcon('scale', 'w-[30rem] h-[30rem]')}
              </div>
              
              {/* Contenedor del Pergamino */}
              <div className="relative z-10 bg-[#FFF9FB] rounded-lg border-2 border-[#D4AF37]/30 p-6 md:p-8 shadow-inner">
                <div className="space-y-4">
                  {parseOracleText(oracleDiagnosis)}
                </div>
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
