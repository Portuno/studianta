// Correlation calculation between nutrition entries and focus sessions

import { NutritionEntry, FocusSession, NutritionCorrelation } from '../types';

export const calculateCorrelation = (
  nutritionEntry: NutritionEntry,
  focusSession: FocusSession
): {
  correlation_type: 'positive' | 'negative' | 'neutral';
  session_quality_score: number;
  time_between: number;
  insights: string;
} => {
  // Calculate time between meal and session
  const mealTime = new Date(`${nutritionEntry.date}T${nutritionEntry.time}`);
  const sessionTime = new Date(focusSession.date);
  const timeBetweenMs = sessionTime.getTime() - mealTime.getTime();
  const timeBetweenMinutes = Math.floor(timeBetweenMs / 60000);
  
  // Calculate session quality score (1-10)
  // Based on duration and completion
  const durationScore = Math.min(10, Math.floor(focusSession.duration_minutes / 5)); // 5 min = 1 point, max 10
  const completionBonus = focusSession.completed ? 2 : 0;
  const sessionQualityScore = Math.min(10, durationScore + completionBonus);
  
  // Determine correlation type
  let correlationType: 'positive' | 'negative' | 'neutral' = 'neutral';
  let insights = '';
  
  // Optimal time window: 30-120 minutes after meal
  const isOptimalWindow = timeBetweenMinutes >= 30 && timeBetweenMinutes <= 120;
  
  // High energy score + optimal window = positive
  if (nutritionEntry.energy_score >= 7 && isOptimalWindow && sessionQualityScore >= 7) {
    correlationType = 'positive';
    insights = `Excelente sesión ${sessionQualityScore >= 8 ? 'alta calidad' : 'buena calidad'} ${sessionQualityScore >= 8 ? '1 hora' : '1.5 horas'} después de una comida con alto nivel de energía (${nutritionEntry.energy_score}/10). Los alimentos consumidos parecen haber mejorado tu concentración.`;
  } 
  // Low energy score or spike + session = negative
  else if ((nutritionEntry.energy_score <= 4 || nutritionEntry.estimated_glucose_impact === 'spike') && sessionQualityScore <= 5) {
    correlationType = 'negative';
    insights = `Sesión de ${sessionQualityScore <= 3 ? 'baja' : 'moderada'} calidad después de una comida con ${nutritionEntry.estimated_glucose_impact === 'spike' ? 'pico de glucosa' : 'bajo nivel de energía'} (${nutritionEntry.energy_score}/10). Considera ajustar el timing o el tipo de comida antes de estudiar.`;
  }
  // Brain food tags + good session = positive
  else if (nutritionEntry.brain_food_tags.length > 0 && sessionQualityScore >= 6) {
    correlationType = 'positive';
    const tags = nutritionEntry.brain_food_tags.join(', ');
    insights = `Buena sesión después de consumir alimentos beneficiosos para el cerebro (${tags}). Estos nutrientes pueden estar contribuyendo a tu rendimiento.`;
  }
  // Default: neutral
  else {
    correlationType = 'neutral';
    insights = `Sesión registrada ${timeBetweenMinutes} minutos después de la comida. No se detectó una correlación clara.`;
  }
  
  return {
    correlation_type: correlationType,
    session_quality_score: sessionQualityScore,
    time_between: timeBetweenMinutes,
    insights,
  };
};

export const findBestFoodsForFocus = async (
  userId: string,
  days: number,
  supabaseService: any
): Promise<{ food: string; avgScore: number; count: number }[]> => {
  // Get nutrition entries and correlations for the last N days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const entries = await supabaseService.getNutritionEntries(userId);
  const correlations = await supabaseService.getNutritionCorrelations(userId, 50);
  
  // Filter entries in date range
  const recentEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= startDate && entryDate <= endDate;
  });
  
  // Group by food and calculate average session scores
  const foodScores: Record<string, { scores: number[]; count: number }> = {};
  
  correlations.forEach(corr => {
    const entry = recentEntries.find(e => e.id === corr.nutrition_entry_id);
    if (!entry || corr.correlation_type !== 'positive') return;
    
    entry.foods.forEach(food => {
      if (!foodScores[food.name]) {
        foodScores[food.name] = { scores: [], count: 0 };
      }
      foodScores[food.name].scores.push(corr.session_quality_score);
      foodScores[food.name].count++;
    });
  });
  
  // Calculate averages and sort
  const results = Object.entries(foodScores)
    .map(([food, data]) => ({
      food,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count,
    }))
    .filter(r => r.count >= 2) // At least 2 occurrences
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5); // Top 5
  
  return results;
};
