import React from 'react';
import { getIcon } from '../constants';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack?: () => void;
  isMobile?: boolean;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack, isMobile = false }) => {
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
                Términos y Condiciones de Uso
              </h1>
              <p className="font-garamond text-[#8B5E75] text-sm">
                Última actualización: {currentDate}
              </p>
            </div>
            <div className="hidden md:block">
              {getIcon('file', 'w-12 h-12 text-[#D4AF37]')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
          {/* Aceptación de términos */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Al acceder y utilizar Studianta - Sanctuary of Knowledge ("la Aplicación", "el Servicio"), 
              usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con 
              alguna parte de estos términos, no debe utilizar nuestro servicio.
            </p>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Estos términos constituyen un acuerdo legalmente vinculante entre usted y Studianta. 
              Nos reservamos el derecho de modificar estos términos en cualquier momento, y tales modificaciones 
              entrarán en vigor inmediatamente después de su publicación.
            </p>
          </section>

          {/* Descripción del servicio */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Studianta es una plataforma de gestión académica que ofrece las siguientes funcionalidades:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Gestión de asignaturas y materias académicas</li>
              <li>Calendario académico y sincronización con Google Calendar</li>
              <li>Sistema de enfoque y productividad (Pomodoro)</li>
              <li>Diario personal con protección mediante PIN</li>
              <li>Gestión financiera personal</li>
              <li>Asistente de inteligencia artificial para análisis académico</li>
              <li>Almacenamiento de materiales de estudio</li>
            </ul>
          </section>

          {/* Registro y cuenta */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              3. Registro y Cuenta de Usuario
            </h2>
            
            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              3.1. Elegibilidad
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Debe tener al menos 18 años de edad para utilizar este servicio. Al registrarse, 
              declara y garantiza que cumple con este requisito de edad.
            </p>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              3.2. Información de Cuenta
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Usted es responsable de:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Proporcionar información precisa y actualizada</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta</li>
              <li>Todas las actividades que ocurran bajo su cuenta</li>
            </ul>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              3.3. Seguridad
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Debe mantener la seguridad de su cuenta y notificarnos inmediatamente si sospecha 
              de cualquier violación de seguridad. No somos responsables de ninguna pérdida o daño 
              resultante de su incumplimiento de mantener la seguridad de su cuenta.
            </p>
          </section>

          {/* Uso aceptable */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              4. Uso Aceptable
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Usted se compromete a utilizar el Servicio solo para fines legales y de manera que 
              no infrinja los derechos de otros. Está prohibido:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Utilizar el servicio para actividades ilegales o no autorizadas</li>
              <li>Intentar acceder a áreas restringidas del servicio</li>
              <li>Interferir con el funcionamiento del servicio o servidores</li>
              <li>Transmitir virus, malware o código dañino</li>
              <li>Realizar ingeniería inversa o intentar extraer el código fuente</li>
              <li>Utilizar bots, scripts automatizados o métodos no autorizados para acceder al servicio</li>
              <li>Compartir su cuenta con terceros</li>
              <li>Publicar contenido ofensivo, difamatorio o que viole derechos de propiedad intelectual</li>
            </ul>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              5. Propiedad Intelectual
            </h2>
            
            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              5.1. Contenido de Studianta
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Todo el contenido, diseño, código, logotipos, gráficos y materiales de Studianta 
              son propiedad de Studianta o sus licenciantes y están protegidos por leyes de 
              derechos de autor y otras leyes de propiedad intelectual.
            </p>

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              5.2. Su Contenido
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Usted conserva todos los derechos sobre el contenido que sube o crea en Studianta. 
              Al utilizar el servicio, nos otorga una licencia no exclusiva, mundial, libre de 
              regalías para:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Almacenar, procesar y mostrar su contenido en el servicio</li>
              <li>Utilizar su contenido para proporcionar y mejorar nuestros servicios</li>
              <li>Realizar copias de seguridad de su contenido</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              Usted es responsable de asegurarse de que tiene los derechos necesarios sobre 
              cualquier contenido que suba y de que no infringe los derechos de terceros.
            </p>
          </section>

          {/* Servicios de terceros */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              6. Servicios de Terceros
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Studianta puede integrarse con servicios de terceros, incluyendo pero no limitado a:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li><strong>Google Calendar:</strong> Para sincronización de eventos académicos</li>
              <li><strong>Google Gemini AI:</strong> Para funcionalidades de inteligencia artificial</li>
              <li><strong>Supabase:</strong> Para almacenamiento y autenticación</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              El uso de estos servicios de terceros está sujeto a sus propios términos y condiciones. 
              No somos responsables de las prácticas de privacidad o el contenido de estos servicios de terceros.
            </p>
          </section>

          {/* Limitación de responsabilidad */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              7. Limitación de Responsabilidad
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, STUDIANTA Y SUS PROVEEDORES NO SERÁN RESPONSABLES DE:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Daños indirectos, incidentales, especiales, consecuentes o punitivos</li>
              <li>Pérdida de datos, ingresos, beneficios o oportunidades comerciales</li>
              <li>Interrupciones del servicio o errores técnicos</li>
              <li>Acciones de terceros o servicios integrados</li>
              <li>Contenido generado por usuarios o contenido de terceros</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              El servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías de ningún tipo, 
              expresas o implícitas.
            </p>
          </section>

          {/* Indemnización */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              8. Indemnización
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Usted acepta indemnizar, defender y eximir de responsabilidad a Studianta, sus afiliados, 
              directores, empleados y agentes de cualquier reclamo, demanda, pérdida, responsabilidad y 
              gasto (incluyendo honorarios de abogados) que surjan de o estén relacionados con su uso 
              del servicio, su violación de estos términos, o su violación de los derechos de terceros.
            </p>
          </section>

          {/* Terminación */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              9. Terminación
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Podemos suspender o terminar su acceso al servicio en cualquier momento, con o sin causa 
              o aviso previo, por cualquier motivo, incluyendo pero no limitado a:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Violación de estos términos</li>
              <li>Uso fraudulento o no autorizado</li>
              <li>Actividades ilegales</li>
              <li>Inactividad prolongada de la cuenta</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              Usted puede terminar su cuenta en cualquier momento eliminando su cuenta desde la configuración 
              de perfil. Al terminar, perderá el acceso a todos sus datos y contenido almacenado en el servicio.
            </p>
          </section>

          {/* Modificaciones del servicio */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              10. Modificaciones del Servicio
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio 
              en cualquier momento, con o sin aviso previo. No seremos responsables ante usted ni ante ningún 
              tercero por cualquier modificación, suspensión o discontinuación del servicio.
            </p>
          </section>

          {/* Ley aplicable */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              11. Ley Aplicable
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed">
              Estos términos se regirán e interpretarán de acuerdo con las leyes aplicables, sin tener 
              en cuenta sus disposiciones sobre conflictos de leyes. Cualquier disputa que surja de o 
              esté relacionada con estos términos será resuelta en los tribunales competentes.
            </p>
          </section>

          {/* Disposiciones generales */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              12. Disposiciones Generales
            </h2>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li><strong>Integridad del Acuerdo:</strong> Estos términos constituyen el acuerdo completo entre usted y Studianta.</li>
              <li><strong>Divisibilidad:</strong> Si alguna disposición es inválida, las demás permanecerán en pleno vigor.</li>
              <li><strong>Renuncia:</strong> La falta de ejercicio de un derecho no constituye una renuncia al mismo.</li>
              <li><strong>Cesación:</strong> No puede transferir sus derechos u obligaciones sin nuestro consentimiento previo.</li>
            </ul>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              13. Contacto
            </h2>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-4">
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos:
            </p>
            <div className="bg-white/60 rounded-xl p-4 border border-[#F8C8DC]">
              <p className="font-garamond text-[#4A233E]">
                <strong className="font-cinzel">Studianta - Sanctuary of Knowledge</strong>
              </p>
              <p className="font-garamond text-[#4A233E] mt-2">
                A través de la aplicación: Perfil → Configuración → Soporte
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-garamond text-sm text-[#8B5E75]">
            © {new Date().getFullYear()} Studianta - Sanctuary of Knowledge. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

