export interface PdfConverterOptions {
  filename?: string;
  margin?: number;
  image?: { type: string; quality: number };
  html2canvas?: { scale: number; useCORS: boolean };
  jsPDF?: { unit: string; format: string; orientation: string };
}

export interface ConversionResult {
  success: boolean;
  error?: string;
  filename?: string;
}

export interface NotebookContent {
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface NotebookPdfOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  fontSize?: number;
  lineHeight?: number;
} 