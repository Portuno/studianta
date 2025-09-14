import { FileTypeInfo } from '../types/pdf';

export const PDF_CONVERTER_CONFIG = {
  // Configuración por defecto
  defaults: {
    pageSize: 'a4' as const,
    orientation: 'portrait' as const,
    quality: 'medium' as const,
    autoDownload: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },

  // Mapeo de tipos de archivo
  fileTypes: {
    text: {
      type: 'text' as const,
      extensions: ['txt', 'md'],
      description: 'Archivos de texto plano',
      supported: true
    },
    word: {
      type: 'word' as const,
      extensions: ['doc', 'docx'],
      description: 'Documentos de Microsoft Word',
      supported: true
    },
    excel: {
      type: 'excel' as const,
      extensions: ['xls', 'xlsx', 'csv'],
      description: 'Hojas de cálculo',
      supported: true
    },
    image: {
      type: 'image' as const,
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      description: 'Imágenes',
      supported: true
    },
    html: {
      type: 'html' as const,
      extensions: ['html', 'htm'],
      description: 'Páginas web',
      supported: true
    },
    pdf: {
      type: 'unknown' as const,
      extensions: ['pdf'],
      description: 'Archivos PDF (ya convertidos)',
      supported: false
    }
  } satisfies Record<string, FileTypeInfo>,

  // Configuración de calidad de imagen
  imageQuality: {
    low: 0.6,
    medium: 0.8,
    high: 0.95
  },

  // Configuración de páginas
  pageSettings: {
    a4: { width: 595, height: 842 },
    letter: { width: 612, height: 792 },
    legal: { width: 612, height: 1008 }
  },

  // Mensajes de error
  errorMessages: {
    unsupportedFile: 'Tipo de archivo no soportado',
    fileTooLarge: 'El archivo es demasiado grande',
    conversionFailed: 'Error en la conversión',
    uploadFailed: 'Error al subir el archivo',
    invalidFile: 'Archivo inválido o corrupto'
  },

  // Configuración de UI
  ui: {
    maxFileNameLength: 50,
    supportedFormatsText: [
      'Documentos: .doc, .docx',
      'Hojas de cálculo: .xls, .xlsx, .csv',
      'Texto: .txt, .md',
      'Imágenes: .jpg, .jpeg, .png, .gif, .bmp, .webp',
      'Web: .html, .htm'
    ]
  }
};

// Función helper para obtener información del tipo de archivo
export const getFileTypeInfo = (fileName: string): FileTypeInfo => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  for (const typeInfo of Object.values(PDF_CONVERTER_CONFIG.fileTypes)) {
    if (typeInfo.extensions.includes(ext)) {
      return typeInfo;
    }
  }
  
  return {
    type: 'unknown',
    extensions: [ext],
    description: 'Tipo de archivo desconocido',
    supported: false
  };
};

// Función helper para validar el tamaño del archivo
export const validateFileSize = (file: File): boolean => {
  return file.size <= PDF_CONVERTER_CONFIG.defaults.maxFileSize;
};

// Función helper para obtener el nombre del archivo truncado
export const getTruncatedFileName = (fileName: string): string => {
  if (fileName.length <= PDF_CONVERTER_CONFIG.ui.maxFileNameLength) {
    return fileName;
  }
  
  const ext = fileName.split('.').pop() || '';
  const name = fileName.substring(0, fileName.lastIndexOf('.'));
  const maxLength = PDF_CONVERTER_CONFIG.ui.maxFileNameLength - ext.length - 4; // -4 for "..."
  
  return `${name.substring(0, maxLength)}...${ext}`;
}; 