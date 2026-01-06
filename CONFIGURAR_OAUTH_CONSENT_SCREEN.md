# 🔧 Configurar OAuth Consent Screen para Google Calendar

## 🚨 Problema

Si en la pantalla de consentimiento de Google solo aparece:
- "Ver y editar eventos en tus calendarios" (scope `calendar.events`)

Pero necesitas:
- "Ver, editar, compartir y eliminar permanentemente todos los calendarios" (scope `calendar` completo)

## ✅ Solución: Configurar el OAuth Consent Screen

### Paso 1: Acceder al OAuth Consent Screen

1. **Ve a Google Cloud Console**
   - Abre [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Selecciona tu proyecto

2. **Navega al OAuth Consent Screen**
   - Ve a **APIs & Services** → **OAuth consent screen**
   - Si es la primera vez, completa la información básica de la app

### Paso 2: Agregar el Scope Completo

1. **En la sección "Scopes"**
   - Haz clic en **"Add or Remove Scopes"** o **"EDIT APP"**

2. **Buscar y Agregar el Scope**
   - En el buscador, escribe: `calendar`
   - Selecciona: **`https://www.googleapis.com/auth/calendar`**
   - Descripción: "Ver, editar, compartir y eliminar permanentemente todos los calendarios"
   - **IMPORTANTE**: NO selecciones `calendar.events` (solo eventos)

3. **Guardar los Cambios**
   - Haz clic en **"UPDATE"** o **"SAVE AND CONTINUE"**

### Paso 3: Verificar los Scopes

Después de guardar, en la lista de scopes debes ver:

✅ **Correcto:**
- `https://www.googleapis.com/auth/calendar`
  - Descripción: "Ver, editar, compartir y eliminar permanentemente todos los calendarios"

❌ **Incorrecto (solo esto):**
- `https://www.googleapis.com/auth/calendar.events`
  - Descripción: "Ver y editar eventos en tus calendarios"

### Paso 4: Configurar Usuarios de Prueba (si estás en modo Testing)

Si tu app está en modo "Testing":

1. **Agrega Usuarios de Prueba**
   - En la sección **"Test users"**, haz clic en **"ADD USERS"**
   - Agrega tu email: `lautaro.sarni@gmail.com`
   - Guarda

2. **O Cambia a Producción**
   - Si quieres que todos los usuarios puedan usar la app
   - Cambia el modo a **"Production"**
   - ⚠️ Esto requiere verificación de Google si usas scopes sensibles

### Paso 5: Desconectar y Reconectar

Después de configurar el scope:

1. **En la aplicación Studianta:**
   - Desconecta tu cuenta de Google Calendar
   - Vuelve a conectar
   - Ahora deberías ver el permiso completo en la pantalla de consentimiento

2. **Verificar en la Pantalla de Consentimiento:**
   - Debe aparecer: "Ver, editar, compartir y eliminar permanentemente todos los calendarios"
   - NO solo: "Ver y editar eventos en tus calendarios"

## 📋 Checklist

- [ ] Accedí a OAuth consent screen en Google Cloud Console
- [ ] Agregué el scope `https://www.googleapis.com/auth/calendar` completo
- [ ] NO solo tengo `calendar.events`
- [ ] Guardé los cambios
- [ ] Si estoy en modo Testing, agregué mi email como usuario de prueba
- [ ] Desconecté y volví a conectar en la aplicación
- [ ] La pantalla de consentimiento muestra el permiso completo

## 🐛 Si el Scope No Aparece

1. **Verifica que la API esté habilitada:**
   - Ve a **APIs & Services** → **Library**
   - Busca "Google Calendar API"
   - Asegúrate de que esté **Enabled**

2. **Verifica el Tipo de App:**
   - Si es "Internal" (solo para tu organización), algunos scopes pueden no estar disponibles
   - Considera cambiar a "External" si es necesario

3. **Espera unos minutos:**
   - Los cambios en OAuth consent screen pueden tardar unos minutos en propagarse
   - Intenta nuevamente después de 2-3 minutos

## 📝 Notas Importantes

- ⚠️ El scope `calendar.events` solo permite gestionar eventos, NO crear calendarios
- ⚠️ El scope `calendar` completo permite crear calendarios Y gestionar eventos
- ⚠️ Si cambias los scopes, los usuarios deben volver a autorizar
- ⚠️ En modo Testing, solo los usuarios agregados pueden usar la app

## 🔗 Referencias

- [OAuth Consent Screen Documentation](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)
- [Google Calendar API Scopes](https://developers.google.com/calendar/api/guides/auth)

