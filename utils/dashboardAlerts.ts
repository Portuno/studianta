import { StudentProfileContext } from '../types';

export type AlertType = 'academic' | 'financial' | 'wellness' | 'general';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface DashboardAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  action?: {
    label: string;
    view?: string;
  };
}

export const generateAlerts = (context: StudentProfileContext): DashboardAlert[] => {
  const alerts: DashboardAlert[] = [];
  const now = new Date();

  // ========== ALERTAS ACADÉMICAS ==========
  if (context.academic_summary.next_critical_date) {
    const criticalDate = new Date(context.academic_summary.next_critical_date);
    const daysDiff = Math.ceil((criticalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0 && daysDiff <= 3) {
      alerts.push({
        id: 'academic-deadline-critical',
        type: 'academic',
        severity: 'critical',
        title: 'Deadline Próximo',
        message: `Tienes un deadline en ${daysDiff} día${daysDiff !== 1 ? 's' : ''}. ¡Prepárate!`,
        action: {
          label: 'Ver Calendario',
          view: 'Calendario',
        },
      });
    } else if (daysDiff > 3 && daysDiff <= 7) {
      alerts.push({
        id: 'academic-deadline-warning',
        type: 'academic',
        severity: 'warning',
        title: 'Deadline Próximo',
        message: `Tienes un deadline en ${daysDiff} días.`,
        action: {
          label: 'Ver Calendario',
          view: 'Calendario',
        },
      });
    }
  }

  // Verificar ausencias
  context.subjects.forEach(subject => {
    if (subject.status === 'Cursando') {
      // Necesitamos calcular el porcentaje de ausencias
      // Por ahora, asumimos que maxAbsences está en algún lugar
      // Por simplicidad, verificamos si hay muchas asignaturas con ausencias
    }
  });

  // Sin sesiones de estudio recientes
  if (context.focus.summary.sessions_this_week === 0 && context.focus.summary.total_hours > 0) {
    alerts.push({
      id: 'academic-no-focus-sessions',
      type: 'academic',
      severity: 'info',
      title: 'Sin Sesiones de Estudio',
      message: 'No has tenido sesiones de estudio esta semana. ¡Mantén el ritmo!',
        action: {
          label: 'Iniciar Sesión',
          view: 'Enfoque',
        },
    });
  }

  // ========== ALERTAS FINANCIERAS ==========
  if (context.financial_state.balance < 0) {
    alerts.push({
      id: 'financial-negative-balance',
      type: 'financial',
      severity: 'critical',
      title: 'Balance Negativo',
      message: `Tu balance es negativo: $${Math.abs(context.financial_state.balance).toFixed(2)}. Revisa tus gastos.`,
        action: {
          label: 'Ver Balanza',
          view: 'Balanza',
        },
    });
  } else if (context.financial_state.balance < context.financial_state.budget * 0.2) {
    alerts.push({
      id: 'financial-low-balance',
      type: 'financial',
      severity: 'warning',
      title: 'Balance Bajo',
      message: `Tu balance está por debajo del 20% de tu presupuesto.`,
        action: {
          label: 'Ver Balanza',
          view: 'Balanza',
        },
    });
  }

  // Verificar tendencia de gastos
  if (context.financial_state.summary.monthly_trend === 'ascendente') {
    alerts.push({
      id: 'financial-spending-trend',
      type: 'financial',
      severity: 'warning',
      title: 'Gastos en Aumento',
      message: 'Tus gastos han aumentado este mes comparado con el anterior.',
      action: {
        label: 'Ver Transacciones',
        view: 'BALANZA',
      },
    });
  }

  // Verificar Balanza Pro si existe
  if (context.balanza_pro_state) {
    if (context.balanza_pro_state.balance < 0) {
      alerts.push({
        id: 'balanza-pro-negative',
        type: 'financial',
        severity: 'critical',
        title: 'Balanza Pro: Balance Negativo',
        message: `Tu balance en Balanza Pro es negativo: $${Math.abs(context.balanza_pro_state.balance).toFixed(2)}.`,
        action: {
          label: 'Ver Balanza Pro',
          view: 'BALANZA',
        },
      });
    } else if (context.balanza_pro_state.balance < context.balanza_pro_state.total_ingresos * 0.2) {
      alerts.push({
        id: 'balanza-pro-low-balance',
        type: 'financial',
        severity: 'warning',
        title: 'Balanza Pro: Balance Bajo',
        message: 'Tu balance en Balanza Pro está bajo.',
        action: {
          label: 'Ver Balanza Pro',
          view: 'BALANZA',
        },
      });
    }
  }

  // ========== ALERTAS DE BIENESTAR ==========
  // Sin entradas de nutrición recientes
  if (context.nutrition_state) {
    if (context.nutrition_state.summary.entries_this_week === 0 && context.nutrition_state.summary.total_entries > 0) {
      alerts.push({
        id: 'wellness-no-nutrition',
        type: 'wellness',
        severity: 'info',
        title: 'Sin Registros de Nutrición',
        message: 'No has registrado comidas esta semana. Mantén un registro para analizar tu energía.',
        action: {
          label: 'Registrar Comida',
          view: 'Nutrición',
        },
      });
    }

    // Energía promedio baja
    if (context.nutrition_state.summary.energy_patterns.average_energy_score < 5) {
      alerts.push({
        id: 'wellness-low-energy',
        type: 'wellness',
        severity: 'warning',
        title: 'Energía Promedio Baja',
        message: `Tu energía promedio es ${context.nutrition_state.summary.energy_patterns.average_energy_score.toFixed(1)}/10. Revisa tu alimentación.`,
        action: {
          label: 'Ver Nutrición',
          view: 'Nutrición',
        },
      });
    }

    // Correlaciones negativas
    const negativeCorrelations = context.nutrition_state.correlations.filter(
      c => c.correlation_type === 'negative'
    );
    if (negativeCorrelations.length > 0) {
      alerts.push({
        id: 'wellness-negative-correlation',
        type: 'wellness',
        severity: 'warning',
        title: 'Correlación Negativa Detectada',
        message: 'Se detectó una correlación negativa entre tu alimentación y tu rendimiento de estudio.',
        action: {
          label: 'Ver Análisis',
          view: 'Nutrición',
        },
      });
    }
  }

  // Sin entradas de diario recientes
  if (context.journal.summary.last_entry_days_ago > 7) {
    alerts.push({
      id: 'wellness-no-journal',
      type: 'wellness',
      severity: 'info',
      title: 'Sin Entradas de Diario',
      message: `No has escrito en tu diario desde hace ${context.journal.summary.last_entry_days_ago} días.`,
        action: {
          label: 'Escribir en Diario',
          view: 'Diario',
        },
    });
  }

  // ========== ALERTAS GENERALES ==========
  // Sin asignaturas activas
  if (context.academic_summary.active_subjects_count === 0) {
    alerts.push({
      id: 'general-no-subjects',
      type: 'general',
      severity: 'info',
      title: 'Sin Asignaturas Activas',
      message: 'No tienes asignaturas activas. Agrega asignaturas para comenzar.',
        action: {
          label: 'Agregar Asignatura',
          view: 'Asignaturas',
        },
    });
  }

  // Ordenar alertas por severidad (critical primero, luego warning, luego info)
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};
