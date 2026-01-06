# 🔧 Solución: Error 403 al Sincronizar con Google Calendar

## 🚨 Error Actual
```
GET https://www.googleapis.com/calendar/v3/users/me/calendarList 403 (Forbidden)
POST https://www.googleapis.com/calendar/v3/calendars 403 (Forbidden)
Error al sincronizar: Error al crear calendario: Request had insufficient authentication scopes.
```

## 🔍 Causas Posibles

El error 403 (Forbidden) puede deberse a:

1. **Token con scope insuficiente**: El token actual tiene el scope `calendar.events` (solo eventos) pero necesita `calendar` completo (calendarios + eventos)
2. **API de Google Calendar no habilitada**: La API no está habilitada en Google Cloud Console
3. **Token expirado o inválido**: El token necesita ser refrescado o reautorizado

## ✅ Solución Paso a Paso

### Paso 1: Verificar que la API esté Habilitada

1. **Ve a Google Cloud Console**
   - Abre [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Selecciona tu proyecto

2. **Habilita la API de Google Calendar**
   - Ve a **APIs & Services** → **Library**
   - Busca "Google Calendar API"
   - Haz clic en **Enable** (si no está habilitada)

### Paso 2: Desconectar y Reconectar (IMPORTANTE)

El token actual tiene el scope antiguo (`calendar.events`). Necesitas obtener un nuevo token con el scope completo (`calendar`):

1. **En la aplicación Studianta:**
   - Ve al módulo de Calendario
   - Haz clic en **Desconectar** (si está conectado)
   - Espera a que se limpie la conexión

2. **Vuelve a Conectar:**
   - Haz clic en **Conectar con Google Calendar**
   - Se abrirá la ventana de autorización de Google
   - **IMPORTANTE**: Asegúrate de aceptar todos los permisos
   - Verifica que se soliciten permisos para "Ver, editar, compartir y eliminar permanentemente todos los calendarios"

3. **Intenta Sincronizar Nuevamente:**
   - Después de conectar, intenta sincronizar los eventos
   - Debería funcionar correctamente

### Paso 3: Verificar los Permisos en Google Cloud Console

1. **Verifica el OAuth Consent Screen:**
   - Ve a **APIs & Services** → **OAuth consent screen**
   - Asegúrate de que el scope `https://www.googleapis.com/auth/calendar` esté en la lista de scopes

2. **Verifica las Credenciales:**
   - Ve a **APIs & Services** → **Credentials**
   - Verifica que tu OAuth 2.0 Client ID esté configurado correctamente

## 🔄 Si el Error Persiste

### Opción 1: Limpiar Tokens Manualmente

1. **Abre la Consola del Navegador** (F12)
2. **Ejecuta en la consola:**
```javascript
// Limpiar todos los tokens de Google Calendar
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('google_calendar_')) {
    localStorage.removeItem(key);
    console.log('Token eliminado:', key);
  }
});
```

3. **Recarga la página** y vuelve a conectar

### Opción 2: Verificar el Scope en el Código

El scope correcto debe ser:
```typescript
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar';
```

**NO** debe ser:
```typescript
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events'; // ❌ Insuficiente
```

## 📋 Checklist de Verificación

Antes de reportar el error, verifica:

- [ ] La API de Google Calendar está habilitada en Google Cloud Console
- [ ] Desconectaste y volviste a conectar tu cuenta de Google Calendar
- [ ] Aceptaste todos los permisos en la ventana de autorización
- [ ] El scope en el código es `calendar` completo (no solo `calendar.events`)
- [ ] Limpiaste los tokens antiguos del localStorage
- [ ] Recargaste la página después de limpiar los tokens

## 🐛 Diagnóstico Adicional

### Verificar el Scope del Token Actual

1. **Abre la Consola del Navegador** (F12)
2. **Ejecuta:**
```javascript
// Ver tokens guardados
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('google_calendar_')) {
    const token = JSON.parse(localStorage.getItem(key));
    console.log('Token encontrado:', key);
    console.log('Access token (primeros 20 caracteres):', token.access_token?.substring(0, 20));
  }
});
```

### Verificar la Respuesta de Google

Si el error persiste, revisa los logs de la consola para ver el mensaje exacto de Google. Los errores comunes son:

- `insufficient authentication scopes` → Token con scope insuficiente
- `Forbidden` → API no habilitada o permisos insuficientes
- `Access denied` → OAuth consent screen no configurado correctamente

## 📝 Notas Importantes

- ⚠️ **El scope `calendar.events` solo permite gestionar eventos**, no crear calendarios
- ⚠️ **El scope `calendar` completo permite crear calendarios y gestionar eventos**
- ⚠️ **Si cambias el scope, debes desconectar y volver a conectar** para obtener un nuevo token
- ⚠️ **Los tokens antiguos con scope limitado no funcionarán** para crear calendarios

## 🔗 Referencias

- [Google Calendar API Scopes](https://developers.google.com/calendar/api/guides/auth)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes#calendar)

