import React from 'react';
import { NavView } from '../types';
import { getIcon } from '../constants';
import { UserProfile } from '../services/supabaseService';

interface MobileTopBarProps {
  user?: any;
  userProfile?: UserProfile | null;
  onProfileClick: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ user, userProfile, onProfileClick }) => {
  // Obtener el nivel arcano del perfil o usar el por defecto
  const arcaneLevel = userProfile?.arcane_level || 'Buscadora de Luz';
  const greeting = user ? `Bienvenida, ${arcaneLevel}` : 'Bienvenida, Buscadora de Luz';
  
  // Obtener el avatar o usar el icono por defecto
  const avatarUrl = userProfile?.avatar_url;
  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#FFF9FB] border-b border-[#F8C8DC]/50 shadow-sm z-50 flex items-center justify-between px-4 safe-area-inset-top">
      {/* Saludo personalizado a la izquierda */}
      <div className="flex-1 min-w-0">
        <p className="font-garamond text-sm text-[#4A233E] truncate">
          {greeting}
        </p>
      </div>

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

