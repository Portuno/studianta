
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
  gridPosition?: { row: number; col: number };
}

export interface Transaction {
  id: string;
  type: 'Ingreso' | 'Gasto';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface RecurringConfig {
  frequency: 'diaria' | 'semanal' | 'mensual' | 'anual';
  start_date: string; // ISO date string
  end_date?: string; // ISO date string (opcional)
}

export interface BalanzaProTransaction {
  id: string;
  type: 'Ingreso' | 'Egreso';
  amount: number;
  payment_method: string;
  is_extra: boolean;
  is_recurring: boolean;
  tags: string[];
  status: 'Pendiente' | 'Completado';
  recurring_config?: RecurringConfig;
  due_date?: string; // ISO date string
  description?: string;
  date: string; // ISO date string
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
  BALANZA = 'Balanza',
  SOCIAL = 'Social',
  PROFILE = 'Perfil',
  SECURITY = 'Seguridad',
  AI = 'IA',
  ORACLE = 'Oráculo',
  DOCS = 'Documentación',
  BAZAR = 'Bazar',
  CALCULATOR = 'Calculadora',
  EXAM_GENERATOR = 'Generador de Exámenes',
  NUTRITION = 'Nutrición',
  PRIVACY_POLICY = 'Política de Privacidad',
  TERMS_OF_SERVICE = 'Términos y Condiciones',
  PAYMENT_SUCCESS = 'Pago Exitoso'
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
  balanza_pro_state?: {
    balance: number;
    total_ingresos: number;
    total_egresos: number;
    gastos_fijos: number;
    gastos_extra: number;
    status: 'saludable' | 'precario' | 'crítico';
    transactions: Array<{
      id: string;
      type: 'Ingreso' | 'Egreso';
      amount: number;
      payment_method: string;
      is_extra: boolean;
      is_recurring: boolean;
      tags: string[];
      status: 'Pendiente' | 'Completado';
      date: string;
      description?: string;
    }>;
    summary: {
      most_used_payment_method?: string;
      most_frequent_tags?: string[];
      payment_methods_balance?: Record<string, number>;
    };
  };
}

// Calculator Interfaces
export interface CalculatorHistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: string;
  note?: string;
}

export interface CalculatorMemory {
  M1: number;
  M2: number;
  M3: number;
  M4: number;
}

export interface CalculatorNote {
  operationId: string;
  note: string;
}

export interface CalculatorSettings {
  soundEnabled: boolean;
  soundVolume: number;
  angleMode: 'deg' | 'rad';
  floatingPosition?: { x: number; y: number };
}

// Exam Generator Interfaces
export type ExamType = 'multiple-choice' | 'true-false' | 'open-ended' | 'cloze' | 'case-study';
export type ExamMode = 'real' | 'guided';
export type ExamDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type QuestionDifficulty = 'easy' | 'intermediate' | 'hard';
export type MasteryLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  exam_type: ExamType;
  difficulty: ExamDifficulty;
  question_count: number;
  mode: ExamMode;
  material_ids: string[];
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_number: number;
  question_type: ExamType;
  question_text: string;
  options?: string[]; // Para multiple-choice
  correct_answer: string;
  explanation?: string;
  rationale?: string;
  source_material?: string;
  difficulty_level: QuestionDifficulty;
  created_at: string;
}

export interface ExamResponse {
  id: string;
  exam_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  created_at: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_spent_total: number;
  mastery_level: MasteryLevel;
  created_at: string;
}

export interface ExamFlashcard {
  id: string;
  exam_id: string;
  question_id: string;
  front_text: string;
  back_text: string;
  reviewed_count: number;
  last_reviewed_at?: string;
  created_at: string;
}

export interface ExamGenerationRequest {
  subjectId: string;
  materialIds: string[];
  examType: ExamType;
  questionCount: number;
  difficulty: ExamDifficulty;
  mode: ExamMode;
}

export interface ExamConfig {
  subjectId: string;
  materialIds: string[];
  examType: ExamType;
  questionCount: number;
  difficulty: ExamDifficulty;
  mode: ExamMode;
}

// Nutrition Interfaces
export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionEntry {
  id: string;
  user_id: string;
  date: string;
  time: string;
  input_type: 'text' | 'photo';
  input_text?: string;
  photo_url?: string;
  foods: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  estimated_glucose_impact: 'low' | 'medium' | 'high' | 'spike';
  energy_score: number;
  brain_food_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NutritionGoals {
  id: string;
  user_id: string;
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  updated_at: string;
}

export interface NutritionCorrelation {
  id: string;
  user_id: string;
  nutrition_entry_id: string;
  focus_session_id: string;
  focus_session_date: string;
  time_between: number;
  session_quality_score: number;
  correlation_type: 'positive' | 'negative' | 'neutral';
  insights: string;
  created_at: string;
}

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  entries: NutritionEntry[];
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fats: number;
  progress_percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface EnergyCurve {
  time: string; // HH:mm
  estimated_energy: number; // 1-10
  glucose_level: number; // 0-100 (estimado)
}

export interface NutritionAnalysis {
  foods: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  estimated_glucose_impact: 'low' | 'medium' | 'high' | 'spike';
  energy_score: number;
  brain_food_tags: string[];
  confidence: number; // 0-1
}