import React, { useState, useEffect, useRef } from 'react';
import { NavView, Subject, Module, Transaction, JournalEntry, CustomCalendarEvent, NutritionEntry, NutritionGoals, NutritionCorrelation, BalanzaProTransaction, Exam, ExamResult } from './types';
import { INITIAL_MODULES, getIcon } from './constants';
import { supabaseService, supabase, UserProfile } from './services/supabaseService';
import { googleCalendarService } from './services/googleCalendarService';
import { examService } from './services/examService';
import { Analytics } from '@vercel/analytics/react';
import { useInteractionAggregator } from './hooks/useInteractionAggregator';
import Navigation from './components/Navigation';
import MobileTopBar from './components/MobileTopBar';
import Dashboard from './components/Dashboard';
import SubjectsModule from './components/SubjectsModule';
import CalendarModule from './components/CalendarModule';
import FocusModule from './components/FocusModule';
import DiaryModule from './components/DiaryModule';
import AuthModule from './components/AuthModule';
import ProfileModule from './components/ProfileModule';
import FocusFloatingWidget from './components/FocusFloatingWidget';
import OraculoPage from './components/OraculoPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import DocsPage from './components/DocsPage';
import BazarModule from './components/BazarModule';
import BalanzaModule from './components/BalanzaModule';
import CalculatorModule from './components/CalculatorModule';
import CalculatorFloatingWidget from './components/CalculatorFloatingWidget';
import ExamGeneratorModule from './components/ExamGeneratorModule';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import NutritionModule from './components/NutritionModule';
import Footer from './components/Footer';
import OnboardingModal from './components/OnboardingModal';
import CookieConsentBanner from './components/CookieConsentBanner';
import DashboardStatsModule from './components/DashboardStatsModule';
import PremiumPage from './components/PremiumPage';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true); // Solo para la carga inicial
  
  // Detectar página desde URL para acceso directo a políticas
  const getInitialView = (): NavView => {
    const pathname = window.location.pathname;
    if (pathname === '/privacidad' || pathname === '/privacidad/') return NavView.PRIVACY_POLICY;
    if (pathname === '/terminosycondiciones' || pathname === '/terminosycondiciones/') return NavView.TERMS_OF_SERVICE;
    if (pathname === '/docs' || pathname === '/docs/') return NavView.DOCS;
    if (pathname === '/premium' || pathname === '/premium/') return NavView.PREMIUM;
    // Mantener compatibilidad con query params antiguos
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page === 'privacy-policy') return NavView.PRIVACY_POLICY;
    if (page === 'terms-of-service') return NavView.TERMS_OF_SERVICE;
    if (page === 'docs') return NavView.DOCS;
    if (page === 'premium') return NavView.PREMIUM;
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
    } else if (view === NavView.PREMIUM) {
      window.history.pushState({ view: 'premium' }, '', '/premium');
    } else if (view === NavView.DASHBOARD) {
      // Si vuelve al dashboard desde una página de política/docs/premium, limpiar la URL
      if (window.location.pathname === '/privacidad' || window.location.pathname === '/terminosycondiciones' || window.location.pathname === '/docs' || window.location.pathname === '/premium') {
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
  
  // Estado para controlar si el sidebar está colapsado (solo desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const isMobile = deviceType.isMobile;
  const isTablet = deviceType.isTablet;
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isNightMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [balanzaProTransactions, setBalanzaProTransactions] = useState<BalanzaProTransaction[]>([]);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([]);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null);
  const [nutritionCorrelations, setNutritionCorrelations] = useState<NutritionCorrelation[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);

  // Flags para trackear qué datos ya están cargados (cache)
  const [dataLoadedFlags, setDataLoadedFlags] = useState({
    transactions: false,
    journalEntries: false,
    customEvents: false,
    exams: false,
  });

  const toggleTheme = () => {
    setIsNightMode(prev => {
      const newValue = !prev;
      localStorage.setItem('isNightMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Sincronizar el estado del tema con localStorage al cargar (solo una vez)
  useEffect(() => {
    const saved = localStorage.getItem('isNightMode');
    if (saved !== null) {
      try {
        const savedValue = JSON.parse(saved);
        setIsNightMode(savedValue);
      } catch (error) {
        console.error('Error parsing saved theme preference:', error);
        // Si hay error, usar el valor por defecto
        localStorage.setItem('isNightMode', JSON.stringify(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

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
          
          // Cargar contraseña de encriptación desde Supabase si está configurada
          supabaseService.loadEncryptionPasswordFromSupabase(session.user.id)
            .catch(err => {
              console.error('Error loading encryption password:', err);
            });
          
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
            
            // Cargar contraseña de encriptación desde Supabase si está configurada
            supabaseService.loadEncryptionPasswordFromSupabase(session.user.id)
              .catch(err => {
                console.error('Error loading encryption password:', err);
              });
            
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
          setTransactions([]);
          setMonthlyBudget(0);
          setJournalEntries([]);
          setCustomEvents([]);
          setBalanzaProTransactions([]);
          setNutritionEntries([]);
          setNutritionGoals(null);
          setNutritionCorrelations([]);
          setExams([]);
          setExamResults([]);
          // Resetear flags de datos cargados
          setDataLoadedFlags({
            transactions: false,
            journalEntries: false,
            customEvents: false,
            exams: false,
          });
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
      // Cargar perfil primero
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
        setUserProfile(profile);
        // Actualizar monthlyBudget desde el perfil
        if (profile.monthly_budget !== undefined) {
          setMonthlyBudget(profile.monthly_budget);
        }
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

      // Cargar solo datos esenciales al inicio: Profile, Modules, Subjects
      // El resto se carga bajo demanda cuando el usuario visita cada vista
      const results = await Promise.allSettled([
        supabaseService.getModules(userId),
        supabaseService.getSubjects(userId),
      ]);

      // Procesar resultados (solo Modules y Subjects)
      const [userModulesResult, subjectsResult] = results;

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

      // Actualizar estados (solo Modules y Subjects)
      if (subjectsResult.status === 'fulfilled') {
        setSubjects(subjectsResult.value);
      } else {
        console.warn('Table subjects not found, using empty array');
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Cargar datos bajo demanda según la vista activa
  const loadDataForView = async (userId: string, view: NavView) => {
    try {
      switch (view) {
        case NavView.CALENDAR:
          // Cargar transactions, journalEntries, customEvents si no están cargados
          if (!dataLoadedFlags.transactions || !dataLoadedFlags.journalEntries || !dataLoadedFlags.customEvents) {
            const calendarResults = await Promise.allSettled([
              !dataLoadedFlags.transactions ? supabaseService.getTransactions(userId, 100) : Promise.resolve(transactions),
              !dataLoadedFlags.journalEntries ? supabaseService.getJournalEntries(userId, 50, true) : Promise.resolve(journalEntries),
              !dataLoadedFlags.customEvents ? supabaseService.getCalendarEvents(userId, 100) : Promise.resolve(customEvents),
            ]);

            if (calendarResults[0].status === 'fulfilled' && !dataLoadedFlags.transactions) {
              setTransactions(calendarResults[0].value);
              setDataLoadedFlags(prev => ({ ...prev, transactions: true }));
            }
            if (calendarResults[1].status === 'fulfilled' && !dataLoadedFlags.journalEntries) {
              setJournalEntries(calendarResults[1].value);
              setDataLoadedFlags(prev => ({ ...prev, journalEntries: true }));
            }
            if (calendarResults[2].status === 'fulfilled' && !dataLoadedFlags.customEvents) {
              setCustomEvents(calendarResults[2].value);
              setDataLoadedFlags(prev => ({ ...prev, customEvents: true }));
            }
          }
          break;

        case NavView.DIARY:
          // Cargar journalEntries si no están cargados
          if (!dataLoadedFlags.journalEntries) {
            try {
              const entries = await supabaseService.getJournalEntries(userId, 50, true);
              setJournalEntries(entries);
              setDataLoadedFlags(prev => ({ ...prev, journalEntries: true }));
            } catch (error) {
              console.warn('Error loading journal entries:', error);
            }
          }
          break;

        case NavView.EXAM_GENERATOR:
          // Cargar exams si no están cargados
          if (!dataLoadedFlags.exams) {
            try {
              const examsData = await examService.getExamHistory(userId);
              setExams(examsData);
              
              // Cargar resultados de exámenes completados
              const completedExams = examsData.filter(e => e.completed_at);
              if (completedExams.length > 0) {
                const resultsPromises = completedExams.map(exam => 
                  examService.getExamResults(exam.id).catch(() => null)
                );
                const resultsData = await Promise.all(resultsPromises);
                const validResults = resultsData.filter((r): r is ExamResult => r !== null);
                setExamResults(validResults);
              } else {
                setExamResults([]);
              }
              
              setDataLoadedFlags(prev => ({ ...prev, exams: true }));
            } catch (error) {
              console.warn('Error loading exams:', error);
            }
          }
          break;

        case NavView.ORACLE:
        case NavView.PROFILE:
          // Cargar todos los datos necesarios para Oracle y Profile
          if (!dataLoadedFlags.transactions || !dataLoadedFlags.journalEntries || !dataLoadedFlags.customEvents) {
            const oracleResults = await Promise.allSettled([
              !dataLoadedFlags.transactions ? supabaseService.getTransactions(userId, 100) : Promise.resolve(transactions),
              !dataLoadedFlags.journalEntries ? supabaseService.getJournalEntries(userId, 50, true) : Promise.resolve(journalEntries),
              !dataLoadedFlags.customEvents ? supabaseService.getCalendarEvents(userId, 100) : Promise.resolve(customEvents),
            ]);

            if (oracleResults[0].status === 'fulfilled' && !dataLoadedFlags.transactions) {
              setTransactions(oracleResults[0].value);
              setDataLoadedFlags(prev => ({ ...prev, transactions: true }));
            }
            if (oracleResults[1].status === 'fulfilled' && !dataLoadedFlags.journalEntries) {
              setJournalEntries(oracleResults[1].value);
              setDataLoadedFlags(prev => ({ ...prev, journalEntries: true }));
            }
            if (oracleResults[2].status === 'fulfilled' && !dataLoadedFlags.customEvents) {
              setCustomEvents(oracleResults[2].value);
              setDataLoadedFlags(prev => ({ ...prev, customEvents: true }));
            }
          }
          break;

        // BALANZA y NUTRITION ya cargan sus propios datos en sus módulos
        // No necesitan carga adicional aquí
      }
    } catch (error) {
      console.error('Error loading data for view:', error);
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const handleResize = () => {
      // Throttle resize events para evitar actualizaciones excesivas
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        setDeviceType(getDeviceType());
      }, 150); // Actualizar máximo cada 150ms
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Lazy loading: cargar datos cuando el usuario navega a una vista específica
  useEffect(() => {
    if (!user) return;
    
    loadDataForView(user.id, activeView);
  }, [activeView, user]);

  // Guardar cambios en Supabase cuando cambian los datos
  useEffect(() => {
    if (!user) return;

    const saveData = async () => {
      try {

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
  }, [modules, user]);

  const handleAuthSuccess = () => {
    // El onAuthStateChange manejará todo automáticamente
    // Solo necesitamos cerrar el modal si está abierto
    setShowLoginModal(false);
  };

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showEncryptionPasswordModal, setShowEncryptionPasswordModal] = useState(false);
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);
  const [showCalculatorFloating, setShowCalculatorFloating] = useState(false);

  const toggleModule = async (moduleId: string) => {
    // Si es la calculadora, navegar directamente (es gratuita y siempre disponible)
    if (moduleId === 'scientific-calculator') {
      setActiveView(NavView.CALCULATOR);
      // Si hay usuario, intentar activar el módulo en segundo plano
      if (user) {
        let mod = modules.find(m => m.id === moduleId);
        if (!mod) {
          // Crear el módulo localmente
          const newModule = {
            id: 'scientific-calculator',
            name: 'Calculadora',
            description: 'Calculos y conversiones',
            cost: 0,
            active: true,
            icon: 'calculator',
          };
          setModules([...modules, newModule]);
          mod = newModule;
        }
        if (!mod.active) {
          const updatedModules = modules.map(m => m.id === moduleId ? { ...m, active: true } : m);
          setModules(updatedModules);
          try {
            await supabaseService.updateModule(user.id, moduleId, { active: true });
          } catch (error) {
            console.error('Error updating module:', error);
          }
        }
      }
      return;
    }

    // Si es el generador de exámenes, navegar directamente (es gratuito y siempre disponible)
    if (moduleId === 'exam-generator') {
      setActiveView(NavView.EXAM_GENERATOR);
      // Si hay usuario, intentar activar el módulo en segundo plano
      if (user) {
        let mod = modules.find(m => m.id === moduleId);
        if (!mod) {
          // Crear el módulo localmente
          const newModule = {
            id: 'exam-generator',
            name: 'Generador de Exámenes',
            description: 'Crea tests personalizados a partir de tus apuntes mediante IA',
            cost: 0,
            active: true,
            icon: 'target',
          };
          setModules([...modules, newModule]);
          mod = newModule;
        }
        
        // Intentar activar/crear el módulo en la base de datos (en segundo plano, no bloquear)
        if (!mod.active) {
          const updatedModules = modules.map(m => m.id === moduleId ? { ...m, active: true } : m);
          setModules(updatedModules);
        }
        
        // Intentar guardar en la base de datos (silenciosamente, no bloquear la UI)
        supabaseService.updateModule(user.id, moduleId, { active: true })
          .then(() => {
            console.log('[App] Módulo exam-generator activado correctamente');
          })
          .catch((error: any) => {
            // Error no crítico, solo loguear
            console.warn('[App] No se pudo guardar el estado del módulo en la BD (no crítico):', error?.message || error);
            // El módulo seguirá funcionando localmente
          });
      }
      return;
    }

    // Si es nutrición, navegar directamente (es gratuito y siempre disponible)
    if (moduleId === 'nutrition' || moduleId === 'nutrition-macros') {
      setActiveView(NavView.NUTRITION);
      // Si hay usuario, intentar activar el módulo en segundo plano
      if (user) {
        let mod = modules.find(m => m.id === 'nutrition' || m.id === 'nutrition-macros');
        if (!mod) {
          // Crear el módulo localmente
          const newModule = {
            id: 'nutrition',
            name: 'Nutrición',
            description: 'Registro de alimentación y análisis de impacto en tu energía',
            cost: 0,
            active: true,
            icon: 'apple',
          };
          setModules([...modules, newModule]);
          mod = newModule;
        }
        
        // Intentar activar/crear el módulo en la base de datos (en segundo plano, no bloquear)
        if (!mod.active) {
          const updatedModules = modules.map(m => (m.id === 'nutrition' || m.id === 'nutrition-macros') ? { ...m, active: true } : m);
          setModules(updatedModules);
        }
        
        // Intentar guardar en la base de datos (silenciosamente, no bloquear la UI)
        const moduleIdToSave = mod.id === 'nutrition-macros' ? 'nutrition' : mod.id;
        supabaseService.updateModule(user.id, moduleIdToSave, { active: true })
          .then(() => {
            console.log('[App] Módulo nutrition activado correctamente');
          })
          .catch((error: any) => {
            // Error no crítico, solo loguear
            console.warn('[App] No se pudo guardar el estado del módulo en la BD (no crítico):', error?.message || error);
            // El módulo seguirá funcionando localmente
          });
      }
      return;
    }
    
    // Si no hay usuario, mostrar modal de login
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    
    // Si es el módulo de seguridad y no está activo, verificar si ya tiene contraseña configurada
    if (moduleId === 'security' && !mod.active) {
      try {
        // Verificar si ya tiene contraseña de encriptación configurada
        const hasEncryptionPassword = await supabaseService.hasEncryptionPasswordConfigured(user.id);
        
        if (hasEncryptionPassword && supabaseService.hasEncryptionPassword()) {
          // Ya tiene contraseña configurada y cargada, solo pedir PIN si no lo tiene
          const securityConfig = await supabaseService.getSecurityConfig(user.id);
          if (!securityConfig || !securityConfig.security_pin) {
            // No tiene PIN, pedirlo
            setPendingModuleId(moduleId);
            setShowPinSetupModal(true);
            return;
          } else {
            // Ya tiene PIN y contraseña, pero NO activar automáticamente
            // El usuario debe activar el módulo manualmente después de configurar
            // Solo proceder con el flujo normal de activación
          }
        } else if (hasEncryptionPassword && !supabaseService.hasEncryptionPassword()) {
          // Tiene contraseña configurada en Supabase pero no está cargada en memoria
          // Esto puede pasar si es un nuevo dispositivo o se limpió el localStorage
          // Intentar cargar desde Supabase primero
          const loaded = await supabaseService.loadEncryptionPasswordFromSupabase(user.id);
          if (loaded) {
            // Se cargó exitosamente, verificar PIN
            const securityConfig = await supabaseService.getSecurityConfig(user.id);
            if (!securityConfig || !securityConfig.security_pin) {
              setPendingModuleId(moduleId);
              setShowPinSetupModal(true);
              return;
            } else {
              // Ya tiene PIN y contraseña cargada, pero NO activar automáticamente
              // El usuario debe activar el módulo manualmente
              // Solo proceder con el flujo normal de activación
            }
          } else {
            // No se pudo cargar, pedir contraseña nuevamente
            setPendingModuleId(moduleId);
            setShowEncryptionPasswordModal(true);
            return;
          }
        } else {
          // No tiene contraseña configurada, pedir PIN primero
          setPendingModuleId(moduleId);
          setShowPinSetupModal(true);
          return;
        }
      } catch (error) {
        console.error('Error checking encryption password:', error);
        // En caso de error, proceder con el flujo normal (pedir PIN)
        setPendingModuleId(moduleId);
        setShowPinSetupModal(true);
        return;
      }
    }
    
    if (!mod.active) {
      const updatedModules = modules.map(m => m.id === moduleId ? { ...m, active: true } : m);
      setModules(updatedModules);
      
      try {
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
    if (!mod || mod.active) return;

    try {
      // Guardar PIN en la configuración de seguridad
      await supabaseService.updateSecurityConfig(user.id, { security_pin: trimmedPin });
      setSecurityPin(trimmedPin);
      
      // Cerrar modal de PIN
      setShowPinSetupModal(false);
      
      // Verificar si ya tiene contraseña de encriptación configurada
      const hasEncryptionPassword = await supabaseService.hasEncryptionPasswordConfigured(user.id);
      
      if (hasEncryptionPassword && supabaseService.hasEncryptionPassword()) {
        // Ya tiene contraseña configurada y cargada, activar módulo directamente
        const updatedModules = modules.map(m => m.id === pendingModuleId ? { ...m, active: true } : m);
        setModules(updatedModules);
        await supabaseService.updateModule(user.id, pendingModuleId, { active: true });
        setPendingModuleId(null);
      } else if (hasEncryptionPassword && !supabaseService.hasEncryptionPassword()) {
        // Tiene contraseña configurada en Supabase pero no está cargada en memoria
        // Intentar cargar desde Supabase primero
        const loaded = await supabaseService.loadEncryptionPasswordFromSupabase(user.id);
        if (loaded) {
          // Se cargó exitosamente, activar módulo directamente
          const updatedModules = modules.map(m => m.id === pendingModuleId ? { ...m, active: true } : m);
          setModules(updatedModules);
          await supabaseService.updateModule(user.id, pendingModuleId, { active: true });
          setPendingModuleId(null);
        } else {
          // No se pudo cargar, pedir contraseña nuevamente
          setShowEncryptionPasswordModal(true);
        }
      } else {
        // No tiene contraseña configurada, pedirla
        setShowEncryptionPasswordModal(true);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al configurar la seguridad. Intenta nuevamente.';
      console.error('Error setting up security:', error);
      alert(errorMessage);
    }
  };

  const handleEncryptionPasswordSetup = async (password: string, confirmPassword: string) => {
    if (!user || !pendingModuleId) return;

    if (password.length < 8) {
      alert('La contraseña de encriptación debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      // Guardar contraseña de encriptación en Supabase
      await supabaseService.setEncryptionPasswordFromUser(user.id, password);
      
      // Activar el módulo
      const updatedModules = modules.map(m => m.id === pendingModuleId ? { ...m, active: true } : m);
      setModules(updatedModules);
      await supabaseService.updateModule(user.id, pendingModuleId, { active: true });
      
      setShowEncryptionPasswordModal(false);
      setPendingModuleId(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al configurar la contraseña de encriptación. Intenta nuevamente.';
      console.error('Error setting up encryption password:', error);
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

  const handleAddJournalEntry = async (entry: JournalEntry | Omit<JournalEntry, 'id'>) => {
    if (!user) return;
    
    try {
      // Si la entrada ya tiene un ID de UUID (fue creada en DiaryModule con fotos),
      // solo agregarla al estado sin volver a crearla en la BD
      const entryWithId = entry as JournalEntry;
      const isUUID = entryWithId.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryWithId.id);
      
      // Verificar si la entrada ya existe en el estado para evitar duplicados
      if (entryWithId.id) {
        const existingEntry = journalEntries.find(e => e.id === entryWithId.id);
        if (existingEntry) {
          console.warn('Entrada ya existe en el estado, evitando duplicado:', entryWithId.id);
          return;
        }
      }
      
      if (isUUID) {
        // La entrada ya fue creada en la BD, solo actualizar el estado local
        setJournalEntries(prev => {
          // Verificar nuevamente antes de agregar (por si acaso el estado cambió)
          const exists = prev.find(e => e.id === entryWithId.id);
          if (exists) {
            console.warn('Entrada ya existe, evitando duplicado:', entryWithId.id);
            return prev;
          }
          return [entryWithId, ...prev];
        });
      } else {
        // Crear nueva entrada en la BD
        const created = await supabaseService.createJournalEntry(user.id, entry);
        
        // Verificar que no exista antes de agregar
        setJournalEntries(prev => {
          const exists = prev.find(e => e.id === created.id);
          if (exists) {
            console.warn('Entrada ya existe, evitando duplicado:', created.id);
            return prev;
          }
          return [created, ...prev];
        });
      }
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
    // Función mantenida para compatibilidad, sin lógica de esencia
  };

  const handleAddEssence = async (amount: number) => {
    // Función mantenida para compatibilidad, sin lógica de esencia
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
        }
        
        // Cerrar el modal y navegar al Dashboard
        setShowOnboarding(false);
        setActiveView(NavView.DASHBOARD);
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
        
        
        // Recargar el perfil actualizado
        const updatedProfile = await supabaseService.getProfile(user.id);
        
        // Actualizar el estado local
        if (updatedProfile) {
          setUserProfile(updatedProfile);
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
    balanzaProTransactions,
    nutritionEntries,
    nutritionGoals,
    nutritionCorrelations,
    exams,
    examResults,
  });

  // Solo mostrar loading en la carga inicial - nunca después para no interrumpir la UX
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-[#FFE4E9]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E35B8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cinzel text-[#2D1A26] text-xl">Cargando...</p>
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
            showLoginModal={showLoginModal}
            setShowLoginModal={setShowLoginModal}
            onAuthSuccess={handleAuthSuccess}
            isNightMode={isNightMode}
          />
        );
      case NavView.DASHBOARD_STATS:
        return (
          <DashboardStatsModule
            studentProfileContext={studentProfileContext}
            isMobile={isMobile}
            isNightMode={isNightMode}
            onNavigate={handleViewChange}
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
          studentProfileContext={studentProfileContext}
          isNightMode={isNightMode}
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
          isNightMode={isNightMode}
        />;
      case NavView.BALANZA:
        if (!user) {
          setShowLoginModal(true);
          return null;
        }
        return <BalanzaModule 
          userId={user.id}
          isMobile={isMobile}
          isNightMode={isNightMode}
        />;
      case NavView.FOCUS:
        return <FocusModule 
          subjects={subjects} 
          onUpdateSubject={updateSubject} 
          onAddCalendarEvent={handleAddCalendarEvent}
          isMobile={isMobile}
          userId={user?.id}
          focusState={focusState}
          onFocusStateChange={setFocusState}
          isNightMode={isNightMode}
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
          isNightMode={isNightMode}
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
          isNightMode={isNightMode}
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
          isNightMode={isNightMode}
        />;
      case NavView.PRIVACY_POLICY:
        return <PrivacyPolicy 
          onBack={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
          isNightMode={isNightMode}
        />;
      case NavView.TERMS_OF_SERVICE:
        return <TermsOfService 
          onBack={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
          isNightMode={isNightMode}
        />;
      case NavView.DOCS:
        return <DocsPage 
          onBack={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
          isNightMode={isNightMode}
        />;
      case NavView.PREMIUM:
        return <PremiumPage 
          user={user}
          userProfile={userProfile}
          isNightMode={isNightMode}
          onSubscribe={async () => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            try {
              const { url } = await supabaseService.createCheckoutSession(user.id);
              window.location.href = url;
            } catch (error: any) {
              console.error('Error creating checkout session:', error);
              alert('Error al crear la sesión de pago. Por favor, intenta nuevamente.');
            }
          }}
        />;
      case NavView.BAZAR:
        return <BazarModule 
          isMobile={isMobile}
          isNightMode={isNightMode}
          onPurchaseModule={toggleModule}
          userModules={modules}
          onNavigateToCalculator={() => setActiveView(NavView.CALCULATOR)}
          onNavigateToExamGenerator={() => setActiveView(NavView.EXAM_GENERATOR)}
          onNavigateToNutrition={() => setActiveView(NavView.NUTRITION)}
        />;
      case NavView.CALCULATOR:
        return <CalculatorModule 
          isMobile={isMobile}
          isNightMode={isNightMode}
          onFloatingMode={() => setShowCalculatorFloating(true)}
        />;
      case NavView.EXAM_GENERATOR:
        if (!user) {
          setShowLoginModal(true);
          return null;
        }
        return <ExamGeneratorModule 
          subjects={subjects}
          isMobile={isMobile}
          isNightMode={isNightMode}
        />;
      case NavView.NUTRITION:
        if (!user) {
          setShowLoginModal(true);
          return null;
        }
        return <NutritionModule 
          userId={user.id}
          isMobile={isMobile}
          isNightMode={isNightMode}
          onNavigateToBazar={() => setActiveView(NavView.BAZAR)}
        />;
      case NavView.PAYMENT_SUCCESS:
        return <PaymentSuccessPage 
          onEnter={() => handleViewChange(NavView.DASHBOARD)}
          isMobile={isMobile}
          isNightMode={isNightMode}
        />;
      default:
        return <Dashboard 
          modules={modules} 
          onActivate={toggleModule} 
          isMobile={isMobile} 
          setActiveView={setActiveView}
          user={user}
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
          onAuthSuccess={handleAuthSuccess}
          isNightMode={isNightMode}
        />;
    }
  };

  // Ocultar navegación en páginas de políticas, docs, premium y pago exitoso
  const isPolicyPage = activeView === NavView.PRIVACY_POLICY || activeView === NavView.TERMS_OF_SERVICE || activeView === NavView.DOCS || activeView === NavView.PREMIUM || activeView === NavView.PAYMENT_SUCCESS;

  const handleNavigationClick = (view: NavView) => {
    // Si no hay usuario y se intenta acceder a un módulo que no sea Dashboard o páginas públicas, mostrar login
    if (!user && view !== NavView.DASHBOARD && view !== NavView.PRIVACY_POLICY && view !== NavView.TERMS_OF_SERVICE && view !== NavView.DOCS && view !== NavView.PREMIUM) {
      setShowLoginModal(true);
      return;
    }
    
    // Usar handleViewChange para políticas, docs y premium, setActiveView normal para otras vistas
    if (view === NavView.PRIVACY_POLICY || view === NavView.TERMS_OF_SERVICE || view === NavView.DOCS || view === NavView.PREMIUM) {
      handleViewChange(view);
    } else {
      setActiveView(view);
    }
  };

  // Función para toggle del sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-screen w-screen overflow-hidden transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
    }`}>
      {/* Mobile Top Bar - Solo visible en mobile */}
      {isMobile && !isPolicyPage && (
        <MobileTopBar
          user={user}
          userProfile={userProfile}
          onProfileClick={() => handleNavigationClick(NavView.PROFILE)}
          isNightMode={isNightMode}
          toggleTheme={toggleTheme}
        />
      )}

      {/* Desktop Sidebar - Oculto en mobile */}
      {!isMobile && !isPolicyPage && (
        <>
          <Navigation 
            activeView={activeView} 
            setActiveView={handleNavigationClick} 
            isMobile={false}
            modules={modules}
            user={user}
            userProfile={userProfile}
            isNightMode={isNightMode}
            toggleTheme={toggleTheme}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
          {/* Botón flotante para expandir sidebar cuando está colapsado */}
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className={`fixed left-4 top-4 z-[60] p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 backdrop-blur-sm ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.9)] text-[#A68A56] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,1)]'
                  : 'bg-white/90 text-[#4A233E] border border-[#F8C8DC] hover:bg-white'
              }`}
              aria-label="Mostrar navegación"
            >
              {getIcon('menu', 'w-6 h-6')}
            </button>
          )}
        </>
      )}
      
      {/* Área de contenido principal */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pt-16 pb-28' : ''} transition-all duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
      }`}>
        <main className={`flex-1 relative overflow-y-auto ${isPolicyPage ? '' : 'p-4 md:p-8'} ${isMobile && !isPolicyPage ? 'pt-4' : ''} transition-all duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
        } ${!isMobile && sidebarCollapsed ? 'max-w-7xl mx-auto w-full' : ''}`}>
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation - Solo visible en mobile */}
      {isMobile && !isPolicyPage && (
        <Navigation 
          activeView={activeView}
          setActiveView={handleNavigationClick} 
          isMobile={true}
          modules={modules}
          user={user}
          userProfile={userProfile}
          isNightMode={isNightMode}
          toggleTheme={toggleTheme}
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

      {showEncryptionPasswordModal && (
        <EncryptionPasswordModal
          onSetup={handleEncryptionPasswordSetup}
          onCancel={() => {
            setShowEncryptionPasswordModal(false);
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
          isNightMode={isNightMode}
        />
      )}

      {/* Widget Flotante de Calculadora */}
      {showCalculatorFloating && (
        <CalculatorFloatingWidget
          isMobile={isMobile}
          isNightMode={isNightMode}
          onClose={() => setShowCalculatorFloating(false)}
        />
      )}

      {/* Modal de Onboarding */}
      {showOnboarding && user && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          isMobile={isMobile}
        />
      )}

      {/* Banner de Consentimiento de Cookies */}
      <CookieConsentBanner isNightMode={isNightMode} />

      {/* Modal de Login Global - Se muestra desde cualquier vista */}
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
                handleAuthSuccess();
                setShowLoginModal(false);
              }}
              isMobile={isMobile}
              isNightMode={isNightMode}
            />
          </div>
        </div>
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
          <h3 className="font-cinzel text-3xl lg:text-3xl text-[#2D1A26] mb-2">Configurar PIN de Seguridad</h3>
          <p className="font-garamond text-[#8B5E75] text-base">
            {isConfirming ? 'Confirma tu PIN' : 'Establece un PIN de 4 dígitos para proteger tus entradas bloqueadas'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {!isConfirming ? (
            <div>
              <label className="block text-base font-cinzel text-[#2D1A26] mb-2">PIN</label>
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
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 text-center text-3xl font-cinzel font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
                      pin.length > index
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#2D1A26]'
                        : 'border-[#F8C8DC] bg-white/40 text-[#8B5E75]/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-base font-cinzel text-[#2D1A26] mb-2">Confirmar PIN</label>
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
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 text-center text-3xl font-cinzel font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
                      confirmPin.length > index
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#2D1A26]'
                        : 'border-[#F8C8DC] bg-white/40 text-[#8B5E75]/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-base text-center font-garamond">{error}</p>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#2D1A26] font-cinzel text-xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-base font-black hover:bg-[#FFF0F5] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#2D1A26] font-cinzel text-xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
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
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-base font-black hover:bg-[#FFF0F5] transition-all"
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
              className="flex-1 py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
            >
              Atrás
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
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
              className="flex-1 py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest bg-[#D4AF37] text-[#2D1A26] hover:bg-[#C9A030] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente Modal de Configuración de Contraseña de Encriptación
const EncryptionPasswordModal: React.FC<{ 
  onSetup: (password: string, confirmPassword: string) => void; 
  onCancel: () => void 
}> = ({ onSetup, onCancel }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Auto-focus en el campo de contraseña cuando se abre el modal
  useEffect(() => {
    if (passwordRef.current && !isConfirming) {
      passwordRef.current.focus();
    } else if (confirmPasswordRef.current && isConfirming) {
      confirmPasswordRef.current.focus();
    }
  }, [isConfirming]);

  // Removido: No pasar automáticamente a confirmación
  // El usuario debe hacer clic en "Continuar" para pasar a la confirmación

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setError('');
  };

  const handleSubmit = () => {
    if (!isConfirming) {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      setIsConfirming(true);
      setTimeout(() => {
        confirmPasswordRef.current?.focus();
      }, 100);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setError('');
    onSetup(password, confirmPassword);
  };

  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; text: string } => {
    if (pwd.length < 8) return { strength: 'weak', text: 'Débil' };
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { strength: 'strong', text: 'Fuerte' };
    }
    return { strength: 'medium', text: 'Media' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" 
      onClick={onCancel}
    >
      <div 
        className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-md w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4A233E]/10 flex items-center justify-center">
            {getIcon('lock', 'w-8 h-8 text-[#D4AF37]')}
          </div>
          <h3 className="font-cinzel text-3xl lg:text-3xl text-[#2D1A26] mb-2">
            {isConfirming ? 'Confirmar Contraseña' : 'Contraseña de Encriptación'}
          </h3>
          <p className="font-garamond text-[#8B5E75] text-base">
            {isConfirming 
              ? 'Confirma tu contraseña de encriptación' 
              : 'Establece una contraseña para proteger tus datos en la nube. Esta contraseña se sincronizará entre todos tus dispositivos.'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {!isConfirming ? (
            <>
              <div>
                <label className="block text-sm font-garamond text-[#2D1A26] mb-2">
                  Contraseña (mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && password.length >= 8) {
                        handleSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F8C8DC] focus:border-[#D4AF37] focus:outline-none font-garamond text-[#2D1A26]"
                    placeholder="Ingresa tu contraseña"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5E75] hover:text-[#E35B8F]"
                  >
                    {showPassword ? getIcon('eye-off', 'w-5 h-5') : getIcon('eye', 'w-5 h-5')}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`flex-1 h-2 rounded-full ${
                        passwordStrength.strength === 'weak' ? 'bg-red-300' :
                        passwordStrength.strength === 'medium' ? 'bg-yellow-300' :
                        'bg-green-300'
                      }`} />
                      <span className={`text-xs font-garamond ${
                        passwordStrength.strength === 'weak' ? 'text-red-600' :
                        passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-garamond text-[#2D1A26] mb-2">
                  Confirma tu contraseña
                </label>
                <div className="relative">
                  <input
                    ref={confirmPasswordRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F8C8DC] focus:border-[#D4AF37] focus:outline-none font-garamond text-[#2D1A26]"
                    placeholder="Confirma tu contraseña"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5E75] hover:text-[#E35B8F]"
                  >
                    {showConfirmPassword ? getIcon('eye-off', 'w-5 h-5') : getIcon('eye', 'w-5 h-5')}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 font-garamond">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm font-garamond">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-[#2D1A26] font-cinzel font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isConfirming ? password.length < 8 : password !== confirmPassword || confirmPassword.length < 8}
            className={`flex-1 py-3 rounded-xl font-cinzel font-bold transition-all active:scale-95 ${
              (!isConfirming ? password.length < 8 : password !== confirmPassword || confirmPassword.length < 8)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#D4AF37] text-[#2D1A26] hover:bg-[#C9A030]'
            }`}
          >
            {isConfirming ? 'Confirmar' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
