# Configuración del Redirect URI en Google Cloud Console

## 🔧 Solución al Error: redirect_uri_mismatch

Si estás recibiendo el error `redirect_uri_mismatch`, significa que la URI de redirección que usa tu aplicación no coincide con las URIs autorizadas en Google Cloud Console.

## ✅ URIs que Debes Registrar

Debes registrar **exactamente** estas URIs en Google Cloud Console:

### Para Producción (Vercel):
```
https://tu-dominio.vercel.app
```

O si tienes un dominio personalizado:
```
https://tu-dominio.com
```

### Para Desarrollo Local:
```
http://localhost:5173
```
(O el puerto que uses en desarrollo)

## 📝 Pasos para Configurar en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en tu **OAuth 2.0 Client ID** (o créalo si no existe)
5. En la sección **Authorized redirect URIs**, haz clic en **+ ADD URI**
6. Agrega las URIs exactas (una por línea):
   - `https://tu-dominio.vercel.app` (sin barra final)
   - `http://localhost:5173` (para desarrollo local)
7. Haz clic en **SAVE**

## ⚠️ Importante

- **NO** incluyas la barra final (`/`) a menos que tu aplicación la requiera
- **NO** incluyas rutas adicionales como `/calendario` o `/callback`
- La URI debe coincidir **exactamente** con lo que usa tu aplicación
- Después de guardar, los cambios pueden tardar unos minutos en aplicarse

## 🔍 Verificar la URI que Usa tu Aplicación

Tu aplicación ahora usa `window.location.origin` como redirect_uri, que es:
- En producción: `https://tu-dominio.vercel.app`
- En desarrollo: `http://localhost:5173`

Esta URI debe coincidir **exactamente** con una de las URIs registradas en Google Cloud Console.

## 🐛 Si el Error Persiste

1. Verifica que la URI en Google Cloud Console coincida **exactamente** (sin espacios, sin barras finales extra)
2. Espera unos minutos después de guardar (Google puede tardar en actualizar)
3. Limpia la caché del navegador y vuelve a intentar
4. Verifica que estés usando el Client ID correcto en Vercel

## 📌 Ejemplo de Configuración Correcta

En Google Cloud Console, tu lista de **Authorized redirect URIs** debería verse así:

```
https://studianta.vercel.app
http://localhost:5173
```

**NO** debería verse así (incorrecto):
```
https://studianta.vercel.app/          ❌ (barra final extra)
https://studianta.vercel.app/calendario  ❌ (ruta adicional)
https://studianta.vercel.app/callback    ❌ (ruta adicional)
```

