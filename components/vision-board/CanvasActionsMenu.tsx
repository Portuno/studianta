import React from 'react';
import { ImagePlus, Type, X } from 'lucide-react';

interface CanvasActionsMenuProps {
  open: boolean;
  isNightMode?: boolean;
  onClose: () => void;
  onAddImage: () => void;
  onAddText: () => void;
}

const CanvasActionsMenu: React.FC<CanvasActionsMenuProps> = ({
  open,
  isNightMode = false,
  onClose,
  onAddImage,
  onAddText,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-2xl p-4 shadow-2xl ${
          isNightMode ? 'bg-[#302B4F] border border-[#D4AF37]/20' : 'glass-card'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-cinzel text-lg ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'}`}>
            Añadir al lienzo
          </h3>
          <button onClick={onClose} className="text-[#8B5E75]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => { onAddImage(); onClose(); }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#E35B8F]/10 hover:bg-[#E35B8F]/20 transition-colors text-left"
          >
            <ImagePlus className="w-6 h-6 text-[#E35B8F]" />
            <div>
              <p className={`font-medium text-sm ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'}`}>
                Subir imagen
              </p>
              <p className={`text-xs ${isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]'}`}>
                Desde tu dispositivo
              </p>
            </div>
          </button>
          <button
            onClick={() => { onAddText(); onClose(); }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors text-left"
          >
            <Type className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <p className={`font-medium text-sm ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'}`}>
                Cuadro de texto
              </p>
              <p className={`text-xs ${isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]'}`}>
                Títulos, fechas, descripciones
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasActionsMenu;
