import React, { useState } from 'react';
import { PDFConverter, ConversionResult } from '../lib/pdfConverter';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Download, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';

interface PDFConverterProps {
  onConversionComplete?: (result: ConversionResult) => void;
  onUploadComplete?: (url: string) => void;
  className?: string;
}

export const PDFConverterComponent: React.FC<PDFConverterProps> = ({
  onConversionComplete,
  onUploadComplete,
  className = ''
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await convertFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await convertFile(files[0]);
    }
  };

  const convertFile = async (file: File) => {
    setIsConverting(true);
    setResult(null);
    
    try {
      const conversionResult = await PDFConverter.convertToPDF(file);
      setResult(conversionResult);
      onConversionComplete?.(conversionResult);
      
      if (conversionResult.success) {
        // Descargar automáticamente
        PDFConverter.downloadPDF(conversionResult);
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleUpload = async () => {
    if (!result?.success || !result.pdfBlob) return;
    
    setUploading(true);
    try {
      // Aquí necesitarías tu cliente de Supabase
      // const { data, error } = await supabase.storage...
      
      // Ejemplo de uso:
      // const uploadResult = await PDFConverter.uploadToSupabase(
      //   result, 
      //   supabase, 
      //   'study-materials', 
      //   `converted/${result.fileName}`
      // );
      
      // if (uploadResult.success && uploadResult.url) {
      //   onUploadComplete?.(uploadResult.url);
      // }
      
      // Simular subida exitosa por ahora
      setTimeout(() => {
        onUploadComplete?.('https://example.com/converted-file.pdf');
        setUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al subir:', error);
      setUploading(false);
    }
  };

  const supportedFormats = [
    'Documentos: .doc, .docx',
    'Hojas de cálculo: .xls, .xlsx, .csv',
    'Texto: .txt, .md',
    'Imágenes: .jpg, .jpeg, .png, .gif, .bmp',
    'Web: .html, .htm'
  ];

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Convertir a PDF
        </CardTitle>
        <CardDescription>
          Convierte tus archivos a PDF directamente en el navegador. 
          No se envían a servidores externos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Área de arrastrar y soltar */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Arrastra tu archivo aquí
              </p>
              <p className="text-sm text-gray-500">
                o haz clic para seleccionar
              </p>
            </div>
            
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".doc,.docx,.xls,.xlsx,.csv,.txt,.md,.html,.htm,.jpg,.jpeg,.png,.gif,.bmp"
              className="hidden"
              id="file-input"
              disabled={isConverting}
            />
            
            <Button
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isConverting}
              variant="outline"
            >
              Seleccionar archivo
            </Button>
          </div>
        </div>

        {/* Formatos soportados */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Formatos soportados:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {supportedFormats.map((format, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {format}
              </li>
            ))}
          </ul>
        </div>

        {/* Estado de conversión */}
        {isConverting && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Convirtiendo archivo a PDF... Por favor espera.
            </AlertDescription>
          </Alert>
        )}

        {/* Resultado de la conversión */}
        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {result.success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-3">
                    <p className="font-medium">✅ Conversión exitosa!</p>
                    <p className="text-sm">
                      Archivo: <span className="font-mono">{result.fileName}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => PDFConverter.downloadPDF(result)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        size="sm"
                        variant="outline"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Subir a Supabase
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Error en la conversión: {result.error}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Información adicional */}
        <div className="text-xs text-gray-500 text-center">
          <p>✨ Conversión 100% local y gratuita</p>
          <p>🔒 Tus archivos nunca salen de tu navegador</p>
        </div>
      </CardContent>
    </Card>
  );
}; 