import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getIcon } from '../constants';

interface TreasuryChroniclesProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  isNightMode?: boolean;
}

const TreasuryChronicles: React.FC<TreasuryChroniclesProps> = ({ transactions, onDelete, isNightMode = false }) => {
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
    <section className={`p-4 md:p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-3 overflow-hidden h-full transition-colors duration-500 ${
      isNightMode 
        ? 'bg-[rgba(48,43,79,0.6)] border-2 border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
        : 'glass-card border-[#F8C8DC] bg-white/70'
    }`}>
      <div className="flex justify-between items-center px-2 flex-shrink-0">
        <h3 className={`text-[11px] md:text-sm font-marcellus font-black uppercase tracking-[0.4em] transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
        }`}>Crónicas de la Tesorería</h3>
      </div>
      
      <div className="flex-1 space-y-2 pr-2 overflow-y-auto no-scrollbar">
        {transactions.length === 0 ? (
          <div className={`py-12 text-center rounded-[3rem] border-dashed border-2 transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
              : 'glass-card border-[#F8C8DC]/60'
          }`}>
            <div className="opacity-20 flex flex-col items-center">
              {getIcon('scale', 'w-10 h-10 mb-3')}
              <p className={`font-garamond italic text-base px-6 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>"La balanza aguarda el primer peso de tu gestión académica."</p>
            </div>
          </div>
        ) : (
          <>
            {paginatedTransactions.map(t => (
              <div key={t.id} className={`p-3 md:p-4 rounded-[2rem] flex items-center justify-between transition-all shadow-sm group ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,1)]' 
                  : 'glass-card border-[#F8C8DC]/40 bg-white/40 hover:bg-white/70'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:rotate-6 ${
                    t.type === 'Ingreso' 
                      ? isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                      : isNightMode ? 'bg-[#C77DFF]' : 'bg-[#E35B8F]'
                  }`}>
                    {getIcon(t.type === 'Ingreso' ? 'plus' : 'trash', 'w-4 h-4')}
                  </div>
                  <div>
                    <p className={`text-[12px] md:text-[14px] font-bold leading-tight tracking-tight transition-colors duration-500 ${
                      isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                    }`}>{t.description}</p>
                    <p className={`text-[8px] md:text-[9px] uppercase font-black opacity-60 tracking-[0.2em] mt-0.5 transition-colors duration-500 ${
                      isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                    }`}>{t.category} • {new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-marcellus text-sm md:text-lg font-black transition-colors duration-500 ${
                    t.type === 'Ingreso' 
                      ? isNightMode ? 'text-emerald-400' : 'text-emerald-600'
                      : isNightMode ? 'text-rose-400' : 'text-rose-500'
                  }`}>
                    {t.type === 'Ingreso' ? '+' : '-'}${t.amount}
                  </p>
                  <button onClick={() => onDelete(t.id)} className={`text-[8px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transition-colors duration-500 ${
                    isNightMode ? 'text-red-400 hover:text-red-300' : 'text-red-300 hover:text-red-500'
                  }`}>Anular</button>
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
            className={`px-3 py-1.5 rounded-xl font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,1)]' 
                : 'glass-card border-[#F8C8DC] text-[#4A233E] hover:bg-white/70'
            }`}
          >
            Anterior
          </button>
          <span className={`font-black text-[10px] uppercase tracking-widest transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,1)]' 
                : 'glass-card border-[#F8C8DC] text-[#4A233E] hover:bg-white/70'
            }`}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
};

export default TreasuryChronicles;

