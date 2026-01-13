import React, { useState, useEffect, useRef } from 'react';
import { supabaseService, UserProfile } from '../services/supabaseService';
import { getIcon, INITIAL_MODULES } from '../constants';
import AuthModule from './AuthModule';
import { supabase } from '../services/supabaseService';
import { useInteractionAggregator } from '../hooks/useInteractionAggregator';
import { Subject, Transaction, JournalEntry, CustomCalendarEvent, Module, NavView, BalanzaProTransaction, NavigationConfig, NavigationModule } from '../types';

interface ProfileModuleProps {
  user: any;
  onAuthSuccess: () => void;
  onSignOut: () => void;
  isMobile: boolean;
  subjects?: Subject[];
  transactions?: Transaction[];
  journalEntries?: JournalEntry[];
  customEvents?: CustomCalendarEvent[];
  modules?: Module[];
  monthlyBudget?: number;
  setActiveView?: (view: any) => void;
  isNightMode?: boolean;
}


const ProfileModule: React.FC<ProfileModuleProps> = ({ 
  user, 
  onAuthSuccess, 
  onSignOut, 
  isMobile,
  subjects = [],
  transactions = [],
  journalEntries = [],
  customEvents = [],
  modules = [],
  monthlyBudget = 0,
  setActiveView,
  isNightMode = false
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [career, setCareer] = useState('');
  const [institution, setInstitution] = useState('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [showFocusAnnotations, setShowFocusAnnotations] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [balanzaProTransactions, setBalanzaProTransactions] = useState<BalanzaProTransaction[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig | null>(null);
  const [editingNavigation, setEditingNavigation] = useState(false);
  const [desktopNavModules, setDesktopNavModules] = useState<NavigationModule[]>([]);
  const [mobileNavModules, setMobileNavModules] = useState<NavigationModule[]>([]);
  const [showMobileModuleSelector, setShowMobileModuleSelector] = useState<number | null>(null);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [navigationViewMode, setNavigationViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [draggedModuleIndex, setDraggedModuleIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Cargar transacciones de Balanza Pro si el módulo está activo
  useEffect(() => {
    const loadBalanzaProTransactions = async () => {
      const balanzaModule = modules.find(m => m.id === 'balanza');
      if (user && balanzaModule?.active) {
        try {
          const data = await supabaseService.getBalanzaProTransactions(user.id);
          setBalanzaProTransactions(data);
        } catch (error) {
          console.error('Error loading balanza pro transactions:', error);
          setBalanzaProTransactions([]);
        }
      } else {
        setBalanzaProTransactions([]);
      }
    };

    loadBalanzaProTransactions();
  }, [user, modules]);

  // Generar el SPC completo
  const spc = useInteractionAggregator({
    userProfile: profile,
    subjects,
    transactions,
    journalEntries,
    customEvents,
    modules,
    monthlyBudget,
    balanzaProTransactions,
  });

  // Función para descargar el SPC
  const handleDownloadSPC = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `student_profile_context_${dateStr}.json`;
    
    const jsonStr = JSON.stringify(spc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (user) {
      loadProfile();
      loadNavigationConfig();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadNavigationConfig = async () => {
    if (!user) return;
    try {
      const config = await supabaseService.getNavigationConfig(user.id);
      if (config) {
        setNavigationConfig(config);
        setDesktopNavModules(config.desktop_modules);
        setMobileNavModules(config.mobile_modules);
      } else {
        // Usar configuración por defecto
        const defaultConfig = supabaseService.getDefaultNavigationConfig();
        setDesktopNavModules(defaultConfig.desktop_modules);
        setMobileNavModules(defaultConfig.mobile_modules);
      }
    } catch (error) {
      console.error('Error loading navigation config:', error);
      // Usar configuración por defecto en caso de error
      const defaultConfig = supabaseService.getDefaultNavigationConfig();
      setDesktopNavModules(defaultConfig.desktop_modules);
      setMobileNavModules(defaultConfig.mobile_modules);
    }
  };

  const handleSaveNavigationConfig = async () => {
    if (!user) return;
    try {
      const config = await supabaseService.updateNavigationConfig(user.id, {
        desktop_modules: desktopNavModules,
        mobile_modules: mobileNavModules,
      });
      setNavigationConfig(config);
      setEditingNavigation(false);
    } catch (error) {
      console.error('Error saving navigation config:', error);
      alert('Error al guardar la configuración de navegación. Por favor, intenta nuevamente.');
    }
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down', isMobile: boolean) => {
    const currentModules = isMobile ? [...mobileNavModules] : [...desktopNavModules];
    if (direction === 'up' && index > 0) {
      [currentModules[index - 1], currentModules[index]] = [currentModules[index], currentModules[index - 1]];
      currentModules[index - 1].order = index - 1;
      currentModules[index].order = index;
    } else if (direction === 'down' && index < currentModules.length - 1) {
      [currentModules[index], currentModules[index + 1]] = [currentModules[index + 1], currentModules[index]];
      currentModules[index].order = index;
      currentModules[index + 1].order = index + 1;
    }
    if (isMobile) {
      setMobileNavModules(currentModules);
    } else {
      setDesktopNavModules(currentModules);
    }
  };

  const handleRemoveModule = (index: number, isMobile: boolean) => {
    const currentModules = isMobile ? [...mobileNavModules] : [...desktopNavModules];
    currentModules.splice(index, 1);
    // Reordenar
    currentModules.forEach((mod, idx) => {
      mod.order = idx;
    });
    if (isMobile) {
      setMobileNavModules(currentModules);
    } else {
      setDesktopNavModules(currentModules);
    }
  };

  const handleAddModule = (moduleId: string, isMobile: boolean) => {
    const currentModules = isMobile ? [...mobileNavModules] : [...desktopNavModules];
    const module = INITIAL_MODULES.find(m => m.id === moduleId);
    if (!module) return;

    // Mapear moduleId a NavView
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
    };

    const navView = moduleToNavView[moduleId];
    if (!navView) return;

    const maxModules = isMobile ? 5 : 9;
    if (currentModules.length >= maxModules) {
      alert(`Máximo ${maxModules} módulos permitidos`);
      return;
    }

    // Verificar que no esté ya agregado
    if (currentModules.find(m => m.moduleId === moduleId)) {
      alert('Este módulo ya está en la navegación');
      return;
    }

    const newModule: NavigationModule = {
      moduleId,
      order: currentModules.length,
      navView,
    };

    if (isMobile) {
      setMobileNavModules([...currentModules, newModule]);
    } else {
      setDesktopNavModules([...currentModules, newModule]);
    }
    setShowMobileModuleSelector(null);
  };

  const getAvailableModules = (isMobile: boolean) => {
    const currentModules = isMobile ? mobileNavModules : desktopNavModules;
    const usedModuleIds = currentModules.map(m => m.moduleId);
    return INITIAL_MODULES.filter(m => {
      // Excluir módulos fijos
      if (m.id === 'profile' || m.id === 'ai' || m.id === 'security' || m.id === 'social') return false;
      // Excluir módulos ya agregados
      if (usedModuleIds.includes(m.id)) return false;
      return true;
    });
  };

  // Handle Stripe checkout session_id redirect
  useEffect(() => {
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      const handleCheckoutSession = async () => {
        try {
          console.log('Verifying checkout session:', sessionId);
          const result = await supabaseService.verifyCheckoutSession(sessionId);
          
          if (result.completed) {
            console.log('Checkout session completed, reloading profile...');
            // Reload profile to get updated tier
            await loadProfile();
            
            // Redirect to payment success page
            if (setActiveView) {
              setActiveView(NavView.PAYMENT_SUCCESS);
            } else {
              // Fallback if setActiveView is not available
              alert('¡Pago exitoso! Tu suscripción Premium ha sido activada.');
            }
          } else {
            console.log('Checkout session not completed yet:', result);
          }
        } catch (error: any) {
          console.error('Error verifying checkout session:', error);
          alert('Error al verificar el pago. Por favor, verifica tu estado de suscripción.');
        } finally {
          // Remove session_id from URL
          urlParams.delete('session_id');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }
      };

      handleCheckoutSession();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await supabaseService.getProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setFullName(userProfile.full_name || '');
        setCareer(userProfile.career || '');
        setInstitution(userProfile.institution || '');
        setCurrency(userProfile.currency || 'EUR');
        setShowFocusAnnotations(userProfile.show_focus_annotations ?? false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const avatarUrl = await supabaseService.uploadAvatar(user.id, file);
      await supabaseService.updateProfile(user.id, { avatar_url: avatarUrl });
      await loadProfile();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto. Por favor, intenta nuevamente.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await supabaseService.updateProfile(user.id, {
        full_name: fullName,
        career: career,
        institution: institution,
        currency: currency,
        show_focus_annotations: showFocusAnnotations,
      });
      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setSubscriptionLoading(true);
    try {
      const { url } = await supabaseService.createCheckoutSession(user.id);
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert('Error al crear la sesión de pago. Por favor, intenta nuevamente.');
      setSubscriptionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setSubscriptionLoading(true);
    try {
      const { url } = await supabaseService.createPortalSession(user.id);
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      alert('Error al abrir el portal de gestión. Por favor, intenta nuevamente.');
      setSubscriptionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-2 backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card border-[#D4AF37]/30'
          }`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-4 shadow-lg transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-gradient-to-br from-[#C77DFF] to-[#A68A56] border-[rgba(48,43,79,0.8)]' 
                  : 'bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-white'
              }`}>
                {getIcon('profile', 'w-8 h-8 text-white')}
              </div>
              <h1 className={`font-cinzel text-4xl md:text-5xl font-bold mb-2 uppercase tracking-widest transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Iniciar Sesión
              </h1>
            </div>
            <AuthModule onAuthSuccess={onAuthSuccess} isNightMode={isNightMode} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E35B8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cinzel text-[#2D1A26] text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  // Datos del perfil
  const avatarUrl = profile?.avatar_url || null;
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Estudiante';
  const displayEmail = profile?.email || user.email || '';
  const displayCareer = profile?.career || 'No especificada';
  const displayInstitution = profile?.institution || 'No especificada';
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const joinDate = createdAt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Si es móvil, mantener diseño vertical simplificado
  if (isMobile) {
    return (
      <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md glass-card rounded-[2rem] p-6 shadow-2xl border-2 border-[#D4AF37]/30">
          <div className="text-center mb-6">
            <div 
              className="relative w-24 h-24 mx-auto mb-4 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] flex items-center justify-center">
                  {getIcon('profile', 'w-12 h-12 text-white')}
                </div>
              )}
              <div className="absolute -inset-2 rounded-full border-2 border-[#D4AF37] opacity-50"></div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <h2 className="font-marcellus text-3xl font-bold text-[#2D1A26] mb-1">{displayName}</h2>
            <p className="font-garamond text-[#8B5E75] text-base italic mb-4">{displayEmail}</p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[8px] uppercase font-bold text-[#8B5E75] mb-1 font-inter tracking-[0.2em]">Carrera</p>
              <p className="font-garamond text-[#2D1A26]">{displayCareer}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-bold text-[#8B5E75] mb-1 font-inter tracking-[0.2em]">Institución</p>
              <p className="font-garamond text-[#2D1A26]">{displayInstitution}</p>
            </div>
          </div>
          
          {/* Suscripción Premium - Mobile */}
          <div className="mt-4 bg-gradient-to-r from-[#D4AF37]/20 to-[#E35B8F]/20 rounded-xl p-4 border-2 border-[#D4AF37]/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getIcon('crown', 'w-5 h-5 text-[#D4AF37]')}
                <h3 className="font-cinzel text-base font-bold text-[#2D1A26] uppercase tracking-wider">
                  Plan {profile?.tier === 'Premium' ? 'Premium' : 'Gratuito'}
                </h3>
              </div>
              {profile?.tier === 'Premium' && (
                <span className="px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#E35B8F] text-white rounded-full font-cinzel text-xs font-bold uppercase tracking-wider">
                  Premium
                </span>
              )}
            </div>
            
            {profile?.tier === 'Free' ? (
              <div>
                <p className="font-garamond text-sm text-[#2D1A26] mb-3">
                  Actualiza a Premium por <strong className="font-bold">14,99€/mes</strong>
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={subscriptionLoading}
                  className="w-full btn-primary py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscriptionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      {getIcon('crown', 'w-4 h-4')}
                      Actualizar a Premium
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                {profile?.subscription_status === 'active' && profile?.subscription_current_period_end && (
                  <p className="font-garamond text-xs text-[#8B5E75] mb-3">
                    Renovación: {new Date(profile.subscription_current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                )}
                <button
                  onClick={handleManageSubscription}
                  disabled={subscriptionLoading}
                  className="w-full bg-[#D4AF37]/80 border-2 border-[#D4AF37] text-[#2D1A26] py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscriptionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#2D1A26] border-t-transparent rounded-full animate-spin"></div>
                      Cargando...
                    </>
                  ) : (
                    <>
                      {getIcon('settings', 'w-4 h-4')}
                      Gestionar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 btn-primary py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest"
            >
              Editar
            </button>
            <button
              onClick={handleDownloadSPC}
              className={`flex-1 border-2 py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[#A68A56]/80 border-[#A68A56] text-[#E0E1DD]' 
                  : 'bg-[#D4AF37]/80 border-[#D4AF37] text-[#2D1A26]'
              }`}
            >
              {getIcon('download', 'w-3 h-3')}
              Descargar SPC
            </button>
            <button
              onClick={onSignOut}
              className="flex-1 bg-red-100/60 border-2 border-red-300 text-red-700 py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Funciones para drag and drop
  const handleDragStart = (index: number) => {
    setDraggedModuleIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedModuleIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (targetIndex: number, isMobile: boolean) => {
    if (draggedModuleIndex === null || draggedModuleIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    const currentModules = isMobile ? [...mobileNavModules] : [...desktopNavModules];
    // Ordenar por order primero
    const sortedModules = [...currentModules].sort((a, b) => a.order - b.order);
    
    // Obtener el módulo arrastrado usando el índice original
    const draggedModule = sortedModules[draggedModuleIndex];
    if (!draggedModule) {
      setDragOverIndex(null);
      return;
    }
    
    // Remover del índice original
    sortedModules.splice(draggedModuleIndex, 1);
    // Insertar en el nuevo índice
    sortedModules.splice(targetIndex, 0, draggedModule);
    
    // Reordenar
    sortedModules.forEach((mod, idx) => {
      mod.order = idx;
    });

    if (isMobile) {
      setMobileNavModules(sortedModules);
    } else {
      setDesktopNavModules(sortedModules);
    }
    
    setDraggedModuleIndex(null);
    setDragOverIndex(null);
  };

  // Diseño horizontal tipo credencial para desktop/tablet
  return (
    <>
      <div className="h-full flex items-center justify-center p-2 md:p-4 overflow-hidden">
      {/* Contenedor principal - El Tríptico de Identidad */}
      <div 
        className="w-full max-w-6xl glass-card rounded-xl md:rounded-2xl p-3 md:p-4 shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(255,245,250,0.95) 0%, rgba(253,238,244,0.95) 100%)',
          border: '0.5px solid rgba(212, 175, 55, 0.3)',
          maxHeight: 'calc(100vh - 1rem)',
        }}
      >
        {/* Refuerzos metálicos en las esquinas */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] opacity-60"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] opacity-60"></div>

        {/* Marca de agua STUDIANTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
          <div className="font-cinzel text-[20rem] font-black text-[#2D1A26] transform -rotate-12">
            STUDIANTA
          </div>
        </div>

        {/* Contenido principal - 3 columnas */}
        <div className="relative z-10 grid grid-cols-12 gap-3 md:gap-4">
          
          {/* A. Columna Izquierda: El Rostro del Saber (1:2:1 = 3 columnas) */}
          <div className="col-span-12 md:col-span-3 flex flex-col items-center">
            {/* Avatar Circular Maestro con borde doble */}
            <div 
              className="relative mb-4 cursor-pointer group"
              onMouseEnter={() => setHoveringAvatar(true)}
              onMouseLeave={() => setHoveringAvatar(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Borde exterior dorado con aura */}
              <div className="absolute -inset-2 rounded-full border-2 border-[#D4AF37] opacity-60 blur-sm"></div>
              {/* Borde interior */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden bg-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] flex items-center justify-center">
                    {getIcon('profile', 'w-12 h-12 md:w-16 md:h-16 text-white')}
                  </div>
                )}
                {/* Overlay al hover */}
                <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
                  hoveringAvatar ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="bg-[#D4AF37] rounded-full p-2 shadow-xl">
                    {getIcon('camera', 'w-5 h-5 text-white')}
                  </div>
                </div>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Identidad Primaria */}
            <div className="text-center w-full">
              <h2 className="font-marcellus text-2xl md:text-3xl font-bold text-[#2D1A26] mb-2">
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border-2 border-[#F8C8DC] rounded-xl px-3 py-2 text-lg md:text-2xl font-marcellus font-bold text-[#2D1A26] focus:outline-none focus:border-[#E35B8F] text-center shadow-sm"
                  />
                ) : (
                  displayName
                )}
              </h2>
              <p className="font-garamond text-[#8B5E75] text-sm md:text-base italic mb-4 font-medium">
                {displayEmail}
              </p>
            </div>

            {/* Bloque Premium - Movido aquí debajo del correo */}
            {!editing && (
              <div className="w-full bg-gradient-to-r from-[#D4AF37]/30 to-[#E35B8F]/30 rounded-lg p-3 border-2 border-[#D4AF37]/60 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getIcon('crown', 'w-4 h-4 text-[#D4AF37]')}
                  <h3 className="font-cinzel text-sm font-bold text-[#2D1A26] uppercase tracking-wider">
                    Plan {profile?.tier === 'Premium' ? 'Premium' : 'Gratuito'}
                  </h3>
                </div>
                
                {profile?.tier === 'Free' ? (
                  <div>
                    <p className="font-garamond text-xs text-[#2D1A26] mb-2 text-center">
                      <strong className="font-bold">14,99€/mes</strong>
                    </p>
                    <button
                      onClick={handleSubscribe}
                      disabled={subscriptionLoading}
                      className="w-full btn-primary py-2 rounded-lg font-cinzel text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subscriptionLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px]">Procesando...</span>
                        </>
                      ) : (
                        <>
                          {getIcon('crown', 'w-3 h-3')}
                          <span className="text-[10px]">Premium</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    {profile?.subscription_status === 'active' && profile?.subscription_current_period_end && (
                      <p className="font-garamond text-[10px] text-[#8B5E75] mb-2 text-center">
                        Renovación: {new Date(profile.subscription_current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    <button
                      onClick={handleManageSubscription}
                      disabled={subscriptionLoading}
                      className="w-full bg-[#D4AF37]/80 border-2 border-[#D4AF37] text-[#2D1A26] py-2 rounded-lg font-cinzel text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subscriptionLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-[#2D1A26] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px]">Cargando...</span>
                        </>
                      ) : (
                        <>
                          {getIcon('settings', 'w-3 h-3')}
                          <span className="text-[10px]">Gestionar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* B. Columna Central: El Registro Académico */}
          <div className="col-span-12 md:col-span-9 flex flex-col justify-center space-y-3 md:space-y-4">
            {/* Díptico Informativo - Dos bloques horizontales paralelos */}
            
            {/* Bloque 1: Carrera + Institución */}
            <div className="grid grid-cols-2 gap-3">
              {/* Carrera */}
              <div className="bg-white/90 rounded-lg p-3 border-2 border-[#F8C8DC] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('book', 'w-4 h-4 text-[#E35B8F]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    CARRERA
                  </label>
                </div>
                {editing ? (
                  <input
                    type="text"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="w-full bg-white border-2 border-[#F8C8DC] rounded-lg px-2 py-1.5 text-sm font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                    placeholder="Tu carrera..."
                  />
                ) : (
                  <p className="font-garamond text-base md:text-lg text-[#2D1A26] font-medium">{displayCareer}</p>
                )}
              </div>

              {/* Institución */}
              <div className="bg-white/90 rounded-lg p-3 border-2 border-[#F8C8DC] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('university', 'w-4 h-4 text-[#E35B8F]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    INSTITUCIÓN
                  </label>
                </div>
                {editing ? (
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-white border-2 border-[#F8C8DC] rounded-lg px-2 py-1.5 text-sm font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                    placeholder="Tu universidad..."
                  />
                ) : (
                  <p className="font-garamond text-base md:text-lg text-[#2D1A26] font-medium">{displayInstitution}</p>
                )}
              </div>
            </div>

            {/* Bloque 2: Fecha de Ingreso + Moneda */}
            <div className="grid grid-cols-2 gap-3">
              {/* Fecha de Ingreso */}
              <div className="bg-white/90 rounded-lg p-3 border-2 border-[#F8C8DC] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('calendar', 'w-4 h-4 text-[#E35B8F]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    INGRESO
                  </label>
                </div>
                <p className="font-garamond text-base md:text-lg text-[#2D1A26] capitalize font-medium">{joinDate}</p>
              </div>

              {/* Moneda */}
              <div className="bg-white/90 rounded-lg p-3 border-2 border-[#F8C8DC] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('crystal', 'w-4 h-4 text-[#E35B8F]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    MONEDA
                  </label>
                </div>
                {editing ? (
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border-2 border-[#F8C8DC] rounded-lg px-2 py-1.5 text-sm font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="ARS">Peso Argentino ($)</option>
                    <option value="GBP">Libra Esterlina (£)</option>
                    <option value="MXN">Peso Mexicano ($)</option>
                    <option value="CLP">Peso Chileno ($)</option>
                    <option value="COP">Peso Colombiano ($)</option>
                    <option value="BRL">Real Brasileño (R$)</option>
                    <option value="PEN">Sol Peruano (S/)</option>
                  </select>
                ) : (
                  <p className="font-garamond text-base md:text-lg text-[#2D1A26] font-medium">
                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'BRL' ? 'R$' : currency === 'PEN' ? 'S/' : '$'} {currency}
                  </p>
                )}
              </div>
            </div>

            {/* Bloque 3: Configuración de Calendario */}
            <div className="bg-white/90 rounded-lg p-3 border-2 border-[#F8C8DC] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                {getIcon('calendar', 'w-4 h-4 text-[#E35B8F]')}
                <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                  CONFIGURACIÓN DE CALENDARIO
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-garamond text-sm text-[#2D1A26] mb-1 font-medium">
                    Mostrar anotaciones de enfoque
                  </p>
                  <p className="font-garamond text-xs text-[#8B5E75]">
                    Mostrar sesiones de enfoque en el calendario
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFocusAnnotations}
                    onChange={(e) => setShowFocusAnnotations(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-10 h-5 rounded-full peer transition-colors duration-200 ${
                    showFocusAnnotations 
                      ? 'bg-[#E35B8F]' 
                      : 'bg-gray-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      showFocusAnnotations ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Bloque 4: Personalizar Navegación */}
            {!editing && (
              <div className="bg-white/90 rounded-lg p-3 border-2 border-[#F8C8DC] shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon('settings', 'w-4 h-4 text-[#E35B8F]')}
                    <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                      PERSONALIZAR NAVEGACIÓN
                    </label>
                  </div>
                  <button
                    onClick={() => setShowNavigationModal(true)}
                    className="px-3 py-1.5 bg-[#E35B8F] text-white rounded-lg font-cinzel text-xs font-black uppercase tracking-wider hover:bg-[#D14A7D] transition-colors"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Botones de Acción - En la parte inferior de la card */}
        <div className="relative z-10 mt-6 pt-5 border-t-2 border-[#F8C8DC]/60">
          {editing ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                className="flex-1 btn-primary py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  loadProfile();
                }}
                className="flex-1 bg-white/80 border-2 border-[#F8C8DC] text-[#8B5E75] py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest hover:bg-white hover:border-[#E35B8F]/40 transition-all shadow-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 btn-primary py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {getIcon('edit', 'w-4 h-4')}
                Editar
              </button>
              <button
                onClick={handleDownloadSPC}
                className="flex-1 bg-[#D4AF37]/90 border-2 border-[#D4AF37] text-[#2D1A26] py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {getIcon('download', 'w-4 h-4')}
                SPC
              </button>
              <button
                onClick={onSignOut}
                className="flex-1 bg-red-100/70 border-2 border-red-300 text-red-700 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest hover:bg-red-200/70 hover:border-red-400 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {getIcon('logout', 'w-4 h-4')}
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      
      {/* Modal de Personalización de Navegación */}
      {showNavigationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={() => setShowNavigationModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-2xl font-bold text-[#2D1A26] uppercase tracking-wider">
                Personalizar Navegación
              </h2>
              <button
                onClick={() => setShowNavigationModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {getIcon('x', 'w-6 h-6 text-[#8B5E75]')}
              </button>
            </div>

            {/* Toggle Web/Mobile */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setNavigationViewMode('desktop')}
                className={`px-4 py-2 rounded-lg font-cinzel text-sm font-black uppercase tracking-wider transition-colors ${
                  navigationViewMode === 'desktop'
                    ? 'bg-[#E35B8F] text-white'
                    : 'bg-gray-100 text-[#8B5E75] hover:bg-gray-200'
                }`}
              >
                Web
              </button>
              <button
                onClick={() => setNavigationViewMode('mobile')}
                className={`px-4 py-2 rounded-lg font-cinzel text-sm font-black uppercase tracking-wider transition-colors ${
                  navigationViewMode === 'mobile'
                    ? 'bg-[#E35B8F] text-white'
                    : 'bg-gray-100 text-[#8B5E75] hover:bg-gray-200'
                }`}
              >
                Mobile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-6">
              {/* Panel izquierdo: Editor con Drag and Drop */}
              <div className="flex flex-col">
                <h3 className="font-cinzel text-lg font-bold text-[#2D1A26] mb-4 uppercase tracking-wider">
                  {navigationViewMode === 'desktop' ? 'Desktop (Máx. 9 módulos)' : 'Mobile (Máx. 5 módulos + Atanor)'}
                </h3>
                
                {/* Lista de módulos con drag and drop */}
                <div className="space-y-2 flex-1">
                  {(navigationViewMode === 'desktop' ? desktopNavModules : mobileNavModules)
                    .sort((a, b) => a.order - b.order)
                    .map((navMod, index) => {
                      const module = INITIAL_MODULES.find(m => m.id === navMod.moduleId);
                      const isActive = modules.find(m => m.id === navMod.moduleId)?.active ?? false;
                      return (
                        <div
                          key={`${navigationViewMode}-${index}`}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(index, navigationViewMode === 'mobile');
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-move transition-all ${
                            draggedModuleIndex === index ? 'opacity-50' : ''
                          } ${
                            dragOverIndex === index ? 'border-[#E35B8F] bg-[#E35B8F]/10' : ''
                          } ${
                            isActive ? 'bg-white border-[#F8C8DC]' : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          <div className="text-[#8B5E75]">☰</div>
                          {getIcon(module?.icon || 'book', 'w-5 h-5 text-[#E35B8F]')}
                          <span className="flex-1 font-garamond text-sm text-[#2D1A26] font-medium">
                            {module?.name || navMod.moduleId}
                          </span>
                          {!isActive && (
                            <span className="text-xs text-gray-600 font-medium px-2 py-1 bg-gray-200 rounded">Bloqueado</span>
                          )}
                          <button
                            onClick={() => handleRemoveModule(index, navigationViewMode === 'mobile')}
                            className="p-1 rounded hover:bg-red-100 text-red-600 font-bold transition-colors"
                            title="Quitar"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Selector para agregar módulos */}
                {(navigationViewMode === 'desktop' ? desktopNavModules.length < 9 : mobileNavModules.length < 5) && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddModule(e.target.value, navigationViewMode === 'mobile');
                        e.target.value = '';
                      }
                    }}
                    className="mt-4 w-full bg-white border-2 border-[#F8C8DC] rounded-lg px-3 py-2 text-sm font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                  >
                    <option value="">+ Agregar módulo...</option>
                    {getAvailableModules(navigationViewMode === 'mobile').map(mod => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Panel derecho: Vista Previa en Vivo */}
              <div className="flex flex-col">
                <h3 className="font-cinzel text-lg font-bold text-[#2D1A26] mb-4 uppercase tracking-wider">
                  Vista Previa en Vivo
                </h3>
                <div className="flex-1 bg-gray-50 rounded-lg p-4 border-2 border-[#F8C8DC] overflow-y-auto">
                  {navigationViewMode === 'desktop' ? (
                    <div className="bg-white rounded-lg p-3 shadow-sm min-h-[400px]">
                      {/* Simulación de sidebar desktop */}
                      <div className="w-16 border-r border-[#F8C8DC] pr-3">
                        <div className="mb-6 pb-3 border-b border-[#F8C8DC]">
                          <h4 className="font-cinzel text-xs font-bold text-[#2D1A26] uppercase">STUDIANTA</h4>
                        </div>
                        <div className="space-y-1">
                          {desktopNavModules
                            .sort((a, b) => a.order - b.order)
                            .map((navMod) => {
                              const module = INITIAL_MODULES.find(m => m.id === navMod.moduleId);
                              const isActive = modules.find(m => m.id === navMod.moduleId)?.active ?? false;
                              return (
                                <div
                                  key={`preview-desktop-${navMod.moduleId}`}
                                  className={`flex items-center justify-center p-2 rounded-lg ${
                                    isActive ? 'bg-[#F8C8DC]/40' : 'bg-gray-100 opacity-50'
                                  }`}
                                >
                                  {getIcon(module?.icon || 'book', 'w-4 h-4 text-[#E35B8F]')}
                                </div>
                              );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#F8C8DC] space-y-1">
                          <div className="flex items-center justify-center p-2 rounded-lg bg-[#2D1A26] text-[#D4AF37]">
                            {getIcon('brain', 'w-4 h-4')}
                          </div>
                          <div className="flex items-center justify-center p-2 rounded-lg bg-white border border-[#F8C8DC]">
                            {getIcon('profile', 'w-4 h-4 text-[#8B5E75]')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FFF9FB] rounded-lg p-3 border-2 border-[#F8C8DC] min-h-[120px]">
                      {/* Simulación de barra móvil */}
                      <div className="flex items-center gap-2">
                        {/* Atanor fijo a la izquierda */}
                        <button className="w-14 h-14 rounded-full bg-[#E35B8F] text-white flex flex-col items-center justify-center shadow-lg flex-shrink-0">
                          <div className="p-1">
                            {getIcon('sparkles', 'w-5 h-5')}
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-[0.1em] leading-tight">ATANOR</span>
                        </button>
                        {/* Módulos configurables */}
                        <div className="flex gap-2 flex-1 justify-around">
                          {mobileNavModules
                            .sort((a, b) => a.order - b.order)
                            .slice(0, 5)
                            .map((navMod) => {
                              const module = INITIAL_MODULES.find(m => m.id === navMod.moduleId);
                              const isActive = modules.find(m => m.id === navMod.moduleId)?.active ?? false;
                              return (
                                <div
                                  key={`preview-mobile-${navMod.moduleId}`}
                                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg ${
                                    isActive ? 'bg-white' : 'bg-gray-100 opacity-50'
                                  } border border-[#F8C8DC] min-w-[48px]`}
                                >
                                  {getIcon(module?.icon || 'book', 'w-5 h-5 text-[#8B5E75]')}
                                  <span className="text-[7px] font-black uppercase text-[#8B5E75] text-center leading-tight">
                                    {module?.name?.substring(0, 6) || navMod.moduleId.substring(0, 6)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[#F8C8DC]">
              <button
                onClick={async () => {
                  await handleSaveNavigationConfig();
                  setShowNavigationModal(false);
                }}
                className="flex-1 px-4 py-3 bg-[#E35B8F] text-white rounded-lg font-cinzel text-sm font-black uppercase tracking-wider hover:bg-[#D14A7D] transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setShowNavigationModal(false);
                  loadNavigationConfig();
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-[#8B5E75] rounded-lg font-cinzel text-sm font-black uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileModule;
