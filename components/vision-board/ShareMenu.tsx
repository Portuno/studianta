import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { VisionBoard, BoardCollaborator, CollaboratorRole } from '../../types';

interface ShareMenuProps {
  board: VisionBoard;
  collaborators: BoardCollaborator[];
  isNightMode?: boolean;
  onClose: () => void;
  onTogglePublic: (isPublic: boolean) => Promise<void>;
  onSearchUsers: (query: string) => Promise<{ id: string; email: string; fullName?: string }[]>;
  onInvite: (userId: string, role: CollaboratorRole) => Promise<void>;
  onUpdateRole: (collaboratorId: string, role: CollaboratorRole) => Promise<void>;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
}

const ShareMenu: React.FC<ShareMenuProps> = ({
  board,
  collaborators,
  isNightMode = false,
  onClose,
  onTogglePublic,
  onSearchUsers,
  onInvite,
  onUpdateRole,
  onRemoveCollaborator,
}) => {
  const [isPublic, setIsPublic] = useState(board.isPublic);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; email: string; fullName?: string }[]>([]);
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('viewer');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = board.shareToken
    ? `${window.location.origin}/vision-board/share/${board.shareToken}`
    : '';

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';
  const inputClass = isNightMode
    ? 'bg-[#302B4F]/50 border-[#D4AF37]/20 text-[#E0E1DD]'
    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E]';

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        const results = await onSearchUsers(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearchUsers]);

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      const newValue = !isPublic;
      await onTogglePublic(newValue);
      setIsPublic(newValue);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-[200] backdrop-blur-sm flex items-center justify-center p-4 ${
        isNightMode ? 'bg-black/60' : 'bg-black/50'
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-2xl shadow-2xl max-w-md w-full p-6 ${
          isNightMode ? 'bg-[#302B4F]/95 border border-[#D4AF37]/20' : 'glass-card'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Share2 className={`w-5 h-5 ${textPrimary}`} />
            <h3 className={`font-cinzel text-lg ${textPrimary}`}>Compartir tablero</h3>
          </div>
          <button onClick={onClose} className={textSecondary}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle público */}
        <div className={`flex items-center justify-between p-3 rounded-xl mb-4 ${
          isNightMode ? 'bg-[#1A1A2E]/50' : 'bg-white/40'
        }`}>
          <div>
            <p className={`text-sm font-medium ${textPrimary}`}>Tablero público</p>
            <p className={`text-xs ${textSecondary}`}>Cualquiera con el link puede ver</p>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={loading}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isPublic ? 'bg-[#E35B8F]' : isNightMode ? 'bg-[#302B4F]' : 'bg-[#F8C8DC]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {isPublic && shareUrl && (
          <div className="flex gap-2 mb-4">
            <input
              readOnly
              value={shareUrl}
              className={`flex-1 text-xs rounded-lg border px-3 py-2 ${inputClass}`}
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg bg-[#E35B8F] text-white"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Invitar usuarios */}
        <div className="mb-4">
          <p className={`text-sm font-medium mb-2 ${textPrimary}`}>Invitar colaboradores</p>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por email..."
            className={`w-full text-sm rounded-lg border px-3 py-2 mb-2 ${inputClass}`}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as CollaboratorRole)}
            className={`w-full text-sm rounded-lg border px-3 py-2 mb-2 ${inputClass}`}
          >
            <option value="viewer">Solo Visualizar</option>
            <option value="editor">Puede Editar</option>
          </select>
          {searchResults.length > 0 && (
            <div className={`rounded-lg border overflow-hidden ${isNightMode ? 'border-[#D4AF37]/20' : 'border-[#F8C8DC]'}`}>
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={async () => {
                    await onInvite(user.id, inviteRole);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#E35B8F]/10 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  }`}
                >
                  {user.fullName || user.email}
                  <span className={`ml-2 text-xs ${textSecondary}`}>{user.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista colaboradores */}
        {collaborators.length > 0 && (
          <div>
            <p className={`text-sm font-medium mb-2 ${textPrimary}`}>Colaboradores</p>
            <div className="space-y-2">
              {collaborators.map(collab => (
                <div
                  key={collab.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isNightMode ? 'bg-[#1A1A2E]/50' : 'bg-white/40'
                  }`}
                >
                  <span className={`text-sm ${textPrimary}`}>
                    {collab.fullName || collab.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={collab.role}
                      onChange={e => onUpdateRole(collab.id, e.target.value as CollaboratorRole)}
                      className={`text-xs rounded border px-2 py-1 ${inputClass}`}
                    >
                      <option value="viewer">Visualizar</option>
                      <option value="editor">Editar</option>
                    </select>
                    <button
                      onClick={() => onRemoveCollaborator(collab.id)}
                      className="text-red-400 text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareMenu;
