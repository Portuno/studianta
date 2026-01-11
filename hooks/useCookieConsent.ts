import { useState, useEffect } from 'react';

export type CookiePreferences = {
  necessary: boolean; // Siempre true, no se puede desactivar
  analytics: boolean;
  functional: boolean;
};

const COOKIE_CONSENT_KEY = 'studianta_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'studianta_cookie_preferences';

export const useCookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Verificar si ya hay consentimiento guardado
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!consent) {
      setShowBanner(true);
    } else if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
    };
    saveConsent(onlyNecessary);
  };

  const savePreferences = (newPreferences: CookiePreferences) => {
    saveConsent(newPreferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    
    // Aquí puedes inicializar servicios de analytics si están habilitados
    if (prefs.analytics) {
      // Inicializar Google Analytics u otros servicios en el futuro
      // Por ahora no hay servicios de analytics implementados
    }
  };

  const revokeConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setShowBanner(true);
    setPreferences({
      necessary: true,
      analytics: false,
      functional: false,
    });
  };

  return {
    showBanner,
    preferences,
    acceptAll,
    acceptNecessary,
    savePreferences,
    revokeConsent,
  };
};
