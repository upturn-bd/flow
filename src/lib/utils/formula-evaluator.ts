/**
 * Formula evaluation utility for calculated fields in stakeholder processes
 * Supports basic arithmetic operations and cell references
 */

import { StakeholderProcessStep, FieldDefinition } from "@/lib/types/schemas";

interface EvaluationContext {
  [key: string]: number;
}

/**
 * Convert a cell reference to human-readable format
 * Handles nested field paths like [Step1.parent.nested] or [Step1.dropdown.option_value.nested]
 * @param cellRef - Cell reference like [Step1.field_123] or [Step1.parent.nested]
 * @param processSteps - Array of process steps with field definitions
 * @returns Human-readable label or original reference if not found
 */
export function cellReferenceToLabel(
  cellRef: string,
  processSteps?: StakeholderProcessStep[]
): string {
  if (!processSteps || processSteps.length === 0) {
    return cellRef;
  }

  // Parse the cell reference
  const match = cellRef.match(/\[Step(\d+)\.([^\]]+)\]/);
  if (!match) {
    return cellRef;
  }

  const stepOrder = parseInt(match[1], 10);
  const fieldPath = match[2]; // Could be "field" or "parent.nested" or "dropdown.option.nested"

  // Find the step
  const step = processSteps.find((s) => s.step_order === stepOrder);
  if (!step) {
    return cellRef;
  }

  // Helper function to recursively find a field by path
  const findFieldByPath = (
    fields: FieldDefinition[],
    pathSegments: string[],
    labelPath: string[] = []
  ): string | null => {
    // Handle edge case of empty path
    if (pathSegments.length === 0) {
      console.warn('findFieldByPath called with empty pathSegments');
      return null;
    }
    
    const currentKey = pathSegments[0];
    const remainingPath = pathSegments.slice(1);
    
    // Find field with matching key
    const field = fields.find((f: FieldDefinition) => f.key === currentKey);
    if (!field) return null;
    
    const currentLabel = [...labelPath, field.label];
    
    // If this is the last segment, return the label
    if (remainingPath.length === 0) {
      return currentLabel.join(' > ');
    }
    
    // Otherwise, continue searching in nested fields
    if (field.nested && field.nested.length > 0) {
      const nestedResult = findFieldByPath(field.nested, remainingPath, currentLabel);
      if (nestedResult) return nestedResult;
    }
    
    // Check in option-specific nested fields (for dropdown/multi-select)
    if (field.options && field.options.length > 0 && remainingPath.length > 0) {
      const optionValue = remainingPath[0]; // Next segment is the option value
      const option = field.options.find(opt => opt.value === optionValue);
      if (option && option.nested && option.nested.length > 0) {
        const optionLabel = [...currentLabel, `[${option.label}]`];
        const optionNestedPath = remainingPath.slice(1); // Skip the option value segment
        if (optionNestedPath.length > 0) {
          const optionNestedResult = findFieldByPath(option.nested, optionNestedPath, optionLabel);
          if (optionNestedResult) return optionNestedResult;
        }
      }
    }
    
    return null;
  };

  // Split the field path and search for it
  const pathSegments = fieldPath.split('.');
  const label = findFieldByPath(step.field_definitions?.fields || [], pathSegments);
  
  return label || cellRef;
}

/**
 * Convert all cell references in a formula to human-readable format
 * @param formula - Formula string with cell references like [Step1.field_123]
 * @param processSteps - Array of process steps with field definitions
 * @returns Formula with human-readable labels
 */
export function formulaToReadable(
  formula: string,
  processSteps?: StakeholderProcessStep[]
): string {
  if (!processSteps || processSteps.length === 0) {
    return formula;
  }

  let readableFormula = formula;

  // Find all cell references in the formula
  const regex = /\[Step(\d+)\.([^\]]+)\]/g;
  const matches = Array.from(formula.matchAll(regex));

  // Replace each cell reference with human-readable label
  matches.forEach((match) => {
    const cellRef = match[0];
    const label = cellReferenceToLabel(cellRef, processSteps);
    // Wrap in quotes for clarity
    readableFormula = readableFormula.replace(cellRef, `${label}`);
  });

  return readableFormula;
}

/**
 * Parse cell references from formula and replace with actual values
 * @param formula - Formula string with cell references like [Step1.fieldKey]
 * @param stepData - Array of step data objects containing field values
 * @param currentStepData - Current step's data for same-step references (optional)
 * @param currentStepOrder - The step_order of the current step being filled (optional)
 * @param processSteps - Array of process steps for human-readable labels (optional)
 * @returns Object with parsed formula and evaluation context
 */
