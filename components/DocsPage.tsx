import React, { useState, useMemo } from 'react';
import { getIcon } from '../constants';

interface DocsPageProps {
  onBack?: () => void;
  isMobile?: boolean;
  isNightMode?: boolean;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  keywords: string[];
  content: React.FC;
}

const DocsPage: React.FC<DocsPageProps> = ({ onBack, isMobile = false }) => {
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: Section[] = [
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
  const CurrentContent = currentSection?.content || DashboardSection;

  return (
    <div className={`h-full flex flex-col bg-white ${isMobile ? '' : ''}`}>
      {/* Header */}
      <header className="flex-none border-b-2 border-[#D4AF37] bg-white shadow-sm z-20">
        <div className={`${isMobile ? 'px-4' : 'max-w-7xl mx-auto px-8'} py-3 md:py-4`}>
          <div className="flex items-center gap-2 md:gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 touch-manipulation ${
                  isNightMode 
                    ? 'border-[#A68A56] text-[#E0E1DD] hover:bg-[#A68A56]/10 active:bg-[#A68A56]/10' 
                    : 'border-[#D4AF37] text-[#4A233E] hover:bg-[#D4AF37]/10 active:bg-[#D4AF37]/10'
                }`}
                aria-label="Volver"
                tabIndex={0}
              >
                {getIcon('chevron', 'w-4 h-4 md:w-5 md:h-5 rotate-180')}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-cinzel text-lg md:text-2xl lg:text-3xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
                {isMobile ? 'Docs' : 'Documentación de Studianta'}
              </h1>
              {!isMobile && (
                <p className="font-inter text-sm text-[#666] mt-1">
                  Guía completa de la plataforma
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMobile ? (
        /* Mobile Layout - Vertical Structure */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Navigation - Dropdown/Select Style */}
          <div className="flex-none border-b-2 border-[#D4AF37] bg-white px-4 py-2">
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                }}
                className="w-full px-3 py-2.5 border-2 border-[#D4AF37]/30 rounded-lg bg-white text-[#1a1a1a] focus:outline-none focus:border-[#D4AF37] transition-colors font-inter text-base touch-manipulation appearance-none pr-10"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {getIcon('chevron', 'w-5 h-5 text-[#D4AF37]')}
              </div>
            </div>
          </div>

          {/* Mobile Content */}
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="px-4 pt-3 pb-2">
              <CurrentContent isMobile={isMobile} />
              
              {/* Navigation Buttons */}
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/20 flex flex-col gap-2 pb-1">
                {(() => {
                  const currentIndex = sections.findIndex(s => s.id === selectedSection);
                  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
                  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
                  
                  return (
                    <>
                      {prevSection && (
                        <button
                          onClick={() => setSelectedSection(prevSection.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-[#D4AF37]/30 rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all touch-manipulation"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-3">
                            {getIcon('chevron', 'w-5 h-5 text-[#D4AF37] rotate-180')}
                            <div className="text-left">
                              <div className="text-xs text-[#666] font-inter mb-1">Anterior</div>
                              <div className="font-cinzel font-semibold text-[#1a1a1a]">{prevSection.title}</div>
                            </div>
                          </div>
                        </button>
                      )}
                      {nextSection && (
                        <button
                          onClick={() => setSelectedSection(nextSection.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-[#D4AF37]/30 rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all touch-manipulation"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-left">
                              <div className="text-xs text-[#666] font-inter mb-1">Siguiente</div>
                              <div className="font-cinzel font-semibold text-[#1a1a1a]">{nextSection.title}</div>
                            </div>
                          </div>
                          {getIcon('chevron', 'w-5 h-5 text-[#D4AF37]')}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </main>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="flex w-64 flex-shrink-0 border-r-2 border-[#D4AF37] bg-[#fafafa] overflow-y-auto">
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

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 md:py-12">
              <div className="prose prose-lg max-w-none">
                <CurrentContent isMobile={isMobile} />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};


// Sección de Dashboard
const DashboardSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Atanor (Dashboard)
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          El <strong className="text-[#D4AF37] font-semibold">Atanor</strong> es tu centro de control. Desde aquí puedes acceder 
          a todos los módulos de Studianta. El diseño tipo "tablero mágico" te permite visualizar y activar 
          cada sección de forma intuitiva.
        </p>
      </div>
      <div className={`bg-[#D4AF37]/5 border-l-4 border-[#D4AF37] ${isMobile ? 'p-4' : 'p-6'} rounded-r-lg`}>
        <p className={`text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <strong className="text-[#1a1a1a] font-semibold">Tip:</strong> Los módulos activos aparecen con colores vibrantes, 
          mientras que los inactivos están en escala de grises hasta que los actives.
        </p>
      </div>
    </div>
  );
};

// Sección de Asignaturas
const SubjectsSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Asignaturas
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          En <strong className="text-[#D4AF37] font-semibold">Asignaturas</strong> gestionas todas tus materias, horarios, 
          apuntes y materiales de estudio.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Funcionalidades principales</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Agregar materias con información completa (profesor, aula, horarios)</span>
          </li>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Crear hitos importantes (exámenes, entregas, parciales)</span>
          </li>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Tomar notas y organizarlas por materia</span>
          </li>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Subir materiales de estudio (PDFs, imágenes, documentos)</span>
          </li>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span><strong className="text-[#D4AF37] font-semibold">Sellar notas</strong> para marcar tu conocimiento</span>
          </li>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Consultar al Oráculo sobre temas específicos de cada materia</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Calendario
const CalendarSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Calendario
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          El <strong className="text-[#D4AF37] font-semibold">Calendario</strong> integra todos tus eventos académicos, 
          financieros y personales en una vista unificada.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Vistas disponibles</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span><strong className="text-[#1a1a1a] font-semibold">Vista Mensual:</strong> Visualiza todo el mes en un vistazo</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span><strong className="text-[#1a1a1a] font-semibold">Vista Semanal:</strong> Organiza tu semana día por día</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span><strong className="text-[#1a1a1a] font-semibold">Vista Diaria:</strong> Enfócate en un día específico</span>
          </li>
        </ul>
      </section>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Funcionalidades</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Crear eventos personalizados con descripción, hora de inicio y fin</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Sincronización con Google Calendar</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Exportar calendario en formato .ics</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Visualización automática de clases, hitos y transacciones</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Enfoque
const FocusSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Enfoque
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          <strong className="text-[#D4AF37] font-semibold">Enfoque</strong> es tu herramienta de productividad basada en 
          la técnica Pomodoro. Gestiona sesiones de estudio enfocadas para mejorar tu productividad.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Cómo funciona</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Inicia una sesión de estudio (25 minutos por defecto)</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Registra tu tiempo de estudio para mantener un seguimiento de tu dedicación</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Completa sesiones para mejorar tu disciplina y productividad</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Asocia sesiones a materias específicas para mejor seguimiento</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Visualiza estadísticas de tu productividad</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Diario
const DiarySection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Diario
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          El <strong className="text-[#D4AF37] font-semibold">Diario</strong> es tu espacio personal para registrar estados 
          emocionales, reflexiones y momentos importantes de tu camino académico.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Características</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Registra tu estado emocional (Radiante, Enfocada, Equilibrada, Agotada, Estresada)</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Escribe reflexiones y pensamientos del día</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Agrega fotos a tus entradas</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Bloquea entradas con PIN para mayor privacidad</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Visualiza tu progreso emocional a lo largo del tiempo</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Finanzas
const FinanceSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Balanza (Finanzas)
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          La <strong className="text-[#D4AF37] font-semibold">Balanza</strong> te ayuda a gestionar tus finanzas académicas, 
          controlar ingresos y gastos, y mantener un presupuesto saludable.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Funcionalidades</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Registra ingresos y gastos académicos</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Categoriza transacciones (Materiales, Transporte, Comida, etc.)</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Establece un presupuesto mensual</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Visualiza tu balance y estado financiero</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Consulta al Oráculo para análisis financiero inteligente</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Oráculo
const OracleSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Oráculo Personal
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          El <strong className="text-[#D4AF37] font-semibold">Oráculo Personal</strong> es tu asistente IA que conoce todo 
          sobre tu situación académica. Utiliza tu perfil completo para darte consejos personalizados y 
          ayudarte a tomar decisiones informadas.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Qué puede hacer</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Analizar tu situación académica completa</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Priorizar tareas y eventos importantes</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Sugerir rutinas de estudio personalizadas</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Responder preguntas sobre materias específicas</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Descargar conversaciones en formato PDF elegante</span>
          </li>
        </ul>
      </section>
      <div className={`bg-[#D4AF37]/5 border-l-4 border-[#D4AF37] ${isMobile ? 'p-4' : 'p-6'} rounded-r-lg`}>
        <p className={`text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <strong className="text-[#1a1a1a] font-semibold">Tip:</strong> El Oráculo tiene acceso a toda tu información 
          (materias, calendario, finanzas, diario) para darte respuestas contextualizadas y precisas.
        </p>
      </div>
    </div>
  );
};


// Sección de Perfil
const ProfileSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Perfil
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          Tu <strong className="text-[#D4AF37] font-semibold">Perfil</strong> contiene toda tu información personal y académica, 
          así como tus estadísticas y progreso en Studianta.
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Información que puedes gestionar</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Nombre completo y foto de perfil</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Carrera e institución académica</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Estadísticas de uso de la plataforma</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Descargar tu perfil completo (SPC) para análisis externo</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Estadísticas de uso de la plataforma</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Seguridad
const SecuritySection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Seguridad
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          El módulo de <strong className="text-[#D4AF37] font-semibold">Seguridad</strong> te permite proteger tus entradas 
          del Diario con un PIN personal.
        </p>
      </div>
      <div className={`bg-[#E35B8F]/5 border-l-4 border-[#E35B8F] ${isMobile ? 'p-4' : 'p-6'} rounded-r-lg`}>
        <p className={`text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <strong className="text-[#1a1a1a] font-semibold">Disponibilidad:</strong> <span className={`text-[#D4AF37] font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>Gratuito</span>
        </p>
      </div>
      <section>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Funcionalidades</h3>
        <ul className={`${isMobile ? 'space-y-3' : 'space-y-2 md:space-y-3'} text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <li className={`flex items-start ${isMobile ? 'gap-3' : 'gap-2 md:gap-3'}`}>
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Establecer un PIN de 4 dígitos</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Bloquear entradas del Diario con el PIN</span>
          </li>
          <li className="flex items-start gap-2 md:gap-3">
            <span className={`text-[#D4AF37] font-bold leading-none mt-1 flex-shrink-0 ${isMobile ? 'text-lg' : 'text-xl'}`}>•</span>
            <span>Cambiar o eliminar el PIN cuando lo desees</span>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Sección de Social
const SocialSection: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6 md:space-y-8'}`}>
      <div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'} tracking-tight`}>
          Social
        </h2>
        <div className={`h-1 bg-[#D4AF37] ${isMobile ? 'mb-3 w-16' : 'mb-4 md:mb-6 w-24'}`}></div>
        <p className={`${isMobile ? 'text-base leading-relaxed' : 'text-lg leading-relaxed'} text-[#333] font-inter ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
          El módulo <strong className="text-[#D4AF37] font-semibold">Social</strong> te permite conectar con otros estudiantes 
          y compartir experiencias académicas.
        </p>
      </div>
      <div className={`bg-[#E35B8F]/5 border-l-4 border-[#E35B8F] ${isMobile ? 'p-4' : 'p-6'} rounded-r-lg`}>
        <p className={`text-[#333] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          <strong className="text-[#1a1a1a] font-semibold">Disponibilidad:</strong> <span className={`text-[#D4AF37] font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>Próximamente</span>
        </p>
      </div>
      <div>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cinzel font-bold text-[#1a1a1a] ${isMobile ? 'mb-3' : 'mb-3 md:mb-4'}`}>Disponible próximamente</h3>
        <p className={`text-[#666] font-inter ${isMobile ? 'text-base leading-relaxed' : ''}`}>
          Las funcionalidades sociales estarán disponibles en futuras actualizaciones.
        </p>
      </div>
    </div>
  );
};

export default DocsPage;
