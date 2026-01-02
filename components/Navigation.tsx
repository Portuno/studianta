
import React from 'react';
import { NavView, Module } from '../types';
import { getIcon, COLORS } from '../constants';

interface NavigationProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  essence: number;
  isMobile: boolean;
  modules: Module[];
}

const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView, essence, isMobile, modules }) => {
  const isLocked = (moduleId: string) => {
    if (!moduleId || moduleId === 'atanor') return false;
    const mod = modules.find(m => m.id === moduleId);
    return !mod?.active;
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-24 glass-card border-t border-[#F8C8DC] flex items-center justify-between px-2 pb-8 z-[150] rounded-t-[2.5rem] shadow-[0_-8px_25px_rgba(74,35,62,0.1)]">
        {/* Lado Izquierdo: Asignaturas y Calendario */}
        <div className="flex flex-1 justify-around">
          <NavButton 
            id={NavView.SUBJECTS} 
            icon="book" 
            label="Asignaturas" 
            locked={isLocked('subjects')} 
            active={activeView === NavView.SUBJECTS} 
            onClick={() => setActiveView(NavView.SUBJECTS)} 
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

        {/* Centro: ATANOR (Dashboard) */}
        <div className="relative -mt-10 px-2">
          <button 
            onClick={() => setActiveView(NavView.DASHBOARD)}
            className={`w-16 h-16 rounded-full border-4 border-white shadow-xl flex flex-col items-center justify-center transition-all duration-500 ${activeView === NavView.DASHBOARD ? 'bg-[#E35B8F] text-white scale-110' : 'bg-[#4A233E] text-[#D4AF37]'}`}
          >
            <div className="p-0">
              {getIcon('sparkles', "w-6 h-6")}
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-0.5">ATANOR</span>
          </button>
        </div>

        {/* Lado Derecho: Enfoque y Balanza */}
        <div className="flex flex-1 justify-around">
          <NavButton 
            id={NavView.FOCUS} 
            icon="hourglass" 
            label="Enfoque" 
            locked={isLocked('focus')} 
            active={activeView === NavView.FOCUS} 
            onClick={() => setActiveView(NavView.FOCUS)} 
          />
          <NavButton 
            id={NavView.FINANCE} 
            icon="scale" 
            label="Balanza" 
            locked={isLocked('finance')} 
            active={activeView === NavView.FINANCE} 
            onClick={() => setActiveView(NavView.FINANCE)} 
          />
        </div>
      </nav>
    );
  }

  // Desktop Sidebar
  const sidebarItems = [
    { id: NavView.SUBJECTS, icon: 'book', moduleId: 'subjects', label: 'Asignaturas' },
    { id: NavView.CALENDAR, icon: 'calendar', moduleId: 'calendar', label: 'Calendario' },
    { id: NavView.FOCUS, icon: 'hourglass', moduleId: 'focus', label: 'Enfoque' },
    { id: NavView.DIARY, icon: 'pen', moduleId: 'diary', label: 'Diario' },
    { id: NavView.FINANCE, icon: 'scale', moduleId: 'finance', label: 'Balanza' },
    { id: NavView.DASHBOARD, icon: 'sparkles', moduleId: '', label: 'Atanor' },
  ];

  return (
    <aside className="w-64 h-full glass-card flex flex-col z-50 shadow-2xl border-r border-[#F8C8DC]">
      <div className="p-8 flex-1 flex flex-col">
        <div 
          className="flex flex-col items-center cursor-pointer mb-10"
          onClick={() => setActiveView(NavView.DASHBOARD)}
        >
          <h1 className="font-cinzel text-2xl font-black tracking-[0.2em] text-[#4A233E]">
            STUDI<span className="text-[#E35B8F]">A</span>NTA
          </h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] mt-1" />
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const locked = isLocked(item.moduleId);
            return (
              <button
                key={item.id}
                disabled={locked}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${
                  activeView === item.id 
                    ? 'bg-[#E35B8F] text-white shadow-lg' 
                    : locked ? 'text-[#8B5E75]/30 grayscale cursor-not-allowed' : 'text-[#8B5E75] hover:bg-[#FFD1DC]/40'
                }`}
              >
                {getIcon(item.icon, "w-5 h-5")}
                <span className="font-inter font-bold text-xs tracking-widest uppercase">{item.label}</span>
                {locked && <div className="ml-auto text-[#D4AF37]">{getIcon('lock', 'w-3 h-3')}</div>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 bg-[#FFF9FA]/50 border-t border-[#F8C8DC]/30 space-y-4">
        {/* Botón de Oráculo Especial */}
        <button 
          onClick={() => alert("El Oráculo General está meditando en este momento. Estará disponible en futuras actualizaciones de la Logia.")}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-[#4A233E] text-[#D4AF37] shadow-lg hover:scale-[1.02] transition-all group"
        >
          {getIcon('brain', 'w-5 h-5 group-hover:rotate-12 transition-transform')}
          <span className="font-cinzel text-[10px] font-black uppercase tracking-[0.2em]">Consultar Oráculo</span>
        </button>

        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
             <p className="text-[9px] font-cinzel font-bold text-[#4A233E] uppercase tracking-widest opacity-60">Esencia Real</p>
             <p className="font-inter text-2xl font-black text-[#D4AF37] leading-none drop-shadow-sm">{essence}</p>
          </div>
          <div className="text-[#D4AF37] animate-pulse">
            {getIcon('sparkles', 'w-5 h-5')}
          </div>
        </div>

        {/* Referencia al Perfil (Auth Readiness) */}
        <button 
          onClick={() => setActiveView(NavView.PROFILE)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-[#F8C8DC] hover:border-[#E35B8F]/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-2 border-white shadow-md flex-shrink-0" />
          <div className="text-left overflow-hidden">
             <p className="text-[10px] font-bold text-[#4A233E] truncate">Académico Real</p>
             <p className="text-[8px] text-[#8B5E75] uppercase font-black tracking-widest opacity-60">Gestionar Gnosis</p>
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
    className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${
      active ? 'text-[#E35B8F] scale-105' : locked ? 'text-[#8B5E75]/30 grayscale' : 'text-[#8B5E75]'
    }`}
  >
    <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-[#E35B8F]/10' : ''}`}>
      {getIcon(icon, "w-6 h-6")}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-wider whitespace-nowrap font-inter ${active ? 'opacity-100' : 'opacity-70'}`}>
      {label}
    </span>
    {locked && <div className="absolute top-0 right-0 text-[#D4AF37]">{getIcon('lock', 'w-2.5 h-2.5')}</div>}
  </button>
);

export default Navigation;
