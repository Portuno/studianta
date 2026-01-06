# Verificación de Credenciales de Google OAuth

## 🔍 Diagnóstico del Error 401

Si estás recibiendo un error 401 (`invalid_client`), significa que Google está rechazando las credenciales. Esto puede deberse a:

1. Las variables no están configuradas en Vercel
2. Las credenciales no coinciden con Google Cloud Console
3. El Client Secret fue regenerado sin actualizar Vercel
4. Hay espacios extra al copiar/pegar

## ✅ Pasos para Verificar

### 1. Verificar Variables en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Verifica que existan:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. **IMPORTANTE**: Asegúrate de que:
   - NO tengan el prefijo `VITE_`
   - Estén disponibles para **Production**
   - No tengan espacios al inicio o final

### 2. Verificar en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Haz clic en tu OAuth 2.0 Client ID "Studianta"
4. Copia el **Client ID** completo
5. Para el **Client Secret**:
   - Si no lo ves, haz clic en **"+ Add secret"** para crear uno nuevo
   - Copia el secret inmediatamente (solo se muestra una vez)

### 3. Comparar Credenciales

**Client ID en Vercel** debe ser **exactamente igual** al **Client ID en Google Cloud Console**

**Client Secret en Vercel** debe corresponder al **mismo OAuth Client ID** en Google Cloud Console

### 4. Usar Endpoint de Debug (Temporal)

Después de hacer deploy, puedes verificar que las variables estén disponibles:

```
https://www.studianta.com/api/google/oauth/debug
```

Este endpoint te dirá:
- Si las variables están presentes
- La longitud de cada variable
- Un prefijo para verificar que sean correctas

**⚠️ IMPORTANTE**: Elimina o protege este endpoint después de verificar.

### 5. Verificar Logs de Vercel

1. Ve a **Deployments** en Vercel
2. Haz clic en el último deployment
3. Ve a **Functions** → busca `/api/google/oauth/token`
4. Revisa los logs para ver:
   - Si las variables están presentes
   - El error específico de Google

## 🔧 Solución Común

### Si las credenciales no coinciden:

1. **Actualiza en Vercel**:
   - Ve a **Settings** → **Environment Variables**
   - Edita `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
   - Pega las credenciales exactas de Google Cloud Console
   - **Sin espacios extra** al inicio o final
   - Guarda

2. **Redeploy**:
   - Ve a **Deployments**
   - Haz clic en los tres puntos (⋯) del último deployment
   - Selecciona **Redeploy**

3. **Espera unos minutos** y prueba nuevamente

### Si el Client Secret fue regenerado:

Si creaste un nuevo Client Secret en Google Cloud Console:
1. Copia el nuevo secret inmediatamente
2. Actualiza `GOOGLE_CLIENT_SECRET` en Vercel
3. Haz redeploy
4. El secret anterior ya no funcionará

## 📝 Checklist

- [ ] `GOOGLE_CLIENT_ID` está en Vercel (sin `VITE_`)
- [ ] `GOOGLE_CLIENT_SECRET` está en Vercel (sin `VITE_`)
- [ ] Ambas variables están disponibles para Production
- [ ] Client ID en Vercel = Client ID en Google Cloud Console
- [ ] Client Secret en Vercel corresponde al mismo OAuth Client ID
- [ ] No hay espacios extra en las credenciales
- [ ] Se hizo redeploy después de actualizar las variables
- [ ] Se esperaron unos minutos después del redeploy

## 🐛 Si el Error Persiste

1. Verifica los logs de Vercel para ver el error específico
2. Usa el endpoint `/api/google/oauth/debug` para verificar que las variables estén disponibles
3. Asegúrate de que el Client ID y Client Secret correspondan al mismo OAuth Client ID
4. Verifica que no haya caracteres especiales o espacios extra

