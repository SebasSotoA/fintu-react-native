// Constants
const MAX_AMOUNT = 1_000_000_000;
const MAX_DIGITS = 12;
const MAX_DECIMALS = 2;

// Helper function to get the current number being typed
const getCurrentNumber = (expression: string): string => {
  // Split by operators and parentheses, get the last segment
  const parts = expression.split(/[+\-×÷%()]/);
  return parts[parts.length - 1] || '';
};

// Improved expression evaluator with better error handling
const evaluateExpression = (
  expr: string,
  lastValidAmount: string
): { value: number; error: string } => {
  try {
    // Remove spaces
    let cleanExpr = expr.trim().replace(/\s/g, '');
    
    // If empty or only operators, return 0
    if (!cleanExpr || /^[+\-×÷%()]+$/.test(cleanExpr)) {
      return { value: 0, error: '' };
    }
    
    // Validate balanced parentheses
    let balance = 0;
    for (const char of cleanExpr) {
      if (char === '(') balance++;
      if (char === ')') balance--;
      if (balance < 0) return { value: 0, error: '' }; // More closing than opening
    }
    if (balance !== 0) return { value: 0, error: '' }; // Unbalanced
    
    // Replace custom operators with JavaScript operators
    cleanExpr = cleanExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-'); // Important: handle the minus sign
    
    // Handle percentage: convert X% to (X/100)
    cleanExpr = cleanExpr.replace(/(\d+\.?\d*)%/g, '($1/100)');
    
    // Remove trailing operators (incomplete expression)
    cleanExpr = cleanExpr.replace(/[+\-*\/]+$/, '');
    
    // If after cleanup it's empty, return 0
    if (!cleanExpr || /^[+\-*\/()]+$/.test(cleanExpr)) {
      return { value: 0, error: '' };
    }
    
    // Evaluate safely using Function
    const result = Function(`'use strict'; return (${cleanExpr})`)();
    
    // Validate result type
    if (typeof result !== 'number' || isNaN(result)) {
      return { value: 0, error: '' };
    }
    
    // Check for infinity (division by zero)
    if (!isFinite(result)) {
      return { 
        value: parseFloat(lastValidAmount), 
        error: 'No se puede dividir entre cero' 
      };
    }
    
    // Round to 2 decimals
    const rounded = Math.round(result * 100) / 100;
    
    // Validate maximum amount
    if (Math.abs(rounded) > MAX_AMOUNT) {
      return { 
        value: parseFloat(lastValidAmount), 
        error: `El monto máximo permitido es ${MAX_AMOUNT.toLocaleString('es-CO')}` 
      };
    }
    
    // Check for negative result
    if (rounded < 0) {
      return { 
        value: Math.abs(rounded), 
        error: 'El monto no puede ser negativo' 
      };
    }
    
    return { value: rounded, error: '' };
    
  } catch (error) {
    // On any error, return 0 silently
    return { value: 0, error: '' };
  }
};

// Improved calculator input handler
const handleCalculatorInput = (
  input: string,
  expression: string
): string => {
  const operators = ['+', '−', '×', '÷', '%'];
  const lastChar = expression[expression.length - 1];
  
  // HANDLING OPERATORS
  if (operators.includes(input)) {
    // Don't allow operator at the start (except for expressions like "(")
    if (expression === "0" || expression === "") return expression;
    
    // If last char is an operator, replace it
    if (operators.includes(lastChar)) {
      return expression.slice(0, -1) + input;
    }
    
    // Don't allow operator right after opening parenthesis
    if (lastChar === '(') return expression;
    
    // Allow operator after number or closing parenthesis
    if (/\d/.test(lastChar) || lastChar === ')') {
      return expression + input;
    }
    
    return expression;
  }
  
  // HANDLING NUMBERS
  let newExpr = (expression === "0" || expression === "") ? input : expression + input;
  
  // Get the current number being typed
  const currentNumber = getCurrentNumber(newExpr);
  
  // Validate digit count (excluding decimal point and minus sign)
  const digitsOnly = currentNumber.replace(/[.\-]/g, '');
  if (digitsOnly.length > MAX_DIGITS) {
    return expression; // Reject if too many digits
  }
  
  // Validate decimal places
  if (currentNumber.includes('.')) {
    const [, decimalPart] = currentNumber.split('.');
    if (decimalPart && decimalPart.length > MAX_DECIMALS) {
      return expression; // Reject if too many decimal places
    }
  }
  
  // Prevent leading zeros like "000123"
  if (currentNumber.length > 1 && 
      currentNumber[0] === '0' && 
      currentNumber[1] !== '.') {
    return expression;
  }
  
  return newExpr;
};

// Improved decimal handler
const handleCalculatorDecimal = (expression: string): string => {
  const lastChar = expression[expression.length - 1];
  
  // Don't add decimal after closing parenthesis
  if (lastChar === ')') {
    return expression;
  }
  
  // Add "0." after opening parenthesis or operator
  if (lastChar === '(' || /[+\-×÷%]/.test(lastChar)) {
    return expression + '0.';
  }
  
  // Check if current number already has a decimal
  const currentNumber = getCurrentNumber(expression);
  if (currentNumber.includes('.')) {
    return expression; // Already has decimal
  }
  
  // Add decimal to current number
  return expression + '.';
};

// Improved parenthesis handler
const handleParenthesis = (expression: string): string => {
  const operators = ['+', '−', '×', '÷', '%'];
  const lastChar = expression[expression.length - 1];
  const openCount = (expression.match(/\(/g) || []).length;
  const closeCount = (expression.match(/\)/g) || []).length;
  
  // Decide whether to add opening or closing parenthesis
  const shouldClose = openCount > closeCount && 
                      (/\d/.test(lastChar) || lastChar === ')');
  
  if (shouldClose) {
    return expression + ')';
  }
  
  // Add opening parenthesis
  if (expression === "0") return '(';
  
  if (operators.includes(lastChar) || lastChar === '(') {
    return expression + '(';
  }
  
  // After number or closing parenthesis, add implicit multiplication
  if (/\d/.test(lastChar) || lastChar === ')') {
    return expression + '×(';
  }
  
  return expression;
};

// Improved backspace with continuous delete support
const handleCalculatorBackspace = (expression: string): string => {
  if (expression.length <= 1) {
    return "0";
  }
  return expression.slice(0, -1);
};

// Clear function
const handleClear = (): { 
  expression: string; 
  validationError: string; 
  lastValidAmount: string; 
} => {
  return {
    expression: "0",
    validationError: "",
    lastValidAmount: "0",
  };
};

export {
  evaluateExpression,
  handleCalculatorInput,
  handleCalculatorDecimal,
  handleParenthesis,
  handleCalculatorBackspace,
  handleClear,
  getCurrentNumber,
  MAX_AMOUNT,
  MAX_DIGITS,
  MAX_DECIMALS,
};


