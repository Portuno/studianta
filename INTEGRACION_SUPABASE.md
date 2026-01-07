# Guía de Integración - Studianta con Supabase

## Contexto del Proyecto

**Studianta** es una aplicación web de gestión académica para estudiantes universitarios, construida con React + TypeScript + Vite. La aplicación utiliza **Supabase** como backend completo (autenticación, base de datos PostgreSQL y almacenamiento de archivos).

**IMPORTANTE**: Esta guía explica cómo integrar Studianta a otra plataforma **utilizando las MISMAS bases de datos de Supabase**. No necesitas crear nuevas tablas ni migrar datos - simplemente conectarás tu nueva aplicación a la misma instancia de Supabase que ya está en uso.

---

## Configuración de Supabase

### Variables de Entorno Requeridas

Tu nueva aplicación necesitará estas dos variables de entorno para conectarse a Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**Nota**: Estas son las mismas credenciales que usa la aplicación actual. No necesitas crear un nuevo proyecto de Supabase.

### Configuración del Cliente Supabase

El cliente se inicializa con estas configuraciones específicas:

- **Autenticación**: Persistencia de sesión habilitada, auto-refresh de tokens, detección de sesión en URL
- **Schema**: `public` (por defecto)
- **Headers personalizados**: `x-client-info: studianta-web` (puedes cambiarlo a tu nombre de plataforma)
- **Realtime**: Configurado con límite de 10 eventos por segundo

---

## Estructura de la Base de Datos

### Tablas Principales

La base de datos tiene las siguientes tablas, todas con **Row Level Security (RLS)** habilitado, lo que significa que cada usuario solo puede acceder a sus propios datos:

#### 1. **profiles** (Perfiles de Usuario)
- **Propósito**: Almacena información del perfil del usuario, incluyendo sistema de gamificación
- **Campos clave**:
  - `id` (UUID, FK a `auth.users`)
  - `email` (TEXT)
  - `full_name` (TEXT)
  - `career` (TEXT) - Carrera del estudiante
  - `institution` (TEXT) - Institución educativa
  - `avatar_url` (TEXT) - URL del avatar
  - `tier` (TEXT) - 'Free' o 'Premium'
  - `arcane_level` (TEXT) - Nivel arcano del usuario (ej: "Buscadora de Luz", "Alquimista Clínica")
  - `essence` (INTEGER) - Esencia actual del usuario (moneda del juego)
  - `total_essence_earned` (INTEGER) - Esencia histórica total ganada
  - `created_at`, `updated_at` (TIMESTAMPTZ)

**Características especiales**:
- Hay un trigger que calcula automáticamente el `arcane_level` basado en `total_essence_earned`
- Hay un trigger que crea automáticamente un perfil cuando se registra un nuevo usuario en `auth.users`
- Los niveles arcanos son: "Buscadora de Luz" (<100), "Aprendiz de la Logia" (<300), "Alquimista Clínica" (<600), "Maestra de la Transmutación" (<1000), "Archimaga del Conocimiento" (<2000), "Gran Alquimista" (<5000), "Arquitecta del Saber Eterno" (>=5000)

#### 2. **user_modules** (Módulos del Usuario)
- **Propósito**: Controla qué módulos están activos/desbloqueados para cada usuario
- **Campos clave**:
  - `id` (TEXT) - ID del módulo (ej: 'subjects', 'calendar', 'focus', 'diary', 'finance', 'ai', 'profile', 'security', 'social', 'bazar')
  - `user_id` (UUID, FK a `auth.users`)
  - `is_active` (BOOLEAN) - Si el módulo está activo
  - `unlocked_at` (TIMESTAMPTZ) - Cuándo se desbloqueó
  - `created_at`, `updated_at` (TIMESTAMPTZ)

**Nota**: Los módulos disponibles están definidos en el código frontend (no en la BD). La tabla solo guarda el estado de activación por usuario.

