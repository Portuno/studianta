/**
 * Motor de cálculo seguro para la calculadora
 * Evalúa expresiones matemáticas sin usar eval() directamente
 */

export type AngleMode = 'deg' | 'rad';

interface Token {
  type: 'number' | 'operator' | 'function' | 'constant' | 'parenthesis';
  value: string | number;
}

/**
 * Convierte grados a radianes
 */
const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Convierte radianes a grados
 */
const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Tokeniza una expresión matemática
 */
const tokenize = (expression: string): Token[] => {
  const tokens: Token[] = [];
  let currentNumber = '';
  
  const operators = ['+', '-', '×', '*', '÷', '/', '^', '%'];
  const functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'cbrt'];
  const constants = ['π', 'pi', 'e'];
  
  let i = 0;
  while (i < expression.length) {
    const char = expression[i];
    
    // Espacios
    if (char === ' ') {
      i++;
      continue;
    }
    
    // Números y punto decimal
    if ((char >= '0' && char <= '9') || char === '.') {
      currentNumber += char;
      i++;
      continue;
    }
    
    // Si hay un número acumulado, guardarlo
    if (currentNumber) {
      tokens.push({ type: 'number', value: parseFloat(currentNumber) });
      currentNumber = '';
    }
    
    // Paréntesis
    if (char === '(' || char === ')') {
      tokens.push({ type: 'parenthesis', value: char });
      i++;
      continue;
    }
    
    // Operadores
    if (operators.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }
    
    // Funciones y constantes (buscar substrings)
    let found = false;
    for (const func of functions) {
      if (expression.substring(i).startsWith(func)) {
        tokens.push({ type: 'function', value: func });
        i += func.length;
        found = true;
        break;
      }
    }
    if (found) continue;
    
    for (const constant of constants) {
      if (expression.substring(i).toLowerCase().startsWith(constant.toLowerCase())) {
        tokens.push({ type: 'constant', value: constant.toLowerCase() });
        i += constant.length;
        found = true;
        break;
      }
    }
    if (found) continue;
    
    // Si no se reconoce, avanzar
    i++;
  }
  
  // Agregar último número si existe
  if (currentNumber) {
    tokens.push({ type: 'number', value: parseFloat(currentNumber) });
  }
  
  return tokens;
};

/**
 * Convierte tokens a expresión evaluable
 */
const tokensToExpression = (tokens: Token[], angleMode: AngleMode): string => {
  let expression = '';
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'number') {
      expression += token.value;
    } else if (token.type === 'operator') {
      const op = token.value as string;
      if (op === '×') expression += '*';
      else if (op === '÷') expression += '/';
      else expression += op;
    } else if (token.type === 'function') {
      const func = token.value as string;
      // Buscar el siguiente paréntesis
      let funcExpr = '';
      let parenCount = 0;
      let j = i + 1;
      
      if (j < tokens.length && tokens[j].value === '(') {
        j++;
        parenCount++;
        while (j < tokens.length && parenCount > 0) {
          if (tokens[j].value === '(') parenCount++;
          else if (tokens[j].value === ')') parenCount--;
          if (parenCount > 0) {
            funcExpr += tokensToExpression([tokens[j]], angleMode);
          }
          j++;
        }
        i = j - 1;
      }
      
      // Convertir función según el modo de ángulo
      let mathFunc = '';
      if (func === 'sin') {
        mathFunc = angleMode === 'deg' ? `Math.sin(toRadians(${funcExpr}))` : `Math.sin(${funcExpr})`;
      } else if (func === 'cos') {
        mathFunc = angleMode === 'deg' ? `Math.cos(toRadians(${funcExpr}))` : `Math.cos(${funcExpr})`;
      } else if (func === 'tan') {
        mathFunc = angleMode === 'deg' ? `Math.tan(toRadians(${funcExpr}))` : `Math.tan(${funcExpr})`;
      } else if (func === 'asin') {
        mathFunc = angleMode === 'deg' ? `toDegrees(Math.asin(${funcExpr}))` : `Math.asin(${funcExpr})`;
      } else if (func === 'acos') {
        mathFunc = angleMode === 'deg' ? `toDegrees(Math.acos(${funcExpr}))` : `Math.acos(${funcExpr})`;
      } else if (func === 'atan') {
        mathFunc = angleMode === 'deg' ? `toDegrees(Math.atan(${funcExpr}))` : `Math.atan(${funcExpr})`;
      } else if (func === 'log') {
        mathFunc = `Math.log10(${funcExpr})`;
      } else if (func === 'ln') {
        mathFunc = `Math.log(${funcExpr})`;
      } else if (func === 'sqrt') {
        mathFunc = `Math.sqrt(${funcExpr})`;
      } else if (func === 'cbrt') {
        mathFunc = `Math.cbrt(${funcExpr})`;
      }
      
      expression += mathFunc;
    } else if (token.type === 'constant') {
      const constant = token.value as string;
      if (constant === 'π' || constant === 'pi') {
        expression += Math.PI;
      } else if (constant === 'e') {
        expression += Math.E;
      }
    } else if (token.type === 'parenthesis') {
      expression += token.value;
    }
  }
  
  return expression;
};

