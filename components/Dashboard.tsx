
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

  // Mapeo de IDs de módulos a NavViews para navegación
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

  // Solo para PC
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

  if (isMobile) {
    return (
      <div className="h-full flex flex-col gap-6 pb-20 animate-fade-in px-2">
        {/* Atanor Header Mobile - Simplified */}
        <section className="text-center pt-8 mb-4">
          <h1 className="font-cinzel text-4xl font-black text-[#4A233E] tracking-[0.25em] uppercase">El Atanor</h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto mt-2 opacity-50 rounded-full" />
        </section>

        {/* Unified Modules Section */}
        <section className="flex-1">
          <h3 className="text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3 mb-6 px-2">Módulos</h3>
          
          <div className="grid grid-cols-2 gap-4 pb-12">
            {modules.map(mod => {
              const isActive = mod.active;
              return (
                <div 
                  key={mod.id} 
                  onClick={() => {
                    if (isActive) {
                      const targetView = MODULE_TO_VIEW[mod.id] || NavView.DASHBOARD;
                      setActiveView(targetView);
                    } else {
                      onActivate(mod.id);
                    }
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
                  {!isActive && (
                    <div className="absolute top-3 right-3 text-[#D4AF37]/40">
                      {getIcon('lock', 'w-3 h-3')}
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

  // Desktop View with Grid
  const isModuleActive = (moduleId?: string) => {
    if (!moduleId) return true;
    return modules.find(m => m.id === moduleId)?.active || false;
  };

  return (
    <div className="h-full flex gap-12 pb-10 max-w-7xl mx-auto">
      {/* Visual Section: Atanor Grid */}
      <div className="w-1/2 flex flex-col items-center justify-center relative bg-white/20 rounded-[4rem] overflow-hidden border border-[#F8C8DC]/30">
        <div className="absolute top-16 z-10 text-center">
          <h2 className="font-cinzel text-4xl text-[#4A233E] font-black tracking-[0.4em] uppercase">ATANOR</h2>
          <div className="h-1 w-12 bg-[#D4AF37] mx-auto mt-2 rounded-full" />
        </div>
        
        <div className="iso-grid-container scale-[4.2]">
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
          <div className="absolute bottom-16 px-8 py-3 glass-card rounded-full border-[#D4AF37] animate-fade-in shadow-xl">
             <p className="font-cinzel text-lg font-black text-[#4A233E] tracking-[0.3em] uppercase">{hoveredCell}</p>
          </div>
        )}
      </div>

      {/* Modules List Desktop */}
      <div className="flex-1 flex flex-col pt-8 overflow-hidden">
        <div className="overflow-y-auto pr-2 space-y-10 no-scrollbar">
          <section>
            <h3 className="text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b-2 border-[#F8C8DC] pb-4 mb-6">Investigaciones Disponibles</h3>
            <div className="grid gap-6">
              {modules.filter(m => !m.active).map(mod => (
                <div key={mod.id} className="glass-card p-8 rounded-[3rem] flex items-center justify-between group hover:shadow-2xl transition-all duration-500 border-[#F8C8DC]/50">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-white border border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] group-hover:scale-110 transition-transform shadow-inner">
                      {getIcon(mod.icon, "w-10 h-10")}
                    </div>
                    <div>
                      <h4 className="font-cinzel text-2xl text-[#4A233E] font-black">{mod.name.toUpperCase()}</h4>
                      <p className="text-base text-[#8B5E75] font-garamond italic mt-1 max-w-sm">{mod.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[#D4AF37] font-cinzel font-black text-2xl mb-4">
                      <span>{mod.cost}</span>
                      {getIcon('sparkles', "w-6 h-6")}
                    </div>
                    <button 
                      onClick={() => onActivate(mod.id)}
                      className="btn-primary px-10 py-4 rounded-2xl font-cinzel text-xs font-black uppercase tracking-widest shadow-xl"
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
