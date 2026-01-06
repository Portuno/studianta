# 🔧 Solución Rápida: Error 401 en Google OAuth

## 🚨 Error Actual
```
Error de autenticación: Client ID o Client Secret inválidos.
/api/google/oauth/token:1 Failed to load resource: the server responded with a status of 401
```

### ⚠️ Error Común: Caracteres Extra en Client Secret

Si ves en los logs de Vercel:
```
Client Secret prefix: -GOCSPX-fM...
```

**El problema**: Hay un guion `-` o espacio extra al inicio del Client Secret en Vercel.

**La solución**: El Client Secret debe comenzar directamente con `GOCSPX-` sin caracteres antes.

## ✅ Solución Paso a Paso

### Paso 1: Verificar Variables en Vercel

1. **Ve a Vercel Dashboard**
   - Abre [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Selecciona tu proyecto **studianta**

2. **Configura las Variables de Entorno**
   - Ve a **Settings** → **Environment Variables**
   - Verifica que existan estas dos variables:
     - `GOOGLE_CLIENT_ID` (sin prefijo `VITE_`)
     - `GOOGLE_CLIENT_SECRET` (sin prefijo `VITE_`)

3. **Verifica la Configuración**
   - ✅ Ambas variables deben estar disponibles para **Production**
   - ✅ NO deben tener el prefijo `VITE_`
   - ✅ NO deben tener espacios al inicio o final

### Paso 2: Obtener Credenciales de Google Cloud Console

1. **Ve a Google Cloud Console**
   - Abre [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Selecciona tu proyecto

2. **Navega a Credenciales**
   - Ve a **APIs & Services** → **Credentials**
   - Busca tu OAuth 2.0 Client ID (nombre: "Studianta" o similar)

3. **Copia las Credenciales**
   - **Client ID**: Copia el valor completo (formato: `número-string.apps.googleusercontent.com`)
   - **Client Secret**: 
     - Si no lo ves, haz clic en el Client ID para editarlo
     - Si no hay secret, haz clic en **"+ Add secret"** para crear uno nuevo
     - ⚠️ **IMPORTANTE**: Copia el secret inmediatamente (solo se muestra una vez)
     - Formato esperado: `GOCSPX-...`

### Paso 3: Actualizar Variables en Vercel

1. **Edita las Variables**
   - En Vercel, edita `GOOGLE_CLIENT_ID`
   - Pega el Client ID exacto de Google Cloud Console
   - **Sin espacios** al inicio o final
   - Guarda

2. **Edita el Client Secret**
   - Edita `GOOGLE_CLIENT_SECRET`
   - Pega el Client Secret exacto de Google Cloud Console
   - **IMPORTANTE**: 
     - Debe comenzar directamente con `GOCSPX-` (sin guiones, espacios u otros caracteres antes)
     - **Sin espacios** al inicio o final
     - **Sin guiones** al inicio o final
   - Ejemplo correcto: `GOCSPX-abc123def456...`
   - Ejemplo incorrecto: `-GOCSPX-abc123def456...` (tiene guion extra al inicio)
   - Guarda

3. **Verifica que Coincidan**
   - El Client ID en Vercel debe ser **idéntico** al de Google Cloud Console
   - El Client Secret en Vercel debe corresponder al **mismo OAuth Client ID**

### Paso 4: Redeploy

1. **Haz Redeploy**
   - Ve a **Deployments** en Vercel
   - Haz clic en los tres puntos (⋯) del último deployment
   - Selecciona **Redeploy**
   - Espera a que termine el deployment

2. **Espera unos minutos**
   - Las variables de entorno pueden tardar unos minutos en propagarse
   - Espera 2-3 minutos después del redeploy

### Paso 5: Verificar con Endpoint de Debug

Después del redeploy, visita este endpoint para verificar:

```
https://tu-dominio.vercel.app/api/google/oauth/debug
```

Deberías ver:
```json
{
  "hasClientId": true,
  "clientIdValid": true,
  "hasClientSecret": true,
  "clientSecretValid": true,
  "allValid": true,
  "message": "✅ Credenciales configuradas correctamente"
}
```

Si ves errores, el endpoint te indicará qué está mal:
- ❌ Variables faltantes
- ⚠️ Formato inválido
- ⚠️ Espacios extra

## 🔍 Verificación Adicional

### Verificar Logs de Vercel

1. Ve a **Deployments** → Último deployment
2. Haz clic en **Functions** → Busca `/api/google/oauth/token`
3. Revisa los logs para ver:
   - Si las variables están presentes
   - El error específico de Google
   - El prefijo del Client ID (para verificar que sea correcto)

### Verificar en Google Cloud Console

1. **Authorized Redirect URIs**
   - Ve a **APIs & Services** → **Credentials** → Tu OAuth Client ID
   - Verifica que tu dominio esté en **Authorized redirect URIs**
   - Debe incluir: `https://tu-dominio.vercel.app` (con y sin barra final)

## 📋 Checklist Final

Antes de probar nuevamente, verifica:

- [ ] `GOOGLE_CLIENT_ID` está en Vercel (sin `VITE_`)
- [ ] `GOOGLE_CLIENT_SECRET` está en Vercel (sin `VITE_`)
- [ ] Ambas variables están disponibles para **Production**
- [ ] Client ID en Vercel = Client ID en Google Cloud Console (idéntico)
- [ ] Client Secret en Vercel corresponde al mismo OAuth Client ID
- [ ] No hay espacios extra en las credenciales
- [ ] Se hizo redeploy después de actualizar las variables
- [ ] Se esperaron 2-3 minutos después del redeploy
- [ ] El endpoint `/api/google/oauth/debug` muestra `allValid: true`

## 🐛 Si el Error Persiste

1. **Verifica los Logs de Vercel**
   - Revisa los logs del endpoint `/api/google/oauth/token`
   - Busca mensajes de error específicos

2. **Usa el Endpoint de Debug**
   - Visita `/api/google/oauth/debug`
   - Revisa qué problemas detecta

3. **Verifica el Formato**
   - Client ID debe ser: `número-string.apps.googleusercontent.com`
   - Client Secret debe comenzar con: `GOCSPX-`

4. **Regenera el Client Secret**
   - Si es necesario, crea un nuevo Client Secret en Google Cloud Console
   - Actualiza `GOOGLE_CLIENT_SECRET` en Vercel inmediatamente
   - Haz redeploy

5. **Verifica que las Credenciales Coincidan**
   - Asegúrate de que el Client ID y Client Secret correspondan al **mismo OAuth Client ID** en Google Cloud Console

## 📝 Notas Importantes

- ⚠️ **NUNCA** uses el prefijo `VITE_` para estas variables (se expondrían al frontend)
- ⚠️ El Client Secret solo se muestra una vez al crearlo
- ⚠️ Si regeneras el Client Secret, debes actualizarlo en Vercel inmediatamente
- ⚠️ Las variables deben estar disponibles para **Production** en Vercel
- ⚠️ No debe haber espacios al inicio o final de las credenciales

