import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, BookOpenCheck, Target, Sparkles, Bell, School } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type CalendarEvent = {
  id: string;
  name: string;
  event_type?: string;
  event_date?: string; // YYYY-MM-DD
  description?: string | null;
};

type Schedule = {
  id: string;
  day_of_week: number; // 0-6
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  description?: string | null;
  location?: string | null;
};

type Subject = {
  id: string;
  name: string;
};

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const gradientBg = "bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50";

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

const iconByType: Record<string, JSX.Element> = {
  examen: <Bell className="h-4 w-4" />, // Examen/entrega
  entrega: <Bell className="h-4 w-4" />, // alias
  clase: <School className="h-4 w-4" />, // Clase
  estudio: <BookOpenCheck className="h-4 w-4" />, // Bloque estudio
  otro: <Sparkles className="h-4 w-4" />, // Otro
};

const colorByType: Record<string, string> = {
  examen: "bg-red-100 text-red-700 border-red-200",
  entrega: "bg-orange-100 text-orange-700 border-orange-200",
  clase: "bg-blue-100 text-blue-700 border-blue-200",
  estudio: "bg-emerald-100 text-emerald-700 border-emerald-200",
  otro: "bg-violet-100 text-violet-700 border-violet-200",
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
  const [loading, setLoading] = useState(false);

  // Temporizador de estudio (simple)
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
          .select("id,name,event_type,event_date,description")
          .eq("user_id", user!.id);
        setEvents(evs || []);

        // Horarios (subject_schedules)
        const { data: sch } = await supabase
          .from("subject_schedules")
          .select("id,day_of_week,start_time,end_time,description,location")
          .eq("user_id", user!.id);
        setSchedules(sch || []);

        // Asignaturas (subjects)
        const { data: subs } = await supabase
          .from("subjects")
          .select("id,name")
          .eq("user_id", user!.id)
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
    if (user) fetchData();
  }, [user]);

  const selectedDate = weekDays[selectedDayIndex];
  const selectedYMD = formatYMD(selectedDate);

  const eventsForSelectedDay = useMemo(() => {
    const calendarItems: Array<{ id: string; typeKey: string; title: string; time?: string; subtitle?: string }> = [];
    // Bloques de estudio recomendados por IA (placeholder)
    calendarItems.push({ id: `ai-${selectedYMD}`, typeKey: "estudio", title: "Bloque de estudio recomendado", time: "60 min", subtitle: "IA" });
    // Clases (mapear desde schedules)
    schedules
      .filter((s) => s.day_of_week === selectedDate.getDay())
      .forEach((s) => {
        calendarItems.push({
          id: `sch-${s.id}`,
          typeKey: "clase",
          title: s.description || "Clase",
          time: `${s.start_time} - ${s.end_time}`,
          subtitle: s.location || undefined,
        });
      });
    // Eventos con fecha
    events
      .filter((e) => e.event_date === selectedYMD)
      .forEach((e) => {
        const typeKey = (e.event_type || "otro").toLowerCase();
        calendarItems.push({ id: `ev-${e.id}`, typeKey, title: e.name, subtitle: e.description || undefined });
      });
    return calendarItems;
  }, [events, schedules, selectedDate, selectedYMD]);

  const upcomingDeadlines = useMemo(() => {
    const todayYMD = formatYMD(new Date());
    return events
      .filter((e) => e.event_date && e.event_date >= todayYMD)
      .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))
      .slice(0, 4);
  }, [events]);

  return (
    <div className="pb-24">
      {/* 1. Sección Superior: Tu Foco Hoy */}
      <section className={`sticky top-0 z-10 ${gradientBg} border-b border-pink-100/60`}>
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <h2 className="text-lg font-semibold text-gray-800">Tu foco hoy</h2>
          </div>
          <Card className="p-4 rounded-2xl border-0 shadow-sm bg-white/90">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setTimerRunning((r) => !r)}
                className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white py-6 text-base font-semibold"
              >
                {timerRunning ? `En curso • ${elapsedStr}` : recommendedTask}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 rounded-xl border-0 bg-pink-50">
                  <div className="flex items-center gap-2 text-pink-700">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Tiempo de Estudio</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800 mt-1">{elapsedStr}</p>
                </Card>
                <Card className="p-3 rounded-xl border-0 bg-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Temas Completados</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800 mt-1">{0}</p>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. Sección Media: Tu Agenda Semanal */}
      <section className="px-4 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Tu agenda semanal</h2>
        </div>

        {/* Barra de días */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {weekDays.map((date, idx) => {
            const isActive = idx === selectedDayIndex;
            const isToday = formatYMD(date) === formatYMD(new Date());
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`min-w-[64px] px-3 py-2 rounded-xl border text-center transition-all ${
                  isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide opacity-80">
                  {dayNames[date.getDay()]}
                </div>
                <div className="text-sm font-semibold">
                  {formatDayMonth(date)}
                </div>
                {isToday && !isActive && (
                  <div className="mt-1 text-[10px] text-blue-600 font-medium">hoy</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Eventos del día */}
        <div className="mt-4 space-y-2">
          {loading && (
            <Card className="p-4 rounded-xl border-0 text-center text-gray-500">Cargando agenda...</Card>
          )}
          {!loading && eventsForSelectedDay.length === 0 && (
            <Card className="p-4 rounded-xl border-0 text-center text-gray-500">
              No hay eventos para este día
            </Card>
          )}
          {eventsForSelectedDay.map((item) => {
            const typeKey = item.typeKey in colorByType ? item.typeKey : "otro";
            return (
              <Card key={item.id} className={`p-3 rounded-xl border ${colorByType[typeKey]} bg-white`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 grid place-items-center rounded-md border ${colorByType[typeKey]} w-7 h-7 bg-white/70`}>
                    {iconByType[typeKey]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      {item.time && <span>{item.time}</span>}
                      {item.subtitle && (
                        <span className="inline-flex items-center gap-1">
                          <Target className="h-3 w-3" /> {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. Sección Inferior: El Mapa del Curso */}
      <section className="px-4 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpenCheck className="h-4 w-4 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Mapa del curso</h2>
        </div>

        {/* Próximas metas */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Próximas metas</h3>
          {upcomingDeadlines.length === 0 ? (
            <Card className="p-4 rounded-xl border-0 text-center text-gray-500">Sin próximas fechas</Card>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((e) => (
                <Card key={e.id} className="p-3 rounded-xl border-0 bg-white/90">
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

        {/* Lista de temas (sustituido por asignaturas con progreso) */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Asignaturas</h3>
          {subjects.length === 0 ? (
            <Card className="p-4 rounded-xl border-0 text-center text-gray-500">Aún no hay asignaturas</Card>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {subjects.map((s) => (
                <Card key={s.id} className="p-3 rounded-xl border-0 bg-white/90">
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
    </div>
  );
};

export default Agenda;


