# 🚀 Conversor de PDF Local

Sistema completo para convertir notas y cuadernos a PDF sin depender de servicios externos como CloudConvert.

## ✨ Características

- **100% Local**: No se envían datos a servidores externos
- **Alta Calidad**: PDFs con formato profesional
- **Personalizable**: Múltiples opciones de formato y estilo
- **Rápido**: Conversión instantánea en el navegador
- **Seguro**: Tus datos nunca salen de tu dispositivo

## 🛠️ Instalación

### 1. Eliminar la Edge Function antigua

```bash
rm -rf supabase/functions/convert-to-pdf
```

### 2. Instalar dependencias

```bash
npm install html2pdf.js
```

## 📁 Estructura de archivos

```
├── hooks/
│   ├── usePdfConverter.ts          # Hook principal para conversión
│   └── useNotebookPdfConverter.ts  # Hook especializado para notebooks
├── components/
│   ├── PdfConverterButton.tsx      # Botón reutilizable
│   └── NotebookPdfConverter.tsx    # Componente completo con opciones
├── types/
│   └── pdf.ts                      # Tipos TypeScript
└── examples/
    └── PdfConverterExample.tsx     # Ejemplo de uso
```

## 🚀 Uso básico

### Hook simple para conversión

```tsx
import { usePdfConverter } from './hooks/usePdfConverter';

const MyComponent = () => {
  const { convertToPdf, isConverting } = usePdfConverter();

  const handleConvert = async () => {
    const element = document.getElementById('my-content');
    const result = await convertToPdf(element, {
      filename: 'mi-documento.pdf'
    });
    
    if (result.success) {
      console.log('PDF generado:', result.filename);
    }
  };

  return (
    <button onClick={handleConvert} disabled={isConverting}>
      {isConverting ? 'Convirtiendo...' : 'Convertir a PDF'}
    </button>
  );
};
```

### Hook especializado para notebooks

```tsx
import { useNotebookPdfConverter } from './hooks/useNotebookPdfConverter';

const NotebookComponent = () => {
  const { convertNotebookToPdf, isConverting } = useNotebookPdfConverter();

  const notebook = {
    title: "Mi Cuaderno",
    content: "Contenido del cuaderno...",
    tags: ["estudio", "notas"],
    createdAt: new Date().toISOString()
  };

  const handleConvert = async () => {
    const result = await convertNotebookToPdf(notebook, {
      includeHeader: true,
      includeFooter: true,
      pageSize: 'a4',
      orientation: 'portrait'
    });
  };

  return (
    <button onClick={handleConvert} disabled={isConverting}>
      Convertir Notebook
    </button>
  );
};
```

### Componente completo con opciones

```tsx
import { NotebookPdfConverter } from './components/NotebookPdfConverter';

const App = () => {
  const notebook = {
    title: "Mi Cuaderno de Estudio",
    content: "Contenido...",
    tags: ["estudio", "pdf"],
    createdAt: new Date().toISOString()
  };

  return (
    <NotebookPdfConverter 
      notebook={notebook}
      className="max-w-4xl mx-auto"
    />
  );
};
```

## ⚙️ Opciones de configuración

### Opciones básicas
- `filename`: Nombre del archivo PDF
- `margin`: Márgenes en milímetros
- `pageSize`: Tamaño de página (a4, letter, legal)
- `orientation`: Orientación (portrait, landscape)

### Opciones de estilo
- `fontSize`: Tamaño de fuente (8-20px)
- `lineHeight`: Interlineado (1.0-3.0)
- `includeHeader`: Incluir encabezado con título y metadatos
- `includeFooter`: Incluir pie de página con fecha
- `includePageNumbers`: Incluir números de página

## 🔧 Personalización avanzada

### Modificar estilos del PDF

```tsx
const customOptions = {
  margin: 20,
  fontSize: 14,
  lineHeight: 1.6,
  includeHeader: true,
  includeFooter: true,
  pageSize: 'letter',
  orientation: 'landscape'
};

const result = await convertNotebookToPdf(notebook, customOptions);
```

### Convertir HTML personalizado

```tsx
const { convertHtmlToPdf } = usePdfConverter();

const htmlContent = `
  <div style="font-family: Arial; font-size: 16px;">
    <h1>Mi Título</h1>
    <p>Mi contenido personalizado</p>
  </div>
`;

const result = await convertHtmlToPdf(htmlContent, 'documento.pdf');
```

## 🎯 Casos de uso

### 1. Notas de estudio
- Convertir apuntes a PDF para imprimir
- Crear resúmenes en formato portable
- Generar material de estudio

### 2. Documentos de trabajo
- Convertir reportes a PDF
- Crear presentaciones en formato documento
- Generar documentación técnica

### 3. Contenido web
- Convertir artículos de blog
- Crear PDFs de páginas web
- Generar newsletters

## 🚨 Solución de problemas

### Error: "html2pdf is not defined"
- Verifica que `html2pdf.js` esté instalado
- Importa correctamente: `import html2pdf from 'html2pdf.js'`

### PDF no se genera
- Verifica que el elemento HTML exista en el DOM
- Asegúrate de que el contenido no esté vacío
- Revisa la consola del navegador para errores

### Calidad del PDF baja
- Aumenta el `scale` en las opciones de html2canvas
- Usa fuentes web-safe (Arial, Times New Roman)
- Evita elementos muy complejos o animaciones

## 🔒 Seguridad y privacidad

- **Datos locales**: Tu contenido nunca sale de tu dispositivo
- **Sin tracking**: No se envían datos a servicios externos
- **Sin almacenamiento**: Los PDFs se generan y descargan localmente
- **Código abierto**: Puedes revisar todo el código

## 📱 Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - Libre para uso personal y comercial

---

**¡Disfruta convirtiendo tus notas a PDF de forma local y segura! 🎉** 