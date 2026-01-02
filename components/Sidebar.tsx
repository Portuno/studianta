
import React from 'react';
import { NavView } from '../types';
import { getIcon, COLORS } from '../constants';

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  essence: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, essence }) => {
  const menuItems = [
    { id: NavView.SUBJECTS, icon: 'book' },
    { id: NavView.CALENDAR, icon: 'compass' },
    { id: NavView.FOCUS, icon: 'hourglass' },
    { id: NavView.DIARY, icon: 'pen' },
    { id: NavView.FINANCE, icon: 'scale' },
    { id: NavView.SOCIAL, icon: 'users' },
  ];

  return (
    <aside className="w-64 h-full glass-card flex flex-col z-50">
      <div className="p-8">
        <div 
          className="flex flex-col items-center cursor-pointer mb-12"
          onClick={() => setActiveView(NavView.DASHBOARD)}
        >
          <h1 className="font-cinzel text-2xl font-black tracking-widest text-[#4A233E]">
            STUDI<span className="text-[#E35B8F]">A</span>NTA
          </h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] mt-1" />
        </div>

        <nav className="space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group ${
                activeView === item.id 
                  ? 'bg-[#E35B8F] text-white shadow-lg shadow-pink-200' 
                  : 'text-[#8B5E75] hover:bg-[#FFD1DC]'
              }`}
            >
              <span className={activeView === item.id ? 'text-white' : 'text-[#E35B8F] group-hover:scale-110 transition-transform'}>
                {getIcon(item.icon, "w-5 h-5")}
              </span>
              <span className="font-garamond font-medium">{item.id}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <div className="bg-white/50 border border-[#D4AF37]/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-tighter text-[#8B5E75]">Esencia</span>
            <span className="font-cinzel text-lg font-bold text-[#D4AF37]">{essence}</span>
          </div>
          <div className="text-[#D4AF37]">
            {getIcon('sparkles', "w-6 h-6 animate-pulse")}
          </div>
        </div>

        <div className="glass-card p-3 rounded-2xl flex items-center gap-3 border-[#F8C8DC]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-2 border-white shadow-sm flex-shrink-0" />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-[#4A233E] truncate">Académico Real</p>
            <p className="text-[10px] text-[#8B5E75]">Nivel Arcano</p>
          </div>
        </div>

        <button className="w-full text-center text-[10px] text-[#8B5E75] hover:text-[#E35B8F] transition-colors">
          Enviar Feedback Celestial
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
