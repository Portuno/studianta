// Classifies foods as "brain food" based on nutritional properties

import { FoodItem } from '../types';

const OMEGA3_FOODS = ['pescado', 'salmón', 'atún', 'sardina', 'nuez', 'nueces', 'semilla', 'chía', 'linaza', 'fish', 'salmon', 'tuna', 'walnut', 'seed'];
const ANTIOXIDANT_FOODS = ['arándano', 'blueberry', 'frutilla', 'strawberry', 'mora', 'blackberry', 'espinaca', 'spinach', 'brócoli', 'broccoli', 'tomate', 'tomato', 'uva', 'grape', 'té', 'tea', 'verde', 'green'];
const HYDRATION_FOODS = ['agua', 'water', 'sandía', 'watermelon', 'melón', 'melon', 'pepino', 'cucumber', 'naranja', 'orange', 'limón', 'lemon'];
const COMPLEX_CARBS = ['avena', 'oatmeal', 'quinoa', 'arroz integral', 'brown rice', 'pasta integral', 'whole wheat', 'pan integral', 'whole grain'];
const PROTEIN_FOODS = ['huevo', 'egg', 'pollo', 'chicken', 'pavo', 'turkey', 'pescado', 'fish', 'lenteja', 'lentil', 'garbanzo', 'chickpea', 'tofu', 'yogur', 'yogurt'];

export const classifyBrainFood = (foods: FoodItem[]): string[] => {
  const tags: string[] = [];
  
  foods.forEach(food => {
    const name = food.name.toLowerCase();
    
    // Check for omega-3
    if (OMEGA3_FOODS.some(f => name.includes(f))) {
      if (!tags.includes('omega3')) tags.push('omega3');
    }
    
    // Check for antioxidants
    if (ANTIOXIDANT_FOODS.some(f => name.includes(f))) {
      if (!tags.includes('antioxidants')) tags.push('antioxidants');
    }
    
    // Check for hydration
    if (HYDRATION_FOODS.some(f => name.includes(f))) {
      if (!tags.includes('hydration')) tags.push('hydration');
    }
    
    // Check for complex carbs
    if (COMPLEX_CARBS.some(f => name.includes(f))) {
      if (!tags.includes('complex_carbs')) tags.push('complex_carbs');
    }
    
    // Check for protein
    if (PROTEIN_FOODS.some(f => name.includes(f)) || food.protein > 10) {
      if (!tags.includes('protein')) tags.push('protein');
    }
  });
  
  return tags;
};
