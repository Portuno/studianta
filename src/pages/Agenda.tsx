import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, CheckCircle2, Clock, BookOpenCheck, Target, Sparkles, Bell, School, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type CalendarEvent = {
  id: string;
  name: string;
  event_type?: string;
  event_date?: string; // YYYY-MM-DD
  description?: string | null;
  subject_id?: string | null;
};

type Schedule = {
  id: string;
  day_of_week: number; // 0-6
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  description?: string | null;
  location?: string | null;
  subject_id?: string | null;
};

type Subject = {
  id: string;
  name: string;
};

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const gradientBg = "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50";

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Lunes=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const formatYMD = (d: Date) => d.toISOString().split("T")[0];

const formatDayMonth = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

const iconByType: Record<string, JSX.Element> = {
  exam: <Bell className="h-4 w-4" />,
  practical_activity: <BookOpenCheck className="h-4 w-4" />,
  project_submission: <Target className="h-4 w-4" />,
  presentation: <School className="h-4 w-4" />,
  quiz: <CheckCircle2 className="h-4 w-4" />,
  assignment_due: <Clock className="h-4 w-4" />,
  lab_session: <BookOpenCheck className="h-4 w-4" />,
  other: <Sparkles className="h-4 w-4" />,
};

const colorByType: Record<string, string> = {
  exam: "bg-red-100 text-red-700 border-red-200",
  practical_activity: "bg-emerald-100 text-emerald-700 border-emerald-200",
  project_submission: "bg-orange-100 text-orange-700 border-orange-200",
  presentation: "bg-blue-100 text-blue-700 border-blue-200",
  quiz: "bg-purple-100 text-purple-700 border-purple-200",
  assignment_due: "bg-yellow-100 text-yellow-700 border-yellow-200",
  lab_session: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-violet-100 text-violet-700 border-violet-200",
};

