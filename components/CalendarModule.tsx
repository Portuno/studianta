
import React, { useState, useEffect } from 'react';
import { Subject, Transaction, JournalEntry, MoodType, CustomCalendarEvent } from '../types';
import { getIcon, COLORS } from '../constants';
import { googleCalendarService } from '../services/googleCalendarService';
import { supabase, supabaseService } from '../services/supabaseService';

interface CalendarModuleProps {
  subjects: Subject[];
  transactions: Transaction[];
  journalEntries?: JournalEntry[];
  customEvents?: CustomCalendarEvent[];
  onAddCustomEvent: (e: CustomCalendarEvent) => void;
  onDeleteCustomEvent: (id: string) => void;
  onUpdateCustomEvent?: (e: CustomCalendarEvent) => void;
  isMobile: boolean;
  userId?: string;
  isNightMode?: boolean;
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
  endTime?: string;
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
  onUpdateCustomEvent,
  isMobile,
  userId,
  isNightMode = false
}) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>(isMobile ? 'day' : 'week');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CustomCalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConnectivitySection, setShowConnectivitySection] = useState(false);
  const [showFocusAnnotations, setShowFocusAnnotations] = useState(false);

  // Cargar preferencia de mostrar anotaciones de enfoque
  const loadFocusPreference = async () => {
    if (userId) {
      try {
        const profile = await supabaseService.getProfile(userId);
        if (profile) {
          setShowFocusAnnotations(profile.show_focus_annotations ?? false);
        }
      } catch (error) {
        console.error('Error loading focus preference:', error);
      }
    }
  };

  // Cargar preferencia al montar y cuando cambie userId
  useEffect(() => {
    loadFocusPreference();
  }, [userId]);

  // Recargar preferencia cuando cambien los eventos (para detectar cambios en la preferencia del usuario)
  // Esto asegura que si el usuario cambia la preferencia en el perfil, se actualice en el calendario
  useEffect(() => {
    if (userId && customEvents.length > 0) {
      // Solo recargar si hay eventos, para evitar recargas innecesarias
      loadFocusPreference();
    }
  }, [customEvents.length, userId]);

  // Verificar conexión de Google Calendar al cargar
  useEffect(() => {
    if (userId) {
      const connected = googleCalendarService.isConnected(userId);
      setIsGoogleConnected(connected);
      if (connected) {
        googleCalendarService.loadTokens(userId);
      }
    }

    // Manejar callback de OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state && userId) {
      handleOAuthCallback(code, state);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const tokens = await googleCalendarService.handleOAuthCallback(code, state);
      if (userId) {
        googleCalendarService.saveTokens(userId, tokens);
        setIsGoogleConnected(true);
      }
    } catch (error) {
      console.error('Error en callback de OAuth:', error);
      alert('Error al conectar con Google Calendar. Por favor, intenta nuevamente.');
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await googleCalendarService.initiateOAuth();
    } catch (error: any) {
      alert(`Error al iniciar conexión: ${error.message}`);
    }
  };

  const handleSyncGoogle = async () => {
    if (!userId) return;
    
    setIsSyncing(true);
    try {
      const result = await googleCalendarService.syncEvents(userId, subjects, customEvents);
      const message = `Sincronización completada: ${result.created} eventos creados, ${result.updated} eventos actualizados${result.errors > 0 ? `, ${result.errors} errores` : ''}`;
      alert(message);
    } catch (error: any) {
      alert(`Error al sincronizar: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = () => {
    if (!userId) return;
    if (confirm('¿Estás segura de que deseas desconectar tu cuenta de Google Calendar?')) {
      googleCalendarService.disconnect(userId);
      setIsGoogleConnected(false);
    }
  };

  const handleExportICS = () => {
    // Generar archivo .ics
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Studianta//Calendario Académico//ES\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';

    // Función para formatear fecha/hora en formato iCalendar
    const formatICSDateTime = (date: Date, time?: string): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (time) {
        const [hours, minutes] = time.split(':');
        return `${year}${month}${day}T${hours}${minutes}00`;
      }
      return `${year}${month}${day}`;
    };

    // Función para escapar texto para iCalendar
    const escapeICS = (text: string): string => {
      return text.replace(/\\/g, '\\\\')
                 .replace(/;/g, '\\;')
                 .replace(/,/g, '\\,')
                 .replace(/\n/g, '\\n');
    };

    // Agregar eventos de milestones
    subjects.forEach(subject => {
      subject.milestones.forEach(milestone => {
        const eventDate = new Date(milestone.date);
        const startDateTime = formatICSDateTime(eventDate, milestone.time);
        const endDateTime = milestone.time 
          ? formatICSDateTime(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000), milestone.time)
          : formatICSDateTime(new Date(eventDate.getTime() + 24 * 60 * 60 * 1000));

        icsContent += 'BEGIN:VEVENT\r\n';
        icsContent += `UID:${milestone.id}@studianta\r\n`;
        icsContent += `DTSTART${milestone.time ? '' : ';VALUE=DATE'}:${startDateTime}\r\n`;
        icsContent += `DTEND${milestone.time ? '' : ';VALUE=DATE'}:${endDateTime}\r\n`;
        icsContent += `SUMMARY:${escapeICS(`[Studianta] ${milestone.type}: ${subject.name}`)}\r\n`;
        icsContent += `DESCRIPTION:${escapeICS(`Materia: ${subject.name}\\nTipo: ${milestone.type}\\n${milestone.title}`)}\r\n`;
        icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
        icsContent += 'END:VEVENT\r\n';
      });
    });

    // Agregar eventos personalizados
    customEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const startDateTime = formatICSDateTime(eventDate, event.time);
      const endDateTime = event.endTime
        ? formatICSDateTime(eventDate, event.endTime)
        : event.time
        ? formatICSDateTime(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000), event.time)
        : formatICSDateTime(new Date(eventDate.getTime() + 24 * 60 * 60 * 1000));

      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${event.id}@studianta\r\n`;
      icsContent += `DTSTART${event.time ? '' : ';VALUE=DATE'}:${startDateTime}\r\n`;
      icsContent += `DTEND${event.time ? '' : ';VALUE=DATE'}:${endDateTime}\r\n`;
      icsContent += `SUMMARY:${escapeICS(`[Studianta] ${event.title}`)}\r\n`;
      if (event.description) {
        icsContent += `DESCRIPTION:${escapeICS(event.description)}\r\n`;
      }
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      icsContent += 'END:VEVENT\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';

    // Descargar archivo
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studianta-calendario-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

    // Las transacciones de la BALANZA no se muestran en el calendario
    // transactions.forEach(t => { ... });

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
        // Filtrar eventos de enfoque si la preferencia está desactivada
        // Los eventos de enfoque siempre empiezan con "Sesión de Enfoque:"
        const isFocusEvent = ev.title && ev.title.startsWith('Sesión de Enfoque:');
        if (isFocusEvent) {
          // Solo mostrar eventos de enfoque si la preferencia está activada
          if (!showFocusAnnotations) {
            return; // Saltar este evento
          }
        }
        
        events.push({
          id: ev.id,
          title: ev.title,
          subtitle: ev.description || 'Hito Manual Personal',
          date: new Date(ev.date),
          type: 'custom',
          priority: ev.priority,
          color: ev.color,
          time: ev.time,
          endTime: ev.endTime
        });
      }
    });

    return events.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  };

  const handleAddCustomEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedDate = formData.get('date') as string;
    const timeValue = formData.get('time') as string;
    const endTimeValue = formData.get('endTime') as string;
    const newEvent: CustomCalendarEvent = {
      id: Math.random().toString(36).substring(7),
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      date: selectedDate || anchorDate.toISOString().split('T')[0],
      time: timeValue || undefined,
      endTime: endTimeValue || undefined,
      color: formData.get('color') as string,
      priority: formData.get('priority') as any || 'low'
    };
    onAddCustomEvent(newEvent);
    setShowAddEventModal(false);
  };

  const handleUpdateCustomEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent || !onUpdateCustomEvent) return;
    
    const formData = new FormData(e.currentTarget);
    const selectedDate = formData.get('date') as string;
    const timeValue = formData.get('time') as string;
    const endTimeValue = formData.get('endTime') as string;
    const updatedEvent: CustomCalendarEvent = {
      ...editingEvent,
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      date: selectedDate || editingEvent.date,
      time: timeValue || undefined,
      endTime: endTimeValue || undefined,
      color: formData.get('color') as string,
      priority: formData.get('priority') as any || 'low'
    };
    onUpdateCustomEvent(updatedEvent);
    setEditingEvent(null);
  };

  const renderDayColumn = (date: Date) => {
    const events = getEventsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div 
        key={date.toDateString()} 
        className={`flex-1 flex flex-col min-w-[150px] md:min-w-0 border-r last:border-r-0 transition-colors duration-500 ${
          isNightMode 
            ? `border-[#A68A56]/10 ${isToday ? 'bg-[rgba(166,138,86,0.15)]' : ''}` 
            : `border-[#D4AF37]/10 ${isToday ? 'bg-[#D4AF37]/5' : ''}`
        }`}
      >
        <div className={`p-6 text-center border-b transition-colors duration-500 ${
          isNightMode 
            ? `border-[#A68A56]/20 ${isToday ? 'text-[#E0E1DD]' : 'text-[#7A748E]'}` 
            : `border-[#D4AF37]/20 ${isToday ? 'text-[#2D1A26]' : 'text-[#8B5E75]'}`
        }`}>
          <p className={`text-[10px] uppercase font-cinzel font-black tracking-[0.2em] opacity-60 transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : ''
          }`}>
            {date.toLocaleDateString('es-ES', { weekday: 'short' })}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className={`font-cinzel text-3xl transition-colors duration-500 ${
              isToday 
                ? isNightMode
                  ? 'font-black scale-110 text-[#A68A56] drop-shadow-[0_0_8px_rgba(166,138,86,0.5)]'
                  : 'font-black scale-110 text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                : isNightMode ? 'text-[#7A748E]' : ''
            }`}>
              {date.getDate()}
            </p>
            {events.find(e => e.type === 'mood') && (
              <div className={`animate-pulse transition-colors duration-500 ${
                isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
              }`}>
                {getIcon(events.find(e => e.type === 'mood')?.moodIcon || 'sun', 'w-4 h-4')}
              </div>
            )}
          </div>
        </div>
        <div className={`flex-1 p-3 space-y-3 overflow-y-auto max-h-[70vh] md:max-h-full no-scrollbar relative transition-colors duration-500 ${
          isNightMode ? 'bg-[rgba(26,26,46,0.3)]' : ''
        }`}>
          {/* Watermark in each column for mobile week view */}
          {isMobile && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
             {getIcon('compass', 'w-32 h-32')}
          </div>}

          {events.length === 0 ? (
             <div className={`h-full flex items-center justify-center transition-colors duration-500 ${
               isNightMode ? 'opacity-20 text-[#7A748E]' : 'opacity-10'
             }`}>
               {getIcon('sparkles', 'w-6 h-6')}
             </div>
          ) : (
            events.map(event => (
              <div 
                key={event.id} 
                className={`p-4 rounded-[1.25rem] border-l-2 text-[11px] transition-all active:scale-95 shadow-sm font-inter group relative overflow-hidden ${
                  isNightMode
                    ? event.type === 'mood' 
                      ? 'bg-[rgba(199,125,255,0.15)] border-l-[#A68A56] shadow-[0_2px_8px_rgba(199,125,255,0.2)]'
                      : event.priority === 'high' 
                        ? 'bg-[rgba(48,43,79,0.8)] border-l-[#A68A56] shadow-md ring-1 ring-[#A68A56]/30' 
                        : 'bg-[rgba(48,43,79,0.6)] border-l-[#C77DFF] shadow-[0_2px_6px_rgba(199,125,255,0.15)]'
                    : event.type === 'mood' 
                      ? 'bg-[#FFF0F5]/40 border-l-[#D4AF37]'
                      : event.priority === 'high' 
                        ? 'bg-white border-l-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/10' 
                        : 'bg-white/60 border-l-[#E35B8F]'
                }`}
                style={event.type === 'custom' ? { borderLeftColor: event.color } : {}}
              >
                <div className="flex justify-between items-start mb-1.5">
                   <span className={`font-bold truncate pr-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>{event.title}</span>
                   {event.priority === 'high' && (
                     <div className={`w-1.5 h-1.5 rounded-full animate-ping shrink-0 transition-colors duration-500 ${
                       isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                     }`} />
                   )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className={`text-[9px] font-medium uppercase tracking-wider opacity-80 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {event.time ? `${event.time}${event.endTime ? ` - ${event.endTime}` : ''} • ` : ''}{event.subtitle}
                  </p>
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
      <div className={`flex-1 flex overflow-x-auto md:overflow-hidden relative transition-colors duration-500 ${
        isNightMode ? 'bg-[rgba(26,26,46,0.2)]' : 'bg-white/20'
      }`}>
        {!isMobile && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
           {getIcon('compass', 'w-96 h-96')}
        </div>}
        {days.map(d => renderDayColumn(d))}
      </div>
    );
  };

  const renderMonthGrid = () => {
    const startOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    const daysInMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).getDate();
    const weeksInMonth = Math.ceil((startDay === 0 ? 6 : startDay - 1 + daysInMonth) / 7);
    
    return (
      <div className={`h-full grid grid-cols-7 border-t font-inter transition-colors duration-500 ${
        isNightMode ? 'border-[#A68A56]/10' : 'border-[#D4AF37]/10'
      }`} style={{ gridTemplateRows: `repeat(${weeksInMonth}, minmax(0, 1fr))` }}>
        {Array.from({ length: 42 }).map((_, i) => {
          const dayNum = i - (startDay === 0 ? 6 : startDay - 1);
          const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), dayNum + 1);
          const events = dayNum >= 0 && dayNum < daysInMonth ? getEventsForDate(date) : [];
          const isToday = date.toDateString() === new Date().toDateString();
          const isOutside = dayNum < 0 || dayNum >= daysInMonth;
          const moodEvent = events.find(e => e.type === 'mood');
          const hasHighPriority = events.some(e => e.priority === 'high');
          const visibleEvents = events.filter(e => e.type !== 'mood').slice(0, 3);
          const allEventsText = events.map(e => {
            const timeStr = e.time ? `${e.time} - ` : '';
            return `${timeStr}${e.title}${e.subtitle ? ` (${e.subtitle})` : ''}`;
          }).join('\n');

          return (
            <div 
              key={i} 
              onClick={() => { if(!isOutside) { setAnchorDate(date); setView('day'); } }}
              className={`p-2 border-r border-b transition-all cursor-pointer group relative ${
                isNightMode 
                  ? `border-[#A68A56]/10 ${isOutside ? 'opacity-10 grayscale bg-black/5' : 'bg-[rgba(48,43,79,0.2)] hover:bg-[rgba(48,43,79,0.4)]'}` 
                  : `border-[#D4AF37]/10 ${isOutside ? 'opacity-10 grayscale bg-black/5' : 'hover:bg-[#FFF0F5]/50'}`
              }`}
              title={events.length > 0 ? allEventsText : ''}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] md:text-base font-cinzel transition-all ${
                  isToday 
                    ? isNightMode
                      ? 'border-2 border-[#A68A56] ring-2 ring-[#C77DFF]/20 text-[#E0E1DD] w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(199,125,255,0.3)] font-black bg-[rgba(166,138,86,0.2)]'
                      : 'border-2 border-[#D4AF37] ring-2 ring-[#D4AF37]/20 text-[#2D1A26] w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] font-black'
                    : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  {date.getDate()}
                </span>
                <div className="flex gap-1">
                  {moodEvent && (
                    <div 
                      className={`scale-75 cursor-help transition-colors duration-500 ${
                        isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                      }`}
                      title={`Estado Vital: ${moodEvent.title}`}
                    >
                      {getIcon(moodEvent.moodIcon!, 'w-4 h-4')}
                    </div>
                  )}
                  {hasHighPriority && (
                    <div 
                      className={`w-1.5 h-1.5 rounded-full animate-pulse cursor-help transition-colors duration-500 ${
                        isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                      }`}
                      title="Evento de alta prioridad"
                    />
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {visibleEvents.map(e => (
                  <div 
                    key={e.id} 
                    className={`h-1 w-full rounded-full hover:opacity-100 transition-opacity cursor-help relative group/event ${
                      isNightMode ? 'opacity-70' : 'opacity-60'
                    }`}
                    style={{ backgroundColor: e.color }}
                    title={`${e.time ? `${e.time}${e.endTime ? ` - ${e.endTime}` : ''} • ` : ''}${e.title}${e.subtitle ? ` (${e.subtitle})` : ''}`}
                  />
                ))}
                {events.length > 3 && (
                  <div className={`text-[8px] font-bold opacity-60 mt-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    +{events.length - 3} más
                  </div>
                )}
              </div>
              
              {/* Tooltip mejorado al hover */}
              {events.length > 0 && (
                <div className={`absolute z-[100] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 hidden md:block ${
                  i % 7 >= 4 ? 'right-full top-0 mr-2' : 'left-full top-0 ml-2'
                }`}>
                  <div className={`p-3 rounded-xl shadow-2xl border-2 min-w-[200px] max-w-[300px] backdrop-blur-md transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                      : 'glass-card border-[#D4AF37]/40 bg-white/95'
                  }`}>
                    <div className={`text-[9px] font-cinzel font-bold mb-2 uppercase border-b pb-1 transition-colors duration-500 ${
                      isNightMode 
                        ? 'text-[#E0E1DD] border-[#A68A56]/40' 
                        : 'text-[#2D1A26] border-[#F8C8DC]'
                    }`}>
                      {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {events.map(e => (
                        <div key={e.id} className="text-[10px] font-inter">
                          <div className="flex items-center gap-2 mb-0.5">
                            <div 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: e.color }}
                            />
                            <span className={`font-bold transition-colors duration-500 ${
                              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                            }`}>{e.title}</span>
                          </div>
                          <div className={`text-[9px] ml-4 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>
                            {e.time && <span>{e.time} • </span>}
                            {e.subtitle}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayFocus = () => {
    const events = getEventsForDate(anchorDate);
    return (
      <div className={`flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto relative no-scrollbar pb-24 sm:pb-12 transition-colors duration-500 ${
        isNightMode 
          ? 'bg-gradient-to-b from-[rgba(48,43,79,0.4)] to-[rgba(26,26,46,0.2)]' 
          : 'bg-gradient-to-b from-white/30 to-transparent'
      }`}>
        {/* Mystic Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
           {getIcon('compass', 'w-[80vw] h-[80vw]')}
        </div>

        <div className={`mb-8 border-b pb-4 transition-colors duration-500 ${
          isNightMode ? 'border-[#A68A56]/30' : 'border-[#D4AF37]/30'
        }`}>
          <h2 className={`font-cinzel text-4xl md:text-6xl font-bold tracking-tight text-center md:text-left transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>{anchorDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</h2>
          <p className={`text-[9px] text-center md:text-left uppercase tracking-[0.3em] font-black mt-1.5 opacity-60 transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>Sincronía de Cronos</p>
        </div>
        
        {events.length === 0 ? (
          <div className={`h-64 md:h-96 flex flex-col items-center justify-center text-center px-10 transition-colors duration-500 ${
            isNightMode ? 'opacity-30 text-[#7A748E]' : 'opacity-20'
          }`}>
            <div className={`w-16 h-16 rounded-full border border-dashed flex items-center justify-center mb-6 transition-colors duration-500 ${
              isNightMode ? 'border-[#A68A56] text-[#A68A56]' : 'border-[#D4AF37] text-[#D4AF37]'
            }`}>
              {getIcon('compass', 'w-8 h-8')}
            </div>
            <p className={`font-garamond italic text-2xl md:text-3xl transition-colors duration-500 ${
              isNightMode ? 'text-[#7A748E]' : ''
            }`}>"El flujo de este día fluye sin registros marcados."</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {events.map(event => (
              <div 
                key={event.id}
                className={`p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between group transition-all duration-300 font-inter shadow-md gap-3 sm:gap-4 backdrop-blur-[15px] ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.7)] border-l-[#C77DFF] shadow-[0_0_20px_rgba(199,125,255,0.25)] hover:bg-[rgba(48,43,79,0.85)]' 
                    : 'glass-card border-l-[#E35B8F]'
                }`}
                style={{ borderLeftColor: event.color }}
              >
                <div className="flex items-center gap-3 sm:gap-4 md:gap-8 flex-1 w-full sm:w-auto">
                   <div className={`w-14 h-14 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0`} style={{ backgroundColor: `${event.color}10`, color: event.color }}>
                      {event.type === 'milestone' ? getIcon('calendar', 'w-7 h-7 sm:w-6 sm:h-6 md:w-8 md:h-8') : 
                       event.type === 'finance' ? getIcon('scale', 'w-7 h-7 sm:w-6 sm:h-6 md:w-8 md:h-8') : 
                       event.type === 'mood' ? getIcon(event.moodIcon!, 'w-7 h-7 sm:w-6 sm:h-6 md:w-8 md:h-8') :
                       getIcon('book', 'w-7 h-7 sm:w-6 sm:h-6 md:w-8 md:h-8')}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                       <h4 className={`font-cinzel text-base sm:text-lg md:text-xl font-bold tracking-tight break-words transition-colors duration-500 ${
                         isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                       }`}>{event.title}</h4>
                       {event.time && <span className={`text-[9px] sm:text-[8px] px-3 py-1 rounded-full font-bold uppercase whitespace-nowrap self-start sm:self-auto transition-colors duration-500 ${
                         isNightMode 
                           ? 'bg-[#A68A56]/20 text-[#A68A56]' 
                           : 'bg-[#4A233E]/10 text-[#4A233E]'
                       }`}>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>}
                     </div>
                     <p className={`text-[11px] sm:text-[10px] md:text-sm font-bold uppercase tracking-wider opacity-60 mt-1 sm:mt-0.5 break-words transition-colors duration-500 ${
                       isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                     }`}>{event.subtitle}</p>
                   </div>
                </div>
                {event.type === 'custom' && (
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start">
                    {onUpdateCustomEvent && (
                      <button 
                        onClick={() => {
                          const customEvent = customEvents.find(e => e.id === event.id);
                          if (customEvent) {
                            setEditingEvent(customEvent);
                          }
                        }} 
                        className="bg-[#D4AF37] text-white px-4 py-2.5 sm:p-3 rounded-xl hover:bg-[#D4AF37]/90 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-2 min-w-[100px] min-h-[44px] touch-manipulation"
                        title="Editar evento"
                        aria-label="Editar evento"
                      >
                        {getIcon('edit', 'w-5 h-5')}
                        <span className="font-cinzel text-[10px] font-black uppercase tracking-wider">EDITAR</span>
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEventToDelete({ id: event.id, title: event.title });
                      }} 
                      className="bg-[#E35B8F] text-white px-4 py-2.5 sm:p-3 rounded-xl hover:bg-[#E35B8F]/90 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-2 min-w-[100px] min-h-[44px] touch-manipulation"
                      title="Eliminar evento"
                      aria-label="Eliminar evento"
                    >
                      {getIcon('trash', 'w-5 h-5')}
                      <span className="font-cinzel text-[10px] font-black uppercase tracking-wider">ELIMINAR</span>
                    </button>
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
    <div className="h-full flex flex-col pb-10">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 sm:mb-6 px-3 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(-1)} 
              className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-full border-2 flex items-center justify-center active:scale-90 transition-all shadow-sm touch-manipulation backdrop-blur-[15px] ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#C77DFF]' 
                  : 'glass-card border-[#F8C8DC] text-[#E35B8F]'
              }`}
              aria-label="Día anterior"
            >
              <div className="rotate-180">{getIcon('chevron', 'w-6 h-6')}</div>
            </button>
            <button 
              onClick={() => navigate(1)} 
              className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-full border-2 flex items-center justify-center active:scale-90 transition-all shadow-sm touch-manipulation backdrop-blur-[15px] ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#C77DFF]' 
                  : 'glass-card border-[#F8C8DC] text-[#E35B8F]'
              }`}
              aria-label="Día siguiente"
            >
              {getIcon('chevron', 'w-6 h-6')}
            </button>
          </div>
          <div className="text-center md:text-left flex-1 md:flex-none">
            <h1 className={`font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold capitalize tracking-tight transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>
              {anchorDate.toLocaleString('es-ES', { month: 'long' })}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-center flex-wrap">
          {!isMobile && (
            <button 
              onClick={() => setShowAddEventModal(true)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-cinzel text-sm font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all min-h-[44px] touch-manipulation ${
                isNightMode 
                  ? 'bg-[#C77DFF] text-white shadow-[#C77DFF]/30 hover:bg-[#B56DE6]' 
                  : 'btn-primary'
              }`}
            >
              {getIcon('plus', 'w-5 h-5')} Agregar
            </button>
          )}
          
          <div className={`flex gap-2 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner border-2 backdrop-blur-md transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
              : 'bg-white/40 border-[#D4AF37]/20'
          }`}>
            {(['month', 'week', 'day'] as const).map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 sm:flex-none px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-cinzel text-[10px] sm:text-[9px] font-black uppercase tracking-[0.15em] transition-all min-h-[44px] touch-manipulation ${
                  view === v 
                    ? isNightMode
                      ? 'bg-[#C77DFF] text-white shadow-md shadow-[#C77DFF]/30 scale-105'
                      : 'bg-[#E35B8F] text-white shadow-md scale-105'
                    : isNightMode
                      ? 'text-[#7A748E] active:bg-[rgba(48,43,79,0.6)]'
                      : 'text-[#8B5E75] active:bg-white/60'
                }`}
              >
                {v === 'month' ? 'MES' : v === 'week' ? 'SEMANA' : 'DÍA'}
              </button>
            ))}
          </div>

          {/* Botón de Conectividad */}
          <button
            onClick={() => setShowConnectivitySection(!showConnectivitySection)}
            className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-full border-2 flex items-center justify-center active:scale-90 transition-all shadow-sm touch-manipulation backdrop-blur-[15px] ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#C77DFF] hover:bg-[rgba(48,43,79,0.8)]' 
                : 'glass-card border-[#F8C8DC] text-[#E35B8F] hover:bg-white/60'
            }`}
            title="Conectividad"
            aria-label="Conectividad"
          >
            {getIcon('download', 'w-6 h-6')}
          </button>
        </div>
      </header>

      {/* Sección de Conectividad */}
      {showConnectivitySection && (
        <div className={`mb-4 rounded-[1.5rem] p-4 md:p-6 border-2 shadow-lg backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
            : 'glass-card border-[#D4AF37]/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-cinzel text-xl font-bold uppercase tracking-wider transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>
              Conectividad
            </h3>
            <button
              onClick={() => setShowConnectivitySection(false)}
              className={`transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E] hover:text-[#E0E1DD]' : 'text-[#8B5E75] hover:text-[#2D1A26]'
              }`}
            >
              {getIcon('x', 'w-5 h-5')}
            </button>
          </div>

          <div className="space-y-4">
            {/* Exportar Crónicas (.ics) */}
            <div className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-md transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
                : 'bg-white/40 border-[#F8C8DC]/50'
            }`}>
              <div className="flex items-center gap-3">
                {getIcon('download', `w-5 h-5 ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`)}
                <div>
                  <p className={`font-cinzel text-sm font-bold transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>Exportar Crónicas</p>
                  <p className={`text-[9px] uppercase tracking-wider transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Descargar calendario en formato .ics</p>
                </div>
              </div>
              <button
                onClick={handleExportICS}
                className={`px-4 py-2 border-2 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-colors shadow-md ${
                  isNightMode 
                    ? 'bg-[#A68A56]/80 border-[#A68A56] text-[#E0E1DD] hover:bg-[#A68A56]' 
                    : 'bg-[#D4AF37]/80 border-[#D4AF37] text-[#2D1A26] hover:bg-[#D4AF37]'
                }`}
              >
                Exportar
              </button>
            </div>

            {/* Puente con Google */}
            <div className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-md transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40' 
                : 'bg-white/40 border-[#F8C8DC]/50'
            }`}>
              <div className="flex items-center gap-3">
                {isGoogleConnected ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    {getIcon('check', 'w-3 h-3 text-white')}
                  </div>
                ) : (
                  getIcon('calendar', `w-5 h-5 ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`)
                )}
                <div>
                  <p className={`font-cinzel text-sm font-bold transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    Puente con Google
                    {isGoogleConnected && (
                      <span className={`ml-2 text-[10px] font-normal transition-colors duration-500 ${
                        isNightMode ? 'text-green-400' : 'text-green-600'
                      }`}>Sincronizado</span>
                    )}
                  </p>
                  <p className={`text-[9px] uppercase tracking-wider transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {isGoogleConnected 
                      ? 'Sincronización automática activa' 
                      : 'Conecta tu cuenta de Google Calendar'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGoogleConnected ? (
                  <>
                    <button
                      onClick={handleSyncGoogle}
                      disabled={isSyncing}
                      className={`px-4 py-2 text-white rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                        isNightMode 
                          ? 'bg-[#C77DFF] hover:bg-[#B56DE6] shadow-[#C77DFF]/30' 
                          : 'bg-[#E35B8F] hover:bg-[#E35B8F]/90'
                      }`}
                    >
                      {isSyncing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          {getIcon('check', 'w-3 h-3')}
                          Sincronizar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDisconnectGoogle}
                      className={`px-3 py-2 border-2 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isNightMode 
                          ? 'bg-red-900/40 border-red-700/60 text-red-300 hover:bg-red-900/60' 
                          : 'bg-red-100/60 border-red-300 text-red-700 hover:bg-red-200/60'
                      }`}
                      title="Desconectar"
                    >
                      {getIcon('x', 'w-4 h-4')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    className={`px-4 py-2 text-white rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-colors shadow-md flex items-center gap-2 ${
                      isNightMode 
                        ? 'bg-[#4285F4]/80 hover:bg-[#4285F4] shadow-[#4285F4]/30' 
                        : 'bg-[#4285F4] hover:bg-[#4285F4]/90'
                    }`}
                  >
                    {getIcon('calendar', 'w-4 h-4')}
                    Vincular
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden flex flex-col shadow-xl relative transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[rgba(48,43,79,0.4)] border-2 border-[#A68A56]/30 shadow-[0_0_30px_rgba(199,125,255,0.15)]' 
          : 'glass-card border-[#D4AF37]/10'
      }`}>
        {view === 'month' ? (
          <>
            {/* Elegant Table Header for Month */}
            <div className={`grid grid-cols-7 border-b py-3 shadow-sm z-10 shrink-0 backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/30' 
                : 'glass-card border-[#D4AF37]/30'
            }`}>
               {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                 <div key={d} className={`text-center text-[10px] uppercase tracking-[0.2em] font-cinzel font-black transition-colors duration-500 ${
                   isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                 }`}>{d}</div>
               ))}
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              {renderMonthGrid()}
            </div>
          </>
        ) : view === 'week' ? (
          renderWeekView()
        ) : (
          renderDayFocus()
        )}
      </div>

      {/* Floating Sello de Lacre Button (Mobile FAB) */}
      {isMobile && (
        <button 
          onClick={() => setShowAddEventModal(true)}
          className={`fixed bottom-32 right-4 sm:right-6 w-16 h-16 border-3 rounded-full flex items-center justify-center z-[100] hover:scale-110 active:scale-90 transition-all overflow-hidden touch-manipulation safe-area-inset-bottom ${
            isNightMode 
              ? 'bg-[#C77DFF] border-[#A68A56] shadow-[0_10px_25px_rgba(199,125,255,0.5)]' 
              : 'bg-[#E35B8F] border-[#D4AF37] shadow-[0_10px_25px_rgba(227,91,143,0.4)]'
          }`}
          aria-label="Agregar evento"
        >
          <div className={`absolute inset-0 bg-gradient-to-tr opacity-50 transition-colors duration-500 ${
            isNightMode 
              ? 'from-[#C77DFF] to-[#A68A56]' 
              : 'from-[#E35B8F] to-[#FFD1DC]'
          }`}></div>
          <div className="relative z-10 text-white drop-shadow-md">
            {getIcon('plus', "w-7 h-7")}
          </div>
        </button>
      )}

      {/* Form Modal for Manual Event */}
      {showAddEventModal && (
        <div className={`fixed inset-0 z-[400] flex items-center justify-center backdrop-blur-xl p-4 transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-[#4A233E]/80'
        }`} onClick={() => setShowAddEventModal(false)}>
          <form onSubmit={handleAddCustomEvent} className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 font-inter border-2 backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
              : 'glass-card border-[#D4AF37]/40'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-cinzel text-lg mb-6 text-center font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>Agregar al Calendario</h2>
            <div className="space-y-4">
              <input 
                required 
                name="title" 
                type="text" 
                placeholder="Nombre del Hito..." 
                className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-sm outline-none font-bold transition-all ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                    : 'bg-white/30 border-[#D4AF37] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                }`}
              />
              <textarea
                name="description"
                placeholder="Descripción (opcional)..."
                className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-sm outline-none transition-all resize-none min-h-[60px] ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                    : 'bg-white/30 border-[#D4AF37] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                }`}
              />
              <input 
                required
                name="date" 
                type="date" 
                defaultValue={anchorDate.toISOString().split('T')[0]}
                className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-sm outline-none transition-all ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                    : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                }`}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[9px] uppercase font-bold mb-1 block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Hora Inicio (Opcional)</label>
                  <input 
                    name="time" 
                    type="time" 
                    className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-xs outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                        : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] uppercase font-bold mb-1 block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Hora Fin (Opcional)</label>
                  <input 
                    name="endTime" 
                    type="time" 
                    className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-xs outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                        : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`text-[9px] uppercase font-bold mb-1 block transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Prioridad</label>
                <select 
                  name="priority" 
                  className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-xs outline-none transition-all appearance-none cursor-pointer ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                      : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                  }`}
                >
                  <option value="low">Normal</option>
                  <option value="high">Crítica</option>
                </select>
              </div>
              <div className="flex justify-between p-2">
                {[COLORS.primary, COLORS.gold, COLORS.mauve, '#48C9B0', '#5DADE2'].map(c => {
                  const rgb = c.startsWith('#') 
                    ? {
                        r: parseInt(c.slice(1, 3), 16),
                        g: parseInt(c.slice(3, 5), 16),
                        b: parseInt(c.slice(5, 7), 16)
                      }
                    : { r: 0, g: 0, b: 0 };
                  return (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} required className="peer sr-only" defaultChecked={c === COLORS.primary} />
                      <div 
                        className={`w-8 h-8 rounded-full border-2 transition-all peer-checked:scale-125 peer-checked:ring-2 ${
                          isNightMode 
                            ? 'border-[rgba(48,43,79,0.8)] peer-checked:ring-[#C77DFF]' 
                            : 'border-white peer-checked:ring-[#D4AF37]'
                        }`}
                        style={{ 
                          backgroundColor: c,
                          boxShadow: `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isNightMode ? '0.6' : '0.4'})`
                        }} 
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setShowAddEventModal(false)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E] hover:text-[#E0E1DD]' : 'text-[#8B5E75]'
              }`}>Cerrar</button>
              <button type="submit" className={`flex-[2] py-3.5 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-all ${
                isNightMode 
                  ? 'bg-[#C77DFF] text-white shadow-[0_8px_20px_rgba(199,125,255,0.5)] hover:bg-[#B56DE6]' 
                  : 'btn-primary shadow-[0_8px_20px_rgba(227,91,143,0.4)]'
              }`}>Sellar Registro</button>
            </div>
          </form>
        </div>
      )}

      {/* Form Modal for Editing Event */}
      {editingEvent && onUpdateCustomEvent && (
        <div className={`fixed inset-0 z-[400] flex items-center justify-center backdrop-blur-xl p-4 transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-[#4A233E]/80'
        }`} onClick={() => setEditingEvent(null)}>
          <form onSubmit={handleUpdateCustomEvent} className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 font-inter border-2 backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
              : 'glass-card border-[#D4AF37]/40'
          }`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-cinzel text-lg mb-6 text-center font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>Editar Evento</h2>
            <div className="space-y-4">
              <input 
                required 
                name="title" 
                type="text" 
                placeholder="Nombre del Hito..." 
                defaultValue={editingEvent.title}
                className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-sm outline-none font-bold transition-all ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                    : 'bg-white/30 border-[#D4AF37] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                }`}
              />
              <textarea
                name="description"
                placeholder="Descripción (opcional)..."
                defaultValue={editingEvent.description || ''}
                className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-sm outline-none transition-all resize-none min-h-[60px] ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                    : 'bg-white/30 border-[#D4AF37] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                }`}
              />
              <input 
                required
                name="date" 
                type="date" 
                defaultValue={editingEvent.date}
                className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-sm outline-none transition-all ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                    : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                }`}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[9px] uppercase font-bold mb-1 block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Hora Inicio (Opcional)</label>
                  <input 
                    name="time" 
                    type="time" 
                    defaultValue={editingEvent.time || ''}
                    className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-xs outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                        : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] uppercase font-bold mb-1 block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Hora Fin (Opcional)</label>
                  <input 
                    name="endTime" 
                    type="time" 
                    defaultValue={editingEvent.endTime || ''}
                    className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-xs outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                        : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`text-[9px] uppercase font-bold mb-1 block transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Prioridad</label>
                <select 
                  name="priority" 
                  defaultValue={editingEvent.priority}
                  className={`w-full border-0 border-b-2 rounded-none px-4 py-3.5 text-xs outline-none transition-all appearance-none cursor-pointer ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.3)] border-[#A68A56] text-[#E0E1DD] focus:shadow-[0_4px_10px_rgba(199,125,255,0.3)] focus:border-[#C77DFF]' 
                      : 'bg-white/30 border-[#D4AF37] text-[#4A233E] focus:shadow-[0_4px_10px_rgba(212,175,55,0.2)]'
                  }`}
                >
                  <option value="low">Normal</option>
                  <option value="high">Crítica</option>
                </select>
              </div>
              <div className="flex justify-between p-2">
                {[COLORS.primary, COLORS.gold, COLORS.mauve, '#48C9B0', '#5DADE2'].map(c => {
                  const rgb = c.startsWith('#') 
                    ? {
                        r: parseInt(c.slice(1, 3), 16),
                        g: parseInt(c.slice(3, 5), 16),
                        b: parseInt(c.slice(5, 7), 16)
                      }
                    : { r: 0, g: 0, b: 0 };
                  return (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} required className="peer sr-only" defaultChecked={c === editingEvent.color} />
                      <div 
                        className={`w-8 h-8 rounded-full border-2 transition-all peer-checked:scale-125 peer-checked:ring-2 ${
                          isNightMode 
                            ? 'border-[rgba(48,43,79,0.8)] peer-checked:ring-[#C77DFF]' 
                            : 'border-white peer-checked:ring-[#D4AF37]'
                        }`}
                        style={{ 
                          backgroundColor: c,
                          boxShadow: `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isNightMode ? '0.6' : '0.4'})`
                        }} 
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setEditingEvent(null)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E] hover:text-[#E0E1DD]' : 'text-[#8B5E75]'
              }`}>Cancelar</button>
              <button type="submit" className={`flex-[2] py-3.5 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest transition-all ${
                isNightMode 
                  ? 'bg-[#C77DFF] text-white shadow-[0_8px_20px_rgba(199,125,255,0.5)] hover:bg-[#B56DE6]' 
                  : 'btn-primary shadow-[0_8px_20px_rgba(227,91,143,0.4)]'
              }`}>Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#4A233E]/80 backdrop-blur-xl p-4" onClick={() => setEventToDelete(null)}>
          <div className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 font-inter border-2 border-[#E35B8F]/40" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E35B8F]/20 flex items-center justify-center border-2 border-[#E35B8F]/40">
                {getIcon('trash', 'w-8 h-8 text-[#E35B8F]')}
              </div>
              <h2 className="font-cinzel text-xl text-[#4A233E] mb-2 font-bold tracking-wider">¿Eliminar Evento?</h2>
              <p className="text-sm text-[#8B5E75] font-garamond italic">
                "{eventToDelete.title}"
              </p>
              <p className="text-xs text-[#8B5E75] mt-3 opacity-70">
                Esta acción no se puede deshacer
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                type="button" 
                onClick={() => setEventToDelete(null)} 
                className="flex-1 py-3 rounded-xl text-[10px] font-black text-[#8B5E75] uppercase tracking-widest bg-white/60 border-2 border-[#F8C8DC] hover:bg-white/80 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (eventToDelete) {
                    onDeleteCustomEvent(eventToDelete.id);
                    setEventToDelete(null);
                  }
                }} 
                className="flex-[2] bg-[#E35B8F] text-white py-3.5 rounded-xl font-cinzel text-[10px] font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(227,91,143,0.4)] hover:bg-[#E35B8F]/90 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarModule;
