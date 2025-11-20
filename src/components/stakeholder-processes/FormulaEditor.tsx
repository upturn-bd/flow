"use client";

import { useState, useEffect } from "react";
import { StakeholderProcessStep } from "@/lib/types/schemas";
import { X, Plus, Calculator } from "lucide-react";

interface CellReference {
  stepOrder: number;
  stepName: string;
  fieldKey: string;
  fieldLabel: string;
}

interface FormulaEditorProps {
  formula: string;
  onChange: (formula: string, references: Array<{ stepOrder: number; fieldKey: string }>) => void;
  availableSteps: StakeholderProcessStep[];
  currentStepOrder: number;
  onClose?: () => void;
}

export default function FormulaEditor({
  formula,
  onChange,
  availableSteps,
  currentStepOrder,
  onClose,
}: FormulaEditorProps) {
  const [formulaText, setFormulaText] = useState(formula || "");
  const [showCellPicker, setShowCellPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Filter to only show previous steps (for sequential processes)
  const previousSteps = availableSteps.filter(
    (step) => step.step_order < currentStepOrder
  );

  // Get all available fields from previous steps that can be referenced
  const getAvailableFields = (): CellReference[] => {
    const fields: CellReference[] = [];
    
    previousSteps.forEach((step) => {
      const stepFields = step.field_definitions?.fields || [];
      stepFields.forEach((field) => {
        // Only allow referencing number fields
        if (field.type === 'number') {
          fields.push({
            stepOrder: step.step_order,
            stepName: step.name,
            fieldKey: field.key,
            fieldLabel: field.label,
          });
        }
      });
    });
    
    return fields;
  };

  const availableFields = getAvailableFields();

  // Insert cell reference at cursor position
  const insertCellReference = (field: CellReference) => {
    const cellRef = `[Step${field.stepOrder}.${field.fieldKey}]`;
    const before = formulaText.slice(0, cursorPosition);
    const after = formulaText.slice(cursorPosition);
    const newFormula = before + cellRef + after;
    
    setFormulaText(newFormula);
    setCursorPosition(cursorPosition + cellRef.length);
    setShowCellPicker(false);
  };

  // Parse formula to extract referenced fields
  const parseReferences = (formula: string): Array<{ stepOrder: number; fieldKey: string }> => {
    const references: Array<{ stepOrder: number; fieldKey: string }> = [];
    const regex = /\[Step(\d+)\.([^\]]+)\]/g;
    let match;
    
    while ((match = regex.exec(formula)) !== null) {
      references.push({
        stepOrder: parseInt(match[1], 10),
        fieldKey: match[2],
      });
    }
    
    return references;
  };

  // Validate formula syntax
  const validateFormula = (formula: string): { valid: boolean; error?: string } => {
    if (!formula.trim()) {
      return { valid: false, error: "Formula cannot be empty" };
    }

    // Check for balanced brackets
    const openBrackets = (formula.match(/\[/g) || []).length;
    const closeBrackets = (formula.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: "Unbalanced brackets in formula" };
    }

    // Check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { valid: false, error: "Unbalanced parentheses in formula" };
    }

    // Check for valid operators only
    const withoutRefs = formula.replace(/\[Step\d+\.[^\]]+\]/g, "N");
    const withoutNumbers = withoutRefs.replace(/\d+(\.\d+)?/g, "N");
    const withoutSpaces = withoutNumbers.replace(/\s+/g, "");
    const invalidChars = withoutSpaces.replace(/[N+\-*/()]/g, "");
    
    if (invalidChars.length > 0) {
      return { valid: false, error: `Invalid characters in formula: ${invalidChars}` };
    }

    return { valid: true };
  };

  const handleSave = () => {
    const validation = validateFormula(formulaText);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const references = parseReferences(formulaText);
    onChange(formulaText, references);
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="text-blue-600" size={20} />
          <h4 className="font-semibold text-gray-900">Formula Editor</h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Formula Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Formula
        </label>
        <textarea
          value={formulaText}
          onChange={(e) => {
            setFormulaText(e.target.value);
            setCursorPosition(e.target.selectionStart);
          }}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart);
          }}
          placeholder="e.g., [Step1.price] * [Step2.quantity]"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported operators: + - * / ( )
        </p>
      </div>

      {/* Cell Reference Picker */}
      <div>
        <button
          type="button"
          onClick={() => setShowCellPicker(!showCellPicker)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Plus size={16} />
          {showCellPicker ? "Hide" : "Insert"} Cell Reference
        </button>

        {showCellPicker && (
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            {availableFields.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-700">
                    Available Number Fields from Previous Steps
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {availableFields.map((field, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertCellReference(field)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {field.fieldLabel}
                          </div>
                          <div className="text-xs text-gray-500">
                            Step {field.stepOrder}: {field.stepName}
                          </div>
                        </div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          [Step{field.stepOrder}.{field.fieldKey}]
                        </code>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  No number fields available from previous steps
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Add number fields to earlier steps to use them in calculations
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formula Preview */}
      {formulaText && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
          <code className="text-sm text-gray-900 break-all">{formulaText}</code>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Save Formula
        </button>
      </div>
    </div>
  );
}
