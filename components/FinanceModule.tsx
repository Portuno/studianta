
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getIcon, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';

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
    <div className="min-h-screen flex flex-col pb-24 overflow-y-auto no-scrollbar font-inter bg-[#FFF0F5]">
      {/* Header Compacto */}
      <header className="pt-8 pb-4 px-4 sticky top-0 z-20 bg-[#FFF0F5]/80 backdrop-blur-md border-b border-[#F8C8DC]/30">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-marcellus text-2xl md:text-4xl font-black text-[#4A233E] tracking-widest uppercase">Balanza de Latón</h1>
            <button 
              onClick={handleConsultOracle}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#4A233E] text-[#D4AF37] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105"
            >
              {getIcon('sparkles', 'w-5 h-5 md:w-6 md:h-6')}
            </button>
          </div>

          {/* Dashboard de Balance Compacto */}
          <div className="grid grid-cols-2 gap-4 max-w-3xl">
            <div className="glass-card p-5 rounded-[1.75rem] border-[#F8C8DC] shadow-sm">
              <p className="text-[9px] md:text-[11px] uppercase font-black tracking-[0.2em] text-[#8B5E75] mb-2 opacity-60">Presupuesto</p>
              {showBudgetInput ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#E35B8F] text-xl font-marcellus text-[#4A233E] outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveBudget} className="p-2 bg-[#E35B8F] text-white rounded-lg shadow-sm">{getIcon('check', 'w-4 h-4')}</button>
                </div>
              ) : (
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowBudgetInput(true)}>
                  <h2 className="font-marcellus text-2xl md:text-4xl font-black text-[#4A233E] tracking-tighter">${budget}</h2>
                  {getIcon('pen', 'w-3 h-3 text-[#8B5E75] opacity-0 group-hover:opacity-40 transition-opacity')}
                </div>
              )}
            </div>
            <div className={`glass-card p-5 rounded-[1.75rem] border-2 shadow-sm ${isCritical ? 'border-red-400 bg-red-50' : 'border-[#D4AF37]/30'}`}>
              <p className="text-[9px] md:text-[11px] uppercase font-black tracking-[0.2em] text-[#8B5E75] mb-2 opacity-60">Capital Residual</p>
              <h2 className={`font-marcellus text-2xl md:text-4xl font-black tracking-tighter ${isCritical ? 'text-red-500' : 'text-[#4A233E]'}`}>${balance}</h2>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 max-w-7xl mx-auto w-full pt-8">
        {/* Layout Condicional: En Desktop es un grid de 2 columnas paralelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* LADO IZQUIERDO: La Forja Económica (Formulario) */}
          <section className="glass-card p-8 md:p-12 rounded-[3.5rem] border-[#F8C8DC] shadow-2xl bg-white/70 h-fit">
            <h3 className="font-marcellus text-lg md:text-xl font-black text-[#4A233E] mb-8 text-center tracking-[0.3em] uppercase border-b border-[#F8C8DC] pb-4">Registrar Operación</h3>
            
            <div className="flex bg-[#FDEEF4] p-1.5 rounded-2xl border border-[#F8C8DC] mb-8 shadow-inner">
               <button onClick={() => setTransType('Gasto')} className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${transType === 'Gasto' ? 'bg-[#E35B8F] text-white shadow-md scale-[1.02]' : 'text-[#8B5E75] hover:bg-white/40'}`}>Gasto</button>
               <button onClick={() => setTransType('Ingreso')} className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${transType === 'Ingreso' ? 'bg-[#D4AF37] text-white shadow-md scale-[1.02]' : 'text-[#8B5E75] hover:bg-white/40'}`}>Ingreso</button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Concepto de la Transacción</label>
                <input required name="description" type="text" placeholder="Ej: Inscripción Congreso, Apuntes Bioética..." className="w-full bg-white/80 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm text-[#4A233E] font-bold outline-none focus:border-[#E35B8F] transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Monto de Operación</label>
                  <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-white/80 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm text-[#4A233E] font-black outline-none focus:border-[#E35B8F] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Esfera de Gasto</label>
                  <select name="category" className="w-full bg-white/80 border border-[#F8C8DC] rounded-2xl px-4 py-4 text-sm font-bold text-[#4A233E] outline-none focus:border-[#E35B8F] transition-all">
                    {(transType === 'Gasto' ? GASTO_CATEGORIES : INGRESO_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#8B5E75] uppercase tracking-widest px-1">Fecha del Sello</label>
                <input name="date" type="date" className="w-full bg-white/80 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm text-[#4A233E] font-bold outline-none focus:border-[#E35B8F]" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>

              <button type="submit" className={`w-full py-5 rounded-[2rem] font-marcellus text-xs font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all active:scale-95 hover:brightness-105 mt-4 ${transType === 'Gasto' ? 'bg-[#E35B8F]' : 'bg-[#D4AF37]'}`}>
                Sellar Operación Financiera
              </button>
            </form>
          </section>

          {/* LADO DERECHO: Historial (Crónicas) */}
          <section className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-[11px] md:text-sm font-marcellus font-black uppercase tracking-[0.4em] text-[#4A233E]">Crónicas de la Tesorería</h3>
              <button onClick={() => setRightPanelTab('history')} className="text-[9px] md:text-[10px] font-black text-[#E35B8F] uppercase tracking-widest hover:underline hover:opacity-80 transition-all">Acceder al Archivo</button>
            </div>
            
            <div className="space-y-4 pr-2">
              {transactions.length === 0 ? (
                <div className="py-24 text-center glass-card rounded-[3rem] border-dashed border-2 border-[#F8C8DC]/60">
                  <div className="opacity-20 flex flex-col items-center">
                    {getIcon('scale', 'w-16 h-16 mb-4')}
                    <p className="font-garamond italic text-2xl px-12">"La balanza aguarda el primer peso de tu gestión académica."</p>
                  </div>
                </div>
              ) : (
                transactions.slice(0, 10).map(t => (
                  <div key={t.id} className="glass-card p-5 md:p-6 rounded-[2.5rem] flex items-center justify-between border-[#F8C8DC]/40 bg-white/40 hover:bg-white/70 transition-all shadow-sm group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:rotate-6 ${t.type === 'Ingreso' ? 'bg-[#D4AF37]' : 'bg-[#E35B8F]'}`}>
                        {getIcon(t.type === 'Ingreso' ? 'plus' : 'trash', 'w-5 h-5')}
                      </div>
                      <div>
                        <p className="text-[14px] md:text-[16px] font-bold text-[#4A233E] leading-tight tracking-tight">{t.description}</p>
                        <p className="text-[9px] md:text-[10px] text-[#8B5E75] uppercase font-black opacity-60 tracking-[0.2em] mt-1">{t.category} • {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={`font-marcellus text-lg md:text-2xl font-black ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {t.type === 'Ingreso' ? '+' : '-'}${t.amount}
                      </p>
                      <button onClick={() => onDelete(t.id)} className="text-[9px] text-red-300 uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">Anular</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

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
        <div className="fixed inset-0 z-[400] bg-[#FFF0F5] overflow-y-auto p-10 animate-in fade-in slide-in-from-bottom-10 duration-500 flex flex-col items-center">
           <div className="max-w-4xl w-full relative pt-12">
             <button onClick={() => setRightPanelTab('history')} className="absolute top-0 right-0 text-[#4A233E] p-6 hover:scale-125 transition-all active:rotate-90">
                {getIcon('trash', 'w-10 h-10 rotate-45 opacity-40')}
             </button>
             
             <div className="text-center mb-16">
               <h2 className="font-marcellus text-3xl md:text-5xl font-black text-[#4A233E] mb-4 uppercase tracking-[0.3em]">El Veredicto de la Balanza</h2>
               <div className="h-1 w-24 bg-[#D4AF37] mx-auto rounded-full" />
             </div>

             <div className="glass-card p-10 md:p-16 rounded-[4rem] border-[#D4AF37]/30 shadow-2xl bg-white/80 relative">
               {/* Watermark sutil */}
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                  {getIcon('scale', 'w-[40rem] h-[40rem]')}
               </div>
               
               <div className="prose prose-plum max-w-none text-[#4A233E] font-garamond italic text-2xl md:text-3xl leading-relaxed space-y-8 text-justify relative z-10">
                 {oracleDiagnosis.split('\n').map((line, i) => (
                   <p key={i}>{line}</p>
                 ))}
               </div>
             </div>

             <button onClick={() => setRightPanelTab('history')} className="mt-16 w-full py-6 bg-[#4A233E] text-[#D4AF37] rounded-[2.5rem] font-marcellus text-sm font-black uppercase tracking-[0.5em] shadow-2xl transition-all hover:bg-[#321829] hover:shadow-pink-200/50">
                Sellar Veredicto y Volver
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