#### 3. **subjects** (Asignaturas/Materias)
- **Propósito**: Almacena las materias que cursa cada estudiante
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`)
  - `name` (TEXT) - Nombre de la materia
  - `career` (TEXT) - Carrera
  - `professor` (TEXT) - Profesor
  - `email` (TEXT) - Email del profesor
  - `phone` (TEXT) - Teléfono del profesor
  - `room` (TEXT) - Aula/sala
  - `aula` (TEXT) - Aula específica donde cursa
  - `status` (TEXT) - 'Cursando', 'Final Pendiente', o 'Aprobada'
  - `absences` (INTEGER) - Ausencias actuales
  - `max_absences` (INTEGER) - Máximo de ausencias permitidas
  - `grade` (NUMERIC) - Nota/calificación
  - `term_start` (DATE) - Inicio del cuatrimestre
  - `term_end` (DATE) - Fin del cuatrimestre
  - `milestones` (JSONB) - Array de hitos (exámenes, entregas, etc.)
  - `schedules` (JSONB) - Array de horarios de clase
  - `notes` (JSONB) - Array de apuntes/notas
  - `materials` (JSONB) - Array de materiales de estudio
  - `created_at`, `updated_at` (TIMESTAMPTZ)

**Estructura de JSONB**:
- `milestones`: `[{id, title, date, time?, type: 'Examen'|'Entrega'|'Parcial'|'Trabajo Práctico'}]`
- `schedules`: `[{id, day, startTime, endTime}]`
- `notes`: `[{id, title, content, date, importantFragments?: string[], isSealed?: boolean}]`
- `materials`: `[{id, name, type: 'Syllabus'|'Apunte'|'Pizarrón'|'PDF'|'Word'|'PPT', content?, fileUrl?, date, category: 'programa'|'contenido'}]`

#### 4. **transactions** (Transacciones Financieras)
- **Propósito**: Registra ingresos y gastos del estudiante
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`)
  - `type` (TEXT) - 'Ingreso' o 'Gasto'
  - `category` (TEXT) - Categoría de la transacción
  - `amount` (NUMERIC) - Monto
  - `date` (DATE) - Fecha de la transacción
  - `description` (TEXT) - Descripción
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### 5. **journal_entries** (Entradas del Diario)
- **Propósito**: Diario personal con estados emocionales
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`)
  - `date` (DATE) - Fecha de la entrada
  - `mood` (TEXT) - 'Radiante', 'Enfocada', 'Equilibrada', 'Agotada', o 'Estresada'
  - `content` (TEXT) - Contenido del diario
  - `photo` (TEXT) - Imagen en base64 (opcional)
  - `is_locked` (BOOLEAN) - Si la entrada está bloqueada con PIN
  - `sentiment` (NUMERIC) - Score de sentimiento entre -1 y 1 (opcional)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### 6. **calendar_events** (Eventos del Calendario)
- **Propósito**: Eventos personalizados del calendario
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`)
  - `title` (TEXT) - Título del evento
  - `description` (TEXT) - Descripción
  - `date` (DATE) - Fecha del evento
  - `time` (TIME) - Hora de inicio (opcional)
  - `end_time` (TIME) - Hora de fin (opcional)
  - `color` (TEXT) - Color del evento (hex)
  - `priority` (TEXT) - 'low' o 'high'
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### 7. **security_config** (Configuración de Seguridad)
- **Propósito**: Almacena PIN de seguridad y preferencias de biometría
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`, UNIQUE)
  - `security_pin` (TEXT) - Hash del PIN (actualmente texto plano, debería usar bcrypt en producción)
  - `biometrics_enabled` (BOOLEAN) - Si la biometría está habilitada
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### 8. **google_calendar_tokens** (Tokens de Google Calendar)
- **Propósito**: Almacena tokens OAuth2 para sincronización con Google Calendar
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`, UNIQUE)
  - `access_token` (TEXT) - Token de acceso OAuth2
  - `refresh_token` (TEXT) - Token de refresco
  - `expires_at` (TIMESTAMPTZ) - Cuándo expira el access_token
  - `calendar_id` (TEXT) - ID del calendario en Google Calendar
  - `created_at`, `updated_at` (TIMESTAMPTZ)

