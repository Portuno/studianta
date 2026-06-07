# Modificaciones al flujo OAuth de Google Calendar

## Contexto

Antes de estos cambios, la carpeta `api/google/oauth/` solo exponía endpoints auxiliares (`config`, `token`, `refresh`, `debug`). El flujo completo de autorización para la **web** vivía en el cliente (`googleCalendarService.ts`):

1. La web redirige directamente a Google desde el navegador.
2. Google devuelve el `code` a `window.location.origin`.
3. `CalendarModule` procesa el callback en el frontend y guarda los tokens en `localStorage`.

Ese flujo web **no se modificó** y sigue funcionando igual.

## Qué se agregó

Se añadieron dos endpoints server-side pensados para la app móvil (deep links) y, opcionalmente, para un flujo web centralizado en el backend:

| Archivo | Ruta | Rol |
|---------|------|-----|
| `_lib.js` | — | Utilidades compartidas (state firmado, cookies, Supabase, intercambio de tokens) |
| `start.js` | `GET /api/google/oauth/start` | Inicia OAuth y redirige a Google |
| `callback.js` | `GET /api/google/oauth/callback` | Recibe la respuesta de Google, guarda tokens en Supabase y redirige |

## Parámetro `return_to`

### Endpoint de inicio (`/api/google/oauth/start`)

Acepta:

| Parámetro | Obligatorio | Descripción |
|-----------|-------------|-------------|
| `return_to` | No | URL de retorno tras completar OAuth (ej. `studianta://oauth/google`) |
| `access_token` | Sí* | JWT de sesión de Supabase del usuario |

\* Obligatorio para que el callback pueda persistir tokens en Supabase.

También se acepta `Authorization: Bearer <access_token>` como alternativa a `access_token` en query.

#### Persistencia temporal de `return_to`

El valor se guarda en **dos lugares** (defensa en profundidad):

1. **Parámetro `state` de OAuth** (firmado con HMAC-SHA256): incluye `rt` (return_to), `uid` (user id) y un nonce con timestamp.
2. **Cookie HttpOnly** `google_oauth_return_to` (10 minutos, `Path=/api/google/oauth`, `SameSite=Lax`).

Cookies adicionales: `google_oauth_state`, `google_oauth_user_id`.

#### Validación de `return_to`

Solo se aceptan URLs con esquema personalizado seguro (p. ej. `studianta://`). Se bloquean esquemas peligrosos (`javascript:`, `data:`, etc.) para evitar open redirects.

### Ejemplo de uso (app móvil)

```
GET /api/google/oauth/start?return_to=studianta://oauth/google&access_token=<SUPABASE_JWT>
```

## Endpoint de callback (`/api/google/oauth/callback`)

Flujo:

1. Valida el `state` firmado y las cookies.
2. Intercambia el `code` por tokens con Google (redirect URI del servidor).
3. Guarda tokens en Supabase (`google_calendar_tokens`).
4. Redirige según el contexto:

| Condición | Destino |
|-----------|---------|
| Existe `return_to` | `studianta://oauth/google?status=ok` (o `status=error&message=...` si falla) |
| No existe `return_to` | Dashboard web: `/?google_calendar=connected` |

Las cookies OAuth se limpian en todas las redirecciones.

## Compatibilidad con el flujo web existente

| Aspecto | Web (sin cambios) | Nuevo flujo server-side |
|---------|-------------------|-------------------------|
| Inicio OAuth | `googleCalendarService.initiateOAuth()` | `GET /api/google/oauth/start` |
| Redirect URI en Google | `https://tu-dominio.com` | `https://tu-dominio.com/api/google/oauth/callback` |
| Callback | Frontend (`CalendarModule`) | Backend (`callback.js`) |
| Almacenamiento tokens | `localStorage` | Supabase (`google_calendar_tokens`) |
| Redirección final | Limpia URL en la misma página | Deep link o dashboard web |

La web **no usa** los nuevos endpoints salvo que lo integres explícitamente. Los endpoints `config`, `token` y `refresh` siguen disponibles para el flujo web actual.

## Configuración requerida

### Variables de entorno (Vercel)

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SUPABASE_URL=...                    # o VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=...       # necesario para guardar tokens
GOOGLE_OAUTH_STATE_SECRET=...         # opcional; si no está, usa GOOGLE_CLIENT_SECRET
WEB_APP_URL=https://tu-dominio.com  # opcional; fallback al host de la request
```

### Google Cloud Console

Agrega esta URI en **Authorized redirect URIs** del OAuth Client:

```
https://tu-dominio.com/api/google/oauth/callback
```

(La URI `https://tu-dominio.com` del flujo web debe seguir registrada.)

### Tabla Supabase

Ejecuta en el SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own google tokens"
  ON public.google_calendar_tokens
  FOR SELECT
  USING (auth.uid() = user_id);
```

El callback escribe con **service role** (bypass RLS). La app móvil puede leer los tokens del usuario autenticado vía RLS.

## Seguridad

- El `state` está firmado y expira a los 10 minutos.
- `return_to` se valida contra esquemas permitidos.
- El `access_token` de Supabase se valida en el servidor antes de iniciar OAuth.
- Las cookies OAuth son `HttpOnly` y `Secure` en producción.

## Resumen de archivos tocados

```
api/google/oauth/_lib.js    ← nuevo
api/google/oauth/start.js   ← nuevo
api/google/oauth/callback.js ← nuevo
api/google/oauth/config.js  ← sin cambios
api/google/oauth/token.js   ← sin cambios
api/google/oauth/refresh.js ← sin cambios
api/google/oauth/debug.js   ← sin cambios
services/googleCalendarService.ts ← sin cambios (flujo web intacto)
```
