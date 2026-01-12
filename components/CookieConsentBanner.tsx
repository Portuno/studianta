import React, { useState } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '../hooks/useCookieConsent';

interface CookieConsentBannerProps {
  isNightMode?: boolean;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ isNightMode = false }) => {
  const { showBanner, preferences, acceptAll, acceptNecessary, savePreferences } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);

  // Sincronizar preferencias locales cuando cambian desde el hook
  React.useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  if (!showBanner) return null;

  const handleSavePreferences = () => {
    savePreferences(localPreferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // No se puede desactivar
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-3 md:p-6 transition-all duration-300 ${
      isNightMode 
        ? 'bg-[rgba(48,43,79,0.98)] border-t border-[#A68A56]/40' 
        : 'bg-white/95 backdrop-blur-md border-t border-[#F8C8DC]'
    } shadow-2xl max-h-[85vh] overflow-y-auto`}>
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          // Vista principal del banner
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-cinzel text-base md:text-xl font-bold mb-1.5 md:mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                🍪 Uso de Cookies
              </h3>
              <p className={`font-garamond text-xs md:text-base leading-relaxed transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                <span className="hidden md:inline">
                  Utilizamos cookies para mejorar su experiencia, analizar el uso del sitio y personalizar el contenido. 
                  Al hacer clic en "Aceptar todas", acepta nuestro uso de cookies. Puede gestionar sus preferencias en cualquier momento.
                </span>
                <span className="md:hidden">
                  Utilizamos cookies para mejorar su experiencia. Puede gestionar sus preferencias en cualquier momento.
                </span>
              </p>
              <a
                href="#privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  // Scroll a la sección de privacidad si está en la página
                  const privacySection = document.getElementById('cookie-section');
                  if (privacySection) {
                    privacySection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`font-garamond text-xs md:text-sm underline-offset-2 hover:underline transition-colors mt-1.5 md:mt-2 inline-block ${
                  isNightMode ? 'text-[#A68A56] hover:text-[#D4AF37]' : 'text-[#E35B8F] hover:text-[#4A233E]'
                }`}
              >
                <span className="hidden md:inline">Más información en nuestra Política de Privacidad</span>
                <span className="md:hidden">Política de Privacidad</span>
              </a>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:flex-shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className={`px-4 py-3 md:py-2 rounded-xl border transition-all font-garamond flex items-center justify-center text-sm md:text-base min-h-[44px] md:min-h-0 ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)] text-[#E0E1DD] active:bg-[rgba(48,43,79,0.9)]'
                    : 'bg-white/60 border-[#F8C8DC] hover:bg-[#FFF0F5] text-[#4A233E] active:bg-[#FFE5EC]'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2 flex-shrink-0" />
                <span>Personalizar</span>
              </button>
              <button
                onClick={acceptNecessary}
                className={`px-4 py-3 md:py-2 rounded-xl border transition-all font-garamond text-sm md:text-base min-h-[44px] md:min-h-0 ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)] text-[#E0E1DD] active:bg-[rgba(48,43,79,0.9)]'
                    : 'bg-white/60 border-[#F8C8DC] hover:bg-[#FFF0F5] text-[#4A233E] active:bg-[#FFE5EC]'
                }`}
              >
                Solo Necesarias
              </button>
              <button
                onClick={acceptAll}
                className={`px-6 py-3 md:py-2 rounded-xl font-garamond font-semibold transition-all text-sm md:text-base min-h-[44px] md:min-h-0 ${
                  isNightMode
                    ? 'bg-[#A68A56] hover:bg-[#D4AF37] text-[#1A1A2E] active:bg-[#C9A952]'
                    : 'bg-[#E35B8F] hover:bg-[#C73E6F] text-white active:bg-[#B83A5D]'
                }`}
              >
                Aceptar Todas
              </button>
            </div>
          </div>
        ) : (
          // Vista de configuración detallada
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-cinzel text-lg md:text-xl font-bold transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                Configuración de Cookies
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isNightMode
                    ? 'hover:bg-[rgba(48,43,79,0.8)] text-[#E0E1DD] active:bg-[rgba(48,43,79,0.9)]'
                    : 'hover:bg-[#FFF0F5] text-[#4A233E] active:bg-[#FFE5EC]'
                }`}
                aria-label="Cerrar configuración"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cookie Necesarias */}
            <div className={`p-3 md:p-4 rounded-xl border ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                : 'bg-white/60 border-[#F8C8DC]'
            }`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className={`font-cinzel text-sm md:text-base font-semibold transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  }`}>
                    Cookies Necesarias
                  </h4>
                  <p className={`font-garamond text-xs md:text-sm mt-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Estas cookies son esenciales para el funcionamiento del sitio. No se pueden desactivar.
                  </p>
                </div>
                <div className={`px-2 py-1 md:px-3 rounded-lg flex-shrink-0 ${
                  isNightMode ? 'bg-[#A68A56]/20 text-[#D4AF37]' : 'bg-[#E35B8F]/20 text-[#E35B8F]'
                }`}>
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <ul className={`font-garamond text-xs md:text-sm mt-2 space-y-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                <li>• Cookies de sesión de Supabase (autenticación)</li>
                <li>• Preferencias de usuario (tema, configuración)</li>
              </ul>
            </div>

            {/* Cookie Funcionales */}
            <div className={`p-3 md:p-4 rounded-xl border ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                : 'bg-white/60 border-[#F8C8DC]'
            }`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className={`font-cinzel text-sm md:text-base font-semibold transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  }`}>
                    Cookies Funcionales
                  </h4>
                  <p className={`font-garamond text-xs md:text-sm mt-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Mejoran la funcionalidad y personalización del sitio.
                  </p>
                </div>
                <button
                  onClick={() => togglePreference('functional')}
                  className={`w-12 h-7 md:h-6 rounded-full transition-all relative flex-shrink-0 ${
                    localPreferences.functional
                      ? isNightMode ? 'bg-[#A68A56]' : 'bg-[#E35B8F]'
                      : isNightMode ? 'bg-[rgba(166,138,86,0.3)]' : 'bg-gray-300'
                  }`}
                  aria-label={localPreferences.functional ? 'Desactivar cookies funcionales' : 'Activar cookies funcionales'}
                >
                  <div className={`w-6 h-6 md:w-5 md:h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    localPreferences.functional ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <ul className={`font-garamond text-xs md:text-sm mt-2 space-y-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                <li>• Recordar preferencias de usuario</li>
                <li>• Mejorar la experiencia de navegación</li>
              </ul>
            </div>

            {/* Cookie Analíticas */}
            <div className={`p-3 md:p-4 rounded-xl border ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                : 'bg-white/60 border-[#F8C8DC]'
            }`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className={`font-cinzel text-sm md:text-base font-semibold transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  }`}>
                    Cookies Analíticas
                  </h4>
                  <p className={`font-garamond text-xs md:text-sm mt-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Nos ayudan a entender cómo los visitantes interactúan con el sitio.
                  </p>
                </div>
                <button
                  onClick={() => togglePreference('analytics')}
                  className={`w-12 h-7 md:h-6 rounded-full transition-all relative flex-shrink-0 ${
                    localPreferences.analytics
                      ? isNightMode ? 'bg-[#A68A56]' : 'bg-[#E35B8F]'
                      : isNightMode ? 'bg-[rgba(166,138,86,0.3)]' : 'bg-gray-300'
                  }`}
                  aria-label={localPreferences.analytics ? 'Desactivar cookies analíticas' : 'Activar cookies analíticas'}
                >
                  <div className={`w-6 h-6 md:w-5 md:h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    localPreferences.analytics ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <ul className={`font-garamond text-xs md:text-sm mt-2 space-y-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                <li>• Análisis de uso del sitio (si se implementa)</li>
                <li>• Métricas de rendimiento</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePreferences}
                className={`flex-1 px-6 py-3 md:py-2 rounded-xl font-garamond font-semibold transition-all text-sm md:text-base min-h-[44px] md:min-h-0 ${
                  isNightMode
                    ? 'bg-[#A68A56] hover:bg-[#D4AF37] text-[#1A1A2E] active:bg-[#C9A952]'
                    : 'bg-[#E35B8F] hover:bg-[#C73E6F] text-white active:bg-[#B83A5D]'
                }`}
              >
                Guardar Preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
