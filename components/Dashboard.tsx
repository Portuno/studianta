
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

  // Mapping of 9x9 indices to specific modules/views
  const GRID_MAPPING: Record<number, { view: NavView; label: string; moduleId?: string }> = {
    40: { view: NavView.PROFILE, label: 'P', moduleId: 'profile' }, // Center
    10: { view: NavView.SUBJECTS, label: 'A', moduleId: 'subjects' }, // Top Left
    16: { view: NavView.CALENDAR, label: 'C', moduleId: 'calendar' }, // Top Right
    37: { view: NavView.FOCUS, label: 'E', moduleId: 'focus' }, // Mid Left
    43: { view: NavView.DIARY, label: 'D', moduleId: 'diary' }, // Mid Right
    64: { view: NavView.FINANCE, label: 'F', moduleId: 'finance' }, // Bottom Left
    70: { view: NavView.SOCIAL, label: 'S', moduleId: 'social' }, // Bottom Right
    28: { view: NavView.SECURITY, label: 'X', moduleId: 'security' }, // Side
    52: { view: NavView.AI, label: 'O', moduleId: 'ai' }, // Side
  };

  const isModuleActive = (moduleId?: string) => {
    if (!moduleId) return true;
    return modules.find(m => m.id === moduleId)?.active || false;
  };

  return (
    <div className={`h-full flex ${isMobile ? 'flex-col' : 'flex-row'} gap-8 pb-10`}>
      {/* Visual Section: Atanor */}
      <div className={`${isMobile ? 'h-[500px] mb-6' : 'w-1/2'} flex flex-col items-center justify-center relative bg-gradient-to-b from-transparent to-[#FDEEF4]/30 rounded-[3rem] overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{ backgroundImage: `radial-gradient(${COLORS.gold} 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />
        </div>
        
        <div className="absolute top-12 md:top-16 z-10 text-center">
          <h2 className="font-cinzel text-2xl md:text-4xl text-[#4A233E] font-bold tracking-[0.3em] uppercase drop-shadow-sm">
            Atanor
          </h2>
          <div className="h-0.5 w-16 bg-[#D4AF37] mx-auto mt-3 opacity-60 rounded-full" />
        </div>
        
        <div className={`iso-grid-container transition-transform duration-1000 ${isMobile ? 'scale-[1.8]' : 'scale-[4.2]'}`}>
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
                    <span className={`font-cinzel text-[5px] select-none transform -rotate-45 ${isActive ? 'text-white opacity-90' : 'text-[#4A233E] opacity-50'}`}>
                      {mapping.label}
                    </span>
                  )}
                  {mapping && hoveredCell === mapping.view && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#4A233E] text-white px-2 py-0.5 rounded text-[3px] whitespace-nowrap z-50 transform -rotate-45 pointer-events-none shadow-lg">
                      {isActive ? mapping.view : `Bloqueado`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!isMobile && hoveredCell && (
          <div className="absolute bottom-16 px-6 py-2 glass-card rounded-full border-[#D4AF37] animate-in fade-in slide-in-from-bottom-2 duration-300">
             <p className="font-cinzel text-sm font-bold text-[#4A233E] tracking-[0.2em] uppercase">{hoveredCell}</p>
          </div>
        )}
      </div>

      {/* Functional Section: Modules */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pt-8">
        <div className="flex-1 overflow-y-auto pr-2 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[11px] font-inter font-bold uppercase tracking-[0.25em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3 px-2">
              Módulos Pendientes
            </h3>
            <div className="grid gap-4">
              {modules.filter(m => !m.active).map(mod => (
                <div key={mod.id} className="glass-card p-5 md:p-7 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between group transition-all duration-500 gap-6 hover:shadow-xl hover:shadow-pink-100/50">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-[#FFF0F5] border border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      {getIcon(mod.icon, "w-7 h-7 md:w-8 md:h-8")}
                    </div>
                    <div>
                      <h4 className="font-cinzel text-lg md:text-xl text-[#4A233E] font-bold tracking-tight">{mod.name.toUpperCase()}</h4>
                      <p className="text-sm text-[#8B5E75] font-garamond italic mt-0.5 max-w-xs">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex w-full md:w-auto items-center justify-between md:flex-col md:items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-[#F8C8DC]/30">
                    <div className="flex items-center gap-1.5 text-[#D4AF37] font-cinzel font-bold text-lg">
                      <span>{mod.cost}</span>
                      {getIcon('sparkles', "w-4 h-4")}
                    </div>
                    <button 
                      onClick={() => onActivate(mod.id)}
                      className="btn-primary px-8 py-3 rounded-2xl font-cinzel text-[11px] font-bold tracking-[0.2em] uppercase shadow-md active:scale-95 transition-transform"
                    >
                      Activar
                    </button>
                  </div>
                </div>
              ))}
              {modules.filter(m => !m.active).length === 0 && (
                <div className="py-10 text-center opacity-30 italic font-garamond">
                  Todos los misterios del Atanor han sido revelados.
                </div>
              )}
            </div>
          </div>

          {modules.some(m => m.active) && (
            <div className="space-y-4 pt-6">
              <h3 className="text-[11px] font-inter font-bold uppercase tracking-[0.25em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3 px-2">
                Módulos Activos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                {modules.filter(m => m.active).map(mod => (
                  <div 
                    key={mod.id} 
                    className="bg-white/50 border border-[#F8C8DC] p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/80 cursor-pointer shadow-sm active:scale-95"
                    onClick={() => {
                        const view = Object.values(NavView).find(v => v.toLowerCase().includes(mod.id.toLowerCase())) || NavView.DASHBOARD;
                        setActiveView(view as NavView);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-[#E35B8F] bg-[#E35B8F]/10 p-2 rounded-lg">{getIcon(mod.icon, "w-4 h-4")}</div>
                      <h4 className="font-cinzel text-xs font-bold text-[#4A233E] tracking-widest">{mod.name.toUpperCase()}</h4>
                    </div>
                    <div className="text-[#D4AF37]">
                      {getIcon('check', "w-5 h-5")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
