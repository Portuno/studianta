import jsPDF from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ConversionResult {
  success: boolean;
  pdfBlob?: Blob;
  error?: string;
  fileName?: string;
}

export class PDFConverter {
  /**
   * Convierte un archivo a PDF usando métodos client-side
   */
  static async convertToPDF(file: File): Promise<ConversionResult> {
    try {
      const fileType = this.getFileType(file.name);
      
      switch (fileType) {
        case 'text':
          return await this.convertTextToPDF(file);
        case 'word':
          return await this.convertWordToPDF(file);
        case 'excel':
          return await this.convertExcelToPDF(file);
        case 'image':
          return await this.convertImageToPDF(file);
        case 'html':
          return await this.convertHTMLToPDF(file);
        default:
          return { success: false, error: 'Tipo de archivo no soportado' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Error en conversión: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Determina el tipo de archivo basado en la extensión
   */
  private static getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['txt', 'md'].includes(ext || '')) return 'text';
    if (['doc', 'docx'].includes(ext || '')) return 'word';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'excel';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) return 'image';
    if (['html', 'htm'].includes(ext || '')) return 'html';
    
    return 'unknown';
  }

  /**
   * Convierte archivos de texto a PDF
   */
  private static async convertTextToPDF(file: File): Promise<ConversionResult> {
    const text = await file.text();
    
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(text, 180);
    
    let y = 20;
    const lineHeight = 7;
    
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 15, y);
      y += lineHeight;
    }
    
    const pdfBlob = doc.output('blob');
    const fileName = file.name.replace(/\.[^/.]+$/, '.pdf');
    
    return { success: true, pdfBlob, fileName };
  }

  /**
   * Convierte archivos Word a PDF (simplificado)
   */
  private static async convertWordToPDF(file: File): Promise<ConversionResult> {
    try {
      // Para archivos .docx, extraemos el texto y lo convertimos
      const arrayBuffer = await file.arrayBuffer();
      
      // Extraer texto del documento (simplificado)
      const text = await this.extractTextFromWord(arrayBuffer);
      
      const pdfDoc = new jsPDF();
      const lines = pdfDoc.splitTextToSize(text, 180);
      
      let y = 20;
      for (const line of lines) {
        if (y > 280) {
          pdfDoc.addPage();
          y = 20;
        }
        pdfDoc.text(line, 15, y);
        y += 7;
      }
      
      const pdfBlob = pdfDoc.output('blob');
      const fileName = file.name.replace(/\.[^/.]+$/, '.pdf');
      
      return { success: true, pdfBlob, fileName };
    } catch (error) {
      // Fallback: convertir como texto simple
      return await this.convertTextToPDF(file);
    }
  }

  /**
   * Convierte archivos Excel a PDF
   */
  private static async convertExcelToPDF(file: File): Promise<ConversionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const doc = new jsPDF();
      let y = 20;
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Agregar nombre de la hoja
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.text(sheetName, 15, y);
        y += 10;
        
        // Agregar datos
        doc.setFontSize(10);
        for (const row of jsonData) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          
          const rowText = Array.isArray(row) ? row.join(' | ') : String(row);
          const lines = doc.splitTextToSize(rowText, 180);
          
          for (const line of lines) {
            doc.text(line, 15, y);
            y += 6;
          }
          y += 2;
        }
        
        y += 10;
      }
      
      const pdfBlob = doc.output('blob');
      const fileName = file.name.replace(/\.[^/.]+$/, '.pdf');
      
      return { success: true, pdfBlob, fileName };
    } catch (error) {
      return { 
        success: false, 
        error: `Error al convertir Excel: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Convierte imágenes a PDF
   */
  private static async convertImageToPDF(file: File): Promise<ConversionResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      img.onload = () => {
        // Calcular dimensiones para mantener proporción
        const maxWidth = 595; // A4 width
        const maxHeight = 842; // A4 height
        
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        
        const doc = new jsPDF();
        doc.addImage(imgData, 'JPEG', 15, 20, width * 0.75, height * 0.75);
        
        const pdfBlob = doc.output('blob');
        const fileName = file.name.replace(/\.[^/.]+$/, '.pdf');
        
        resolve({ success: true, pdfBlob, fileName });
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convierte HTML a PDF
   */
  private static async convertHTMLToPDF(file: File): Promise<ConversionResult> {
    try {
      const html = await file.text();
      
      // Crear un elemento temporal para renderizar el HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);
      
      const doc = new jsPDF();
      
      // Convertir HTML a PDF (simplificado)
      const text = tempDiv.textContent || tempDiv.innerText || '';
      const lines = doc.splitTextToSize(text, 180);
      
      let y = 20;
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 15, y);
        y += 7;
      }
      
      // Limpiar elemento temporal
      document.body.removeChild(tempDiv);
      
      const pdfBlob = doc.output('blob');
      const fileName = file.name.replace(/\.[^/.]+$/, '.pdf');
      
      return { success: true, pdfBlob, fileName };
    } catch (error) {
      return { 
        success: false, 
        error: `Error al convertir HTML: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Extrae texto de archivos Word (simplificado)
   */
  private static async extractTextFromWord(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Para archivos .docx, intentamos extraer el contenido XML
      const uint8Array = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder('utf-8');
      const content = textDecoder.decode(uint8Array);
      
      // Buscar contenido de texto en el XML del documento
      const textMatch = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatch) {
        return textMatch
          .map(tag => tag.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1'))
          .join(' ');
      }
      
      // Fallback: extraer texto simple
      return content.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    } catch {
      return 'Contenido del documento Word (texto extraído)';
    }
  }

  /**
   * Descarga el PDF generado
   */
  static downloadPDF(result: ConversionResult): void {
    if (result.success && result.pdfBlob && result.fileName) {
      saveAs(result.pdfBlob, result.fileName);
    }
  }

  /**
   * Sube el PDF a Supabase Storage
   */
  static async uploadToSupabase(
    result: ConversionResult, 
    supabase: any, 
    bucket: string, 
    path: string
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    if (!result.success || !result.pdfBlob) {
      return { success: false, error: 'No hay PDF para subir' };
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, result.pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) throw error;

      // Generar URL firmada
      const { data: signedUrl } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hora

      return { 
        success: true, 
        url: signedUrl?.signedUrl 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Error al subir: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
} 