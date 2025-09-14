import React from 'react';
import { PDFConverterComponent } from '../components/PDFConverter';
import { ConversionResult } from '../lib/pdfConverter';
import { toast } from 'sonner';

export const PDFConverterPage: React.FC = () => {
  const handleConversionComplete = (result: ConversionResult) => {
    if (result.success) {
      toast.success(`Archivo convertido exitosamente: ${result.fileName}`);
    } else {
      toast.error(`Error en la conversión: ${result.error}`);
    }
  };

  const handleUploadComplete = (url: string) => {
    toast.success(`PDF subido exitosamente a: ${url}`);
    console.log('URL del archivo subido:', url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Convertidor de PDF
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convierte tus documentos, hojas de cálculo, imágenes y más a PDF 
            directamente en tu navegador. 100% gratuito y seguro.
          </p>
        </div>

        {/* Componente principal */}
        <PDFConverterComponent
          onConversionComplete={handleConversionComplete}
          onUploadComplete={handleUploadComplete}
        />

        {/* Información adicional */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-blue-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Rápido</h3>
            <p className="text-gray-600 text-sm">
              Conversión instantánea sin esperar en colas o servidores externos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-green-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
            <p className="text-gray-600 text-sm">
              Tus archivos nunca salen de tu dispositivo. Privacidad total garantizada.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-purple-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Gratuito</h3>
            <p className="text-gray-600 text-sm">
              Sin costos ocultos, sin límites de uso, sin suscripciones.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Qué tipos de archivos puedo convertir?
              </h3>
              <p className="text-gray-600 text-sm">
                Soporta documentos de Word (.doc, .docx), hojas de Excel (.xls, .xlsx, .csv), 
                archivos de texto (.txt, .md), imágenes (.jpg, .png, .gif) y páginas web (.html).
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Es seguro usar este convertidor?
              </h3>
              <p className="text-gray-600 text-sm">
                Absolutamente. La conversión se realiza completamente en tu navegador. 
                Tus archivos nunca se envían a servidores externos.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Hay algún límite en el tamaño de archivo?
              </h3>
              <p className="text-gray-600 text-sm">
                Los límites dependen de la memoria disponible en tu navegador. 
                Para archivos muy grandes, recomendamos dividirlos en partes más pequeñas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 