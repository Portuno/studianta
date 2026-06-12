import React, { useState } from 'react';
import { BookOpen, Link2 } from 'lucide-react';
import { JournalEntry, MoodType } from '../../types';

interface JournalLinkPanelProps {
  blockId: string;
  blockName: string;
  journalEntries: JournalEntry[];
  canEdit: boolean;
  isNightMode?: boolean;
  onCreateEntry: (content: string, mood: MoodType) => Promise<void>;
  onLinkEntry: (entryId: string) => Promise<void>;
  onNavigateToDiary?: () => void;
}

const MOODS: MoodType[] = ['Radiante', 'Enfocada', 'Equilibrada', 'Agotada', 'Estresada'];

const JournalLinkPanel: React.FC<JournalLinkPanelProps> = ({
  blockName,
  journalEntries,
  canEdit,
  isNightMode = false,
  onCreateEntry,
  onLinkEntry,
  onNavigateToDiary,
}) => {
  const [mode, setMode] = useState<'none' | 'write' | 'link'>('none');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('Enfocada');
  const [saving, setSaving] = useState(false);

  const unlinkableEntries = journalEntries.filter(e => !e.blockId);

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';
  const inputClass = isNightMode
    ? 'bg-[#302B4F]/50 border-[#D4AF37]/20 text-[#E0E1DD]'
    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E]';

  const handleWrite = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onCreateEntry(content.trim(), mood);
      setContent('');
      setMode('none');
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) return null;

  return (
    <div className={`rounded-xl border p-4 ${isNightMode ? 'border-[#D4AF37]/20' : 'border-[#F8C8DC]'}`}>
      <h4 className={`font-cinzel text-sm mb-3 ${textPrimary}`}>Diario vinculado</h4>
      <p className={`text-xs mb-3 ${textSecondary}`}>
        Conecta tus reflexiones con la meta &quot;{blockName}&quot;
      </p>

      {mode === 'none' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('write')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#E35B8F] text-white hover:bg-[#E35B8F]/90"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Escribir en el Diario
          </button>
          <button
            onClick={() => setMode('link')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
              isNightMode ? 'border-[#D4AF37]/30 text-[#E0E1DD]' : 'border-[#F8C8DC] text-[#4A233E]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Vincular entrada existente
          </button>
        </div>
      )}

      {mode === 'write' && (
        <div className="space-y-3">
          <select
            value={mood}
            onChange={e => setMood(e.target.value as MoodType)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${inputClass}`}
          >
            {MOODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="¿Qué piensas sobre esta meta?"
            rows={4}
            className={`w-full rounded-lg border px-3 py-2 text-sm resize-none ${inputClass}`}
          />
          <div className="flex gap-2">
            <button
              onClick={handleWrite}
              disabled={saving || !content.trim()}
              className="px-4 py-2 rounded-lg text-xs bg-[#E35B8F] text-white disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar entrada'}
            </button>
            {onNavigateToDiary && (
              <button
                onClick={onNavigateToDiary}
                className={`px-4 py-2 rounded-lg text-xs border ${
                  isNightMode ? 'border-[#D4AF37]/30 text-[#E0E1DD]' : 'border-[#F8C8DC] text-[#4A233E]'
                }`}
              >
                Ver en Diario
              </button>
            )}
            <button onClick={() => setMode('none')} className={`px-3 py-2 text-xs ${textSecondary}`}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === 'link' && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {unlinkableEntries.length === 0 ? (
            <p className={`text-xs ${textSecondary}`}>No hay entradas disponibles para vincular</p>
          ) : (
            unlinkableEntries.map(entry => (
              <button
                key={entry.id}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onLinkEntry(entry.id);
                    setMode('none');
                  } finally {
                    setSaving(false);
                  }
                }}
                className={`w-full text-left p-2 rounded-lg text-xs border transition-colors ${
                  isNightMode
                    ? 'border-[#D4AF37]/20 hover:bg-[#302B4F]/50 text-[#E0E1DD]'
                    : 'border-[#F8C8DC] hover:bg-white/60 text-[#4A233E]'
                }`}
              >
                <span className="font-medium">{entry.mood}</span>
                <span className={`ml-2 ${textSecondary}`}>
                  {new Date(entry.date).toLocaleDateString('es-ES')}
                </span>
                <p className={`truncate mt-0.5 ${textSecondary}`}>{entry.content.slice(0, 80)}</p>
              </button>
            ))
          )}
          <button onClick={() => setMode('none')} className={`text-xs ${textSecondary} mt-2`}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default JournalLinkPanel;
