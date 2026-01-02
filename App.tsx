
import React, { useState, useEffect } from 'react';
import { NavView, Subject, Module, Transaction, JournalEntry, CustomCalendarEvent } from './types';
import { INITIAL_MODULES } from './constants';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import SubjectsModule from './components/SubjectsModule';
import CalendarModule from './components/CalendarModule';
import FinanceModule from './components/FinanceModule';
import FocusModule from './components/FocusModule';
import DiaryModule from './components/DiaryModule';

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
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('studianta_budget');
    return saved ? parseFloat(saved) : 0;
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('studianta_journal');
    return saved ? JSON.parse(saved) : [];
  });
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>(() => {
    const saved = localStorage.getItem('studianta_calendar_custom');
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
    localStorage.setItem('studianta_budget', monthlyBudget.toString());
    localStorage.setItem('studianta_journal', JSON.stringify(journalEntries));
    localStorage.setItem('studianta_calendar_custom', JSON.stringify(customEvents));
  }, [subjects, modules, essence, transactions, monthlyBudget, journalEntries, customEvents]);

  const toggleModule = (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    if (!mod.active && essence >= mod.cost) {
      setEssence(prev => prev - mod.cost);
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, active: true } : m));
    }
  };

  const updateSubject = (updated: Subject) => {
    setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
  };

  const renderView = () => {
    switch (activeView) {
      case NavView.DASHBOARD:
        return <Dashboard modules={modules} onActivate={toggleModule} isMobile={isMobile} setActiveView={setActiveView} />;
      case NavView.SUBJECTS:
        return <SubjectsModule 
          subjects={subjects} 
          onAdd={(n, c) => setSubjects([...subjects, { id: Math.random().toString(36).substr(2, 9), name: n, career: c, status: 'Cursando', absences: 0, maxAbsences: 20, milestones: [], schedules: [], notes: [], materials: [] }])} 
          onDelete={(id) => setSubjects(subjects.filter(s => s.id !== id))} 
          onUpdate={updateSubject} 
          isMobile={isMobile} 
          onMaterialUpload={() => setEssence(prev => prev + 5)} 
        />;
      case NavView.CALENDAR:
        return <CalendarModule 
          subjects={subjects} 
          transactions={transactions} 
          journalEntries={journalEntries} 
          customEvents={customEvents}
          onAddCustomEvent={(e) => setCustomEvents([...customEvents, e])}
          onDeleteCustomEvent={(id) => setCustomEvents(customEvents.filter(ev => ev.id !== id))}
          isMobile={isMobile} 
        />;
      case NavView.FINANCE:
        return <FinanceModule 
          transactions={transactions} 
          budget={monthlyBudget}
          onUpdateBudget={setMonthlyBudget}
          onAdd={(t) => setTransactions([...transactions, t])} 
          onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))}
          onUpdate={(t) => setTransactions(transactions.map(item => item.id === t.id ? t : item))}
          isMobile={isMobile} 
        />;
      case NavView.FOCUS:
        return <FocusModule subjects={subjects} onUpdateSubject={updateSubject} onAddEssence={(amt) => setEssence(prev => prev + amt)} isMobile={isMobile} />;
      case NavView.DIARY:
        return <DiaryModule 
          entries={journalEntries} 
          onAddEntry={(e) => setJournalEntries([e, ...journalEntries])} 
          onDeleteEntry={(id) => setJournalEntries(journalEntries.filter(entry => entry.id !== id))}
          onUpdateEntry={(e) => setJournalEntries(journalEntries.map(entry => entry.id === e.id ? e : entry))}
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
          setActiveView={setActiveView} 
          essence={essence} 
          isMobile={false}
          modules={modules}
        />
      )}
      
      <main className={`flex-1 relative overflow-y-auto p-4 md:p-8 ${isMobile ? 'pb-32' : 'pb-8'}`}>
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
