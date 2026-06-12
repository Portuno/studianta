import React from 'react';
import { Link2, X } from 'lucide-react';

interface LinkElementsToolbarProps {
  count: number;
  isMobile?: boolean;
  isNightMode?: boolean;
  linkMode: boolean;
  onToggleLinkMode: () => void;
  onLink: () => void;
  onClear: () => void;
}

const LinkElementsToolbar: React.FC<LinkElementsToolbarProps> = ({
  count,
  isMobile = false,
  isNightMode = false,
  linkMode,
  onToggleLinkMode,
  onLink,
  onClear,
}) => {
  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isMobile && (
        <button
          onClick={onToggleLinkMode}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            linkMode
              ? 'bg-[#E35B8F] text-white'
              : isNightMode
                ? 'bg-[#302B4F] text-[#E0E1DD] border border-[#D4AF37]/30'
                : 'bg-white/80 text-[#4A233E] border border-[#F8C8DC]'
          }`}
        >
          {linkMode ? 'Modo enlazar activo' : 'Enlazar elementos'}
        </button>
      )}

      {!isMobile && (
        <span className={`text-xs ${isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]'}`}>
          Ctrl + clic para seleccionar varios
        </span>
      )}

      {count >= 2 && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg ${
            isNightMode ? 'bg-[#302B4F] border border-[#D4AF37]/30' : 'bg-white border border-[#F8C8DC]'
          }`}
        >
          <span className={`text-xs ${textPrimary}`}>{count} seleccionados</span>
          <button
            onClick={onLink}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[#E35B8F] text-white"
          >
            <Link2 className="w-3.5 h-3.5" />
            Enlazar como objetivo
          </button>
          <button onClick={onClear} className="text-[#8B5E75]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkElementsToolbar;
