import React from 'react';
import { getIcon } from '../constants';

interface FocusFloatingWidgetProps {
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpen: () => void;
  isMobile: boolean;
}

const FocusFloatingWidget: React.FC<FocusFloatingWidgetProps> = ({
  timeLeft,
  isActive,
  isPaused,
  onPause,
  onResume,
  onStop,
  onOpen,
  isMobile
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div
      className={`fixed z-[200] ${
        isMobile 
          ? 'bottom-20 right-4' 
          : 'bottom-6 right-6'
      } animate-fade-in`}
      onClick={onOpen}
    >
      <div className="glass-card rounded-2xl lg:rounded-3xl p-4 lg:p-5 border-2 border-[#D4AF37]/40 shadow-2xl backdrop-blur-xl cursor-pointer hover:scale-105 transition-transform duration-300">
        {/* Timer Display */}
        <div className="flex items-center gap-3 lg:gap-4 mb-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-2 border-[#D4AF37]/40">
            {getIcon('hourglass', 'w-5 h-5 lg:w-6 lg:h-6 text-[#D4AF37]')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xl lg:text-2xl font-black text-[#4A233E] tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </p>
            <p className="font-cinzel text-[8px] lg:text-[9px] uppercase tracking-widest text-[#8B5E75] opacity-70">
              {isPaused ? 'Pausado' : 'Enfoque Activo'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isPaused ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResume();
              }}
              className="flex-1 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl bg-[#D4AF37] text-white font-cinzel text-[9px] lg:text-[10px] font-black uppercase tracking-wider hover:bg-[#D4AF37]/90 transition-colors shadow-md"
            >
              {getIcon('play', 'w-3 h-3 lg:w-4 lg:h-4 inline mr-1')}
              Reanudar
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPause();
              }}
              className="flex-1 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl bg-white/80 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-[9px] lg:text-[10px] font-black uppercase tracking-wider hover:bg-white transition-colors"
            >
              {getIcon('pause', 'w-3 h-3 lg:w-4 lg:h-4 inline mr-1')}
              Pausar
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl bg-[#E35B8F] text-white font-cinzel text-[9px] lg:text-[10px] font-black uppercase tracking-wider hover:bg-[#E35B8F]/90 transition-colors shadow-md"
          >
            {getIcon('x', 'w-3 h-3 lg:w-4 lg:h-4')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusFloatingWidget;

