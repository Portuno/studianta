import React from 'react';
import { getIcon } from '../../constants';

interface StatsWidgetProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  variant?: 'default' | 'accent';
  onClick?: () => void;
  isNightMode?: boolean;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({
  title,
  icon,
  children,
  variant = 'default',
  onClick,
  isNightMode = false,
}) => {
  const baseStyles = `rounded-2xl border-2 transition-all duration-300 backdrop-blur-[15px] ${
    onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''
  }`;

  const variantStyles = variant === 'accent'
    ? isNightMode
      ? 'bg-[rgba(199,125,255,0.2)] border-[#C77DFF]/50 shadow-lg shadow-[#C77DFF]/20'
      : 'bg-[#E35B8F]/10 border-[#E35B8F]/30 shadow-lg'
    : isNightMode
      ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50'
      : 'glass-card border-[#D4AF37]/30';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} p-6`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${
          isNightMode
            ? 'bg-[rgba(199,125,255,0.2)] text-[#A68A56]'
            : 'bg-[#E35B8F]/10 text-[#E35B8F]'
        }`}>
          {getIcon(icon, 'w-6 h-6')}
        </div>
        <h3 className={`font-cinzel text-lg font-black uppercase tracking-wider transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
        }`}>
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default StatsWidget;
