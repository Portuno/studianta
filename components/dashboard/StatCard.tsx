import React from 'react';
import { getIcon } from '../../constants';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  isNightMode?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  isNightMode = false,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all duration-300 backdrop-blur-[15px] ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''
      } ${
        isNightMode
          ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-lg shadow-[#C77DFF]/20'
          : 'glass-card border-[#D4AF37]/30'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`p-2 rounded-xl ${
              isNightMode
                ? 'bg-[rgba(199,125,255,0.2)] text-[#A68A56]'
                : 'bg-[#E35B8F]/10 text-[#E35B8F]'
            }`}>
              {getIcon(icon, 'w-4 h-4')}
            </div>
          )}
          <h3 className={`font-cinzel text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            {title}
          </h3>
        </div>
        {trend && getTrendIcon()}
      </div>
      <div className="mt-2">
        <p className={`font-cinzel text-2xl font-black transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
        }`}>
          {value}
        </p>
        {subtitle && (
          <p className={`font-garamond text-xs mt-1 transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
