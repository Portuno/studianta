import React, { useEffect, useState } from 'react';

interface EssenceNotificationProps {
  amount: number;
  onClose: () => void;
  isMobile?: boolean;
  isNightMode?: boolean;
}

const EssenceNotification: React.FC<EssenceNotificationProps> = ({ amount, onClose, isMobile = false, isNightMode = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-cerrar después de 4 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar a que termine la animación
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[600] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div 
        className={`p-4 sm:p-6 rounded-2xl shadow-2xl border-2 min-w-[280px] sm:min-w-[320px] backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/50 shadow-[0_0_30px_rgba(199,125,255,0.3)]' 
            : 'glass-card border-[#D4AF37]/50'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center border-2 border-[#D4AF37]">
              <span className="text-2xl sm:text-3xl">✨</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`font-cinzel text-lg sm:text-xl font-bold uppercase tracking-wide mb-1 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              ¡Esencia Ganada!
            </h3>
            <p className={`font-garamond text-base sm:text-lg transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Has ganado <span className={`font-bold transition-colors duration-500 ${
                isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
              }`}>+{amount} puntos</span> de Esencia
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`flex-shrink-0 p-2 rounded-full transition-colors ${
              isNightMode ? 'text-[#7A748E] hover:bg-[rgba(199,125,255,0.2)]' : 'text-[#8B5E75] hover:bg-[#FFD1DC]'
            }`}
            aria-label="Cerrar notificación"
            tabIndex={0}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EssenceNotification;

