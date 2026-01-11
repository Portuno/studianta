import React from 'react';
import { NavView } from '../types';
import { getIcon } from '../constants';
import { UserProfile } from '../services/supabaseService';

interface MobileTopBarProps {
  user?: any;
  userProfile?: UserProfile | null;
  onProfileClick: () => void;
  isNightMode?: boolean;
  toggleTheme?: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ user, userProfile, onProfileClick, isNightMode = false, toggleTheme }) => {
  // Obtener el avatar o usar el icono por defecto
  const avatarUrl = userProfile?.avatar_url;
  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 border-b shadow-sm z-50 flex items-center justify-between px-4 safe-area-inset-top transition-colors duration-500 ${
      isNightMode 
        ? 'bg-[#151525] border-[#A68A56]/40' 
        : 'bg-[#FFF9FB] border-[#F8C8DC]/50'
    }`}>
      {/* Toggle Diario/Nocturno a la izquierda */}
      {toggleTheme && (
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-300 active:scale-95 touch-manipulation ${
            isNightMode
              ? 'bg-[rgba(48,43,79,0.6)] text-[#A68A56] border border-[#A68A56]/40'
              : 'bg-white/80 text-[#2D1A26] border border-[#F8C8DC]'
          }`}
          aria-label={isNightMode ? 'Cambiar a modo diario' : 'Cambiar a modo nocturno'}
        >
          {isNightMode ? (
            getIcon('moon', 'w-5 h-5')
          ) : (
            getIcon('sun', 'w-5 h-5')
          )}
        </button>
      )}

      {/* Icono del sello de lacre (perfil) a la derecha */}
      <button
        onClick={onProfileClick}
        className="flex-shrink-0 ml-4 p-1.5 rounded-full transition-all active:scale-95 touch-manipulation"
        aria-label="Abrir perfil"
      >
        <div className={`w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0 overflow-hidden ${
          user && avatarUrl ? '' : user ? 'bg-gradient-to-br from-[#E35B8F] to-[#D4AF37]' : 'bg-white/60 border-[#F8C8DC]'
        }`}>
          {user && avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-full h-full object-cover"
            />
          ) : user ? (
            <div className="w-full h-full flex items-center justify-center">
              {getIcon('profile', 'w-5 h-5 text-white')}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getIcon('profile', 'w-5 h-5 text-[#8B5E75]')}
            </div>
          )}
        </div>
      </button>
    </header>
  );
};

export default MobileTopBar;