#### 9. **google_calendar_sync_tracking** (Tracking de Sincronización)
- **Propósito**: Rastrea qué eventos de Studianta están sincronizados con Google Calendar
- **Campos clave**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK a `auth.users`)
  - `studianta_event_type` (TEXT) - 'milestone' o 'custom_event'
  - `studianta_event_id` (TEXT) - ID del evento en Studianta
  - `google_calendar_event_id` (TEXT) - ID del evento en Google Calendar
  - `event_date` (DATE) - Fecha del evento
  - `event_time` (TIME) - Hora del evento
  - `event_title` (TEXT) - Título del evento
  - `last_synced_at` (TIMESTAMPTZ) - Última sincronización
  - `created_at`, `updated_at` (TIMESTAMPTZ)
  - **UNIQUE**: `(user_id, studianta_event_type, studianta_event_id)`

### Storage Buckets

#### **avatars** (Bucket de Avatares)
- **Propósito**: Almacena fotos de perfil de usuarios
- **Estructura de paths**: `{user_id}/avatar.{ext}`
- **Políticas**:
  - Los usuarios pueden subir/actualizar/eliminar solo sus propios avatares
  - Los avatares son públicos (cualquiera puede verlos)
- **URL pública**: Se obtiene con `supabase.storage.from('avatars').getPublicUrl(path)`

---

## Autenticación

### Métodos de Autenticación Disponibles

1. **Registro con Email/Password** (`signUp`)
   - Crea usuario en `auth.users`
   - El trigger automáticamente crea un perfil en `profiles` con valores por defecto
   - Retorna datos del usuario y sesión

2. **Inicio de Sesión con Email/Password** (`signIn`)
   - Autentica y retorna sesión

3. **Inicio de Sesión con Google OAuth** (`signInWithGoogle`)
   - Redirige a Google para autenticación
   - Retorna a la aplicación con código de autorización
   - Supabase maneja el intercambio de tokens automáticamente

4. **Cerrar Sesión** (`signOut`)
   - Limpia la sesión local y en Supabase

### Flujo de Autenticación

1. Usuario se registra/inicia sesión
2. Supabase crea/autentica usuario en `auth.users`
3. Si es nuevo usuario, el trigger crea perfil en `profiles`
4. La aplicación obtiene el `user.id` de la sesión
5. Todos los queries a las tablas usan `user_id = auth.uid()` para filtrar datos

---

## Servicios y Funcionalidades

### SupabaseService

El servicio principal (`supabaseService.ts`) contiene métodos para todas las operaciones CRUD:

#### Autenticación
- `signUp(email, password, fullName?)`
- `signIn(email, password)`
- `signInWithGoogle()`
- `signOut()`
- `getCurrentUser()`
- `getSession()`

#### Perfil
- `createProfile(userId, email, fullName?)`
- `getProfile(userId)` → Retorna `UserProfile | null`
- `updateProfile(userId, updates)`
- `updateEssence(userId, essence)`
- `addEssence(userId, amount)` → Incrementa esencia y total_essence_earned
- `calculateArcaneLevel(totalEssence)` → Calcula nivel arcano

#### Asignaturas
- `getSubjects(userId)` → Retorna `Subject[]`
- `createSubject(userId, subject)`
- `updateSubject(userId, subjectId, updates)`
- `deleteSubject(userId, subjectId)`

#### Transacciones
- `getTransactions(userId)` → Retorna `Transaction[]`
- `createTransaction(userId, transaction)`
- `updateTransaction(userId, transactionId, updates)`
- `deleteTransaction(userId, transactionId)`

