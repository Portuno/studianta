import React, { useState, useRef, useEffect } from 'react';
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
  isNightMode?: boolean;
}

const FocusFloatingWidget: React.FC<FocusFloatingWidgetProps> = ({
  timeLeft,
  isActive,
  isPaused,
  isNightMode = false,
  onPause,
  onResume,
  onStop,
  onOpen,
  isMobile
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [initialClickPos, setInitialClickPos] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Cargar posición guardada o inicializar posición por defecto
  useEffect(() => {
    const savedPosition = localStorage.getItem('focusWidgetPosition');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        // Si hay error, usar posición por defecto
        initializeDefaultPosition();
      }
    } else {
      initializeDefaultPosition();
    }
  }, [isMobile]);

  const initializeDefaultPosition = () => {
    const defaultX = window.innerWidth - (isMobile ? 200 : 280);
    const defaultY = window.innerHeight - (isMobile ? 200 : 140);
    setPosition({ x: defaultX, y: defaultY });
  };

  // Guardar posición en localStorage cuando cambia
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('focusWidgetPosition', JSON.stringify(position));
    }
  }, [position]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setInitialClickPos({ x: e.clientX, y: e.clientY });
      setHasDragged(false);
      setIsDragging(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setInitialClickPos({ x: touch.clientX, y: touch.clientY });
      setHasDragged(false);
      setIsDragging(true);
    }
  };

  useEffect(() => {
    let rafId: number | null = null;
    let pendingPosition: { x: number; y: number } | null = null;

    const updatePosition = () => {
      if (pendingPosition) {
        setPosition(pendingPosition);
        pendingPosition = null;
      }
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Detectar si realmente se está arrastrando (más de 5px de movimiento)
        const deltaX = Math.abs(e.clientX - initialClickPos.x);
        const deltaY = Math.abs(e.clientY - initialClickPos.y);
        if (deltaX > 5 || deltaY > 5) {
          setHasDragged(true);
        }

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Limitar dentro de los bordes de la ventana
        const maxX = window.innerWidth - (isMobile ? 200 : 280);
        const maxY = window.innerHeight - (isMobile ? 200 : 180);
        const minX = 0;
        const minY = 0;
        
        // Acumular posición pendiente en lugar de actualizar inmediatamente
        pendingPosition = {
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY))
        };

        // Usar requestAnimationFrame para limitar actualizaciones a 60fps
        if (rafId === null) {
          rafId = requestAnimationFrame(updatePosition);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        const touch = e.touches[0];
        
        // Detectar si realmente se está arrastrando (más de 5px de movimiento)
        const deltaX = Math.abs(touch.clientX - initialClickPos.x);
        const deltaY = Math.abs(touch.clientY - initialClickPos.y);
        if (deltaX > 5 || deltaY > 5) {
          setHasDragged(true);
        }

        const newX = touch.clientX - dragOffset.x;
        const newY = touch.clientY - dragOffset.y;
        
        // Limitar dentro de los bordes de la ventana
        const maxX = window.innerWidth - (isMobile ? 200 : 280);
        const maxY = window.innerHeight - (isMobile ? 200 : 180);
        const minX = 0;
        const minY = 0;
        
        // Acumular posición pendiente en lugar de actualizar inmediatamente
        pendingPosition = {
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY))
        };

        // Usar requestAnimationFrame para limitar actualizaciones a 60fps
        if (rafId === null) {
          rafId = requestAnimationFrame(updatePosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Resetear hasDragged después de un pequeño delay para permitir el onClick
      setTimeout(() => {
        setHasDragged(false);
      }, 100);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isDragging, dragOffset, isMobile, initialClickPos]);

  if (!isActive) return null;

  return (
    <div
      ref={widgetRef}
      className="fixed z-[200] animate-fade-in select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div 
        className={`rounded-2xl lg:rounded-3xl p-4 lg:p-5 border-2 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.3)]' 
            : 'glass-card border-[#D4AF37]/40'
        } ${isDragging ? 'scale-95' : 'hover:scale-105'}`}
        style={{ width: isMobile ? '200px' : '280px' }}
        onClick={(e) => {
          // Solo abrir si fue un clic simple (no un drag)
          if (!hasDragged && !isDragging) {
            onOpen();
          }
        }}
      >
        {/* Timer Display */}
        <div className="flex items-center gap-3 lg:gap-4 mb-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-2 border-[#D4AF37]/40 flex-shrink-0">
            {getIcon('hourglass', 'w-5 h-5 lg:w-6 lg:h-6 text-[#D4AF37]')}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-mono text-xl lg:text-2xl font-black tabular-nums tracking-tighter transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              {formatTime(timeLeft)}
            </p>
            <p className={`font-cinzel text-[8px] lg:text-[9px] uppercase tracking-widest opacity-70 transition-colors duration-500 ${
              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
            }`}>
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
              className={`flex-1 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl border-2 font-cinzel text-[9px] lg:text-[10px] font-black uppercase tracking-wider transition-colors ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#7A748E] hover:bg-[rgba(48,43,79,0.8)]' 
                  : 'bg-white/80 border-[#F8C8DC] text-[#8B5E75] hover:bg-white'
              }`}
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

