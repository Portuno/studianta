# Configuración de Google Calendar Sync

Esta guía te ayudará a configurar la sincronización automática entre Studianta y Google Calendar.

## Requisitos Previos

1. Una cuenta de Google con acceso a Google Calendar
2. Un proyecto en Google Cloud Console

## Pasos de Configuración

### 1. Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Configurar OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Tipo de aplicación: Externa
   - Nombre de la aplicación: Studianta
   - Email de soporte: tu email
   - Guarda y continúa
   
   ⚠️ **IMPORTANTE - Configurar Usuarios de Prueba**:
   - En la pantalla de consentimiento, ve a la sección "Test users" o "Usuarios de prueba"
   - Haz clic en "+ ADD USERS" o "+ AÑADIR USUARIOS"
   - Añade tu cuenta de Google (la que usarás para conectar): `sarni.lautaro@gmail.com`
   - También puedes añadir otras cuentas que quieras que puedan usar la app
   - **Guarda los cambios**
   
   📝 **Nota**: Si no ves la opción de usuarios de prueba, es porque la app ya está en modo de prueba. Ve a "OAuth consent screen" y añade los usuarios allí.

4. Crea el OAuth Client ID:
   - Tipo de aplicación: "Web application"
   - Nombre: "Studianta Web Client"
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desarrollo - puerto por defecto de Vite en este proyecto)
     - `https://tu-dominio.vercel.app` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/` (desarrollo - IMPORTANTE: debe terminar con `/`)
     - `http://localhost:3000` (desarrollo - también añade sin la barra final por si acaso)
     - `https://tu-dominio.vercel.app/` (producción)
     - `https://tu-dominio.vercel.app` (producción - también sin barra)
   
   ⚠️ **IMPORTANTE**: La URI de redirección debe coincidir EXACTAMENTE con la URL donde corre tu aplicación. 
   - Si tu app corre en `http://localhost:3000`, añade ambas variantes (con y sin `/` al final)
   - Si cambias el puerto en `vite.config.ts`, actualiza también las URIs en Google Cloud Console
   
5. Copia el **Client ID** y el **Client Secret**

### 3. Configurar Variables de Entorno