#### Diario
- `getJournalEntries(userId)` → Retorna `JournalEntry[]`
- `createJournalEntry(userId, entry)`
- `updateJournalEntry(userId, entryId, updates)`
- `deleteJournalEntry(userId, entryId)`

#### Calendario
- `getCalendarEvents(userId)` → Retorna `CustomCalendarEvent[]`
- `createCalendarEvent(userId, event)`
- `updateCalendarEvent(userId, event)`
- `deleteCalendarEvent(userId, eventId)`

#### Módulos
- `getModules(userId)` → Retorna `Module[]` (combina definiciones del código con estado de BD)
- `updateModule(userId, moduleId, updates)`
- `initializeModules(userId, modules)`

#### Storage
- `uploadFile(userId, bucket, file, path, upsert?)`
- `uploadAvatar(userId, file)` → Sube avatar y retorna URL pública
- `getFileUrl(bucket, path)`
- `deleteFile(bucket, path)`

#### Seguridad
- `getSecurityConfig(userId)` → Retorna `SecurityConfig | null`
- `createSecurityConfig(userId, config)`
- `updateSecurityConfig(userId, updates)`
- `verifySecurityPin(userId, pin)` → Retorna boolean

#### Google Calendar Sync
- `getSyncTracking(userId, eventType, eventId)`
- `saveSyncTracking(userId, eventType, eventId, googleEventId, eventDate, eventTime, eventTitle)`
- `deleteSyncTracking(userId, eventType, eventId)`

### Manejo de Errores

El servicio incluye:
- **Reintentos con backoff exponencial** para errores de red
- **Manejo graceful** cuando las tablas no existen (retorna arrays vacíos o null)
- **Detección de errores de red** para mostrar mensajes amigables al usuario

---

## Tipos TypeScript

### Interfaces Principales

```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  career?: string;
  institution?: string;
  avatar_url?: string;
  arcane_level?: string;
  essence: number;
  total_essence_earned?: number;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  career: string;
  professor?: string;
  email?: string;
  phone?: string;
  room?: string;
  aula?: string;
  status: 'Cursando' | 'Final Pendiente' | 'Aprobada';
  absences: number;
  maxAbsences: number;
  grade?: number;
  termStart?: string;
  termEnd?: string;
  milestones: Milestone[];
  schedules: Schedule[];
  notes: Note[];
  materials: StudyMaterial[];
}

interface Transaction {
  id: string;
  type: 'Ingreso' | 'Gasto';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface JournalEntry {
  id: string;
  date: string;
  mood: 'Radiante' | 'Enfocada' | 'Equilibrada' | 'Agotada' | 'Estresada';
  content: string;
  photo?: string;
  isLocked: boolean;
  sentiment?: number;
}

interface CustomCalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  endTime?: string;
  color: string;
  priority: 'low' | 'high';
}

interface Module {
  id: string;
  name: string;
  description: string;
  cost: number;
  active: boolean;
  icon: string;
}
```

---

## Mapeo de Campos Base de Datos ↔ TypeScript

### Convenciones de Nombres

La base de datos usa **snake_case** mientras que TypeScript usa **camelCase**. El servicio hace el mapeo automáticamente:

- `user_id` (BD) ↔ `userId` (TS) - Solo en queries, no en objetos
- `full_name` (BD) ↔ `full_name` (TS) - Se mantiene igual
- `max_absences` (BD) ↔ `maxAbsences` (TS)
- `term_start` (BD) ↔ `termStart` (TS)
- `term_end` (BD) ↔ `termEnd` (TS)
- `is_locked` (BD) ↔ `isLocked` (TS)
- `end_time` (BD) ↔ `endTime` (TS)
- `total_essence_earned` (BD) ↔ `total_essence_earned` (TS) - Se mantiene igual

---

## Funcionalidades Especiales

### Sistema de Gamificación

