import React, { useState } from 'react';
import { Trophy, TrendingUp, PiggyBank } from 'lucide-react';
import { BoardBlock, UserAchievementSaving } from '../../types';

interface AchievementsChestProps {
  blocks: BoardBlock[];
  achievements: UserAchievementSaving[];
  canEdit: boolean;
  isNightMode?: boolean;
  onUpdateAchievement: (
    achievementId: string,
    updates: { monetaryGain?: number; savedAmount?: number }
  ) => Promise<void>;
}

const AchievementsChest: React.FC<AchievementsChestProps> = ({
  blocks,
  achievements,
  canEdit,
  isNightMode = false,
  onUpdateAchievement,
}) => {
  const achievedBlocks = blocks.filter(b => b.status === 'conseguido');

  const totalGain = achievements.reduce((sum, a) => sum + a.monetaryGain, 0);
  const totalSaved = achievements.reduce((sum, a) => sum + a.savedAmount, 0);

  const textPrimary = isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]';
  const textSecondary = isNightMode ? 'text-[#E0E1DD]/60' : 'text-[#8B5E75]';
  const inputClass = isNightMode
    ? 'bg-[#302B4F]/50 border-[#D4AF37]/20 text-[#E0E1DD]'
    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E]';

  if (achievedBlocks.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed ${
          isNightMode ? 'border-[#D4AF37]/30 text-[#E0E1DD]/60' : 'border-[#D4AF37]/40 text-[#8B5E75]'
        }`}
      >
        <Trophy className="w-12 h-12 text-[#D4AF37]/50 mb-3" />
        <p className="font-cinzel text-lg mb-1">Cofre de Logros vacío</p>
        <p className="text-sm text-center px-4">
          Cuando consigas una meta, aparecerá aquí con tus ganancias y ahorros
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Totales */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-xl p-4 border ${
            isNightMode ? 'border-[#D4AF37]/30 bg-[#302B4F]/50' : 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <span className={`text-xs ${textSecondary}`}>Ganancias totales</span>
          </div>
          <p className={`font-cinzel text-2xl text-[#D4AF37]`}>{totalGain.toFixed(2)} €</p>
        </div>
        <div
          className={`rounded-xl p-4 border ${
            isNightMode ? 'border-[#D4AF37]/30 bg-[#302B4F]/50' : 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-4 h-4 text-[#D4AF37]" />
            <span className={`text-xs ${textSecondary}`}>Ahorros totales</span>
          </div>
          <p className={`font-cinzel text-2xl text-[#D4AF37]`}>{totalSaved.toFixed(2)} €</p>
        </div>
      </div>

      {/* Grid de logros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievedBlocks.map(block => {
          const achievement = achievements.find(a => a.blockId === block.id);
          return (
            <AchievementCard
              key={block.id}
              block={block}
              achievement={achievement}
              canEdit={canEdit}
              isNightMode={isNightMode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputClass={inputClass}
              onUpdateAchievement={onUpdateAchievement}
            />
          );
        })}
      </div>
    </div>
  );
};

interface AchievementCardProps {
  block: BoardBlock;
  achievement?: UserAchievementSaving;
  canEdit: boolean;
  isNightMode: boolean;
  textPrimary: string;
  textSecondary: string;
  inputClass: string;
  onUpdateAchievement: (
    achievementId: string,
    updates: { monetaryGain?: number; savedAmount?: number }
  ) => Promise<void>;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  block,
  achievement,
  canEdit,
  isNightMode,
  textPrimary,
  textSecondary,
  inputClass,
  onUpdateAchievement,
}) => {
  const [gain, setGain] = useState(achievement?.monetaryGain ?? 0);
  const [saved, setSaved] = useState(achievement?.savedAmount ?? 0);

  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-lg ${
        isNightMode ? 'bg-[#302B4F]/80' : 'bg-white/80'
      }`}
    >
      <div className="relative h-32">
        {block.imageUrl ? (
          <img src={block.imageUrl} alt={block.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/30 to-[#E35B8F]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/60 to-transparent" />
        <div className="absolute top-2 right-2">
          <Trophy className="w-6 h-6 text-[#D4AF37] drop-shadow" />
        </div>
        <h3 className="absolute bottom-2 left-3 font-cinzel text-white font-semibold">{block.name}</h3>
      </div>

      <div className="p-3 space-y-2">
        {achievement && (
          <p className={`text-[10px] ${textSecondary}`}>
            Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString('es-ES')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={`text-[10px] ${textSecondary}`}>Ganancia €</label>
            <input
              type="number"
              min={0}
              value={gain}
              onChange={e => setGain(parseFloat(e.target.value) || 0)}
              onBlur={() => {
                if (canEdit && achievement) {
                  onUpdateAchievement(achievement.id, { monetaryGain: gain });
                }
              }}
              readOnly={!canEdit}
              className={`w-full text-xs rounded border px-2 py-1 mt-0.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className={`text-[10px] ${textSecondary}`}>Ahorro €</label>
            <input
              type="number"
              min={0}
              value={saved}
              onChange={e => setSaved(parseFloat(e.target.value) || 0)}
              onBlur={() => {
                if (canEdit && achievement) {
                  onUpdateAchievement(achievement.id, { savedAmount: saved });
                }
              }}
              readOnly={!canEdit}
              className={`w-full text-xs rounded border px-2 py-1 mt-0.5 ${inputClass}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsChest;
