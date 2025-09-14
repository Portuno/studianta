import React from 'react';
import { NotebookPdfConverter } from '../components/NotebookPdfConverter';

export const PdfConverterExample: React.FC = () => {
  // Ejemplo de notebook
  const exampleNotebook = {
    title: "Mi Cuaderno de Estudio",
    content: `Este es un ejemplo de contenido para convertir a PDF.

Puedes incluir:
- Texto con formato
- Múltiples líneas
- Caracteres especiales: áéíóú ñ
- Números: 1234567890
- Símbolos: @#$%^&*()

El contenido se convertirá manteniendo el formato y la estructura.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["ejemplo", "pdf", "conversión"]
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Conversor de PDF Local
        </h1>
        <p className="text-gray-600">
          Convierte tus notas y cuadernos a PDF sin depender de servicios externos
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <NotebookPdfConverter 
          notebook={exampleNotebook}
          className="max-w-none"
        />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Características principales
        </h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>✅ Conversión 100% local - no se envían datos a servidores externos</li>
          <li>✅ Múltiples opciones de formato (A4, Letter, Legal)</li>
          <li>✅ Orientación vertical u horizontal</li>
          <li>✅ Configuración de márgenes, fuente e interlineado</li>
          <li>✅ Incluye encabezado, pie de página y números de página</li>
          <li>✅ Soporte para tags y metadatos</li>
          <li>✅ Genera archivos PDF de alta calidad</li>
        </ul>
      </div>
    </div>
  );
}; 