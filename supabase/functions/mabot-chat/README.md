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
MABOT_BASE_URL=https://api.mabot.com
MABOT_USERNAME=your_username
MABOT_PASSWORD=your_password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

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
  materialsAdded: number  // Cantidad de materiales enviados
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
- **Archivos inaccesibles**: Continúa sin el archivo problemático
- **Errores de API**: Retorna detalles del error de Mabot
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