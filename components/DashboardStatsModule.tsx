import React, { useMemo } from 'react';
import { StudentProfileContext, NavView } from '../types';
import { getIcon } from '../constants';
import { generateAlerts } from '../utils/dashboardAlerts';
import StatCard from './dashboard/StatCard';
import WarningCard from './dashboard/WarningCard';
import ExpandableSection from './dashboard/ExpandableSection';
import StatsWidget from './dashboard/StatsWidget';

interface DashboardStatsModuleProps {
  studentProfileContext: StudentProfileContext;
  isMobile: boolean;
  isNightMode?: boolean;
  onNavigate: (view: NavView) => void;
}

const DashboardStatsModule: React.FC<DashboardStatsModuleProps> = ({
  studentProfileContext,
  isMobile,
  isNightMode = false,
  onNavigate,
}) => {
  const alerts = useMemo(() => generateAlerts(studentProfileContext), [studentProfileContext]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const userName = studentProfileContext.user_profile.full_name || 
                   studentProfileContext.user_profile.email?.split('@')[0] || 
                   'Estudiante';

  // Calcular próximos deadlines formateados
  const upcomingDeadlines = useMemo(() => {
    if (!studentProfileContext.academic_summary.next_critical_date) return null;
    const date = new Date(studentProfileContext.academic_summary.next_critical_date);
    const now = new Date();
    const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { date, daysDiff };
  }, [studentProfileContext.academic_summary.next_critical_date]);

  return (
    <div className={`h-full flex flex-col gap-6 pb-10 max-w-7xl mx-auto px-4 lg:px-6 overflow-y-auto no-scrollbar transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF9FA]'
    }`}>
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className={`font-cinzel text-4xl lg:text-5xl font-black tracking-[0.25em] uppercase transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
        }`}>
          Dashboard
        </h1>
        <p className={`font-garamond text-lg mt-2 transition-colors duration-500 ${
          isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
        }`}>
          {getGreeting()}, {userName}
        </p>
        <div className={`h-1 w-16 lg:w-20 mx-auto mt-3 rounded-full transition-colors duration-500 ${
          isNightMode ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]'
        }`} />
      </div>

      {/* Sección de Advertencias */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className={`font-cinzel text-xl font-black uppercase tracking-wider transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            Alertas y Advertencias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 4).map((alert) => (
              <WarningCard
                key={alert.id}
                type={alert.severity}
                title={alert.title}
                message={alert.message}
                action={alert.action ? {
                  label: alert.action.label,
                  onClick: () => {
                    if (alert.action?.view) {
                      onNavigate(alert.action.view as NavView);
                    }
                  },
                } : undefined}
                isNightMode={isNightMode}
              />
            ))}
          </div>
        </section>
      )}

      {/* Widgets Principales */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget Académico */}
        <StatsWidget
          title="Académico"
          icon="book"
          onClick={() => onNavigate(NavView.SUBJECTS)}
          isNightMode={isNightMode}
        >
          <StatCard
            title="Asignaturas Activas"
            value={studentProfileContext.academic_summary.active_subjects_count}
            isNightMode={isNightMode}
          />
          <StatCard
            title="Próximos Deadlines"
            value={studentProfileContext.academic_summary.upcoming_deadlines}
            subtitle={upcomingDeadlines ? `${upcomingDeadlines.daysDiff} días` : 'Ninguno'}
            isNightMode={isNightMode}
          />
          <StatCard
            title="Horas de Estudio"
            value={`${studentProfileContext.focus.summary.total_hours}h`}
            subtitle={`${studentProfileContext.focus.summary.sessions_this_week} esta semana`}
            icon="hourglass"
            isNightMode={isNightMode}
          />
        </StatsWidget>

        {/* Widget Financiero */}
        <StatsWidget
          title="Financiero"
          icon="scale"
          onClick={() => onNavigate(NavView.BALANZA)}
          isNightMode={isNightMode}
        >
          <StatCard
            title="Balance"
            value={`$${studentProfileContext.financial_state.balance.toFixed(2)}`}
            subtitle={studentProfileContext.financial_state.status}
            icon="scale"
            trend={studentProfileContext.financial_state.balance < 0 ? 'down' : 'neutral'}
            isNightMode={isNightMode}
          />
          <StatCard
            title="Gastos del Mes"
            value={`$${studentProfileContext.financial_state.total_spent.toFixed(2)}`}
            subtitle={studentProfileContext.financial_state.summary.monthly_trend}
            isNightMode={isNightMode}
          />
          {studentProfileContext.balanza_pro_state && (
            <StatCard
              title="Balanza Pro"
              value={`$${studentProfileContext.balanza_pro_state.balance.toFixed(2)}`}
              subtitle={studentProfileContext.balanza_pro_state.status}
              isNightMode={isNightMode}
            />
          )}
        </StatsWidget>

        {/* Widget Bienestar */}
        <StatsWidget
          title="Bienestar"
          icon="apple"
          onClick={() => onNavigate(NavView.NUTRITION)}
          isNightMode={isNightMode}
        >
          {studentProfileContext.nutrition_state ? (
            <>
              <StatCard
                title="Energía Promedio"
                value={`${studentProfileContext.nutrition_state.summary.energy_patterns.average_energy_score.toFixed(1)}/10`}
                subtitle={`${studentProfileContext.nutrition_state.summary.entries_this_week} entradas esta semana`}
                icon="apple"
                isNightMode={isNightMode}
              />
              <StatCard
                title="Calorías Diarias"
                value={studentProfileContext.nutrition_state.summary.average_daily_calories}
                subtitle="Promedio"
                isNightMode={isNightMode}
              />
            </>
          ) : (
            <StatCard
              title="Sin Datos"
              value="0"
              subtitle="Registra tu primera comida"
              isNightMode={isNightMode}
            />
          )}
          <StatCard
            title="Entradas de Diario"
            value={studentProfileContext.journal.summary.total_entries}
            subtitle={`${studentProfileContext.journal.summary.last_entry_days_ago} días desde última`}
            icon="pen"
            isNightMode={isNightMode}
          />
        </StatsWidget>

        {/* Widget Rendimiento */}
        <StatsWidget
          title="Rendimiento"
          icon="target"
          onClick={() => onNavigate(NavView.EXAM_GENERATOR)}
          isNightMode={isNightMode}
        >
          {studentProfileContext.exam_state ? (
            <>
              <StatCard
                title="Exámenes Completados"
                value={studentProfileContext.exam_state.summary.completed_exams}
                subtitle={`de ${studentProfileContext.exam_state.summary.total_exams} totales`}
                icon="target"
                isNightMode={isNightMode}
              />
              <StatCard
                title="Promedio"
                value={`${studentProfileContext.exam_state.summary.average_score}%`}
                subtitle={studentProfileContext.exam_state.summary.improvement_trend}
                trend={studentProfileContext.exam_state.summary.improvement_trend === 'ascendente' ? 'up' : 
                       studentProfileContext.exam_state.summary.improvement_trend === 'descendente' ? 'down' : 'neutral'}
                isNightMode={isNightMode}
              />
            </>
          ) : (
            <StatCard
              title="Sin Exámenes"
              value="0"
              subtitle="Crea tu primer examen"
              isNightMode={isNightMode}
            />
          )}
          <StatCard
            title="Consistencia"
            value={`${(studentProfileContext.focus.summary.consistency_score * 100).toFixed(0)}%`}
            subtitle="Sesiones de estudio"
            icon="hourglass"
            isNightMode={isNightMode}
          />
        </StatsWidget>
      </section>

      {/* Secciones Expandibles */}
      <section className="space-y-4">
        {/* Sección Académica */}
        <ExpandableSection
          title="Detalles Académicos"
          icon="book"
          isNightMode={isNightMode}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Asignaturas
              </p>
              <p className={`font-garamond text-2xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                {studentProfileContext.academic_summary.active_subjects_count} activas
              </p>
              <p className={`font-garamond text-sm mt-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                {studentProfileContext.academic_summary.total_milestones} milestones totales
              </p>
            </div>
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Próximo Deadline
              </p>
              {upcomingDeadlines ? (
                <>
                  <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    {upcomingDeadlines.daysDiff} días
                  </p>
                  <p className={`font-garamond text-xs mt-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {upcomingDeadlines.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </p>
                </>
              ) : (
                <p className={`font-garamond text-sm transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  No hay deadlines próximos
                </p>
              )}
            </div>
          </div>
        </ExpandableSection>

        {/* Sección Financiera */}
        <ExpandableSection
          title="Detalles Financieros"
          icon="scale"
          isNightMode={isNightMode}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Balance Total
              </p>
              <p className={`font-garamond text-2xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                ${studentProfileContext.financial_state.balance.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Ingresos Totales
              </p>
              <p className={`font-garamond text-2xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                ${studentProfileContext.financial_state.total_income.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Gastos Totales
              </p>
              <p className={`font-garamond text-2xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                ${studentProfileContext.financial_state.total_spent.toFixed(2)}
              </p>
            </div>
          </div>
          {studentProfileContext.balanza_pro_state && (
            <div className="mt-4 p-4 rounded-xl border-2 bg-[rgba(212,175,55,0.1)] border-[#D4AF37]/30">
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Balanza Pro
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className={`font-garamond text-xs transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Balance
                  </p>
                  <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    ${studentProfileContext.balanza_pro_state.balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={`font-garamond text-xs transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Ingresos
                  </p>
                  <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    ${studentProfileContext.balanza_pro_state.total_ingresos.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={`font-garamond text-xs transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Gastos Fijos
                  </p>
                  <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    ${studentProfileContext.balanza_pro_state.gastos_fijos.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={`font-garamond text-xs transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Gastos Extra
                  </p>
                  <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    ${studentProfileContext.balanza_pro_state.gastos_extra.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </ExpandableSection>

        {/* Sección Nutrición */}
        {studentProfileContext.nutrition_state && (
          <ExpandableSection
            title="Análisis de Nutrición"
            icon="apple"
            isNightMode={isNightMode}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                  : 'bg-white/40 border-[#F8C8DC]/30'
              }`}>
                <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Patrones de Energía
                </p>
                <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Promedio: {studentProfileContext.nutrition_state.summary.energy_patterns.average_energy_score.toFixed(1)}/10
                </p>
                <p className={`font-garamond text-sm mt-1 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  {studentProfileContext.nutrition_state.summary.energy_patterns.high_energy_days} días altos,{' '}
                  {studentProfileContext.nutrition_state.summary.energy_patterns.low_energy_days} días bajos
                </p>
              </div>
              <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                  : 'bg-white/40 border-[#F8C8DC]/30'
              }`}>
                <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Alimentos Más Comunes
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {studentProfileContext.nutrition_state.summary.most_common_foods.slice(0, 5).map((food, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-garamond transition-colors duration-500 ${
                        isNightMode
                          ? 'bg-[rgba(199,125,255,0.2)] text-[#E0E1DD]'
                          : 'bg-[#E35B8F]/10 text-[#2D1A26]'
                      }`}
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {studentProfileContext.nutrition_state.correlations.length > 0 && (
              <div className="mt-4 p-4 rounded-xl border-2 bg-[rgba(212,175,55,0.1)] border-[#D4AF37]/30">
                <p className={`font-cinzel text-sm font-bold uppercase mb-3 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Correlaciones Detectadas
                </p>
                <div className="space-y-2">
                  {studentProfileContext.nutrition_state.correlations.slice(0, 3).map((correlation) => (
                    <div
                      key={correlation.id}
                      className={`p-3 rounded-lg transition-colors duration-500 ${
                        isNightMode
                          ? 'bg-[rgba(48,43,79,0.4)]'
                          : 'bg-white/40'
                      }`}
                    >
                      <p className={`font-garamond text-sm transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                      }`}>
                        {correlation.insights}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ExpandableSection>
        )}

        {/* Sección Diario */}
        <ExpandableSection
          title="Resumen del Diario"
          icon="pen"
          isNightMode={isNightMode}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Total de Entradas
              </p>
              <p className={`font-garamond text-2xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                {studentProfileContext.journal.summary.total_entries}
              </p>
              <p className={`font-garamond text-sm mt-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                Frecuencia: {studentProfileContext.journal.summary.writing_frequency}
              </p>
            </div>
            <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                : 'bg-white/40 border-[#F8C8DC]/30'
            }`}>
              <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Estado de Ánimo Más Común
              </p>
              <p className={`font-garamond text-xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                {studentProfileContext.journal.summary.most_common_mood || 'N/A'}
              </p>
              <p className={`font-garamond text-xs mt-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                Última entrada hace {studentProfileContext.journal.summary.last_entry_days_ago} días
              </p>
            </div>
          </div>
        </ExpandableSection>

        {/* Sección Exámenes */}
        {studentProfileContext.exam_state && (
          <ExpandableSection
            title="Historial de Exámenes"
            icon="target"
            isNightMode={isNightMode}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                  : 'bg-white/40 border-[#F8C8DC]/30'
              }`}>
                <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Rendimiento General
                </p>
                <p className={`font-garamond text-2xl font-black transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  {studentProfileContext.exam_state.summary.average_score}%
                </p>
                <p className={`font-garamond text-sm mt-1 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  Tendencia: {studentProfileContext.exam_state.summary.improvement_trend}
                </p>
              </div>
              <div className={`p-4 rounded-xl border-2 transition-colors duration-500 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                  : 'bg-white/40 border-[#F8C8DC]/30'
              }`}>
                <p className={`font-cinzel text-sm font-bold uppercase mb-2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Distribución de Dominio
                </p>
                <div className="space-y-1 mt-2">
                  {Object.entries(studentProfileContext.exam_state.summary.mastery_distribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className={`font-garamond text-sm capitalize transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {level}
                      </span>
                      <span className={`font-garamond text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                      }`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {studentProfileContext.exam_state.summary.best_subject && (
              <div className="mt-4 p-4 rounded-xl border-2 bg-[rgba(212,175,55,0.1)] border-[#D4AF37]/30">
                <p className={`font-cinzel text-sm font-bold uppercase mb-1 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  Mejor Asignatura
                </p>
                <p className={`font-garamond text-lg font-black transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  {studentProfileContext.exam_state.summary.best_subject}
                </p>
              </div>
            )}
          </ExpandableSection>
        )}
      </section>
    </div>
  );
};

export default DashboardStatsModule;
