export interface ConversionResult {
  success: boolean;
  pdfBlob?: Blob;
  error?: string;
  fileName?: string;
}

export interface UploadResult {
  success: boolean;
  error?: string;
  url?: string;
}

export type SupportedFileType = 
  | 'text' 
  | 'word' 
  | 'excel' 
  | 'image' 
  | 'html' 
  | 'unknown';

export interface FileTypeInfo {
  type: SupportedFileType;
  extensions: string[];
  description: string;
  supported: boolean;
}

export interface ConversionOptions {
  autoDownload?: boolean;
  quality?: 'low' | 'medium' | 'high';
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
} 