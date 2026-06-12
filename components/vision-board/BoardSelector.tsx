import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { VisionBoard } from '../../types';

interface BoardSelectorProps {
  boards: VisionBoard[];
  activeBoardId: string | null;
  canCreate: boolean;
  isNightMode?: boolean;
  onSelect: (boardId: string) => void;
  onCreate: (title: string) => Promise<void>;
}

const BoardSelector: React.FC<BoardSelectorProps> = ({
  boards,
  activeBoardId,
  canCreate,
  isNightMode = false,
  onSelect,
  onCreate,
}) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const activeBoard = boards.find(b => b.id === activeBoardId);

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim());
    setNewTitle('');
    setCreating(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
          isNightMode
            ? 'border-[#D4AF37]/20 text-[#E0E1DD] bg-[#302B4F]/50'
            : 'border-[#F8C8DC] text-[#4A233E] bg-white/60'
        }`}
      >
        <span className="font-cinzel truncate max-w-[160px]">
          {activeBoard?.title || 'Seleccionar tablero'}
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full left-0 mt-1 z-20 min-w-[220px] rounded-xl shadow-lg border overflow-hidden ${
              isNightMode
                ? 'bg-[#302B4F] border-[#D4AF37]/20'
                : 'bg-white border-[#F8C8DC]'
            }`}
          >
            {boards.map(board => (
              <button
                key={board.id}
                onClick={() => {
                  onSelect(board.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#E35B8F]/10 ${
                  board.id === activeBoardId ? 'bg-[#E35B8F]/10 font-medium' : ''
                } ${textPrimary}`}
              >
                {board.title}
              </button>
            ))}

            {canCreate && (
              <div className={`border-t ${isNightMode ? 'border-[#D4AF37]/20' : 'border-[#F8C8DC]'}`}>
                {creating ? (
                  <div className="p-3 space-y-2">
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Nombre del tablero"
                      className={`w-full text-sm rounded-lg border px-2 py-1.5 ${
                        isNightMode
                          ? 'bg-[#1A1A2E] border-[#D4AF37]/20 text-[#E0E1DD]'
                          : 'bg-white border-[#F8C8DC] text-[#4A233E]'
                      }`}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreate}
                        className="flex-1 py-1.5 rounded-lg text-xs bg-[#E35B8F] text-white"
                      >
                        Crear
                      </button>
                      <button onClick={() => setCreating(false)} className={`text-xs ${textSecondary}`}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreating(true)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#E35B8F]/10 ${textPrimary}`}
                  >
                    <Plus className="w-4 h-4 text-[#E35B8F]" />
                    Nuevo tablero
                  </button>
                )}
              </div>
            )}

            {!canCreate && (
              <p className={`px-4 py-2 text-xs ${textSecondary}`}>
                Límite de 3 tableros (plan Free)
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BoardSelector;
