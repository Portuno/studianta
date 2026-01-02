
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
}

export interface StudyMaterial {
  id: string;
  name: string;
  type: 'Syllabus' | 'Apunte' | 'Pizarrón' | 'PDF';
  content?: string; // Could be base64 or text content
  date: string;
}

export interface Subject {
  id: string;
  name: string;
  career: string;
  professor?: string;
  email?: string;
  phone?: string;
  room?: string;
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
  AI = 'IA'
}
