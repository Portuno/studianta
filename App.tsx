
import React, { useState, useEffect } from 'react';
import { NavView, Subject, Module, Transaction } from './types';
import { INITIAL_MODULES } from './constants';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import SubjectsModule from './components/SubjectsModule';
import CalendarModule from './components/CalendarModule';
import FinanceModule from './components/FinanceModule';
import FocusModule from './components/FocusModule';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<NavView>(NavView.DASHBOARD);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('studianta_subjects');
    return saved ? JSON.parse(saved) : [];
  });
  const [modules, setModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('studianta_modules');
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
  });
  const [essence, setEssence] = useState<number>(() => {
    const saved = localStorage.getItem('studianta_essence');
    return saved ? parseInt(saved) : 500;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('studianta_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('studianta_subjects', JSON.stringify(subjects));
    localStorage.setItem('studianta_modules', JSON.stringify(modules));
    localStorage.setItem('studianta_essence', essence.toString());
    localStorage.setItem('studianta_transactions', JSON.stringify(transactions));
  }, [subjects, modules, essence, transactions]);

  const toggleModule = (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;

    if (!mod.active && essence >= mod.cost) {
      setEssence(prev => prev - mod.cost);
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, active: true } : m));
    }
  };

  const addSubject = (name: string, career: string) => {
    const newSubject: Subject = {
      id: Math.random().toString(36).substring(7),
      name,
      career,
      status: 'Cursando',
      absences: 0,
      maxAbsences: 20,
      milestones: [],
      schedules: [],
      notes: [],
      materials: []
    };
    setSubjects([...subjects, newSubject]);
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubject = (updated: Subject) => {
    // Reward for completion
    const old = subjects.find(s => s.id === updated.id);
    if (old && old.status !== 'Aprobada' && updated.status === 'Aprobada') {
      setEssence(prev => prev + 50);
    }
    setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
  };

  const rewardMaterialUpload = () => {
    setEssence(prev => prev + 5);
  };

  const renderView = () => {
    switch (activeView) {
      case NavView.DASHBOARD:
        return <Dashboard modules={modules} onActivate={toggleModule} isMobile={isMobile} setActiveView={setActiveView} />;
      case NavView.SUBJECTS:
        return <SubjectsModule subjects={subjects} onAdd={addSubject} onDelete={deleteSubject} onUpdate={updateSubject} isMobile={isMobile} onMaterialUpload={rewardMaterialUpload} />;
      case NavView.CALENDAR:
        return <CalendarModule subjects={subjects} transactions={transactions} isMobile={isMobile} />;
      case NavView.FINANCE:
        return <FinanceModule transactions={transactions} onAdd={(t) => setTransactions([...transactions, t])} isMobile={isMobile} />;
      case NavView.FOCUS:
        return <FocusModule subjects={subjects} onUpdateSubject={updateSubject} onAddEssence={(amt) => setEssence(prev => prev + amt)} isMobile={isMobile} />;
      case NavView.PROFILE:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in zoom-in duration-700">
             <div className="glass-card p-10 rounded-[3rem] border-[#D4AF37] border-2 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E35B8F] via-[#D4AF37] to-[#E35B8F]" />
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] mx-auto mb-6 border-4 border-white shadow-xl transform group-hover:scale-110 transition-transform duration-500" />
                <h2 className="font-cinzel text-3xl font-black text-[#4A233E] uppercase tracking-widest mb-2">Académica Real</h2>
                <p className="font-garamond italic text-[#8B5E75] mb-6">"El conocimiento es la corona más resplandeciente."</p>
                <div className="grid grid-cols-2 gap-4 text-left border-t border-[#F8C8DC] pt-6">
                   <div>
                     <p className="text-[10px] uppercase font-bold tracking-tighter text-[#8B5E75]">Rango</p>
                     <p className="font-cinzel text-sm font-bold text-[#4A233E]">Buscadora de Luz</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase font-bold tracking-tighter text-[#8B5E75]">Esencia</p>
                     <p className="font-cinzel text-sm font-bold text-[#D4AF37]">{essence}</p>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => setActiveView(NavView.DASHBOARD)} 
                className="mt-8 text-xs font-cinzel text-[#8B5E75] hover:text-[#E35B8F] tracking-widest uppercase transition-colors"
             >
               Volver al Atanor
             </button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <h2 className="font-cinzel text-2xl md:text-3xl mb-4 uppercase tracking-[0.3em]">Módulo Arcano</h2>
            <p className="max-w-md text-sm md:text-base font-inter">Este santuario de conocimiento está siendo esculpido por los arquitectos celestiales.</p>
            <button 
                onClick={() => setActiveView(NavView.DASHBOARD)} 
                className="mt-8 text-[10px] font-cinzel text-[#8B5E75] hover:text-[#E35B8F] tracking-widest uppercase"
             >
               Regresar al Atanor
             </button>
          </div>
        );
    }
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-screen overflow-hidden`}>
      {!isMobile && (
        <Navigation 
          activeView={activeView} 
          setActiveView={setActiveView} 
          essence={essence} 
          isMobile={false}
          modules={modules}
        />
      )}
      
      <main className={`flex-1 relative overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8`}>
        {renderView()}
      </main>

      {isMobile && (
        <Navigation 
          activeView={activeView} 
          setActiveView={setActiveView} 
          essence={essence} 
          isMobile={true}
          modules={modules}
        />
      )}
    </div>
  );
};

export default App;