Añade las siguientes variables a tu archivo `.env` o `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
VITE_GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

**⚠️ IMPORTANTE**: 
- **Asegúrate de que el archivo se llame `.env.local` o `.env`** (no `.env.example`)
- Las variables **DEBEN empezar con `VITE_`** para que Vite las exponga al frontend
- **Reinicia el servidor de desarrollo** después de añadir las variables (`npm run dev`)
- En producción, el `VITE_GOOGLE_CLIENT_SECRET` NO debe estar en el frontend por razones de seguridad.
- Para producción, deberás crear un endpoint backend (Supabase Edge Function o servidor propio) que maneje el intercambio de código por token.

**Ejemplo de archivo `.env.local`:**
```env
VITE_GOOGLE_CLIENT_ID=77705900774-70hjqqgmrsmokla5ecpt2gghmi4ppbou.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-tu_secret_aqui
```

### 4. Configurar Backend (Opcional pero Recomendado)

Para mayor seguridad, crea un endpoint backend que maneje el intercambio de código por token:

**Opción A: Supabase Edge Function**

1. Crea una Edge Function en Supabase:
```typescript
// supabase/functions/google-oauth-token/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { code, redirect_uri } = await req.json()
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      redirect_uri,
      grant_type: 'authorization_code',
    }),
  })
  
  return new Response(JSON.stringify(await response.json()), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

2. Configura las variables de entorno en Supabase:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

3. Actualiza `googleCalendarService.ts` para usar:
```typescript
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://tu-proyecto.supabase.co/functions/v1';
```

**Opción B: Servidor Propio**

Crea un endpoint similar en tu servidor backend.

### 5. Ejecutar Script SQL en Supabase

Ejecuta el script `supabase/13_google_calendar_tokens.sql` en tu base de datos Supabase para crear la tabla que almacenará los tokens.

## Uso

1. Ve al módulo de Calendario
2. Haz clic en el botón de "Conectividad" (ícono de descarga)
3. Haz clic en "Vincular" en la sección "Puente con Google"
4. Autoriza Studianta en la ventana de Google
5. Una vez conectado, haz clic en "Sincronizar" para exportar tus eventos

## Características

- ✅ Crea automáticamente un calendario llamado "Studianta - Academia" en Google Calendar
- ✅ Sincroniza exámenes y entregas de todas tus materias
- ✅ Formatea eventos con el prefijo `[Studianta]`
- ✅ Incluye recordatorios automáticos (1 día antes y 1 hora antes)
- ✅ Exporta también a formato .ics para importar en otros calendarios

## Solución de Problemas

### Error: "VITE_GOOGLE_CLIENT_ID no está configurado"
- Verifica que las variables de entorno estén correctamente configuradas en `.env` o `.env.local`
- Reinicia el servidor de desarrollo después de añadir las variables
- Verifica que las variables empiecen con `VITE_` para que Vite las exponga al frontend
- Asegúrate de que el archivo esté en la raíz del proyecto (mismo nivel que `package.json`)

### Error 401: "Unauthorized" o "invalid_client"

Este error significa que el `VITE_GOOGLE_CLIENT_SECRET` no está configurado o es incorrecto.

**Solución:**

1. **Verifica que tengas el archivo `.env.local`** en la raíz del proyecto:
   ```
   studianta/
   ├── .env.local  ← Debe estar aquí
   ├── package.json
   └── ...
   ```

2. **Añade las variables correctamente:**
   ```env
   VITE_GOOGLE_CLIENT_ID=tu_client_id_completo
   VITE_GOOGLE_CLIENT_SECRET=tu_client_secret_completo
   ```

3. **Verifica que:**
   - Las variables empiecen con `VITE_`
   - No haya espacios alrededor del `=`
   - El Client ID y Secret correspondan al mismo OAuth Client en Google Cloud Console
   - No haya comillas alrededor de los valores (a menos que sean parte del valor)

4. **Reinicia el servidor:**
   - Detén el servidor (Ctrl+C)
   - Ejecuta `npm run dev` nuevamente

5. **Si sigues teniendo problemas:**
   - Verifica en Google Cloud Console que el Client ID y Secret sean correctos
   - Asegúrate de copiar el Client Secret completo (puede ser largo)
   - Si regeneraste el Client Secret, actualiza la variable en `.env.local`

### Error 403: "access_denied" - "La app se está probando y solo pueden acceder testers aprobados"

Este error significa que tu aplicación OAuth está en modo de prueba. Sigue estos pasos:

1. **Añadir tu cuenta como tester**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > **OAuth consent screen**
   - Desplázate hasta la sección **"Test users"** o **"Usuarios de prueba"**
   - Haz clic en **"+ ADD USERS"** o **"+ AÑADIR USUARIOS"**
   - Añade tu email de Google: `sarni.lautaro@gmail.com`
   - Haz clic en **"ADD"** o **"AÑADIR"**
   - **Guarda los cambios**

2. **Espera unos minutos** y vuelve a intentar conectar

3. **Si quieres que cualquiera pueda usar la app** (solo para producción):
   - En "OAuth consent screen", cambia el "Publishing status" a "In production"
   - ⚠️ **Nota**: Esto requiere verificación de Google y puede tardar varios días
   - Para desarrollo, es mejor usar usuarios de prueba

### Error: "redirect_uri_mismatch" ⚠️

Este es el error más común. Sigue estos pasos:

1. **Verifica el puerto de tu aplicación**:
   - Abre `vite.config.ts` y busca `port: 3000` (o el puerto que estés usando)
   - O simplemente mira la URL en tu navegador cuando ejecutas `npm run dev`

2. **Añade la URI exacta en Google Cloud Console**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > Credentials
   - Haz clic en tu OAuth 2.0 Client ID
   - En "Authorized redirect URIs", añade:
     - `http://localhost:3000/` (con barra final)
     - `http://localhost:3000` (sin barra final)
   - **Guarda los cambios** (puede tardar unos minutos en aplicarse)

3. **Verifica que coincidan exactamente**:
   - La URI debe ser EXACTAMENTE igual (incluyendo http/https, puerto, y barra final)
   - No debe haber espacios extra
   - Debe coincidir con la URL que ves en tu navegador

4. **Si sigues teniendo problemas**:
   - Abre la consola del navegador (F12) y busca el mensaje `[Google Calendar] Redirect URI:`
   - Copia esa URI exacta y añádela en Google Cloud Console
   - Espera 2-3 minutos después de guardar (Google puede tardar en actualizar)
   - Intenta nuevamente

### Error al refrescar token
- El refresh token solo se obtiene la primera vez que el usuario autoriza
- Si el usuario revoca los permisos, deberá volver a autorizar

## Notas de Seguridad

- Los tokens se almacenan en localStorage (cliente) y en Supabase (servidor)
- En producción, considera usar Supabase Vault para almacenar tokens de forma encriptada
- Los tokens de acceso expiran después de 1 hora y se refrescan automáticamente

