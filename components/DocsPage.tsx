import React, { useState } from 'react';
import { getIcon } from '../constants';

interface DocsPageProps {
  onBack?: () => void;
  isMobile?: boolean;
}

const DocsPage: React.FC<DocsPageProps> = ({ onBack, isMobile = false }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'essence', title: 'Esencia', icon: 'sparkles' },
    { id: 'dashboard', title: 'Atanor (Dashboard)', icon: 'sparkles' },
    { id: 'subjects', title: 'Asignaturas', icon: 'book' },
    { id: 'calendar', title: 'Calendario', icon: 'calendar' },
    { id: 'focus', title: 'Enfoque', icon: 'hourglass' },
    { id: 'diary', title: 'Diario', icon: 'pen' },
    { id: 'finance', title: 'Balanza (Finanzas)', icon: 'scale' },
    { id: 'oracle', title: 'Oráculo Personal', icon: 'brain' },
    { id: 'bazar', title: 'Bazar de Artefactos', icon: 'bazar' },
    { id: 'profile', title: 'Perfil', icon: 'profile' },
    { id: 'security', title: 'Seguridad', icon: 'lock' },
    { id: 'social', title: 'Social', icon: 'users' },
  ];

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className="h-full flex flex-col bg-[#FFF9FB] relative overflow-hidden">
      {/* Header */}
      <header className="flex-none p-4 md:p-6 border-b border-[#D4AF37]/40 bg-white/60 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full glass-card border-2 border-[#F8C8DC] flex items-center justify-center text-[#E35B8F] hover:bg-white/60 transition-all"
                aria-label="Volver"
              >
                {getIcon('chevron', 'w-5 h-5 rotate-180')}
              </button>
            )}
            <div>
              <h1 className="font-cinzel text-2xl md:text-3xl font-black text-[#4A233E] tracking-[0.2em] uppercase">
                Documentación de Studianta
              </h1>
              <p className="font-garamond text-sm md:text-base text-[#8B5E75] italic mt-1">
                Guía completa de la plataforma
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Introducción */}
          <div className="glass-card rounded-[2rem] p-6 md:p-8 mb-6 border-2 border-[#D4AF37]/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#E35B8F] flex items-center justify-center">
                {getIcon('book', 'w-8 h-8 text-white')}
              </div>
              <div>
                <h2 className="font-cinzel text-xl md:text-2xl font-bold text-[#4A233E] uppercase tracking-wider">
                  Bienvenida a Studianta
                </h2>
                <p className="font-garamond text-[#8B5E75] text-sm md:text-base italic">
                  Tu compañera académica integral
                </p>
              </div>
            </div>
            <p className="font-garamond text-base md:text-lg text-[#374151] leading-relaxed text-justify">
              Studianta es una plataforma diseñada para acompañarte en tu camino académico. 
              Aquí encontrarás todas las herramientas necesarias para organizar tus estudios, 
              gestionar tus finanzas, mantener el enfoque y registrar tu crecimiento personal. 
              Esta documentación te guiará a través de cada sección y funcionalidad.
            </p>
          </div>

          {/* Secciones */}
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="glass-card rounded-[2rem] overflow-hidden border-2 border-[#D4AF37]/30 transition-all"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                      {getIcon(section.icon, 'w-6 h-6')}
                    </div>
                    <h3 className="font-cinzel text-lg md:text-xl font-bold text-[#4A233E] uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                  <div className={`transform transition-transform ${activeSection === section.id ? 'rotate-180' : ''}`}>
                    {getIcon('chevron', 'w-5 h-5 text-[#8B5E75]')}
                  </div>
                </button>

                {activeSection === section.id && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-[#D4AF37]/20">
                    {section.id === 'essence' && <EssenceSection />}
                    {section.id === 'dashboard' && <DashboardSection />}
                    {section.id === 'subjects' && <SubjectsSection />}
                    {section.id === 'calendar' && <CalendarSection />}
                    {section.id === 'focus' && <FocusSection />}
                    {section.id === 'diary' && <DiarySection />}
                    {section.id === 'finance' && <FinanceSection />}
                    {section.id === 'oracle' && <OracleSection />}
                    {section.id === 'bazar' && <BazarSection />}
                    {section.id === 'profile' && <ProfileSection />}
                    {section.id === 'security' && <SecuritySection />}
                    {section.id === 'social' && <SocialSection />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sección de Esencia
const EssenceSection: React.FC = () => {
  return (
    <div className="space-y-6 pt-4">
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#E35B8F]/10 rounded-xl p-6 border-l-4 border-[#D4AF37]">
        <h4 className="font-cinzel text-lg font-bold text-[#4A233E] mb-3 uppercase tracking-wider">
          ¿Qué es la Esencia?
        </h4>
        <p className="font-garamond text-[#374151] leading-relaxed text-justify">
          La <strong className="text-[#D4AF37]">Esencia</strong> es el sistema de gamificación de Studianta. 
          Representa tu energía y dedicación en el camino académico. Comenzarás con <strong className="text-[#D4AF37]">0 esencia</strong> 
          y podrás ganarla a través de diversas actividades en la plataforma.
        </p>
      </div>

      <div>
        <h4 className="font-cinzel text-base font-bold text-[#4A233E] mb-3 uppercase tracking-wider flex items-center gap-2">
          {getIcon('sparkles', 'w-5 h-5 text-[#D4AF37]')}
          Cómo Ganar Esencia
        </h4>
        <ul className="space-y-3 ml-4">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2 flex-shrink-0" />
            <div>
              <strong className="text-[#D4AF37]">Sesiones de Enfoque:</strong> Gana esencia por cada minuto 
              de estudio completado. Las sesiones completadas otorgan bonificaciones adicionales.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2 flex-shrink-0" />
            <div>
              <strong className="text-[#D4AF37]">Sellar Notas:</strong> Al sellar una nota en Asignaturas, 
              ganas <strong className="text-[#D4AF37]">+3 esencia</strong>. Esto consagra tu conocimiento al Oráculo.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2 flex-shrink-0" />
            <div>
              <strong className="text-[#D4AF37]">Completar Tareas:</strong> Varias acciones en la plataforma 
              te otorgan esencia como recompensa por tu productividad.
            </div>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-cinzel text-base font-bold text-[#4A233E] mb-3 uppercase tracking-wider flex items-center gap-2">
          {getIcon('scale', 'w-5 h-5 text-[#D4AF37]')}
          Cómo Usar la Esencia
        </h4>
        <div className="bg-white/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#E35B8F]/10 rounded-lg">
            <div>
              <strong className="text-[#4A233E]">Módulo Social</strong>
              <p className="text-sm text-[#8B5E75]">Conecta con otros estudiantes</p>
            </div>
            <span className="font-cinzel font-bold text-[#D4AF37] text-lg">100</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#E35B8F]/10 rounded-lg">
            <div>
              <strong className="text-[#4A233E]">Bazar de Artefactos</strong>
              <p className="text-sm text-[#8B5E75]">Compra mejoras y artefactos</p>
            </div>
            <span className="font-cinzel font-bold text-[#D4AF37] text-lg">200</span>
          </div>
          <p className="text-sm text-[#8B5E75] italic pt-2 border-t border-[#D4AF37]/20">
            Todos los demás módulos son <strong className="text-[#D4AF37]">gratuitos</strong> y están disponibles desde el inicio.
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-cinzel text-base font-bold text-[#4A233E] mb-3 uppercase tracking-wider flex items-center gap-2">
          {getIcon('target', 'w-5 h-5 text-[#D4AF37]')}
          Niveles Arcanos
        </h4>
        <p className="font-garamond text-[#374151] leading-relaxed text-justify mb-4">
          Tu <strong className="text-[#D4AF37]">Esencia Total Ganada</strong> determina tu nivel arcano, 
          que refleja tu progreso en el camino académico:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { level: 'Buscadora de Luz', min: 0, max: 100 },
            { level: 'Aprendiz de la Logia', min: 100, max: 300 },
            { level: 'Alquimista Clínica', min: 300, max: 600 },
            { level: 'Maestra de la Transmutación', min: 600, max: 1000 },
            { level: 'Archimaga del Conocimiento', min: 1000, max: 2000 },
            { level: 'Gran Alquimista', min: 2000, max: 5000 },
            { level: 'Arquitecta del Saber Eterno', min: 5000, max: Infinity },
          ].map((lvl) => (
            <div key={lvl.level} className="bg-white/60 rounded-lg p-3 border border-[#D4AF37]/20">
              <div className="font-cinzel font-bold text-[#4A233E] text-sm">{lvl.level}</div>
              <div className="font-garamond text-xs text-[#8B5E75] mt-1">
                {lvl.min === 0 ? 'Inicio' : `${lvl.min}`} - {lvl.max === Infinity ? '∞' : `${lvl.max}`} esencia
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sección de Dashboard
const DashboardSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El <strong className="text-[#D4AF37]">Atanor</strong> es tu centro de control. Desde aquí puedes acceder 
        a todos los módulos de Studianta. El diseño tipo "tablero mágico" te permite visualizar y activar 
        cada sección de forma intuitiva.
      </p>
      <div className="bg-[#D4AF37]/10 rounded-xl p-4">
        <strong className="text-[#4A233E]">Tip:</strong> Los módulos activos aparecen con colores vibrantes, 
        mientras que los inactivos están en escala de grises hasta que los actives.
      </div>
    </div>
  );
};

// Sección de Asignaturas
const SubjectsSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        En <strong className="text-[#D4AF37]">Asignaturas</strong> gestionas todas tus materias, horarios, 
        apuntes y materiales de estudio.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Funcionalidades principales:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Agregar materias con información completa (profesor, aula, horarios)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Crear hitos importantes (exámenes, entregas, parciales)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Tomar notas y organizarlas por materia</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Subir materiales de estudio (PDFs, imágenes, documentos)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span><strong className="text-[#D4AF37]">Sellar notas</strong> para ganar +3 esencia</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Consultar al Oráculo sobre temas específicos de cada materia</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Calendario
const CalendarSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El <strong className="text-[#D4AF37]">Calendario</strong> integra todos tus eventos académicos, 
        financieros y personales en una vista unificada.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Vistas disponibles:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span><strong>Vista Mensual:</strong> Visualiza todo el mes en un vistazo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span><strong>Vista Semanal:</strong> Organiza tu semana día por día</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span><strong>Vista Diaria:</strong> Enfócate en un día específico</span>
          </li>
        </ul>
      </div>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Funcionalidades:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Crear eventos personalizados con descripción, hora de inicio y fin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Sincronización con Google Calendar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Exportar calendario en formato .ics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Visualización automática de clases, hitos y transacciones</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Enfoque
const FocusSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        <strong className="text-[#D4AF37]">Enfoque</strong> es tu herramienta de productividad basada en 
        la técnica Pomodoro. Gestiona sesiones de estudio enfocadas y gana esencia por tu dedicación.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Cómo funciona:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Inicia una sesión de estudio (25 minutos por defecto)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Gana <strong className="text-[#D4AF37]">1 esencia por minuto</strong> de estudio</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Completar una sesión otorga <strong className="text-[#D4AF37]">+5 esencia</strong> de bonificación</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Asocia sesiones a materias específicas para mejor seguimiento</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Visualiza estadísticas de tu productividad</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Diario
const DiarySection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El <strong className="text-[#D4AF37]">Diario</strong> es tu espacio personal para registrar estados 
        emocionales, reflexiones y momentos importantes de tu camino académico.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Características:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Registra tu estado emocional (Radiante, Enfocada, Equilibrada, Agotada, Estresada)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Escribe reflexiones y pensamientos del día</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Agrega fotos a tus entradas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Bloquea entradas con PIN para mayor privacidad</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Visualiza tu progreso emocional a lo largo del tiempo</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Finanzas
const FinanceSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        La <strong className="text-[#D4AF37]">Balanza</strong> te ayuda a gestionar tus finanzas académicas, 
        controlar ingresos y gastos, y mantener un presupuesto saludable.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Funcionalidades:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Registra ingresos y gastos académicos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Categoriza transacciones (Materiales, Transporte, Comida, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Establece un presupuesto mensual</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Visualiza tu balance y estado financiero</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Consulta al Oráculo para análisis financiero inteligente</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Oráculo
const OracleSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El <strong className="text-[#D4AF37]">Oráculo Personal</strong> es tu asistente IA que conoce todo 
        sobre tu situación académica. Utiliza tu perfil completo para darte consejos personalizados y 
        ayudarte a tomar decisiones informadas.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Qué puede hacer:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Analizar tu situación académica completa</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Priorizar tareas y eventos importantes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Sugerir rutinas de estudio personalizadas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Responder preguntas sobre materias específicas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Descargar conversaciones en formato PDF elegante</span>
          </li>
        </ul>
      </div>
      <div className="bg-[#D4AF37]/10 rounded-xl p-4">
        <strong className="text-[#4A233E]">Tip:</strong> El Oráculo tiene acceso a toda tu información 
        (materias, calendario, finanzas, diario) para darte respuestas contextualizadas y precisas.
      </div>
    </div>
  );
};

// Sección de Bazar
const BazarSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El <strong className="text-[#D4AF37]">Bazar de Artefactos</strong> es donde puedes gastar tu esencia 
        en mejoras y artefactos que potencian tu experiencia en Studianta.
      </p>
      <div className="bg-[#E35B8F]/10 rounded-xl p-4 border-l-4 border-[#E35B8F]">
        <strong className="text-[#4A233E]">Costo de activación:</strong> <span className="text-[#D4AF37] font-bold">200 esencia</span>
      </div>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Disponible próximamente:</h5>
        <p className="font-garamond text-[#8B5E75] italic">
          El Bazar estará disponible en futuras actualizaciones con artefactos y mejoras exclusivas.
        </p>
      </div>
    </div>
  );
};

// Sección de Perfil
const ProfileSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        Tu <strong className="text-[#D4AF37]">Perfil</strong> contiene toda tu información personal y académica, 
        así como tus estadísticas y progreso en Studianta.
      </p>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Información que puedes gestionar:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Nombre completo y foto de perfil</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Carrera e institución académica</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Esencia actual y total ganada</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Nivel arcano y progreso hacia el siguiente nivel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Estadísticas de uso de la plataforma</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Seguridad
const SecuritySection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El módulo de <strong className="text-[#D4AF37]">Seguridad</strong> te permite proteger tus entradas 
        del Diario con un PIN personal.
      </p>
      <div className="bg-[#E35B8F]/10 rounded-xl p-4 border-l-4 border-[#E35B8F]">
        <strong className="text-[#4A233E]">Costo de activación:</strong> <span className="text-[#D4AF37] font-bold">0 esencia</span> (gratis)
      </div>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Funcionalidades:</h5>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Establecer un PIN de 4 dígitos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Bloquear entradas del Diario con el PIN</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D4AF37]">•</span>
            <span>Cambiar o eliminar el PIN cuando lo desees</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Sección de Social
const SocialSection: React.FC = () => {
  return (
    <div className="space-y-4 pt-4">
      <p className="font-garamond text-[#374151] leading-relaxed text-justify">
        El módulo <strong className="text-[#D4AF37]">Social</strong> te permite conectar con otros estudiantes 
        y compartir experiencias académicas.
      </p>
      <div className="bg-[#E35B8F]/10 rounded-xl p-4 border-l-4 border-[#E35B8F]">
        <strong className="text-[#4A233E]">Costo de activación:</strong> <span className="text-[#D4AF37] font-bold">100 esencia</span>
      </div>
      <div>
        <h5 className="font-cinzel font-bold text-[#4A233E] mb-2">Disponible próximamente:</h5>
        <p className="font-garamond text-[#8B5E75] italic">
          Las funcionalidades sociales estarán disponibles en futuras actualizaciones.
        </p>
      </div>
    </div>
  );
};

export default DocsPage;

