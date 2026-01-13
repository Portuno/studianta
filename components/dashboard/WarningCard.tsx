import React from 'react';
import { getIcon } from '../../constants';
import { AlertSeverity } from '../../utils/dashboardAlerts';

interface WarningCardProps {
  type: AlertSeverity;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  isNightMode?: boolean;
}

const WarningCard: React.FC<WarningCardProps> = ({
  type,
  title,
  message,
  action,
  isNightMode = false,
}) => {
  const getSeverityStyles = () => {
    switch (type) {
      case 'critical':
        return {
          bg: isNightMode
            ? 'bg-[rgba(220,38,38,0.2)] border-[#DC2626]/60'
            : 'bg-[rgba(220,38,38,0.1)] border-[#DC2626]/40',
          text: isNightMode ? 'text-[#FCA5A5]' : 'text-[#DC2626]',
          icon: 'x',
        };
      case 'warning':
        return {
          bg: isNightMode
            ? 'bg-[rgba(234,179,8,0.2)] border-[#EAB308]/60'
            : 'bg-[rgba(234,179,8,0.1)] border-[#EAB308]/40',
          text: isNightMode ? 'text-[#FDE047]' : 'text-[#CA8A04]',
          icon: 'low-battery',
        };
      case 'info':
        return {
          bg: isNightMode
            ? 'bg-[rgba(59,130,246,0.2)] border-[#3B82F6]/60'
            : 'bg-[rgba(59,130,246,0.1)] border-[#3B82F6]/40',
          text: isNightMode ? 'text-[#93C5FD]' : 'text-[#2563EB]',
          icon: 'compass',
        };
      default:
        return {
          bg: isNightMode
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50'
            : 'glass-card border-[#D4AF37]/30',
          text: isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]',
          icon: 'compass',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={`p-4 rounded-2xl border-2 transition-all duration-300 backdrop-blur-[15px] ${styles.bg} ${styles.text}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${styles.bg} flex-shrink-0`}>
          {getIcon(styles.icon, 'w-5 h-5')}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-cinzel text-base font-black uppercase tracking-wider mb-1 ${styles.text}`}>
            {title}
          </h4>
          <p className={`font-garamond text-sm leading-relaxed ${styles.text} opacity-90`}>
            {message}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 px-4 py-2 rounded-xl font-cinzel text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                isNightMode
                  ? 'bg-[rgba(199,125,255,0.3)] text-[#E0E1DD] hover:bg-[rgba(199,125,255,0.4)]'
                  : 'bg-[#E35B8F]/20 text-[#E35B8F] hover:bg-[#E35B8F]/30'
              }`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarningCard;
