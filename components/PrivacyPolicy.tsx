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
        <div className={`rounded-2xl p-6 md:p-8 mb-6 shadow-xl backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
            : 'glass-card'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl border transition-all ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)]' 
                    : 'bg-white/60 border-[#F8C8DC] hover:bg-[#FFF0F5]'
                }`}
                aria-label="Volver"
              >
                <ArrowLeft className={`w-5 h-5 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`} />
              </button>
            )}
            <div className="flex-1">
              <h1 className={`font-cinzel text-3xl md:text-4xl font-black mb-2 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                Política de Privacidad
              </h1>
              <p className={`font-garamond text-sm transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                Última actualización: {currentDate}
              </p>
            </div>
            <div className="hidden md:block">
              {getIcon('security', 'w-12 h-12 text-[#D4AF37]')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`rounded-2xl p-6 md:p-8 shadow-xl space-y-8 backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
            : 'glass-card'
        }`}>
          {/* Introducción */}
          <section>
            <h2 className={`font-cinzel text-2xl font-bold mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              1. Introducción
            </h2>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
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

            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              2.6. Datos de Google Calendar (Opcional)
            </h3>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Si autoriza la integración opcional con Google Calendar, recopilamos:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
              <li>Eventos de calendario (título, descripción, fechas, horas)</li>
              <li>Tokens de acceso y actualización de Google (almacenados de forma segura y encriptada)</li>
              <li>Información necesaria para sincronizar eventos entre Studianta y Google Calendar</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-2">
              <strong>Nota:</strong> Esta integración es completamente opcional. Puede utilizar Studianta 
              sin conectar su cuenta de Google Calendar.
            </p>
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
              <li>Sincronizar eventos académicos con Google Calendar (si ha autorizado la integración)</li>
              <li>Generar análisis y recomendaciones mediante inteligencia artificial</li>
              <li>Gestionar su cuenta y autenticación</li>
              <li>Comunicarnos con usted sobre actualizaciones y cambios en el servicio</li>
              <li>Cumplir con obligaciones legales y proteger nuestros derechos</li>
            </ul>
            <p className="font-garamond text-[#4A233E] leading-relaxed mt-4">
              <strong>Uso de Datos de Google:</strong> Los datos de Google Calendar se utilizan exclusivamente 
              para proporcionar la funcionalidad de sincronización de calendario. No utilizamos estos datos 
              para publicidad, marketing, análisis de comportamiento fuera de la funcionalidad del calendario, 
              ni los compartimos con terceros. Para más detalles, consulte la sección 4.1 sobre Integración 
              con Google Calendar.
            </p>
          </section>

          {/* Integraciones de terceros */}
          <section>
            <h2 className="font-cinzel text-2xl font-bold text-[#4A233E] mb-4">
              4. Integraciones de Terceros
            </h2>
            
            <h3 className="font-cinzel text-xl font-semibold text-[#4A233E] mb-3 mt-4">
              4.1. Integración con Google Calendar
            </h3>
            
            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.1. Descripción de la Integración
            </h4>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Studianta ofrece la posibilidad de integrar su cuenta de Google Calendar de forma opcional. 
              Esta integración le permite sincronizar sus eventos académicos entre nuestra aplicación y su 
              Google Calendar, proporcionando una experiencia unificada de gestión de calendario.
            </p>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              <strong>La integración con Google Calendar es completamente opcional.</strong> Puede utilizar 
              Studianta sin conectar su cuenta de Google Calendar, y puede desconectar la integración en 
              cualquier momento desde la configuración de la aplicación o desde su cuenta de Google.
            </p>

            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.2. Datos de Google Calendar que Accedemos
            </h4>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Cuando autoriza la integración con Google Calendar, solicitamos acceso a los siguientes datos:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4 mb-4">
              <li><strong>Eventos de calendario:</strong> Leemos y creamos eventos en su Google Calendar</li>
              <li><strong>Información de eventos:</strong> Título, descripción, fecha, hora de inicio y fin de los eventos</li>
              <li><strong>Tokens de acceso:</strong> Almacenamos tokens de acceso y actualización de forma segura para mantener la sincronización</li>
            </ul>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              <strong>No accedemos a:</strong> correos electrónicos, contactos, archivos de Google Drive, 
              información de perfil personal más allá de lo necesario para la autenticación, ni ningún otro 
              dato de Google que no esté relacionado con la funcionalidad de calendario.
            </p>

            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.3. Cómo Utilizamos los Datos de Google Calendar
            </h4>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Los datos de Google Calendar que accedemos se utilizan exclusivamente para:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4 mb-4">
              <li><strong>Sincronizar eventos académicos:</strong> Sincronizar eventos creados en Studianta con su Google Calendar</li>
              <li><strong>Crear eventos:</strong> Crear nuevos eventos académicos en su Google Calendar cuando los agrega en Studianta</li>
              <li><strong>Actualizar eventos:</strong> Actualizar eventos existentes cuando realiza modificaciones en Studianta</li>
              <li><strong>Gestionar calendario académico:</strong> Mantener la coherencia entre los eventos en Studianta y su Google Calendar</li>
            </ul>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Estos datos se utilizan únicamente para proporcionar y mejorar la funcionalidad de sincronización 
              de calendario dentro de nuestra aplicación. No utilizamos estos datos para ningún otro propósito, 
              incluyendo publicidad, marketing, análisis de comportamiento fuera de la funcionalidad del calendario, 
              o cualquier otro uso no relacionado con la gestión de eventos académicos.
            </p>

            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.4. Compartir, Transferir y Divulgación de Datos de Google
            </h4>
            <div className="bg-white/60 rounded-xl p-4 border-2 border-[#E35B8F] mb-4">
              <p className="font-garamond text-[#4A233E] leading-relaxed mb-3">
                <strong className="font-cinzel text-lg">IMPORTANTE: No compartimos, transferimos ni divulgamos sus datos de Google Calendar con terceros.</strong>
              </p>
              <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
                Los datos de Google Calendar que accedemos:
              </p>
              <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4">
                <li><strong>No se venden</strong> a terceros</li>
                <li><strong>No se alquilan</strong> a terceros</li>
                <li><strong>No se comparten</strong> con empresas de publicidad, marketing o análisis</li>
                <li><strong>No se transfieren</strong> a otras aplicaciones o servicios</li>
                <li><strong>No se divulgan</strong> a terceros para ningún propósito</li>
              </ul>
            </div>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Los datos de Google Calendar se almacenan y procesan exclusivamente en nuestros servidores 
              (Supabase) y solo se utilizan para las operaciones de sincronización autorizadas. Los tokens 
              de acceso de Google se almacenan de forma segura y encriptada en nuestros servidores y solo 
              se utilizan para realizar las operaciones de sincronización que usted ha autorizado.
            </p>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              La única excepción a esta política sería si estuviéramos legalmente obligados a divulgar 
              información en respuesta a una orden judicial, citación o proceso legal válido, o para proteger 
              nuestros derechos, propiedad o seguridad, o la de nuestros usuarios.
            </p>

            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.5. Almacenamiento y Seguridad de Datos de Google
            </h4>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Los datos de Google Calendar se almacenan de forma segura:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4 mb-4">
              <li><strong>Cifrado en tránsito:</strong> Todas las comunicaciones con la API de Google Calendar utilizan conexiones HTTPS encriptadas</li>
              <li><strong>Cifrado en reposo:</strong> Los tokens de acceso se almacenan encriptados en nuestros servidores</li>
              <li><strong>Almacenamiento seguro:</strong> Los datos se almacenan en Supabase, que cumple con estándares de seguridad internacionales</li>
              <li><strong>Acceso restringido:</strong> Solo nuestra aplicación puede acceder a estos datos, y únicamente para las operaciones autorizadas</li>
            </ul>

            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.6. Retención y Eliminación de Datos de Google
            </h4>
            <p className="font-garamond text-[#4A233E] leading-relaxed mb-2">
              Conservamos los tokens de acceso de Google Calendar mientras la integración esté activa. 
              Cuando usted:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4 mb-4">
              <li>Desconecta la integración desde la aplicación, eliminamos inmediatamente todos los tokens almacenados</li>
              <li>Revoca el acceso desde su cuenta de Google, eliminamos los tokens cuando detectamos que el acceso ha sido revocado</li>
              <li>Elimina su cuenta de Studianta, eliminamos todos los datos asociados, incluyendo los tokens de Google Calendar</li>
            </ul>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Los eventos creados en su Google Calendar permanecerán en su calendario incluso después de 
              desconectar la integración, ya que fueron creados en su cuenta de Google. Studianta no elimina 
              eventos de su Google Calendar cuando se desconecta la integración.
            </p>

            <h4 className="font-cinzel text-lg font-semibold text-[#4A233E] mb-2 mt-4">
              4.1.7. Revocación del Acceso
            </h4>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Puede revocar el acceso a Google Calendar en cualquier momento de las siguientes formas:
            </p>
            <ul className="list-disc list-inside space-y-2 font-garamond text-[#4A233E] ml-4 mb-4">
              <li><strong>Desde Studianta:</strong> Vaya a la configuración del módulo de Calendario y seleccione "Desconectar Google Calendar"</li>
              <li><strong>Desde Google:</strong> Visite <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#E35B8F] hover:text-[#4A233E] font-semibold underline-offset-2 hover:underline transition-colors">myaccount.google.com/permissions</a> y revoque el acceso de Studianta</li>
            </ul>
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
              Una vez que revoque el acceso, Studianta dejará de poder acceder a su Google Calendar y 
              eliminaremos todos los tokens almacenados. La sincronización se detendrá inmediatamente.
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
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
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
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
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
            <p className={`font-garamond leading-relaxed mb-4 transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
            }`}>
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

