import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, Plus, LayoutGrid, Trophy } from 'lucide-react';
import {
  VisionBoard, BoardBlock, BoardCollaborator, BlockProgressLog,
  UserAchievementSaving, JournalEntry, MoodType, CollaboratorRole, CanvasElement,
} from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { getBoardPermissions, generateId } from './utils';
import InteractiveCanvas, { getViewportCenter } from './InteractiveCanvas';
import BlockBottomSheet from './BlockBottomSheet';
import ShareMenu from './ShareMenu';
import BoardSelector from './BoardSelector';
import AchievementsChest from './AchievementsChest';
import CanvasActionsMenu from './CanvasActionsMenu';

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
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [blocks, setBlocks] = useState<BoardBlock[]>([]);
  const [collaborators, setCollaborators] = useState<BoardCollaborator[]>([]);
  const [progressLogs, setProgressLogs] = useState<Record<string, BlockProgressLog[]>>({});
  const [achievements, setAchievements] = useState<UserAchievementSaving[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BoardBlock | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeBoard = boards.find(b => b.id === activeBoardId) || null;
  const permissions = getBoardPermissions(activeBoard, userId, collaborators);
  const ownedBoards = boards.filter(b => b.userId === userId);
  const canCreateBoard = userTier === 'Premium' || ownedBoards.length < 3;

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';

  const loadBoardData = useCallback(async (boardId: string) => {
    const [boardData, blocksData, collabData, achievementsData] = await Promise.all([
      supabaseService.getVisionBoard(boardId),
      supabaseService.getBoardBlocks(boardId, true),
      supabaseService.getCollaborators(boardId),
      supabaseService.getAchievementsSavings(userId),
    ]);
    setCanvasElements(boardData?.canvasElements || []);
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

  const debouncedSaveCanvas = useCallback((elements: CanvasElement[]) => {
    if (!activeBoardId) return;
    if (canvasSaveTimer.current) clearTimeout(canvasSaveTimer.current);
    canvasSaveTimer.current = setTimeout(async () => {
      try {
        await supabaseService.updateCanvasElements(activeBoardId, elements);
      } catch (err) {
        console.error('Error saving canvas:', err);
      }
    }, 600);
  }, [activeBoardId]);

  const handleElementsChange = (elements: CanvasElement[]) => {
    setCanvasElements(elements);
    debouncedSaveCanvas(elements);
  };

  const getDropPosition = () => {
    const center = { x: 120, y: 120 };
    if (typeof window !== 'undefined') {
      return getViewportCenter(0, 0, window.innerWidth, window.innerHeight * 0.5);
    }
    return center;
  };

  const handleAddText = () => {
    const pos = getDropPosition();
    const newEl: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 80,
      zIndex: canvasElements.length + 1,
      text: 'Nuevo texto',
      fontFamily: 'cinzel',
      fontSize: 20,
      fontWeight: 'bold',
      color: isNightMode ? '#E0E1DD' : '#4A233E',
      blockId: null,
    };
    const next = [...canvasElements, newEl];
    setCanvasElements(next);
    debouncedSaveCanvas(next);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBoardId) return;

    try {
      const elementId = generateId();
      const imageUrl = await supabaseService.uploadVisionBoardImage(
        userId, activeBoardId, elementId, file, 'elements'
      );
      const pos = getDropPosition();
      const newEl: CanvasElement = {
        id: elementId,
        type: 'image',
        x: pos.x,
        y: pos.y,
        width: isMobile ? 160 : 220,
        height: isMobile ? 160 : 220,
        zIndex: canvasElements.length + 1,
        imageUrl,
        blockId: null,
      };
      const next = [...canvasElements, newEl];
      setCanvasElements(next);
      await supabaseService.updateCanvasElements(activeBoardId, next);
    } catch (err) {
      console.error('Error adding image:', err);
      alert(err instanceof Error ? err.message : 'Error al subir imagen');
    }
    e.target.value = '';
  };

  const handleLinkSelection = async (elementIds: string[]) => {
    if (!activeBoardId || elementIds.length < 2) return;
    const name =
      canvasElements.find(e => elementIds.includes(e.id) && e.type === 'text')?.text ||
      'Nueva meta';
    try {
      const { block, elements } = await supabaseService.linkElementsToBlock(
        activeBoardId, elementIds, canvasElements, name.slice(0, 80)
      );
      setCanvasElements(elements);
      setBlocks(prev => [...prev, block]);
      setSelectedBlock(block);
    } catch (err) {
      console.error('Error linking elements:', err);
      alert('No se pudo enlazar los elementos');
    }
  };

  const handleSelectBoard = async (boardId: string) => {
    setActiveBoardId(boardId);
    setSelectedBlock(null);
    await loadBoardData(boardId);
  };

  const handleCreateBoard = async (title: string) => {
    const newBoard = await supabaseService.createVisionBoard(userId, title);
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
    setCanvasElements([]);
    await loadBoardData(newBoard.id);
  };

  const handleSaveBlock = async (blockId: string, updates: Partial<BoardBlock>) => {
    const updated = await supabaseService.updateBoardBlock(blockId, updates);
    setBlocks(prev => prev.map(b => (b.id === blockId ? updated : b)));
    if (selectedBlock?.id === blockId) setSelectedBlock(updated);
  };

  const handleDeleteBlock = async (blockId: string) => {
    await supabaseService.deleteBoardBlock(blockId);
    const nextElements = canvasElements.map(el =>
      el.blockId === blockId ? { ...el, blockId: null } : el
    );
    setCanvasElements(nextElements);
    if (activeBoardId) await supabaseService.updateCanvasElements(activeBoardId, nextElements);
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
              onClick={() => setShowActionsMenu(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-[#E35B8F] text-white hover:bg-[#E35B8F]/90"
            >
              <Plus className="w-4 h-4" />
              {!isMobile && 'Añadir'}
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

      <div className={`flex gap-1 p-1 rounded-xl ${isNightMode ? 'bg-[#302B4F]/50' : 'bg-white/40'}`}>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'board' ? 'bg-[#E35B8F] text-white' : textSecondary
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Tablero Activo
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'achievements' ? 'bg-[#D4AF37] text-white' : textSecondary
          }`}
        >
          <Trophy className="w-4 h-4" />
          Cofre de Logros
        </button>
      </div>

      {activeTab === 'board' ? (
        <InteractiveCanvas
          elements={canvasElements}
          blocks={blocks}
          canEdit={permissions.canEdit}
          isMobile={isMobile}
          isNightMode={isNightMode}
          onElementsChange={handleElementsChange}
          onOpenBlock={setSelectedBlock}
          onLinkSelection={handleLinkSelection}
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

      <CanvasActionsMenu
        open={showActionsMenu}
        isNightMode={isNightMode}
        onClose={() => setShowActionsMenu(false)}
        onAddImage={() => fileInputRef.current?.click()}
        onAddText={handleAddText}
      />

      {selectedBlock && (
        <BlockBottomSheet
          block={selectedBlock}
          progressLogs={progressLogs[selectedBlock.id] || []}
          canEdit={permissions.canEdit}
          isMobile={isMobile}
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
