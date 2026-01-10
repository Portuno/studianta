
import React from 'react';
import { NavView } from '../types';
import { getIcon, COLORS } from '../constants';

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
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

      <div className="mt-auto p-6">
        <button className="w-full text-center text-[10px] text-[#8B5E75] hover:text-[#E35B8F] transition-colors">
          Enviar Feedback Celestial
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
