
import React, { useState, useEffect } from 'react';
import { NavView, Module, NavigationConfig, NavigationModule } from '../types';
import { getIcon, COLORS, INITIAL_MODULES } from '../constants';
import { UserProfile, supabaseService } from '../services/supabaseService';

interface NavigationProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  isMobile: boolean;
  modules: Module[];
  user?: any;
  userProfile?: UserProfile | null;
  isNightMode?: boolean;
  toggleTheme?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView, isMobile, modules, user, userProfile, isNightMode = false, toggleTheme, collapsed = false, onToggleCollapse }) => {
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showMobileModuleSelector, setShowMobileModuleSelector] = useState<{ index: number; moduleId: string } | null>(null);

  const loadConfig = React.useCallback(async () => {
    if (!user) {
      setLoadingConfig(false);
      return;
    }
    try {
      const config = await supabaseService.getNavigationConfig(user.id);
      if (config) {
        setNavigationConfig(config);
      }
    } catch (error) {
      console.error('Error loading navigation config:', error);
    } finally {
      setLoadingConfig(false);
    }
  }, [user]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const isLocked = (moduleId: string) => {
    if (!moduleId || moduleId === 'atanor') return false;
    const mod = modules.find(m => m.id === moduleId);
    return !mod?.active;
  };

  const getModuleIcon = (moduleId: string): string => {
    const module = INITIAL_MODULES.find(m => m.id === moduleId);
    return module?.icon || 'book';
  };

  const getModuleLabel = (moduleId: string): string => {
    const module = INITIAL_MODULES.find(m => m.id === moduleId);
    if (!module) return moduleId;
    const labels: Record<string, string> = {
      'subjects': 'Asignaturas',
      'calendar': 'Calendario',
      'focus': 'Enfoque',
      'diary': 'Diario',
      'balanza': 'Balanza',
      'nutrition': 'Nutriciรณn',
      'bazar': 'Bazar',
      'scientific-calculator': 'Calculadora',
      'exam-generator': 'Exรกmenes',
      'dashboard-stats': 'Dashboard',
    };
    return labels[moduleId] || module.name;
  };

  if (isMobile) {
    // Obtener mรณdulos mรณviles configurados o usar defaults
    const mobileModules = loadingConfig 
      ? supabaseService.getDefaultNavigationConfig().mobile_modules
      : (navigationConfig?.mobile_modules.length 
          ? navigationConfig.mobile_modules.sort((a, b) => a.order - b.order)
          : supabaseService.getDefaultNavigationConfig().mobile_modules);

    return (
      <nav className={`fixed bottom-0 left-0 right-0 h-28 border-t-2 flex items-center justify-between px-3 pb-safe z-[150] rounded-t-[2.5rem] transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[#151525] border-[#A68A56]/40 shadow-[0_-8px_25px_rgba(199,125,255,0.2)]' 
          : 'bg-[#FFF9FB] border-[#F8C8DC] shadow-[0_-8px_25px_rgba(74,35,62,0.15)]'
      } safe-area-inset-bottom`}>
        {/* Atanor fijo a la izquierda */}
        <div className="relative flex-shrink-0">
          <button 
            onClick={() => setActiveView(NavView.DASHBOARD)}
            className={`min-w-[72px] min-h-[72px] w-18 h-18 rounded-full border-4 border-white shadow-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 ${activeView === NavView.DASHBOARD ? 'bg-[#E35B8F] text-white scale-105' : 'bg-[#E35B8F] text-white'}`}
            aria-label="Atanor - Dashboard"
          >
            <div className="p-1">
              {getIcon('sparkles', "w-7 h-7")}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 leading-tight">ATANOR</span>
          </button>
        </div>

        {/* Mรณdulos configurables */}
        <div className="flex flex-1 justify-around items-center max-w-full ml-2">
          {mobileModules.map((navMod, index) => (
            <NavButton 
              key={navMod.moduleId}
              id={navMod.navView} 
              icon={getModuleIcon(navMod.moduleId)} 
              label={getModuleLabel(navMod.moduleId)} 
              locked={isLocked(navMod.moduleId)} 
              active={activeView === navMod.navView} 
              onClick={() => setActiveView(navMod.navView)}
              onLongPress={() => {
                if (user) {
                  setShowMobileModuleSelector({ index, moduleId: navMod.moduleId });
                }
              }}
              moduleId={navMod.moduleId}
            />
          ))}
        </div>

        {/* Modal para cambiar mรณdulo en mobile */}
        {showMobileModuleSelector !== null && user && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setShowMobileModuleSelector(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-cinzel text-lg font-bold text-[#2D1A26] mb-4 uppercase tracking-wider">
                Cambiar Mรณdulo
              </h3>
              <p className="font-garamond text-sm text-[#8B5E75] mb-4">
                Selecciona un mรณdulo para reemplazar "{getModuleLabel(showMobileModuleSelector.moduleId)}"
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {INITIAL_MODULES.filter(mod => {
                  // Excluir mรณdulos fijos y el mรณdulo actual
                  if (mod.id === 'profile' || mod.id === 'ai' || mod.id === 'security' || mod.id === 'social') return false;
                  if (mod.id === showMobileModuleSelector.moduleId) return false;
                  // Solo mostrar mรณdulos que no estรฉn ya en la navegaciรณn
                  const currentModuleIds = mobileModules.map(m => m.moduleId);
                  if (currentModuleIds.includes(mod.id)) return false;
                  return true;
                }).map(mod => {
                  const moduleToNavView: Record<string, NavView> = {
                    'subjects': NavView.SUBJECTS,
                    'calendar': NavView.CALENDAR,
                    'focus': NavView.FOCUS,
                    'diary': NavView.DIARY,
                    'balanza': NavView.BALANZA,
                    'nutrition': NavView.NUTRITION,
                    'bazar': NavView.BAZAR,
                    'scientific-calculator': NavView.CALCULATOR,
                    'exam-generator': NavView.EXAM_GENERATOR,
                    'dashboard-stats': NavView.DASHBOARD_STATS,
                  };
                  const navView = moduleToNavView[mod.id];
                  if (!navView) return null;
                  
                  return (
                    <button
                      key={mod.id}
                      onClick={async () => {
                        if (showMobileModuleSelector !== null) {
                          const updatedModules = [...mobileModules];
                          updatedModules[showMobileModuleSelector.index] = {
                            moduleId: mod.id,
                            order: showMobileModuleSelector.index,
                            navView,
                          };
                          
                          try {
                            await supabaseService.updateNavigationConfig(user.id, {
                              desktop_modules: navigationConfig?.desktop_modules || supabaseService.getDefaultNavigationConfig().desktop_modules,
                              mobile_modules: updatedModules,
                            });
                            // Recargar configuraciรณn
                            await loadConfig();
                            setShowMobileModuleSelector(null);
                          } catch (error) {
                            console.error('Error updating navigation:', error);
                            alert('Error al actualizar la navegaciรณn. Por favor, intenta desde el perfil.');
                          }
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#F8C8DC] hover:bg-[#F8C8DC]/40 transition-colors"
                    >
                      {getIcon(mod.icon, 'w-5 h-5 text-[#8B5E75]')}
                      <span className="font-garamond text-sm text-[#2D1A26]">{mod.name}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowMobileModuleSelector(null)}
                className="mt-4 w-full px-4 py-2 bg-[#F8C8DC] text-[#2D1A26] rounded-lg font-cinzel text-sm font-black uppercase tracking-wider hover:bg-[#E8B8CC] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Tablet/Desktop Sidebar
  // Obtener mรณdulos desktop configurados o usar defaults
  const desktopModules = loadingConfig 
    ? supabaseService.getDefaultNavigationConfig().desktop_modules
    : (navigationConfig?.desktop_modules.length 
        ? navigationConfig.desktop_modules.sort((a, b) => a.order - b.order)
        : supabaseService.getDefaultNavigationConfig().desktop_modules);
  
  const sidebarItems = desktopModules.map(navMod => ({
    id: navMod.navView,
    icon: getModuleIcon(navMod.moduleId),
    moduleId: navMod.moduleId,
    label: getModuleLabel(navMod.moduleId),
  }));

  // Si está colapsado y es desktop, ocultar completamente
  if (collapsed && !isMobile) {
    return null;
  }

  return (
    <aside className={`w-20 md:w-24 lg:w-64 h-full flex flex-col z-50 shadow-2xl border-r transition-all duration-500 backdrop-blur-[15px] ${
      isNightMode 
        ? 'border-[#A68A56]/40 bg-[rgba(26,26,46,0.95)] shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
        : 'glass-card border-[#F8C8DC]'
    }`}>
      {/* Header fijo */}
      <div className="p-4 lg:p-8 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div 
            className="flex flex-col items-center cursor-pointer flex-1"
            onClick={() => setActiveView(NavView.DASHBOARD)}
          >
            <h1 className={`font-cinzel text-2xl lg:text-3xl font-black tracking-[0.2em] transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>
              ST<span className="hidden lg:inline">UDI<span className="text-[#E35B8F]">A</span>NTA</span>
              <span className="lg:hidden text-[#E35B8F]">A</span>
            </h1>
            <div className={`h-0.5 w-8 lg:w-12 mt-1 transition-colors duration-500 ${
              isNightMode ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]'
            }`} />
          </div>
          {/* Botón para colapsar sidebar (solo desktop) */}
          {!isMobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`ml-2 p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isNightMode
                  ? 'text-[#7A748E] hover:text-[#A68A56] hover:bg-[rgba(48,43,79,0.6)]'
                  : 'text-[#8B5E75] hover:text-[#E35B8F] hover:bg-[#FFD1DC]/40'
              }`}
              aria-label="Ocultar navegación"
              title="Ocultar navegación"
            >
              {getIcon('chevron-left', 'w-5 h-5')}
            </button>
          )}
        </div>
      </div>

      {/* Secciรณn de mรณdulos scrolleable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <nav className="p-4 lg:p-8 pt-0 lg:pt-0 space-y-4 lg:space-y-2">
          {sidebarItems.map((item) => {
            const locked = isLocked(item.moduleId);
            return (
              <button
                key={item.id}
                disabled={locked}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-4 lg:py-3.5 rounded-2xl transition-all duration-300 relative ${
                  activeView === item.id 
                    ? isNightMode
                      ? 'bg-[#C77DFF] text-white shadow-lg shadow-[#C77DFF]/20'
                      : 'bg-[#E35B8F] text-white shadow-lg'
                    : locked 
                      ? 'text-[#7A748E]/30 grayscale cursor-not-allowed'
                      : isNightMode 
                        ? 'text-[#7A748E] hover:bg-[rgba(48,43,79,0.4)]' 
                        : 'text-[#8B5E75] hover:bg-[#FFD1DC]/40'
                }`}
                title={item.label}
              >
                {getIcon(item.icon, "w-6 h-6 lg:w-5 lg:h-5")}
                <span className="hidden lg:inline font-inter font-bold text-sm tracking-widest uppercase">{item.label}</span>
                {locked && !isMobile && <div className="absolute top-1 right-1 lg:static lg:ml-auto text-[#D4AF37]">{getIcon('lock', 'w-2.5 h-2.5 lg:w-3 lg:h-3')}</div>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secciรณn inferior siempre visible (Tema, Orรกculo, Perfil) */}
      <div className={`p-4 lg:p-6 border-t space-y-4 lg:space-y-4 transition-colors duration-500 flex-shrink-0 ${
        isNightMode ? 'bg-[#151525] border-[#A68A56]/30' : 'bg-[#FFF9FA]/50 border-[#F8C8DC]/30'
      }`}>
        {/* Toggle Diario/Nocturno */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-2 lg:px-3 rounded-xl transition-all duration-300 hover:scale-[1.05] ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#A68A56] border border-[#A68A56]/40'
                : 'bg-white/80 text-[#4A233E] border border-[#F8C8DC]'
            }`}
            aria-label={isNightMode ? 'Cambiar a modo diario' : 'Cambiar a modo nocturno'}
          >
            {isNightMode ? (
              <>
                {getIcon('moon', 'w-5 h-5 lg:w-4 lg:h-4')}
                <span className="hidden lg:inline font-cinzel text-[9px] font-bold uppercase tracking-wider">Nocturno</span>
              </>
            ) : (
              <>
                {getIcon('sun', 'w-5 h-5 lg:w-4 lg:h-4')}
                <span className="hidden lg:inline font-cinzel text-[9px] font-bold uppercase tracking-wider">Diario</span>
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={() => setActiveView(NavView.ORACLE)}
          className={`w-full flex items-center justify-center gap-3 py-3.5 px-2 lg:px-4 rounded-2xl shadow-lg hover:scale-[1.05] transition-all group ${
            activeView === NavView.ORACLE
              ? isNightMode
                ? 'bg-[#C77DFF] text-white shadow-[0_0_20px_rgba(199,125,255,0.3)]'
                : 'bg-[#E35B8F] text-white'
              : isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] text-[#A68A56] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]'
                : 'bg-[#2D1A26] text-[#D4AF37]'
          }`}
        >
          {getIcon('brain', 'w-6 h-6 lg:w-5 lg:h-5 transition-transform')}
          <span className="hidden lg:inline font-cinzel text-[10px] font-black uppercase tracking-[0.2em]">Orรกculo</span>
        </button>

        <button 
          onClick={() => setActiveView(NavView.PROFILE)}
          className={`w-full flex items-center justify-center lg:justify-start gap-3 p-2 lg:p-3 rounded-2xl transition-all group mb-2 ${
            activeView === NavView.PROFILE
              ? isNightMode
                ? 'bg-[#C77DFF] text-white shadow-lg shadow-[#C77DFF]/20'
                : 'bg-[#E35B8F] text-white shadow-lg'
              : isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 hover:border-[#C77DFF]/50 hover:bg-[rgba(48,43,79,0.8)]'
                : 'bg-white/60 border border-[#F8C8DC] hover:border-[#E35B8F]/30'
          }`}
        >
          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 shadow-md flex-shrink-0 overflow-hidden transition-colors duration-500 ${
            user && userProfile?.avatar_url 
              ? isNightMode ? 'border-[#A68A56]/40' : 'border-white'
              : user 
                ? isNightMode 
                  ? 'bg-gradient-to-br from-[#C77DFF] to-[#A68A56] border-[#A68A56]/40' 
                  : 'bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-white'
                : isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                  : 'bg-white/60 border-[#F8C8DC]'
          }`}>
            {user && userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : user ? (
              <div className="w-full h-full flex items-center justify-center">
                {getIcon('profile', 'w-5 h-5 text-white')}
              </div>
            ) : null}
          </div>
          <div className="hidden lg:block text-left overflow-hidden">
             <p className={`text-[10px] font-bold truncate transition-colors duration-500 ${
               activeView === NavView.PROFILE 
                 ? 'text-white' 
                 : isNightMode 
                   ? 'text-[#E0E1DD]' 
                   : 'text-[#2D1A26]'
             }`}>
               {user && userProfile?.full_name 
                 ? userProfile.full_name 
                 : user 
                   ? user.email?.split('@')[0] || 'Usuario'
                   : 'Iniciar Sesiรณn'}
             </p>
             <p className={`text-[8px] uppercase font-black tracking-widest transition-colors duration-500 ${
               activeView === NavView.PROFILE 
                 ? 'text-white/80' 
                 : isNightMode 
                   ? 'text-[#7A748E]' 
                   : 'text-[#8B5E75] opacity-60'
             }`}>
               {user ? 'Perfil' : 'Iniciar Sesiรณn'}
             </p>
          </div>
        </button>
      </div>
    </aside>
  );
};

interface NavButtonProps {
  id: NavView;
  icon: string;
  label: string;
  locked: boolean;
  active: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  moduleId?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ id, icon, label, locked, active, onClick, onLongPress, moduleId }) => {
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = React.useState(false);

  const handleTouchStart = () => {
    if (!onLongPress || locked) return;
    setIsLongPressing(false);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (onLongPress) {
        onLongPress();
      }
    }, 500); // 500ms para long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPressing) {
      onClick();
    }
    setIsLongPressing(false);
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  return (
    <button
      disabled={locked}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={() => {
        if (!onLongPress || locked) return;
        longPressTimer.current = setTimeout(() => {
          if (onLongPress) {
            onLongPress();
          }
        }, 500);
      }}
      onMouseUp={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
      onClick={(e) => {
        if (!isLongPressing) {
          onClick();
        }
      }}
      className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative min-w-[56px] min-h-[56px] touch-manipulation ${
        active ? 'text-[#E35B8F] scale-105' : locked ? 'text-[#8B5E75]/30 grayscale' : 'text-[#8B5E75] active:scale-95'
      }`}
      aria-label={label}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#E35B8F]/15' : ''}`}>
        {getIcon(icon, "w-7 h-7")}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap font-inter leading-tight ${active ? 'opacity-100 font-bold' : 'opacity-75'}`}>
        {label}
      </span>
      {locked && <div className="absolute -top-1 -right-1 text-[#D4AF37] bg-white rounded-full p-0.5">{getIcon('lock', 'w-3 h-3')}</div>}
    </button>
  );
};

export default Navigation;
