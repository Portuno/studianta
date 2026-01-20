<div align="center">
  <img src="favicon.svg" alt="Studianta Logo" width="120" height="120" />
  
  <h1 align="center">✨ Studianta ✨</h1>
  <h2 align="center">Santuario de Conocimiento</h2>
  
  <p align="center">
    <strong>La plataforma integral de gestión académica que transforma tu experiencia estudiantil</strong>
  </p>
</div>

---

## 🌟 Sobre Studianta

**Studianta** es una plataforma web moderna y elegante diseñada específicamente para estudiantes que buscan organizar, optimizar y potenciar su vida académica. Con un diseño sofisticado y una experiencia de usuario excepcional, Studianta combina herramientas esenciales de productividad con tecnología de inteligencia artificial para crear un ecosistema completo de gestión estudiantil.

### 🎨 Identidad Visual

Studianta presenta una paleta de colores cuidadosamente seleccionada que transmite elegancia, calidez y profesionalismo:

- **Rosa Sofisticado** (`#E35B8F`) - Color principal que representa la pasión y dedicación
- **Dorado Clásico** (`#D4AF37`) - Acentos que añaden un toque de excelencia y logro
- **Mauve Elegante** (`#8B5E75`) - Tono intermedio que aporta sofisticación
- **Ciruela Oscuro** (`#4A233E`) - Profundidad y seriedad académica
- **Rosa Claro** (`#F8C8DC`) - Suavidad y accesibilidad
- **Fondo Rosado** (`#FFF0F5`) - Ambiente cálido y acogedor

La interfaz cuenta con un modo nocturno (`#1A1A2E`) para sesiones de estudio prolongadas, manteniendo siempre la elegancia y legibilidad.

---

## 🚀 Características Principales

### 📚 **Asignaturas**
Gestiona todas tus materias académicas de manera intuitiva. Organiza horarios, apuntes, materiales de estudio y mantén un registro completo de tu progreso académico.

### 📅 **Calendario Inteligente**
Planifica tus eventos, exámenes y compromisos académicos. Sincronización automática con Google Calendar para mantenerte siempre organizado.

### ⏱️ **Enfoque (Pomodoro)**
Sesiones de estudio estructuradas con temporizador Pomodoro. Maximiza tu productividad con intervalos de concentración optimizados y rastrea tu tiempo de estudio.

### ✍️ **Diario Personal**
Registra tus estados emocionales, reflexiones y experiencias académicas. Protección opcional con PIN para mantener tu privacidad.

### ⚖️ **Balanza - Gestión Financiera**
Sistema avanzado de gestión financiera personal. Controla tus ingresos, gastos, métodos de pago, categorías y genera reportes detallados de tu economía estudiantil.

### 🧠 **Oráculo - Asistente IA**
Asistente de inteligencia artificial potenciado por Gemini que responde consultas académicas, analiza tu progreso y ofrece insights personalizados para mejorar tu rendimiento.

### 🧮 **Calculadora Científica**
Herramienta completa de cálculos y conversiones. Disponible como módulo principal o widget flotante para acceso rápido desde cualquier parte de la aplicación.

### 🎯 **Generador de Exámenes**
Crea tests personalizados a partir de tus apuntes mediante inteligencia artificial. Prepara exámenes adaptados a tu material de estudio.

### 👤 **Perfil Personalizado**
Gestiona tu información personal y académica. Visualiza estadísticas completas de tu actividad y personaliza tu experiencia.

### 🔒 **Seguridad**
Protección opcional con PIN para módulos sensibles, garantizando la privacidad de tus datos personales.

### 🛍️ **Bazar**
Mercado de artefactos y herramientas adicionales para expandir las capacidades de tu plataforma.

---

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Vite
- **Estilos**: TailwindCSS con diseño responsivo
- **Backend**: Supabase (Base de datos y autenticación)
- **IA**: Google Gemini API
- **Integraciones**: Google Calendar API
- **Deployment**: Vercel