export function prepareFormulaForEvaluation(
  formula: string,
  stepData: Array<{ step_order: number; data: Record<string, any> }>,
  currentStepData?: Record<string, any>,
  currentStepOrder?: number,
  processSteps?: StakeholderProcessStep[]
): { formula: string; context: EvaluationContext; missingRefs: string[]; missingLabels?: string[] } {
  const context: EvaluationContext = {};
  const missingRefs: string[] = [];
  const missingLabels: string[] = [];
  let preparedFormula = formula;

  // Find all cell references in the formula
  const regex = /\[Step(\d+)\.([^\]]+)\]/g;
  const matches = Array.from(formula.matchAll(regex));

  matches.forEach((match, index) => {
    const stepOrder = parseInt(match[1], 10);
    const fieldKey = match[2];
    const cellRef = match[0];

    // Check if this is a current step reference
    // If currentStepOrder is provided, use it to determine if this references the current step
    const isCurrentStep = currentStepData && currentStepOrder !== undefined && stepOrder === currentStepOrder;

    let step;
    if (isCurrentStep && currentStepData) {
      // Use current step data for same-step references
      step = { step_order: stepOrder, data: currentStepData };
    } else {
      // Find the step data from completed steps
      step = stepData.find((s) => s.step_order === stepOrder);
    }

    if (step && step.data) {
      // Handle nested field paths (e.g., "address.zipcode" or "contact.phone.number")
      const fieldPath = fieldKey.split('.');
      let fieldData: any = step.data;

      // Traverse the nested path
      for (const pathSegment of fieldPath) {
        if (fieldData && typeof fieldData === 'object') {
          // Check if this level has a 'nested' property (NestedFieldValue structure)
          if ('nested' in fieldData && fieldData.nested) {
            fieldData = fieldData.nested[pathSegment];
          } else {
            fieldData = fieldData[pathSegment];
          }
        } else {
          fieldData = undefined;
          break;
        }
      }

      // Extract numeric value
      let numericValue: number | null = null;

      if (fieldData !== undefined && fieldData !== null) {
        // Handle NestedFieldValue format (has 'type' and 'value' properties)
        if (typeof fieldData === 'object' && 'value' in fieldData) {
          // Check if value is empty string or null before parsing
          const rawValue = fieldData.value;
          if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
            numericValue = parseFloat(rawValue);
          }
        } else {
          // Check if value is empty string or null before parsing
          if (fieldData !== null && fieldData !== undefined && fieldData !== '') {
            numericValue = parseFloat(fieldData);
          }
        }
      }

      if (isNaN(numericValue as any) || numericValue === null) {
        missingRefs.push(cellRef);
        missingLabels.push(cellReferenceToLabel(cellRef, processSteps));
        numericValue = 0; // Use 0 for missing/invalid values
      }

      // Create a variable name for this reference
      const varName = `var${index}`;
      context[varName] = numericValue;

      // Replace the cell reference with the variable name
      preparedFormula = preparedFormula.replace(cellRef, varName);
    } else {
      missingRefs.push(cellRef);
      missingLabels.push(cellReferenceToLabel(cellRef, processSteps));
      const varName = `var${index}`;
      context[varName] = 0; // Use 0 for missing step data
      preparedFormula = preparedFormula.replace(cellRef, varName);
    }
  });

  return { formula: preparedFormula, context, missingRefs, missingLabels: missingLabels.length > 0 ? missingLabels : undefined };
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
 * @param currentStepData - Current step's data for same-step references (optional)
 * @param currentStepOrder - The step_order of the current step being filled (optional)
 * @param processSteps - Array of process steps for human-readable labels (optional)
 * @returns Calculated result or null if evaluation fails
 */
export function calculateFieldValue(
  formula: string,
  stepData: Array<{ step_order: number; data: Record<string, any> }>,
  currentStepData?: Record<string, any>,
  currentStepOrder?: number,
  processSteps?: StakeholderProcessStep[]
): { value: number | null; error?: string; missingRefs?: string[]; missingLabels?: string[] } {
  if (!formula || !formula.trim()) {
    return { value: null, error: "Empty formula" };
  }

  try {
    // Prepare formula by replacing cell references with variables
    const { formula: preparedFormula, context, missingRefs, missingLabels } =
      prepareFormulaForEvaluation(formula, stepData, currentStepData, currentStepOrder, processSteps);

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
        missingLabels: missingLabels && missingLabels.length > 0 ? missingLabels : undefined,
      };
    }

    return {
      value: result,
      missingRefs: missingRefs.length > 0 ? missingRefs : undefined,
      missingLabels: missingLabels && missingLabels.length > 0 ? missingLabels : undefined,
    };
  } catch (error) {
    console.error("Unexpected error in calculateFieldValue:", error);
    return {
      value: null,
      error: "Formula evaluation failed",
    };
  }
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
