import React, { useState } from 'react';
import { getIcon } from '../constants';

interface Artefacto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  icono: string;
  adquirido: boolean;
}

interface BazarArtefactosProps {
  isMobile?: boolean;
  essence?: number;
  onEssenceChange?: (newEssence: number) => void;
}

const BazarArtefactos: React.FC<BazarArtefactosProps> = ({ 
  isMobile = false,
  essence: externalEssence,
  onEssenceChange
}) => {
  // Estado interno para esencia si no se proporciona externamente
  const [internalEssence, setInternalEssence] = useState(500);
  
  // Usar esencia externa si está disponible, sino usar la interna
  const currentEssence = externalEssence !== undefined ? externalEssence : internalEssence;
  
  const handleEssenceChange = (newEssence: number) => {
    if (onEssenceChange) {
      onEssenceChange(newEssence);
    } else {
      setInternalEssence(newEssence);
    }
  };

  // Estado inicial de artefactos
  const [artefactos, setArtefactos] = useState<Artefacto[]>([
    {
      id: 'abaco-cristal',
      nombre: 'El Ábaco de Cristal',
      descripcion: 'Calculadora financiera y académica avanzada integrada en la Balanza.',
      precio: 150,
      icono: '🧮',
      adquirido: false
    },
    {
      id: 'cofre-ideas',
      nombre: 'Cofre de Ideas e Inspiración',
      descripcion: 'Grimorio para gestión de proyectos complejos y registro de sueños académicos.',
      precio: 300,
      icono: '🗝️',
      adquirido: false
    },
    {
      id: 'prisma-evaluacion',
      nombre: 'Prisma de Evaluación',
      descripcion: 'Generador automático de exámenes de práctica basados en tus apuntes subidos.',
      precio: 250,
      icono: '🔮',
      adquirido: false
    }
  ]);

  const handleComprar = (artefacto: Artefacto) => {
    if (artefacto.adquirido || currentEssence < artefacto.precio) {
      return;
    }

    // Restar esencia
    const nuevaEsencia = currentEssence - artefacto.precio;
    handleEssenceChange(nuevaEsencia);

    // Marcar artefacto como adquirido
    setArtefactos(prevArtefactos =>
      prevArtefactos.map(art =>
        art.id === artefacto.id
          ? { ...art, adquirido: true }
          : art
      )
    );
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col gap-6 pb-20 animate-fade-in px-4 overflow-y-auto no-scrollbar">
        {/* Encabezado */}
        <section className="text-center pt-8 mb-4">
          <h1 className="font-cinzel text-3xl font-black text-[#4A233E] tracking-[0.25em] uppercase">
            Bazar de Artefactos Académicos
          </h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto mt-2 opacity-50 rounded-full" />
        </section>

        {/* Saldo de Esencia */}
        <section className="glass-card p-4 rounded-2xl border-2 border-[#D4AF37]/30 mx-2 mb-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/30">
              {getIcon('sparkles', 'w-5 h-5 text-[#D4AF37]')}
            </div>
            <div className="text-center">
              <p className="font-garamond italic text-xs text-[#8B5E75]">Esencia Disponible</p>
              <p className="font-cinzel text-2xl font-black text-[#D4AF37]">{currentEssence}</p>
            </div>
          </div>
        </section>

        {/* Grid de Artefactos */}
        <section className="flex-1">
          <h3 className="text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b border-[#F8C8DC] pb-3 mb-6 px-2">
            Artefactos Disponibles
          </h3>
          <div className="grid grid-cols-1 gap-4 pb-12">
            {artefactos.map((artefacto) => {
              const puedeComprar = !artefacto.adquirido && currentEssence >= artefacto.precio;
              const saldoInsuficiente = !artefacto.adquirido && currentEssence < artefacto.precio;

              return (
                <div
                  key={artefacto.id}
                  className={`glass-card rounded-[2rem] p-6 transition-all duration-300 border-2 ${
                    artefacto.adquirido
                      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5'
                      : 'border-[#F8C8DC]/50 hover:border-[#D4AF37]/30'
                  } ${saldoInsuficiente ? 'opacity-60 grayscale-[0.3]' : ''}`}
                >
                  {/* Icono y Título */}
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 ${
                        artefacto.adquirido
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40'
                          : 'bg-white/40 border-[#F8C8DC]'
                      }`}
                    >
                      {artefacto.icono}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-cinzel text-lg font-black text-[#4A233E] uppercase tracking-wider mb-1">
                        {artefacto.nombre}
                      </h4>
                      {artefacto.adquirido && (
                        <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded-full text-[8px] font-black uppercase border border-[#D4AF37]/30">
                          Adquirido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="font-garamond italic text-sm text-[#8B5E75] mb-4 leading-relaxed">
                    {artefacto.descripcion}
                  </p>

                  {/* Precio y Botón */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F8C8DC]">
                    <div className="flex items-center gap-2">
                      <span className="font-cinzel text-xl font-black text-[#D4AF37]">
                        {artefacto.precio}
                      </span>
                      {getIcon('sparkles', 'w-4 h-4 text-[#D4AF37]')}
                    </div>
                    {artefacto.adquirido ? (
                      <div className="px-4 py-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-xs font-black uppercase tracking-wider border border-[#D4AF37]/30">
                        Adquirido
                      </div>
                    ) : (
                      <button
                        onClick={() => handleComprar(artefacto)}
                        disabled={!puedeComprar}
                        className={`px-6 py-3 rounded-xl font-cinzel text-xs font-black uppercase tracking-widest shadow-lg transition-all duration-300 ${
                          puedeComprar
                            ? 'btn-primary hover:scale-105 active:scale-95'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {saldoInsuficiente ? (
                          <span className="flex items-center gap-2">
                            {getIcon('lock', 'w-3 h-3')}
                            Insuficiente
                          </span>
                        ) : (
                          `Canjear por ${artefacto.precio}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // Versión Desktop/Tablet
  return (
    <div className="h-full flex flex-col gap-6 pb-10 max-w-7xl mx-auto overflow-hidden animate-fade-in">
      {/* Encabezado */}
      <section className="text-center pt-8 mb-6">
        <h1 className="font-cinzel text-4xl lg:text-5xl font-black text-[#4A233E] tracking-[0.3em] uppercase">
          Bazar de Artefactos Académicos
        </h1>
        <div className="h-1 w-16 lg:w-20 bg-[#D4AF37] mx-auto mt-3 rounded-full" />
        <p className="font-garamond italic text-base lg:text-lg text-[#8B5E75] mt-4 max-w-2xl mx-auto">
          Una tienda de antigüedades académicas exclusiva donde puedes desbloquear nuevas funcionalidades
        </p>
      </section>

      {/* Saldo de Esencia */}
      <section className="glass-card p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border-2 border-[#D4AF37]/30 mx-4 lg:mx-0 mb-6">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-2 border-[#D4AF37]/40">
            {getIcon('sparkles', 'w-8 h-8 lg:w-10 lg:h-10 text-[#D4AF37]')}
          </div>
          <div className="text-center">
            <p className="font-garamond italic text-sm lg:text-base text-[#8B5E75] mb-1">
              Esencia Disponible
            </p>
            <p className="font-cinzel text-3xl lg:text-4xl font-black text-[#D4AF37]">
              {currentEssence}
            </p>
          </div>
        </div>
      </section>

      {/* Grid de Artefactos */}
      <section className="flex-1 overflow-y-auto pr-2 no-scrollbar px-4 lg:px-0">
        <h3 className="text-[10px] lg:text-[11px] font-inter font-black uppercase tracking-[0.3em] text-[#8B5E75] border-b-2 border-[#F8C8DC] pb-4 mb-6">
          Colección de Artefactos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-12">
          {artefactos.map((artefacto) => {
            const puedeComprar = !artefacto.adquirido && currentEssence >= artefacto.precio;
            const saldoInsuficiente = !artefacto.adquirido && currentEssence < artefacto.precio;

            return (
              <div
                key={artefacto.id}
                className={`glass-card rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 transition-all duration-500 border-2 hover:shadow-2xl ${
                  artefacto.adquirido
                    ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5'
                    : 'border-[#F8C8DC]/50 hover:border-[#D4AF37]/30'
                } ${saldoInsuficiente ? 'opacity-60 grayscale-[0.3]' : ''}`}
              >
                {/* Icono */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-20 h-20 lg:w-24 lg:h-24 rounded-2xl lg:rounded-3xl flex items-center justify-center text-4xl lg:text-5xl border-2 transition-transform duration-300 ${
                      artefacto.adquirido
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40'
                        : 'bg-white/40 border-[#F8C8DC] hover:scale-110'
                    }`}
                  >
                    {artefacto.icono}
                  </div>
                </div>

                {/* Título */}
                <div className="text-center mb-3">
                  <h4 className="font-cinzel text-xl lg:text-2xl font-black text-[#4A233E] uppercase tracking-wider mb-2">
                    {artefacto.nombre}
                  </h4>
                  {artefacto.adquirido && (
                    <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-[9px] font-black uppercase border border-[#D4AF37]/30 tracking-wider">
                      Adquirido
                    </span>
                  )}
                </div>

                {/* Descripción */}
                <p className="font-garamond italic text-sm lg:text-base text-[#8B5E75] mb-6 leading-relaxed text-center min-h-[3rem]">
                  {artefacto.descripcion}
                </p>

                {/* Precio */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="font-cinzel text-2xl lg:text-3xl font-black text-[#D4AF37]">
                    {artefacto.precio}
                  </span>
                  {getIcon('sparkles', 'w-5 h-5 lg:w-6 lg:h-6 text-[#D4AF37]')}
                </div>

                {/* Botón de Acción */}
                <div className="mt-6">
                  {artefacto.adquirido ? (
                    <div className="w-full px-6 py-4 rounded-xl lg:rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37] font-cinzel text-xs lg:text-sm font-black uppercase tracking-wider border-2 border-[#D4AF37]/30 text-center">
                      Adquirido
                    </div>
                  ) : (
                    <button
                      onClick={() => handleComprar(artefacto)}
                      disabled={!puedeComprar}
                      className={`w-full px-6 py-4 rounded-xl lg:rounded-2xl font-cinzel text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl transition-all duration-300 ${
                        puedeComprar
                          ? 'btn-primary hover:scale-105 active:scale-95'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {saldoInsuficiente ? (
                        <span className="flex items-center justify-center gap-2">
                          {getIcon('lock', 'w-4 h-4')}
                          Esencia Insuficiente
                        </span>
                      ) : (
                        `Canjear por ${artefacto.precio}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default BazarArtefactos;