- **Esencia**: Moneda virtual que los usuarios ganan al usar la aplicación
- **Niveles Arcanos**: Se calculan automáticamente basados en `total_essence_earned`
- **Módulos**: Algunos módulos tienen un "costo" en esencia para desbloquearlos

### Sincronización con Google Calendar

- Los usuarios pueden conectar su cuenta de Google Calendar
- Los tokens OAuth2 se almacenan en `google_calendar_tokens`
- El tracking de sincronización permite saber qué eventos de Studianta están vinculados con eventos de Google Calendar
- Soporta sincronización bidireccional de eventos

### Seguridad del Diario

- Los usuarios pueden configurar un PIN de seguridad
- Las entradas del diario pueden marcarse como "locked" (`is_locked`)
- El PIN se almacena en `security_config` (actualmente como texto plano, debería hashearse)

---

## Consideraciones Importantes

### Row Level Security (RLS)

**TODAS las tablas tienen RLS habilitado**. Esto significa que:

1. Cada usuario solo puede ver/modificar/eliminar sus propios registros
2. Los queries automáticamente filtran por `auth.uid() = user_id`
3. No necesitas agregar filtros manuales de `user_id` en tus queries - Supabase lo hace automáticamente
4. Si intentas acceder a datos de otro usuario, Supabase retornará un error o array vacío

### Triggers Automáticos

- **Creación de perfil**: Cuando se crea un usuario en `auth.users`, automáticamente se crea un perfil en `profiles`
- **Actualización de `arcane_level`**: Cuando cambia `total_essence_earned`, se recalcula automáticamente el `arcane_level`
- **Actualización de `updated_at`**: Todas las tablas tienen triggers que actualizan `updated_at` automáticamente

### Manejo de Datos JSONB

Las tablas `subjects` almacena arrays complejos en campos JSONB:
- `milestones`, `schedules`, `notes`, `materials`

Estos campos se manejan como arrays de objetos en TypeScript, pero se almacenan como JSONB en PostgreSQL. Supabase maneja la serialización/deserialización automáticamente.

### Valores por Defecto

Cuando se crea un nuevo perfil:
- `essence`: 500
- `total_essence_earned`: 0
- `arcane_level`: "Buscadora de Luz"
- `tier`: "Free"

---

## Pasos para Integrar

1. **Instalar dependencias**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Configurar variables de entorno**:
   - Obtener `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto actual
   - Configurarlas en tu nueva aplicación

3. **Crear cliente Supabase**:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       persistSession: true,
       autoRefreshToken: true,
       detectSessionInUrl: true,
     },
   });
   ```

4. **Implementar autenticación**:
   - Usar `supabase.auth.signUp()`, `signIn()`, `signInWithOAuth()`, `signOut()`
   - Escuchar cambios de sesión con `supabase.auth.onAuthStateChange()`

5. **Implementar servicios**:
   - Adaptar los métodos de `SupabaseService` a tu nueva plataforma
   - Usar los mismos nombres de tablas y campos
   - Respetar el mapeo de campos (snake_case ↔ camelCase)

6. **Manejar errores**:
   - Implementar manejo graceful cuando las tablas no existen
   - Mostrar mensajes amigables para errores de red
   - Considerar implementar reintentos con backoff exponencial

---

## Notas Finales

- **No necesitas ejecutar ningún SQL**: Las tablas ya existen y están configuradas
- **No necesitas migrar datos**: Los datos ya están en Supabase
- **Usa las mismas credenciales**: Mismo proyecto de Supabase = mismos datos
- **Respeta RLS**: No intentes bypassear la seguridad - está diseñada para proteger los datos de los usuarios
- **Mantén compatibilidad**: Si cambias la estructura de datos, afectarás la aplicación original
- **Storage**: El bucket `avatars` ya existe y tiene políticas configuradas

---

## Recursos Adicionales

- Documentación de Supabase: https://supabase.com/docs
- Documentación de Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Documentación de Storage: https://supabase.com/docs/guides/storage

