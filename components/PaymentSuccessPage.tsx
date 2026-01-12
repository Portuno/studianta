import React from 'react';
import { NavView } from '../types';
import { getIcon } from '../constants';

interface PaymentSuccessPageProps {
  onEnter: () => void;
  isMobile?: boolean;
  isNightMode?: boolean;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ 
  onEnter, 
  isMobile = false,
  isNightMode = false 
}) => {
  return (
    <div className={`h-full flex items-center justify-center p-4 md:p-8 overflow-y-auto ${
      isNightMode ? 'bg-gradient-to-br from-[#302B4F] to-[#1A1625]' : 'bg-gradient-to-br from-[#FFF5FA] to-[#FDE6F4]'
    }`}>
      <div className={`w-full max-w-3xl glass-card rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden ${
        isNightMode 
          ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
          : 'border-2 border-[#D4AF37]/30'
      }`}>
        {/* Refuerzos metálicos en las esquinas */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${
          isNightMode ? 'border-[#A68A56]' : 'border-[#D4AF37]'
        } opacity-60`}></div>
        <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${
          isNightMode ? 'border-[#A68A56]' : 'border-[#D4AF37]'
        } opacity-60`}></div>
        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 ${
          isNightMode ? 'border-[#A68A56]' : 'border-[#D4AF37]'
        } opacity-60`}></div>
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${
          isNightMode ? 'border-[#A68A56]' : 'border-[#D4AF37]'
        } opacity-60`}></div>

        {/* Marca de agua STUDIANTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
          <div className={`font-cinzel text-[15rem] md:text-[20rem] font-black transform -rotate-12 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            STUDIANTA
          </div>
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          {/* Icono de éxito - Corona dorada grande */}
          <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 shadow-2xl ${
            isNightMode 
              ? 'bg-gradient-to-br from-[#C77DFF] to-[#A68A56] border-[rgba(48,43,79,0.8)]' 
              : 'bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-white'
          }`}>
            {getIcon('crown', 'w-12 h-12 md:w-16 md:h-16 text-white')}
          </div>

          {/* Título Principal (H1 - Grande y Dorado) */}
          <h1 className={`font-cinzel text-4xl md:text-6xl font-bold uppercase tracking-widest ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#D4AF37]'
          }`}>
            ¡Muchas gracias por la confianza!
          </h1>

          {/* Subtítulo (H2 - Elegante) */}
          <h2 className={`font-marcellus text-2xl md:text-3xl font-semibold ${
            isNightMode ? 'text-[#C77DFF]' : 'text-[#2D1A26]'
          }`}>
            Tu acceso Premium ha sido confirmado. La biblioteca completa de Studianta ahora es tuya.
          </h2>

          {/* Cuerpo del Texto (Párrafo inspirador) */}
          <p className={`font-garamond text-lg md:text-xl leading-relaxed max-w-2xl ${
            isNightMode ? 'text-[#E0E1DD]/90' : 'text-[#2D1A26]'
          }`}>
            Has dado el paso definitivo hacia tu excelencia. Ya no hay límites, ni barreras, ni contenido bloqueado. 
            Desde este momento, cuentas con las herramientas más poderosas, los oráculos más precisos y el arsenal 
            completo para convertir tus metas en resultados inevitables.
          </p>

          {/* Llamada a la Acción (Botón Principal - Dorado/Ciruela) */}
          <button
            onClick={onEnter}
            className={`mt-8 px-8 md:px-12 py-4 md:py-5 rounded-xl font-cinzel text-lg md:text-xl font-black uppercase tracking-widest shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl ${
              isNightMode
                ? 'bg-gradient-to-r from-[#C77DFF] to-[#A68A56] text-white border-2 border-[#A68A56]'
                : 'bg-gradient-to-r from-[#E35B8F] to-[#D4AF37] text-white border-2 border-[#D4AF37]'
            }`}
          >
            Entrar a mi nuevo Estudio Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
