import React, { useState } from 'react';
import { PenTool, GraduationCap, Sparkles, BookOpen, LayoutGrid, Zap } from 'lucide-react';
import PetAnimation from './PetAnimation';

interface OnboardingData {
  fullName: string;
  academicStage: string;
  interests: string[];
  referralSource: string;
}

interface OnboardingModalProps {
  onComplete: (data?: OnboardingData, completeOnboarding?: boolean) => void;
  isMobile?: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, isMobile = false }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0 = inicio, 1-4 = Acto I, 5 = confirmación Acto I, 6 = Ati, 7-9 = Acto II
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAtiAnimation, setShowAtiAnimation] = useState(false);
  
  // Datos del formulario
  const [fullName, setFullName] = useState('');
  const [academicStage, setAcademicStage] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [referralSource, setReferralSource] = useState('');

  const academicStages = [
    'Secundaria / Bachillerato',
    'Estudios Universitarios',
    'Postgrado / PhD / Investigación',
    'Docencia / Formación',
    'Aprendizaje Independiente / Profesional'
  ];

  const interestOptions = [
    'Productividad y Enfoque',
    'Ciencia y Tecnología',
    'Artes y Diseño',
    'Bienestar y Salud',
    'Negocios y Liderazgo',
    'Humanidades y Cultura'
  ];

  const referralSources = [
    'Redes Sociales',
    'Recomendación de una amiga',
    'Búsqueda en internet',
    'Publicidad'
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 600);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0 && currentStep < 6) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 600);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFinish = () => {
    // Solo avanzar al paso de confirmación
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(5);
      setIsTransitioning(false);
    }, 600);
  };

  const handleFinalContinue = async () => {
    // Preparar datos para enviar del Acto I
    const onboardingData: OnboardingData = {
      fullName,
      academicStage,
      interests,
      referralSource
    };
    
    // Guardar datos del Acto I
    await onComplete(onboardingData, false);
    
    // Mostrar animación de Ati
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(6);
      setShowAtiAnimation(true);
      setIsTransitioning(false);
    }, 600);
  };

  const handleAtiAnimationEnd = () => {
    // Avanzar al Acto II después de la animación
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(7);
      setIsTransitioning(false);
      setShowAtiAnimation(false);
    }, 600);
  };

  const handleActoIINext = () => {
    if (currentStep < 9) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 600);
    }
  };

  const handleActoIIPrevious = () => {
    if (currentStep > 6) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 600);
    }
  };

  const handleEnterSanctuary = () => {
    // Marcar onboarding como completo y navegar al Dashboard
    onComplete(undefined, true);
  };

  const getIcon = () => {
    switch (currentStep) {
      case 0:
        return <PenTool className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 1:
        return <BookOpen className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 2:
        return <GraduationCap className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 3:
        return <Sparkles className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 4:
        return <PenTool className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 7:
        return <LayoutGrid className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 8:
        return <Zap className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      case 9:
        return <Sparkles className="w-20 h-20 text-[#D4AF37]" strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return fullName.trim().length > 0;
      case 2:
        return academicStage.length > 0;
      case 3:
        return true;
      case 4:
        return referralSource.length > 0;
      default:
        return true;
    }
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
        {currentStep !== 5 && currentStep !== 6 && getIcon() && (
          <div className="mb-12 flex-shrink-0">
            <div 
              className={`transition-all ease-in-out ${
                isTransitioning 
                  ? 'opacity-0 -translate-y-5' 
                  : 'opacity-100 translate-y-0'
              }`}
              style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              {getIcon()}
            </div>
          </div>
        )}

        {/* Animación de Ati (Paso 6) */}
        {currentStep === 6 && (
          <div 
            className={`flex-1 w-full flex flex-col items-center justify-center transition-all ease-in-out ${
              isTransitioning 
                ? 'opacity-0 translate-y-5' 
                : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="mb-8">
              <PetAnimation 
                show={showAtiAnimation} 
                onAnimationEnd={handleAtiAnimationEnd}
                size="large"
              />
            </div>
            <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 text-center max-w-2xl mx-auto leading-relaxed">
              Ahora que te conocemos, es momento de descubrir el ecosistema de Studianta.
            </p>
          </div>
        )}

        {/* Contenido del Paso */}
        {currentStep !== 6 && (
          <div 
            className={`flex-1 w-full flex flex-col items-center justify-center transition-all ease-in-out ${
              isTransitioning 
                ? 'opacity-0 translate-y-5' 
                : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {currentStep === 0 && (
              // Pantalla de Inicio
              <div className="w-full text-center space-y-8">
                <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl text-[#4A233E] font-bold">
                  Bienvenida a Studianta.
                </h1>
                <div className="space-y-6 max-w-2xl mx-auto">
                  <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed">
                    Has entrado en un espacio diseñado para tu evolución. Aquí, tu curiosidad se transforma en maestría y tu esfuerzo en esencia.
                  </p>
                  <p className="font-inter text-base md:text-lg text-[#4A233E]/70 leading-relaxed">
                    Antes de forjar tu Átanor, necesitamos conocerte un poquito más.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              // Paso 1: Identidad
              <div className="w-full max-w-2xl mx-auto space-y-8">
                <h1 className="font-cinzel text-3xl md:text-4xl text-[#4A233E] font-bold text-center">
                  Para empezar, ¿cómo te gustaría que te llamemos?
                </h1>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre..."
                    className="w-full bg-transparent text-center text-[#4A233E] font-inter text-xl md:text-2xl border-0 border-b-2 border-[#D4AF37] focus:outline-none focus:border-[#D4AF37] pb-3 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              // Paso 2: Etapa Actual
              <div className="w-full max-w-2xl mx-auto space-y-8">
                <h1 className="font-cinzel text-3xl md:text-4xl text-[#4A233E] font-bold text-center">
                  Dinos en qué etapa de tu crecimiento te encuentras hoy.
                </h1>
                <div className="space-y-3">
                  {academicStages.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setAcademicStage(stage)}
                      className={`w-full py-4 px-6 text-left font-inter text-lg text-[#4A233E] border-0 border-b-2 transition-all duration-300 ${
                        academicStage === stage
                          ? 'border-[#D4AF37] font-bold'
                          : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              // Paso 3: Áreas de Interés
              <div className="w-full max-w-2xl mx-auto space-y-8">
                <h1 className="font-cinzel text-3xl md:text-4xl text-[#4A233E] font-bold text-center">
                  ¿Qué áreas te interesa potenciar con Studianta?
                </h1>
                <p className="font-inter text-sm text-[#4A233E]/60 text-center">
                  Puedes seleccionar varias opciones o ninguna
                </p>
                <div className="space-y-3">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`w-full py-4 px-6 text-left font-inter text-lg text-[#4A233E] border-0 border-b-2 transition-all duration-300 ${
                        interests.includes(interest)
                          ? 'border-[#D4AF37] font-bold'
                          : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              // Paso 4: El Origen
              <div className="w-full max-w-2xl mx-auto space-y-8">
                <h1 className="font-cinzel text-3xl md:text-4xl text-[#4A233E] font-bold text-center">
                  ¿Cómo nos conociste?
                </h1>
                <div className="space-y-3">
                  {referralSources.map((source) => (
                    <button
                      key={source}
                      onClick={() => setReferralSource(source)}
                      className={`w-full py-4 px-6 text-left font-inter text-lg text-[#4A233E] border-0 border-b-2 transition-all duration-300 ${
                        referralSource === source
                          ? 'border-[#D4AF37] font-bold'
                          : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              // Mensaje de Confirmación Acto I
              <div className="w-full text-center space-y-8">
                <h1 className="font-cinzel text-4xl md:text-5xl text-[#4A233E] font-bold">
                  Registro completado.
                </h1>
                <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed max-w-2xl mx-auto">
                  Bienvenida a la comunidad, <span className="font-bold text-[#D4AF37]">{fullName || 'Estudiante'}</span>.
                </p>
              </div>
            )}

            {currentStep === 7 && (
              // Acto II - Hoja 1: El Átanor
              <div className="w-full text-center space-y-8 max-w-2xl mx-auto">
                <h1 className="font-cinzel text-4xl md:text-5xl text-[#4A233E] font-bold">
                  Tu Átanor Personal
                </h1>
                <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed">
                  Es tu escritorio digital. Aquí residen todos tus módulos. Recuerda que puedes mantener presionada cualquier ficha para reorganizar tu espacio según tus prioridades del día.
                </p>
              </div>
            )}

            {currentStep === 8 && (
              // Acto II - Hoja 2: La Esencia
              <div className="w-full text-center space-y-8 max-w-2xl mx-auto">
                <h1 className="font-cinzel text-4xl md:text-5xl text-[#4A233E] font-bold">
                  El Valor de tu Esfuerzo
                </h1>
                <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed">
                  Cada vez que estudies con el temporizador de Enfoque o registres tus pensamientos en la Bitácora, ganarás Esencia. Úsala en el Bazar para desbloquear herramientas avanzadas y potenciar tu crecimiento, haciendo de Studianta una plataforma enteramente personalizable a tus servicios.
                </p>
              </div>
            )}

            {currentStep === 9 && (
              // Acto II - Hoja 3: El Oráculo
              <div className="w-full text-center space-y-8 max-w-2xl mx-auto">
                <h1 className="font-cinzel text-4xl md:text-5xl text-[#4A233E] font-bold">
                  Sabiduría a tu Servicio
                </h1>
                <p className="font-inter text-lg md:text-xl text-[#4A233E]/80 leading-relaxed">
                  El Oráculo es un mentor que conoce tu perfil y tus metas. Consúltalo cuando necesites claridad, organización o una nueva perspectiva sobre lo que estás aprendiendo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones de Navegación */}
        {currentStep !== 5 && currentStep !== 6 && (
          <div 
            className={`mt-12 flex-shrink-0 w-full flex gap-6 transition-all ease-in-out ${
              isTransitioning 
                ? 'opacity-0 translate-y-5' 
                : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {currentStep === 0 ? (
              // Pantalla de inicio: Solo botón "Comenzar"
              <button 
                onClick={handleNext}
                disabled={!canProceed()}
                className="mx-auto px-16 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center disabled:opacity-50 disabled:cursor-not-allowed"
                tabIndex={0}
                aria-label="Comenzar onboarding"
              >
                Comenzar
              </button>
            ) : currentStep === 4 ? (
              // Paso 4: Botón "Anterior" y "FINALIZAR INSCRIPCIÓN"
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
                  onClick={handleFinish}
                  disabled={!canProceed()}
                  className="flex-1 px-8 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  tabIndex={0}
                  aria-label="Finalizar inscripción"
                >
                  Finalizar Inscripción
                </button>
              </div>
            ) : currentStep === 9 ? (
              // Paso 9: Solo botón "ENTRAR AL SANTUARIO"
              <button 
                onClick={handleEnterSanctuary}
                className="mx-auto px-16 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center"
                tabIndex={0}
                aria-label="Entrar al santuario"
              >
                ENTRAR AL SANTUARIO
              </button>
            ) : currentStep >= 7 ? (
              // Acto II (pasos 7-8): Botón "Anterior" y "Continuar"
              <div className="w-full flex gap-6 justify-between max-w-md mx-auto">
                <button 
                  onClick={handleActoIIPrevious}
                  className="flex-1 px-8 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all duration-300 min-h-[56px] touch-manipulation text-center"
                  tabIndex={0}
                  aria-label="Paso anterior"
                >
                  Anterior
                </button>
                <button 
                  onClick={handleActoIINext}
                  className="flex-1 px-8 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center"
                  tabIndex={0}
                  aria-label="Continuar"
                >
                  Continuar
                </button>
              </div>
            ) : (
              // Pasos 1-3: Botón "Anterior" y "Continuar"
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
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 px-8 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  tabIndex={0}
                  aria-label="Continuar"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botón para ir al Acto II (solo en paso 5) */}
        {currentStep === 5 && (
          <div 
            className={`mt-12 transition-all ease-in-out ${
              isTransitioning 
                ? 'opacity-0 translate-y-5' 
                : 'opacity-100 translate-y-0'
            }`}
            style={{ transitionDuration: '600ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <button 
              onClick={handleFinalContinue}
              className="mx-auto px-16 py-4 bg-transparent text-[#4A233E] font-cinzel text-lg tracking-widest uppercase font-bold rounded-none border-0 border-b-2 border-[#D4AF37] hover:border-[#D4AF37]/80 transition-all duration-300 min-h-[56px] touch-manipulation text-center"
              tabIndex={0}
              aria-label="Continuar al Acto II"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
