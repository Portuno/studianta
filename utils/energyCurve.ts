// Energy curve calculation based on nutrition entry
// Estimates glucose/energy levels over the next 4 hours

import { NutritionEntry, EnergyCurve } from '../types';

export const calculateEnergyCurve = (entry: NutritionEntry): EnergyCurve[] => {
  const now = new Date();
  const curves: EnergyCurve[] = [];
  
  const { estimated_glucose_impact, total_carbs, total_protein, total_fats, energy_score } = entry;
  
  // Base energy from score (1-10)
  const baseEnergy = energy_score;
  
  // Determine curve pattern based on glucose impact and macros
  let pattern: 'spike' | 'gradual' | 'sustained' = 'gradual';
  
  if (estimated_glucose_impact === 'spike' || (total_carbs > total_protein * 2 && total_carbs > 50)) {
    pattern = 'spike';
  } else if (total_protein > total_carbs && total_protein > 30) {
    pattern = 'sustained';
  } else {
    pattern = 'gradual';
  }
  
  // Generate points for next 4 hours (every 30 minutes = 8 points)
  for (let i = 0; i < 8; i++) {
    const minutes = i * 30;
    const time = new Date(now.getTime() + minutes * 60000);
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    
    let estimatedEnergy: number;
    let glucoseLevel: number;
    
    if (pattern === 'spike') {
      // Spike pattern: quick rise (30-60 min), then drop (2-3 hours)
      if (minutes <= 60) {
        // Rising phase
        estimatedEnergy = baseEnergy + (minutes / 60) * (10 - baseEnergy) * 0.3;
        glucoseLevel = 50 + (minutes / 60) * 40;
      } else if (minutes <= 180) {
        // Peak and decline
        const declineStart = 60;
        const declineEnd = 180;
        const progress = (minutes - declineStart) / (declineEnd - declineStart);
        estimatedEnergy = baseEnergy + (10 - baseEnergy) * 0.3 * (1 - progress * 0.7);
        glucoseLevel = 90 - progress * 50;
      } else {
        // Low energy phase
        estimatedEnergy = baseEnergy * 0.6;
        glucoseLevel = 40 - (minutes - 180) / 60 * 10;
      }
    } else if (pattern === 'sustained') {
      // Sustained pattern: gradual rise, stable high
      if (minutes <= 120) {
        // Gradual rise
        estimatedEnergy = baseEnergy + (minutes / 120) * (10 - baseEnergy) * 0.4;
        glucoseLevel = 50 + (minutes / 120) * 30;
      } else {
        // Stable high
        estimatedEnergy = baseEnergy + (10 - baseEnergy) * 0.4;
        glucoseLevel = 80 - (minutes - 120) / 120 * 10;
      }
    } else {
      // Gradual pattern: steady rise, stable
      if (minutes <= 120) {
        // Steady rise
        estimatedEnergy = baseEnergy + (minutes / 120) * (10 - baseEnergy) * 0.3;
        glucoseLevel = 50 + (minutes / 120) * 25;
      } else {
        // Stable
        estimatedEnergy = baseEnergy + (10 - baseEnergy) * 0.3;
        glucoseLevel = 75 - (minutes - 120) / 120 * 5;
      }
    }
    
    // Clamp values
    estimatedEnergy = Math.max(1, Math.min(10, Math.round(estimatedEnergy * 10) / 10));
    glucoseLevel = Math.max(0, Math.min(100, Math.round(glucoseLevel)));
    
    curves.push({
      time: timeStr,
      estimated_energy: estimatedEnergy,
      glucose_level: glucoseLevel,
    });
  }
  
  return curves;
};
