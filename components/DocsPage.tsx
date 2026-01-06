import React, { useState, useMemo } from 'react';
import { getIcon } from '../constants';

interface DocsPageProps {
  onBack?: () => void;
  isMobile?: boolean;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  keywords: string[];
  content: React.FC;
}

const DocsPage: React.FC<DocsPageProps> = ({ onBack, isMobile = false }) => {
  const [selectedSection, setSelectedSection] = useState<string>('essence');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: Section[] = [
    { 
      id: 'essence', 
      title: 'Esencia', 
      icon: 'sparkles',
      keywords: ['esencia', 'gamificación', 'puntos', 'niveles', 'arcano', 'ganar', 'usar', 'social', 'bazar', 'costos'],
      content: EssenceSection 
    },
    { 
      id: 'dashboard', 
      title: 'Atanor (Dashboard)', 
      icon: 'sparkles',
      keywords: ['dashboard', 'atanor', 'centro', 'control', 'módulos', 'acceso'],
      content: DashboardSection 
    },
    { 
      id: 'subjects', 
      title: 'Asignaturas', 
      icon: 'book',
      keywords: ['asignaturas', 'materias', 'notas', 'apuntes', 'materiales', 'hitos', 'exámenes', 'profesor', 'aula'],
      content: SubjectsSection 
    },
    { 
      id: 'calendar', 
      title: 'Calendario', 
      icon: 'calendar',
      keywords: ['calendario', 'eventos', 'google calendar', 'sincronización', 'exportar', 'vista mensual', 'semanal', 'diaria'],
      content: CalendarSection 
    },
    { 
      id: 'focus', 
      title: 'Enfoque', 
      icon: 'hourglass',
      keywords: ['enfoque', 'pomodoro', 'sesiones', 'estudio', 'productividad', 'temporizador'],
      content: FocusSection 
    },
    { 
      id: 'diary', 
      title: 'Diario', 
      icon: 'pen',
      keywords: ['diario', 'reflexiones', 'emociones', 'estado', 'mood', 'privacidad', 'pin'],
      content: DiarySection 
    },
    { 
      id: 'finance', 
      title: 'Balanza (Finanzas)', 
      icon: 'scale',
      keywords: ['finanzas', 'balanza', 'gastos', 'ingresos', 'presupuesto', 'transacciones', 'dinero'],
      content: FinanceSection 
    },
    { 
      id: 'oracle', 
      title: 'Oráculo Personal', 
      icon: 'brain',
      keywords: ['oráculo', 'ia', 'inteligencia artificial', 'asistente', 'consejos', 'análisis', 'chat'],
      content: OracleSection 
    },
    { 
      id: 'bazar', 
      title: 'Bazar de Artefactos', 
      icon: 'bazar',
      keywords: ['bazar', 'artefactos', 'mejoras', 'comprar', 'tienda'],
      content: BazarSection 
    },
    { 
      id: 'profile', 
      title: 'Perfil', 
      icon: 'profile',
      keywords: ['perfil', 'información', 'estadísticas', 'progreso', 'nivel arcano'],
      content: ProfileSection 
    },
    { 
      id: 'security', 
      title: 'Seguridad', 
      icon: 'lock',
      keywords: ['seguridad', 'pin', 'protección', 'privacidad', 'bloquear'],
      content: SecuritySection 
    },
    { 
      id: 'social', 
      title: 'Social', 
      icon: 'users',
      keywords: ['social', 'comunidad', 'estudiantes', 'conectar'],
      content: SocialSection 
    },
  ];

  // Buscador semántico
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase().trim();
    return sections.filter(section => {
      // Buscar en título
      if (section.title.toLowerCase().includes(query)) return true;
      // Buscar en keywords
      if (section.keywords.some(keyword => keyword.includes(query))) return true;
      return false;
    });
  }, [searchQuery]);

  const currentSection = sections.find(s => s.id === selectedSection);
  const CurrentContent = currentSection?.content || EssenceSection;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <header className="flex-none border-b-2 border-[#D4AF37] bg-white shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-10 h-10 rounded-lg border-2 border-[#D4AF37] flex items-center justify-center text-[#4A233E] hover:bg-[#D4AF37]/10 transition-all"
                  aria-label="Volver"
                >
                  {getIcon('chevron', 'w-5 h-5 rotate-180')}
                </button>
              )}
              <div>
                <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-[#1a1a1a] tracking-tight">
                  Documentación de Studianta
                </h1>
                <p className="font-inter text-sm text-[#666] mt-1">
                  Guía completa de la plataforma
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`${isMobile ? 'hidden' : 'flex'} w-64 flex-shrink-0 border-r-2 border-[#D4AF37] bg-[#fafafa] overflow-y-auto`}>
          <div className="w-full p-4">
            {/* Buscador */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getIcon('search', 'w-5 h-5 text-[#666]')}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en documentación..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#D4AF37]/30 rounded-lg bg-white text-[#1a1a1a] placeholder:text-[#999] focus:outline-none focus:border-[#D4AF37] transition-colors font-inter text-sm"
                />
              </div>
              {searchQuery && (
                <p className="text-xs text-[#666] mt-2 font-inter">
                  {filteredSections.length} resultado{filteredSections.length !== 1 ? 's' : ''} encontrado{filteredSections.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Navegación */}
            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section.id);
                    setSearchQuery(''); // Limpiar búsqueda al seleccionar
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all font-inter ${
                    selectedSection === section.id
                      ? 'bg-[#D4AF37] text-white shadow-md'
                      : 'text-[#1a1a1a] hover:bg-[#D4AF37]/10'
                  }`}
                >
                  <div className={`flex-shrink-0 ${selectedSection === section.id ? 'text-white' : 'text-[#D4AF37]'}`}>
                    {getIcon(section.icon, 'w-5 h-5')}
                  </div>
                  <span className="font-medium text-sm">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Navigation */}
        {isMobile && (
          <div className="w-full border-b-2 border-[#D4AF37] bg-[#fafafa] overflow-x-auto">
            <div className="flex gap-2 p-4">
              <div className="relative flex-shrink-0 mb-4 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getIcon('search', 'w-5 h-5 text-[#666]')}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#D4AF37]/30 rounded-lg bg-white text-[#1a1a1a] placeholder:text-[#999] focus:outline-none focus:border-[#D4AF37] transition-colors font-inter text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section.id);
                    setSearchQuery('');
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-inter text-sm ${
                    selectedSection === section.id
                      ? 'bg-[#D4AF37] text-white shadow-md'
                      : 'bg-white text-[#1a1a1a] border-2 border-[#D4AF37]/30 hover:bg-[#D4AF37]/10'
                  }`}
                >
                  <div className={selectedSection === section.id ? 'text-white' : 'text-[#D4AF37]'}>
                    {getIcon(section.icon, 'w-4 h-4')}
                  </div>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="prose prose-lg max-w-none">
              <CurrentContent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sección de Esencia
const EssenceSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Sistema de Esencia
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          La <strong className="text-[#D4AF37] font-semibold">Esencia</strong> es el sistema de gamificación de Studianta. 
          Representa tu energía y dedicación en el camino académico. Comenzarás con <strong className="text-[#D4AF37] font-semibold">0 esencia</strong> 
          y podrás ganarla a través de diversas actividades en la plataforma.
        </p>
      </div>

      <section className="bg-[#D4AF37]/5 border-l-4 border-[#D4AF37] p-6 rounded-r-lg">
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4 flex items-center gap-3">
          {getIcon('sparkles', 'w-6 h-6 text-[#D4AF37]')}
          Cómo Ganar Esencia
        </h3>
        <ul className="space-y-4 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-[#1a1a1a] font-semibold">Sesiones de Enfoque:</strong> Gana esencia por cada minuto 
              de estudio completado. Las sesiones completadas otorgan bonificaciones adicionales de <strong className="text-[#D4AF37]">+5 esencia</strong>.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-[#1a1a1a] font-semibold">Sellar Notas:</strong> Al sellar una nota en Asignaturas, 
              ganas <strong className="text-[#D4AF37] font-semibold">+3 esencia</strong>. Esto consagra tu conocimiento al Oráculo.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-[#1a1a1a] font-semibold">Completar Tareas:</strong> Varias acciones en la plataforma 
              te otorgan esencia como recompensa por tu productividad.
            </div>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4 flex items-center gap-3">
          {getIcon('scale', 'w-6 h-6 text-[#D4AF37]')}
          Cómo Usar la Esencia
        </h3>
        <div className="bg-white border-2 border-[#D4AF37]/20 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#E35B8F]/5 rounded-lg border border-[#E35B8F]/20">
            <div>
              <strong className="text-[#1a1a1a] font-semibold text-lg">Módulo Social</strong>
              <p className="text-[#666] text-sm mt-1">Conecta con otros estudiantes</p>
            </div>
            <span className="font-cinzel font-bold text-[#D4AF37] text-2xl">100</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#E35B8F]/5 rounded-lg border border-[#E35B8F]/20">
            <div>
              <strong className="text-[#1a1a1a] font-semibold text-lg">Bazar de Artefactos</strong>
              <p className="text-[#666] text-sm mt-1">Compra mejoras y artefactos</p>
            </div>
            <span className="font-cinzel font-bold text-[#D4AF37] text-2xl">200</span>
          </div>
          <div className="pt-4 border-t border-[#D4AF37]/20">
            <p className="text-[#666] text-sm font-inter">
              Todos los demás módulos son <strong className="text-[#D4AF37] font-semibold">gratuitos</strong> y están disponibles desde el inicio.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4 flex items-center gap-3">
          {getIcon('target', 'w-6 h-6 text-[#D4AF37]')}
          Niveles Arcanos
        </h3>
        <p className="text-[#333] leading-relaxed font-inter mb-6">
          Tu <strong className="text-[#D4AF37] font-semibold">Esencia Total Ganada</strong> determina tu nivel arcano, 
          que refleja tu progreso en el camino académico:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { level: 'Buscadora de Luz', min: 0, max: 100 },
            { level: 'Aprendiz de la Logia', min: 100, max: 300 },
            { level: 'Alquimista Clínica', min: 300, max: 600 },
            { level: 'Maestra de la Transmutación', min: 600, max: 1000 },
            { level: 'Archimaga del Conocimiento', min: 1000, max: 2000 },
            { level: 'Gran Alquimista', min: 2000, max: 5000 },
            { level: 'Arquitecta del Saber Eterno', min: 5000, max: Infinity },
          ].map((lvl) => (
            <div key={lvl.level} className="bg-white border-2 border-[#D4AF37]/20 rounded-lg p-4 hover:border-[#D4AF37] transition-colors">
              <div className="font-cinzel font-bold text-[#1a1a1a] text-base mb-2">{lvl.level}</div>
              <div className="font-inter text-sm text-[#666]">
                {lvl.min === 0 ? 'Inicio' : `${lvl.min}`} - {lvl.max === Infinity ? '∞' : `${lvl.max}`} esencia
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// Sección de Dashboard
const DashboardSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Atanor (Dashboard)
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El <strong className="text-[#D4AF37] font-semibold">Atanor</strong> es tu centro de control. Desde aquí puedes acceder 
          a todos los módulos de Studianta. El diseño tipo "tablero mágico" te permite visualizar y activar 
          cada sección de forma intuitiva.
        </p>
      </div>
      <div className="bg-[#D4AF37]/5 border-l-4 border-[#D4AF37] p-6 rounded-r-lg">
        <p className="text-[#333] font-inter">
          <strong className="text-[#1a1a1a] font-semibold">Tip:</strong> Los módulos activos aparecen con colores vibrantes, 
          mientras que los inactivos están en escala de grises hasta que los actives.
        </p>
      </div>
    </div>
  );
};

// Sección de Asignaturas
const SubjectsSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Asignaturas
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          En <strong className="text-[#D4AF37] font-semibold">Asignaturas</strong> gestionas todas tus materias, horarios, 
          apuntes y materiales de estudio.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Funcionalidades principales</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Agregar materias con información completa (profesor, aula, horarios)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Crear hitos importantes (exámenes, entregas, parciales)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Tomar notas y organizarlas por materia</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Subir materiales de estudio (PDFs, imágenes, documentos)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span><strong className="text-[#D4AF37] font-semibold">Sellar notas</strong> para ganar +3 esencia</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Consultar al Oráculo sobre temas específicos de cada materia</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Calendario
const CalendarSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Calendario
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El <strong className="text-[#D4AF37] font-semibold">Calendario</strong> integra todos tus eventos académicos, 
          financieros y personales en una vista unificada.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Vistas disponibles</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span><strong className="text-[#1a1a1a] font-semibold">Vista Mensual:</strong> Visualiza todo el mes en un vistazo</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span><strong className="text-[#1a1a1a] font-semibold">Vista Semanal:</strong> Organiza tu semana día por día</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span><strong className="text-[#1a1a1a] font-semibold">Vista Diaria:</strong> Enfócate en un día específico</span>
          </li>
        </ul>
      </section>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Funcionalidades</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Crear eventos personalizados con descripción, hora de inicio y fin</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Sincronización con Google Calendar</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Exportar calendario en formato .ics</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Visualización automática de clases, hitos y transacciones</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Enfoque
const FocusSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Enfoque
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          <strong className="text-[#D4AF37] font-semibold">Enfoque</strong> es tu herramienta de productividad basada en 
          la técnica Pomodoro. Gestiona sesiones de estudio enfocadas y gana esencia por tu dedicación.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Cómo funciona</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Inicia una sesión de estudio (25 minutos por defecto)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Gana <strong className="text-[#D4AF37] font-semibold">1 esencia por minuto</strong> de estudio</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Completar una sesión otorga <strong className="text-[#D4AF37] font-semibold">+5 esencia</strong> de bonificación</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Asocia sesiones a materias específicas para mejor seguimiento</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Visualiza estadísticas de tu productividad</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Diario
const DiarySection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Diario
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El <strong className="text-[#D4AF37] font-semibold">Diario</strong> es tu espacio personal para registrar estados 
          emocionales, reflexiones y momentos importantes de tu camino académico.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Características</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Registra tu estado emocional (Radiante, Enfocada, Equilibrada, Agotada, Estresada)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Escribe reflexiones y pensamientos del día</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Agrega fotos a tus entradas</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Bloquea entradas con PIN para mayor privacidad</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Visualiza tu progreso emocional a lo largo del tiempo</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Finanzas
const FinanceSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Balanza (Finanzas)
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          La <strong className="text-[#D4AF37] font-semibold">Balanza</strong> te ayuda a gestionar tus finanzas académicas, 
          controlar ingresos y gastos, y mantener un presupuesto saludable.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Funcionalidades</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Registra ingresos y gastos académicos</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Categoriza transacciones (Materiales, Transporte, Comida, etc.)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Establece un presupuesto mensual</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Visualiza tu balance y estado financiero</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Consulta al Oráculo para análisis financiero inteligente</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Oráculo
const OracleSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Oráculo Personal
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El <strong className="text-[#D4AF37] font-semibold">Oráculo Personal</strong> es tu asistente IA que conoce todo 
          sobre tu situación académica. Utiliza tu perfil completo para darte consejos personalizados y 
          ayudarte a tomar decisiones informadas.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Qué puede hacer</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Analizar tu situación académica completa</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Priorizar tareas y eventos importantes</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Sugerir rutinas de estudio personalizadas</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Responder preguntas sobre materias específicas</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Descargar conversaciones en formato PDF elegante</span>
          </li>
        </ul>
      </section>
      <div className="bg-[#D4AF37]/5 border-l-4 border-[#D4AF37] p-6 rounded-r-lg">
        <p className="text-[#333] font-inter">
          <strong className="text-[#1a1a1a] font-semibold">Tip:</strong> El Oráculo tiene acceso a toda tu información 
          (materias, calendario, finanzas, diario) para darte respuestas contextualizadas y precisas.
        </p>
      </div>
    </div>
  );
};

