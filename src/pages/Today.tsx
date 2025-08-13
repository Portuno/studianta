import { useState } from "react";
import { Plus, Clock, CheckCircle2, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useStudySessions } from "@/hooks/useSupabase";
import { format, parseISO } from "date-fns";

export default function Today() {
  const { user, signOut } = useAuth();
  const { sessions, loading, addSession, updateSession } = useStudySessions();
  const [showAddForm, setShowAddForm] = useState(false);

  // Obtener sesiones de hoy
  const today = new Date();
  const todaySessions = sessions.filter(session => {
    const sessionDate = parseISO(session.start_time);
    return sessionDate.toDateString() === today.toDateString();
  });

  // Calcular estadísticas
  const completedSessions = todaySessions.filter(s => s.completed).length;
  const totalSessions = todaySessions.length;
  const totalStudyTime = todaySessions.reduce((acc, session) => {
    if (session.duration) return acc + session.duration;
    return acc;
  }, 0);

  const handleToggleComplete = async (sessionId: string, completed: boolean) => {
    await updateSession(sessionId, { completed: !completed });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="text-center pt-8 pb-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your study sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center pt-8 pb-6">
        <div className="flex items-center justify-between px-6 mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </Button>
        </div>
        <h1 className="text-2xl font-light text-foreground/90 mb-2">Today</h1>
        <p className="text-muted-foreground text-sm">
          {format(today, 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="px-6">
        <Button 
          className="w-full gradient-primary text-white border-0 py-3 rounded-2xl font-medium shadow-lg shadow-primary/20"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} className="mr-2" />
          Add Study Session
        </Button>
      </div>

      {/* Today's Schedule */}
      <div className="px-6 space-y-3">
        <h2 className="text-lg font-medium text-foreground/80 mb-4">Schedule</h2>
        {todaySessions.length === 0 ? (
          <Card className="gradient-card border-border/30 p-6 rounded-2xl text-center">
            <p className="text-muted-foreground">No study sessions scheduled for today</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first session to get started!
            </p>
          </Card>
        ) : (
          todaySessions.map((session) => (
            <Card 
              key={session.id} 
              className="gradient-card border-border/30 p-4 rounded-2xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleComplete(session.id, session.completed)}
                  className="flex-shrink-0"
                >
                  <CheckCircle2 
                    size={20} 
                    className={`${
                      session.completed 
                        ? "text-green-500 fill-green-100" 
                        : "text-muted-foreground"
                    }`} 
                  />
                </button>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    session.completed 
                      ? "text-muted-foreground line-through" 
                      : "text-foreground"
                  }`}>
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(parseISO(session.start_time), 'HH:mm')}
                    </span>
                    {session.subject && (
                      <span className="text-xs text-muted-foreground ml-2 px-2 py-1 bg-muted rounded-full">
                        {session.subject}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Study Stats */}
      <div className="px-6">
        <Card className="gradient-card border-border/30 p-6 rounded-2xl">
          <h3 className="text-lg font-medium text-foreground/80 mb-4">Today's Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(totalStudyTime / 60)}m
              </div>
              <div className="text-sm text-muted-foreground">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {completedSessions}/{totalSessions}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}