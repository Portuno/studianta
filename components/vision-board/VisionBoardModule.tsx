import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, Plus, LayoutGrid, Trophy } from 'lucide-react';
import {
  VisionBoard, BoardBlock, BoardCollaborator, BlockProgressLog,
  UserAchievementSaving, JournalEntry, MoodType, CollaboratorRole,
} from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { getBoardPermissions } from './utils';
import VisionBoardGrid from './VisionBoardGrid';
import BlockModal from './BlockModal';
import ShareMenu from './ShareMenu';
import BoardSelector from './BoardSelector';
import AchievementsChest from './AchievementsChest';

interface VisionBoardModuleProps {
  userId: string;
  userTier?: 'Free' | 'Premium';
  isMobile?: boolean;
  isNightMode?: boolean;
  journalEntries: JournalEntry[];
  onJournalEntryAdded?: (entry: JournalEntry) => void;
  onJournalEntryUpdated?: (entry: JournalEntry) => void;
  onNavigateToDiary?: () => void;
}

type Tab = 'board' | 'achievements';

const VisionBoardModule: React.FC<VisionBoardModuleProps> = ({
  userId,
  userTier = 'Free',
  isMobile = false,
  isNightMode = false,
  journalEntries,
  onJournalEntryAdded,
  onJournalEntryUpdated,
  onNavigateToDiary,
}) => {
  const [boards, setBoards] = useState<VisionBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BoardBlock[]>([]);
  const [collaborators, setCollaborators] = useState<BoardCollaborator[]>([]);
  const [progressLogs, setProgressLogs] = useState<Record<string, BlockProgressLog[]>>({});
  const [achievements, setAchievements] = useState<UserAchievementSaving[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BoardBlock | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBoard = boards.find(b => b.id === activeBoardId) || null;
  const permissions = getBoardPermissions(activeBoard, userId, collaborators);
  const ownedBoards = boards.filter(b => b.userId === userId);
  const canCreateBoard = userTier === 'Premium' || ownedBoards.length < 3;

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';

  const loadBoardData = useCallback(async (boardId: string) => {
    const [blocksData, collabData, achievementsData] = await Promise.all([
      supabaseService.getBoardBlocks(boardId, true),
      supabaseService.getCollaborators(boardId),
      supabaseService.getAchievementsSavings(userId),
    ]);
    setBlocks(blocksData);
    setCollaborators(collabData);
    setAchievements(achievementsData);

    const logsMap: Record<string, BlockProgressLog[]> = {};
    await Promise.all(
      blocksData.map(async block => {
        const logs = await supabaseService.getBlockProgressLogs(block.id);
        logsMap[block.id] = logs;
      })
    );
    setProgressLogs(logsMap);
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const boardsData = await supabaseService.getVisionBoards(userId);
        setBoards(boardsData);

        if (boardsData.length === 0) {
          const newBoard = await supabaseService.createVisionBoard(userId, 'Mi Vision Board');
          setBoards([newBoard]);
          setActiveBoardId(newBoard.id);
          await loadBoardData(newBoard.id);
        } else {
          const firstOwned = boardsData.find(b => b.userId === userId) || boardsData[0];
          setActiveBoardId(firstOwned.id);
          await loadBoardData(firstOwned.id);
        }
      } catch (err) {
        console.error('Error loading vision boards:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId, loadBoardData]);

  const handleSelectBoard = async (boardId: string) => {
    setActiveBoardId(boardId);
    setSelectedBlock(null);
    await loadBoardData(boardId);
  };

  const handleCreateBoard = async (title: string) => {
    const newBoard = await supabaseService.createVisionBoard(userId, title);
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
    await loadBoardData(newBoard.id);
  };

  const handleAddBlock = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBoardId) return;

    try {
      const block = await supabaseService.createBoardBlock(activeBoardId, {
        name: 'Nueva meta',
        sizePreset: 'md',
      });
      const imageUrl = await supabaseService.uploadVisionBoardImage(
        userId, activeBoardId, block.id, file
      );
      const updated = await supabaseService.updateBoardBlock(block.id, { imageUrl });
      setBlocks(prev => [...prev, updated]);
      setSelectedBlock(updated);
    } catch (err) {
      console.error('Error adding block:', err);
      alert(err instanceof Error ? err.message : 'Error al añadir bloque');
    }
    e.target.value = '';
  };

  const handleToggleChecklist = async (blockId: string, itemId: string, done: boolean) => {
    const updated = await supabaseService.toggleChecklistItem(blockId, itemId, done);
    setBlocks(prev => prev.map(b => (b.id === blockId ? updated : b)));
    if (selectedBlock?.id === blockId) setSelectedBlock(updated);
  };

  const handleSaveBlock = async (blockId: string, updates: Partial<BoardBlock>) => {
    const updated = await supabaseService.updateBoardBlock(blockId, updates);
    setBlocks(prev => prev.map(b => (b.id === blockId ? updated : b)));
    if (selectedBlock?.id === blockId) setSelectedBlock(updated);
  };

  const handleDeleteBlock = async (blockId: string) => {
    await supabaseService.deleteBoardBlock(blockId);
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    setSelectedBlock(null);
  };

  const handleAddProgressLog = async (blockId: string, text: string) => {
    const log = await supabaseService.addBlockProgressLog(userId, blockId, text);
    setProgressLogs(prev => ({
      ...prev,
      [blockId]: [log, ...(prev[blockId] || [])],
    }));
  };

  const handleMarkAchieved = async (
    blockId: string,
    savings: { monetaryGain: number; savedAmount: number }
  ) => {
    const { block, achievement } = await supabaseService.markBlockAsAchieved(
      userId, blockId, savings
    );
    setBlocks(prev => prev.map(b => (b.id === blockId ? block : b)));
    setAchievements(prev => {
      const filtered = prev.filter(a => a.blockId !== blockId);
      return [achievement, ...filtered];
    });
    setSelectedBlock(null);
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!activeBoardId) return;
    const updated = await supabaseService.updateVisionBoard(userId, activeBoardId, { isPublic });
    setBoards(prev => prev.map(b => (b.id === activeBoardId ? updated : b)));
  };

  const handleInvite = async (inviteUserId: string, role: CollaboratorRole) => {
    if (!activeBoardId) return;
    const collab = await supabaseService.inviteCollaborator(
      userId, activeBoardId, inviteUserId, role
    );
    setCollaborators(prev => [...prev, collab]);
  };

  const handleCreateJournalEntry = async (content: string, mood: MoodType) => {
    if (!selectedBlock) return;
    const entry = await supabaseService.createJournalEntryFromBlock(
      userId, selectedBlock.id, content, mood
    );
    onJournalEntryAdded?.(entry);
  };

  const handleLinkJournalEntry = async (entryId: string) => {
    if (!selectedBlock) return;
    const entry = await supabaseService.linkJournalEntryToBlock(
      userId, entryId, selectedBlock.id
    );
    onJournalEntryUpdated?.(entry);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${textSecondary}`}>
        <p className="font-cinzel">Cargando Vision Board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`flex flex-col ${isMobile ? 'gap-3' : 'flex-row items-center justify-between gap-4'}`}>
        <div>
          <h2 className={`font-cinzel text-2xl ${textPrimary}`}>Vision Board</h2>
          <p className={`text-sm ${textSecondary}`}>Visualiza y ejecuta tus metas</p>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          <BoardSelector
            boards={boards}
            activeBoardId={activeBoardId}
            canCreate={canCreateBoard}
            isNightMode={isNightMode}
            onSelect={handleSelectBoard}
            onCreate={handleCreateBoard}
          />
          {permissions.isOwner && (
            <button
              onClick={() => setShowShare(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border ${
                isNightMode
                  ? 'border-[#D4AF37]/30 text-[#E0E1DD]'
                  : 'border-[#F8C8DC] text-[#4A233E] bg-white/60'
              }`}
            >
              <Share2 className="w-4 h-4" />
              {!isMobile && 'Compartir'}
            </button>
          )}
          {permissions.canEdit && activeTab === 'board' && (
            <button
              onClick={handleAddBlock}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-[#E35B8F] text-white hover:bg-[#E35B8F]/90"
            >
              <Plus className="w-4 h-4" />
              {!isMobile && 'Añadir bloque'}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl ${isNightMode ? 'bg-[#302B4F]/50' : 'bg-white/40'}`}>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'board'
              ? 'bg-[#E35B8F] text-white'
              : textSecondary
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Tablero Activo
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'achievements'
              ? 'bg-[#D4AF37] text-white'
              : textSecondary
          }`}
        >
          <Trophy className="w-4 h-4" />
          Cofre de Logros
        </button>
      </div>

      {/* Content */}
      {activeTab === 'board' ? (
        <VisionBoardGrid
          blocks={blocks}
          progressLogs={progressLogs}
          canEdit={permissions.canEdit}
          isNightMode={isNightMode}
          isMobile={isMobile}
          onBlockClick={setSelectedBlock}
          onToggleChecklistItem={handleToggleChecklist}
        />
      ) : (
        <AchievementsChest
          blocks={blocks}
          achievements={achievements}
          canEdit={permissions.canEdit}
          isNightMode={isNightMode}
          onUpdateAchievement={async (id, updates) => {
            const updated = await supabaseService.updateAchievementSaving(userId, id, updates);
            setAchievements(prev => prev.map(a => (a.id === id ? updated : a)));
          }}
        />
      )}

      {/* Block Modal */}
      {selectedBlock && (
        <BlockModal
          block={selectedBlock}
          progressLogs={progressLogs[selectedBlock.id] || []}
          canEdit={permissions.canEdit}
          isNightMode={isNightMode}
          journalEntries={journalEntries}
          onClose={() => setSelectedBlock(null)}
          onSave={updates => handleSaveBlock(selectedBlock.id, updates)}
          onDelete={permissions.canEdit ? () => handleDeleteBlock(selectedBlock.id) : undefined}
          onAddProgressLog={text => handleAddProgressLog(selectedBlock.id, text)}
          onMarkAchieved={savings => handleMarkAchieved(selectedBlock.id, savings)}
          onCreateJournalEntry={handleCreateJournalEntry}
          onLinkJournalEntry={handleLinkJournalEntry}
          onNavigateToDiary={onNavigateToDiary}
        />
      )}

      {/* Share Menu */}
      {showShare && activeBoard && (
        <ShareMenu
          board={activeBoard}
          collaborators={collaborators}
          isNightMode={isNightMode}
          onClose={() => setShowShare(false)}
          onTogglePublic={handleTogglePublic}
          onSearchUsers={query => supabaseService.searchProfilesByEmail(query, userId)}
          onInvite={handleInvite}
          onUpdateRole={(id, role) => supabaseService.updateCollaboratorRole(id, role).then(() =>
            setCollaborators(prev => prev.map(c => (c.id === id ? { ...c, role } : c)))
          )}
          onRemoveCollaborator={id => supabaseService.removeCollaborator(id).then(() =>
            setCollaborators(prev => prev.filter(c => c.id !== id))
          )}
        />
      )}
    </div>
  );
};

export default VisionBoardModule;
