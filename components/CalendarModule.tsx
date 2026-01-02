
import React, { useState } from 'react';
import { Subject, Transaction, JournalEntry, MoodType, CustomCalendarEvent } from '../types';
import { getIcon, COLORS } from '../constants';

interface CalendarModuleProps {
  subjects: Subject[];
  transactions: Transaction[];
  journalEntries?: JournalEntry[];
  customEvents?: CustomCalendarEvent[];
  onAddCustomEvent: (e: CustomCalendarEvent) => void;
  onDeleteCustomEvent: (id: string) => void;
  isMobile: boolean;
}

interface ConvergenceEvent {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: 'class' | 'milestone' | 'finance' | 'mood' | 'custom';
  priority: 'low' | 'high';
  color: string;
  moodIcon?: string;
  time?: string;
  amount?: number;
}

const MOOD_ICONS: Record<MoodType, string> = {
  'Radiante': 'sun',
  'Enfocada': 'target',
  'Equilibrada': 'wind',
  'Agotada': 'low-battery',
  'Estresada': 'storm'
};

const CalendarModule: React.FC<CalendarModuleProps> = ({ 
  subjects, 
  transactions, 
  journalEntries = [], 
  customEvents = [],
  onAddCustomEvent,
  onDeleteCustomEvent,
  isMobile 
}) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>(isMobile ? 'day' : 'week');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const navigate = (direction: number) => {
    const next = new Date(anchorDate);
    if (view === 'day') next.setDate(next.getDate() + direction);
    else if (view === 'week') next.setDate(next.getDate() + (direction * 7));
    else if (view === 'month') next.setMonth(next.getMonth() + direction);
    setAnchorDate(next);
  };

  const getEventsForDate = (date: Date): ConvergenceEvent[] => {
    const events: ConvergenceEvent[] = [];
    const dateStr = date.toDateString();
    const isoDateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const normalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    subjects.forEach(subject => {
      const dTime = date.getTime();
      const tStart = subject.termStart ? new Date(subject.termStart).getTime() : 0;
      const tEnd = subject.termEnd ? new Date(subject.termEnd).getTime() : Infinity;

      if (dTime >= tStart && dTime <= tEnd) {
        subject.schedules.forEach(sched => {
          if (sched.day === normalizedDayName) {
            events.push({
              id: `${subject.id}-${sched.id}`,
              title: subject.name,
              subtitle: `Clase • Aula: ${subject.room || 'Pendiente'}`,
              date: date,
              type: 'class',
              priority: 'low',
              color: COLORS.mauve,
              time: sched.startTime
            });
          }
        });
      }

      subject.milestones.forEach(m => {
        const mDate = new Date(m.date);
        if (mDate.toDateString() === dateStr) {
          const diffHours = (mDate.getTime() - new Date().getTime()) / (1000 * 3600);
          events.push({
            id: m.id,
            title: m.title,
            subtitle: `${subject.name} • ${m.type}`,
            date: mDate,
            type: 'milestone',
            priority: diffHours <= 48 && diffHours >= -24 ? 'high' : 'low',
            color: m.type === 'Examen' ? COLORS.gold : COLORS.primary,
            time: m.time
          });
        }
      });
    });

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.toDateString() === dateStr) {
        events.push({
          id: t.id,
          title: `${t.description}`,
          subtitle: `Finanzas • ${t.category}`,
          amount: t.amount,
          date: tDate,
          type: 'finance',
          priority: 'low',
          color: t.type === 'Gasto' ? COLORS.primary : COLORS.gold
        });
      }
    });

    journalEntries.forEach(entry => {
      if (entry.date === isoDateStr) {
        events.push({
          id: entry.id,
          title: `Estado Vital: ${entry.mood}`,
          subtitle: 'Bitácora Emocional',
          date: new Date(entry.date),
          type: 'mood',
          priority: 'low',
          color: '#E35B8F',
          moodIcon: MOOD_ICONS[entry.mood]
        });
      }
    });

    customEvents.forEach(ev => {
      if (ev.date === isoDateStr) {
        events.push({
          id: ev.id,
          title: ev.title,
          subtitle: ev.description || 'Hito Manual Personal',
          date: new Date(ev.date),
          type: 'custom',
          priority: ev.priority,
          color: ev.color,
          time: ev.time
        });
      }
    });

    return events.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  };

  const handleAddCustomEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEvent: CustomCalendarEvent = {
      id: Math.random().toString(36).substring(7),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: anchorDate.toISOString().split('T')[0],
      time: formData.get('time') as string,
      color: formData.get('color') as string,
      priority: formData.get('priority') as any || 'low'
    };
    onAddCustomEvent(newEvent);
    setShowAddEventModal(false);
  };

  const renderDayColumn = (date: Date) => {
    const events = getEventsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div 
        key={date.toDateString()} 
        className={`flex-1 flex flex-col min-w-[140px] md:min-w-0 border-r border-[#F8C8DC]/20 last:border-r-0 ${isToday ? 'bg-[#E35B8F]/5' : ''}`}
      >
        <div className={`p-6 text-center border-b border-[#F8C8DC]/20 ${isToday ? 'text-[#E35B8F]' : 'text-[#8B5E75]'}`}>
          <p className="text-[11px] uppercase font-black tracking-[0.25em] opacity-60">
            {date.toLocaleDateString('es-ES', { weekday: 'short' })}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className={`font-cinzel text-2xl ${isToday ? 'font-black scale-110' : ''}`}>
              {date.getDate()}
            </p>
            {events.find(e => e.type === 'mood') && (
              <div className="text-[#D4AF37]">
                {getIcon(events.find(e => e.type === 'mood')?.moodIcon || 'sun', 'w-5 h-5')}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[70vh] md:max-h-full scroll-sm">
          {events.length === 0 ? (
             <div className="h-full flex items-center justify-center opacity-10">
               {getIcon('sparkles', 'w-8 h-8')}
             </div>
          ) : (
            events.map(event => (
              <div 
                key={event.id} 
                className={`p-5 rounded-[1.5rem] border-l-4 text-[12px] transition-all hover:scale-[1.03] shadow-md font-inter group relative ${
                  event.type === 'mood' ? 'bg-[#FFF0F5]/50 border-l-[#D4AF37]' :
                  event.priority === 'high' 
                    ? 'bg-white border-l-[#D4AF37] shadow-xl' 
                    : 'bg-white/80 border-l-[#E35B8F]'
                }`}
                style={event.type === 'custom' ? { borderLeftColor: event.color } : {}}
              >
                <div className="flex justify-between items-start mb-2">
                   <span className="font-bold text-[#4A233E] truncate pr-1 text-sm">{event.title}</span>
                   {event.type === 'mood' ? (
                     <span className="text-[#D4AF37]">{getIcon(event.moodIcon!, 'w-4 h-4')}</span>
                   ) : event.priority === 'high' ? <span className="text-[#D4AF37]">{getIcon('sparkles', 'w-4 h-4 animate-pulse')}</span> : null}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-[#8B5E75] font-bold uppercase tracking-widest opacity-80">
                    {event.time ? `${event.time} • ` : ''}{event.subtitle}
                  </p>
                  {event.type === 'finance' && event.amount !== undefined && (
                    <p className={`text-[11px] font-black font-cinzel ${event.color === COLORS.gold ? 'text-green-600' : 'text-red-500'}`}>
                      {event.color === COLORS.gold ? '+' : '-'}${event.amount.toLocaleString()}
                    </p>
                  )}
                </div>
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
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="flex-1 flex overflow-x-auto md:overflow-hidden bg-white/30">
        {days.map(d => renderDayColumn(d))}
      </div>
    );
  };

  const renderMonthGrid = () => {
    const startOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
    
    return (
      <div className="flex-1 grid grid-cols-7 border-t border-[#F8C8DC]/20 font-inter">
        {Array.from({ length: 42 }).map((_, i) => {
          const dayNum = i - (startDay === 0 ? 6 : startDay - 1);
          const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), dayNum + 1);
          const events = dayNum >= 0 && dayNum < daysInMonth ? getEventsForDate(date) : [];
          const isToday = date.toDateString() === new Date().toDateString();
          const isOutside = dayNum < 0 || dayNum >= daysInMonth;
          const moodEvent = events.find(e => e.type === 'mood');

          return (
            <div 
              key={i} 
              onClick={() => { if(!isOutside) { setAnchorDate(date); setView('day'); } }}
              className={`p-3 border-r border-b border-[#F8C8DC]/20 min-h-[100px] md:min-h-[160px] transition-all cursor-pointer group ${isOutside ? 'opacity-20 bg-black/5' : 'hover:bg-[#FFF0F5]'}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[11px] md:text-base font-cinzel ${isToday ? 'bg-[#E35B8F] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-bold' : 'text-[#8B5E75]'}`}>
                  {date.getDate()}
                </span>
                {moodEvent && (
                  <div className="text-[#D4AF37] animate-in zoom-in duration-500">
                    {getIcon(moodEvent.moodIcon!, 'w-4 h-4')}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {events.filter(e => e.type !== 'mood').slice(0, 5).map(e => (
                  <div key={e.id} className={`h-2 w-full rounded-full transition-all group-hover:scale-y-150 shadow-sm`} style={{ backgroundColor: e.color }} title={e.title} />
                ))}
                {events.filter(e => e.type !== 'mood').length > 5 && (
                  <div className="text-[9px] font-black text-[#8B5E75] uppercase opacity-60">+ {events.length - 5}</div>
                )}
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
      <div className="flex-1 p-8 md:p-16 overflow-y-auto bg-gradient-to-b from-white/50 to-transparent relative scroll-sm">
        <div className="mb-10 border-b-2 border-[#F8C8DC]/30 pb-6 flex justify-between items-end">
          <div>
            <h2 className="font-cinzel text-5xl text-[#4A233E] font-bold tracking-tight">{anchorDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</h2>
            <p className="text-xs text-[#8B5E75] uppercase tracking-[0.4em] font-bold mt-2">Sincronización Astral Académica</p>
          </div>
          <button 
            onClick={() => setShowAddEventModal(true)}
            className="btn-primary flex items-center gap-3 px-8 py-4 rounded-2xl font-cinzel text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {getIcon('plus', "w-5 h-5")} Inscribir Hito Manual
          </button>
        </div>
        
        {events.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center opacity-30 text-center px-12">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-6">
              {getIcon('compass', 'w-12 h-12')}
            </div>
            <p className="font-garamond italic text-3xl">"El campo de operaciones converge en calma absoluta."</p>
            <p className="font-inter text-[10px] uppercase font-bold tracking-widest mt-6">No hay influencias marcadas para este día.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map(event => (
              <div 
                key={event.id}
                className={`glass-card p-10 rounded-[3rem] border-l-8 flex items-center justify-between group transition-all duration-500 hover:translate-x-3 font-inter shadow-xl`}
                style={{ borderLeftColor: event.color }}
              >
                <div className="flex items-center gap-10">
                   <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner`} style={{ backgroundColor: `${event.color}15`, color: event.color }}>
                      {event.type === 'milestone' ? getIcon('calendar', 'w-10 h-10') : 
                       event.type === 'finance' ? getIcon('scale', 'w-10 h-10') : 
                       event.type === 'mood' ? getIcon(event.moodIcon!, 'w-10 h-10') :
                       event.type === 'custom' ? getIcon('pen', 'w-10 h-10') :
                       getIcon('book', 'w-10 h-10')}
                   </div>
                   <div>
                     <div className="flex items-center gap-4 mb-2">
                       <h4 className="font-cinzel text-2xl font-bold text-[#4A233E] tracking-tight">{event.title}</h4>
                       {event.time && <span className="text-[11px] bg-[#4A233E] text-white px-4 py-1 rounded-full font-black tracking-widest uppercase shadow-md">{event.time}</span>}
                     </div>
                     <p className="text-sm text-[#8B5E75] font-bold uppercase tracking-widest opacity-80">{event.subtitle}</p>
                     {event.type === 'finance' && event.amount !== undefined && (
                       <p className={`text-xl font-black font-cinzel mt-1 ${event.color === COLORS.gold ? 'text-green-600' : 'text-red-500'}`}>
                         {event.color === COLORS.gold ? '+' : '-'}${event.amount.toLocaleString()}
                       </p>
                     )}
                   </div>
                </div>
                <div className="flex items-center gap-8">
                  {event.priority === 'high' && (
                    <div className="flex items-center gap-3 text-[#D4AF37]">
                      <span className="text-[11px] font-black uppercase tracking-[0.25em]">Prioridad Crítica</span>
                      <div className="w-4 h-4 rounded-full bg-[#D4AF37] animate-ping" />
                    </div>
                  )}
                  {event.type === 'custom' && (
                    <button 
                      onClick={() => onDeleteCustomEvent(event.id)}
                      className="text-[#8B5E75] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-4 bg-white/80 rounded-full shadow-md"
                    >
                      {getIcon('trash', 'w-6 h-6')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal for Manual Event */}
        {showAddEventModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#4A233E]/70 backdrop-blur-md p-4">
            <form onSubmit={handleAddCustomEvent} className="glass-card w-full max-w-lg p-10 md:p-12 rounded-[4rem] shadow-2xl animate-in zoom-in duration-500 font-inter border-[#D4AF37]/30">
              <h2 className="font-cinzel text-2xl text-[#4A233E] mb-8 text-center font-bold tracking-[0.3em] uppercase">Inscribir en Astrolabio</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-[#8B5E75] mb-2 px-1">Título de la Operación</label>
                  <input required name="title" type="text" placeholder="Ej: Lectura Crítica de Postestructuralismo" className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-[#8B5E75] mb-2 px-1">Descripción del Hito</label>
                  <textarea name="description" placeholder="Detalles, objetivos o metas específicas..." className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none h-24 resize-none shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-[#8B5E75] mb-2 px-1">Coordenada Temporal (Hora)</label>
                    <input name="time" type="time" className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm focus:border-[#E35B8F] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-[#8B5E75] mb-2 px-1">Prioridad de Voluntad</label>
                    <select name="priority" className="w-full bg-white/40 border-2 border-[#F8C8DC]/50 rounded-2xl px-6 py-4 text-sm outline-none cursor-pointer">
                      <option value="low">Flujo Ordinario</option>
                      <option value="high">Inercia Crítica</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-[#8B5E75] mb-2 px-1">Cromatismo Visual (Aura)</label>
                  <div className="flex justify-between mt-3 px-2">
                    {[COLORS.primary, COLORS.gold, COLORS.plum, COLORS.mauve, '#48C9B0', '#5DADE2', '#AF7AC5'].map(c => (
                      <label key={c} className="cursor-pointer relative group">
                        <input type="radio" name="color" value={c} required className="peer sr-only" defaultChecked={c === COLORS.primary} />
                        <div className="w-10 h-10 rounded-full border-4 border-white shadow-md transition-all peer-checked:scale-125 peer-checked:ring-2 peer-checked:ring-[#E35B8F]" style={{ backgroundColor: c }} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-6 mt-12">
                <button type="button" onClick={() => setShowAddEventModal(false)} className="flex-1 py-4 text-xs font-black text-[#8B5E75] uppercase tracking-widest hover:bg-[#FDEEF4] rounded-2xl transition-colors">Descartar</button>
                <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl font-cinzel text-xs font-black uppercase tracking-[0.3em] shadow-xl">Sellar en el Tiempo</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pb-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-2">
        <div className="flex items-center gap-8">
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full glass-card border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] hover:bg-[#E35B8F] hover:text-white transition-all shadow-md">
              <div className="rotate-180">{getIcon('chevron', 'w-6 h-6')}</div>
            </button>
            <button onClick={() => navigate(1)} className="w-12 h-12 rounded-full glass-card border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] hover:bg-[#E35B8F] hover:text-white transition-all shadow-md">
              {getIcon('chevron', 'w-6 h-6')}
            </button>
          </div>
          <div>
            <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#4A233E] capitalize tracking-tight">
              {anchorDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-[10px] text-[#8B5E75] uppercase font-black tracking-[0.4em] mt-1">Santuario del Astrolabio Maestral</p>
          </div>
        </div>

        <div className="flex gap-2 bg-[#FDEEF4] p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto shadow-inner border border-[#F8C8DC]">
          {(['month', 'week', 'day'] as const).map(v => (
            <button 
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-[#E35B8F] text-white shadow-lg' : 'text-[#8B5E75] hover:bg-white/50'}`}
            >
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 glass-card rounded-[3rem] md:rounded-[4rem] overflow-hidden flex flex-col shadow-2xl relative border-[#F8C8DC]">
        {view === 'month' ? (
          <>
            <div className="grid grid-cols-7 bg-[#4A233E] text-white py-4 shadow-md">
               {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                 <div key={d} className="text-center text-[10px] uppercase tracking-[0.3em] font-black opacity-60">{d}</div>
               ))}
            </div>
            <div className="flex-1 overflow-y-auto scroll-sm">
              {renderMonthGrid()}
            </div>
          </>
        ) : view === 'week' ? (
          renderWeekView()
        ) : (
          renderDayFocus()
        )}
      </div>
    </div>
  );
};

export default CalendarModule;
