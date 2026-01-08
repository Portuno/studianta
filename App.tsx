import React, { useState, useEffect, useRef } from 'react';
import { NavView, Subject, Module, Transaction, JournalEntry, CustomCalendarEvent } from './types';
import { INITIAL_MODULES, getIcon } from './constants';
import { supabaseService, supabase, UserProfile } from './services/supabaseService';
import { googleCalendarService } from './services/googleCalendarService';
import { Analytics } from '@vercel/analytics/react';
import { useInteractionAggregator } from './hooks/useInteractionAggregator';
import Navigation from './components/Navigation';
import MobileTopBar from './components/MobileTopBar';
import Dashboard from './components/Dashboard';
import SubjectsModule from './components/SubjectsModule';
import CalendarModule from './components/CalendarModule';
import FinanceModule from './components/FinanceModule';
import FocusModule from './components/FocusModule';
import DiaryModule from './components/DiaryModule';
import AuthModule from './components/AuthModule';
import ProfileModule from './components/ProfileModule';
import BazarArtefactos from './components/BazarArtefactos';
import FocusFloatingWidget from './components/FocusFloatingWidget';
import OraculoPage from './components/OraculoPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import DocsPage from './components/DocsPage';
import Footer from './components/Footer';
import OnboardingModal from './components/OnboardingModal';
import EssenceNotification from './components/EssenceNotification';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true); // Solo para la carga inicial
  
  // Detectar página desde URL para acceso directo a políticas
  const getInitialView = (): NavView => {
    const pathname = window.location.pathname;
    if (pathname === '/privacidad' || pathname === '/privacidad/') return NavView.PRIVACY_POLICY;
    if (pathname === '/terminosycondiciones' || pathname === '/terminosycondiciones/') return NavView.TERMS_OF_SERVICE;
    if (pathname === '/docs' || pathname === '/docs/') return NavView.DOCS;
    // Mantener compatibilidad con query params antiguos
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page === 'privacy-policy') return NavView.PRIVACY_POLICY;
    if (page === 'terms-of-service') return NavView.TERMS_OF_SERVICE;
    if (page === 'docs') return NavView.DOCS;
    return NavView.DASHBOARD;
  };
  
  const [activeView, setActiveView] = useState<NavView>(getInitialView());

  // Función para actualizar la URL cuando se cambia de vista
  const handleViewChange = (view: NavView) => {
    setActiveView(view);
    
    // Actualizar la URL según la vista
    if (view === NavView.PRIVACY_POLICY) {
      window.history.pushState({ view: 'privacy' }, '', '/privacidad');
    } else if (view === NavView.TERMS_OF_SERVICE) {
      window.history.pushState({ view: 'terms' }, '', '/terminosycondiciones');
    } else if (view === NavView.DOCS) {
      window.history.pushState({ view: 'docs' }, '', '/docs');
    } else if (view === NavView.DASHBOARD) {
      // Si vuelve al dashboard desde una página de política/docs, limpiar la URL
      if (window.location.pathname === '/privacidad' || window.location.pathname === '/terminosycondiciones' || window.location.pathname === '/docs') {
        window.history.pushState({ view: 'dashboard' }, '', '/');
      }
    }
  };

  // Escuchar cambios en el historial del navegador (botones atrás/adelante)
  useEffect(() => {
    const handlePopState = () => {
      const newView = getInitialView();
      setActiveView(newView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  // Mejor detección de dispositivos
  const getDeviceType = () => {
    const width = window.innerWidth;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024
    };
  };

  const [deviceType, setDeviceType] = useState(getDeviceType());
  const isMobile = deviceType.isMobile;
  const isTablet = deviceType.isTablet;
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [essence, setEssence] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEssenceNotification, setShowEssenceNotification] = useState(false);

  // Estado global del Focus Timer
  const [focusState, setFocusState] = useState<{
    isActive: boolean;
    isPaused: boolean;
    timeLeft: number;
    totalTime: number;
    selectedSubjectId: string | null;
    sanctuaryMode: boolean;
  }>({
    isActive: false,
    isPaused: false,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    selectedSubjectId: null,
    sanctuaryMode: false,
  });

  // Timer global que funciona en todas las vistas
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (focusState.isActive && !focusState.isPaused && focusState.timeLeft >= 0) {
      intervalId = setInterval(() => {
        setFocusState(prev => {
          const newTime = prev.timeLeft - 1;
          if (newTime >= 0) {
            return { ...prev, timeLeft: newTime };
          } else {
            // Timer completado - detener
            return { ...prev, isActive: false, isPaused: false, sanctuaryMode: false, timeLeft: 0 };
          }
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [focusState.isActive, focusState.isPaused]);

  // Detectar cuando el timer llega a 0 y completar la sesión
  useEffect(() => {
    if (focusState.timeLeft === 0 && focusState.isActive && !focusState.isPaused) {
      // Pequeño delay para asegurar que el estado se actualizó
      const timeoutId = setTimeout(() => {
        setFocusState(prev => ({
          ...prev,
          isActive: false,
          isPaused: false,
          sanctuaryMode: false
        }));
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [focusState.timeLeft, focusState.isActive, focusState.isPaused]);

  // Ref para rastrear si los datos ya se cargaron (evita recargas duplicadas)
  const dataLoadedRef = useRef(false);
  const initialLoadDoneRef = useRef(false); // Para evitar que INITIAL_SESSION recargue datos

  // Cargar datos del usuario desde Supabase
  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    const loadUserData = async () => {
      // Si ya se cargaron los datos, no volver a cargar
      if (dataLoadedRef.current) {
        if (isMounted) {
          setInitialLoading(false);
        }
        return;
      }

      try {
        // Timeout razonable (5 segundos) - suficiente para Supabase
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading user data')), 5000)
        );

        const sessionPromise = supabaseService.getSession();
        const session = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          // Cargar datos en paralelo para ser más rápido
          loadAllData(session.user.id)
            .then(() => {
              if (isMounted) {
                dataLoadedRef.current = true;
                initialLoadDoneRef.current = true;
              }
            })
            .catch(err => {
              console.error('Error loading user data:', err);
            });
        } else {
          setUser(null);
          initialLoadDoneRef.current = true; // Marcar como completado incluso sin usuario
        }
      } catch (error: any) {
        // Si es un timeout o error de conexión, solo mostrar warning
        if (error?.message?.includes('Timeout')) {
          console.warn('Timeout loading user data - continuing without user');
        } else {
          console.error('Error loading user data:', error);
        }
        if (isMounted) {
          setUser(null);
          initialLoadDoneRef.current = true; // Marcar como completado
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    loadUserData();

    // Escuchar cambios de autenticación
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        // IGNORAR completamente INITIAL_SESSION después de la primera carga
        // Esto evita recargas cuando regresas a la pestaña
        if (event === 'INITIAL_SESSION') {
          // Solo actualizar el usuario si existe, pero NUNCA recargar datos
          if (session?.user && isMounted) {
            // Solo actualizar el usuario si no se ha cargado antes
            if (!dataLoadedRef.current) {
              setUser(session.user);
            } else {
              // Si los datos ya se cargaron, solo actualizar el usuario silenciosamente
              setUser(session.user);
            }
          }
          return; // Salir temprano, no procesar más
        }

        // Solo procesar eventos relevantes
        if (event === 'SIGNED_IN') {
          // Solo recargar datos cuando el usuario inicia sesión explícitamente
          if (session?.user) {
            setUser(session.user);
            // NO usar setInitialLoading aquí - solo recargar datos en segundo plano
            // para no interrumpir la experiencia del usuario
            dataLoadedRef.current = false; // Resetear para permitir recarga
            loadAllData(session.user.id)
              .then(() => {
                if (isMounted) {
                  dataLoadedRef.current = true;
                }
              })
              .catch(error => {
                console.error('Error loading user data:', error);
              });
            // NO cambiar loading aquí - los datos se cargan en segundo plano
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Solo actualizar el usuario si existe, pero NO recargar todos los datos
          // Esto evita el "refresh" molesto cuando cambias de pestaña
          if (session?.user && isMounted) {
            // Solo actualizar el usuario, sin tocar los datos ni el estado de loading
            setUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          dataLoadedRef.current = false; // Resetear la bandera
          initialLoadDoneRef.current = false; // Resetear también esta
          // Limpiar datos locales
          setSubjects([]);
          setModules(INITIAL_MODULES);
          setEssence(0);
          setTransactions([]);
          setMonthlyBudget(0);
          setJournalEntries([]);
          setCustomEvents([]);
          // NO cambiar initialLoading aquí - solo limpiar datos
        }
      });
      subscription = authSubscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (isMounted) {
        setInitialLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadAllData = async (userId: string) => {
    try {
      // Cargar perfil primero (necesario para esencia)
      let profile = await supabaseService.getProfile(userId);
      
      // Si no existe perfil, crearlo automáticamente (útil para usuarios de Google Auth)
      if (!profile) {
        try {
          // Obtener información del usuario desde auth
          const user = await supabaseService.getCurrentUser();
          const email = user?.email || '';
          const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
          
          // Crear perfil con valores por defecto
          profile = await supabaseService.createProfile(userId, email, fullName);
        } catch (createError) {
          console.error('Error creating profile:', createError);
          // Continuar sin perfil si falla la creación
        }
      }
      
      if (profile) {
        setEssence(profile.essence);
        setUserProfile(profile);
        // Verificar si necesita mostrar el onboarding
        if (!profile.onboarding_completed) {
          setShowOnboarding(true);
        }
      }

      // Cargar configuración de seguridad (silenciosamente, puede no existir)
      const securityConfig = await supabaseService.getSecurityConfig(userId);
      if (securityConfig?.security_pin) {
        setSecurityPin(securityConfig.security_pin);
      }

      // Cargar todo lo demás en paralelo para ser más rápido
      // Usar Promise.allSettled para que si una tabla no existe, las demás sigan funcionando
      const results = await Promise.allSettled([
        supabaseService.getModules(userId),
        supabaseService.getSubjects(userId),
        supabaseService.getTransactions(userId),
        supabaseService.getJournalEntries(userId),
        supabaseService.getCalendarEvents(userId),
      ]);

      // Procesar resultados
      const [userModulesResult, subjectsResult, transactionsResult, entriesResult, eventsResult] = results;

      // Procesar módulos
      if (userModulesResult.status === 'fulfilled') {
        const userModules = userModulesResult.value;
        if (userModules.length > 0) {
          setModules(userModules);
        } else {
          // Inicializar módulos si no existen
          if (INITIAL_MODULES.length > 0) {
            supabaseService.initializeModules(userId, INITIAL_MODULES)
              .then(() => setModules(INITIAL_MODULES))
              .catch(() => setModules(INITIAL_MODULES));
          } else {
            setModules(INITIAL_MODULES);
          }
        }
      } else {
        console.warn('Error loading modules:', userModulesResult.reason);
        setModules(INITIAL_MODULES);
      }

      // Actualizar estados (solo si las tablas existen)
      if (subjectsResult.status === 'fulfilled') {
        setSubjects(subjectsResult.value);
      } else {
        console.warn('Table subjects not found, using empty array');
        setSubjects([]);
      }

      if (transactionsResult.status === 'fulfilled') {
        setTransactions(transactionsResult.value);
      } else {
        console.warn('Table transactions not found, using empty array');
        setTransactions([]);
      }

      if (entriesResult.status === 'fulfilled') {
        setJournalEntries(entriesResult.value);
      } else {
        console.warn('Table journal_entries not found, using empty array');
        setJournalEntries([]);
      }

      if (eventsResult.status === 'fulfilled') {
        setCustomEvents(eventsResult.value);
      } else {
        console.warn('Table calendar_events not found, using empty array');
        setCustomEvents([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Guardar cambios en Supabase cuando cambian los datos
  useEffect(() => {
    if (!user) return;

    const saveData = async () => {
      try {
        // Actualizar esencia en perfil
        await supabaseService.updateEssence(user.id, essence);

        // Actualizar módulos (solo si hay cambios)
        // No actualizar todos los módulos cada vez, solo los que han cambiado
        const activeModules = modules.filter(m => m.active);
        for (const module of activeModules) {
          try {
            await supabaseService.updateModule(user.id, module.id, module);
          } catch (error: any) {
            // Si la tabla no existe, solo loguear el warning pero no fallar
            if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
              console.warn('Table user_modules not found, skipping module update');
              break; // No intentar más módulos
            }
            console.error('Error updating module:', error);
          }
        }
      } catch (error: any) {
        // Si es un error de tabla no encontrada, solo loguear
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table not found, skipping save');
          return;
        }
        console.error('Error saving data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [essence, modules, user]);

  const handleAuthSuccess = () => {
    // El onAuthStateChange manejará todo automáticamente
    // Solo necesitamos cerrar el modal si está abierto
    setShowLoginModal(false);
  };

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);

  const toggleModule = async (moduleId: string) => {
    // Si no hay usuario, mostrar modal de login
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    
    // Si es el módulo de seguridad y no está activo, pedir PIN primero
    if (moduleId === 'security' && !mod.active && essence >= mod.cost) {
      setPendingModuleId(moduleId);
      setShowPinSetupModal(true);
      return;
    }
    
    if (!mod.active && essence >= mod.cost) {
      const newEssence = essence - mod.cost;
      setEssence(newEssence);
      const updatedModules = modules.map(m => m.id === moduleId ? { ...m, active: true } : m);
      setModules(updatedModules);
      
      try {
        await supabaseService.updateEssence(user.id, newEssence);
        await supabaseService.updateModule(user.id, moduleId, { active: true });
      } catch (error) {
        console.error('Error updating module:', error);
      }
    }
  };

  const handlePinSetup = async (pin: string) => {
    if (!user || !pendingModuleId) return;
    
    const trimmedPin = pin.trim();
    if (trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
      alert('El PIN debe tener exactamente 4 dígitos numéricos');
      return;
    }

    const mod = modules.find(m => m.id === pendingModuleId);
    if (!mod || mod.active || essence < mod.cost) return;

    try {
      // Guardar PIN en la configuración de seguridad
      await supabaseService.updateSecurityConfig(user.id, { security_pin: trimmedPin });
      setSecurityPin(trimmedPin);
      
      // Activar el módulo
      const newEssence = essence - mod.cost;
      setEssence(newEssence);
      const updatedModules = modules.map(m => m.id === pendingModuleId ? { ...m, active: true } : m);
      setModules(updatedModules);
      
      await supabaseService.updateEssence(user.id, newEssence);
      await supabaseService.updateModule(user.id, pendingModuleId, { active: true });
      
      setShowPinSetupModal(false);
      setPendingModuleId(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al configurar la seguridad. Intenta nuevamente.';
      console.error('Error setting up security:', error);
      alert(errorMessage);
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    try {
      return await supabaseService.verifySecurityPin(user.id, pin);
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const updateSubject = async (updated: Subject) => {
    if (!user) return;
    
    const oldSubject = subjects.find(s => s.id === updated.id);
    setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
    
    try {
      await supabaseService.updateSubject(user.id, updated.id, updated);
      
      // Sincronizar milestones automáticamente con Google Calendar
      if (googleCalendarService.isConnected(user.id)) {
        // Sincronizar todos los milestones del subject actualizado
        for (const milestone of updated.milestones) {
          googleCalendarService.syncMilestone(user.id, updated, milestone).catch(err => {
            console.error('Error sincronizando milestone con Google Calendar:', err);
          });
        }
        
        // Si se eliminaron milestones, eliminar de Google Calendar
        if (oldSubject) {
          const oldMilestoneIds = new Set(oldSubject.milestones.map(m => m.id));
          const newMilestoneIds = new Set(updated.milestones.map(m => m.id));
          
          for (const oldMilestoneId of oldMilestoneIds) {
            if (!newMilestoneIds.has(oldMilestoneId as string)) {
              googleCalendarService.deleteSyncedEvent(user.id, 'milestone', oldMilestoneId as string).catch(err => {
                console.error('Error eliminando milestone de Google Calendar:', err);
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };

  const handleAddSubject = async (name: string, career: string) => {
    if (!user) return;
    
    const newSubject: Omit<Subject, 'id'> = {
      name,
      career,
      status: 'Cursando',
      absences: 0,
      maxAbsences: 20,
      milestones: [],
      schedules: [],
      notes: [],
      materials: [],
    };

    try {
      const created = await supabaseService.createSubject(user.id, newSubject);
      setSubjects([...subjects, created]);
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!user) return;
    
    setSubjects(subjects.filter(s => s.id !== id));
    
    try {
      await supabaseService.deleteSubject(user.id, id);
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    try {
      const created = await supabaseService.createTransaction(user.id, transaction);
      setTransactions([...transactions, created]);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleUpdateTransaction = async (transaction: Transaction) => {
    if (!user) return;
    
    setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
    
    try {
      await supabaseService.updateTransaction(user.id, transaction.id, transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    
    setTransactions(transactions.filter(t => t.id !== id));
    
    try {
      await supabaseService.deleteTransaction(user.id, id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleAddJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    if (!user) return;
    
    try {
      const created = await supabaseService.createJournalEntry(user.id, entry);
      setJournalEntries([created, ...journalEntries]);
    } catch (error) {
      console.error('Error creating journal entry:', error);
    }
  };

  const handleUpdateJournalEntry = async (entry: JournalEntry) => {
    if (!user) return;
    
    setJournalEntries(journalEntries.map(e => e.id === entry.id ? entry : e));
    
    try {
      await supabaseService.updateJournalEntry(user.id, entry.id, entry);
    } catch (error) {
      console.error('Error updating journal entry:', error);
    }
  };

  const handleDeleteJournalEntry = async (id: string) => {
    if (!user) return;
    
    setJournalEntries(journalEntries.filter(e => e.id !== id));
    
    try {
      await supabaseService.deleteJournalEntry(user.id, id);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  const handleAddCalendarEvent = async (event: Omit<CustomCalendarEvent, 'id'>) => {
    if (!user) return;
    
    try {
      const created = await supabaseService.createCalendarEvent(user.id, event);
      setCustomEvents([...customEvents, created]);
      
      // Sincronizar automáticamente con Google Calendar
      if (googleCalendarService.isConnected(user.id)) {
        googleCalendarService.syncCustomEvent(user.id, created).catch(err => {
          console.error('Error sincronizando evento con Google Calendar:', err);
        });
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    if (!user) return;
    
    const eventToDelete = customEvents.find(e => e.id === id);
    setCustomEvents(customEvents.filter(e => e.id !== id));
    
    try {
      await supabaseService.deleteCalendarEvent(user.id, id);
      
      // Eliminar de Google Calendar si está sincronizado
      if (eventToDelete && googleCalendarService.isConnected(user.id)) {
        googleCalendarService.deleteSyncedEvent(user.id, 'custom_event', id).catch(err => {
          console.error('Error eliminando evento de Google Calendar:', err);
        });
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  };

  const handleUpdateCalendarEvent = async (event: CustomCalendarEvent) => {
    if (!user) return;
    
    setCustomEvents(customEvents.map(e => e.id === event.id ? event : e));
    
    try {
      await supabaseService.updateCalendarEvent(user.id, event);
      
      // Sincronizar automáticamente con Google Calendar
      if (googleCalendarService.isConnected(user.id)) {
        googleCalendarService.syncCustomEvent(user.id, event).catch(err => {
          console.error('Error sincronizando evento con Google Calendar:', err);
        });
      }
    } catch (error) {
      console.error('Error updating calendar event:', error);
    }
  };

  const handleMaterialUpload = async () => {
    if (!user) return;
    
    const newEssence = essence + 5;
    setEssence(newEssence);
    
    try {
      await supabaseService.updateEssence(user.id, newEssence);
    } catch (error) {
      console.error('Error updating essence:', error);
    }
  };

  const handleAddEssence = async (amount: number) => {
    if (!user) return;
    
    const newEssence = essence + amount;
    setEssence(newEssence);
    
    try {
      await supabaseService.updateEssence(user.id, newEssence);
    } catch (error) {
      console.error('Error updating essence:', error);
    }
  };

  const handleCompleteOnboarding = async (
    onboardingData?: {
      fullName: string;
      academicStage: string;
      interests: string[];
      referralSource: string;
    },
    completeOnboarding?: boolean
  ) => {
    if (!user || !userProfile) return;
    
    try {
      // Preparar actualizaciones del perfil
      const profileUpdates: any = {};
      
      // Si es el final del Acto II, marcar como completado
      if (completeOnboarding) {
        profileUpdates.onboarding_completed = true;
        
        // Actualizar el perfil para marcar como completado
        await supabaseService.updateProfile(user.id, profileUpdates);
        
        // Recargar el perfil actualizado
        const finalProfile = await supabaseService.getProfile(user.id);
        
        // Actualizar el estado local
        if (finalProfile) {
          setUserProfile(finalProfile);
          setEssence(finalProfile.essence);
        }
        
        // Cerrar el modal y navegar al Dashboard
        setShowOnboarding(false);
        setActiveView(NavView.DASHBOARD);
        setShowEssenceNotification(true);
        return;
      }
      
      // Si es el final del Acto I, guardar datos pero no marcar como completado
      if (onboardingData) {
        if (onboardingData.fullName) {
          profileUpdates.full_name = onboardingData.fullName;
        }
        if (onboardingData.academicStage) {
          profileUpdates.academic_stage = onboardingData.academicStage;
          // También guardar en career para compatibilidad
          profileUpdates.career = onboardingData.academicStage;
        }
        if (onboardingData.interests && onboardingData.interests.length > 0) {
          profileUpdates.interests = onboardingData.interests;
        }
        if (onboardingData.referralSource) {
          profileUpdates.referral_source = onboardingData.referralSource;
        }
        
        // Actualizar el perfil con los datos del Acto I
        await supabaseService.updateProfile(user.id, profileUpdates);
        
        // Otorgar 300 puntos de esencia
        await supabaseService.addEssence(user.id, 300);
        
        // Recargar el perfil actualizado
        const updatedProfile = await supabaseService.getProfile(user.id);
        
        // Actualizar el estado local
        if (updatedProfile) {
          setUserProfile(updatedProfile);
          setEssence(updatedProfile.essence);
        }
      }
      
      // No cerrar el modal aquí, solo actualizar datos (el modal continuará al Acto II)
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Aún así cerrar el modal para no bloquear al usuario
      setShowOnboarding(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Generar el SPC completo para uso en componentes (DEBE estar al nivel superior, antes de cualquier return)
  const studentProfileContext = useInteractionAggregator({
    userProfile,
    subjects,
    transactions,
    journalEntries,
    customEvents,
    modules,
    monthlyBudget,
  });

  // Solo mostrar loading en la carga inicial - nunca después para no interrumpir la UX
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-[#FFE4E9]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E35B8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cinzel text-[#4A233E] text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case NavView.DASHBOARD:
        return (
          <Dashboard 
            modules={modules} 
            onActivate={toggleModule} 
            isMobile={isMobile} 
            setActiveView={setActiveView}
            user={user}
            essence={user ? essence : 0}
            showLoginModal={showLoginModal}
            setShowLoginModal={setShowLoginModal}
            onAuthSuccess={handleAuthSuccess}
          />
        );
      case NavView.SUBJECTS:
        return <SubjectsModule 
          subjects={subjects} 
          onAdd={handleAddSubject}
          onDelete={handleDeleteSubject}
          onUpdate={updateSubject} 
          isMobile={isMobile} 
          onMaterialUpload={handleMaterialUpload}
          onAddEssence={handleAddEssence}
          studentProfileContext={studentProfileContext}
        />;
      case NavView.CALENDAR:
        return <CalendarModule 
          subjects={subjects} 
          transactions={transactions} 
          journalEntries={journalEntries} 
          customEvents={customEvents}
          onAddCustomEvent={handleAddCalendarEvent}
          onDeleteCustomEvent={handleDeleteCalendarEvent}
          onUpdateCustomEvent={handleUpdateCalendarEvent}
          isMobile={isMobile}
          userId={user?.id}
        />;
      case NavView.FINANCE:
        return <FinanceModule 
          transactions={transactions} 
          budget={monthlyBudget}
          onUpdateBudget={setMonthlyBudget}
          onAdd={handleAddTransaction} 
          onDelete={handleDeleteTransaction}
          onUpdate={handleUpdateTransaction}
          isMobile={isMobile} 
        />;
      case NavView.FOCUS:
        return <FocusModule 
          subjects={subjects} 
          onUpdateSubject={updateSubject} 
          onAddEssence={handleAddEssence}
          onAddCalendarEvent={handleAddCalendarEvent}
          isMobile={isMobile}
          focusState={focusState}
          onFocusStateChange={setFocusState}
        />;
      case NavView.DIARY:
        const securityModule = modules.find(m => m.id === 'security');
        return <DiaryModule 
          entries={journalEntries} 
          onAddEntry={handleAddJournalEntry} 
          onDeleteEntry={handleDeleteJournalEntry}
          onUpdateEntry={handleUpdateJournalEntry}
          isMobile={isMobile}
          securityModuleActive={securityModule?.active || false}
          securityPin={securityPin || undefined}
          onVerifyPin={verifyPin}
        />;
      case NavView.PROFILE:
        return <ProfileModule 
          user={user} 
          onAuthSuccess={handleAuthSuccess} 
          onSignOut={handleSignOut}
          isMobile={isMobile}
          subjects={subjects}
          transactions={transactions}
          journalEntries={journalEntries}
          customEvents={customEvents}
          modules={modules}
          monthlyBudget={monthlyBudget}
          setActiveView={handleViewChange}
        />;
      case NavView.BAZAR:
        return <BazarArtefactos 
          isMobile={isMobile}
          essence={user ? essence : 0}
          onEssenceChange={setEssence}
        />;
      case NavView.ORACLE:
        return <OraculoPage
          userProfile={userProfile}
          subjects={subjects}
          transactions={transactions}
          journalEntries={journalEntries}
          customEvents={customEvents}
          modules={modules}
          monthlyBudget={monthlyBudget}
          isMobile={isMobile}
          onAddJournalEntry={handleAddJournalEntry}
        />;
      case NavView.PRIVACY_POLICY:
        return <PrivacyPolicy 
          onBack={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
        />;
      case NavView.TERMS_OF_SERVICE:
        return <TermsOfService 
          onBack={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
        />;
      case NavView.DOCS:
        return <DocsPage 
          onBack={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
        />;
      default:
        return <Dashboard modules={modules} onActivate={toggleModule} isMobile={isMobile} setActiveView={setActiveView} />;
    }
  };

  // Ocultar navegación en páginas de políticas y docs
  const isPolicyPage = activeView === NavView.PRIVACY_POLICY || activeView === NavView.TERMS_OF_SERVICE || activeView === NavView.DOCS;

  const handleNavigationClick = (view: NavView) => {
    // Si no hay usuario y se intenta acceder a un módulo que no sea Dashboard, mostrar login
    if (!user && view !== NavView.DASHBOARD && view !== NavView.PROFILE && view !== NavView.PRIVACY_POLICY && view !== NavView.TERMS_OF_SERVICE && view !== NavView.DOCS) {
      setShowLoginModal(true);
    } else {
      // Usar handleViewChange para políticas y docs, setActiveView normal para otras vistas
      if (view === NavView.PRIVACY_POLICY || view === NavView.TERMS_OF_SERVICE || view === NavView.DOCS) {
        handleViewChange(view);
      } else {
        setActiveView(view);
      }
    }
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-screen w-screen overflow-hidden`}>
      {/* Mobile Top Bar - Solo visible en mobile */}
      {isMobile && !isPolicyPage && (
        <MobileTopBar
          user={user}
          userProfile={userProfile}
          onProfileClick={() => handleNavigationClick(NavView.PROFILE)}
        />
      )}

      {/* Desktop Sidebar - Oculto en mobile */}
      {!isMobile && !isPolicyPage && (
        <Navigation 
          activeView={activeView} 
          setActiveView={handleNavigationClick} 
          essence={user ? essence : 0} 
          isMobile={false}
          modules={modules}
          user={user}
          userProfile={userProfile}
        />
      )}
      
      {/* Área de contenido principal */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pt-16 pb-28' : ''}`}>
        <main className={`flex-1 relative overflow-y-auto ${isPolicyPage ? '' : 'p-4 md:p-8'} ${isMobile && !isPolicyPage ? 'pt-4' : ''}`}>
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation - Solo visible en mobile */}
      {isMobile && !isPolicyPage && (
        <Navigation 
          activeView={activeView}
          setActiveView={handleNavigationClick} 
          essence={user ? essence : 0} 
          isMobile={true}
          modules={modules}
          user={user}
          userProfile={userProfile}
        />
      )}

      {/* Modal de Configuración de PIN */}
      {showPinSetupModal && (
        <PinSetupModal
          onSetup={handlePinSetup}
          onCancel={() => {
            setShowPinSetupModal(false);
            setPendingModuleId(null);
          }}
        />
      )}

      {/* Widget Flotante de Focus - Solo se muestra cuando está activo y no estás en la vista Focus */}
      {focusState.isActive && activeView !== NavView.FOCUS && (
        <FocusFloatingWidget
          timeLeft={focusState.timeLeft}
          isActive={focusState.isActive}
          isPaused={focusState.isPaused}
          onPause={() => setFocusState(prev => ({ ...prev, isPaused: true }))}
          onResume={() => setFocusState(prev => ({ ...prev, isPaused: false }))}
          onStop={() => {
            setFocusState(prev => ({ ...prev, isActive: false, isPaused: false, sanctuaryMode: false }));
          }}
          onOpen={() => setActiveView(NavView.FOCUS)}
          isMobile={isMobile}
        />
      )}

      {/* Modal de Onboarding */}
      {showOnboarding && user && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          isMobile={isMobile}
        />
      )}

      {/* Notificación de Esencia Ganada */}
      {showEssenceNotification && (
        <EssenceNotification
          amount={300}
          onClose={() => setShowEssenceNotification(false)}
          isMobile={isMobile}
        />
      )}

      <Analytics />
    </div>
  );
};

// Componente Modal de Configuración de PIN con auto-focus
const PinSetupModal: React.FC<{ onSetup: (pin: string) => void; onCancel: () => void }> = ({ onSetup, onCancel }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const confirmPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Auto-focus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (pinRefs[0].current && !isConfirming) {
      pinRefs[0].current.focus();
    } else if (confirmPinRefs[0].current && isConfirming) {
      confirmPinRefs[0].current.focus();
    }
  }, [isConfirming]);

  // Cuando se completa el PIN, pasar a confirmación
  useEffect(() => {
    if (pin.length === 4 && !isConfirming) {
      setIsConfirming(true);
      setTimeout(() => {
        confirmPinRefs[0].current?.focus();
      }, 100);
    }
  }, [pin.length]);

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 1) return;

    if (isConfirm) {
      const newPin = confirmPin.split('');
      newPin[index] = numericValue;
      const updatedPin = newPin.join('').slice(0, 4);
      setConfirmPin(updatedPin);
      setError('');

      if (numericValue && index < 3 && confirmPinRefs[index + 1].current) {
        setTimeout(() => {
          confirmPinRefs[index + 1].current?.focus();
        }, 10);
      }

      if (updatedPin.length === 4) {
        // Esperar un momento para que React actualice el estado antes de validar
        // Pasar tanto el PIN de confirmación como el PIN original
        setTimeout(() => {
          handleSubmit(updatedPin, pin);
        }, 150);
      }
    } else {
      const newPin = pin.split('');
      newPin[index] = numericValue;
      const updatedPin = newPin.join('').slice(0, 4);
      setPin(updatedPin);
      setError('');

      if (numericValue && index < 3 && pinRefs[index + 1].current) {
        setTimeout(() => {
          pinRefs[index + 1].current?.focus();
        }, 10);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isConfirm: boolean = false) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    
    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleNumberClick = (num: string) => {
    if (isConfirming) {
      const currentIndex = confirmPin.length;
      if (currentIndex < 4) {
        handlePinChange(currentIndex, num, true);
      }
    } else {
      const currentIndex = pin.length;
      if (currentIndex < 4) {
        handlePinChange(currentIndex, num, false);
      }
    }
  };

  const handleSubmit = (submittedConfirmPin?: string, submittedPin?: string) => {
    // Usar los valores pasados directamente o el estado como fallback
    const currentPin = (submittedPin || pin).trim();
    const finalConfirmPin = (submittedConfirmPin || confirmPin).trim();
    
    // Validar que el PIN tenga exactamente 4 dígitos
    if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
      setError('El PIN debe tener exactamente 4 dígitos numéricos');
      return;
    }
    
    // Validar que la confirmación tenga exactamente 4 dígitos
    if (finalConfirmPin.length !== 4 || !/^\d{4}$/.test(finalConfirmPin)) {
      setError('La confirmación del PIN debe tener exactamente 4 dígitos numéricos');
      return;
    }
    
    // Validar que ambos PINs coincidan
    if (currentPin !== finalConfirmPin) {
      setError('Los PINs no coinciden');
      setConfirmPin('');
      setIsConfirming(false);
      setTimeout(() => {
        pinRefs[0].current?.focus();
      }, 50);
      return;
    }
    
    setError('');
    onSetup(currentPin);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4A233E]/10 flex items-center justify-center">
            {getIcon('lock', 'w-8 h-8 text-[#D4AF37]')}
          </div>
          <h3 className="font-cinzel text-xl lg:text-2xl text-[#4A233E] mb-2">Configurar PIN de Seguridad</h3>
          <p className="font-garamond text-[#8B5E75] text-sm">
            {isConfirming ? 'Confirma tu PIN' : 'Establece un PIN de 4 dígitos para proteger tus entradas bloqueadas'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {!isConfirming ? (
            <div>
              <label className="block text-sm font-cinzel text-[#4A233E] mb-2">PIN</label>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={pinRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[index] || ''}
                    onChange={(e) => handlePinChange(index, e.target.value, false)}
                    onKeyDown={(e) => handleKeyDown(index, e, false)}
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 text-center text-2xl font-cinzel font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
                      pin.length > index
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#4A233E]'
                        : 'border-[#F8C8DC] bg-white/40 text-[#8B5E75]/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-cinzel text-[#4A233E] mb-2">Confirmar PIN</label>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={confirmPinRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={confirmPin[index] || ''}
                    onChange={(e) => handlePinChange(index, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 text-center text-2xl font-cinzel font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
                      confirmPin.length > index
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#4A233E]'
                        : 'border-[#F8C8DC] bg-white/40 text-[#8B5E75]/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center font-garamond">{error}</p>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#4A233E] font-cinzel text-xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-sm font-black hover:bg-[#FFF0F5] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#4A233E] font-cinzel text-xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={() => {
              if (isConfirming) {
                setConfirmPin(confirmPin.slice(0, -1));
                const lastIndex = Math.max(0, confirmPin.length - 1);
                confirmPinRefs[lastIndex].current?.focus();
              } else {
                setPin(pin.slice(0, -1));
                const lastIndex = Math.max(0, pin.length - 1);
                pinRefs[lastIndex].current?.focus();
              }
              setError('');
            }}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-sm font-black hover:bg-[#FFF0F5] transition-all"
          >
            ←
          </button>
        </div>

        <div className="flex gap-4">
          {isConfirming && (
            <button
              onClick={() => {
                setIsConfirming(false);
                setConfirmPin('');
                pinRefs[0].current?.focus();
              }}
              className="flex-1 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
            >
              Atrás
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
          >
            Cancelar
          </button>
          {!isConfirming && (
            <button
              onClick={() => {
                if (pin.length === 4) {
                  setIsConfirming(true);
                  setTimeout(() => {
                    confirmPinRefs[0].current?.focus();
                  }, 100);
                }
              }}
              disabled={pin.length !== 4}
              className="flex-1 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest bg-[#D4AF37] text-[#4A233E] hover:bg-[#C9A030] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
