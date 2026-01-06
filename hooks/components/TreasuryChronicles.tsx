import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getIcon } from '../constants';

interface TreasuryChroniclesProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TreasuryChronicles: React.FC<TreasuryChroniclesProps> = ({ transactions, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Paginación
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Resetear a la primera página si la página actual está fuera de rango
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [transactions.length, currentPage, totalPages]);

  return (
    <section className="glass-card p-4 md:p-6 rounded-[2.5rem] border-[#F8C8DC] shadow-2xl bg-white/70 flex flex-col gap-3 overflow-hidden h-full">
      <div className="flex justify-between items-center px-2 flex-shrink-0">
        <h3 className="text-[11px] md:text-sm font-marcellus font-black uppercase tracking-[0.4em] text-[#4A233E]">Crónicas de la Tesorería</h3>
      </div>
      
      <div className="flex-1 space-y-2 pr-2 overflow-y-auto no-scrollbar">
        {transactions.length === 0 ? (
          <div className="py-12 text-center glass-card rounded-[3rem] border-dashed border-2 border-[#F8C8DC]/60">
            <div className="opacity-20 flex flex-col items-center">
              {getIcon('scale', 'w-10 h-10 mb-3')}
              <p className="font-garamond italic text-base px-6">"La balanza aguarda el primer peso de tu gestión académica."</p>
            </div>
          </div>
        ) : (
          <>
            {paginatedTransactions.map(t => (
              <div key={t.id} className="glass-card p-3 md:p-4 rounded-[2rem] flex items-center justify-between border-[#F8C8DC]/40 bg-white/40 hover:bg-white/70 transition-all shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:rotate-6 ${t.type === 'Ingreso' ? 'bg-[#D4AF37]' : 'bg-[#E35B8F]'}`}>
                    {getIcon(t.type === 'Ingreso' ? 'plus' : 'trash', 'w-4 h-4')}
                  </div>
                  <div>
                    <p className="text-[12px] md:text-[14px] font-bold text-[#4A233E] leading-tight tracking-tight">{t.description}</p>
                    <p className="text-[8px] md:text-[9px] text-[#8B5E75] uppercase font-black opacity-60 tracking-[0.2em] mt-0.5">{t.category} • {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-marcellus text-sm md:text-lg font-black ${t.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'Ingreso' ? '+' : '-'}${t.amount}
                  </p>
                  <button onClick={() => onDelete(t.id)} className="text-[8px] text-red-300 uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">Anular</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Paginación */}
      {transactions.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 pt-2 pb-1 flex-shrink-0">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 glass-card rounded-xl border-[#F8C8DC] text-[#4A233E] font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/70 transition-all"
          >
            Anterior
          </button>
          <span className="text-[#8B5E75] font-black text-[10px] uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 glass-card rounded-xl border-[#F8C8DC] text-[#4A233E] font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/70 transition-all"
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
};

export default TreasuryChronicles;

