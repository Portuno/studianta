import React from 'react';
import { getIcon } from '../constants';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
  isMobile?: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, isMobile = false }) => {
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] to-[#FFE4E9] py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white/60 border border-[#F8C8DC] hover:bg-[#FFF0F5] transition-all"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5 text-[#4A233E]" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="font-cinzel text-3xl md:text-4xl font-black text-[#4A233E] mb-2">
                Política de Privacidad
              </h1>
              <p className="font-garamond text-[#8B5E75] text-sm">
                Última actualización: {currentDate}
              </p>
            </div>
            <div className="hidden md:block">
              {getIcon('security', 'w-12 h-12 text-[#D4AF37]')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
          {/* Introducción */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              1. Introducción
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Studianta - Sanctuary of Knowledge ("nosotros", "nuestra", "la aplicación") se compromete a proteger su privacidad. 
              Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza 
              nuestra plataforma de gestión académica.
            </p>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Al utilizar Studianta, usted acepta las prácticas descritas en esta política. Si no está de acuerdo con alguna parte 
              de esta política, le recomendamos que no utilice nuestros servicios.
            </p>
          </section>

          {/* Información que recopilamos */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              2. Información que Recopilamos
            </h2>
            
            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              2.1. Información de Cuenta
            </h3>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Dirección de correo electrónico</li>
              <li>Nombre completo (opcional)</li>
              <li>Información de perfil académico (carrera, institución)</li>
              <li>Avatar o foto de perfil (opcional)</li>
            </ul>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              2.2. Datos Académicos
            </h3>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Asignaturas y materias cursadas</li>
              <li>Horarios y calendarios académicos</li>
              <li>Notas, apuntes y materiales de estudio</li>
              <li>Eventos y recordatorios académicos</li>
            </ul>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              2.3. Datos Financieros
            </h3>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Transacciones financieras personales</li>
              <li>Presupuestos y gastos</li>
              <li>Información de ingresos (opcional)</li>
            </ul>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              2.4. Datos Personales
            </h3>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Entradas de diario personal</li>
              <li>Fotografías subidas al diario</li>
              <li>Estado de ánimo y sentimientos registrados</li>
            </ul>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              2.5. Datos de Uso
            </h3>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Interacciones con la aplicación</li>
              <li>Sesiones de enfoque y productividad</li>
              <li>Preferencias de usuario</li>
            </ul>
          </section>

          {/* Cómo usamos la información */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              3. Cómo Utilizamos su Información
            </h2>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Proporcionar y mejorar nuestros servicios de gestión académica</li>
              <li>Personalizar su experiencia en la aplicación</li>
              <li>Procesar y almacenar sus datos académicos y personales</li>
              <li>Generar análisis y recomendaciones mediante inteligencia artificial</li>
              <li>Gestionar su cuenta y autenticación</li>
              <li>Comunicarnos con usted sobre actualizaciones y cambios en el servicio</li>
              <li>Cumplir con obligaciones legales y proteger nuestros derechos</li>
            </ul>
          </section>

          {/* Integraciones de terceros */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              4. Integraciones de Terceros
            </h2>
            
            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              4.1. Google Calendar
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Cuando autoriza la integración con Google Calendar, accedemos a su calendario para:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Sincronizar eventos académicos</li>
              <li>Crear recordatorios y notificaciones</li>
              <li>Gestionar su calendario académico</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              Puede revocar este acceso en cualquier momento desde la configuración de su cuenta de Google.
            </p>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              4.2. Google Gemini AI
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Utilizamos Google Gemini AI para proporcionar funcionalidades de inteligencia artificial, 
              incluyendo análisis de documentos y generación de contenido. Los datos procesados por esta 
              integración se manejan según las políticas de privacidad de Google.
            </p>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              4.3. Supabase
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Utilizamos Supabase como proveedor de servicios en la nube para almacenar y gestionar sus datos. 
              Supabase cumple con estándares de seguridad y privacidad internacionales.
            </p>
          </section>

          {/* Almacenamiento y seguridad */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              5. Almacenamiento y Seguridad
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Cifrado de datos en tránsito y en reposo</li>
              <li>Autenticación segura mediante Supabase Auth</li>
              <li>Protección mediante PIN para datos sensibles</li>
              <li>Acceso restringido a datos personales</li>
              <li>Copias de seguridad regulares</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. 
              Aunque nos esforzamos por proteger su información, no podemos garantizar su seguridad absoluta.
            </p>
          </section>

          {/* Sus derechos */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              6. Sus Derechos
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Usted tiene los siguientes derechos respecto a sus datos personales:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li><strong>Acceso:</strong> Puede solicitar una copia de sus datos personales</li>
              <li><strong>Rectificación:</strong> Puede corregir información inexacta o incompleta</li>
              <li><strong>Eliminación:</strong> Puede solicitar la eliminación de sus datos personales</li>
              <li><strong>Portabilidad:</strong> Puede solicitar la transferencia de sus datos a otro servicio</li>
              <li><strong>Oposición:</strong> Puede oponerse al procesamiento de sus datos en ciertas circunstancias</li>
              <li><strong>Limitación:</strong> Puede solicitar la limitación del procesamiento de sus datos</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              Para ejercer estos derechos, puede contactarnos a través de la sección de perfil en la aplicación 
              o mediante el correo electrónico asociado a su cuenta.
            </p>
          </section>

          {/* Retención de datos */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              7. Retención de Datos
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Conservamos sus datos personales mientras su cuenta esté activa y durante el tiempo necesario para 
              cumplir con los fines descritos en esta política, a menos que la ley requiera o permita un período 
              de retención más largo. Cuando elimine su cuenta, eliminaremos o anonimizaremos sus datos personales, 
              excepto cuando la ley requiera que los conservemos.
            </p>
          </section>

          {/* Menores de edad */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              8. Menores de Edad
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Studianta está dirigida a estudiantes universitarios y adultos. No recopilamos intencionalmente información 
              personal de menores de 18 años. Si descubrimos que hemos recopilado información de un menor sin el consentimiento 
              de sus padres, tomaremos medidas para eliminar esa información.
            </p>
          </section>

          {/* Cambios a esta política */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              9. Cambios a esta Política
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios significativos 
              mediante una notificación en la aplicación o por correo electrónico. La fecha de "Última actualización" 
              al inicio de esta política indica cuándo se realizó la última revisión.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              10. Contacto
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el manejo 
              de sus datos personales, puede contactarnos:
            </p>
            <div className="bg-white/60 rounded-xl p-4 border border-[#F8C8DC]">
              <p className="font-garamond text-[#4A233E]">
                <strong className="font-cinzel">Studianta - Sanctuary of Knowledge</strong>
              </p>
              <p className="font-garamond text-[#4A233E] mt-2">
                A través de la aplicación: Perfil → Configuración → Soporte
              </p>
              <p className="font-garamond text-[#4A233E] mt-4">
                Studianta es una creación de{' '}
                <a
                  href="https://www.versaproducciones.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E35B8F] hover:text-[#4A233E] font-semibold underline-offset-2 hover:underline transition-colors"
                >
                  Versa Producciones
                </a>
                . Para más información, visite{' '}
                <a
                  href="https://www.versaproducciones.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E35B8F] hover:text-[#4A233E] font-semibold underline-offset-2 hover:underline transition-colors"
                >
                  www.versaproducciones.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-garamond text-sm text-[#8B5E75]">
            © {new Date().getFullYear()} Studianta - Sanctuary of Knowledge. Todos los derechos reservados.
          </p>
          <p className="font-garamond text-xs text-[#8B5E75] mt-2">
            Studianta es una creación de{' '}
            <a
              href="https://www.versaproducciones.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A233E] hover:text-[#E35B8F] font-semibold underline-offset-2 hover:underline transition-colors"
            >
              Versa Producciones
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

