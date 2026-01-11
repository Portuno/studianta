import React from 'react';
import { NavView } from '../types';

interface FooterProps {
  setActiveView?: (view: NavView) => void;
  isMobile?: boolean;
}

const Footer: React.FC<FooterProps> = ({ setActiveView, isMobile = false }) => {
  const handlePrivacyClick = () => {
    if (setActiveView) {
      setActiveView(NavView.PRIVACY_POLICY);
    } else {
      window.location.href = '/privacidad';
    }
  };

  const handleTermsClick = () => {
    if (setActiveView) {
      setActiveView(NavView.TERMS_OF_SERVICE);
    } else {
      window.location.href = '/terminosycondiciones';
    }
  };

  const handleDocsClick = () => {
    if (setActiveView) {
      setActiveView(NavView.DOCS);
    } else {
      window.location.href = '/docs';
    }
  };

  return (
    <footer className="glass-card border-t border-[#F8C8DC] py-4 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-4`}>
          {/* Links legales */}
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <a
              href="/privacidad"
              onClick={(e) => {
                e.preventDefault();
                handlePrivacyClick();
              }}
              className="font-garamond text-base text-[#8B5E75] hover:text-[#2D1A26] transition-colors underline-offset-2 hover:underline"
            >
              Política de Privacidad
            </a>
            <span className="text-[#F8C8DC]">•</span>
            <a
              href="/terminosycondiciones"
              onClick={(e) => {
                e.preventDefault();
                handleTermsClick();
              }}
              className="font-garamond text-base text-[#8B5E75] hover:text-[#2D1A26] transition-colors underline-offset-2 hover:underline"
            >
              Términos y Condiciones
            </a>
            <span className="text-[#F8C8DC]">•</span>
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                handleDocsClick();
              }}
              className="font-garamond text-base text-[#8B5E75] hover:text-[#2D1A26] transition-colors underline-offset-2 hover:underline"
            >
              Documentación
            </a>
          </div>

          {/* Créditos */}
          <div className="text-center md:text-right">
            <p className="font-garamond text-base text-[#8B5E75]">
              Studianta es una creación de{' '}
              <a
                href="https://www.versaproducciones.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2D1A26] hover:text-[#E35B8F] font-semibold underline-offset-2 hover:underline transition-colors"
              >
                Versa Producciones
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

