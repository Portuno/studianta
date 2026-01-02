
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
  isMobile: boolean;
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, budget, onUpdateBudget, onAdd, onDelete, isMobile }) => {
  const [loadingOracle, setLoadingOracle] = useState(false);
  const [oracleDiagnosis, setOracleDiagnosis] = useState<string>('');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [transType, setTransType] = useState<'Ingreso' | 'Gasto'>('Gasto');

  const totalSpent = transactions.filter(t => t.type === 'Gasto').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'Ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const availableCapital = budget + totalIncome;
  const balance = availableCapital - totalSpent;
  
  const isHealthy = balance >= availableCapital * 0.2;
  const isCritical = balance < 0;

  const handleConsultOracle = async () => {
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
      description: rawDescription.trim() || category, // If empty, category name is the description
    };
    onAdd(newT);
    e.currentTarget.reset();
  };

  const handleSaveBudget = () => {
    onUpdateBudget(parseFloat(tempBudget) || 0);
    setShowBudgetInput(false);
  };

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
            <div className="mt-6 flex gap-6 text-[11px] font-bold text-[#8B5E75] uppercase tracking-wider font-inter">
              <span className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-green-700">
                {getIcon('plus', 'w-3 h-3')} Ingresos Extra: ${totalIncome.toLocaleString()}
              </span>
              <span className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full text-red-700">
                {getIcon('plus', 'w-3 h-3 rotate-45')} Gastos Totales: ${totalSpent.toLocaleString()}
              </span>
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
        {/* Registro Form */}
        <div className="lg:col-span-7 flex flex-col gap-8 overflow-hidden">
          <div className="glass-card p-8 md:p-10 rounded-[3rem] border-[#F8C8DC] shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
              <h3 className="font-cinzel text-xl text-[#4A233E] font-bold uppercase tracking-widest flex items-center gap-3">
                {getIcon('pen', 'w-6 h-6 text-[#E35B8F]')} Sellar Movimiento
              </h3>
              
              {/* Type Toggle - High Visibility */}
              <div className="flex bg-[#FDEEF4] p-1.5 rounded-[1.5rem] border border-[#F8C8DC] w-full sm:w-auto">
                 <button 
                  type="button"
                  onClick={() => setTransType('Gasto')}
                  className={`flex-1 sm:flex-none px-8 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${transType === 'Gasto' ? 'bg-[#E35B8F] text-white shadow-lg' : 'text-[#8B5E75] hover:text-[#E35B8F]'}`}
                 >
                   {getIcon('plus', 'w-3 h-3 rotate-45')} Gasto
                 </button>
                 <button 
                  type="button"
                  onClick={() => setTransType('Ingreso')}
                  className={`flex-1 sm:flex-none px-8 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${transType === 'Ingreso' ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-[#8B5E75] hover:text-[#D4AF37]'}`}
                 >
                   {getIcon('plus', 'w-3 h-3')} Ingreso
                 </button>
              </div>
            </div>

            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Concepto o Descripción (Opcional)</label>
                <input 
                  name="description" 
                  type="text" 
                  placeholder="Si se omite, se usará el nombre de la categoría..." 
                  className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Materia Económica ($)</label>
                <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none transition-all shadow-inner" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Categoría del Gremio</label>
                <select name="category" className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm outline-none transition-all cursor-pointer">
                  <option value="Alquiler">Alquiler / Residencia</option>
                  <option value="Apuntes">Apuntes y Libros</option>
                  <option value="Comida">Alimentación</option>
                  <option value="Beca/Salario">Beca o Salario</option>
                  <option value="Inversión">Inversión Académica</option>
                  <option value="Ocio">Ocio Reconstructivo</option>
                  <option value="Otros">Otros Misterios</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8B5E75] tracking-widest block mb-2 px-1">Fecha de Registro</label>
                <input name="date" type="date" className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm outline-none transition-all" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  className={`w-full py-4.5 rounded-[1.5rem] font-cinzel text-[11px] font-black uppercase tracking-[0.25em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-white ${transType === 'Gasto' ? 'bg-[#E35B8F]' : 'bg-[#D4AF37]'}`}
                >
                  Sellar {transType}
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card flex-1 p-8 rounded-[3rem] overflow-hidden flex flex-col border-[#F8C8DC] shadow-lg">
            <h3 className="font-cinzel text-lg text-[#4A233E] mb-6 uppercase tracking-widest font-bold">Crónicas de Tesorería</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-3 scroll-sm">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-10">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-4">{getIcon('scale', 'w-8 h-8')}</div>
                  <p className="font-garamond italic text-xl">"El pergamino de cuentas aún no ha sido marcado."</p>
                </div>
              ) : (
                transactions.slice().reverse().map(t => (
                  <div key={t.id} className="bg-white/40 border border-[#F8C8DC]/50 p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white/70 hover:shadow-md transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-[9px] uppercase shadow-sm ${t.type === 'Ingreso' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#E35B8F]/20 text-[#E35B8F]'}`}>
                        {getIcon(t.type === 'Ingreso' ? 'sparkles' : 'low-battery', 'w-5 h-5')}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-[#4A233E] truncate max-w-[150px] md:max-w-none">{t.description}</h4>
                        <p className="text-[10px] text-[#8B5E75] font-inter uppercase tracking-widest font-bold">
                          {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {t.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <p className={`font-cinzel text-lg font-black shrink-0 ${t.type === 'Ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                         {t.type === 'Ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
                       </p>
                       <button 
                        onClick={() => onDelete(t.id)}
                        className="text-[#8B5E75] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white/80 rounded-full shadow-sm"
                       >
                         {getIcon('trash', 'w-4 h-4')}
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Oracle Section */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
          <div className="glass-card h-full rounded-[3.5rem] p-10 flex flex-col border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.1)] relative overflow-hidden bg-gradient-to-br from-white/30 to-[#FFF0F5]/40">
            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none transform rotate-12">
              {getIcon('sparkles', 'w-64 h-64')}
            </div>
            
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-2xl bg-[#4A233E] flex items-center justify-center text-[#D4AF37] shadow-lg">
                  {getIcon('brain', 'w-6 h-6')}
               </div>
               <h3 className="font-cinzel text-2xl text-[#4A233E] font-bold uppercase tracking-[0.2em]">Recinto del Oráculo</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 font-inter text-sm leading-relaxed space-y-8 scroll-sm">
              {oracleDiagnosis ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                   <div className="prose prose-plum max-w-none text-[#4A233E]">
                      {oracleDiagnosis.split('\n').map((line, i) => (
                        <p key={i} className={line.includes(':') ? 'font-bold font-cinzel text-[#E35B8F] mt-6 first:mt-0 uppercase tracking-[0.15em] text-xs border-b border-[#F8C8DC] pb-1 inline-block' : 'font-garamond italic text-base leading-relaxed mt-2'}>
                          {line}
                        </p>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-12">
                   <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] mb-6 animate-pulse shadow-inner">
                     {getIcon('chat', 'w-10 h-10')}
                   </div>
                   <h4 className="font-cinzel text-lg font-bold text-[#4A233E] mb-3 uppercase tracking-widest">Sincronía Económica</h4>
                   <p className="font-garamond italic text-[#8B5E75] text-lg">
                     "Documenta tus flujos vitales y consulta al Oráculo para revelar la verdad sobre tu inercia y destino financiero."
                   </p>
                </div>
              )}
            </div>

            {loadingOracle && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
                 <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-6" />
                 <p className="font-cinzel text-xs font-black text-[#4A233E] tracking-[0.4em] uppercase animate-pulse">Destilando Sabiduría Financiera...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;
