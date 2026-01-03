import React, { useState, useEffect, useRef } from 'react';
import { NavView, Subject, Module, Transaction, JournalEntry, CustomCalendarEvent } from './types';
import { INITIAL_MODULES } from './constants';
import { supabaseService, supabase, UserProfile } from './services/supabaseService';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import SubjectsModule from './components/SubjectsModule';
import CalendarModule from './components/CalendarModule';
import FinanceModule from './components/FinanceModule';
import FocusModule from './components/FocusModule';
import DiaryModule from './components/DiaryModule';
import AuthModule from './components/AuthModule';
import ProfileModule from './components/ProfileModule';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true); // Solo para la carga inicial
  const [activeView, setActiveView] = useState<NavView>(NavView.DASHBOARD);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [essence, setEssence] = useState<number>(500);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
          setEssence(500);
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
      const profile = await supabaseService.getProfile(userId);
      if (profile) {
        setEssence(profile.essence);
        setUserProfile(profile);
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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

  const toggleModule = async (moduleId: string) => {
    // Si no hay usuario, mostrar modal de login
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
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

  const updateSubject = async (updated: Subject) => {
    if (!user) return;
    
    setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
    
    try {
      await supabaseService.updateSubject(user.id, updated.id, updated);
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
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    if (!user) return;
    
    setCustomEvents(customEvents.filter(e => e.id !== id));
    
    try {
      await supabaseService.deleteCalendarEvent(user.id, id);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
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

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
            essence={user ? essence : 500}
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
        />;
      case NavView.CALENDAR:
        return <CalendarModule 
          subjects={subjects} 
          transactions={transactions} 
          journalEntries={journalEntries} 
          customEvents={customEvents}
          onAddCustomEvent={handleAddCalendarEvent}
          onDeleteCustomEvent={handleDeleteCalendarEvent}
          isMobile={isMobile} 
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
        />;
      case NavView.DIARY:
        return <DiaryModule 
          entries={journalEntries} 
          onAddEntry={handleAddJournalEntry} 
          onDeleteEntry={handleDeleteJournalEntry}
          onUpdateEntry={handleUpdateJournalEntry}
          isMobile={isMobile} 
        />;
      case NavView.PROFILE:
        return <ProfileModule 
          user={user} 
          onAuthSuccess={handleAuthSuccess} 
          onSignOut={handleSignOut}
          isMobile={isMobile} 
        />;
      default:
        return <Dashboard modules={modules} onActivate={toggleModule} isMobile={isMobile} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-screen w-screen overflow-hidden`}>
      {!isMobile && (
        <Navigation 
          activeView={activeView} 
          setActiveView={(view) => {
            // Si no hay usuario y se intenta acceder a un módulo que no sea Dashboard, mostrar login
            if (!user && view !== NavView.DASHBOARD && view !== NavView.PROFILE) {
              setShowLoginModal(true);
            } else {
              setActiveView(view);
            }
          }} 
          essence={user ? essence : 500} 
          isMobile={false}
          modules={modules}
          user={user}
          userProfile={userProfile}
        />
      )}
      
      <main className={`flex-1 relative overflow-y-auto p-4 md:p-8 ${isMobile ? 'pb-32' : 'pb-8'}`}>
        {renderView()}
      </main>

      {isMobile && (
        <Navigation 
          activeView={activeView}
          setActiveView={(view) => {
            // Si no hay usuario y se intenta acceder a un módulo que no sea Dashboard, mostrar login
            if (!user && view !== NavView.DASHBOARD && view !== NavView.PROFILE) {
              setShowLoginModal(true);
            } else {
              setActiveView(view);
            }
          }} 
          essence={user ? essence : 500} 
          isMobile={true}
          modules={modules}
          user={user}
          userProfile={userProfile}
        />
      )}
    </div>
  );
};

export default App;
