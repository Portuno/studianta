import React, { useState, useRef, useEffect } from 'react';
import { getIcon } from '../constants';
import CalculatorModule from './CalculatorModule';

interface CalculatorFloatingWidgetProps {
  isMobile: boolean;
  isNightMode?: boolean;
  onClose: () => void;
}

const CalculatorFloatingWidget: React.FC<CalculatorFloatingWidgetProps> = ({
  isMobile,
  isNightMode = false,
  onClose,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [initialClickPos, setInitialClickPos] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Cargar posición guardada o inicializar posición por defecto
  useEffect(() => {
    const savedPosition = localStorage.getItem('calculatorWidgetPosition');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        initializeDefaultPosition();
      }
    } else {
      initializeDefaultPosition();
    }
  }, [isMobile]);
  
  const initializeDefaultPosition = () => {
    const defaultX = window.innerWidth - (isMobile ? 320 : 400);
    const defaultY = isMobile ? 80 : 100;
    setPosition({ x: defaultX, y: defaultY });
  };
  
  // Guardar posición en localStorage cuando cambia
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('calculatorWidgetPosition', JSON.stringify(position));
    }
  }, [position]);
  
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
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = Math.abs(e.clientX - initialClickPos.x);
        const deltaY = Math.abs(e.clientY - initialClickPos.y);
        if (deltaX > 5 || deltaY > 5) {
          setHasDragged(true);
        }
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (isMobile ? 320 : 400);
        const maxY = window.innerHeight - (isMobile ? 400 : 500);
        const minX = 0;
        const minY = 0;
        
        setPosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY))
        });
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        const touch = e.touches[0];
        
        const deltaX = Math.abs(touch.clientX - initialClickPos.x);
        const deltaY = Math.abs(touch.clientY - initialClickPos.y);
        if (deltaX > 5 || deltaY > 5) {
          setHasDragged(true);
        }
        
        const newX = touch.clientX - dragOffset.x;
        const newY = touch.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (isMobile ? 320 : 400);
        const maxY = window.innerHeight - (isMobile ? 400 : 500);
        const minX = 0;
        const minY = 0;
        
        setPosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY))
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => {
        setHasDragged(false);
      }, 100);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMobile, initialClickPos]);
  
  if (isMinimized) {
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
          className={`rounded-2xl p-4 border-2 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
            isNightMode
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.3)]'
              : 'glass-card border-[#D4AF37]/40'
          } ${isDragging ? 'scale-95' : 'hover:scale-105'}`}
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-3">
            {getIcon('calculator', 'w-6 h-6')}
            <span className={`font-marcellus font-black transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Calculadora
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={widgetRef}
      className="fixed z-[200] animate-fade-in select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMobile ? '320px' : '400px',
        height: isMobile ? '400px' : '500px',
        cursor: isDragging ? 'grabbing' : 'default',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className={`h-full rounded-2xl border-2 shadow-2xl backdrop-blur-xl transition-all duration-200 flex flex-col ${
          isNightMode
            ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.3)]'
            : 'glass-card border-[#D4AF37]/40'
        } ${isDragging ? 'scale-95' : ''}`}
      >
        {/* Header */}
        <div className={`p-3 border-b flex items-center justify-between flex-shrink-0 ${
          isNightMode ? 'border-[#A68A56]/30' : 'border-[#F8C8DC]'
        }`}>
          <div className="flex items-center gap-2">
            {getIcon('calculator', 'w-5 h-5')}
            <span className={`font-marcellus font-black text-sm transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Calculadora
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className={`p-1.5 rounded-lg transition-colors ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.8)]'
                  : 'bg-white/60 text-[#8B5E75] hover:bg-white/80'
              }`}
              aria-label="Minimizar"
            >
              {getIcon('minimize', 'w-4 h-4')}
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] hover:bg-[rgba(48,43,79,0.8)]'
                  : 'bg-white/60 text-[#8B5E75] hover:bg-white/80'
              }`}
              aria-label="Cerrar"
            >
              {getIcon('x', 'w-4 h-4')}
            </button>
          </div>
        </div>
        
        {/* Calculator content */}
        <div className="flex-1 overflow-hidden">
          <CalculatorModule
            isMobile={isMobile}
            isNightMode={isNightMode}
            onFloatingMode={undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default CalculatorFloatingWidget;
