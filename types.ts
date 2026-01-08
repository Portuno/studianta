
export type SubjectStatus = 'Cursando' | 'Final Pendiente' | 'Aprobada';

export interface Milestone {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'Examen' | 'Entrega' | 'Parcial' | 'Trabajo Práctico';
}

export interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  importantFragments?: string[]; // Fragmentos marcados como importantes
  isSealed?: boolean; // Si la nota fue "sellada" (consagrada al Oráculo)
}

export interface StudyMaterial {
  id: string;
  name: string;
  type: 'Syllabus' | 'Apunte' | 'Pizarrón' | 'PDF' | 'Word' | 'PPT';
  content?: string; // Could be base64 or text content
  date: string;
  fileUrl?: string; // URL del archivo en storage
  category: 'programa' | 'contenido'; // Distingue entre programa y contenido de asignatura
}

export interface Subject {
  id: string;
  name: string;
  career: string;
  professor?: string;
  email?: string;
  phone?: string;
  room?: string;
  aula?: string; // Aula donde está cursando
  status: SubjectStatus;
  absences: number;
  maxAbsences: number;
  grade?: number;
  termStart?: string; // ISO date string
  termEnd?: string;   // ISO date string
  milestones: Milestone[];
  schedules: Schedule[];
  notes: Note[];
  materials: StudyMaterial[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  cost: number;
  active: boolean;
  icon: string;
}

export interface Transaction {
  id: string;
  type: 'Ingreso' | 'Gasto';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export type MoodType = 'Radiante' | 'Enfocada' | 'Equilibrada' | 'Agotada' | 'Estresada';

export interface JournalEntry {
  id: string;
  date: string;
  mood: MoodType;
  content: string;
  photo?: string; // base64 - deprecated, usar photos
  photos?: string[]; // base64 array - hasta 3 fotos
  isLocked: boolean;
  sentiment?: number;
}

export interface CustomCalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO
  time?: string;
  endTime?: string;
  color: string;
  priority: 'low' | 'high';
}

export enum NavView {
  DASHBOARD = 'Dashboard',
  SUBJECTS = 'Asignaturas',
  CALENDAR = 'Calendario',
  FOCUS = 'Enfoque',
  DIARY = 'Diario',
  FINANCE = 'Finanzas',
  SOCIAL = 'Social',
  PROFILE = 'Perfil',
  SECURITY = 'Seguridad',
  AI = 'IA',
  BAZAR = 'Bazar',
  ORACLE = 'Oráculo',
  DOCS = 'Documentación',
  PRIVACY_POLICY = 'Política de Privacidad',
  TERMS_OF_SERVICE = 'Términos y Condiciones'
}

// Student Profile Context Interfaces
export interface FocusSession {
  date: string; // ISO string
  duration_minutes: number;
  subject_id?: string;
  completed: boolean;
}

export interface StudentProfileContext {
  last_sync: string;
  user_profile: {
    full_name?: string;
    email: string;
    career?: string;
    institution?: string;
    arcane_level: string;
    essence: number;
    total_essence_earned: number;
    account_created: string;
  };
  financial_state: {
    budget: number;
    balance: number;
    total_spent: number;
    total_income: number;
    status: 'saludable' | 'precario' | 'crítico';
    transactions: Array<{
      id: string;
      type: 'Ingreso' | 'Gasto';
      category: string;
      amount: number;
      date: string;
      description: string;
    }>;
    summary: {
      most_frequent_category?: string;
      monthly_trend?: 'ascendente' | 'descendente' | 'estable';
    };
  };
  subjects: Array<{
    id: string;
    name: string;
    career: string;
    status: string;
    grade?: number;
    professor?: string;
    email?: string;
    aula?: string;
    term_start?: string;
    term_end?: string;
    milestones: Array<{
      id: string;
      title: string;
      date: string;
      time?: string;
      type: string;
    }>;
    schedules: Array<{
      id: string;
      day: string;
      start_time: string;
      end_time: string;
    }>;
    notes: Array<{
      id: string;
      title: string;
      content: string;
      date: string;
      important_fragments?: string[];
      is_sealed: boolean;
    }>;
  }>;
  academic_summary: {
    active_subjects_count: number;
    upcoming_deadlines: number;
    next_critical_date?: string;
    total_milestones: number;
  };
  calendar: {
    custom_events: Array<{
      id: string;
      title: string;
      description?: string;
      date: string;
      time?: string;
      color: string;
      priority: 'low' | 'high';
    }>;
    upcoming_events_count: number;
  };
  journal: {
    entries: Array<{
      id: string;
      date: string;
      mood: string;
      content: string;
      is_locked: boolean;
    }>;
    summary: {
      total_entries: number;
      last_entry_days_ago: number;
      most_common_mood?: string;
      writing_frequency: 'alta' | 'media' | 'baja';
      mood_distribution: Record<string, number>;
    };
  };
  focus: {
    sessions: FocusSession[];
    summary: {
      total_hours: number;
      sessions_this_week: number;
      consistency_score: number;
      average_session_duration: number;
    };
  };
  active_modules: Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
}