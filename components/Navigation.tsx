
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
  const menuItems = [
    { id: NavView.SUBJECTS, icon: 'book', moduleId: 'subjects', label: 'Asignaturas' },
    { id: NavView.CALENDAR, icon: 'calendar', moduleId: 'calendar', label: 'Calendario' },
    { id: NavView.FOCUS, icon: 'hourglass', moduleId: 'focus', label: 'Enfoque' },
    { id: NavView.DIARY, icon: 'pen', moduleId: 'diary', label: 'Diario' },
    { id: NavView.FINANCE, icon: 'scale', moduleId: 'finance', label: 'Finanzas' },
    { id: NavView.SOCIAL, icon: 'social', moduleId: 'social', label: 'Logia' },
    { id: NavView.AI, icon: 'brain', moduleId: 'ai', label: 'Oráculo' },
    { id: NavView.DASHBOARD, icon: 'sparkles', moduleId: '', label: 'Atanor' },
  ];

  const isLocked = (moduleId: string) => {
    if (!moduleId) return false;
    const mod = modules.find(m => m.id === moduleId);
    return !mod?.active;
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-card border-t border-[#F8C8DC] flex items-center justify-around px-2 z-[100] rounded-t-3xl shadow-[0_-10px_30px_rgba(227,91,143,0.1)] overflow-x-auto">
        {menuItems.map((item) => {
          const locked = isLocked(item.moduleId);
          return (
            <button
              key={item.id}
              disabled={locked}
              onClick={() => !locked && setActiveView(item.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] gap-1 transition-all duration-300 relative ${
                activeView === item.id ? 'text-[#E35B8F] scale-110' : locked ? 'text-[#8B5E75]/30 grayscale' : 'text-[#8B5E75]'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${activeView === item.id ? 'bg-[#E35B8F]/10' : ''}`}>
                {getIcon(item.icon, "w-5 h-5")}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-tighter whitespace-nowrap">
                {item.label}
              </span>
              {locked && <div className="absolute top-0 right-2 text-[#D4AF37]">{getIcon('lock', 'w-2 h-2')}</div>}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="w-64 h-full glass-card flex flex-col z-50">
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <div 
          className="flex flex-col items-center cursor-pointer mb-8"
          onClick={() => setActiveView(NavView.DASHBOARD)}
        >
          <h1 className="font-cinzel text-xl font-bold tracking-[0.2em] text-[#4A233E]">
            STUDI<span className="text-[#E35B8F]">A</span>NTA
          </h1>
          <div className="h-0.5 w-8 bg-[#D4AF37] mt-1 opacity-50" />
        </div>

        <nav className="space-y-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const locked = isLocked(item.moduleId);
            return (
              <button
                key={item.id}
                disabled={locked}
                onClick={() => !locked && setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  activeView === item.id 
                    ? 'bg-[#E35B8F] text-white shadow-md shadow-pink-200' 
                    : locked ? 'text-[#8B5E75]/30 grayscale cursor-not-allowed opacity-60' : 'text-[#8B5E75] hover:bg-[#FFD1DC]/40'
                }`}
              >
                <span className={activeView === item.id ? 'text-white' : locked ? 'text-[#8B5E75]/20' : 'text-[#E35B8F] group-hover:scale-110 transition-transform'}>
                  {getIcon(item.icon, "w-4 h-4")}
                </span>
                <span className="font-inter font-bold text-[10px] tracking-widest uppercase">{item.label}</span>
                {locked && <div className="ml-auto text-[#D4AF37]">{getIcon('lock', 'w-3 h-3')}</div>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 space-y-4 bg-white/20 border-t border-[#F8C8DC]/30">
        <div className="bg-white/50 border border-[#D4AF37]/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-[#8B5E75] font-inter font-bold">Esencia Real</span>
            <span className="font-cinzel text-base font-bold text-[#D4AF37] tracking-tighter">{essence}</span>
          </div>
          <div className="text-[#D4AF37]">
            {getIcon('sparkles', "w-5 h-5 animate-pulse")}
          </div>
        </div>

        <button 
          className={`w-full glass-card p-3 rounded-2xl flex items-center gap-3 border-[#F8C8DC] hover:bg-[#FFD1DC]/40 transition-all group ${activeView === NavView.PROFILE ? 'border-[#E35B8F] bg-[#FFD1DC]/40' : ''}`}
          onClick={() => setActiveView(NavView.PROFILE)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform" />
          <div className="overflow-hidden text-left">
            <p className="text-[9px] font-cinzel font-bold tracking-widest text-[#4A233E] uppercase group-hover:text-[#E35B8F] transition-colors">Perfil</p>
            <p className="text-[7px] font-inter font-bold text-[#8B5E75] uppercase opacity-50">Sello de Lacre</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Navigation;
