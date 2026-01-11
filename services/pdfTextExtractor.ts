/**
 * Servicio para extraer texto de PDFs almacenados en Supabase Storage
 * Usa pdfjs-dist para procesamiento en el cliente
 */

// Importación dinámica de pdfjs-dist
let pdfjsLib: any = null;

const loadPdfJs = async () => {
  if (!pdfjsLib) {
    try {
      // Importar pdfjs-dist dinámicamente
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      
      // Configurar worker (necesario para pdfjs-dist)
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
      
      return pdfjsLib;
    } catch (error) {
      console.error('Error loading pdfjs-dist:', error);
      throw new Error('No se pudo cargar la librería de PDF. Por favor, recarga la página.');
    }
  }
  return pdfjsLib;
};

/**
 * Descarga un PDF desde una URL y lo convierte en ArrayBuffer
 */
const downloadPDF = async (fileUrl: string): Promise<ArrayBuffer> => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Error al descargar PDF: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('No se pudo descargar el PDF. Verifica que la URL sea válida.');
  }
};

/**
 * Extrae texto de un PDF desde una URL
 * @param fileUrl URL del PDF en Supabase Storage
 * @returns Texto extraído del PDF
 */
export const extractTextFromPDF = async (fileUrl: string): Promise<string> => {
  try {
    // Cargar pdfjs-dist
    const pdfjs = await loadPdfJs();
    
    // Descargar PDF
    const arrayBuffer = await downloadPDF(fileUrl);
    
    // Cargar documento PDF
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extraer texto de todas las páginas
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatenar texto de la página
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    
    // Mensajes de error más amigables
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('El archivo PDF está corrupto o no es válido.');
    }
    if (error.message?.includes('password')) {
      throw new Error('El PDF está protegido con contraseña y no se puede leer.');
    }
    if (error.message?.includes('download')) {
      throw new Error('No se pudo descargar el PDF. Verifica tu conexión a internet.');
    }
    
    throw new Error(`Error al extraer texto del PDF: ${error.message || 'Error desconocido'}`);
  }
};

/**
 * Extrae texto de múltiples PDFs y los combina
 * @param fileUrls Array de URLs de PDFs
 * @returns Texto combinado de todos los PDFs
 */
export const extractTextFromMultiplePDFs = async (fileUrls: string[]): Promise<string> => {
  try {
    const texts = await Promise.all(
      fileUrls.map(async (url, index) => {
        try {
          const text = await extractTextFromPDF(url);
          return `--- Material ${index + 1} ---\n${text}\n\n`;
        } catch (error: any) {
          console.error(`Error extracting text from PDF ${index + 1}:`, error);
          // Continuar con otros PDFs aunque uno falle
          return `--- Material ${index + 1} (Error: ${error.message}) ---\n\n`;
        }
      })
    );
    
    return texts.join('\n');
  } catch (error: any) {
    console.error('Error extracting text from multiple PDFs:', error);
    throw new Error(`Error al procesar los PDFs: ${error.message || 'Error desconocido'}`);
  }
};

/**
 * Valida si una URL es un PDF válido
 * @param fileUrl URL a validar
 * @returns true si es un PDF válido
 */
export const isValidPDFUrl = (fileUrl: string): boolean => {
  if (!fileUrl) return false;
  
  // Verificar extensión
  const urlLower = fileUrl.toLowerCase();
  if (!urlLower.includes('.pdf') && !urlLower.includes('application/pdf')) {
    return false;
  }
  
  // Verificar que sea una URL válida
  try {
    new URL(fileUrl);
    return true;
  } catch {
    return false;
  }
};
