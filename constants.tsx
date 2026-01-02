
import React from 'react';
import { 
  Book, 
  Compass, 
  Hourglass, 
  PenTool, 
  Scale, 
  Users, 
  Sparkles,
  MessageSquare,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Volume2,
  CloudRain,
  Flame,
  Music,
  Moon,
  Coffee,
  Brain,
  Lock,
  User,
  ShieldCheck,
  Eye,
  Sun,
  Target,
  Wind,
  BatteryLow,
  CloudLightning,
  Camera,
  Unlock
} from 'lucide-react';

export const COLORS = {
  primary: '#E35B8F',
  gold: '#D4AF37',
  plum: '#4A233E',
  mauve: '#8B5E75',
  glass: 'rgba(255, 245, 250, 0.85)',
  border: '#F8C8DC',
  hover: '#FFD1DC',
};

export const INITIAL_MODULES = [
  { id: 'profile', name: 'Sello de Lacre', description: 'Perfil de Estudiante: Identidad, carrera y registro académico base.', cost: 0, active: true, icon: 'profile' },
  { id: 'subjects', name: 'Escritorio de Roble', description: 'Gestor de Asignaturas: Organiza materias, profesores, aulas y materiales.', cost: 10, active: false, icon: 'book' },
  { id: 'focus', name: 'Reloj de Arena', description: 'Modo de Enfoque: Temporizador Pomodoro con sonidos de ambiente.', cost: 30, active: false, icon: 'hourglass' },
  { id: 'diary', name: 'Cofre de Memorias', description: 'Diario Personal: Registro de notas, fotos y seguimiento de ánimo.', cost: 35, active: false, icon: 'pen' },
  { id: 'calendar', name: 'Astrolabio de Pared', description: 'Calendario Académico: Sincroniza exámenes, entregas y recordatorios.', cost: 40, active: false, icon: 'calendar' },
  { id: 'security', name: 'Cerradura de Éter', description: 'Seguridad Biométrica: Protege tus datos mediante PIN o FaceID.', cost: 20, active: false, icon: 'lock' },
  { id: 'finance', name: 'Balanza de Latón', description: 'Control de Gastos: Gestiona tu presupuesto y salud económica.', cost: 60, active: false, icon: 'scale' },
  { id: 'ai', name: 'Oráculo de Estudio', description: 'Asistente IA: Análisis de PDFs y generación de evaluaciones personalizadas.', cost: 70, active: false, icon: 'brain' },
  { id: 'social', name: 'Ventana al Mundo', description: 'Modo Colaborativo: Conecta con la Logia y comparte apuntes.', cost: 100, active: false, icon: 'users' },
];

export const getIcon = (name: string, className?: string) => {
  switch (name) {
    case 'book': return <Book className={className} />;
    case 'compass': return <Compass className={className} />;
    case 'hourglass': return <Hourglass className={className} />;
    case 'pen': return <PenTool className={className} />;
    case 'scale': return <Scale className={className} />;
    case 'users': return <Users className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'chat': return <MessageSquare className={className} />;
    case 'chevron': return <ChevronRight className={className} />;
    case 'plus': return <Plus className={className} />;
    case 'trash': return <Trash2 className={className} />;
    case 'calendar': return <CalendarIcon className={className} />;
    case 'check': return <CheckCircle2 className={className} />;
    case 'volume': return <Volume2 className={className} />;
    case 'rain': return <CloudRain className={className} />;
    case 'fire': return <Flame className={className} />;
    case 'music': return <Music className={className} />;
    case 'moon': return <Moon className={className} />;
    case 'coffee': return <Coffee className={className} />;
    case 'brain': return <Brain className={className} />;
    case 'lock': return <Lock className={className} />;
    case 'profile': return <User className={className} />;
    case 'security': return <ShieldCheck className={className} />;
    case 'social': return <Eye className={className} />;
    case 'sun': return <Sun className={className} />;
    case 'target': return <Target className={className} />;
    case 'wind': return <Wind className={className} />;
    case 'low-battery': return <BatteryLow className={className} />;
    case 'storm': return <CloudLightning className={className} />;
    case 'camera': return <Camera className={className} />;
    case 'unlock': return <Unlock className={className} />;
    default: return null;
  }
};
