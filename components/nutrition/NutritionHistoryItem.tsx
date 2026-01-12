import React from 'react';
import { NutritionEntry } from '../../types';
import { getIcon } from '../../constants';

interface NutritionHistoryItemProps {
  entry: NutritionEntry;
  onEdit?: (entry: NutritionEntry) => void;
  onDelete?: (entryId: string) => void;
  isNightMode?: boolean;
}

const NutritionHistoryItem: React.FC<NutritionHistoryItemProps> = ({
  entry,
  onEdit,
  onDelete,
  isNightMode = false,
}) => {
  const time = entry.time.substring(0, 5); // HH:mm
  const foodCount = entry.foods.length;
  
  const getEnergyColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`p-4 rounded-lg border ${isNightMode ? 'border-gray-700 bg-[#16213E]' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start gap-4">
        {/* Thumbnail or icon */}
        <div className="flex-shrink-0">
          {entry.photo_url ? (
            <img
              src={entry.photo_url}
              alt="Comida"
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isNightMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {getIcon('apple', 'w-8 h-8 text-gray-400')}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                  {time}
                </span>
                <span className={`text-sm ${isNightMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {foodCount} alimento{foodCount !== 1 ? 's' : ''}
                </span>
              </div>
              {entry.input_text && (
                <p className={`text-sm truncate ${isNightMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {entry.input_text}
                </p>
              )}
            </div>
            
            {/* Energy score badge */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getEnergyColor(entry.energy_score)} flex items-center justify-center text-white font-bold text-sm`}>
              {entry.energy_score}
            </div>
          </div>

          {/* Macros summary */}
          <div className="flex items-center gap-4 text-xs mb-2">
            <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>
              {Math.round(entry.total_calories)} cal
            </span>
            <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>
              P: {Math.round(entry.total_protein)}g
            </span>
            <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>
              C: {Math.round(entry.total_carbs)}g
            </span>
            <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>
              G: {Math.round(entry.total_fats)}g
            </span>
          </div>

          {/* Brain food tags */}
          {entry.brain_food_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.brain_food_tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded text-xs ${isNightMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex gap-2 mt-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(entry)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    isNightMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(entry.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    isNightMode
                      ? 'bg-red-900 text-red-200 hover:bg-red-800'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutritionHistoryItem;
