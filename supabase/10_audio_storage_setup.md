# 🎵 Configuración de Almacenamiento de Audio en Supabase Storage

Esta guía te ayudará a configurar Supabase Storage para alojar los archivos MP3 de sonido ambiente que utilizará el componente `SoundChanneler`.

## 📋 Requisitos Previos

- Tener un proyecto en Supabase configurado
- Acceso al Dashboard de Supabase
- Archivos MP3 de sonido ambiente organizados por categorías:
  - **Lluvia** (rain)
  - **Monacal** (monastic)
  - **Chimenea** (fire)

## 🚀 Paso 1: Crear el Bucket de Storage

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket con los siguientes parámetros:
   - **Name**: `ambient-sounds` (o el nombre que prefieras)
   - **Public bucket**: ✅ **Marcar como público** (esto permite acceso directo a las URLs)
   - **File size limit**: 10 MB (ajusta según tus archivos)
   - **Allowed MIME types**: `audio/mpeg`, `audio/mp3` (opcional, para restricción)

5. Haz clic en **"Create bucket"**

## 📁 Paso 2: Organizar la Estructura de Carpetas

Dentro del bucket `ambient-sounds`, crea las siguientes carpetas:

```
ambient-sounds/
├── rain/
│   ├── rain-ambient-01.mp3
│   ├── rain-ambient-02.mp3
│   └── rain-ambient-03.mp3
├── monastic/
│   ├── monastic-ambient-01.mp3
│   ├── monastic-ambient-02.mp3
│   └── monastic-ambient-03.mp3
└── fire/
    ├── fire-ambient-01.mp3
    ├── fire-ambient-02.mp3
    └── fire-ambient-03.mp3
```

### Cómo crear carpetas en Supabase Storage:

1. Dentro del bucket, haz clic en **"Upload file"**
2. Selecciona múltiples archivos de la misma categoría
3. Antes de subir, en el campo de ruta, escribe: `rain/` (o `monastic/`, `fire/`)
4. Sube los archivos
5. Repite para cada categoría

**Alternativa**: Puedes subir los archivos directamente y luego renombrarlos con la ruta completa (ej: `rain/rain-ambient-01.mp3`)

## 🔐 Paso 3: Configurar Políticas de Seguridad (RLS)

Para que los archivos sean accesibles públicamente, necesitas configurar las políticas:

1. Ve a **Storage** → **Policies** (o **Storage** → tu bucket → **Policies**)
2. Haz clic en **"New Policy"**
3. Selecciona **"For full customization"**
4. Configura la política:

### Política de Lectura Pública:

```sql
-- Nombre: Public Read Access
-- Operación: SELECT
-- Definición:
(
  bucket_id = 'ambient-sounds'
)
```

**O usando la interfaz gráfica:**
- **Policy name**: `Public Read Access`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
  ```sql
  bucket_id = 'ambient-sounds'
  ```

5. Haz clic en **"Review"** y luego **"Save policy"**

## 📤 Paso 4: Subir los Archivos MP3

### Opción A: Desde la Interfaz Web

1. Ve a **Storage** → **ambient-sounds**
2. Para cada categoría:
   - Haz clic en **"Upload file"**
   - Arrastra o selecciona los archivos MP3
   - Asegúrate de que la ruta incluya la carpeta (ej: `rain/archivo.mp3`)
   - Haz clic en **"Upload"**

### Opción B: Usando la CLI de Supabase

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular tu proyecto
supabase link --project-ref tu-project-ref

# Subir archivos
supabase storage upload ambient-sounds rain/rain-ambient-01.mp3 ./local-path/rain-ambient-01.mp3
```

## 🔗 Paso 5: Obtener las URLs Públicas

Una vez subidos los archivos, obtén las URLs públicas:

### Formato de URL de Supabase Storage:

```
https://[PROJECT-REF].supabase.co/storage/v1/object/public/[BUCKET-NAME]/[PATH-TO-FILE]
```

**Ejemplo:**
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/ambient-sounds/rain/rain-ambient-01.mp3
```

### Cómo obtener las URLs:

1. Ve a **Storage** → **ambient-sounds**
2. Navega a la carpeta y archivo que necesitas
3. Haz clic derecho en el archivo → **"Copy URL"** (o haz clic en el archivo para ver los detalles)
4. Copia la URL pública

## 🔧 Paso 6: Actualizar el Componente SoundChanneler

Una vez que tengas todas las URLs, actualiza el archivo `components/SoundChanneler.tsx`:

```typescript
const SOUND_PLAYLISTS: Record<SoundCategory, string[]> = {
  rain: [
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/rain/rain-ambient-01.mp3',
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/rain/rain-ambient-02.mp3',
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/rain/rain-ambient-03.mp3',
  ],
  monastic: [
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/monastic/monastic-ambient-01.mp3',
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/monastic/monastic-ambient-02.mp3',
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/monastic/monastic-ambient-03.mp3',
  ],
  fire: [
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/fire/fire-ambient-01.mp3',
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/fire/fire-ambient-02.mp3',
    'https://[TU-PROJECT-REF].supabase.co/storage/v1/object/public/ambient-sounds/fire/fire-ambient-03.mp3',
  ],
  none: [],
};
```

## 🎯 Paso 7: Configuración Opcional - Variables de Entorno

Para mayor flexibilidad, puedes mover las URLs a variables de entorno:

1. Crea un archivo `.env.local` (si no existe):
```env
VITE_SUPABASE_URL=https://[TU-PROJECT-REF].supabase.co
VITE_SUPABASE_STORAGE_BUCKET=ambient-sounds
```

2. Actualiza `SoundChanneler.tsx` para usar estas variables:
```typescript
const getSoundUrl = (category: string, filename: string) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${category}/${filename}`;
};

const SOUND_PLAYLISTS: Record<SoundCategory, string[]> = {
  rain: [
    getSoundUrl('rain', 'rain-ambient-01.mp3'),
    getSoundUrl('rain', 'rain-ambient-02.mp3'),
    getSoundUrl('rain', 'rain-ambient-03.mp3'),
  ],
  // ... resto de categorías
};
```

## ✅ Verificación

Para verificar que todo funciona:

1. Abre la consola del navegador (F12)
2. Selecciona una categoría de sonido en la aplicación
3. Verifica que no haya errores de CORS o 404
4. El audio debería reproducirse correctamente

## 🐛 Solución de Problemas

### Error 403 (Forbidden)
- **Causa**: Las políticas RLS no están configuradas correctamente
- **Solución**: Verifica que la política de lectura pública esté activa

### Error 404 (Not Found)
- **Causa**: La URL del archivo es incorrecta o el archivo no existe
- **Solución**: Verifica la ruta del archivo en Storage y la URL en el código

### CORS Errors
- **Causa**: Supabase Storage debería manejar CORS automáticamente para buckets públicos
- **Solución**: Si persiste, verifica la configuración del bucket en Supabase

### Audio no se reproduce
- **Causa**: El formato del archivo o la configuración de Howler.js
- **Solución**: Asegúrate de que los archivos sean MP3 válidos y que `html5: true` esté configurado en Howler

## 📚 Recursos Adicionales

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS en Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Howler.js Documentation](https://github.com/goldfire/howler.js)

---

**Nota**: Recuerda reemplazar `[TU-PROJECT-REF]` con el ID real de tu proyecto de Supabase. Lo encontrarás en la URL de tu dashboard o en la configuración del proyecto.

