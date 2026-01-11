/**
 * Conversor de unidades
 */

export type UnitCategory = 'length' | 'mass' | 'temperature' | 'volume';

export interface Unit {
  name: string;
  symbol: string;
  toBase: (value: number) => number; // Convierte a unidad base
  fromBase: (value: number) => number; // Convierte desde unidad base
}

// Unidades base: metro, kilogramo, Celsius, litro

const LENGTH_UNITS: Record<string, Unit> = {
  meter: {
    name: 'Metro',
    symbol: 'm',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  kilometer: {
    name: 'Kilómetro',
    symbol: 'km',
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000,
  },
  centimeter: {
    name: 'Centímetro',
    symbol: 'cm',
    toBase: (v) => v / 100,
    fromBase: (v) => v * 100,
  },
  millimeter: {
    name: 'Milímetro',
    symbol: 'mm',
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000,
  },
  inch: {
    name: 'Pulgada',
    symbol: 'in',
    toBase: (v) => v * 0.0254,
    fromBase: (v) => v / 0.0254,
  },
  foot: {
    name: 'Pie',
    symbol: 'ft',
    toBase: (v) => v * 0.3048,
    fromBase: (v) => v / 0.3048,
  },
  yard: {
    name: 'Yarda',
    symbol: 'yd',
    toBase: (v) => v * 0.9144,
    fromBase: (v) => v / 0.9144,
  },
  mile: {
    name: 'Milla',
    symbol: 'mi',
    toBase: (v) => v * 1609.344,
    fromBase: (v) => v / 1609.344,
  },
};

const MASS_UNITS: Record<string, Unit> = {
  kilogram: {
    name: 'Kilogramo',
    symbol: 'kg',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  gram: {
    name: 'Gramo',
    symbol: 'g',
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000,
  },
  milligram: {
    name: 'Miligramo',
    symbol: 'mg',
    toBase: (v) => v / 1000000,
    fromBase: (v) => v * 1000000,
  },
  pound: {
    name: 'Libra',
    symbol: 'lb',
    toBase: (v) => v * 0.453592,
    fromBase: (v) => v / 0.453592,
  },
  ounce: {
    name: 'Onza',
    symbol: 'oz',
    toBase: (v) => v * 0.0283495,
    fromBase: (v) => v / 0.0283495,
  },
  ton: {
    name: 'Tonelada',
    symbol: 't',
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000,
  },
};

const TEMPERATURE_UNITS: Record<string, Unit> = {
  celsius: {
    name: 'Celsius',
    symbol: '°C',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  fahrenheit: {
    name: 'Fahrenheit',
    symbol: '°F',
    toBase: (v) => (v - 32) * (5 / 9),
    fromBase: (v) => v * (9 / 5) + 32,
  },
  kelvin: {
    name: 'Kelvin',
    symbol: 'K',
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
  },
};

const VOLUME_UNITS: Record<string, Unit> = {
  liter: {
    name: 'Litro',
    symbol: 'L',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  milliliter: {
    name: 'Mililitro',
    symbol: 'mL',
    toBase: (v) => v / 1000,
    fromBase: (v) => v * 1000,
  },
  cubicMeter: {
    name: 'Metro cúbico',
    symbol: 'm³',
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000,
  },
  gallon: {
    name: 'Galón (US)',
    symbol: 'gal',
    toBase: (v) => v * 3.78541,
    fromBase: (v) => v / 3.78541,
  },
  quart: {
    name: 'Cuarto (US)',
    symbol: 'qt',
    toBase: (v) => v * 0.946353,
    fromBase: (v) => v / 0.946353,
  },
  pint: {
    name: 'Pinta (US)',
    symbol: 'pt',
    toBase: (v) => v * 0.473176,
    fromBase: (v) => v / 0.473176,
  },
  cup: {
    name: 'Taza (US)',
    symbol: 'cup',
    toBase: (v) => v * 0.236588,
    fromBase: (v) => v / 0.236588,
  },
  fluidOunce: {
    name: 'Onza líquida (US)',
    symbol: 'fl oz',
    toBase: (v) => v * 0.0295735,
    fromBase: (v) => v / 0.0295735,
  },
};

const UNIT_CATEGORIES: Record<UnitCategory, Record<string, Unit>> = {
  length: LENGTH_UNITS,
  mass: MASS_UNITS,
  temperature: TEMPERATURE_UNITS,
  volume: VOLUME_UNITS,
};

/**
 * Obtiene las unidades disponibles para una categoría
 */
export const getUnitsForCategory = (category: UnitCategory): Record<string, Unit> => {
  return UNIT_CATEGORIES[category] || {};
};

/**
 * Obtiene las categorías disponibles
 */
export const getCategories = (): UnitCategory[] => {
  return ['length', 'mass', 'temperature', 'volume'];
};

/**
 * Convierte un valor de una unidad a otra
 */
export const convertUnit = (
  value: number,
  fromUnit: string,
  toUnit: string,
  category: UnitCategory
): number | null => {
  try {
    const units = getUnitsForCategory(category);
    const from = units[fromUnit];
    const to = units[toUnit];
    
    if (!from || !to) {
      return null;
    }
    
    // Convertir a unidad base y luego a unidad destino
    const baseValue = from.toBase(value);
    return to.fromBase(baseValue);
  } catch (error) {
    console.error('Error converting unit:', error);
    return null;
  }
};

/**
 * Obtiene el nombre de la categoría en español
 */
export const getCategoryName = (category: UnitCategory): string => {
  const names: Record<UnitCategory, string> = {
    length: 'Longitud',
    mass: 'Masa',
    temperature: 'Temperatura',
    volume: 'Volumen',
  };
  return names[category];
};
