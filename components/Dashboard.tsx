
import React, { useState } from 'react';
import { Module, NavView } from '../types';
import { getIcon, COLORS } from '../constants';

interface DashboardProps {
  modules: Module[];
  onActivate: (id: string) => void;
  isMobile: boolean;
  setActiveView: (view: NavView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ modules, onActivate, isMobile, setActiveView }) => {
  const [hoveredCell, setHoveredCell] = useState<NavView | null>(null);

  const MODULE_TO_VIEW: Record<string, NavView> = {
    'subjects': NavView.SUBJECTS,
    'calendar': NavView.CALENDAR,
    'focus': NavView.FOCUS,
    'diary': NavView.DIARY,
    'finance': NavView.FINANCE,
    'ai': NavView.AI,
    'profile': NavView.PROFILE,
    'security': NavView.SECURITY,
    'social': NavView.SOCIAL
  };

  const GRID_MAPPING: Record<number, { view: NavView; label: string; moduleId?: string }> = {
    40: { view: NavView.PROFILE, label: 'P', moduleId: 'profile' },
    10: { view: NavView.SUBJECTS, label: 'A', moduleId: 'subjects' },
    16: { view: NavView.CALENDAR, label: 'C', moduleId: 'calendar' },
    37: { view: NavView.FOCUS, label: 'E', moduleId: 'focus' },
    43: { view: NavView.DIARY, label: 'D', moduleId: 'diary' },
    64: { view: NavView.FINANCE, label: 'F', moduleId: 'finance' },
    70: { view: NavView.SOCIAL, label: 'S', moduleId: 'social' },
    28: { view: NavView.SECURITY, label: 'X', moduleId: 'security' },
    52: { view: NavView.AI, label: 'O', moduleId: 'ai' },
  };

  const isModuleActive = (moduleId?: string) => {
    if (!moduleId) return true;
    return modules.find(m => m.id === moduleId)?.active || false;
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col gap-6 pb-20 animate-fade-in px-2 overflow-y-auto no-scrollbar">
        <section className="text-center pt-8 mb-4">
          <h1 className="font-cinzel text-4xl font-black text-[#4A233E] tracking-[0.25em] uppercase">El Atanor</h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto mt-2 opacity-50 rounded-full" />
        </section>

        <section className="flex-1">
          <h3 className="text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3 mb-6 px-2">Módulos</h3>
          <div className="grid grid-cols-2 gap-4 pb-12">
            {modules.map(mod => {
              const isActive = mod.active;
              return (
                <div 
                  key={mod.id} 
                  onClick={() => {
                    if (isActive) setActiveView(MODULE_TO_VIEW[mod.id] || NavView.DASHBOARD);
                    else onActivate(mod.id);
                  }}
                  className={`glass-card aspect-square rounded-[2rem] flex flex-col items-center justify-center p-4 transition-all duration-300 active:scale-95 relative border-2 ${isActive ? 'border-[#D4AF37]/30 shadow-md' : 'border-transparent opacity-60 grayscale-[0.4]'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isActive ? 'bg-[#E35B8F]/10 text-[#E35B8F]' : 'bg-white/40 text-[#8B5E75]'}`}>
                    {getIcon(mod.icon, "w-6 h-6")}
                  </div>
                  <h4 className="font-cinzel text-[10px] font-black text-[#4A233E] text-center uppercase tracking-widest px-1 leading-tight">
                    {mod.name}
                  </h4>
                  {!isActive && (
                    <div className="mt-2 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-[8px] font-black flex items-center gap-1 shadow-sm">
                      {mod.cost} {getIcon('sparkles', 'w-2 h-2')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 lg:gap-12 pb-10 max-w-7xl mx-auto overflow-hidden">
      {/* Visual Section: Atanor Grid - Visible on Tablets too */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative bg-white/20 rounded-[3rem] lg:rounded-[4rem] overflow-hidden border border-[#F8C8DC]/30 min-h-[400px] md:min-h-0">
        <div className="absolute top-12 lg:top-16 z-10 text-center">
          <h2 className="font-cinzel text-3xl lg:text-4xl text-[#4A233E] font-black tracking-[0.4em] uppercase">ATANOR</h2>
          <div className="h-1 w-10 lg:w-12 bg-[#D4AF37] mx-auto mt-2 rounded-full" />
        </div>
        
        {/* Iso Grid with responsive scaling */}
        <div className="iso-grid-container scale-[2.5] sm:scale-[3.2] md:scale-[3] lg:scale-[4.2]">
          <div className="iso-grid">
            {Array.from({ length: 81 }).map((_, i) => {
              const mapping = GRID_MAPPING[i];
              const isActive = mapping ? isModuleActive(mapping.moduleId) : false;
              return (
                <div 
                  key={i} 
                  className={`iso-cell flex items-center justify-center relative cursor-default transition-all duration-500 ${isActive ? 'active cursor-pointer' : mapping ? 'opacity-30' : ''}`}
                  onMouseEnter={() => mapping && setHoveredCell(mapping.view)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => isActive && mapping && setActiveView(mapping.view)}
                >
                  {mapping && (
                    <span className={`font-cinzel text-[5px] select-none transform -rotate-45 ${isActive ? 'text-white' : 'text-[#4A233E]'}`}>
                      {mapping.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {hoveredCell && (
          <div className="absolute bottom-12 lg:bottom-16 px-6 lg:px-8 py-2 lg:py-3 glass-card rounded-full border-[#D4AF37] animate-fade-in shadow-xl">
             <p className="font-cinzel text-sm lg:text-lg font-black text-[#4A233E] tracking-[0.3em] uppercase">{hoveredCell}</p>
          </div>
        )}
      </div>

      {/* Modules List Desktop/Tablet */}
      <div className="flex-1 flex flex-col pt-4 lg:pt-8 overflow-hidden">
        <div className="overflow-y-auto pr-2 space-y-8 lg:space-y-10 no-scrollbar">
          <section>
            <h3 className="text-[10px] lg:text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b-2 border-[#F8C8DC] pb-4 mb-6">Investigaciones</h3>
            <div className="grid gap-4 lg:gap-6">
              {modules.filter(m => !m.active).map(mod => (
                <div key={mod.id} className="glass-card p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] flex flex-col sm:flex-row items-center justify-between group hover:shadow-2xl transition-all duration-500 border-[#F8C8DC]/50 gap-4">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-[1.5rem] lg:rounded-[2rem] bg-white border border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] group-hover:scale-105 transition-transform">
                      {getIcon(mod.icon, "w-8 h-8 lg:w-10 lg:h-10")}
                    </div>
                    <div>
                      <h4 className="font-cinzel text-xl lg:text-2xl text-[#4A233E] font-black">{mod.name.toUpperCase()}</h4>
                      <p className="hidden sm:block text-sm lg:text-base text-[#8B5E75] font-garamond italic mt-1 max-w-sm">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-4">
                    <div className="flex items-center gap-2 text-[#D4AF37] font-cinzel font-black text-xl lg:text-2xl">
                      <span>{mod.cost}</span>
                      {getIcon('sparkles', "w-5 h-5 lg:w-6 lg:h-6")}
                    </div>
                    <button 
                      onClick={() => onActivate(mod.id)}
                      className="btn-primary px-6 lg:px-10 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-cinzel text-[10px] font-black uppercase tracking-widest shadow-xl"
                    >
                      Transmutar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