// Sección de Bazar
const BazarSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Bazar de Artefactos
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El <strong className="text-[#D4AF37] font-semibold">Bazar de Artefactos</strong> es donde puedes gastar tu esencia 
          en mejoras y artefactos que potencian tu experiencia en Studianta.
        </p>
      </div>
      <div className="bg-[#E35B8F]/5 border-l-4 border-[#E35B8F] p-6 rounded-r-lg">
        <p className="text-[#333] font-inter">
          <strong className="text-[#1a1a1a] font-semibold">Costo de activación:</strong> <span className="text-[#D4AF37] font-bold text-lg">200 esencia</span>
        </p>
      </div>
      <div>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Disponible próximamente</h3>
        <p className="text-[#666] font-inter">
          El Bazar estará disponible en futuras actualizaciones con artefactos y mejoras exclusivas.
        </p>
      </div>
    </div>
  );
};

// Sección de Perfil
const ProfileSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Perfil
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          Tu <strong className="text-[#D4AF37] font-semibold">Perfil</strong> contiene toda tu información personal y académica, 
          así como tus estadísticas y progreso en Studianta.
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Información que puedes gestionar</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Nombre completo y foto de perfil</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Carrera e institución académica</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Esencia actual y total ganada</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Nivel arcano y progreso hacia el siguiente nivel</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Estadísticas de uso de la plataforma</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Seguridad
const SecuritySection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Seguridad
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El módulo de <strong className="text-[#D4AF37] font-semibold">Seguridad</strong> te permite proteger tus entradas 
          del Diario con un PIN personal.
        </p>
      </div>
      <div className="bg-[#E35B8F]/5 border-l-4 border-[#E35B8F] p-6 rounded-r-lg">
        <p className="text-[#333] font-inter">
          <strong className="text-[#1a1a1a] font-semibold">Costo de activación:</strong> <span className="text-[#D4AF37] font-bold text-lg">0 esencia</span> (gratis)
        </p>
      </div>
      <section>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Funcionalidades</h3>
        <ul className="space-y-3 text-[#333] font-inter">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Establecer un PIN de 4 dígitos</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Bloquear entradas del Diario con el PIN</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-bold text-xl leading-none mt-1">•</span>
            <span>Cambiar o eliminar el PIN cuando lo desees</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Social
const SocialSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-[#1a1a1a] mb-4 tracking-tight">
          Social
        </h2>
        <div className="h-1 w-24 bg-[#D4AF37] mb-6"></div>
        <p className="text-lg text-[#333] leading-relaxed font-inter mb-6">
          El módulo <strong className="text-[#D4AF37] font-semibold">Social</strong> te permite conectar con otros estudiantes 
          y compartir experiencias académicas.
        </p>
      </div>
      <div className="bg-[#E35B8F]/5 border-l-4 border-[#E35B8F] p-6 rounded-r-lg">
        <p className="text-[#333] font-inter">
          <strong className="text-[#1a1a1a] font-semibold">Costo de activación:</strong> <span className="text-[#D4AF37] font-bold text-lg">100 esencia</span>
        </p>
      </div>
      <div>
        <h3 className="text-2xl font-cinzel font-bold text-[#1a1a1a] mb-4">Disponible próximamente</h3>
        <p className="text-[#666] font-inter">
          Las funcionalidades sociales estarán disponibles en futuras actualizaciones.
        </p>
      </div>
    </div>
  );
};

export default DocsPage;
