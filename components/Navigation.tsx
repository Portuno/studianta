
import React from 'react';
import { NavView, Module } from '../types';
import { getIcon, COLORS } from '../constants';
import { UserProfile } from '../services/supabaseService';

interface NavigationProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  isMobile: boolean;
  modules: Module[];
  user?: any;
  userProfile?: UserProfile | null;
  isNightMode?: boolean;
  toggleTheme?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView, isMobile, modules, user, userProfile, isNightMode = false, toggleTheme }) => {
  const isLocked = (moduleId: string) => {
    if (!moduleId || moduleId === 'atanor') return false;
    const mod = modules.find(m => m.id === moduleId);
    return !mod?.active;
  };

  if (isMobile) {
    return (
      <nav className={`fixed bottom-0 left-0 right-0 h-28 border-t-2 flex items-center justify-between px-3 pb-safe z-[150] rounded-t-[2.5rem] transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[#151525] border-[#A68A56]/40 shadow-[0_-8px_25px_rgba(199,125,255,0.2)]' 
          : 'bg-[#FFF9FB] border-[#F8C8DC] shadow-[0_-8px_25px_rgba(74,35,62,0.15)]'
      } safe-area-inset-bottom`}>
        <div className="flex flex-1 justify-around items-center max-w-full">
          <NavButton 
            id={NavView.SUBJECTS} 
            icon="book" 
            label="Asignaturas" 
            locked={isLocked('subjects')} 
            active={activeView === NavView.SUBJECTS} 
            onClick={() => setActiveView(NavView.SUBJECTS)} 
          />
          <NavButton 
            id={NavView.DIARY} 
            icon="pen" 
            label="Diario" 
            locked={isLocked('diary')} 
            active={activeView === NavView.DIARY} 
            onClick={() => setActiveView(NavView.DIARY)} 
          />
          <NavButton 
            id={NavView.CALENDAR} 
            icon="calendar" 
            label="Calendario" 
            locked={isLocked('calendar')} 
            active={activeView === NavView.CALENDAR} 
            onClick={() => setActiveView(NavView.CALENDAR)} 
          />
        </div>

        <div className="relative -mt-12 mx-2 flex-shrink-0">
          <button 
            onClick={() => setActiveView(NavView.DASHBOARD)}
            className={`min-w-[72px] min-h-[72px] w-18 h-18 rounded-full border-4 border-white shadow-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 ${activeView === NavView.DASHBOARD ? 'bg-[#E35B8F] text-white scale-105' : 'bg-[#2D1A26] text-[#D4AF37]'}`}
            aria-label="Atanor - Dashboard"
          >
            <div className="p-1">
              {getIcon('sparkles', "w-7 h-7")}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 leading-tight">ATANOR</span>
          </button>
        </div>

        <div className="flex flex-1 justify-around items-center max-w-full">
          <NavButton 
            id={NavView.FOCUS} 
            icon="hourglass" 
            label="Enfoque" 
            locked={isLocked('focus')} 
            active={activeView === NavView.FOCUS} 
            onClick={() => setActiveView(NavView.FOCUS)} 
          />
          <NavButton 
            id={NavView.BALANZA} 
            icon="scale" 
            label="Balanza" 
            locked={isLocked('balanza')} 
            active={activeView === NavView.BALANZA} 
            onClick={() => setActiveView(NavView.BALANZA)} 
          />
        </div>
      </nav>
    );
  }

  // Tablet/Desktop Sidebar
  const sidebarItems = [
    { id: NavView.SUBJECTS, icon: 'book', moduleId: 'subjects', label: 'Asignaturas' },
    { id: NavView.CALENDAR, icon: 'calendar', moduleId: 'calendar', label: 'Calendario' },
    { id: NavView.FOCUS, icon: 'hourglass', moduleId: 'focus', label: 'Enfoque' },
    { id: NavView.DIARY, icon: 'pen', moduleId: 'diary', label: 'Diario' },
    { id: NavView.BALANZA, icon: 'scale', moduleId: 'balanza', label: 'Balanza' },
    { id: NavView.DASHBOARD, icon: 'sparkles', moduleId: '', label: 'Atanor' },
  ];

  return (
    <aside className={`w-20 md:w-24 lg:w-64 h-full flex flex-col z-50 shadow-2xl border-r transition-all duration-500 backdrop-blur-[15px] ${
      isNightMode 
        ? 'border-[#A68A56]/40 bg-[rgba(26,26,46,0.95)] shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
        : 'glass-card border-[#F8C8DC]'
    }`}>
      <div className="p-4 lg:p-8 flex-1 flex flex-col items-center lg:items-stretch">
        <div 
          className="flex flex-col items-center cursor-pointer mb-10"
          onClick={() => setActiveView(NavView.DASHBOARD)}
        >
          <h1 className={`font-cinzel text-2xl lg:text-3xl font-black tracking-[0.2em] transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            ST<span className="hidden lg:inline">UDI<span className="text-[#E35B8F]">A</span>NTA</span>
            <span className="lg:hidden text-[#E35B8F]">A</span>
          </h1>
          <div className={`h-0.5 w-8 lg:w-12 mt-1 transition-colors duration-500 ${
            isNightMode ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]'
          }`} />
        </div>

        <nav className="space-y-4 lg:space-y-2">
          {sidebarItems.map((item) => {
            const locked = isLocked(item.moduleId);
            return (
              <button
                key={item.id}
                disabled={locked}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-4 lg:py-3.5 rounded-2xl transition-all duration-300 relative ${
                  activeView === item.id 
                    ? isNightMode
                      ? 'bg-[#C77DFF] text-white shadow-lg shadow-[#C77DFF]/20'
                      : 'bg-[#E35B8F] text-white shadow-lg'
                    : locked 
                      ? 'text-[#7A748E]/30 grayscale cursor-not-allowed'
                      : isNightMode 
                        ? 'text-[#7A748E] hover:bg-[rgba(48,43,79,0.4)]' 
                        : 'text-[#8B5E75] hover:bg-[#FFD1DC]/40'
                }`}
                title={item.label}
              >
                {getIcon(item.icon, "w-6 h-6 lg:w-5 lg:h-5")}
                <span className="hidden lg:inline font-inter font-bold text-sm tracking-widest uppercase">{item.label}</span>
                {locked && !isMobile && <div className="absolute top-1 right-1 lg:static lg:ml-auto text-[#D4AF37]">{getIcon('lock', 'w-2.5 h-2.5 lg:w-3 lg:h-3')}</div>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className={`p-4 lg:p-6 border-t space-y-4 lg:space-y-4 transition-colors duration-500 ${
        isNightMode ? 'bg-[#151525] border-[#A68A56]/30' : 'bg-[#FFF9FA]/50 border-[#F8C8DC]/30'
      }`}>
        {/* Toggle Diario/Nocturno */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-2 lg:px-3 rounded-xl transition-all duration-300 hover:scale-[1.05] ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#A68A56] border border-[#A68A56]/40'
                : 'bg-white/80 text-[#4A233E] border border-[#F8C8DC]'
            }`}
            aria-label={isNightMode ? 'Cambiar a modo diario' : 'Cambiar a modo nocturno'}
          >
            {isNightMode ? (
              <>
                {getIcon('moon', 'w-5 h-5 lg:w-4 lg:h-4')}
                <span className="hidden lg:inline font-cinzel text-[9px] font-bold uppercase tracking-wider">Nocturno</span>
              </>
            ) : (
              <>
                {getIcon('sun', 'w-5 h-5 lg:w-4 lg:h-4')}
                <span className="hidden lg:inline font-cinzel text-[9px] font-bold uppercase tracking-wider">Diario</span>
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={() => setActiveView(NavView.ORACLE)}
          className={`w-full flex items-center justify-center gap-3 py-3.5 px-2 lg:px-4 rounded-2xl shadow-lg hover:scale-[1.05] transition-all group ${
            activeView === NavView.ORACLE
              ? isNightMode
                ? 'bg-[#C77DFF] text-white shadow-[0_0_20px_rgba(199,125,255,0.3)]'
                : 'bg-[#E35B8F] text-white'
              : isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#A68A56] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]'
                : 'bg-[#2D1A26] text-[#D4AF37]'
          }`}
        >
          {getIcon('brain', 'w-6 h-6 lg:w-5 lg:h-5 transition-transform')}
          <span className="hidden lg:inline font-cinzel text-[10px] font-black uppercase tracking-[0.2em]">Oráculo</span>
        </button>

        <button 
          onClick={() => setActiveView(NavView.PROFILE)}
          className={`w-full flex items-center justify-center lg:justify-start gap-3 p-2 lg:p-3 rounded-2xl transition-all group mb-2 ${
            activeView === NavView.PROFILE
              ? isNightMode
                ? 'bg-[#C77DFF] text-white shadow-lg shadow-[#C77DFF]/20'
                : 'bg-[#E35B8F] text-white shadow-lg'
              : isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 hover:border-[#C77DFF]/50 hover:bg-[rgba(48,43,79,0.8)]'
                : 'bg-white/60 border border-[#F8C8DC] hover:border-[#E35B8F]/30'
          }`}
        >
          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 shadow-md flex-shrink-0 overflow-hidden transition-colors duration-500 ${
            user && userProfile?.avatar_url 
              ? isNightMode ? 'border-[#A68A56]/40' : 'border-white'
              : user 
                ? isNightMode 
                  ? 'bg-gradient-to-br from-[#C77DFF] to-[#A68A56] border-[#A68A56]/40' 
                  : 'bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-white'
                : isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                  : 'bg-white/60 border-[#F8C8DC]'
          }`}>
            {user && userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : user ? (
              <div className="w-full h-full flex items-center justify-center">
                {getIcon('profile', 'w-5 h-5 text-white')}
              </div>
            ) : null}
          </div>
          <div className="hidden lg:block text-left overflow-hidden">
             <p className={`text-[10px] font-bold truncate transition-colors duration-500 ${
               activeView === NavView.PROFILE 
                 ? 'text-white' 
                 : isNightMode 
                   ? 'text-[#E0E1DD]' 
                   : 'text-[#2D1A26]'
             }`}>
               {user && userProfile?.full_name 
                 ? userProfile.full_name 
                 : user 
                   ? user.email?.split('@')[0] || 'Usuario'
                   : 'Iniciar Sesión'}
             </p>
             <p className={`text-[8px] uppercase font-black tracking-widest transition-colors duration-500 ${
               activeView === NavView.PROFILE 
                 ? 'text-white/80' 
                 : isNightMode 
                   ? 'text-[#7A748E]' 
                   : 'text-[#8B5E75] opacity-60'
             }`}>
               {user ? 'Perfil' : 'Iniciar Sesión'}
             </p>
          </div>
        </button>
      </div>
    </aside>
  );
};

interface NavButtonProps {
  id: NavView;
  icon: string;
  label: string;
  locked: boolean;
  active: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ id, icon, label, locked, active, onClick }) => (
  <button
    disabled={locked}
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative min-w-[56px] min-h-[56px] touch-manipulation ${
      active ? 'text-[#E35B8F] scale-105' : locked ? 'text-[#8B5E75]/30 grayscale' : 'text-[#8B5E75] active:scale-95'
    }`}
    aria-label={label}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#E35B8F]/15' : ''}`}>
      {getIcon(icon, "w-7 h-7")}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap font-inter leading-tight ${active ? 'opacity-100 font-bold' : 'opacity-75'}`}>
      {label}
    </span>
    {locked && <div className="absolute -top-1 -right-1 text-[#D4AF37] bg-white rounded-full p-0.5">{getIcon('lock', 'w-3 h-3')}</div>}
  </button>
);

export default Navigation;
