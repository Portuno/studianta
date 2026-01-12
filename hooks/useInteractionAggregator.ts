import { useMemo } from 'react';
import { 
  StudentProfileContext, 
  Subject, 
  Transaction, 
  JournalEntry, 
  CustomCalendarEvent, 
  Module,
  UserProfile,
  BalanzaProTransaction,
  NutritionEntry,
  NutritionGoals,
  NutritionCorrelation,
  Exam,
  ExamResult
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
  balanzaProTransactions?: BalanzaProTransaction[];
  nutritionEntries?: NutritionEntry[];
  nutritionGoals?: NutritionGoals | null;
  nutritionCorrelations?: NutritionCorrelation[];
  exams?: Exam[];
  examResults?: ExamResult[];
}

export const useInteractionAggregator = ({
  userProfile,
  subjects,
  transactions,
  journalEntries,
  customEvents,
  modules,
  monthlyBudget,
  balanzaProTransactions = [],
  nutritionEntries = [],
  nutritionGoals = null,
  nutritionCorrelations = [],
  exams = [],
  examResults = [],
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

    // ========== BALANZA PRO STATE ==========
    let balanza_pro_state = undefined;
    if (balanzaProTransactions.length > 0) {
      const totalIngresos = balanzaProTransactions
        .filter(t => t.type === 'Ingreso')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const totalEgresos = balanzaProTransactions
        .filter(t => t.type === 'Egreso')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const gastosFijos = balanzaProTransactions
        .filter(t => t.type === 'Egreso' && t.is_recurring)
        .reduce((acc, t) => acc + t.amount, 0);
      
      const gastosExtra = balanzaProTransactions
        .filter(t => t.type === 'Egreso' && t.is_extra)
        .reduce((acc, t) => acc + t.amount, 0);
      
      const balance = totalIngresos - totalEgresos;
      
      let status: 'saludable' | 'precario' | 'crítico' = 'saludable';
      if (balance < 0) {
        status = 'crítico';
      } else if (balance < totalIngresos * 0.2) {
        status = 'precario';
      }

      // Método de pago más usado
      const paymentMethodCounts: Record<string, number> = {};
      balanzaProTransactions.forEach(t => {
        paymentMethodCounts[t.payment_method] = (paymentMethodCounts[t.payment_method] || 0) + 1;
      });
      const mostUsedPaymentMethod = Object.entries(paymentMethodCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      // Tags más frecuentes
      const tagCounts: Record<string, number> = {};
      balanzaProTransactions.forEach(t => {
        t.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const mostFrequentTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      // Balance por método de pago
      const paymentMethodsBalance: Record<string, number> = {};
      balanzaProTransactions.forEach(t => {
        if (!paymentMethodsBalance[t.payment_method]) {
          paymentMethodsBalance[t.payment_method] = 0;
        }
        if (t.type === 'Ingreso') {
          paymentMethodsBalance[t.payment_method] += t.amount;
        } else {
          paymentMethodsBalance[t.payment_method] -= t.amount;
        }
      });

      // Ordenar transacciones por fecha
      const sortedBalanzaProTransactions = [...balanzaProTransactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      balanza_pro_state = {
        balance,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        gastos_fijos: gastosFijos,
        gastos_extra: gastosExtra,
        status,
        transactions: sortedBalanzaProTransactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          payment_method: t.payment_method,
          is_extra: t.is_extra,
          is_recurring: t.is_recurring,
          tags: t.tags,
          status: t.status,
          date: t.date,
          description: t.description,
        })),
        summary: {
          most_used_payment_method: mostUsedPaymentMethod,
          most_frequent_tags: mostFrequentTags,
          payment_methods_balance: paymentMethodsBalance,
        },
      };
    }

    // ========== NUTRITION STATE ==========
    let nutrition_state = undefined;
    if (nutritionEntries.length > 0 || nutritionGoals || nutritionCorrelations.length > 0) {
      // Ordenar entradas por fecha (más recientes primero)
      const sortedNutritionEntries = [...nutritionEntries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Entradas esta semana
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const entriesThisWeek = nutritionEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= weekAgo;
      }).length;

      // Calcular promedio de calorías diarias
      const dailyCalories: Record<string, number> = {};
      nutritionEntries.forEach(e => {
        const dateKey = e.date.split('T')[0];
        dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + e.total_calories;
      });
      const averageDailyCalories = Object.keys(dailyCalories).length > 0
        ? Object.values(dailyCalories).reduce((acc, val) => acc + val, 0) / Object.keys(dailyCalories).length
        : 0;

      // Alimentos más comunes
      const foodCounts: Record<string, number> = {};
      nutritionEntries.forEach(e => {
        e.foods.forEach(food => {
          foodCounts[food.name] = (foodCounts[food.name] || 0) + 1;
        });
      });
      const mostCommonFoods = Object.entries(foodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name]) => name);

      // Patrones de energía
      const energyScores = nutritionEntries.map(e => e.energy_score);
      const averageEnergyScore = energyScores.length > 0
        ? energyScores.reduce((acc, val) => acc + val, 0) / energyScores.length
        : 0;
      const highEnergyDays = nutritionEntries.filter(e => e.energy_score >= 7).length;
      const lowEnergyDays = nutritionEntries.filter(e => e.energy_score <= 4).length;

      nutrition_state = {
        entries: sortedNutritionEntries.map(e => ({
          id: e.id,
          date: e.date,
          time: e.time,
          input_type: e.input_type,
          foods: e.foods.map(f => ({
            name: f.name,
            quantity: f.quantity,
            unit: f.unit,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats,
          })),
          total_calories: e.total_calories,
          total_protein: e.total_protein,
          total_carbs: e.total_carbs,
          total_fats: e.total_fats,
          estimated_glucose_impact: e.estimated_glucose_impact,
          energy_score: e.energy_score,
          brain_food_tags: e.brain_food_tags,
        })),
        goals: nutritionGoals ? {
          daily_calories: nutritionGoals.daily_calories,
          protein_grams: nutritionGoals.protein_grams,
          carbs_grams: nutritionGoals.carbs_grams,
          fats_grams: nutritionGoals.fats_grams,
          activity_level: nutritionGoals.activity_level,
        } : undefined,
        correlations: nutritionCorrelations.map(c => ({
          id: c.id,
          focus_session_date: c.focus_session_date,
          time_between: c.time_between,
          session_quality_score: c.session_quality_score,
          correlation_type: c.correlation_type,
          insights: c.insights,
        })),
        summary: {
          total_entries: nutritionEntries.length,
          entries_this_week: entriesThisWeek,
          average_daily_calories: Math.round(averageDailyCalories),
          most_common_foods: mostCommonFoods,
          energy_patterns: {
            average_energy_score: Math.round(averageEnergyScore * 10) / 10,
            high_energy_days: highEnergyDays,
            low_energy_days: lowEnergyDays,
          },
        },
      };
    }

    // ========== EXAM STATE ==========
    let exam_state = undefined;
    if (exams.length > 0 || examResults.length > 0) {
      // Ordenar exámenes por fecha (más recientes primero)
      const sortedExams = [...exams].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Exámenes completados
      const completedExams = exams.filter(e => e.completed_at).length;

      // Calcular promedio de puntajes
      const averageScore = examResults.length > 0
        ? examResults.reduce((acc, r) => acc + r.score_percentage, 0) / examResults.length
        : 0;

      // Mejor asignatura (por promedio de puntajes)
      const subjectScores: Record<string, number[]> = {};
      examResults.forEach(result => {
        const exam = exams.find(e => e.id === result.exam_id);
        if (exam) {
          if (!subjectScores[exam.subject_id]) {
            subjectScores[exam.subject_id] = [];
          }
          subjectScores[exam.subject_id].push(result.score_percentage);
        }
      });
      const subjectAverages: Record<string, number> = {};
      Object.entries(subjectScores).forEach(([subjectId, scores]) => {
        subjectAverages[subjectId] = scores.reduce((acc, s) => acc + s, 0) / scores.length;
      });
      const bestSubjectId = Object.entries(subjectAverages)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
      const bestSubject = bestSubjectId ? subjects.find(s => s.id === bestSubjectId)?.name : undefined;

      // Tendencia de mejora (comparar últimos 3 vs anteriores 3)
      let improvementTrend: 'ascendente' | 'descendente' | 'estable' = 'estable';
      if (examResults.length >= 6) {
        const sortedResults = [...examResults].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const recent3 = sortedResults.slice(0, 3);
        const previous3 = sortedResults.slice(3, 6);
        const recentAvg = recent3.reduce((acc, r) => acc + r.score_percentage, 0) / 3;
        const previousAvg = previous3.reduce((acc, r) => acc + r.score_percentage, 0) / 3;
        
        if (recentAvg > previousAvg * 1.05) {
          improvementTrend = 'ascendente';
        } else if (recentAvg < previousAvg * 0.95) {
          improvementTrend = 'descendente';
        }
      }

      // Distribución de niveles de dominio
      const masteryDistribution = {
        beginner: examResults.filter(r => r.mastery_level === 'beginner').length,
        intermediate: examResults.filter(r => r.mastery_level === 'intermediate').length,
        advanced: examResults.filter(r => r.mastery_level === 'advanced').length,
        expert: examResults.filter(r => r.mastery_level === 'expert').length,
      };

      exam_state = {
        exams: sortedExams.map(e => ({
          id: e.id,
          subject_id: e.subject_id,
          title: e.title,
          exam_type: e.exam_type,
          difficulty: e.difficulty,
          question_count: e.question_count,
          mode: e.mode,
          created_at: e.created_at,
          completed_at: e.completed_at,
        })),
        results: examResults.map(r => ({
          id: r.id,
          exam_id: r.exam_id,
          total_questions: r.total_questions,
          correct_answers: r.correct_answers,
          score_percentage: r.score_percentage,
          time_spent_total: r.time_spent_total,
          mastery_level: r.mastery_level,
          created_at: r.created_at,
        })),
        summary: {
          total_exams: exams.length,
          completed_exams: completedExams,
          average_score: Math.round(averageScore * 10) / 10,
          best_subject: bestSubject,
          improvement_trend: improvementTrend,
          mastery_distribution: masteryDistribution,
        },
      };
    }

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
      balanza_pro_state,
      nutrition_state,
      exam_state,
    };
  }, [
    userProfile,
    subjects,
    transactions,
    journalEntries,
    customEvents,
    modules,
    monthlyBudget,
    balanzaProTransactions,
    nutritionEntries,
    nutritionGoals,
    nutritionCorrelations,
    exams,
    examResults,
  ]);
};

