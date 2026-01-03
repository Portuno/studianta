import { jsPDF } from 'jspdf';

/**
 * Agrega el sello de Studianta a la primera página de un PDF
 * Posicionado arriba a la derecha
 */
export const addSealToPDF = async (doc: jsPDF): Promise<void> => {
  try {
    // Cargar la imagen PNG del sello usando fetch
    const response = await fetch('/seal.png');
    if (!response.ok) {
      throw new Error(`Error al cargar seal.png: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Crear una imagen desde el blob
    const img = new Image();
    const imgPromise = new Promise<string>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(dataURL);
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('No se pudo obtener el contexto del canvas'));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar la imagen del sello (seal.png)'));
      };
      img.src = url;
    });

    const base64Image = await imgPromise;

    // Obtener dimensiones de la página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Tamaño del sello (20mm)
    const sealSize = 20;
    
    // Posición: arriba a la derecha con márgenes
    const margin = 10;
    const x = pageWidth - sealSize - margin;
    const y = margin;
    
    // Agregar el sello solo en la primera página
    doc.addImage(base64Image, 'PNG', x, y, sealSize, sealSize);
  } catch (error) {
    console.error('Error al agregar el sello al PDF:', error);
    // Si hay un error, continuamos sin el sello para no romper la generación del PDF
  }
};

