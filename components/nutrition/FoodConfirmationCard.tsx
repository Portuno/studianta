import React, { useState } from 'react';
import { FoodItem } from '../../types';
import { getIcon } from '../../constants';

interface FoodConfirmationCardProps {
  foods: FoodItem[];
  onConfirm: (foods: FoodItem[]) => void;
  onCancel: () => void;
  isNightMode?: boolean;
}

const FoodConfirmationCard: React.FC<FoodConfirmationCardProps> = ({
  foods,
  onConfirm,
  onCancel,
  isNightMode = false,
}) => {
  const [editedFoods, setEditedFoods] = useState<FoodItem[]>(foods);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updated = [...editedFoods];
    const food = updated[index];
    const ratio = newQuantity / food.quantity;
    
    updated[index] = {
      ...food,
      quantity: newQuantity,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fats: Math.round(food.fats * ratio * 10) / 10,
    };
    
    setEditedFoods(updated);
  };

  const totalCalories = editedFoods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = editedFoods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = editedFoods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFats = editedFoods.reduce((sum, f) => sum + f.fats, 0);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isNightMode ? 'bg-black/70' : 'bg-black/50'}`}>
      <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isNightMode ? 'bg-[#1A1A2E]' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
              Confirma los alimentos
            </h2>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg hover:bg-opacity-20 ${isNightMode ? 'text-gray-400 hover:bg-white' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label="Cerrar"
            >
              {getIcon('x', 'w-5 h-5')}
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {editedFoods.map((food, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${isNightMode ? 'border-gray-700 bg-[#16213E]' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                    {food.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={food.quantity}
                      onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0.1)}
                      className={`w-20 px-2 py-1 rounded border text-sm ${isNightMode ? 'bg-[#0F1624] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    <span className={`text-sm ${isNightMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {food.unit}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Cal:</span>
                    <span className={`ml-1 font-semibold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                      {food.calories}
                    </span>
                  </div>
                  <div>
                    <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Pro:</span>
                    <span className={`ml-1 font-semibold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                      {food.protein}g
                    </span>
                  </div>
                  <div>
                    <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Carbs:</span>
                    <span className={`ml-1 font-semibold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                      {food.carbs}g
                    </span>
                  </div>
                  <div>
                    <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Grasas:</span>
                    <span className={`ml-1 font-semibold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                      {food.fats}g
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={`p-4 rounded-lg mb-6 ${isNightMode ? 'bg-[#16213E]' : 'bg-gray-100'}`}>
            <h3 className={`font-semibold mb-2 ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
              Totales
            </h3>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Calorías:</span>
                <span className={`ml-1 font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalCalories}
                </span>
              </div>
              <div>
                <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Proteínas:</span>
                <span className={`ml-1 font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(totalProtein * 10) / 10}g
                </span>
              </div>
              <div>
                <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Carbs:</span>
                <span className={`ml-1 font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(totalCarbs * 10) / 10}g
                </span>
              </div>
              <div>
                <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Grasas:</span>
                <span className={`ml-1 font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(totalFats * 10) / 10}g
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isNightMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(editedFoods)}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-[#E35B8F] text-white hover:bg-[#D14A7A] transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodConfirmationCard;
