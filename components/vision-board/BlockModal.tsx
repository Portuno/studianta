import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, Trophy, ExternalLink } from 'lucide-react';
import {
  BoardBlock, BlockProgressLog, ChecklistItem, BlockLink,
  JournalEntry, MoodType,
} from '../../types';
import { generateId } from './utils';
import JournalLinkPanel from './JournalLinkPanel';

interface BlockModalProps {
  block: BoardBlock;
  progressLogs: BlockProgressLog[];
  canEdit: boolean;
  isNightMode?: boolean;
  embedded?: boolean;
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

const BlockModal: React.FC<BlockModalProps> = ({
  block,
  progressLogs,
  canEdit,
  isNightMode = false,
  embedded = false,
  journalEntries,
  onClose,
  onSave,
  onDelete,
  onAddProgressLog,
  onMarkAchieved,
  onCreateJournalEntry,
  onLinkJournalEntry,
  onNavigateToDiary,
}) => {
  const [name, setName] = useState(block.name);
  const [description, setDescription] = useState(block.description);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(block.checklist);
  const [links, setLinks] = useState<BlockLink[]>(block.links);
  const [moodTags, setMoodTags] = useState<string[]>(block.moodTags);
  const [newTag, setNewTag] = useState('');
  const [newLogText, setNewLogText] = useState('');
  const [showAchieveModal, setShowAchieveModal] = useState(false);
  const [monetaryGain, setMonetaryGain] = useState(0);
  const [savedAmount, setSavedAmount] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(block.name);
    setDescription(block.description);
    setChecklist(block.checklist);
    setLinks(block.links);
    setMoodTags(block.moodTags);
  }, [block]);

  const debouncedSave = useCallback((updates: Partial<BoardBlock>) => {
    if (!canEdit) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => onSave(updates), 500);
  }, [canEdit, onSave]);

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';
  const inputClass = isNightMode
    ? 'bg-[#302B4F]/50 border-[#D4AF37]/20 text-[#E0E1DD] placeholder:text-[#E0E1DD]/40'
    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50';

  const updateChecklist = (updated: ChecklistItem[]) => {
    setChecklist(updated);
    debouncedSave({ checklist: updated });
  };

  const updateLinks = (updated: BlockLink[]) => {
    setLinks(updated);
    debouncedSave({ links: updated });
  };

  const updateMoodTags = (updated: string[]) => {
    setMoodTags(updated);
    debouncedSave({ moodTags: updated });
  };

  const formContent = (
    <>
          {block.imageUrl && !embedded && (
            <div className="relative h-40 overflow-hidden rounded-t-2xl">
              <img src={block.imageUrl} alt={block.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          <div className={`space-y-4 ${embedded ? 'p-4' : 'p-5'}`}>
            <div className="flex items-start justify-between">
              <input
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  debouncedSave({ name: e.target.value });
                }}
                readOnly={!canEdit}
                className={`font-cinzel text-xl font-semibold bg-transparent border-none outline-none w-full ${textPrimary}`}
                placeholder="Nombre del área"
              />
              {!embedded && (
                <button onClick={onClose} className={`p-1 ${textSecondary} hover:opacity-70`}>
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <textarea
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                debouncedSave({ description: e.target.value });
              }}
              readOnly={!canEdit}
              rows={3}
              placeholder="Descripción"
              className={`w-full rounded-lg border px-3 py-2 text-sm resize-none ${inputClass}`}
            />

            {/* Checklist */}
            <div>
              <h4 className={`font-cinzel text-sm mb-2 ${textPrimary}`}>Requisitos</h4>
              <div className="space-y-2">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled={!canEdit}
                      onChange={e => {
                        const updated = checklist.map(c =>
                          c.id === item.id ? { ...c, done: e.target.checked } : c
                        );
                        updateChecklist(updated);
                      }}
                      className="accent-[#E35B8F]"
                    />
                    <input
                      value={item.text}
                      onChange={e => {
                        const updated = checklist.map(c =>
                          c.id === item.id ? { ...c, text: e.target.value } : c
                        );
                        setChecklist(updated);
                        debouncedSave({ checklist: updated });
                      }}
                      readOnly={!canEdit}
                      className={`flex-1 text-sm bg-transparent border-b outline-none ${inputClass} border-0 border-b`}
                    />
                    {canEdit && (
                      <button
                        onClick={() => updateChecklist(checklist.filter(c => c.id !== item.id))}
                        className="text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <button
                    onClick={() =>
                      updateChecklist([...checklist, { id: generateId(), text: '', done: false }])
                    }
                    className={`flex items-center gap-1 text-xs ${textSecondary}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir tarea
                  </button>
                )}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className={`font-cinzel text-sm mb-2 ${textPrimary}`}>Links</h4>
              <div className="space-y-2">
                {links.map(link => (
                  <div key={link.id} className="flex items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E35B8F] flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <input
                      value={link.url}
                      onChange={e => {
                        const updated = links.map(l =>
                          l.id === link.id ? { ...l, url: e.target.value } : l
                        );
                        setLinks(updated);
                        debouncedSave({ links: updated });
                      }}
                      readOnly={!canEdit}
                      placeholder="https://..."
                      className={`flex-1 text-sm rounded-lg border px-2 py-1 ${inputClass}`}
                    />
                    {canEdit && (
                      <button onClick={() => updateLinks(links.filter(l => l.id !== link.id))}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <button
                    onClick={() =>
                      updateLinks([...links, { id: generateId(), url: '', label: '' }])
                    }
                    className={`flex items-center gap-1 text-xs ${textSecondary}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir link
                  </button>
                )}
              </div>
            </div>

            {/* Mood tags */}
            <div>
              <h4 className={`font-cinzel text-sm mb-2 ${textPrimary}`}>Deseos / Mood</h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {moodTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#E35B8F]/20 text-[#E35B8F]"
                  >
                    {tag}
                    {canEdit && (
                      <button onClick={() => updateMoodTags(moodTags.filter(t => t !== tag))}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        updateMoodTags([...moodTags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                    placeholder="Añadir etiqueta"
                    className={`flex-1 text-sm rounded-lg border px-2 py-1 ${inputClass}`}
                  />
                </div>
              )}
            </div>

            {/* Progress logs */}
            <div>
              <h4 className={`font-cinzel text-sm mb-2 ${textPrimary}`}>Historial de avances</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                {progressLogs.map(log => (
                  <div
                    key={log.id}
                    className={`text-xs p-2 rounded-lg ${
                      isNightMode ? 'bg-[#1A1A2E]/50' : 'bg-white/40'
                    }`}
                  >
                    <p className={textPrimary}>{log.text}</p>
                    <p className={textSecondary}>
                      {new Date(log.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <input
                    value={newLogText}
                    onChange={e => setNewLogText(e.target.value)}
                    placeholder="Nota breve de avance..."
                    className={`flex-1 text-sm rounded-lg border px-2 py-1.5 ${inputClass}`}
                  />
                  <button
                    onClick={async () => {
                      if (!newLogText.trim()) return;
                      await onAddProgressLog(newLogText.trim());
                      setNewLogText('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-[#E35B8F] text-white"
                  >
                    Añadir
                  </button>
                </div>
              )}
            </div>

            <JournalLinkPanel
              blockId={block.id}
              blockName={name}
              journalEntries={journalEntries}
              canEdit={canEdit}
              isNightMode={isNightMode}
              onCreateEntry={onCreateJournalEntry}
              onLinkEntry={onLinkJournalEntry}
              onNavigateToDiary={onNavigateToDiary}
            />

            {canEdit && block.status === 'en_proceso' && (
              <div className="flex gap-2 pt-2 border-t border-[#F8C8DC]/30">
                <button
                  onClick={() => setShowAchieveModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90"
                >
                  <Trophy className="w-4 h-4" />
                  Marcar como conseguido
                </button>
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="px-4 py-2 rounded-lg text-sm text-red-400 border border-red-400/30"
                  >
                    Eliminar bloque
                  </button>
                )}
              </div>
            )}
          </div>
    </>
  );

  return (
    <>
      {embedded ? (
        formContent
      ) : (
        <div
          className={`fixed inset-0 z-[200] backdrop-blur-sm flex items-center justify-center p-4 ${
            isNightMode ? 'bg-black/60' : 'bg-black/50'
          }`}
          onClick={onClose}
        >
          <div
            className={`rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${
              isNightMode ? 'bg-[#302B4F]/95 border border-[#D4AF37]/20' : 'glass-card'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {formContent}
          </div>
        </div>
      )}

      {showAchieveModal && (
        <div
          className="fixed inset-0 z-[210] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowAchieveModal(false)}
        >
          <div
            className={`rounded-2xl p-6 max-w-sm w-full ${isNightMode ? 'bg-[#302B4F]' : 'glass-card'}`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`font-cinzel text-lg mb-4 ${textPrimary}`}>¡Meta conseguida!</h3>
            <div className="space-y-3">
              <div>
                <label className={`text-xs ${textSecondary}`}>Ganancias adquiridas (€)</label>
                <input
                  type="number"
                  min={0}
                  value={monetaryGain}
                  onChange={e => setMonetaryGain(parseFloat(e.target.value) || 0)}
                  className={`w-full mt-1 rounded-lg border px-3 py-2 text-sm ${inputClass}`}
                />
              </div>
              <div>
                <label className={`text-xs ${textSecondary}`}>Dinero ahorrado (€)</label>
                <input
                  type="number"
                  min={0}
                  value={savedAmount}
                  onChange={e => setSavedAmount(parseFloat(e.target.value) || 0)}
                  className={`w-full mt-1 rounded-lg border px-3 py-2 text-sm ${inputClass}`}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  await onMarkAchieved({ monetaryGain, savedAmount });
                  setShowAchieveModal(false);
                  onClose();
                }}
                className="flex-1 py-2 rounded-lg bg-[#D4AF37] text-white text-sm"
              >
                Confirmar logro
              </button>
              <button
                onClick={() => setShowAchieveModal(false)}
                className={`px-4 py-2 text-sm ${textSecondary}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockModal;
