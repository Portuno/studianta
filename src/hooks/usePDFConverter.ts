import { useState, useCallback } from 'react';
import { PDFConverter, ConversionResult } from '../lib/pdfConverter';

interface UsePDFConverterReturn {
  isConverting: boolean;
  result: ConversionResult | null;
  convertFile: (file: File) => Promise<void>;
  downloadPDF: () => void;
  uploadToSupabase: (supabase: any, bucket: string, path: string) => Promise<{ success: boolean; error?: string; url?: string }>;
  reset: () => void;
}

export const usePDFConverter = (): UsePDFConverterReturn => {
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const convertFile = useCallback(async (file: File) => {
    setIsConverting(true);
    setResult(null);
    
    try {
      const conversionResult = await PDFConverter.convertToPDF(file);
      setResult(conversionResult);
      
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
  }, []);

  const downloadPDF = useCallback(() => {
    if (result?.success) {
      PDFConverter.downloadPDF(result);
    }
  }, [result]);

  const uploadToSupabase = useCallback(async (
    supabase: any, 
    bucket: string, 
    path: string
  ) => {
    if (!result?.success) {
      return { success: false, error: 'No hay PDF para subir' };
    }

    return await PDFConverter.uploadToSupabase(result, supabase, bucket, path);
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setIsConverting(false);
  }, []);

  return {
    isConverting,
    result,
    convertFile,
    downloadPDF,
    uploadToSupabase,
    reset
  };
}; 