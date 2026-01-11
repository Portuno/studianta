/**
 * Utilidades para formatear moneda
 */

// Símbolos de moneda comunes
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  ARS: '$',
  GBP: '£',
  MXN: '$',
  CLP: '$',
  COP: '$',
  BRL: 'R$',
  PEN: 'S/',
};

/**
 * Formatea un número como moneda sin decimales
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda ISO 4217 (default: EUR)
 * @returns String formateado (ej: "€1,214" o "$1,214")
 */
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const roundedAmount = Math.round(amount);
  
  // Formatear con separadores de miles
  const formatted = roundedAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  // Colocar el símbolo según la moneda
  if (currency === 'EUR' || currency === 'GBP') {
    return `${symbol}${formatted}`;
  } else {
    return `${symbol}${formatted}`;
  }
};

/**
 * Obtiene el símbolo de moneda
 */
export const getCurrencySymbol = (currency: string = 'EUR'): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};
