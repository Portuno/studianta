import { useState } from 'react';
import { usePdfConverter } from './usePdfConverter';
import { NotebookContent, NotebookPdfOptions } from '../types/pdf';

export const useNotebookPdfConverter = () => {
  const [isConverting, setIsConverting] = useState(false);
  const { convertToPdf } = usePdfConverter();

  const convertNotebookToPdf = async (
    notebook: NotebookContent,
    options: NotebookPdfOptions = {}
  ) => {
    setIsConverting(true);

    try {
      const {
        includeHeader = true,
        includeFooter = true,
        includePageNumbers = true,
        pageSize = 'a4',
        orientation = 'portrait',
        margin = 15,
        fontSize = 12,
        lineHeight = 1.5
      } = options;

      // Crear HTML optimizado para PDF
      const htmlContent = generateNotebookHtml(notebook, {
        includeHeader,
        includeFooter,
        includePageNumbers,
        fontSize,
        lineHeight
      });

      // Crear elemento temporal
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '0';
      tempDiv.style.margin = '0';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = `${fontSize}px`;
      tempDiv.style.lineHeight = lineHeight.toString();
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';
      
      document.body.appendChild(tempDiv);

      // Configurar opciones de PDF
      const pdfOptions = {
        filename: `${notebook.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        margin,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          width: 210 * 2.83465, // Convert mm to px
          height: 297 * 2.83465  // Convert mm to px
        },
        jsPDF: { 
          unit: 'mm', 
          format: pageSize, 
          orientation 
        }
      };

      const result = await convertToPdf(tempDiv, pdfOptions);

      // Limpiar elemento temporal
      document.body.removeChild(tempDiv);

      return result;

    } catch (error) {
      console.error('Error al convertir notebook a PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsConverting(false);
    }
  };

  const generateNotebookHtml = (
    notebook: NotebookContent,
    options: {
      includeHeader: boolean;
      includeFooter: boolean;
      includePageNumbers: boolean;
      fontSize: number;
      lineHeight: number;
    }
  ): string => {
    const { includeHeader, includeFooter, includePageNumbers, fontSize, lineHeight } = options;

    const headerHtml = includeHeader ? `
      <div style="
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
        margin-bottom: 20px;
        text-align: center;
      ">
        <h1 style="
          margin: 0;
          font-size: ${fontSize + 8}px;
          font-weight: bold;
          color: #333;
        ">${notebook.title}</h1>
        ${notebook.createdAt ? `
          <p style="
            margin: 5px 0 0 0;
            font-size: ${fontSize - 2}px;
            color: #666;
          ">Creado: ${new Date(notebook.createdAt).toLocaleDateString('es-ES')}</p>
        ` : ''}
        ${notebook.updatedAt ? `
          <p style="
            margin: 2px 0 0 0;
            font-size: ${fontSize - 2}px;
            color: #666;
          ">Actualizado: ${new Date(notebook.updatedAt).toLocaleDateString('es-ES')}</p>
        ` : ''}
      </div>
    ` : '';

    const tagsHtml = notebook.tags && notebook.tags.length > 0 ? `
      <div style="
        margin-bottom: 20px;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 5px;
      ">
        <strong style="font-size: ${fontSize - 1}px;">Tags:</strong>
        ${notebook.tags.map(tag => `
          <span style="
            display: inline-block;
            background-color: #e0e0e0;
            padding: 2px 8px;
            margin: 2px;
            border-radius: 12px;
            font-size: ${fontSize - 2}px;
          ">${tag}</span>
        `).join('')}
      </div>
    ` : '';

    const contentHtml = `
      <div style="
        line-height: ${lineHeight};
        text-align: justify;
        white-space: pre-wrap;
        word-wrap: break-word;
      ">${notebook.content}</div>
    `;

    const footerHtml = includeFooter ? `
      <div style="
        border-top: 1px solid #ccc;
        padding-top: 10px;
        margin-top: 30px;
        text-align: center;
        font-size: ${fontSize - 2}px;
        color: #666;
      ">
        ${includePageNumbers ? '<span class="pageNumber"></span>' : ''}
        <p style="margin: 5px 0 0 0;">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
      </div>
    ` : '';

    return `
      <div style="
        font-family: Arial, sans-serif;
        font-size: ${fontSize}px;
        line-height: ${lineHeight};
        color: #000;
        background-color: #fff;
        padding: 20px;
        max-width: 100%;
      ">
        ${headerHtml}
        ${tagsHtml}
        ${contentHtml}
        ${footerHtml}
      </div>
    `;
  };

  return {
    convertNotebookToPdf,
    isConverting
  };
}; 