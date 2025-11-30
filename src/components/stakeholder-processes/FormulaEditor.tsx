"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { StakeholderProcessStep, FieldDefinition } from "@/lib/types/schemas";
import { X, Plus, Calculator, WarningCircle } from "@/lib/icons";

interface CellReference {
  stepOrder: number;
  stepName: string;
  fieldKey: string;
  fieldLabel: string;
  isNested?: boolean;
  nestedPath?: string; // e.g., "parentKey.nestedKey"
}

type FormulaElement = {
  id: string;
  type: 'text' | 'field';
  value: string; // For text: the actual text, For field: [Step1.fieldKey] format
  display?: string; // For field: human-readable label
  fieldRef?: CellReference;
};

interface FormulaEditorProps {
  formula: string;
  onChange: (formula: string, references: Array<{ stepOrder: number; fieldKey: string }>) => void;
  availableSteps: StakeholderProcessStep[];
  currentStepOrder: number;
  currentStepFields?: FieldDefinition[]; // Fields from the current step (for same-step references)
  onClose?: () => void;
}

export default function FormulaEditor({
  formula,
  onChange,
  availableSteps,
  currentStepOrder,
  currentStepFields = [],
  onClose,
}: FormulaEditorProps) {
  const [elements, setElements] = useState<FormulaElement[]>([]);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [fieldPickerPosition, setFieldPickerPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldPickerRef = useRef<HTMLDivElement>(null);

  // Filter to only show previous steps (for sequential processes)
  const previousSteps = availableSteps.filter(
    (step) => step.step_order < currentStepOrder
  );

  // Get all available fields from previous steps AND current step that can be referenced
  const getAvailableFields = (): CellReference[] => {
    const fields: CellReference[] = [];
    
    // Helper to recursively extract number fields including nested ones
    const extractNumberFields = (
      stepOrder: number,
      stepName: string,
      fieldList: FieldDefinition[],
      parentKey: string = '',
      parentLabel: string = ''
    ) => {
      fieldList.forEach((field) => {
        const currentPath = parentKey ? `${parentKey}.${field.key}` : field.key;
        const currentLabel = parentLabel ? `${parentLabel} > ${field.label}` : field.label;
        
        // Add number fields
        if (field.type === 'number') {
          fields.push({
            stepOrder,
            stepName,
            fieldKey: currentPath,
            fieldLabel: currentLabel,
            isNested: !!parentKey,
            nestedPath: currentPath,
          });
        }
        
        // Recursively process nested fields
        if (field.nested && field.nested.length > 0) {
          extractNumberFields(stepOrder, stepName, field.nested, currentPath, currentLabel);
        }
        
        // Process nested fields in dropdown/multi-select options
        if (field.options && field.options.length > 0) {
          field.options.forEach((option) => {
            if (option.nested && option.nested.length > 0) {
              const optionPath = `${currentPath}.${option.value}`;
              const optionLabel = `${currentLabel} [${option.label}]`;
              extractNumberFields(stepOrder, stepName, option.nested, optionPath, optionLabel);
            }
          });
        }
      });
    };
    
    // Add fields from previous steps
    previousSteps.forEach((step) => {
      const stepFields = step.field_definitions?.fields || [];
      extractNumberFields(step.step_order, step.name, stepFields);
    });
    
    // Add number fields from current step (for same-step calculations)
    extractNumberFields(currentStepOrder, "Current Step", currentStepFields);
    
    return fields;
  };

  const availableFields = getAvailableFields();

  // Initialize elements from formula on mount
  useEffect(() => {
    if (formula) {
      const parsedElements = parseFormulaToElements(formula);
      setElements(parsedElements);
    } else {
      // Start with an empty text element
      setElements([{ id: 'initial', type: 'text', value: '' }]);
    }
  }, []); // Only run on mount

  // Parse existing formula into elements
  const parseFormulaToElements = (formula: string): FormulaElement[] => {
    const elements: FormulaElement[] = [];
    const regex = /\[Step(\d+)\.([^\]]+)\]/g;
    let lastIndex = 0;
    let elementCounter = 0;

    const matches = Array.from(formula.matchAll(regex));
    
    matches.forEach((match) => {
      // Add text before the match
      if (match.index! > lastIndex) {
        const textValue = formula.slice(lastIndex, match.index);
        if (textValue) {
          elements.push({
            id: `elem-${elementCounter++}`,
            type: 'text',
            value: textValue,
          });
        }
      }

      // Add field reference
      const stepOrder = parseInt(match[1], 10);
      const fieldKey = match[2];
      const field = availableFields.find(
        (f) => f.stepOrder === stepOrder && f.fieldKey === fieldKey
      );
      
      elements.push({
        id: `elem-${elementCounter++}`,
        type: 'field',
        value: match[0],
        display: field?.fieldLabel || fieldKey,
        fieldRef: field,
      });

      lastIndex = match.index! + match[0].length;
    });

    // Add remaining text
    if (lastIndex < formula.length) {
      const textValue = formula.slice(lastIndex);
      if (textValue) {
        elements.push({
          id: `elem-${elementCounter++}`,
          type: 'text',
          value: textValue,
        });
      }
    }

    // Ensure at least one element
    if (elements.length === 0) {
      elements.push({ id: 'initial', type: 'text', value: '' });
    }

    return elements;
  };

  // Convert elements back to formula string
  const elementsToFormula = (elements: FormulaElement[]): string => {
    return elements.map(e => e.value).join('');
  };

  // Insert a field at current position
  const insertField = (field: CellReference) => {
    // Get the currently focused element and cursor position
    const activeEl = document.activeElement as HTMLElement;
    const focusedElementId = activeEl?.getAttribute('data-element-id');
    const selection = window.getSelection();
    const cursorOffset = selection?.anchorOffset || 0;
    
    if (!focusedElementId) {
      // Use the last text element as the insertion point
      const lastTextIndex = elements.length - 1;
      if (lastTextIndex >= 0 && elements[lastTextIndex].type === 'text') {
        insertFieldAtPosition(field, lastTextIndex, elements[lastTextIndex].value.length);
      } else {
        // Append to the end
        const newFieldElement: FormulaElement = {
          id: `elem-${Date.now()}-field`,
          type: 'field',
          value: `[Step${field.stepOrder}.${field.fieldKey}]`,
          display: field.fieldLabel,
          fieldRef: field,
        };
        const newTextElement: FormulaElement = {
          id: `elem-${Date.now()}-text`,
          type: 'text',
          value: '',
        };
        
        const updatedElements = elements.length === 1 && elements[0].type === 'text' && elements[0].value === ''
          ? [elements[0], newFieldElement, newTextElement]
          : [...elements, newFieldElement, newTextElement];
        
        setElements(updatedElements);
        setShowFieldPicker(false);
        setSearchQuery('');
        
        setTimeout(() => {
          const textEl = inputRefs.current[newTextElement.id];
          textEl?.focus();
        }, 0);
      }
      return;
    }

    const elementIndex = elements.findIndex(e => e.id === focusedElementId);
    if (elementIndex === -1) return;

    const element = elements[elementIndex];
    if (element.type !== 'text') return;

    insertFieldAtPosition(field, elementIndex, cursorOffset);
  };

  // Helper function to insert field at a specific position
  const insertFieldAtPosition = (field: CellReference, elementIndex: number, cursorOffset: number) => {
    const element = elements[elementIndex];
    if (element.type !== 'text') return;

    const beforeText = element.value.slice(0, cursorOffset);
    const afterText = element.value.slice(cursorOffset);

    const newElements = [...elements];
    
    // Create new elements: beforeText, field, afterText
    const beforeElement: FormulaElement = {
      id: element.id,
      type: 'text',
      value: beforeText,
    };
    
    const fieldElement: FormulaElement = {
      id: `elem-${Date.now()}-field`,
      type: 'field',
      value: `[Step${field.stepOrder}.${field.fieldKey}]`,
      display: field.fieldLabel,
      fieldRef: field,
    };
    
    const afterElement: FormulaElement = {
      id: `elem-${Date.now()}-text`,
      type: 'text',
      value: afterText,
    };

    // Replace the current element with the three new ones
    newElements.splice(elementIndex, 1, beforeElement, fieldElement, afterElement);
    
    setElements(newElements);
    setShowFieldPicker(false);
    setSearchQuery('');

    // Focus the after element
    setTimeout(() => {
      const afterEl = inputRefs.current[afterElement.id];
      if (afterEl) {
        afterEl.focus();
        // Move cursor to start
        const range = document.createRange();
        const sel = window.getSelection();
        if (afterEl.childNodes.length > 0) {
          range.setStart(afterEl.childNodes[0], 0);
        } else {
          range.setStart(afterEl, 0);
        }
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  // Update text element value
  const updateElement = (id: string, value: string) => {
    setElements(elements.map(e => 
      e.id === id && e.type === 'text' ? { ...e, value } : e
    ));
  };

  // Save and restore cursor position
  const saveCursorPosition = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const offset = preCaretRange.toString().length;
    
    return offset;
  };

  const restoreCursorPosition = (element: HTMLElement, offset: number) => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const range = document.createRange();
    let currentOffset = 0;
    let found = false;

    const traverseNodes = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentOffset + textLength >= offset) {
          range.setStart(node, offset - currentOffset);
          range.collapse(true);
          found = true;
          return true;
        }
        currentOffset += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverseNodes(node.childNodes[i])) return true;
        }
      }
      return false;
    };

    traverseNodes(element);
    
    if (found) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Handle backspace on field chip
  const handleBackspaceOnField = (elementId: string) => {
    const index = elements.findIndex(e => e.id === elementId);
    if (index === -1) return;

    const newElements = [...elements];
    let focusElementId: string | null = null;
    let cursorPosition = 0;
    
    // Determine which element to focus and cursor position
    if (index > 0 && newElements[index - 1].type === 'text') {
      focusElementId = newElements[index - 1].id;
      cursorPosition = newElements[index - 1].value.length;
    } else if (index < newElements.length - 1 && newElements[index + 1].type === 'text') {
      focusElementId = newElements[index + 1].id;
      cursorPosition = 0;
    }
    
    newElements.splice(index, 1);
    
    // Merge adjacent text elements
    if (index > 0 && index < newElements.length) {
      const prevElem = newElements[index - 1];
      const nextElem = newElements[index];
      if (prevElem.type === 'text' && nextElem.type === 'text') {
        cursorPosition = prevElem.value.length;
        prevElem.value += nextElem.value;
        newElements.splice(index, 1);
        focusElementId = prevElem.id;
      }
    }

    setElements(newElements.length > 0 ? newElements : [{ id: 'initial', type: 'text', value: '' }]);
    
    // Restore focus after state update
    if (focusElementId) {
      setTimeout(() => {
        const el = inputRefs.current[focusElementId];
        if (el) {
          el.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          if (el.childNodes.length > 0 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
            range.setStart(el.childNodes[0], Math.min(cursorPosition, el.textContent?.length || 0));
          } else {
            range.setStart(el, 0);
          }
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
  };

  // Handle key down in text input
  const handleTextKeyDown = (e: KeyboardEvent<HTMLSpanElement>, elementId: string) => {
    const element = e.currentTarget;
    const selection = window.getSelection();
    const cursorOffset = selection?.anchorOffset || 0;
    const textLength = element.textContent?.length || 0;
    const cursorAtStart = cursorOffset === 0;
    const cursorAtEnd = cursorOffset === textLength;
    const index = elements.findIndex(el => el.id === elementId);
    
    if (e.key === 'Backspace' && cursorAtStart) {
      // Delete previous chip
      if (index > 0 && elements[index - 1].type === 'field') {
        e.preventDefault();
        handleBackspaceOnField(elements[index - 1].id);
        return;
      }
    } else if (e.key === 'Delete' && cursorAtEnd) {
      // Delete next chip
      if (index < elements.length - 1 && elements[index + 1].type === 'field') {
        e.preventDefault();
        handleBackspaceOnField(elements[index + 1].id);
        return;
      }
    } else if (e.key === 'ArrowLeft' && cursorAtStart) {
      // Move cursor to end of previous text element (skipping chips)
      e.preventDefault();
      let targetIndex = index - 1;
      
      // Skip over chips to find previous text element
      while (targetIndex >= 0 && elements[targetIndex].type === 'field') {
        targetIndex--;
      }
      
      if (targetIndex >= 0) {
        const targetEl = inputRefs.current[elements[targetIndex].id];
        if (targetEl) {
          targetEl.focus();
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(targetEl);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
      return;
    } else if (e.key === 'ArrowRight' && cursorAtEnd) {
      // Move cursor to start of next text element (skipping chips)
      e.preventDefault();
      let targetIndex = index + 1;
      
      // Skip over chips to find next text element
      while (targetIndex < elements.length && elements[targetIndex].type === 'field') {
        targetIndex++;
      }
      
      if (targetIndex < elements.length) {
        const targetEl = inputRefs.current[elements[targetIndex].id];
        if (targetEl) {
          targetEl.focus();
          // Move cursor to start
          const range = document.createRange();
          const sel = window.getSelection();
          if (targetEl.childNodes.length > 0) {
            range.setStart(targetEl.childNodes[0], 0);
          } else {
            range.setStart(targetEl, 0);
          }
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
      return;
    } else if (e.key === '@') {
      e.preventDefault();
      setShowFieldPicker(true);
      setSearchQuery('');
      setSelectedFieldIndex(0);
      
      // Position picker near cursor
      const rect = element.getBoundingClientRect();
      setFieldPickerPosition({ top: rect.bottom + 5, left: rect.left });
      return;
    } else if (showFieldPicker) {
      // Handle navigation in field picker
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFieldIndex(prev => Math.min(prev + 1, filteredFields.length - 1));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFieldIndex(prev => Math.max(prev - 1, 0));
        return;
      } else if (e.key === 'Enter' && filteredFields.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        insertField(filteredFields[selectedFieldIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowFieldPicker(false);
        setSearchQuery('');
        return;
      }
    }
  };

  // Filter fields by search query
  const filteredFields = searchQuery
    ? availableFields.filter(f => 
        f.fieldLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.stepName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableFields;

  // Reset selected index when filtered fields change
  useEffect(() => {
    setSelectedFieldIndex(0);
  }, [searchQuery]);

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
  const validateFormula = (elements: FormulaElement[]): { valid: boolean; error?: string } => {
    const formula = elementsToFormula(elements);
    
    if (!formula.trim()) {
      return { valid: false, error: "Formula cannot be empty" };
    }

    // Check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { valid: false, error: "Unbalanced parentheses in formula" };
    }

    return { valid: true };
  };

  const handleSave = () => {
    const validation = validateFormula(elements);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid formula");
      return;
    }

    setValidationError(null);
    const formulaString = elementsToFormula(elements);
    const references = parseReferences(formulaString);
    onChange(formulaString, references);
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="border border-border-primary rounded-lg p-4 space-y-4 bg-surface-primary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="text-primary-600" size={20} />
          <h4 className="font-semibold text-foreground-primary">Formula Editor</h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-background-secondary rounded"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-3 flex items-start gap-2">
          <WarningCircle className="text-error flex-shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="text-sm font-medium text-error">Invalid Formula</p>
            <p className="text-sm text-error mt-1">{validationError}</p>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-error/60 hover:text-error"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Rich Text Formula Input */}
      <div>
        <label className="block text-sm font-medium text-foreground-secondary mb-2">
          Formula Builder
        </label>
        <div
          ref={containerRef}
          className="min-h-[80px] p-3 border-2 border-border-primary rounded-lg bg-surface-primary focus-within:border-primary-500 focus-within:ring-primary-200 transition-all cursor-text"
          onClick={(e) => {
            // Always try to focus an element when clicking in the container
            const target = e.target as HTMLElement;
            
            // If clicking on the container background or padding area
            if (target === containerRef.current || target.closest('[data-element-id]') === null) {
              const lastTextElement = elements.filter(el => el.type === 'text').pop();
              if (lastTextElement) {
                const el = inputRefs.current[lastTextElement.id];
                if (el) {
                  el.focus();
                  // Move cursor to end
                  const range = document.createRange();
                  const sel = window.getSelection();
                  range.selectNodeContents(el);
                  range.collapse(false);
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                }
              }
            }
          }}
        >
          <div className="flex flex-wrap items-center gap-1">
            {elements.map((element, index) => {
              if (element.type === 'field') {
                return (
                  <span
                    key={element.id}
                    contentEditable={false}
                    data-element-id={element.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-800 rounded-md text-sm font-medium border border-primary-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Determine where to place cursor based on click position
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = (e as any).clientX;
                      const midPoint = rect.left + rect.width / 2;
                      
                      if (clickX < midPoint) {
                        // Clicked on left half - focus previous text element
                        if (index > 0 && elements[index - 1].type === 'text') {
                          const el = inputRefs.current[elements[index - 1].id];
                          if (el) {
                            el.focus();
                            // Move cursor to end
                            setTimeout(() => {
                              const range = document.createRange();
                              const sel = window.getSelection();
                              range.selectNodeContents(el);
                              range.collapse(false);
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            }, 0);
                          }
                        }
                      } else {
                        // Clicked on right half - focus next text element
                        if (index < elements.length - 1 && elements[index + 1].type === 'text') {
                          const el = inputRefs.current[elements[index + 1].id];
                          if (el) {
                            el.focus();
                            // Move cursor to start
                            setTimeout(() => {
                              const range = document.createRange();
                              const sel = window.getSelection();
                              if (el.childNodes.length > 0) {
                                range.setStart(el.childNodes[0], 0);
                              } else {
                                range.setStart(el, 0);
                              }
                              range.collapse(true);
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            }, 0);
                          }
                        }
                      }
                    }}
                    tabIndex={-1}
                  >
                    <Calculator size={14} />
                    <span>{element.display}</span>
                  </span>
                );
              } else {
                return (
                  <span
                    key={element.id}
                    ref={(el) => { inputRefs.current[element.id] = el; }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const target = e.currentTarget;
                      const cursorPos = saveCursorPosition(target);
                      const newValue = target.textContent || '';
                      updateElement(element.id, newValue);
                      
                      // Restore cursor position after React re-render
                      if (cursorPos !== null) {
                        requestAnimationFrame(() => {
                          restoreCursorPosition(target, cursorPos);
                        });
                      }
                    }}
                    onKeyDown={(e) => handleTextKeyDown(e, element.id)}
                    onFocus={() => setFocusedElementId(element.id)}
                    onClick={(e) => {
                      // Ensure the element gets focus and cursor position is set
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.focus();
                    }}
                    data-element-id={element.id}
                    className="inline-block min-w-[8px] outline-none text-sm text-foreground-primary font-mono cursor-text"
                    style={{ 
                      minHeight: '1.5em', 
                      display: 'inline-block',
                      paddingLeft: element.value === '' ? '2px' : '0',
                      paddingRight: element.value === '' ? '2px' : '0'
                    }}
                  >
                    {element.value}
                  </span>
                );
              }
            })}
          </div>
        </div>
        <p className="text-xs text-foreground-secondary mt-2">
          Type your formula directly (numbers, +, -, *, /, parentheses). Press <kbd className="px-1.5 py-0.5 bg-surface-secondary border border-border-primary rounded text-xs">@</kbd> or click "Add Field" to insert field references.
        </p>
      </div>

      {/* Field Picker Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowFieldPicker(!showFieldPicker);
            if (!showFieldPicker && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setFieldPickerPosition({ top: rect.bottom + 5, left: rect.left });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={16} />
          {showFieldPicker ? "Hide Fields" : "Add Field"}
        </button>

        {showFieldPicker && (
          <div ref={fieldPickerRef} className="mt-3 border border-border-primary rounded-lg overflow-hidden shadow-lg max-h-64 overflow-y-auto bg-surface-primary">
            {filteredFields.length > 0 ? (
              <>
                <div className="bg-surface-secondary px-3 py-2 border-b border-border-primary sticky top-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFieldIndex(prev => Math.min(prev + 1, filteredFields.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFieldIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter' && filteredFields.length > 0) {
                        e.preventDefault();
                        e.stopPropagation();
                        insertField(filteredFields[selectedFieldIndex]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowFieldPicker(false);
                        setSearchQuery('');
                      }
                    }}
                    placeholder="Search fields... (↑↓ to navigate, Enter to select)"
                    className="w-full px-2 py-1 border border-border-primary rounded text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-surface-primary text-foreground-primary"
                    autoFocus
                  />
                </div>
                <div className="divide-y divide-border-primary">
                  {filteredFields.map((field, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertField(field)}
                      onMouseEnter={() => setSelectedFieldIndex(index)}
                      className={`w-full px-3 py-2 text-left transition-colors ${
                        index === selectedFieldIndex ? 'bg-primary-100' : 'hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground-primary truncate">
                            {field.fieldLabel}
                          </div>
                          <div className="text-xs text-foreground-secondary">
                            {field.stepName}
                            {field.isNested && (
                              <span className="ml-1 px-1.5 py-0.5 bg-warning/20 text-warning rounded text-xs">
                                Nested
                              </span>
                            )}
                          </div>
                        </div>
                        <Plus size={16} className="text-primary-600 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-foreground-secondary">
                  {searchQuery ? 'No fields match your search' : 'No number fields available from previous steps'}
                </p>
                <p className="text-xs text-foreground-tertiary mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add number fields to earlier steps to use them in calculations'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border-primary">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-foreground-secondary hover:bg-surface-secondary rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!elementsToFormula(elements).trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Formula
        </button>
      </div>
    </div>
  );
}
