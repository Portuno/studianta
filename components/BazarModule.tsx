
import React, { useState } from 'react';
import { getIcon, COLORS } from '../constants';

interface Artifact {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  price?: number;
  status: 'available' | 'coming_soon';
}

interface BazarModuleProps {
  isMobile: boolean;
  isNightMode?: boolean;
  onPurchaseModule?: (moduleId: string) => void;
  userModules?: Array<{ id: string; active: boolean }>;
  onNavigateToCalculator?: () => void;
}

const ARTIFACTS: Artifact[] = [
  // 🎓 Productividad y Carrera
  {
    id: 'exam-generator',
    name: 'Generador de Exámenes',
    description: 'Crea tests de opción múltiple, verdadero/falso o preguntas abiertas a partir de tus propios apuntes mediante IA.',
    category: 'Productividad y Carrera',
    icon: 'file',
    status: 'coming_soon'
  },
  {
    id: 'scientific-calculator',
    name: 'Calculadora',
    description: 'Calculos y conversiones',
    category: 'Productividad y Carrera',
    icon: 'calculator',
    status: 'available'
  },
  {
    id: 'pdf-reader',
    name: 'Lector de PDF Inteligente',
    description: 'Analizador de documentos que utiliza IA para resumir textos, extraer puntos clave y guardar notas automáticamente.',
    category: 'Productividad y Carrera',
    icon: 'file',
    status: 'coming_soon'
  },
  {
    id: 'cv-builder',
    name: 'Constructor de CV & Portafolio',
    description: 'Diseñador de currículums profesionales con plantillas de alta calidad, optimización de palabras clave y exportación a PDF.',
    category: 'Productividad y Carrera',
    icon: 'pen',
    status: 'coming_soon'
  },
  // 💰 Finanzas y Seguridad
  {
    id: 'balanza',
    name: 'Balanza',
            description: 'Sistema avanzado de gestión financiera. Permite crear métodos de pago personalizados (tarjeta, efectivo, teléfono, cripto), separar gastos fijos de extras, programar gastos recurrentes y generar reportes detallados.',
    category: 'Finanzas y Seguridad',
    icon: 'scale',
    status: 'available'
  },
  {
    id: 'privacy-lock',
    name: 'Bloqueo de Privacidad',
    description: 'Permite proteger secciones específicas de la app (como las finanzas o el diario) mediante PIN o biometría (huella/rostro).',
    category: 'Finanzas y Seguridad',
    icon: 'lock',
    status: 'coming_soon'
  },
  {
    id: 'safety-companion',
    name: 'Acompañante de Seguridad',
    description: 'Función de geolocalización en tiempo real para trayectos nocturnos que envía alertas a contactos de confianza si no llegas a tu destino.',
    category: 'Finanzas y Seguridad',
    icon: 'security',
    status: 'coming_soon'
  },
  // 🌿 Salud y Bienestar
  {
    id: 'nutrition-macros',
    name: 'Nutrición & Macros',
    description: 'Registro de alimentación mediante fotos o texto. Calcula calorías y macronutrientes, y analiza cómo influye tu dieta en tu energía para estudiar.',
    category: 'Salud y Bienestar',
    icon: 'sun',
    status: 'coming_soon'
  },
  {
    id: 'menstrual-cycle',
    name: 'Calendario Ciclo Menstrual',
    description: 'Seguimiento del ciclo menstrual y lunar con predicciones de energía y sugerencias de descanso basadas en tu fase biológica.',
    category: 'Salud y Bienestar',
    icon: 'calendar',
    status: 'coming_soon'
  },
  {
    id: 'sleep-tracker',
    name: 'Registro de Sueño',
    description: 'Monitoriza tus horas de descanso y ofrece consejos para mejorar la higiene del sueño y el rendimiento mental.',
    category: 'Salud y Bienestar',
    icon: 'moon',
    status: 'coming_soon'
  },
  {
    id: 'outfit-organizer',
    name: 'Organizador de Outfits',
    description: 'Planificador de vestimenta semanal para reducir la fatiga de decisión, especialmente útil para días de exámenes o eventos importantes.',
    category: 'Salud y Bienestar',
    icon: 'camera',
    status: 'coming_soon'
  },
  // 🎨 Personalización y Comunidad
  {
    id: 'focus-sounds',
    name: 'Sonidos de Enfoque',
    description: 'Reproductor de ambientes (lluvia, cafetería, biblioteca) diseñado para mejorar la concentración durante el tiempo de estudio.',
    category: 'Personalización y Comunidad',
    icon: 'cloud',
    status: 'coming_soon'
  },
  {
    id: 'achievement-badges',
    name: 'Insignias de Logro',
    description: 'Sistema de niveles visuales que muestra tu progreso en la app mediante insignias y sellos de prestigio en tu perfil.',
    category: 'Personalización y Comunidad',
    icon: 'crystal',
    status: 'coming_soon'
  },
  {
    id: 'study-community',
    name: 'Comunidad de Estudio',
    description: 'Espacio para compartir materiales, resúmenes y tarjetas de memoria (flashcards) con otras usuarias de la misma carrera.',
    category: 'Personalización y Comunidad',
    icon: 'users',
    status: 'coming_soon'
  }
];

const CATEGORIES = [
  'Productividad y Carrera',
  'Finanzas y Seguridad',
  'Salud y Bienestar',
  'Personalización y Comunidad'
];

