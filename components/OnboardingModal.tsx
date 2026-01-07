import React from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
  isMobile?: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, isMobile = false }) => {
  const handleComplete = () => {
    onComplete();
  };

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[#4A233E]/90 backdrop-blur-lg p-4"
    >
      <div 
        className="glass-card max-w-2xl w-full p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[3rem] text-center shadow-2xl border-2 border-[#D4AF37]/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 sm:mb-8">
          <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl text-[#4A233E] mb-4 font-bold uppercase tracking-widest">
            ¡Bienvenida a Studianta!
          </h2>
          <div className="space-y-4 text-left">
            <p className="font-garamond text-base sm:text-lg text-[#4A233E] leading-relaxed">
              Studianta es tu compañera mágica en el camino académico. Aquí podrás gestionar tus asignaturas, 
              organizar tu calendario, mantener un diario personal y mucho más.
            </p>
            <p className="font-garamond text-base sm:text-lg text-[#4A233E] leading-relaxed">
              A medida que uses la aplicación, ganarás <span className="font-bold text-[#D4AF37]">Esencia</span>, 
              una moneda mágica que te permitirá desbloquear nuevas funcionalidades y alcanzar niveles arcanos más altos.
            </p>
            <p className="font-garamond text-base sm:text-lg text-[#4A233E] leading-relaxed">
              ¡Completa el onboarding para comenzar tu aventura académica y ganar tus primeros puntos de Esencia!
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleComplete}
          className="btn-primary w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-cinzel text-sm sm:text-base tracking-widest font-black uppercase shadow-lg min-h-[48px] touch-manipulation active:scale-95 transition-transform"
          tabIndex={0}
          aria-label="Completar onboarding"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;