const Agenda = () => {
  const { user } = useAuth();
  const [recommendedTask, setRecommendedTask] = useState<string>("Estudiar ahora: Revisión general");
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date();
    return Math.min(6, Math.max(0, Math.floor((today.getTime() - startOfWeek(today).getTime()) / (1000 * 60 * 60 * 24))));
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showRealtimeUpdate, setShowRealtimeUpdate] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState<string>("other");
  const [newEventSubjectId, setNewEventSubjectId] = useState<string | "">("");
  const [newEventDate, setNewEventDate] = useState<string>("");
  const [newEventDescription, setNewEventDescription] = useState("");

  // Temporizador de estudio
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const elapsedStr = useMemo(() => {
    const m = Math.floor(elapsedSec / 60).toString().padStart(2, "0");
    const s = (elapsedSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [elapsedSec]);

  // Cargar datos base para agenda y mapa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Eventos (subject_events)
        const { data: evs } = await supabase
          .from("subject_events")
          .select("id,name,event_type,event_date,description,subject_id")
          .eq("user_id", user!.id);
        setEvents(evs || []);

        // Horarios (subject_schedules)
        const { data: sch } = await supabase
          .from("subject_schedules")
          .select("id,day_of_week,start_time,end_time,description,location,subject_id")
          .eq("user_id", user!.id);
        setSchedules(sch || []);

        // Asignaturas (subjects)
        const { data: subs } = await supabase
          .from("subjects")
          .select("id,name")
          .order("name");
        setSubjects(subs || []);

        // Tarea recomendada (placeholder basado en primer evento próximo)
        const upcoming = (evs || [])
          .filter((e) => e.event_date)
          .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))[0];
        if (upcoming?.name) {
          setRecommendedTask(`Estudiar ahora: ${upcoming.name}`);
        }
        
        // Actualizar timestamp de última actualización
        setLastUpdate(new Date());
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Suscripción en tiempo real a cambios en subject_events
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subject_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subject_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Recargar eventos cuando hay cambios
          fetchData();
          setLastUpdate(new Date());
          setShowRealtimeUpdate(true);
          setTimeout(() => setShowRealtimeUpdate(false), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Función para recargar datos (extraída para reutilización)
  const fetchData = async () => {
    try {
      setLoading(true);
      // Eventos (subject_events)
      const { data: evs } = await supabase
        .from("subject_events")
        .select("id,name,event_type,event_date,description,subject_id")
        .eq("user_id", user!.id);
      setEvents(evs || []);

      // Horarios (subject_schedules)
      const { data: sch } = await supabase
        .from("subject_schedules")
        .select("id,day_of_week,start_time,end_time,description,location,subject_id")
        .eq("user_id", user!.id);
      setSchedules(sch || []);

      // Asignaturas (subjects)
      const { data: subs } = await supabase
        .from("subjects")
        .select("id,name")
        .order("name");
      setSubjects(subs || []);

      // Tarea recomendada (placeholder basado en primer evento próximo)
      const upcoming = (evs || [])
        .filter((e) => e.event_date)
        .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))[0];
      if (upcoming?.name) {
        setRecommendedTask(`Estudiar ahora: ${upcoming.name}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedDate = weekDays[selectedDayIndex];
  const selectedYMD = formatYMD(selectedDate);
  useEffect(() => {
    setNewEventDate(selectedYMD);
  }, [selectedYMD]);

  const eventsForSelectedDay = useMemo(() => {
    const calendarItems: Array<{ id: string; typeKey: string; title: string; time?: string; subjectName?: string; canStart?: boolean }> = [];
    
    // Clases programadas (mapear desde schedules)
    schedules
      .filter((s) => s.day_of_week === selectedDate.getDay())
      .forEach((s) => {
        calendarItems.push({
          id: `sch-${s.id}`,
          typeKey: "clase",
          title: s.description || "Clase",
          time: `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
          subjectName: (s.subject_id && subjectMap[s.subject_id]) || s.location || undefined,
          canStart: true,
        });
      });
    
    // Eventos con fecha
    events
      .filter((e) => e.event_date === selectedYMD)
      .forEach((e) => {
        const typeKey = (e.event_type || "otro").toLowerCase();
        calendarItems.push({ 
          id: `ev-${e.id}`, 
          typeKey, 
          title: e.name, 
          subjectName: (e.subject_id && subjectMap[e.subject_id]) || undefined,
          canStart: true,
        });
      });
    
    return calendarItems;
  }, [events, schedules, selectedDate, selectedYMD, subjectMap]);

  const upcomingDeadlines = useMemo(() => {
    const todayYMD = formatYMD(new Date());
    return events
      .filter((e) => e.event_date && e.event_date >= todayYMD)
      .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))
      .slice(0, 4);
  }, [events]);

  const todaySessions = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDay();
    return schedules.filter(s => s.day_of_week === todayDay);
  }, [schedules]);

  const nextSession = useMemo(() => {
    if (todaySessions.length === 0) return null;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return todaySessions.find(s => s.start_time > currentTime) || todaySessions[0];
  }, [todaySessions]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(prev => {
      const newStart = new Date(prev);
      newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
      return newStart;
    });
  };

  const handleStartSession = (item: any) => {
    setRecommendedTask(`Estudiar ahora: ${item.title}`);
    setTimerRunning(true);
    setElapsedSec(0);
  };

  return (
    <div className="pb-24 md:pb-6">
      {/* 1. AGENDA SEMANAL - Nueva sección principal arriba */}
      <section className={`sticky top-0 z-10 ${gradientBg} border-b border-blue-100/60`}>
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Agenda Semanal</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigateWeek('prev')}
                variant="outline"
                size="sm"
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigateWeek('next')}
                variant="outline"
                size="sm"
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendario semanal interactivo */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((date, idx) => {
              const isActive = idx === selectedDayIndex;
              const isToday = formatYMD(date) === formatYMD(new Date());
              const dayEvents = events.filter(e => e.event_date === formatYMD(date));
              const daySchedules = schedules.filter(s => s.day_of_week === date.getDay());
              const hasEvents = dayEvents.length > 0 || daySchedules.length > 0;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`relative p-3 rounded-xl border transition-all ${
                    isActive 
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg" 
                      : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-80 mb-1">
                    {dayNames[date.getDay()]}
                  </div>
                  <div className="text-sm font-bold mb-1">
                    {date.getDate()}
                  </div>
                  {isToday && (
                    <div className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                      Hoy
                    </div>
                  )}
                  {hasEvents && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Eventos del día seleccionado */}
          <div className="space-y-2">
            {eventsForSelectedDay.length === 0 ? (
              <Card className="p-4 rounded-xl border-0 text-center text-gray-500 bg-white/80">
                No hay sesiones programadas para este día
              </Card>
            ) : (
              eventsForSelectedDay.map((item) => {
                const typeKey = item.typeKey in colorByType ? item.typeKey : "otro";
                return (
                  <Card key={item.id} className="p-4 rounded-xl border-0 bg-white/90 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorByType[typeKey]} bg-white/70`}>
                          {iconByType[typeKey]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                          <div className="text-xs text-gray-600 flex items-center gap-2">
                            {item.time && <span>{item.time}</span>}
                            {item.subjectName && (
                              <span className="inline-flex items-center gap-1">
                                <School className="h-3 w-3" /> {item.subjectName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {item.canStart && (
                        <Button
                          onClick={() => handleStartSession(item)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                        >
                          Iniciar Sesión
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 2. PANEL DE ENFOQUE - "Tu sesión de hoy" (centro) */}
      <section className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-800">Tu sesión de hoy</h2>
        </div>
        
        <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex flex-col gap-4">
            {nextSession ? (
              <>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {nextSession.description || "Sesión de estudio"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {nextSession.subject_id && subjectMap[nextSession.subject_id] 
                      ? `Asignatura: ${subjectMap[nextSession.subject_id]}`
                      : nextSession.location || "Sin ubicación específica"
                    }
                  </p>
                  <p className="text-lg font-semibold text-emerald-600 mt-2">
                    {formatTime(nextSession.start_time)} - {formatTime(nextSession.end_time)}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      setRecommendedTask(`Estudiar ahora: ${nextSession.description || "Sesión de estudio"}`);
                      setTimerRunning(true);
                      setElapsedSec(0);
                    }}
                    className="w-full max-w-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-semibold"
                  >
                    {timerRunning ? (
                      <div className="flex items-center gap-2">
                        <Pause className="h-5 w-5" />
                        En curso • {elapsedStr}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Iniciar Sesión
                      </div>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {recommendedTask}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  No hay sesiones programadas para hoy. ¡Es un buen momento para estudiar!
                </p>
                <Button
                  onClick={() => setTimerRunning((r) => !r)}
                  className="w-full max-w-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-semibold"
                >
                  {timerRunning ? (
                    <div className="flex items-center gap-2">
                      <Pause className="h-5 w-5" />
                      En curso • {elapsedStr}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Iniciar Sesión
                    </div>
                  )}
                </Button>
              </div>
            )}

            {/* Controles del temporizador */}
            {timerRunning && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => setTimerRunning(false)}
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
                <Button
                  onClick={() => {
                    setTimerRunning(false);
                    setElapsedSec(0);
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reiniciar
                </Button>
              </div>
            )}

            {/* Métricas de progreso */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card className="p-4 rounded-xl border-0 bg-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Tiempo de Estudio</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{elapsedStr}</p>
              </Card>
              <Card className="p-4 rounded-xl border-0 bg-blue-100">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Temas Completados</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{0}</p>
              </Card>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. BLOQUES DE ESTUDIO RECOMENDADOS - Sugerencias para continuar (abajo) */}
      <section className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-800">Bloques de estudio recomendados</h2>
        </div>

        {/* Próximas metas */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Próximas metas</h3>
          {upcomingDeadlines.length === 0 ? (
            <Card className="p-4 rounded-xl border-0 text-center text-gray-500 bg-white/80">
              Sin próximas fechas
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 3).map((e) => (
                <Card key={e.id} className="p-4 rounded-xl border-0 bg-white/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.name}</p>
                      <p className="text-xs text-gray-600">{e.description || ""}</p>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{e.event_date && new Date(e.event_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Progreso general del curso */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Progreso del Curso</h3>
          <Card className="p-4 rounded-xl border-0 bg-white/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700">Progreso general</span>
              <span className="text-sm font-semibold text-gray-900">25%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '25%' }}></div>
            </div>
          </Card>
        </div>

        {/* Asignaturas con progreso */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Asignaturas</h3>
          {subjects.length === 0 ? (
            <Card className="p-4 rounded-xl border-0 text-center text-gray-500 bg-white/80">
              Aún no hay asignaturas
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {subjects.map((s) => (
                <Card key={s.id} className="p-4 rounded-xl border-0 bg-white/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">Progreso: 0%</p>
                    </div>
                    <div className="relative w-8 h-8">
                      <svg viewBox="0 0 36 36" className="w-8 h-8">
                        <path d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                        <path d="M18 2a16 16 0 1 1 0 0" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Botón flotante para agregar evento */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors md:hidden"
        title="Agregar evento manual"
      >
        <Plus className="h-6 w-6 mx-auto" />
      </button>

      {/* Modal Agregar Evento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Evento</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento *</label>
                <Input value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder="Ej., Estudiar Tema 5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    <option value="exam">Examen</option>
                    <option value="practical_activity">Actividad Práctica</option>
                    <option value="project_submission">Entrega de Proyecto</option>
                    <option value="presentation">Presentación</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment_due">Tarea Pendiente</option>
                    <option value="lab_session">Sesión de Laboratorio</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura (opcional)</label>
                <select value={newEventSubjectId} onChange={(e) => setNewEventSubjectId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Sin asignatura</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px]" placeholder="Notas adicionales" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-full px-6">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!user || !newEventName.trim() || !newEventDate) return;
                  try {
                    const { error } = await supabase.from('subject_events').insert({
                      user_id: user.id,
                      subject_id: newEventSubjectId || null,
                      name: newEventName.trim(),
                      event_type: newEventType,
                      event_date: newEventDate,
                      description: newEventDescription || null,
                    });
                    if (error) throw error;
                    // refresh events
                    const { data: evs } = await supabase
                      .from('subject_events')
                      .select('id,name,event_type,event_date,description,subject_id')
                      .eq('user_id', user.id);
                    setEvents(evs || []);
                    setShowAddModal(false);
                    setNewEventName(""); setNewEventType("other"); setNewEventSubjectId(""); setNewEventDescription("");
                  } catch (e) {
                    console.error(e);
                    alert('No se pudo crear el evento.');
                  }
                }}
                className="rounded-full px-6"
                disabled={!newEventName.trim() || !newEventDate}
              >
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;


