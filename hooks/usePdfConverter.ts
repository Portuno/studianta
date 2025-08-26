import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { PdfConverterOptions, ConversionResult } from '../types/pdf';

export const usePdfConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertToPdf = async (
    element: HTMLElement | string,
    options: PdfConverterOptions = {}
  ): Promise<ConversionResult> => {
    setIsConverting(true);

    try {
      const defaultOptions = {
        margin: 10,
        filename: 'documento.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        ...options
      };

      // Si element es un string, buscar el elemento en el DOM
      const targetElement = typeof element === 'string' 
        ? document.querySelector(element) as HTMLElement
        : element;

      if (!targetElement) {
        throw new Error('Elemento no encontrado para convertir');
      }

      // Configurar opciones de html2pdf
      const pdfOptions = {
        margin: defaultOptions.margin,
        filename: defaultOptions.filename,
        image: defaultOptions.image,
        html2canvas: defaultOptions.html2canvas,
        jsPDF: defaultOptions.jsPDF
      };

      // Realizar la conversión
      await html2pdf()
        .from(targetElement)
        .set(pdfOptions)
        .save();

      return {
        success: true,
        filename: defaultOptions.filename
      };

    } catch (error) {
      console.error('Error al convertir a PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsConverting(false);
    }
  };

  const convertElementToPdf = async (
    elementId: string,
    filename?: string
  ): Promise<ConversionResult> => {
    return convertToPdf(elementId, { filename });
  };

  const convertHtmlToPdf = async (
    htmlContent: string,
    filename?: string
  ): Promise<ConversionResult> => {
    // Crear un elemento temporal con el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const result = await convertToPdf(tempDiv, { filename });
      return result;
    } finally {
      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);
    }
  };

  return {
    convertToPdf,
    convertElementToPdf,
    convertHtmlToPdf,
    isConverting
  };
}; 