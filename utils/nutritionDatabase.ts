// Simplified nutrition database with common foods
// Used as fallback when Gemini doesn't provide exact matches

import { FoodItem } from '../types';

interface FoodDatabaseEntry {
  name: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatsPerUnit: number;
  defaultUnit: string;
}

const FOOD_DATABASE: FoodDatabaseEntry[] = [
  // Eggs
  { name: 'huevo', caloriesPerUnit: 70, proteinPerUnit: 6, carbsPerUnit: 0.5, fatsPerUnit: 5, defaultUnit: 'unidades' },
  { name: 'huevos', caloriesPerUnit: 70, proteinPerUnit: 6, carbsPerUnit: 0.5, fatsPerUnit: 5, defaultUnit: 'unidades' },
  { name: 'egg', caloriesPerUnit: 70, proteinPerUnit: 6, carbsPerUnit: 0.5, fatsPerUnit: 5, defaultUnit: 'unidades' },
  
  // Coffee
  { name: 'café', caloriesPerUnit: 2, proteinPerUnit: 0.3, carbsPerUnit: 0, fatsPerUnit: 0, defaultUnit: 'taza' },
  { name: 'cafe', caloriesPerUnit: 2, proteinPerUnit: 0.3, carbsPerUnit: 0, fatsPerUnit: 0, defaultUnit: 'taza' },
  { name: 'coffee', caloriesPerUnit: 2, proteinPerUnit: 0.3, carbsPerUnit: 0, fatsPerUnit: 0, defaultUnit: 'taza' },
  { name: 'café con leche', caloriesPerUnit: 50, proteinPerUnit: 3, carbsPerUnit: 5, fatsPerUnit: 2, defaultUnit: 'taza' },
  
  // Bread
  { name: 'pan', caloriesPerUnit: 80, proteinPerUnit: 3, carbsPerUnit: 15, fatsPerUnit: 1, defaultUnit: 'rebanada' },
  { name: 'tostada', caloriesPerUnit: 80, proteinPerUnit: 3, carbsPerUnit: 15, fatsPerUnit: 1, defaultUnit: 'rebanada' },
  { name: 'bread', caloriesPerUnit: 80, proteinPerUnit: 3, carbsPerUnit: 15, fatsPerUnit: 1, defaultUnit: 'rebanada' },
  
  // Avocado
  { name: 'palta', caloriesPerUnit: 160, proteinPerUnit: 2, carbsPerUnit: 9, fatsPerUnit: 15, defaultUnit: 'unidad' },
  { name: 'aguacate', caloriesPerUnit: 160, proteinPerUnit: 2, carbsPerUnit: 9, fatsPerUnit: 15, defaultUnit: 'unidad' },
  { name: 'avocado', caloriesPerUnit: 160, proteinPerUnit: 2, carbsPerUnit: 9, fatsPerUnit: 15, defaultUnit: 'unidad' },
  
  // Chicken
  { name: 'pollo', caloriesPerUnit: 165, proteinPerUnit: 31, carbsPerUnit: 0, fatsPerUnit: 3.6, defaultUnit: '100g' },
  { name: 'chicken', caloriesPerUnit: 165, proteinPerUnit: 31, carbsPerUnit: 0, fatsPerUnit: 3.6, defaultUnit: '100g' },
  
  // Rice
  { name: 'arroz', caloriesPerUnit: 130, proteinPerUnit: 2.7, carbsPerUnit: 28, fatsPerUnit: 0.3, defaultUnit: '100g' },
  { name: 'rice', caloriesPerUnit: 130, proteinPerUnit: 2.7, carbsPerUnit: 28, fatsPerUnit: 0.3, defaultUnit: '100g' },
  
  // Banana
  { name: 'banana', caloriesPerUnit: 105, proteinPerUnit: 1.3, carbsPerUnit: 27, fatsPerUnit: 0.4, defaultUnit: 'unidad' },
  { name: 'plátano', caloriesPerUnit: 105, proteinPerUnit: 1.3, carbsPerUnit: 27, fatsPerUnit: 0.4, defaultUnit: 'unidad' },
  
  // Apple
  { name: 'manzana', caloriesPerUnit: 95, proteinPerUnit: 0.5, carbsPerUnit: 25, fatsPerUnit: 0.3, defaultUnit: 'unidad' },
  { name: 'apple', caloriesPerUnit: 95, proteinPerUnit: 0.5, carbsPerUnit: 25, fatsPerUnit: 0.3, defaultUnit: 'unidad' },
  
  // Milk
  { name: 'leche', caloriesPerUnit: 150, proteinPerUnit: 8, carbsPerUnit: 12, fatsPerUnit: 8, defaultUnit: 'taza' },
  { name: 'milk', caloriesPerUnit: 150, proteinPerUnit: 8, carbsPerUnit: 12, fatsPerUnit: 8, defaultUnit: 'taza' },
  
  // Yogurt
  { name: 'yogur', caloriesPerUnit: 150, proteinPerUnit: 10, carbsPerUnit: 15, fatsPerUnit: 4, defaultUnit: 'taza' },
  { name: 'yogurt', caloriesPerUnit: 150, proteinPerUnit: 10, carbsPerUnit: 15, fatsPerUnit: 4, defaultUnit: 'taza' },
];

export const findFoodInDatabase = (foodName: string): FoodDatabaseEntry | null => {
  const normalized = foodName.toLowerCase().trim();
  return FOOD_DATABASE.find(food => 
    food.name === normalized || 
    normalized.includes(food.name) ||
    food.name.includes(normalized)
  ) || null;
};

export const estimateMacrosFromDatabase = (foodName: string, quantity: number, unit?: string): FoodItem | null => {
  const dbEntry = findFoodInDatabase(foodName);
  if (!dbEntry) return null;

  const finalUnit = unit || dbEntry.defaultUnit;
  const multiplier = quantity;

  return {
    name: foodName,
    quantity,
    unit: finalUnit,
    calories: Math.round(dbEntry.caloriesPerUnit * multiplier),
    protein: Math.round(dbEntry.proteinPerUnit * multiplier * 10) / 10,
    carbs: Math.round(dbEntry.carbsPerUnit * multiplier * 10) / 10,
    fats: Math.round(dbEntry.fatsPerUnit * multiplier * 10) / 10,
  };
};
