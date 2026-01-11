
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Module, NavView } from '../types';
import { getIcon } from '../constants';
import AuthModule from './AuthModule';
import { supabaseService } from '../services/supabaseService';

interface DashboardProps {
  modules: Module[];
  onActivate: (id: string) => void;
  isMobile: boolean;
  setActiveView: (view: NavView) => void;
  user?: any;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  onAuthSuccess: () => void;
  isNightMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  modules, 
  onActivate, isMobile, 
  setActiveView, 
  user, 
  showLoginModal,
  setShowLoginModal,
  onAuthSuccess,
  isNightMode = false
}) => {
  // Estados para drag and drop
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estados para touch drag and drop (mobile)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrentPos, setTouchCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const touchMoveHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);
  const touchEndHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);

  // Asegurar que el modal se cierre si el usuario ya está autenticado
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [user, showLoginModal, setShowLoginModal]);

  // Función para inicializar el orden de módulos basado en posiciones guardadas
  const initializeModuleOrder = useCallback(() => {
    if (modules.length > 0) {
      // Separar activos e inactivos
      const activeModules = modules.filter(m => m.active);
      const inactiveModules = modules.filter(m => !m.active);
      
      // Ordenar módulos activos por posición guardada
      const orderedActive = [...activeModules].sort((a, b) => {
        if (a.gridPosition && b.gridPosition) {
          const aPos = a.gridPosition.row * 100 + a.gridPosition.col;
          const bPos = b.gridPosition.row * 100 + b.gridPosition.col;
          return aPos - bPos;
        }
        if (a.gridPosition) return -1;
        if (b.gridPosition) return 1;
        // Si ninguno tiene posición, mantener orden original
        return 0;
      });
      
      // Combinar: inactivos primero, luego activos ordenados
      const ordered = [...inactiveModules, ...orderedActive];
      setModuleOrder(ordered.map(m => m.id));
    }
  }, [modules]);

  // Inicializar orden de módulos basado en posiciones guardadas cuando cambian los módulos
  useEffect(() => {
    initializeModuleOrder();
  }, [initializeModuleOrder]);

  // Reinicializar el orden cuando se monta el componente o cuando cambia el usuario
  // Esto asegura que las posiciones se carguen correctamente al volver al Dashboard
  useEffect(() => {
    if (user && modules.length > 0) {
      // Pequeño delay para asegurar que los módulos están completamente cargados
      const timer = setTimeout(() => {
        initializeModuleOrder();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, initializeModuleOrder]);

  // Guardar posición del módulo en la BD
  const handleSaveModulePosition = useCallback(async (moduleId: string, row: number, col: number) => {
    if (!user) return;

    try {
      await supabaseService.updateModule(user.id, moduleId, { 
        gridPosition: { row, col } 
      });
    } catch (error) {
      console.error('Error guardando posición del módulo:', error);
    }
  }, [user]);

  // Función para guardar todas las posiciones de una vez (más robusta)
  const saveAllModulePositions = useCallback(async (newOrder: string[]) => {
    if (!user) return;

    const GRID_COLS = 3;
    const activeModuleIds = newOrder.filter(moduleId => {
      const module = modules.find(m => m.id === moduleId);
      return module?.active;
    });

    // Guardar todas las posiciones en paralelo para mejor rendimiento
    const savePromises = activeModuleIds.map((moduleId, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      return supabaseService.updateModule(user.id, moduleId, { 
        gridPosition: { row, col } 
      });
    });

    try {
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error guardando posiciones de módulos:', error);
    }
  }, [user, modules]);

  // Handlers de drag and drop
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModule(moduleId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleId);
    // Hacer el elemento semi-transparente mientras se arrastra
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedModule(null);
    setDragOverIndex(null);
    setIsDragging(false);
    // Restaurar opacidad
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedModule) return;

    const draggedIndex = moduleOrder.indexOf(draggedModule);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    // Separar módulos activos e inactivos
    const pendingModules = moduleOrder.filter(moduleId => {
      const module = modules.find(m => m.id === moduleId);
      return module && !module.active;
    });
    
    const activeModules = moduleOrder.filter(moduleId => {
      const module = modules.find(m => m.id === moduleId);
      return module && module.active;
    });
    
    // Calcular índices en el array de módulos activos
    const draggedIndexInActive = activeModules.indexOf(draggedModule);
    const targetIndexInActive = targetIndex - pendingModules.length;
    
    // Solo reordenar si ambos índices son válidos y diferentes
    if (draggedIndexInActive !== -1 && targetIndexInActive >= 0 && targetIndexInActive < activeModules.length && draggedIndexInActive !== targetIndexInActive) {
      // Crear nuevo orden: remover el módulo arrastrado
      const newActiveModules = [...activeModules];
      const [removedModule] = newActiveModules.splice(draggedIndexInActive, 1);
      
      // Insertar en la nueva posición
      newActiveModules.splice(targetIndexInActive, 0, removedModule);
      
      // Combinar: pendientes primero, luego activos reordenados
      const newOrder = [...pendingModules, ...newActiveModules];
      
      setModuleOrder(newOrder);

      // Guardar todas las posiciones de una vez
      saveAllModulePositions(newOrder);
    }

    setDragOverIndex(null);
    
    // Pequeño delay para evitar que el onClick se ejecute después del drop
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  const MODULE_TO_VIEW: Record<string, NavView> = {
    'subjects': NavView.SUBJECTS,
    'calendar': NavView.CALENDAR,
    'focus': NavView.FOCUS,
    'diary': NavView.DIARY,
    'balanza': NavView.BALANZA,
    'ai': NavView.AI,
    'profile': NavView.PROFILE,
    'security': NavView.SECURITY,
    'social': NavView.SOCIAL,
    'bazar': NavView.BAZAR,
  };

  // Ordenar módulos: pendientes primero, adquiridos al final
  const sortedModules = useMemo(() => {
    const pending = modules.filter(m => !m.active);
    const acquired = modules.filter(m => m.active);
    
    // Si hay pendientes, mostrarlos primero
    if (pending.length > 0) {
      return [...pending, ...acquired];
    }
    // Si no hay pendientes, mostrar adquiridos pero indicando que fueron adquiridos
    return acquired;
  }, [modules]);

  // Obtener módulos ordenados según el orden personalizado
  const orderedModules = useMemo(() => {
    if (moduleOrder.length === 0) return sortedModules;
    
    const orderMap = new Map(moduleOrder.map((id, index) => [id, index]));
    const pending = sortedModules.filter(m => !m.active);
    const acquired = sortedModules.filter(m => m.active);
    
    // Ordenar solo los módulos adquiridos según el orden personalizado
    const orderedAcquired = [...acquired].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? Infinity;
      const bIndex = orderMap.get(b.id) ?? Infinity;
      return aIndex - bIndex;
    });
    
    return [...pending, ...orderedAcquired];
  }, [sortedModules, moduleOrder]);

  // Handlers para touch drag and drop (mobile) - usando event listeners manuales
  const handleTouchStart = (e: React.TouchEvent, moduleId: string) => {
    if (!user || !modules.find(m => m.id === moduleId)?.active) return;
    
    const touch = e.touches[0];
    const startPos = { x: touch.clientX, y: touch.clientY };
    setTouchStartPos(startPos);
    setDraggedModule(moduleId);
    setIsDragging(false);
    const element = e.currentTarget as HTMLElement;
    setDraggedElement(element);
    
    if (element) {
      element.style.transition = 'none';
      // Guardar la posición inicial del elemento
      const rect = element.getBoundingClientRect();
      element.dataset.initialX = rect.left.toString();
      element.dataset.initialY = rect.top.toString();
    }

    // Capturar valores actuales para los closures
    const currentStartPos = startPos;
    const currentModuleId = moduleId;
    const currentElement = element;
    let isCurrentlyDragging = false;
    const currentOrder = [...moduleOrder]; // Capturar el orden actual

    // Función de limpieza
    const cleanup = () => {
      if (touchMoveHandlerRef.current) {
        document.removeEventListener('touchmove', touchMoveHandlerRef.current, { passive: false } as any);
        touchMoveHandlerRef.current = null;
      }
      if (touchEndHandlerRef.current) {
        document.removeEventListener('touchend', touchEndHandlerRef.current, { passive: false } as any);
        document.removeEventListener('touchcancel', touchEndHandlerRef.current, { passive: false } as any);
        touchEndHandlerRef.current = null;
      }
      resetTouchState();
    };

    // Handler para touchmove
    const touchMoveHandler = (e: TouchEvent) => {
      if (!currentStartPos || !currentModuleId || !currentElement) {
        cleanup();
        return;
      }
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - currentStartPos.x;
      const deltaY = touch.clientY - currentStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Solo activar drag si hay un movimiento significativo (más de 8px)
      if (distance > 8) {
        if (!isCurrentlyDragging) {
          isCurrentlyDragging = true;
          setIsDragging(true);
          e.preventDefault();
          e.stopPropagation();
          
          // Prevenir scroll del body mientras se arrastra
          document.body.style.overflow = 'hidden';
          
          if (currentElement) {
            currentElement.style.opacity = '0.7';
            currentElement.style.transform = 'scale(1.08)';
            currentElement.style.zIndex = '1000';
            currentElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
          }
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
        
        setTouchCurrentPos({ x: touch.clientX, y: touch.clientY });
        
        if (currentElement) {
          currentElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        }
        
        // Encontrar el elemento sobre el que estamos (similar a desktop)
        if (currentElement) {
          currentElement.style.pointerEvents = 'none';
        }
        
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (currentElement) {
          currentElement.style.pointerEvents = '';
        }
        
        // Limpiar estilos anteriores
        document.querySelectorAll('[data-module-id]').forEach((el) => {
          if (el instanceof HTMLElement && el !== currentElement) {
            el.style.borderColor = '';
            el.style.borderWidth = '';
            el.style.backgroundColor = '';
          }
        });
        
        if (elementBelow) {
          const cardElement = elementBelow.closest('[data-module-id]') as HTMLElement;
          if (cardElement && cardElement.dataset.moduleId && cardElement !== currentElement) {
            const targetModuleId = cardElement.dataset.moduleId;
            const targetIndex = currentOrder.findIndex(id => id === targetModuleId);
            
            if (targetIndex !== -1 && targetModuleId !== currentModuleId) {
              const targetModule = modules.find(m => m.id === targetModuleId);
              // Solo mostrar feedback si es un módulo activo
              if (targetModule?.active) {
                setDragOverIndex(targetIndex);
                cardElement.style.borderColor = 'rgba(212, 175, 55, 0.8)';
                cardElement.style.borderWidth = '3px';
                cardElement.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
              }
            }
          }
        }
      }
    };

    // Handler para touchend
    const touchEndHandler = (e: TouchEvent) => {
      if (!currentModuleId || !currentStartPos) {
        cleanup();
        return;
      }

      // Restaurar scroll del body
      document.body.style.overflow = '';

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - currentStartPos.x;
      const deltaY = touch.clientY - currentStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (isCurrentlyDragging && distance > 12) {
        // Limpiar estilos de todos los elementos primero
        document.querySelectorAll('[data-module-id]').forEach((el) => {
          if (el instanceof HTMLElement && el !== currentElement) {
            el.style.borderColor = '';
            el.style.backgroundColor = '';
          }
        });

        // Ocultar temporalmente el elemento arrastrado para detectar correctamente el elemento debajo
        if (currentElement) {
          currentElement.style.pointerEvents = 'none';
          currentElement.style.opacity = '0.3';
        }

        // Calcular la posición del grid basándose en la posición del touch
        // No necesitamos buscar un módulo objetivo específico, solo calcular la posición del grid

        // Encontrar el módulo objetivo (similar a desktop)
        if (currentElement) {
          currentElement.style.pointerEvents = 'none';
        }
        
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        let targetModuleId: string | null = null;
        
        if (elementBelow) {
          const cardElement = elementBelow.closest('[data-module-id]') as HTMLElement;
          if (cardElement && cardElement.dataset.moduleId && cardElement.dataset.moduleId !== currentModuleId) {
            targetModuleId = cardElement.dataset.moduleId;
          }
        }
        
        if (currentElement) {
          currentElement.style.pointerEvents = '';
        }
        
        // Reordenar módulos (igual que desktop)
        const draggedIndex = currentOrder.indexOf(currentModuleId);
        
        if (draggedIndex === -1) {
          cleanup();
          return;
        }
        
        let targetIndex = draggedIndex; // Por defecto, mantener la misma posición
        
        if (targetModuleId) {
          // Si hay un módulo objetivo, usar su índice
          const foundIndex = currentOrder.indexOf(targetModuleId);
          if (foundIndex !== -1) {
            const targetModule = modules.find(m => m.id === targetModuleId);
            // Solo reordenar si el objetivo es un módulo activo
            if (targetModule?.active) {
              targetIndex = foundIndex;
            }
          }
        } else {
          // Si no hay módulo objetivo, calcular la posición basándose en el grid
          const gridContainer = currentElement?.closest('[data-grid-container="true"]') as HTMLElement || 
                                currentElement?.closest('.grid') as HTMLElement;
          
          if (gridContainer) {
            const gridRect = gridContainer.getBoundingClientRect();
            const relativeX = touch.clientX - gridRect.left;
            const relativeY = touch.clientY - gridRect.top;
            
            const GRID_COLS = 3;
            const computedStyle = window.getComputedStyle(gridContainer);
            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 12;
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const gap = parseFloat(computedStyle.gap) || 12;
            
            const availableWidth = gridRect.width - paddingLeft - (parseFloat(computedStyle.paddingRight) || 12);
            const cellWidth = (availableWidth - (gap * (GRID_COLS - 1))) / GRID_COLS;
            const cellHeight = cellWidth;
            
            const adjustedX = relativeX - paddingLeft;
            const adjustedY = relativeY - paddingTop;
            const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(adjustedX / (cellWidth + gap))));
            const row = Math.max(0, Math.floor(adjustedY / (cellHeight + gap)));
            
            // Calcular el índice objetivo
            const pendingCount = currentOrder.filter(moduleId => {
              const module = modules.find(m => m.id === moduleId);
              return module && !module.active;
            }).length;
            
            const calculatedIndex = pendingCount + (row * GRID_COLS + col);
            const maxIndex = currentOrder.length - 1;
            targetIndex = Math.max(pendingCount, Math.min(maxIndex, calculatedIndex));
          }
        }
        
        // Solo reordenar si la posición cambió
        if (targetIndex !== draggedIndex) {
          const newOrder = [...currentOrder];
          const [removed] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, removed);
          
          // Actualizar el estado con el nuevo orden
          setModuleOrder(newOrder);
          
          // Guardar todas las posiciones de una vez
          if (user) {
            saveAllModulePositions(newOrder);
          }
        }
        
        cleanup();
      } else {
        // Si no hubo arrastre significativo, limpiar estilos y resetear estado
        document.querySelectorAll('[data-module-id]').forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.borderColor = '';
            el.style.borderWidth = '';
            el.style.backgroundColor = '';
          }
        });
        // Resetear el estado de arrastre
        setDraggedModule(null);
        setDragOverIndex(null);
        setIsDragging(false);
      }
      
      cleanup();
    };

    // Guardar referencias y agregar listeners
    touchMoveHandlerRef.current = touchMoveHandler;
    touchEndHandlerRef.current = touchEndHandler;
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler, { passive: false });
    document.addEventListener('touchcancel', touchEndHandler, { passive: false });
  };

  const resetTouchState = () => {
    // Restaurar scroll del body si estaba bloqueado
    document.body.style.overflow = '';
    
    if (draggedElement) {
      draggedElement.style.opacity = '';
      draggedElement.style.transform = '';
      draggedElement.style.zIndex = '';
      draggedElement.style.transition = '';
      draggedElement.style.pointerEvents = '';
      draggedElement.style.boxShadow = '';
      // Limpiar datos temporales
      delete draggedElement.dataset.initialX;
      delete draggedElement.dataset.initialY;
    }
    document.querySelectorAll('[data-module-id]').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.borderColor = '';
        el.style.borderWidth = '';
        el.style.backgroundColor = '';
      }
    });
    setTouchStartPos(null);
    setTouchCurrentPos(null);
    setDraggedModule(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setDraggedElement(null);
  };

  // Limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      if (touchMoveHandlerRef.current) {
        document.removeEventListener('touchmove', touchMoveHandlerRef.current, { passive: false } as any);
      }
      if (touchEndHandlerRef.current) {
        document.removeEventListener('touchend', touchEndHandlerRef.current, { passive: false } as any);
        document.removeEventListener('touchcancel', touchEndHandlerRef.current, { passive: false } as any);
      }
    };
  }, []);

  if (isMobile) {
    return (
      <>
        <div className="h-full flex flex-col gap-4 sm:gap-6 pb-32 animate-fade-in px-3 sm:px-4 overflow-y-auto no-scrollbar safe-area-inset-bottom">
          <section className="text-center pt-2 mb-4">
            <h1 className={`font-cinzel text-5xl font-black tracking-[0.25em] uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>El Atanor</h1>
            <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto mt-2 opacity-50 rounded-full" />
          </section>

          {!user && (
            <section className={`p-4 rounded-2xl border-2 mx-2 mb-4 backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                : 'glass-card border-[#D4AF37]/30'
            }`}>
              <div className="text-center">
                <h3 className={`font-cinzel text-lg mb-2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>Explora el Atanor</h3>
                <p className={`font-garamond italic text-sm mb-4 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Inicia sesión para transmutar módulos</p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="btn-primary px-6 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest shadow-xl w-full"
                >
                  Iniciar Sesión
                </button>
              </div>
            </section>
          )}
          <section className="flex-1">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3 flex-1">
                {user ? 'Módulos' : 'Módulos Disponibles'}
              </h3>
              {user && orderedModules.filter(m => m.active).length > 0 && (
                <p className="text-[9px] font-garamond italic text-[#8B5E75]/70 ml-2 whitespace-nowrap">
                  Mantén presionado para mover
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pb-12" data-grid-container="true">
              {orderedModules.map((mod, index) => {
                const isActive = mod.active;
                const isPending = !isActive;
                const pendingCount = orderedModules.filter(m => !m.active).length;
                const isFirstAcquired = isActive && index === pendingCount;
                const isDraggingMod = draggedModule === mod.id;
                const isDragOverMod = dragOverIndex === index;
                
                return (
                  <div 
                    key={mod.id}
                    data-module-id={mod.id}
                    onTouchStart={(e) => user && isActive && handleTouchStart(e, mod.id)}
                    onClick={(e) => {
                      // No hacer nada si se está arrastrando o se acaba de arrastrar
                      if (isDragging || draggedModule) {
                        setTimeout(() => {
                          setIsDragging(false);
                          setDraggedModule(null);
                        }, 100);
                        return;
                      }
                      
                      // Si se hace click en un botón, no ejecutar el onClick del contenedor
                      if ((e.target as HTMLElement).closest('button')) return;
                      
                      if (isActive) setActiveView(MODULE_TO_VIEW[mod.id] || NavView.DASHBOARD);
                      else onActivate(mod.id);
                    }}
                    className={`aspect-square rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-300 active:scale-95 relative border-2 min-h-[120px] touch-manipulation backdrop-blur-[15px] ${
                      isActive 
                        ? isNightMode 
                          ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-lg shadow-[#C77DFF]/20' 
                          : 'glass-card border-[#D4AF37]/30 shadow-md'
                        : isNightMode
                          ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56]/30 opacity-70'
                          : 'glass-card border-transparent opacity-60 grayscale-[0.4]'
                    } ${isDraggingMod ? 'opacity-50 z-50' : ''} ${
                      isDragOverMod ? 'ring-2 ring-[#D4AF37] ring-offset-2 scale-105 bg-[#D4AF37]/10' : ''
                    }`}
                  >
                    <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                      isActive 
                        ? isNightMode
                          ? 'bg-[rgba(199,125,255,0.2)] text-[#A68A56] border border-[#A68A56]/40 shadow-[0_0_10px_rgba(199,125,255,0.3)]'
                          : 'bg-[#E35B8F]/10 text-[#E35B8F]'
                        : isNightMode 
                          ? 'bg-[rgba(48,43,79,0.4)] text-[#7A748E] border border-[#A68A56]/30' 
                          : 'bg-white/40 text-[#8B5E75]'
                    }`}>
                      {getIcon(mod.icon, "w-7 h-7 sm:w-6 sm:h-6")}
                    </div>
                    <h4 className={`font-cinzel text-[11px] sm:text-[10px] font-black text-center uppercase tracking-widest px-1 leading-tight transition-colors duration-500 ${
                      isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                    }`}>
                      {mod.name}
                    </h4>
                    {!isActive && (
                      <div className="mt-2 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-[8px] font-black flex items-center gap-1 shadow-sm">
                        {mod.cost} {getIcon('sparkles', 'w-2 h-2')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Enlaces Legales - Mobile - Al final de los módulos */}
          <div className="mt-8 pt-6 border-t border-[#F8C8DC]/30 px-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="/privacidad"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView(NavView.PRIVACY_POLICY);
                  }}
                  className="font-garamond text-[#8B5E75] hover:text-[#4A233E] transition-colors underline-offset-2 hover:underline"
                >
                  Política de Privacidad
                </a>
                <span className="text-[#F8C8DC]">•</span>
                <a
                  href="/terminosycondiciones"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView(NavView.TERMS_OF_SERVICE);
                  }}
                  className="font-garamond text-[#8B5E75] hover:text-[#4A233E] transition-colors underline-offset-2 hover:underline"
                >
                  Términos y Condiciones
                </a>
                <span className="text-[#F8C8DC]">•</span>
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView(NavView.DOCS);
                  }}
                  className="font-garamond text-[#8B5E75] hover:text-[#4A233E] transition-colors underline-offset-2 hover:underline"
                >
                  Documentación
                </a>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-garamond text-sm text-[#8B5E75]">
                  Studianta es una creación de{' '}
                  <a
                    href="https://www.versaproducciones.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2D1A26] hover:text-[#E35B8F] font-semibold underline-offset-2 hover:underline transition-colors"
                  >
                    Versa Producciones
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Login Mobile */}
        {showLoginModal && (
          <div 
            className={`fixed inset-0 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in transition-colors duration-500 ${
              isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-black/50'
            }`}
            onClick={() => setShowLoginModal(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowLoginModal(false);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
          >
            <div 
              className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.95)] border-2 border-[#A68A56]/50' 
                  : 'glass-card border-2 border-[#F8C8DC]/50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${
                  isNightMode 
                    ? 'text-[#A68A56] hover:bg-[rgba(166,138,86,0.2)]' 
                    : 'text-[#8B5E75] hover:text-[#E35B8F]'
                }`}
                aria-label="Cerrar modal"
                tabIndex={0}
                >
                  {getIcon('x', 'w-5 h-5')}
                </button>
              <AuthModule 
                onAuthSuccess={() => {
                  onAuthSuccess();
                  setShowLoginModal(false);
                }}
                isMobile={true}
                isNightMode={isNightMode}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 pb-10 max-w-7xl mx-auto px-4 lg:px-6 overflow-y-auto no-scrollbar relative z-0">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className={`font-cinzel text-5xl lg:text-6xl font-black tracking-[0.25em] uppercase transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
        }`}>El Atanor</h1>
        <div className="h-1 w-16 lg:w-20 bg-[#D4AF37] mx-auto mt-3 rounded-full" />
      </div>

        {!user && (
        <div className={`p-6 rounded-2xl border-2 mb-4 backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
            : 'glass-card border-[#D4AF37]/30'
        }`}>
              <div className="flex items-center justify-between gap-4">
                <div>
              <h3 className={`font-cinzel text-xl mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>Explora el Atanor</h3>
              <p className={`font-garamond italic text-base transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>Inicia sesión para transmutar módulos</p>
                </div>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="btn-primary px-6 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest shadow-xl whitespace-nowrap"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
        )}

      {/* Grid de Módulos - 3 columnas en desktop, 4 en pantallas grandes */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-[11px] lg:text-[12px] font-inter font-black uppercase tracking-[0.3em] border-b-2 pb-4 flex-1 transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD] border-[#A68A56]/40' : 'text-[#8B5E75] border-[#F8C8DC]'
          }`}>
              {user ? 'Investigaciones' : 'Módulos Disponibles'}
            </h3>
          {user && orderedModules.filter(m => m.active).length > 0 && (
            <p className="text-[9px] lg:text-[10px] font-garamond italic text-[#8B5E75]/70 ml-4 whitespace-nowrap">
              Arrastra para reorganizar
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 lg:gap-6">
          {orderedModules.map((mod, index) => {
                const isActive = mod.active;
            const isDragging = draggedModule === mod.id;
            const isDragOver = dragOverIndex === index;
            
                return (
              <div
                key={mod.id}
                draggable={user && isActive}
                onDragStart={(e) => user && isActive && handleDragStart(e, mod.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => user && isActive && handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => user && isActive && handleDrop(e, index)}
                onClick={(e) => {
                  // No hacer nada si se está arrastrando o se acaba de arrastrar
                  if (isDragging || draggedModule) {
                    // Pequeño delay para resetear el estado
                    setTimeout(() => {
                      setIsDragging(false);
                      setDraggedModule(null);
                    }, 100);
                    return;
                  }
                  
                  // Si se hace click en un botón, no ejecutar el onClick del contenedor
                  if ((e.target as HTMLElement).closest('button')) return;
                  
                  if (!isActive) {
                    onActivate(mod.id);
                  } else {
                    setActiveView(MODULE_TO_VIEW[mod.id] || NavView.DASHBOARD);
                  }
                }}
                className={`p-6 rounded-2xl lg:rounded-3xl flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-300 gap-4 backdrop-blur-[15px] ${
                  isActive 
                    ? isNightMode 
                      ? 'bg-[rgba(48,43,79,0.6)] border-2 border-[#A68A56]/50 shadow-lg shadow-[#C77DFF]/20' 
                      : 'glass-card border-2 border-[#D4AF37]/30'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.3)] border-2 border-[#A68A56]/30 opacity-70'
                      : 'glass-card border-2 border-transparent opacity-60 grayscale-[0.4]'
                } ${isDragging ? 'opacity-50 cursor-grabbing' : user && isActive ? 'cursor-move' : 'cursor-pointer'} ${
                  isDragOver ? 'ring-2 ring-[#D4AF37] ring-offset-2 scale-105 bg-[#D4AF37]/10' : ''
                }`}
                title={user && isActive ? 'Arrastra para reorganizar' : undefined}
              >
                          <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? isNightMode
                        ? 'bg-[rgba(199,125,255,0.2)] text-[#A68A56] border-2 border-[#A68A56]/40 shadow-[0_0_15px_rgba(199,125,255,0.3)]'
                        : 'bg-[#E35B8F]/10 text-[#E35B8F] border-2 border-[#E35B8F]/20'
                      : isNightMode
                        ? 'bg-[rgba(48,43,79,0.4)] text-[#7A748E] border-2 border-[#A68A56]/30'
                        : 'bg-white/40 text-[#8B5E75] border-2 border-[#F8C8DC]/30'
                  }`}>
                    {getIcon(mod.icon, "w-10 h-10 lg:w-12 lg:h-12")}
                          </div>
                          <div className="flex flex-col items-center gap-2">
                    <h4 className={`font-cinzel text-xl lg:text-2xl font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                    }`}>{mod.name.toUpperCase()}</h4>
                          </div>
                  <p className={`text-sm lg:text-base font-garamond italic leading-relaxed transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {mod.description}
                  </p>
                  {!isActive && (
                    <div className="mt-2 flex items-center gap-2 text-[#D4AF37] font-cinzel font-black text-xl lg:text-2xl">
                      <span>{mod.cost}</span>
                      {getIcon('sparkles', "w-5 h-5")}
                    </div>
                  )}
                  {isActive && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveView(MODULE_TO_VIEW[mod.id] || NavView.DASHBOARD);
                      }}
                      className="btn-primary w-full px-6 py-3 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest shadow-xl bg-[#D4AF37]/20 text-[#D4AF37] border-2 border-[#D4AF37]/30 hover:bg-[#D4AF37]/30"
                    >
                      Abrir
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
