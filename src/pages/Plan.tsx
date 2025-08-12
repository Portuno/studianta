import { useState, useEffect, useMemo } from "react";
import { Calendar, Target, TrendingUp, Loader2, Plus, Clock, BookOpen, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeeklyGoals } from "@/hooks/useSupabase";
import { useStudySessions } from "@/hooks/useSupabase";
import { useSubjects } from "@/hooks/useSupabase";
import { useStudyMaterials } from "@/hooks/useSupabase";
import { format, startOfWeek, endOfWeek, parseISO, addDays, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface StudyBlock {
  id: string;
  date: Date;
  startTime: string;
  duration: number;
  topic: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

interface AcademicEvent {
  id: string;
  date: Date;
  title: string;
  type: 'exam' | 'assignment' | 'class' | 'deadline';
  subject: string;
  description?: string;
}

export default function Plan() {
  const { user } = useAuth();
  const { goals, loading: goalsLoading } = useWeeklyGoals();
  const { sessions, loading: sessionsLoading } = useStudySessions();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { materials, loading: materialsLoading } = useStudyMaterials();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loading = goalsLoading || sessionsLoading || subjectsLoading || materialsLoading || eventsLoading;

  // Obtener semana actual
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Domingo
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Cargar eventos académicos reales de la base de datos
  useEffect(() => {
    const fetchAcademicEvents = async () => {
      if (!user) return;
      
      try {
        setEventsLoading(true);
        
                 // Obtener eventos de subject_events
         const { data: eventsData, error: eventsError } = await supabase
           .from('subject_events')
           .select(`
             id,
             name,
             event_type,
             event_date,
             description,
             subjects(name)
           `)
           .eq('user_id', user.id)
           .gte('event_date', new Date().toISOString().split('T')[0]) // Solo eventos futuros
           .order('event_date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching academic events:', eventsError);
          return;
        }

                 // Convertir a formato AcademicEvent
         const events: AcademicEvent[] = eventsData.map(event => ({
           id: event.id,
           date: new Date(event.event_date),
           title: event.name,
           type: mapEventType(event.event_type),
           subject: event.subjects?.[0]?.name || 'Unknown Subject',
           description: event.description || undefined
         }));

        setAcademicEvents(events);
      } catch (error) {
        console.error('Error fetching academic events:', error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchAcademicEvents();
  }, [user]);

  // Mapear tipos de eventos de la base de datos a nuestros tipos
  const mapEventType = (eventType: string): 'exam' | 'assignment' | 'class' | 'deadline' => {
    const type = eventType.toLowerCase();
    if (type.includes('exam') || type.includes('test')) return 'exam';
    if (type.includes('assignment') || type.includes('homework') || type.includes('paper')) return 'assignment';
    if (type.includes('class') || type.includes('lecture')) return 'class';
    return 'deadline';
  };

  // Filtrar metas de esta semana
  const thisWeekGoals = useMemo(() => {
    return goals.filter(goal => {
      const goalStart = parseISO(goal.week_start);
      const goalEnd = parseISO(goal.week_end);
      return goalStart <= weekEnd && goalEnd >= weekStart;
    });
  }, [goals, weekStart, weekEnd]);

  // Calcular tiempo de estudio de esta semana
  const thisWeekSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = parseISO(session.created_at);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
  }, [sessions, weekStart, weekEnd]);

  const plannedTime = thisWeekSessions.reduce((acc, session) => {
    if (session.duration) return acc + session.duration;
    return acc;
  }, 0);

  // Por ahora simulamos el tiempo completado ya que no tenemos la propiedad 'completed'
  const completedTime = Math.round(plannedTime * 0.7); // Simulamos 70% completado

  // Calcular racha de estudio (días consecutivos)
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasSession = sessions.some(session => {
        const sessionDate = parseISO(session.created_at);
        return sessionDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasSession) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const studyStreak = calculateStreak();

  // Calcular progreso del curso activo
  const calculateCourseProgress = () => {
    if (!subjects.length) return 0;
    
    const activeSubject = subjects[0]; // Por ahora tomamos el primer subject
    const subjectMaterials = materials.filter(m => m.subject_id === activeSubject.id);
    
    if (subjectMaterials.length === 0) return 0;
    
    // Simulamos progreso basado en materiales completados
    const completedMaterials = subjectMaterials.filter(m => m.ai_status === 'completed');
    return Math.round((completedMaterials.length / subjectMaterials.length) * 100);
  };

  // Generar bloques de estudio sugeridos por IA
  const generateStudyBlocks = (): StudyBlock[] => {
    const blocks: StudyBlock[] = [];
    const today = new Date();
    
    // Simulamos bloques de estudio para los próximos 7 días
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      
      // Solo agregar bloques para días de semana
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        blocks.push({
          id: `block-${i}`,
          date,
          startTime: '09:00',
          duration: 60,
          topic: 'Calculus - Derivatives',
          subject: 'Mathematics',
          priority: 'high',
          completed: false
        });
        
        blocks.push({
          id: `block-${i}-2`,
          date,
          startTime: '14:00',
          duration: 45,
          topic: 'Literature Review',
          subject: 'English',
          priority: 'medium',
          completed: false
        });
      }
    }
    
    return blocks;
  };

  const studyBlocks = generateStudyBlocks();
  const courseProgress = calculateCourseProgress();

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="text-center pt-8 pb-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your study plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center pt-8 pb-6">
        <h1 className="text-2xl font-light text-foreground/90 mb-2">Study Plan</h1>
        {academicEvents.length > 0 && (
          <p className="text-muted-foreground text-sm">
            Upcoming: {academicEvents[0].title} on {format(academicEvents[0].date, 'MMM dd')}
          </p>
        )}
      </div>

      {/* Overview - Summary & Key Metrics */}
      <div className="px-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground/80">Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course Progress */}
          <Card className="gradient-card border-border/30 p-4 rounded-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted/20"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${courseProgress * 1.01}, 100`}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{courseProgress}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Course Progress</p>
          </Card>

          {/* Study Time */}
          <Card className="gradient-card border-border/30 p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {Math.round(completedTime / 60)}/{Math.round(plannedTime / 60)}m
            </div>
            <p className="text-sm text-muted-foreground">Study Time (Planned/Completed)</p>
          </Card>

          {/* Study Streak */}
          <Card className="gradient-card border-border/30 p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-accent mb-1">
              {studyStreak}
            </div>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        {academicEvents.length > 0 && (
          <Card className="gradient-card border-border/30 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-accent" size={18} />
              <h3 className="font-medium text-foreground/80">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-2">
              {academicEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'exam' ? 'bg-red-500' : 
                      event.type === 'assignment' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.subject}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(event.date, 'MMM dd')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Interactive Calendar */}
      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground/80">Weekly Calendar</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={prevWeek} className="rounded-full">
              <ChevronLeft size={16} />
            </Button>
            <Button size="sm" variant="outline" onClick={nextWeek} className="rounded-full">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <Card className="gradient-card border-border/30 p-4 rounded-2xl">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayEvents = academicEvents.filter(event => isSameDay(event.date, day));
              const dayBlocks = studyBlocks.filter(block => isSameDay(block.date, day));
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/10' : 
                    isCurrentDay ? 'border-accent bg-accent/10' : 
                    'border-border/30 hover:border-border/50'
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-xs font-medium text-center mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  {/* Events */}
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`w-full h-2 rounded-full mb-1 ${
                        event.type === 'exam' ? 'bg-red-500' : 
                        event.type === 'assignment' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      title={`${event.title} - ${event.subject}`}
                    />
                  ))}
                  
                  {/* Study Blocks */}
                  {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`w-full h-2 rounded-full mb-1 ${
                        block.priority === 'high' ? 'bg-primary' : 
                        block.priority === 'medium' ? 'bg-accent' : 'bg-muted-foreground'
                      }`}
                      title={`${block.topic} - ${block.duration}min`}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Dynamic Plan - Detailed Strategy */}
      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground/80">Study Strategy</h2>
          <Button size="sm" variant="outline" className="rounded-full">
            <Plus size={16} className="mr-1" />
            Add Block
          </Button>
        </div>

        {/* Selected Date Details */}
        <Card className="gradient-card border-border/30 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-primary" size={18} />
            <h3 className="font-medium text-foreground/80">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
          </div>
          
          <div className="space-y-3">
            {/* Academic Events for Selected Date */}
            {academicEvents
              .filter(event => isSameDay(event.date, selectedDate))
              .map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border bg-background/50 border-border/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'exam' ? 'bg-red-500' : 
                        event.type === 'assignment' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.subject}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </div>
                </div>
              ))}

            {/* Study Blocks for Selected Date */}
            {studyBlocks
              .filter(block => isSameDay(block.date, selectedDate))
              .map((block) => (
                <div
                  key={block.id}
                  className={`p-3 rounded-lg border ${
                    block.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-background/50 border-border/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        block.priority === 'high' ? 'bg-red-500' : 
                        block.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-foreground">{block.topic}</p>
                        <p className="text-sm text-muted-foreground">{block.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{block.startTime}</span>
                      <span className="text-sm text-muted-foreground">{block.duration}m</span>
                      {block.completed ? (
                        <CheckCircle2 className="text-green-500" size={16} />
                      ) : (
                        <Button size="sm" variant="outline" className="rounded-full">
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            
            {academicEvents.filter(event => isSameDay(event.date, selectedDate)).length === 0 && 
             studyBlocks.filter(block => isSameDay(block.date, selectedDate)).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No events or study blocks scheduled for this day
              </p>
            )}
          </div>
        </Card>

        {/* Topic List with Progress */}
        <Card className="gradient-card border-border/30 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="text-primary" size={18} />
            <h3 className="font-medium text-foreground/80">Course Topics</h3>
          </div>
          
          <div className="space-y-2">
            {['Introduction to Calculus', 'Limits and Continuity', 'Derivatives', 'Applications of Derivatives', 'Integration'].map((topic, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50">
                <input
                  type="checkbox"
                  checked={index < 2} // Simulamos que los primeros 2 están completados
                  className="rounded border-border/30 text-primary focus:ring-primary"
                />
                <span className={`text-sm ${index < 2 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {topic}
                </span>
                {index === 2 && (
                  <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Next Priority
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly Goals (mantener la funcionalidad existente) */}
      <div className="px-6 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-primary" size={20} />
            <h2 className="text-lg font-medium text-foreground/80">Weekly Goals</h2>
          </div>
          <Button size="sm" variant="outline" className="rounded-full">
            <Plus size={16} className="mr-1" />
            Add Goal
          </Button>
        </div>
        
        {thisWeekGoals.length === 0 ? (
          <Card className="gradient-card border-border/30 p-6 rounded-2xl text-center">
            <p className="text-muted-foreground">No goals set for this week</p>
            <p className="text-sm text-muted-foreground mt-2">
              Set your first goal to track your progress
            </p>
          </Card>
        ) : (
          thisWeekGoals.map((goal) => (
            <Card 
              key={goal.id} 
              className="gradient-card border-border/30 p-4 rounded-2xl"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-foreground">
                    Subject {goal.subject_id.slice(0, 8)}...
                  </h3>
                  <span className="text-sm text-primary font-medium">
                    {goal.current_hours}/{goal.target_hours}h
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((goal.current_hours / goal.target_hours) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Week of {format(parseISO(goal.week_start), 'MMM dd')} - {format(parseISO(goal.week_end), 'MMM dd')}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}