
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
  "Alimentación",
  "Transporte",
  "Material de Estudio",
  "Ocio",
  "Servicios",
  "Otra"
];

const INGRESO_CATEGORIES = [
  "Mesada/Familiar",
  "Beca",
  "Sueldo",
  "Venta",
  "Premio",
  "Otra"
];

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, budget, onUpdateBudget, onAdd, onDelete, onUpdate, isMobile }) => {
  const [loadingOracle, setLoadingOracle] = useState(false);
  const [oracleDiagnosis, setOracleDiagnosis] = useState<string>('');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [transType, setTransType] = useState<'Ingreso' | 'Gasto'>('Gasto');
  const [rightPanelTab, setRightPanelTab] = useState<'history' | 'oracle'>('history');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalSpent = transactions.filter(t => t.type === 'Gasto').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'Ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const availableCapital = budget + totalIncome;
  const balance = availableCapital - totalSpent;
  
  const isHealthy = balance >= availableCapital * 0.2;
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
    const rawDescription = formData.get('description') as string;

    if (isNaN(amount)) return;

    const newT: Transaction = {
      id: Math.random().toString(36).substring(7),
      type: transType,
      category: category,
      amount: amount,
      date: date || new Date().toISOString().split('T')[0],
      description: rawDescription.trim() || category,
    };
    onAdd(newT);
    e.currentTarget.reset();
  };

  const handleSaveBudget = () => {
    const newBudget = parseFloat(tempBudget) || 0;
    if (newBudget !== budget) {
      // Log budget change as an income/expense adjustment record
      const diff = newBudget - budget;
      const logEntry: Transaction = {
        id: Math.random().toString(36).substring(7),
        type: diff >= 0 ? 'Ingreso' : 'Gasto',
        category: 'Ajuste Tesorería',
        amount: Math.abs(diff),
        date: new Date().toISOString().split('T')[0],
        description: `Actualización de Presupuesto Mensual (${budget} -> ${newBudget})`,
      };
      onAdd(logEntry);
    }
    onUpdateBudget(newBudget);
    setShowBudgetInput(false);
  };

  const categories = transType === 'Gasto' ? GASTO_CATEGORIES : INGRESO_CATEGORIES;

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="h-full flex flex-col pb-10">
      <header className="mb-8 px-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#4A233E]">Balanza de Latón</h1>
            <p className="text-sm text-[#8B5E75] font-inter italic">Equilibrio y administración de la materia económica.</p>
          </div>
          <button 
            onClick={handleConsultOracle}
            disabled={loadingOracle || transactions.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-[#4A233E] text-white rounded-2xl font-cinzel text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loadingOracle ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : getIcon('sparkles', 'w-4 h-4 text-[#D4AF37]')}
            Consultar Oráculo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-8 rounded-[3rem] relative overflow-hidden group border-[#F8C8DC]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8B5E75]">Presupuesto Mensual Base</span>
                {showBudgetInput ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      autoFocus
                      type="number" 
                      value={tempBudget}
                      onChange={(e) => setTempBudget(e.target.value)}
                      className="bg-white/60 border-2 border-[#E35B8F] rounded-xl px-4 py-2 text-2xl font-cinzel text-[#4A233E] w-48 outline-none shadow-inner"
                    />
                    <button onClick={handleSaveBudget} className="text-[#D4AF37] hover:scale-110 transition-transform">
                      {getIcon('check', 'w-8 h-8')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 group mt-1">
                    <h2 className="font-cinzel text-5xl text-[#4A233E] tracking-tight">${budget.toLocaleString()}</h2>
                    <button onClick={() => setShowBudgetInput(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#8B5E75] hover:text-[#E35B8F]">
                      {getIcon('pen', 'w-5 h-5')}
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[#D4AF37] opacity-20 transform -rotate-12">{getIcon('scale', 'w-16 h-16')}</div>
            </div>
          </div>

          <div className={`glass-card p-8 rounded-[3rem] border-2 transition-all duration-700 flex flex-col justify-center ${isCritical ? 'border-red-400 bg-red-50/40 shadow-red-100 shadow-2xl' : isHealthy ? 'border-green-400 bg-green-50/40 shadow-green-100 shadow-2xl' : 'border-[#D4AF37]/40 shadow-amber-100 shadow-2xl'}`}>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8B5E75]">Esencia de Capital Residual</span>
            <div className="flex justify-between items-end mt-2">
              <h2 className={`font-cinzel text-5xl tracking-tight ${isCritical ? 'text-red-600' : 'text-[#4A233E]'}`}>
                ${balance.toLocaleString()}
              </h2>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-2xl shadow-sm ${isCritical ? 'bg-red-500 text-white animate-pulse' : isHealthy ? 'bg-green-500 text-white' : 'bg-[#D4AF37] text-white'}`}>
                {isCritical ? 'Déficit Crítico' : isHealthy ? 'Tesorería Estable' : 'Inercia de Gasto'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Formulario Principal */}
        <div className="lg:col-span-4 flex flex-col gap-8 h-full">
          <div className="glass-card flex-1 p-8 rounded-[3rem] border-[#F8C8DC] shadow-2xl flex flex-col justify-center bg-white/40">
            <h3 className="font-marcellus text-xl text-[#4A233E] mb-8 text-center font-bold uppercase tracking-[0.2em]">Registrar Operación</h3>
            
            <div className="mb-10">
              <div className="flex bg-[#FDEEF4] p-1.5 rounded-[2.2rem] border border-[#F8C8DC] w-full shadow-inner">
                 <button 
                  type="button"
                  onClick={() => setTransType('Gasto')}
                  className={`flex-1 py-4.5 rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${transType === 'Gasto' ? 'bg-[#E35B8F] text-white shadow-xl scale-105' : 'text-[#8B5E75] hover:text-[#E35B8F]'}`}
                 >
                   {getIcon('plus', 'w-5 h-5 rotate-45')} Gasto
                 </button>
                 <button 
                  type="button"
                  onClick={() => setTransType('Ingreso')}
                  className={`flex-1 py-4.5 rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${transType === 'Ingreso' ? 'bg-[#D4AF37] text-white shadow-xl scale-105' : 'text-[#8B5E75] hover:text-[#D4AF37]'}`}
                 >
                   {getIcon('plus', 'w-5 h-5')} Ingreso
                 </button>
              </div>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-6 font-inter">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Concepto o Descripción</label>
                <input 
                  name="description" 
                  type="text" 
                  placeholder="Ej: Material de Anatomía..." 
                  className="w-full bg-white/60 border-2 border-[#F8C8DC]/30 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none shadow-sm font-bold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Monto ($)</label>
                  <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-white/60 border-2 border-[#F8C8DC]/30 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none font-black" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Categoría</label>
                  <select name="category" className="w-full bg-white/60 border-2 border-[#F8C8DC]/30 rounded-2xl px-6 py-4 text-sm outline-none font-bold text-[#4A233E]">
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Fecha</label>
                <input name="date" type="date" className="w-full bg-white/60 border-2 border-[#F8C8DC]/30 rounded-2xl px-6 py-4 text-sm outline-none font-bold" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              
              <button 
                type="submit" 
                className={`w-full py-6 rounded-[2.2rem] font-cinzel text-sm font-black uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.03] active:scale-95 text-white mt-8 ${transType === 'Gasto' ? 'bg-[#E35B8F]' : 'bg-[#D4AF37]'}`}
              >
                Sellar {transType}
              </button>
            </form>
          </div>
        </div>

        {/* Panel Derecho: Historial y Oráculo */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <div className="glass-card h-full rounded-[3.5rem] flex flex-col border-[#D4AF37]/40 shadow-2xl relative overflow-hidden bg-white/20">
            {/* Toggle Panel Superior */}
            <div className="bg-[#4A233E] p-4 flex gap-4 border-b border-[#D4AF37]/30">
               <button 
                onClick={() => setRightPanelTab('history')}
                className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${rightPanelTab === 'history' ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
               >
                 Crónicas de Tesorería
               </button>
               <button 
                onClick={() => setRightPanelTab('oracle')}
                className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${rightPanelTab === 'oracle' ? 'bg-[#E35B8F] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
               >
                 {getIcon('brain', 'w-4 h-4')} Recinto del Oráculo
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 scroll-sm">
              {rightPanelTab === 'history' ? (
                <div className="space-y-4">
                  {sortedTransactions.length === 0 ? (
                    <div className="h-full py-32 flex flex-col items-center justify-center opacity-30 text-center px-12">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-8">{getIcon('scale', 'w-12 h-12')}</div>
                      <p className="font-garamond italic text-2xl">"Las crónicas aguardan el primer movimiento de tu esencia capital."</p>
                    </div>
                  ) : (
                    sortedTransactions.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => setEditingTransaction(t)}
                        className="bg-white/70 border border-[#F8C8DC]/50 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-white hover:shadow-2xl hover:translate-x-3 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-8">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${t.type === 'Ingreso' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#E35B8F]/20 text-[#E35B8F]'}`}>
                            {getIcon(t.category === 'Ajuste Tesorería' ? 'scale' : (t.type === 'Ingreso' ? 'sparkles' : 'low-battery'), 'w-7 h-7')}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-[#4A233E] truncate max-w-[300px]">{t.description}</h4>
                            <p className="text-[11px] text-[#8B5E75] font-inter uppercase tracking-widest font-black opacity-60">
                              {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} • {t.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <p className={`font-cinzel text-2xl font-black ${t.type === 'Ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                             {t.type === 'Ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
                           </p>
                           <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                            className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-4"
                           >
                             {getIcon('trash', 'w-6 h-6')}
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">
                  {oracleDiagnosis ? (
                    <div className="prose prose-plum max-w-none text-[#4A233E]">
                      {oracleDiagnosis.split('\n').map((line, i) => (
                        <p key={i} className={line.includes(':') ? 'font-black font-marcellus text-[#E35B8F] mt-10 first:mt-0 uppercase tracking-[0.2em] text-sm border-b border-[#F8C8DC] pb-2 inline-block' : 'font-garamond italic text-xl leading-relaxed mt-4'}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full py-40 flex flex-col items-center justify-center text-center px-16 opacity-50">
                       <div className="w-32 h-32 rounded-full border-2 border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] mb-10 animate-pulse">
                         {getIcon('chat', 'w-16 h-16')}
                       </div>
                       <h4 className="font-marcellus text-2xl font-bold text-[#4A233E] mb-6 uppercase tracking-widest">Sincronía de la Balanza</h4>
                       <p className="font-garamond italic text-2xl max-w-lg">
                         "Solicita un diagnóstico para revelar los patrones ocultos en tu flujo de capital."
                       </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {loadingOracle && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xl flex flex-col items-center justify-center z-50">
                 <div className="w-24 h-24 border-8 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-10 shadow-2xl" />
                 <p className="font-cinzel text-base font-black text-[#4A233E] tracking-[0.6em] uppercase animate-pulse">Canalizando Sabiduría Arfwedsonita...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición de Crónica */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4">
           <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updated: Transaction = {
                ...editingTransaction,
                description: formData.get('description') as string,
                amount: parseFloat(formData.get('amount') as string),
                category: formData.get('category') as string,
                date: formData.get('date') as string,
              };
              onUpdate(updated);
              setEditingTransaction(null);
            }}
            className="glass-card w-full max-w-lg p-12 rounded-[4rem] shadow-2xl border-2 border-[#D4AF37] animate-in zoom-in duration-300"
           >
             <h2 className="font-cinzel text-2xl text-[#4A233E] mb-10 text-center font-bold uppercase tracking-[0.2em]">Refinar Crónica</h2>
             <div className="space-y-6 font-inter">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Concepto</label>
                  <input name="description" defaultValue={editingTransaction.description} className="w-full bg-white/60 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Monto ($)</label>
                    <input name="amount" type="number" step="0.01" defaultValue={editingTransaction.amount} className="w-full bg-white/60 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm font-black" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Categoría</label>
                    <select name="category" defaultValue={editingTransaction.category} className="w-full bg-white/60 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm font-bold">
                       {[...GASTO_CATEGORIES, ...INGRESO_CATEGORIES, 'Ajuste Tesorería'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Fecha</label>
                  <input name="date" type="date" defaultValue={editingTransaction.date} className="w-full bg-white/60 border border-[#F8C8DC] rounded-2xl px-6 py-4 text-sm font-bold" />
                </div>
             </div>
             <div className="flex gap-6 mt-12">
                <button type="button" onClick={() => setEditingTransaction(null)} className="flex-1 py-4 text-xs font-black text-[#8B5E75] uppercase tracking-widest hover:bg-[#FDEEF4] rounded-2xl">Cerrar</button>
                <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl font-cinzel text-xs font-black uppercase tracking-[0.3em] shadow-xl">Guardar Cambios</button>
             </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
