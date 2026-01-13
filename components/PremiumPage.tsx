import React, { useState, useEffect } from 'react';
import { getIcon } from '../constants';
import { supabaseService, UserProfile } from '../services/supabaseService';

interface PremiumPageProps {
  user?: any;
  userProfile?: UserProfile | null;
  isNightMode?: boolean;
  onSubscribe?: () => void;
}

const PremiumPage: React.FC<PremiumPageProps> = ({ user, userProfile, isNightMode = false, onSubscribe }) => {
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para suscribirte a Premium.');
      return;
    }
    setSubscriptionLoading(true);
    try {
      if (onSubscribe) {
        onSubscribe();
      } else {
        const { url } = await supabaseService.createCheckoutSession(user.id);
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert('Error al crear la sesión de pago. Por favor, intenta nuevamente.');
      setSubscriptionLoading(false);
    }
  };

  const benefits = [
    {
      icon: 'crown',
      title: 'Acceso Ilimitado',
      description: 'Desbloquea todos los módulos y funcionalidades sin restricciones.',
    },
    {
      icon: 'brain',
      title: 'Oráculo Avanzado',
      description: 'Acceso ilimitado al Oráculo con respuestas más detalladas y personalizadas.',
    },
    {
      icon: 'calendar',
      title: 'Calendario Premium',
      description: 'Sincronización con Google Calendar y eventos ilimitados.',
    },
    {
      icon: 'focus',
      title: 'Sesiones de Enfoque Ilimitadas',
      description: 'Realiza todas las sesiones de enfoque que necesites sin límites.',
    },
    {
      icon: 'target',
      title: 'Generador de Exámenes Ilimitado',
      description: 'Crea exámenes personalizados sin límite de cantidad.',
    },
    {
      icon: 'diary',
      title: 'Diario Ilimitado',
      description: 'Escribe todas las entradas que quieras en tu diario académico.',
    },
    {
      icon: 'nutrition',
      title: 'Nutrición Avanzada',
      description: 'Seguimiento completo de nutrición con análisis detallados.',
    },
    {
      icon: 'bazar',
      title: 'Bazar Premium',
      description: 'Acceso a herramientas y recursos exclusivos del bazar.',
    },
    {
      icon: 'calculator',
      title: 'Calculadora Científica',
      description: 'Calculadora científica completa con todas las funciones avanzadas.',
    },
    {
      icon: 'balanza',
      title: 'Balanza Pro',
      description: 'Gestión financiera avanzada con análisis y reportes detallados.',
    },
    {
      icon: 'cloud',
      title: 'Sincronización en la Nube',
      description: 'Tus datos sincronizados en todos tus dispositivos de forma segura.',
    },
    {
      icon: 'help',
      title: 'Soporte Prioritario',
      description: 'Atención al cliente prioritaria y respuesta rápida a tus consultas.',
    },
  ];

  return (
    <div className={`h-full w-full overflow-y-auto ${isNightMode ? 'bg-[#1A1A2E]' : 'bg-gradient-to-br from-[#FFF9FA] to-[#FFE5E9]'}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            {getIcon('crown', 'w-16 h-16 text-[#D4AF37]')}
          </div>
          <h1 className={`font-cinzel text-4xl md:text-5xl font-black mb-4 tracking-wider ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            STUDIANTA PREMIUM
          </h1>
          <p className={`font-garamond text-lg md:text-xl mb-2 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>
            Potencia tu experiencia académica
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className={`font-cinzel text-3xl md:text-4xl font-black ${
              isNightMode ? 'text-[#D4AF37]' : 'text-[#2D1A26]'
            }`}>
              14,99€
            </span>
            <span className={`font-garamond text-lg ${
              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
            }`}>
              /mes
            </span>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 hover:border-[#C77DFF]/50'
                  : 'bg-white/90 border-[#F8C8DC] hover:border-[#E35B8F]/40 shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  isNightMode
                    ? 'bg-[rgba(199,125,255,0.2)]'
                    : 'bg-[#E35B8F]/10'
                }`}>
                  {getIcon(benefit.icon, `w-6 h-6 ${isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'}`)}
                </div>
                <div className="flex-1">
                  <h3 className={`font-cinzel text-lg font-bold mb-2 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    {benefit.title}
                  </h3>
                  <p className={`font-garamond text-sm ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className={`text-center p-8 md:p-12 rounded-3xl border-2 ${
          isNightMode
            ? 'bg-gradient-to-r from-[#C77DFF]/20 to-[#A68A56]/20 border-[#A68A56]/40'
            : 'bg-gradient-to-r from-[#D4AF37]/20 to-[#E35B8F]/20 border-[#D4AF37]/60'
        }`}>
          <h2 className={`font-cinzel text-2xl md:text-3xl font-black mb-4 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            ¿Listo para llevar tu estudio al siguiente nivel?
          </h2>
          <p className={`font-garamond text-base md:text-lg mb-8 ${
            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
          }`}>
            Únete a Premium y desbloquea todo el potencial de STUDIANTA
          </p>
          <button
            onClick={handleSubscribe}
            disabled={subscriptionLoading}
            className={`px-8 py-4 rounded-xl font-cinzel text-lg font-black uppercase tracking-widest shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isNightMode
                ? 'bg-gradient-to-r from-[#C77DFF] to-[#A68A56] text-white hover:shadow-[0_0_30px_rgba(199,125,255,0.5)]'
                : 'bg-gradient-to-r from-[#E35B8F] to-[#D4AF37] text-white hover:shadow-[0_0_30px_rgba(227,91,143,0.5)]'
            }`}
          >
            {subscriptionLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {getIcon('crown', 'w-6 h-6')}
                <span>Suscribirse a Premium</span>
              </div>
            )}
          </button>
          {userProfile?.tier === 'Premium' && (
            <p className={`mt-4 font-garamond text-sm ${
              isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
            }`}>
              ✓ Ya eres miembro Premium
            </p>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className={`font-cinzel text-2xl font-bold mb-6 text-center ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
          }`}>
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: '¿Puedo cancelar mi suscripción en cualquier momento?',
                a: 'Sí, puedes cancelar tu suscripción Premium en cualquier momento desde tu perfil. No hay penalizaciones ni cargos adicionales.',
              },
              {
                q: '¿Qué métodos de pago aceptan?',
                a: 'Aceptamos tarjetas de crédito y débito a través de nuestra pasarela de pago segura.',
              },
              {
                q: '¿Mi suscripción se renueva automáticamente?',
                a: 'Sí, tu suscripción se renueva automáticamente cada mes. Puedes cancelarla en cualquier momento antes de la renovación.',
              },
              {
                q: '¿Puedo probar Premium antes de suscribirme?',
                a: 'Actualmente no ofrecemos período de prueba, pero puedes cancelar en cualquier momento sin compromiso.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/30'
                    : 'bg-white/60 border-[#F8C8DC]'
                }`}
              >
                <h3 className={`font-cinzel font-bold mb-2 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>
                  {faq.q}
                </h3>
                <p className={`font-garamond text-sm ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
