import React from 'react';
import { usePdfConverter } from '../hooks/usePdfConverter';

interface PdfConverterButtonProps {
  targetElement?: string | HTMLElement;
  htmlContent?: string;
  filename?: string;
  className?: string;
  children: React.ReactNode;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const PdfConverterButton: React.FC<PdfConverterButtonProps> = ({
  targetElement,
  htmlContent,
  filename = 'documento.pdf',
  className = '',
  children,
  onSuccess,
  onError,
  disabled = false,
  variant = 'primary',
  size = 'md'
}) => {
  const { convertToPdf, convertHtmlToPdf, isConverting } = usePdfConverter();

  const handleConversion = async () => {
    try {
      let result;

      if (htmlContent) {
        result = await convertHtmlToPdf(htmlContent, filename);
      } else if (targetElement) {
        result = await convertToPdf(targetElement, { filename });
      } else {
        throw new Error('Debe especificar targetElement o htmlContent');
      }

      if (result.success) {
        onSuccess?.(result.filename!);
      } else {
        onError?.(result.error!);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onError?.(errorMessage);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'outline':
        return 'border border-blue-600 text-blue-600 hover:bg-blue-50';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={handleConversion}
      disabled={disabled || isConverting}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-medium rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={isConverting ? 'Convirtiendo a PDF...' : 'Convertir a PDF'}
    >
      {isConverting ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Convirtiendo...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}; 