# Mabot Chat Function

Esta función de Supabase Edge Function maneja la comunicación con el API de Mabot, incluyendo el envío automático de materiales de estudio adjuntos.

## Funcionalidades

### 1. Envío Automático de Materiales de Estudio
- **Detección automática**: La función busca automáticamente materiales de estudio no enviados en la base de datos
- **Sin duplicados**: Cada material se envía solo una vez por chat usando la tabla `chat_file_tracking`
- **Filtrado por contexto**: Solo envía materiales relevantes al tema y asignatura actual

### 2. Manejo de Archivos
- **Múltiples formatos**: Soporta PDFs, imágenes, documentos, audio, video y texto
- **Conversión automática**: Convierte archivos a base64 para compatibilidad con Mabot
- **Manejo de errores**: Continúa funcionando incluso si algunos archivos no se pueden procesar

### 3. Seguridad
- **Autenticación**: Requiere credenciales válidas de Mabot
- **RLS**: Respeta las políticas de seguridad de Supabase
- **Acceso controlado**: Solo accede a archivos del usuario autenticado

## Variables de Entorno Requeridas

```bash
# Base
MABOT_BASE_URL=https://api.mabot.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Autenticación con Mabot (elige 1):
# 1) API Key directa
MABOT_API_KEY=your_mabot_api_key
# 2) Token Bearer directo
# MABOT_ACCESS_TOKEN=your_bearer_token
# 3) Login por usuario/contraseña (la función obtiene un token)
# MABOT_USERNAME=your_username
# MABOT_PASSWORD=your_password
```

La función soporta tres modos de autenticación (prioridad):
1. `MABOT_API_KEY` → se envía como cabecera `x-api-key`
2. `MABOT_ACCESS_TOKEN` → se envía como `Authorization: Bearer ...`
3. `MABOT_USERNAME` + `MABOT_PASSWORD` → la función intenta múltiples endpoints comunes (`/auth/login`, `/auth/token`, `/token`) en `application/x-www-form-urlencoded` y `application/json` para obtener `access_token`.

## Estructura de la Request

```typescript
{
  session: {
    userId: string,        // UUID del usuario
    subjectId: string,     // UUID de la asignatura
    topicId?: string,      // UUID del tema (opcional)
    subjectName?: string,  // Nombre de la asignatura
    topic?: string,        // Nombre del tema
    mabotChatId?: string   // ID del chat existente (opcional)
  },
  userText: string,        // Mensaje del usuario
  contextText?: string,    // Texto de contexto adicional
  contextFiles?: Array<{   // Archivos de contexto del frontend
    title: string,
    url: string,
    mime_type: string
  }>
}
```

## Estructura de la Response

```typescript
{
  success: boolean,
  data: any,              // Respuesta de Mabot
  chatId: string,         // ID del chat (nuevo o existente)
  materialsAdded?: number // Cantidad de materiales enviados
}
```

## Flujo de Trabajo

1. **Validación**: Verifica credenciales y parámetros requeridos
2. **Búsqueda de materiales**: Consulta la base de datos por materiales no enviados
3. **Procesamiento de archivos**: Descarga y convierte archivos a base64
4. **Envío a Mabot**: Construye mensajes con contexto y archivos
5. **Tracking**: Marca materiales como enviados para evitar duplicados
6. **Respuesta**: Retorna la respuesta de Mabot con metadatos

## Tablas de Base de Datos Utilizadas

### `study_materials`
- Almacena información de materiales de estudio
- Incluye metadatos de archivos y contenido de texto

### `chat_file_tracking`
- Rastrea qué materiales ya se han enviado a cada chat
- Evita duplicados y permite seguimiento

## Función SQL `get_unsent_study_materials`

```sql
SELECT id, title, type, content, file_path, file_size, mime_type
FROM study_materials
WHERE user_id = $1
  AND subject_id = $2
  AND (topic_id = $3 OR $3 IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM chat_file_tracking
    WHERE chat_id = $4 AND study_material_id = id
  )
ORDER BY created_at DESC
```

## Manejo de Errores

- **Configuración faltante**: Retorna error 500 si faltan variables de entorno
- **Errores de API (401/403)**: Propaga el status upstream y devuelve detalles para debugging
- **Archivos inaccesibles**: Continúa sin el archivo problemático
- **Errores de tracking**: No falla la request principal

## Logs

La función registra información detallada para debugging:
- Cantidad de materiales encontrados
- Archivos procesados exitosamente
- Errores de procesamiento de archivos
- Respuestas de la API de Mabot

## Consideraciones de Rendimiento

- **Límite de archivos**: No hay límite estricto, pero se recomienda < 10 archivos por chat
- **Tamaño de archivos**: Límite de 50MB por archivo configurado en storage
- **Conversión base64**: Aumenta el tamaño del payload en ~33%
- **Caché**: Los archivos ya enviados no se reprocesan en el mismo chat

## Troubleshooting 401 "Not authenticated"

1. Verifica que al menos uno esté definido en Secrets: `MABOT_API_KEY`, `MABOT_ACCESS_TOKEN`, o `MABOT_USERNAME` + `MABOT_PASSWORD`.
2. Si usas Bearer token, confirma que no esté expirado. La función reintenta login solo cuando usa user/pass.
3. Si usas API Key, confirma que la cabecera esperada sea `x-api-key` por parte del backend de Mabot.
4. Haz una llamada directa al endpoint de Mabot con las mismas cabeceras para validar credenciales.
5. Revisa los logs de la Edge Function: ahora se propaga el status y `details` del error upstream. 