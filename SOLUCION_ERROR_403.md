# Solución Rápida: Error 403 - access_denied

## Problema
Estás viendo este error:
```
Error 403: access_denied
studianta no ha completado el proceso de verificación de Google. 
En estos momentos, la app se está probando y solo pueden acceder 
a ella los testers aprobados por el desarrollador.
```

## Solución (2 minutos)

### Paso 1: Añadir tu cuenta como tester

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **OAuth consent screen**
4. Desplázate hasta la sección **"Test users"** o **"Usuarios de prueba"**
5. Haz clic en **"+ ADD USERS"** o **"+ AÑADIR USUARIOS"**
6. Añade tu email de Google: `sarni.lautaro@gmail.com`
7. Haz clic en **"ADD"** o **"AÑADIR"**
8. **Guarda los cambios** (botón "SAVE" o "GUARDAR" en la parte inferior)

### Paso 2: Esperar y reintentar

- Espera 1-2 minutos para que los cambios se apliquen
- Vuelve a Studianta e intenta conectar tu cuenta de Google nuevamente

## ¿Por qué pasa esto?

Cuando creas una nueva aplicación OAuth en Google Cloud Console, por defecto está en **modo de prueba**. Esto significa que solo las cuentas que añadas explícitamente como "testers" pueden usar la aplicación.

## ¿Quiero que cualquiera pueda usar mi app?

Para producción, puedes cambiar el estado a "In production", pero esto requiere:
- Verificación de Google (puede tardar varios días)
- Información adicional sobre tu aplicación
- Para desarrollo personal, es más fácil usar usuarios de prueba

## Verificación visual

Después de añadir tu cuenta, deberías ver algo así en "OAuth consent screen":

```
Test users
✅ sarni.lautaro@gmail.com
```

Si ves tu email en la lista, ya está configurado correctamente.

