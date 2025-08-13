import { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

export const PDFViewer = ({ fileUrl, fileName, onClose }: PDFViewerProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Debug the fileUrl
  console.log('PDFViewer - fileUrl:', fileUrl);
  console.log('PDFViewer - fileName:', fileName);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-start justify-center pt-20 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 truncate">{fileName}</h2>
              <p className="text-sm text-gray-500">PDF Viewer</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="px-3 py-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="px-2 py-2"
            >
              <ZoomOut size={16} />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="px-2 py-2"
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="px-2 py-2"
            >
              <RotateCw size={16} />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClose}
              className="px-3 py-2"
            >
              <X size={16} />
              Close
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="flex justify-center">
            <div 
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center top',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              {fileUrl ? (
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-[600px] border-0"
                  title={fileName}
                  onError={() => console.error('Failed to load PDF:', fileUrl)}
                />
              ) : (
                <div className="w-full h-[600px] flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">PDF URL not available</p>
                    <p className="text-sm text-gray-500 mt-2">Check console for details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer with additional info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            Use the controls above to zoom, rotate, or download the PDF
          </p>
          <p className="text-xs text-gray-400 mt-1">
            💡 Click outside or press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}; 