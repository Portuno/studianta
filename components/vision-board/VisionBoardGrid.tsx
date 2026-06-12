import React from 'react';
import { BoardBlock, BlockProgressLog } from '../../types';
import VisionBlock from './VisionBlock';

interface VisionBoardGridProps {
  blocks: BoardBlock[];
  progressLogs: Record<string, BlockProgressLog[]>;
  canEdit: boolean;
  isNightMode?: boolean;
  isMobile?: boolean;
  onBlockClick: (block: BoardBlock) => void;
  onToggleChecklistItem: (blockId: string, itemId: string, done: boolean) => void;
}

const VisionBoardGrid: React.FC<VisionBoardGridProps> = ({
  blocks,
  progressLogs,
  canEdit,
  isNightMode = false,
  isMobile = false,
  onBlockClick,
  onToggleChecklistItem,
}) => {
  const activeBlocks = blocks.filter(b => b.status === 'en_proceso');
  const cols = isMobile ? 2 : 6;

  if (activeBlocks.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed ${
          isNightMode ? 'border-[#D4AF37]/30 text-[#E0E1DD]/60' : 'border-[#F8C8DC] text-[#8B5E75]'
        }`}
      >
        <p className="font-cinzel text-lg mb-2">Tu tablero está vacío</p>
        <p className="text-sm">Añade tu primera meta con una imagen</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 auto-rows-[120px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {activeBlocks.map(block => {
        const logs = progressLogs[block.id] || [];
        const lastLog = logs[0];
        return (
          <VisionBlock
            key={block.id}
            block={block}
            lastLog={lastLog}
            canEdit={canEdit}
            isNightMode={isNightMode}
            onClick={() => onBlockClick(block)}
            onToggleChecklistItem={(itemId, done) =>
              onToggleChecklistItem(block.id, itemId, done)
            }
          />
        );
      })}
    </div>
  );
};

export default VisionBoardGrid;
