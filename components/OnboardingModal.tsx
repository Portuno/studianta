import React, { useState } from 'react';
import { PenTool, GraduationCap } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
  isMobile?: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, isMobile = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = () => {
    if (currentStep === 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(2);
        // Esperar un frame para que el DOM se actualice antes de quitar la transición
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        });
      }, 600);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(1);
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        });
      }, 600);
    }
  };

  const handleComplete = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ backgroundColor: '#FFF9FB' }}
    >
      <div 
        className="w-[80%] max-w-4xl flex flex-col items-center justify-center min-h-[80vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono Superior */}
        <div className="mb-12 flex-shrink-0">
          <div 
            className={`transition-all ease-in-out ${
              isTransitioning 
                ? 'opacity-0 -translate-y-5' 
                : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {currentStep === 1 ? (
              <PenTool className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />
            ) : (
              <GraduationCap className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {/* Contenido del Paso */}
        <div 
          className={`flex-1 w-full flex flex-col items-center justify-center transition-all ease-in-out ${
            isTransitioning 
              ? 'opacity-0 translate-y-5' 
              : 'opacity-100 translate-y-0'
          }`}
          style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {currentStep === 1 ? (
            // Paso 1: Bienvenida
            <div className="w-full text-center space-y-8">
              <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl text-[#4A233E] font-bold">
                ¡Bienvenida a Studianta!
              </h1>
              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed">
                  Tu compañera mágica en el camino académico. Gestiona tus asignaturas, 
                  organiza tu calendario y mantén un diario personal.
                </p>
                <p className="font-inter text-base md:text-lg text-[#4A233E]/70 leading-relaxed">
                  A medida que uses la aplicación, ganarás <span className="font-bold text-[#D4AF37]">Esencia</span>, 
                  una moneda mágica que te permitirá desbloquear nuevas funcionalidades.
                </p>
              </div>
            </div>
          ) : (
            // Paso 2: Información adicional
            <div className="w-full text-center space-y-8">
              <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl text-[#4A233E] font-bold">
                Comienza tu Aventura
              </h1>
              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed">
                  Completa el onboarding para comenzar tu aventura académica y ganar tus primeros 
                  <span className="font-bold text-[#D4AF37]"> 300 puntos de Esencia</span>.
                </p>
                <p className="font-inter text-base md:text-lg text-[#4A233E]/70 leading-relaxed">
                  Explora todas las funcionalidades y descubre cómo Studianta puede ayudarte a alcanzar tus objetivos académicos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Navegación */}
        <div 
          className={`mt-12 flex-shrink-0 w-full flex gap-6 transition-all ease-in-out ${
            isTransitioning 
              ? 'opacity-0 translate-y-5' 
              : 'opacity-100 translate-y-0'
          }`}
          style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {currentStep === 1 ? (
            // Paso 1: Solo botón "Comenzar" (centrado)
            <button 
              onClick={handleNext}
              className="mx-auto px-16 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center"
              tabIndex={0}
              aria-label="Comenzar onboarding"
            >
              Comenzar
            </button>
          ) : (
            // Paso 2: Botón "Anterior" (izquierda) y "Finalizar" (derecha)
            <div className="w-full flex gap-6 justify-between max-w-md mx-auto">
              <button 
                onClick={handlePrevious}
                className="flex-1 px-8 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all duration-300 min-h-[56px] touch-manipulation text-center"
                tabIndex={0}
                aria-label="Paso anterior"
              >
                Anterior
              </button>
              <button 
                onClick={handleComplete}
                className="flex-1 px-8 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center"
                tabIndex={0}
                aria-label="Finalizar onboarding"
              >
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