---

## 📋 Requisitos Previos

- **Node.js** 20.x o superior
- **npm** o gestor de paquetes compatible
- **Cuenta de Google** (para autenticación y sincronización de calendario)
- **API Key de Gemini** (para funcionalidades de IA)
- **Cuenta de Stripe** (para suscripciones premium)

---


## 📱 Experiencia Multiplataforma

Studianta está diseñada para funcionar perfectamente en:
- 💻 **Desktop** - Experiencia completa con sidebar y navegación expandida
- 📱 **Tablet** - Diseño adaptativo optimizado para pantallas medianas
- 📱 **Mobile** - Interfaz táctil con navegación inferior y top bar

---

## 🎯 Filosofía de Diseño

Studianta es un **santuario de conocimiento** donde cada estudiante puede:
- Organizar su vida académica de manera integral
- Mantener el equilibrio entre estudio y bienestar personal
- Potenciar su productividad con tecnología inteligente
- Disfrutar de una experiencia visual elegante y motivadora

---

## 🌙 Modo Nocturno

Disfruta de sesiones de estudio prolongadas con nuestro modo nocturno cuidadosamente diseñado, que reduce la fatiga visual mientras mantiene la elegancia y legibilidad de la interfaz.

---

## 📊 Características Avanzadas

- **Drag & Drop**: Reorganiza tus módulos arrastrando y soltando
- **Sincronización en Tiempo Real**: Tus datos se sincronizan automáticamente
- **Almacenamiento de Materiales**: Sube y organiza tus PDFs y documentos de estudio
- **Widgets Flotantes**: Acceso rápido a herramientas esenciales
- **Onboarding Intuitivo**: Guía paso a paso para nuevos usuarios

---

## 💳 Configuración de Stripe (Suscripciones Premium)

Para habilitar las suscripciones premium, necesitas configurar las siguientes variables de entorno. **Nota importante:** Todo el flujo de Stripe se maneja completamente en el backend a través de Supabase Edge Functions, por lo que no se requiere ninguna clave pública en el frontend.

### Variables de Entorno Frontend (.env o .env.local) - Opcional

Si utilizas un archivo `.env` local para desarrollo, puedes configurar:

```
STRIPE_SECRET_KEY=sk_live_...
```

**Nota:** Esta variable es opcional para desarrollo local. La configuración principal se realiza en Supabase Edge Functions Secrets.

### Variables de Entorno Supabase Edge Functions

Configura estas en el dashboard de Supabase bajo Settings > Edge Functions > Secrets:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

**Importante:** Usa las claves de **producción** (`sk_live_...`) para habilitar cobros reales. Las claves de prueba (`sk_test_...`) solo funcionan en modo test.

### Configuración de Webhooks en Stripe

1. Ve a tu Dashboard de Stripe > Developers > Webhooks
2. Asegúrate de estar en **modo Live** (no Test mode)
3. Agrega un nuevo endpoint: `https://[tu-proyecto].supabase.co/functions/v1/stripe-webhook`
4. Selecciona los siguientes eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copia el "Signing secret" (formato: `whsec_...`) y úsalo como `STRIPE_WEBHOOK_SECRET` en Supabase

### Producto de Producción

**Product ID:** `prod_TpNYbWp1N8BZUH`

1. Ve a Products en Stripe Dashboard (modo Live)
2. Busca el producto con ID `prod_TpNYbWp1N8BZUH`
3. Verifica que tiene un precio configurado de 14,99€/mes (recurring)
4. Copia el **Price ID** asociado (formato: `price_...`)
5. Usa este Price ID como `STRIPE_PRICE_ID` en Supabase Edge Functions Secrets

---

<div align="center">
  <p>
    <strong>Producto creado por <a href="https://www.versaproducciones.com" target="_blank" rel="noopener noreferrer">Versa Producciones</a></strong>
  </p>
</div>