const BazarModule: React.FC<BazarModuleProps> = ({ isMobile, isNightMode = false, onPurchaseModule, userModules = [], onNavigateToCalculator }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtifacts = ARTIFACTS.filter(artifact => {
    const matchesCategory = !selectedCategory || artifact.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const artifactsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredArtifacts.filter(a => a.category === category);
    return acc;
  }, {} as Record<string, Artifact[]>);

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-inter transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
    }`}>
      {/* Header */}
      <header className={`pt-4 pb-3 px-4 flex-shrink-0 backdrop-blur-md border-b transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/30' 
          : 'bg-[#FFF0F5]/80 border-[#F8C8DC]/30'
      }`}>
        <div className="max-w-7xl mx-auto w-full">
          <h1 className={`font-marcellus text-lg md:text-2xl font-black tracking-widest uppercase mb-3 transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>El Bazar de Artefactos</h1>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {getIcon('search', `w-4 h-4 ${isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'}`)}
            </div>
            <input
              type="text"
              placeholder="Buscar artefactos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm font-bold outline-none transition-all ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]' 
                  : 'bg-white/80 border border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:border-[#E35B8F]'
              }`}
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                !selectedCategory
                  ? isNightMode 
                    ? 'bg-[#C77DFF] text-white shadow-md' 
                    : 'bg-[#E35B8F] text-white shadow-md'
                  : isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]'
                    : 'bg-white/60 text-[#8B5E75] border border-[#F8C8DC] hover:bg-white/80'
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  selectedCategory === category
                    ? isNightMode 
                      ? 'bg-[#C77DFF] text-white shadow-md' 
                      : 'bg-[#E35B8F] text-white shadow-md'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]'
                      : 'bg-white/60 text-[#8B5E75] border border-[#F8C8DC] hover:bg-white/80'
                }`}
              >
                {category.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 max-w-7xl mx-auto w-full pt-4 pb-6 overflow-y-auto no-scrollbar">
        {CATEGORIES.map(category => {
          const artifacts = artifactsByCategory[category];
          if (artifacts.length === 0) return null;

          return (
            <section key={category} className="mb-8">
              <h2 className={`font-marcellus text-base md:text-xl font-black mb-4 tracking-[0.2em] uppercase transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                {category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artifacts.map(artifact => (
                  <div
                    key={artifact.id}
                    className={`relative p-5 rounded-[2rem] shadow-xl backdrop-blur-[15px] transition-all duration-300 hover:scale-[1.02] ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 shadow-[0_0_20px_rgba(199,125,255,0.2)]' 
                        : 'glass-card border-[#F8C8DC] bg-white/70'
                    }`}
                  >
                    {/* Coming Soon Badge */}
                    {artifact.status === 'coming_soon' && (
                      <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] ${
                        isNightMode 
                          ? 'bg-[#A68A56]/80 text-white' 
                          : 'bg-[#D4AF37]/90 text-[#4A233E]'
                      }`}>
                        Pronto
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isNightMode 
                        ? 'bg-[rgba(199,125,255,0.2)] text-[#C77DFF]' 
                        : 'bg-[#E35B8F]/10 text-[#E35B8F]'
                    }`}>
                      {getIcon(artifact.icon, 'w-6 h-6')}
                    </div>

                    {/* Name */}
                    <h3 className={`font-marcellus text-base font-black mb-2 tracking-tight transition-colors duration-500 ${
                      isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                    }`}>
                      {artifact.name}
                    </h3>

                    {/* Description */}
                    <p className={`text-xs leading-relaxed mb-4 transition-colors duration-500 ${
                      isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                    }`}>
                      {artifact.description}
                    </p>

                    {/* Price or Status */}
                    <div className={`mt-auto pt-4 border-t transition-colors duration-500 ${
                      isNightMode ? 'border-[#A68A56]/30' : 'border-[#F8C8DC]'
                    }`}>
                      {artifact.status === 'available' ? (
                        (() => {
                          const isActive = userModules.find(m => m.id === artifact.id)?.active || false;
                          return isActive ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                {getIcon('check', `w-4 h-4 ${isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'}`)}
                                <span className={`text-[10px] uppercase tracking-widest font-black transition-colors duration-500 ${
                                  isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                                }`}>
                                  Adquirido
                                </span>
                              </div>
                              {artifact.id === 'scientific-calculator' && onNavigateToCalculator && (
                                <button
                                  onClick={onNavigateToCalculator}
                                  className={`w-full py-2 rounded-xl font-marcellus text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
                                    isNightMode 
                                      ? 'bg-[#C77DFF] text-white hover:bg-[#B56DE8]' 
                                      : 'bg-[#E35B8F] text-white hover:bg-[#D24A7E]'
                                  }`}
                                >
                                  Abrir
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => onPurchaseModule?.(artifact.id)}
                              className={`w-full py-2 rounded-xl font-marcellus text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
                                isNightMode 
                                  ? 'bg-[#C77DFF] text-white hover:bg-[#B56DE8]' 
                                  : 'bg-[#E35B8F] text-white hover:bg-[#D24A7E]'
                              }`}
                            >
                              Adquirir
                            </button>
                          );
                        })()
                      ) : artifact.price ? (
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] uppercase tracking-widest font-black transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>
                            Precio
                          </span>
                          <span className={`font-marcellus text-lg font-black transition-colors duration-500 ${
                            isNightMode ? 'text-[#C77DFF]' : 'text-[#D4AF37]'
                          }`}>
                            ${artifact.price}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getIcon('sparkles', `w-4 h-4 ${isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'}`)}
                          <span className={`text-[10px] uppercase tracking-widest font-black transition-colors duration-500 ${
                            isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                          }`}>
                            En Desarrollo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {filteredArtifacts.length === 0 && (
          <div className={`text-center py-12 transition-colors duration-500 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>
            <p className="font-marcellus text-lg mb-2">No se encontraron artefactos</p>
            <p className="text-sm opacity-60">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BazarModule;
