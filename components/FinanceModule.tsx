
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getIcon, COLORS } from '../constants';

interface FinanceModuleProps {
  transactions: Transaction[];
  onAdd: (t: Transaction) => void;
  isMobile: boolean;
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, onAdd, isMobile }) => {
  const [type, setType] = useState<'Ingreso' | 'Gasto'>('Gasto');

  const income = transactions.filter(t => t.type === 'Ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === 'Gasto').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    if (isNaN(amount)) return;

    const newT: Transaction = {
      id: Math.random().toString(36).substring(7),
      type,
      category: formData.get('category') as string,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      description: '',
    };
    onAdd(newT);
    e.currentTarget.reset();
  };

  return (
    <div className="h-full flex flex-col pb-10">
      <header className="mb-8 px-2">
        <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#4A233E]">Tesorería</h1>
        <p className="text-sm text-[#8B5E75]">Balance de tus recursos académicos.</p>
      </header>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8`}>
        <div className="glass-card p-6 rounded-3xl bg-gradient-to-br from-white/60 to-[#FFF0F5] border-l-4 border-l-[#D4AF37]">
          <span className="text-[9px] uppercase font-black text-[#8B5E75]">Tesoro Actual</span>
          <h2 className={`font-cinzel text-3xl mt-1 ${balance >= 0 ? 'text-[#D4AF37]' : 'text-[#E35B8F]'}`}>
            ${balance.toLocaleString()}
          </h2>
        </div>
        {!isMobile && (
          <>
            <div className="bg-white/40 border border-[#F8C8DC] p-6 rounded-3xl">
              <span className="text-[9px] uppercase font-bold text-[#8B5E75]">Total Ingresos</span>
              <p className="font-cinzel text-2xl text-[#D4AF37]">${income.toLocaleString()}</p>
            </div>
            <div className="bg-white/40 border border-[#F8C8DC] p-6 rounded-3xl">
              <span className="text-[9px] uppercase font-bold text-[#8B5E75]">Total Gastos</span>
              <p className="font-cinzel text-2xl text-[#E35B8F]">${expense.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      <div className={`flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden`}>
        <div className={`${isMobile ? 'order-2' : 'lg:w-1/3 order-1'}`}>
          <div className="glass-card p-6 rounded-[2.5rem]">
            <h3 className="font-cinzel text-lg text-[#4A233E] mb-4">Registro Rápido</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="flex p-1 bg-[#FFD1DC]/30 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setType('Ingreso')}
                  className={`flex-1 py-2 rounded-lg font-cinzel text-[9px] uppercase transition-all ${type === 'Ingreso' ? 'bg-[#D4AF37] text-white' : 'text-[#8B5E75]'}`}
                >
                  Ingreso
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('Gasto')}
                  className={`flex-1 py-2 rounded-lg font-cinzel text-[9px] uppercase transition-all ${type === 'Gasto' ? 'bg-[#E35B8F] text-white' : 'text-[#8B5E75]'}`}
                >
                  Gasto
                </button>
              </div>
              <input required name="amount" type="number" step="0.01" placeholder="Monto ($)" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:outline-none" />
              <select name="category" className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm">
                {type === 'Gasto' ? (
                  <>
                    <option>Libros & Material</option>
                    <option>Transporte</option>
                    <option>Cafetería</option>
                    <option>Suscripciones</option>
                  </>
                ) : (
                  <>
                    <option>Ayuda Familiar</option>
                    <option>Trabajo / Freelance</option>
                    <option>Beca</option>
                  </>
                )}
              </select>
              <button type="submit" className="btn-primary w-full py-3 rounded-xl font-cinzel text-[10px] tracking-widest shadow-lg">REGISTRAR</button>
            </form>
          </div>
        </div>

        <div className={`flex-1 glass-card rounded-[2.5rem] p-6 flex flex-col order-1 lg:order-2 overflow-hidden`}>
          <h3 className="font-cinzel text-lg text-[#4A233E] mb-4">Crónicas Financieras</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {transactions.length === 0 ? (
              <p className="text-center py-10 text-xs italic text-[#8B5E75]">El flujo de tesoros aún no ha comenzado.</p>
            ) : (
              transactions.slice().reverse().map(t => (
                <div key={t.id} className="bg-white/40 border border-[#F8C8DC] p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'Ingreso' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#E35B8F]/10 text-[#E35B8F]'}`}>
                      {t.type === 'Ingreso' ? getIcon('plus', 'w-4 h-4') : getIcon('trash', 'w-4 h-4')}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#4A233E] text-xs">{t.category}</h4>
                      <p className="text-[9px] text-[#8B5E75]">{t.date}</p>
                    </div>
                  </div>
                  <p className={`font-cinzel text-sm ${t.type === 'Ingreso' ? 'text-[#D4AF37]' : 'text-[#E35B8F]'}`}>
                    ${t.amount.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;
