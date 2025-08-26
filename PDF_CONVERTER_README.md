# 🚀 Convertidor de PDF Client-Side

Una solución completa y gratuita para convertir archivos a PDF directamente en el navegador, sin necesidad de APIs externas ni servidores.

## ✨ Características

- **🆓 100% Gratuito** - Sin costos de API ni límites de uso
- **🔒 Privacidad Total** - Los archivos nunca salen de tu navegador
- **⚡ Conversión Instantánea** - Sin esperas ni colas
- **📱 Responsive** - Funciona en todos los dispositivos
- **🎨 UI Moderna** - Interfaz intuitiva con TailwindCSS y Shadcn/ui

## 📁 Archivos Creados

```
src/
├── lib/
│   └── pdfConverter.ts          # Lógica principal de conversión
├── components/
│   └── PDFConverter.tsx         # Componente React principal
├── hooks/
│   └── usePDFConverter.ts       # Hook personalizado
├── types/
│   └── pdf.ts                   # Definiciones de tipos TypeScript
├── config/
│   └── pdfConverter.ts          # Configuración y helpers
└── pages/
    └── PDFConverterPage.tsx     # Página de ejemplo
```

## 🚀 Instalación

Las dependencias ya están instaladas en tu proyecto:

```bash
# ✅ Ya tienes estas dependencias:
npm install jspdf docx xlsx file-saver
```

## 📖 Uso Básico

### 1. Componente Simple

```tsx
import { PDFConverterComponent } from './components/PDFConverter';

function App() {
  return (
    <div>
      <h1>Mi Convertidor de PDF</h1>
      <PDFConverterComponent />
    </div>
  );
}
```

### 2. Con Callbacks Personalizados

```tsx
import { PDFConverterComponent } from './components/PDFConverter';
import { ConversionResult } from './lib/pdfConverter';

function App() {
  const handleConversionComplete = (result: ConversionResult) => {
    if (result.success) {
      console.log('✅ Conversión exitosa:', result.fileName);
    } else {
      console.error('❌ Error:', result.error);
    }
  };

  const handleUploadComplete = (url: string) => {
    console.log('📤 Subido a:', url);
  };

  return (
    <PDFConverterComponent
      onConversionComplete={handleConversionComplete}
      onUploadComplete={handleUploadComplete}
    />
  );
}
```

### 3. Usando el Hook Personalizado

```tsx
import { usePDFConverter } from './hooks/usePDFConverter';

function MyComponent() {
  const { 
    isConverting, 
    result, 
    convertFile, 
    downloadPDF 
  } = usePDFConverter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      convertFile(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      
      {isConverting && <p>Convirtiendo...</p>}
      
      {result?.success && (
        <button onClick={downloadPDF}>
          Descargar PDF
        </button>
      )}
    </div>
  );
}
```

## 🔧 Configuración

### Personalizar Tipos de Archivo

```tsx
// En src/config/pdfConverter.ts
export const PDF_CONVERTER_CONFIG = {
  fileTypes: {
    // Agregar nuevo tipo
    custom: {
      type: 'custom' as const,
      extensions: ['custom'],
      description: 'Mi formato personalizado',
      supported: true
    }
  }
};
```

### Cambiar Configuración por Defecto

```tsx
export const PDF_CONVERTER_CONFIG = {
  defaults: {
    pageSize: 'letter',        // 'a4' | 'letter' | 'legal'
    orientation: 'landscape',  // 'portrait' | 'landscape'
    quality: 'high',           // 'low' | 'medium' | 'high'
    autoDownload: false,       // No descargar automáticamente
    maxFileSize: 100 * 1024 * 1024 // 100MB
  }
};
```

## 📋 Formatos Soportados

| Tipo | Extensiones | Descripción |
|------|-------------|-------------|
| **Documentos** | `.doc`, `.docx` | Microsoft Word |
| **Hojas de Cálculo** | `.xls`, `.xlsx`, `.csv` | Excel y CSV |
| **Texto** | `.txt`, `.md` | Texto plano y Markdown |
| **Imágenes** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp` | Formatos de imagen |
| **Web** | `.html`, `.htm` | Páginas HTML |

## 🔌 Integración con Supabase

### Subir PDF Convertido

```tsx
import { PDFConverter } from './lib/pdfConverter';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const handleUpload = async (result: ConversionResult) => {
  if (result.success) {
    const uploadResult = await PDFConverter.uploadToSupabase(
      result,
      supabase,
      'study-materials',           // Bucket de Supabase
      `converted/${result.fileName}` // Ruta del archivo
    );
    
    if (uploadResult.success) {
      console.log('URL del archivo:', uploadResult.url);
    }
  }
};
```

## 🎨 Personalización de UI

### Cambiar Colores y Estilos

```tsx
// El componente usa TailwindCSS, puedes personalizar fácilmente:
<PDFConverterComponent 
  className="bg-blue-50 border-blue-200" 
/>
```

### Personalizar Mensajes

```tsx
// En src/config/pdfConverter.ts
export const PDF_CONVERTER_CONFIG = {
  errorMessages: {
    unsupportedFile: 'Tu archivo no es compatible',
    fileTooLarge: 'El archivo excede el tamaño máximo',
    // ... más mensajes personalizados
  }
};
```

## 🚨 Solución de Problemas

### Error: "Tipo de archivo no soportado"
- Verifica que la extensión esté en la lista de formatos soportados
- Asegúrate de que el archivo no esté corrupto

### Error: "El archivo es demasiado grande"
- Reduce el tamaño del archivo
- Aumenta el límite en `maxFileSize` de la configuración

### Conversión lenta
- Para archivos grandes, considera dividirlos en partes más pequeñas
- Las imágenes de alta resolución pueden tardar más

### Problemas con archivos Word
- El extractor de texto es básico, funciona mejor con archivos simples
- Para documentos complejos, considera convertirlos a texto primero

## 🔄 Migración desde CloudConvert

Si estás migrando desde la función de Supabase que usaba CloudConvert:

1. **Reemplaza la función** `convert-to-pdf` con este componente client-side
2. **Elimina** la dependencia de `CLOUDCONVERT_API_KEY`
3. **Actualiza** las llamadas de tu frontend para usar este componente
4. **Mantén** la lógica de subida a Supabase Storage

## 📱 Compatibilidad

- ✅ **Chrome** 80+
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🤝 Contribuir

Para mejorar el convertidor:

1. Agrega soporte para nuevos formatos en `pdfConverter.ts`
2. Mejora la extracción de texto de documentos Word
3. Optimiza la conversión de imágenes grandes
4. Agrega más opciones de configuración

## 📄 Licencia

Este proyecto es de código abierto y gratuito para uso personal y comercial.

---

## 🎯 Próximos Pasos

1. **Integra el componente** en tu aplicación principal
2. **Personaliza la UI** según tu diseño
3. **Configura la subida** a Supabase Storage
4. **Prueba** con diferentes tipos de archivos
5. **Optimiza** según tus necesidades específicas

¡Tu convertidor de PDF client-side está listo para usar! 🎉 