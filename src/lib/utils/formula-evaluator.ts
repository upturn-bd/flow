/**
 * Formula evaluation utility for calculated fields in stakeholder processes
 * Supports basic arithmetic operations and cell references
 */

interface EvaluationContext {
  [key: string]: number;
}

/**
 * Parse cell references from formula and replace with actual values
 * @param formula - Formula string with cell references like [Step1.fieldKey]
 * @param stepData - Array of step data objects containing field values
 * @returns Object with parsed formula and evaluation context
 */
export function prepareFormulaForEvaluation(
  formula: string,
  stepData: Array<{ step_order: number; data: Record<string, any> }>
): { formula: string; context: EvaluationContext; missingRefs: string[] } {
  const context: EvaluationContext = {};
  const missingRefs: string[] = [];
  let preparedFormula = formula;

  // Find all cell references in the formula
  const regex = /\[Step(\d+)\.([^\]]+)\]/g;
  const matches = Array.from(formula.matchAll(regex));

  matches.forEach((match, index) => {
    const stepOrder = parseInt(match[1], 10);
    const fieldKey = match[2];
    const cellRef = match[0];

    // Find the step data
    const step = stepData.find((s) => s.step_order === stepOrder);
    
    if (step && step.data) {
      const fieldData = step.data[fieldKey];
      
      // Extract numeric value
      let numericValue: number | null = null;
      
      if (fieldData !== undefined && fieldData !== null) {
        // Handle nested format
        if (typeof fieldData === 'object' && 'value' in fieldData) {
          numericValue = parseFloat(fieldData.value);
        } else {
          numericValue = parseFloat(fieldData);
        }
      }

      if (isNaN(numericValue as any) || numericValue === null) {
        missingRefs.push(cellRef);
        numericValue = 0; // Use 0 for missing/invalid values
      }

      // Create a variable name for this reference
      const varName = `var${index}`;
      context[varName] = numericValue;

      // Replace the cell reference with the variable name
      preparedFormula = preparedFormula.replace(cellRef, varName);
    } else {
      missingRefs.push(cellRef);
      const varName = `var${index}`;
      context[varName] = 0; // Use 0 for missing step data
      preparedFormula = preparedFormula.replace(cellRef, varName);
    }
  });

  return { formula: preparedFormula, context, missingRefs };
}

/**
 * Safely evaluate a mathematical formula with given context
 * @param formula - Mathematical expression with variable names
 * @param context - Object mapping variable names to numeric values
 * @returns Calculated result or null if evaluation fails
 */
export function evaluateFormula(
  formula: string,
  context: EvaluationContext
): number | null {
  try {
    // Validate that formula only contains safe characters
    const safePattern = /^[0-9+\-*/().\s\w]+$/;
    if (!safePattern.test(formula)) {
      console.error("Formula contains invalid characters:", formula);
      return null;
    }

    // Create a function that evaluates the formula with the context
    const varNames = Object.keys(context);
    const varValues = Object.values(context);

    // Create function dynamically with context variables as parameters
    const func = new Function(...varNames, `return ${formula};`);
    const result = func(...varValues);

    // Validate result is a number
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      console.error("Formula evaluation produced invalid result:", result);
      return null;
    }

    return result;
  } catch (error) {
    console.error("Error evaluating formula:", error);
    return null;
  }
}

/**
 * Main function to evaluate a formula with cell references
 * @param formula - Formula string with cell references
 * @param stepData - Array of completed step data
 * @returns Calculated result or null if evaluation fails
 */
export function calculateFieldValue(
  formula: string,
  stepData: Array<{ step_order: number; data: Record<string, any> }>
): { value: number | null; error?: string; missingRefs?: string[] } {
  if (!formula || !formula.trim()) {
    return { value: null, error: "Empty formula" };
  }

  // Prepare formula by replacing cell references with variables
  const { formula: preparedFormula, context, missingRefs } = 
    prepareFormulaForEvaluation(formula, stepData);

  if (missingRefs.length > 0) {
    console.warn("Missing references in formula:", missingRefs);
    // Continue evaluation with 0 values for missing refs
  }

  // Evaluate the formula
  const result = evaluateFormula(preparedFormula, context);

  if (result === null) {
    return {
      value: null,
      error: "Failed to evaluate formula",
      missingRefs: missingRefs.length > 0 ? missingRefs : undefined,
    };
  }

  return {
    value: result,
    missingRefs: missingRefs.length > 0 ? missingRefs : undefined,
  };
}

/**
 * Format a number for display
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatCalculatedValue(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}
