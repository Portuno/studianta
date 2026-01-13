import React, { useState } from 'react';
import { getIcon } from '../../constants';

interface ExpandableSectionProps {
  title: string;
  icon?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  isNightMode?: boolean;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  defaultExpanded = false,
  children,
  isNightMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 backdrop-blur-[15px] ${
      isNightMode
        ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50'
        : 'glass-card border-[#D4AF37]/30'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center justify-between transition-colors duration-300 ${
          isNightMode ? 'hover:bg-[rgba(48,43,79,0.8)]' : 'hover:bg-[rgba(255,255,255,0.1)]'
        }`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-xl ${
              isNightMode
                ? 'bg-[rgba(199,125,255,0.2)] text-[#A68A56]'
                : 'bg-[#E35B8F]/10 text-[#E35B8F]'
            }`}>
              {getIcon(icon, 'w-5 h-5')}
            </div>
          )}
          <h3 className={`font-cinzel text-lg font-black uppercase tracking-wider transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            {title}
          </h3>
        </div>
        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          {getIcon('chevron', 'w-5 h-5')}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExpandableSection;
