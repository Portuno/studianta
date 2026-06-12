import React from 'react';
import { X } from 'lucide-react';
import BlockModal from './BlockModal';
import {
  BoardBlock, BlockProgressLog, JournalEntry, MoodType,
} from '../../types';

interface BlockBottomSheetProps {
  block: BoardBlock;
  progressLogs: BlockProgressLog[];
  canEdit: boolean;
  isMobile?: boolean;
  isNightMode?: boolean;
  journalEntries: JournalEntry[];
  onClose: () => void;
  onSave: (updates: Partial<BoardBlock>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onAddProgressLog: (text: string) => Promise<void>;
  onMarkAchieved: (savings: { monetaryGain: number; savedAmount: number }) => Promise<void>;
  onCreateJournalEntry: (content: string, mood: MoodType) => Promise<void>;
  onLinkJournalEntry: (entryId: string) => Promise<void>;
  onNavigateToDiary?: () => void;
}

const BlockBottomSheet: React.FC<BlockBottomSheetProps> = (props) => {
  const { block, onClose, isNightMode = false, isMobile = true } = props;

  if (!isMobile) {
    return <BlockModal {...props} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative z-10 max-h-[92vh] overflow-y-auto rounded-t-3xl shadow-2xl ${
          isNightMode ? 'bg-[#302B4F]' : 'bg-[#FFF9FA]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-inherit">
          <div className={`w-10 h-1 rounded-full ${isNightMode ? 'bg-[#D4AF37]/40' : 'bg-[#F8C8DC]'}`} />
        </div>
        <div className="sticky top-4 flex items-center justify-between px-4 pb-2 bg-inherit">
          <h3 className={`font-cinzel text-lg truncate ${isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'}`}>
            {block.name || 'Objetivo'}
          </h3>
          <button onClick={onClose} className="p-2 text-[#8B5E75]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <BlockModal {...props} embedded onClose={onClose} />
      </div>
    </div>
  );
};

export default BlockBottomSheet;
