import React, { useState } from 'react';
import { useNotebookPdfConverter } from '../hooks/useNotebookPdfConverter';
import { PdfConverterButton } from './PdfConverterButton';

interface NotebookPdfConverterProps {
  notebook: {
    title: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
  };
  className?: string;
}

export const NotebookPdfConverter: React.FC<NotebookPdfConverterProps> = ({
  notebook,
  className = ''
}) => {
  const { convertNotebookToPdf, isConverting } = useNotebookPdfConverter();
  const [conversionOptions, setConversionOptions] = useState({
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    pageSize: 'a4' as 'a4' | 'letter' | 'legal',
    orientation: 'portrait' as 'portrait' | 'landscape',
    margin: 15,
    fontSize: 12,
    lineHeight: 1.5
  });

  const handleConvert = async () => {
    try {
      const result = await convertNotebookToPdf(notebook, conversionOptions);
      
      if (result.success) {
        console.log('✅ PDF generado exitosamente:', result.filename);
        // Aquí puedes mostrar una notificación de éxito
      } else {
        console.error('❌ Error al generar PDF:', result.error);
        // Aquí puedes mostrar una notificación de error
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Opciones de conversión */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Opciones de PDF</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opciones básicas */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={conversionOptions.includeHeader}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  includeHeader: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Incluir encabezado</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={conversionOptions.includeFooter}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  includeFooter: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Incluir pie de página</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={conversionOptions.includePageNumbers}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  includePageNumbers: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Números de página</span>
            </label>
          </div>

          {/* Opciones de formato */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tamaño de página</label>
              <select
                value={conversionOptions.pageSize}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  pageSize: e.target.value as 'a4' | 'letter' | 'legal'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Orientación</label>
              <select
                value={conversionOptions.orientation}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  orientation: e.target.value as 'portrait' | 'landscape'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="portrait">Vertical</option>
                <option value="landscape">Horizontal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Opciones avanzadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Márgenes (mm)</label>
            <input
              type="number"
              min="5"
              max="50"
              value={conversionOptions.margin}
              onChange={(e) => setConversionOptions(prev => ({
                ...prev,
                margin: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tamaño de fuente</label>
            <input
              type="number"
              min="8"
              max="20"
              value={conversionOptions.fontSize}
              onChange={(e) => setConversionOptions(prev => ({
                ...prev,
                fontSize: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Interlineado</label>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={conversionOptions.lineHeight}
              onChange={(e) => setConversionOptions(prev => ({
                ...prev,
                lineHeight: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Botón de conversión */}
      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConverting ? 'Convirtiendo...' : 'Convertir a PDF'}
        </button>
      </div>

      {/* Vista previa del contenido */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium mb-2">Vista previa del contenido</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Título:</strong> {notebook.title}</p>
          <p><strong>Contenido:</strong> {notebook.content.length} caracteres</p>
          {notebook.tags && notebook.tags.length > 0 && (
            <p><strong>Tags:</strong> {notebook.tags.join(', ')}</p>
          )}
          {notebook.createdAt && (
            <p><strong>Creado:</strong> {new Date(notebook.createdAt).toLocaleDateString('es-ES')}</p>
          )}
        </div>
      </div>
    </div>
  );
}; 