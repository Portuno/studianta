
import React, { useState, useMemo } from 'react';
import { Subject, Transaction, Schedule } from '../types';
import { getIcon, COLORS } from '../constants';

interface CalendarModuleProps {
  subjects: Subject[];
  transactions: Transaction[];
  isMobile: boolean;
}

interface ConvergenceEvent {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: 'class' | 'milestone' | 'finance' | 'focus';
  priority: 'low' | 'high';
  color: string;
}

const CalendarModule: React.FC<CalendarModuleProps> = ({ subjects, transactions, isMobile }) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>(isMobile ? 'day' : 'week');
  const [anchorDate, setAnchorDate] = useState(new Date());

  // Navigation Logic
  const navigate = (direction: number) => {
    const next = new Date(anchorDate);
    if (view === 'day') next.setDate(next.getDate() + direction);
    else if (view === 'week') next.setDate(next.getDate() + (direction * 7));
    else if (view === 'month') next.setMonth(next.getMonth() + direction);
    setAnchorDate(next);
  };

  // Convergence Logic: Map everything to a unified timeline
  const getEventsForDate = (date: Date): ConvergenceEvent[] => {
    const events: ConvergenceEvent[] = [];
    const dateStr = date.toDateString();
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const normalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // 1. Map recurring classes from schedules
    subjects.forEach(subject => {
      // Check if the date is within term start and end
      const dTime = date.getTime();
      const tStart = subject.termStart ? new Date(subject.termStart).getTime() : 0;
      const tEnd = subject.termEnd ? new Date(subject.termEnd).getTime() : Infinity;

      if (dTime >= tStart && dTime <= tEnd) {
        subject.schedules.forEach(sched => {
          if (sched.day === normalizedDayName) {
            events.push({
              id: `${subject.id}-${sched.id}`,
              title: subject.name,
              subtitle: `Aula: ${subject.room || 'TBA'} • ${sched.startTime} - ${sched.endTime}`,
              date: date,
              type: 'class',
              priority: 'low',
              color: COLORS.mauve
            });
          }
        });
      }

      // 2. Map one-time milestones (Exams/Deliveries)
      subject.milestones.forEach(m => {
        const mDate = new Date(m.date);
        if (mDate.toDateString() === dateStr) {
          const diffHours = (mDate.getTime() - new Date().getTime()) / (1000 * 3600);
          events.push({
            id: m.id,
            title: m.title,
            subtitle: subject.name,
            date: mDate,
            type: 'milestone',
            priority: diffHours <= 48 && diffHours >= -24 ? 'high' : 'low',
            color: m.type === 'Examen' ? COLORS.gold : COLORS.primary
          });
        }
      });
    });

    // 3. Map Finance (Payments/Income)
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.toDateString() === dateStr) {
        events.push({
          id: t.id,
          title: t.category,
          subtitle: t.type === 'Gasto' ? 'Vencimiento Pago' : 'Ingreso',
          date: tDate,
          type: 'finance',
          priority: 'low',
          color: t.type === 'Gasto' ? COLORS.primary : COLORS.gold
        });
      }
    });

    return events;
  };

  const renderDayColumn = (date: Date, isExpanded = false) => {
    const events = getEventsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div 
        key={date.toDateString()} 
        className={`flex-1 flex flex-col min-w-[120px] md:min-w-0 border-r border-[#F8C8DC]/20 last:border-r-0 ${isToday ? 'bg-[#E35B8F]/5' : ''}`}
      >
        <div className={`p-4 text-center border-b border-[#F8C8DC]/20 ${isToday ? 'text-[#E35B8F]' : 'text-[#8B5E75]'}`}>
          <p className="text-[10px] uppercase font-black tracking-widest opacity-60">
            {date.toLocaleDateString('es-ES', { weekday: 'short' })}
          </p>
          <p className={`font-cinzel text-lg mt-1 ${isToday ? 'font-black scale-110' : ''}`}>
            {date.getDate()}
          </p>
        </div>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] md:max-h-full">
          {events.length === 0 ? (
             <div className="h-full flex items-center justify-center opacity-10">
               {getIcon('sparkles', 'w-4 h-4')}
             </div>
          ) : (
            events.map(event => (
              <div 
                key={event.id} 
                className={`p-3 rounded-xl border-l-2 text-[10px] transition-all hover:scale-[1.02] shadow-sm font-inter ${
                  event.priority === 'high' 
                    ? 'bg-white border-l-[#D4AF37] shadow-[0_4px_10px_rgba(212,175,55,0.2)]' 
                    : 'bg-white/60 border-l-[#E35B8F]'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                   <span className="font-bold text-[#4A233E] truncate pr-1">{event.title}</span>
                   {event.priority === 'high' && <span className="text-[#D4AF37]">{getIcon('sparkles', 'w-2 h-2')}</span>}
                </div>
                <p className="text-[8px] opacity-70 truncate uppercase">{event.subtitle}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(anchorDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="flex-1 flex overflow-x-auto md:overflow-hidden bg-white/30">
        {days.map(d => renderDayColumn(d, true))}
      </div>
    );
  };

  const renderMonthGrid = () => {
    const startOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
    
    return (
      <div className="flex-1 grid grid-cols-7 border-t border-[#F8C8DC]/20">
        {Array.from({ length: 42 }).map((_, i) => {
          const dayNum = i - (startDay === 0 ? 6 : startDay - 1);
          const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), dayNum + 1);
          const events = dayNum >= 0 && dayNum < daysInMonth ? getEventsForDate(date) : [];
          const isToday = date.toDateString() === new Date().toDateString();
          const isOutside = dayNum < 0 || dayNum >= daysInMonth;

          return (
            <div 
              key={i} 
              onClick={() => { if(!isOutside) { setAnchorDate(date); setView('day'); } }}
              className={`p-2 border-r border-b border-[#F8C8DC]/20 min-h-[80px] md:min-h-[120px] transition-colors cursor-pointer ${isOutside ? 'opacity-20 bg-black/5' : 'hover:bg-[#FFF0F5]'}`}
            >
              <span className={`text-[10px] md:text-sm font-cinzel ${isToday ? 'bg-[#E35B8F] text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md' : 'text-[#8B5E75]'}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {events.slice(0, 2).map(e => (
                  <div key={e.id} className={`h-1 rounded-full ${e.priority === 'high' ? 'bg-[#D4AF37]' : 'bg-[#E35B8F]'}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayFocus = () => {
    const events = getEventsForDate(anchorDate);
    return (
      <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-gradient-to-b from-white/40 to-transparent">
        <div className="mb-8 border-b border-[#F8C8DC] pb-4">
          <h2 className="font-cinzel text-3xl text-[#4A233E]">{anchorDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</h2>
          <p className="text-sm text-[#8B5E75] uppercase tracking-widest mt-1">Sincronización Diaria</p>
        </div>
        {events.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-30 text-center">
            <div className="w-16 h-16 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-4">
              {getIcon('compass', 'w-8 h-8')}
            </div>
            <p className="font-garamond italic text-xl">"El campo operativo está en calma absoluta."</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div 
                key={event.id}
                className={`glass-card p-6 rounded-[2rem] border-l-4 flex items-center justify-between group transition-all duration-500 hover:translate-x-2 font-inter ${
                  event.priority === 'high' ? 'border-l-[#D4AF37] shadow-[0_10px_30px_rgba(212,175,55,0.15)]' : 'border-l-[#E35B8F]'
                }`}
              >
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${event.color}15`, color: event.color }}>
                      {event.type === 'milestone' ? getIcon('calendar', 'w-6 h-6') : event.type === 'finance' ? getIcon('scale', 'w-6 h-6') : getIcon('book', 'w-6 h-6')}
                   </div>
                   <div>
                     <h4 className="font-bold text-[#4A233E]">{event.title}</h4>
                     <p className="text-xs text-[#8B5E75] uppercase tracking-wider">{event.subtitle}</p>
                   </div>
                </div>
                {event.priority === 'high' && (
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <span className="text-[10px] font-black uppercase tracking-tighter">Inercia Crítica</span>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pb-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] hover:bg-[#E35B8F] hover:text-white transition-all">
              <div className="rotate-180">{getIcon('chevron', 'w-5 h-5')}</div>
            </button>
            <button onClick={() => navigate(1)} className="w-10 h-10 rounded-full border border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] hover:bg-[#E35B8F] hover:text-white transition-all">
              {getIcon('chevron', 'w-5 h-5')}
            </button>
          </div>
          <div>
            <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-[#4A233E] capitalize">
              {anchorDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-[10px] text-[#8B5E75] uppercase tracking-widest font-bold">Astrolabio de Convergencia</p>
          </div>
        </div>

        <div className="flex gap-1 bg-[#FFD1DC]/30 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {(['month', 'week', 'day'] as const).map(v => (
            <button 
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-cinzel text-[9px] uppercase tracking-widest transition-all ${view === v ? 'bg-[#E35B8F] text-white shadow-lg shadow-pink-200' : 'text-[#8B5E75]'}`}
            >
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 glass-card rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl relative">
        {view === 'month' ? (
          <>
            <div className="grid grid-cols-7 bg-[#4A233E] text-white py-3">
               {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                 <div key={d} className="text-center text-[9px] uppercase tracking-widest font-black opacity-50">{d}</div>
               ))}
            </div>
            {renderMonthGrid()}
          </>
        ) : view === 'week' ? (
          renderWeekView()
        ) : (
          renderDayFocus()
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 px-4 font-inter">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
          <span className="text-[9px] uppercase font-bold text-[#8B5E75] tracking-widest">Inercia Crítica</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E35B8F]" />
          <span className="text-[9px] uppercase font-bold text-[#8B5E75] tracking-widest">Compromiso Académico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-[#F8C8DC]" />
          <span className="text-[9px] uppercase font-bold text-[#8B5E75] tracking-widest">Fluidez Operativa</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarModule;
