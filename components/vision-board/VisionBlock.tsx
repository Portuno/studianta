import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { BoardBlock, BlockProgressLog } from '../../types';

interface VisionBlockProps {
  block: BoardBlock;
  lastLog?: BlockProgressLog;
  canEdit: boolean;
  isNightMode?: boolean;
  onClick: () => void;
  onToggleChecklistItem: (itemId: string, done: boolean) => void;
}

const VisionBlock: React.FC<VisionBlockProps> = ({
  block,
  lastLog,
  canEdit,
  isNightMode = false,
  onClick,
  onToggleChecklistItem,
}) => {
  const [showQuickChecklist, setShowQuickChecklist] = useState(false);
  const visibleChecklist = block.checklist.slice(0, 3);
  const progressColor = block.progressPercentage >= 100 ? '#D4AF37' : '#E35B8F';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-md transition-transform hover:scale-[1.02] ${
        isNightMode ? 'border border-[#D4AF37]/20' : 'border border-[#F8C8DC]/50'
      }`}
      style={{
        gridColumn: `span ${block.colSpan}`,
        gridRow: `span ${block.rowSpan}`,
        minHeight: `${block.rowSpan * 120}px`,
      }}
      onClick={onClick}
    >
      {block.imageUrl ? (
        <img
          src={block.imageUrl}
          alt={block.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className={`absolute inset-0 ${
            isNightMode
              ? 'bg-gradient-to-br from-[#302B4F] to-[#1A1A2E]'
              : 'bg-gradient-to-br from-[#F8C8DC] to-[#FFF0F5]'
          }`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
        {block.moodTags.slice(0, 2).map(tag => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-[#E35B8F]/80 text-white backdrop-blur-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-cinzel text-sm font-semibold truncate">{block.name || 'Sin nombre'}</h3>

        {lastLog && (
          <p className="text-white/70 text-[10px] truncate mt-0.5">{lastLog.text}</p>
        )}

        <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${block.progressPercentage}%`, backgroundColor: progressColor }}
          />
        </div>
        <p className="text-white/60 text-[10px] mt-0.5">{block.progressPercentage}% completado</p>
      </div>

      {block.checklist.length > 0 && (
        <div
          className="absolute top-2 right-2"
          onClick={e => {
            e.stopPropagation();
            setShowQuickChecklist(!showQuickChecklist);
          }}
        >
          <button
            className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs hover:bg-white/30"
            title="Checklist rápida"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showQuickChecklist && (
        <div
          className="absolute inset-x-2 top-10 z-10 rounded-xl bg-black/80 backdrop-blur-md p-2 space-y-1"
          onClick={e => e.stopPropagation()}
        >
          {visibleChecklist.map(item => (
            <label key={item.id} className="flex items-center gap-2 text-white text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canEdit}
                onChange={e => onToggleChecklistItem(item.id, e.target.checked)}
                className="rounded accent-[#E35B8F]"
              />
              <span className={item.done ? 'line-through opacity-60' : ''}>{item.text}</span>
            </label>
          ))}
          {block.checklist.length > 3 && (
            <p className="text-white/50 text-[10px] text-center">+{block.checklist.length - 3} más en el modal</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VisionBlock;