/**
 * Evalúa una expresión matemática de forma segura
 */
export const evaluateExpression = (expression: string, angleMode: AngleMode = 'deg'): number | null => {
  try {
    // Limpiar expresión
    let cleanExpr = expression.trim();
    if (!cleanExpr) return null;
    
    // Reemplazar operadores visuales
    cleanExpr = cleanExpr.replace(/×/g, '*').replace(/÷/g, '/');
    
    // Manejar porcentajes
    cleanExpr = cleanExpr.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, num) => {
      return `(${num} / 100)`;
    });
    
    // Reemplazar constantes primero
    cleanExpr = cleanExpr.replace(/π|pi/gi, Math.PI.toString());
    cleanExpr = cleanExpr.replace(/\be\b/g, Math.E.toString());
    
    // Manejar funciones especiales recursivamente
    const funcMap: Record<string, (x: number) => number> = {
      sin: (x: number) => angleMode === 'deg' ? Math.sin(toRadians(x)) : Math.sin(x),
      cos: (x: number) => angleMode === 'deg' ? Math.cos(toRadians(x)) : Math.cos(x),
      tan: (x: number) => angleMode === 'deg' ? Math.tan(toRadians(x)) : Math.tan(x),
      asin: (x: number) => angleMode === 'deg' ? toDegrees(Math.asin(x)) : Math.asin(x),
      acos: (x: number) => angleMode === 'deg' ? toDegrees(Math.acos(x)) : Math.acos(x),
      atan: (x: number) => angleMode === 'deg' ? toDegrees(Math.atan(x)) : Math.atan(x),
      log: (x: number) => Math.log10(x),
      ln: (x: number) => Math.log(x),
      sqrt: (x: number) => Math.sqrt(x),
      cbrt: (x: number) => Math.cbrt(x),
    };
    
    // Reemplazar funciones (de adentro hacia afuera)
    let changed = true;
    while (changed) {
      changed = false;
      for (const [funcName, func] of Object.entries(funcMap)) {
        const regex = new RegExp(`${funcName}\\(([^()]+)\\)`, 'g');
        const newExpr = cleanExpr.replace(regex, (match, arg) => {
          const argValue = evaluateExpression(arg, angleMode);
          if (argValue === null) throw new Error('Invalid argument');
          changed = true;
          return func(argValue).toString();
        });
        if (newExpr !== cleanExpr) {
          cleanExpr = newExpr;
          changed = true;
        }
      }
    }
    
    // Manejar potencias (x^y) - simple, sin anidamiento complejo
    cleanExpr = cleanExpr.replace(/(\d+(?:\.\d+)?)\s*\^\s*(\d+(?:\.\d+)?)/g, (match, base, exp) => {
      return `Math.pow(${base}, ${exp})`;
    });
    
    // Validar que solo contenga caracteres seguros después de procesar
    const safePattern = /^[0-9+\-*/().\s,Math.pow]+$/;
    if (!safePattern.test(cleanExpr)) {
      // Si tiene funciones restantes, intentar evaluarlas
      cleanExpr = cleanExpr.replace(/Math\.pow\(([^,]+),([^)]+)\)/g, (match, base, exp) => {
        const baseVal = parseFloat(base);
        const expVal = parseFloat(exp);
        if (isNaN(baseVal) || isNaN(expVal)) return match;
        return Math.pow(baseVal, expVal).toString();
      });
    }
    
    // Evaluar usando Function constructor (más seguro que eval)
    const result = new Function('Math', `return ${cleanExpr}`)(Math);
    
    // Verificar que el resultado sea un número válido
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result');
    }
    
    return result;
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return null;
  }
};

/**
 * Calcula el porcentaje de un número
 */
export const calculatePercentage = (value: number, percentage: number, operation: '+' | '-' = '+'): number => {
  const percentValue = (value * percentage) / 100;
  return operation === '+' ? value + percentValue : value - percentValue;
};

/**
 * Valida si una expresión es sintácticamente correcta
 */
export const isValidExpression = (expression: string): boolean => {
  try {
    // Contar paréntesis
    let parenCount = 0;
    for (const char of expression) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) return false;
    }
    if (parenCount !== 0) return false;
    
    // Verificar que no termine en operador
    const lastChar = expression.trim().slice(-1);
    if (['+', '-', '×', '*', '÷', '/', '^', '%'].includes(lastChar)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};
