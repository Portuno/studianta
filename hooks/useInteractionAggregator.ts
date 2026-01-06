import { useMemo } from 'react';
import { 
  StudentProfileContext, 
  Subject, 
  Transaction, 
  JournalEntry, 
  CustomCalendarEvent, 
  Module,
  UserProfile 
} from '../types';
import { getFocusSessions } from '../utils/focusTracker';

interface UseInteractionAggregatorParams {
  userProfile: UserProfile | null;
  subjects: Subject[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  customEvents: CustomCalendarEvent[];
  modules: Module[];
  monthlyBudget: number;
}

export const useInteractionAggregator = ({
  userProfile,
  subjects,
  transactions,
  journalEntries,
  customEvents,
  modules,
  monthlyBudget,
}: UseInteractionAggregatorParams): StudentProfileContext => {
  return useMemo(() => {
    const now = new Date();
    const lastSync = now.toISOString();

    // ========== USER PROFILE ==========
    const user_profile = {
      full_name: userProfile?.full_name || undefined,
      email: userProfile?.email || '',
      career: userProfile?.career || undefined,
      institution: userProfile?.institution || undefined,
      arcane_level: userProfile?.arcane_level || 'Buscadora de Luz',
      essence: userProfile?.essence || 0,
      total_essence_earned: userProfile?.total_essence_earned || 0,
      account_created: userProfile?.created_at || now.toISOString(),
    };

    // ========== FINANCIAL STATE ==========
    const totalSpent = transactions
      .filter(t => t.type === 'Gasto')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'Ingreso')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const balance = (monthlyBudget + totalIncome) - totalSpent;
    
    let financialStatus: 'saludable' | 'precario' | 'crítico' = 'saludable';
    if (balance < 0) {
      financialStatus = 'crítico';
    } else if (balance < monthlyBudget * 0.2) {
      financialStatus = 'precario';
    }

    // Calcular categoría más frecuente
    const categoryCounts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'Gasto') {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      }
    });
    const mostFrequentCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Calcular tendencia mensual
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSpent = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'Gasto' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const lastMonthSpent = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'Gasto' && 
               date.getMonth() === lastMonth && 
               date.getFullYear() === lastMonthYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    let monthlyTrend: 'ascendente' | 'descendente' | 'estable' = 'estable';
    if (currentMonthSpent > lastMonthSpent * 1.1) {
      monthlyTrend = 'ascendente';
    } else if (currentMonthSpent < lastMonthSpent * 0.9) {
      monthlyTrend = 'descendente';
    }

    // Ordenar transacciones por fecha (más recientes primero)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const financial_state = {
      budget: monthlyBudget,
      balance,
      total_spent: totalSpent,
      total_income: totalIncome,
      status: financialStatus,
      transactions: sortedTransactions.map(t => ({
        id: t.id,
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: t.date,
        description: t.description,
      })),
      summary: {
        most_frequent_category: mostFrequentCategory,
        monthly_trend: monthlyTrend,
      },
    };

    // ========== SUBJECTS ==========
    const subjectsData = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      career: subject.career,
      status: subject.status,
      grade: subject.grade,
      professor: subject.professor,
      email: subject.email,
      aula: subject.aula,
      term_start: subject.termStart,
      term_end: subject.termEnd,
      milestones: subject.milestones.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time,
        type: m.type,
      })),
      schedules: subject.schedules.map(s => ({
        id: s.id,
        day: s.day,
        start_time: s.startTime,
        end_time: s.endTime,
      })),
      notes: subject.notes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        date: n.date,
        important_fragments: n.importantFragments,
        is_sealed: n.isSealed || false,
      })),
    }));

    // Calcular próximos deadlines
    const allMilestones = subjects.flatMap(s => s.milestones);
    const upcomingMilestones = allMilestones.filter(m => {
      const milestoneDate = new Date(m.date);
      const daysDiff = (milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 30;
    });

    const nextCriticalDate = upcomingMilestones.length > 0
      ? upcomingMilestones.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0].date
      : undefined;

    const academic_summary = {
      active_subjects_count: subjects.filter(s => s.status === 'Cursando').length,
      upcoming_deadlines: upcomingMilestones.length,
      next_critical_date: nextCriticalDate,
      total_milestones: allMilestones.length,
    };

    // ========== CALENDAR ==========
    const upcomingEvents = customEvents.filter(e => {
      const eventDate = new Date(e.date);
      const daysDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 30;
    });

    const calendar = {
      custom_events: customEvents.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        time: e.time,
        color: e.color,
        priority: e.priority,
      })),
      upcoming_events_count: upcomingEvents.length,
    };

    // ========== JOURNAL ==========
    // Ordenar entradas por fecha (más recientes primero)
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastEntry = sortedEntries[0];
    const lastEntryDaysAgo = lastEntry
      ? Math.floor((now.getTime() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Distribución de moods
    const moodDistribution: Record<string, number> = {};
    journalEntries.forEach(e => {
      moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
    });

    const mostCommonMood = Object.entries(moodDistribution)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Frecuencia de escritura
    const entriesLast30Days = journalEntries.filter(e => {
      const entryDate = new Date(e.date);
      const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length;

    let writingFrequency: 'alta' | 'media' | 'baja' = 'baja';
    if (entriesLast30Days >= 20) {
      writingFrequency = 'alta';
    } else if (entriesLast30Days >= 10) {
      writingFrequency = 'media';
    }

    const journal = {
      entries: sortedEntries.map(e => ({
        id: e.id,
        date: e.date,
        mood: e.mood,
        content: e.content,
        is_locked: e.isLocked,
        // NO incluir photo (base64 muy pesado)
      })),
      summary: {
        total_entries: journalEntries.length,
        last_entry_days_ago: lastEntryDaysAgo === Infinity ? 0 : lastEntryDaysAgo,
        most_common_mood: mostCommonMood,
        writing_frequency: writingFrequency,
        mood_distribution: moodDistribution,
      },
    };

    // ========== FOCUS ==========
    const focusSessions = getFocusSessions();
    
    // Ordenar sesiones por fecha (más recientes primero)
    const sortedSessions = [...focusSessions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalHours = focusSessions.reduce((acc, s) => acc + (s.duration_minutes / 60), 0);
    
    // Sesiones esta semana
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionsThisWeek = focusSessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= weekAgo;
    }).length;

    // Constancy score (0-1): basado en sesiones regulares
    let consistencyScore = 0;
    if (focusSessions.length > 0) {
      // Calcular semanas con sesiones
      const weeksWithSessions = new Set(
        focusSessions.map(s => {
          const date = new Date(s.date);
          const year = date.getFullYear();
          const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7));
          return `${year}-W${week}`;
        })
      ).size;
      
      const accountCreated = new Date(user_profile.account_created);
      const totalWeeks = Math.max(1, Math.ceil((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 7)));
      const weeklyFrequency = sessionsThisWeek / 7; // Sesiones por día esta semana
      consistencyScore = Math.min(1, (weeksWithSessions / totalWeeks) * Math.min(1, weeklyFrequency * 2)); // Factor de frecuencia semanal
    }

    const averageSessionDuration = focusSessions.length > 0
      ? focusSessions.reduce((acc, s) => acc + s.duration_minutes, 0) / focusSessions.length
      : 0;

    const focus = {
      sessions: sortedSessions,
      summary: {
        total_hours: Math.round(totalHours * 10) / 10,
        sessions_this_week: sessionsThisWeek,
        consistency_score: Math.round(consistencyScore * 100) / 100,
        average_session_duration: Math.round(averageSessionDuration),
      },
    };

    // ========== ACTIVE MODULES ==========
    const active_modules = modules.map(m => ({
      id: m.id,
      name: m.name,
      active: m.active,
    }));

    // ========== ASSEMBLE COMPLETE CONTEXT ==========
    return {
      last_sync: lastSync,
      user_profile,
      financial_state,
      subjects: subjectsData,
      academic_summary,
      calendar,
      journal,
      focus,
      active_modules,
    };
  }, [
    userProfile,
    subjects,
    transactions,
    journalEntries,
    customEvents,
    modules,
    monthlyBudget,
  ]);
};

