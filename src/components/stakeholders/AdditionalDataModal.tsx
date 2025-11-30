"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash, Save } from "@/lib/icons";
import { StakeholderStepData, StakeholderProcessStep } from "@/lib/types/schemas";

interface AdditionalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  stepData?: StakeholderStepData[]; // Completed step data to select from
  processSteps?: StakeholderProcessStep[]; // Process steps for context
  existingData?: Record<string, any>; // Existing additional data for editing
  title?: string;
}

interface DataField {
  key: string;
  value: any;
  label: string;
  sourceStep?: string; // Which step this data came from
}

export default function AdditionalDataModal({
  isOpen,
  onClose,
  onSave,
  stepData = [],
  processSteps = [],
  existingData = {},
  title = "Select Additional Data",
}: AdditionalDataModalProps) {
  const [selectedFields, setSelectedFields] = useState<DataField[]>([]);
  const [customFields, setCustomFields] = useState<DataField[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize with existing data if editing
  useEffect(() => {
    if (Object.keys(existingData).length > 0) {
      const fields = Object.entries(existingData).map(([key, value]) => ({
        key,
        value,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
      setCustomFields(fields);
    }
  }, [existingData]);

  // Build available fields from step data
  const availableFields: DataField[] = [];
  
  stepData.forEach((sd) => {
    if (!sd.is_completed || !sd.data) return;
    
    const step = processSteps.find((s) => s.id === sd.step_id);
    const stepName = step?.name || `Step ${step?.step_order || "?"}`;
    
    Object.entries(sd.data).forEach(([key, value]) => {
      // Skip file fields
      if (typeof value === 'object' && value !== null && 'path' in value) {
        return;
      }
      
      // Get the field label from field definitions if available
      const fieldDef = step?.field_definitions?.fields?.find((f) => f.key === key);
      const fieldLabel = fieldDef?.label || key.replace(/_/g, " ");
      
      availableFields.push({
        key: `${stepName}_${key}`,
        value,
        label: `${stepName}: ${fieldLabel}`,
        sourceStep: stepName,
      });
    });
  });

  const handleAddField = (field: DataField) => {
    // Don't add if already selected
    if (selectedFields.some((f) => f.key === field.key)) {
      return;
    }
    setSelectedFields([...selectedFields, field]);
  };

  const handleRemoveField = (key: string) => {
    setSelectedFields(selectedFields.filter((f) => f.key !== key));
  };

  const handleAddCustomField = () => {
    const newField: DataField = {
      key: `custom_field_${Date.now()}`,
      value: "",
      label: "New Field",
    };
    setCustomFields([...customFields, newField]);
  };

  const handleUpdateCustomField = (index: number, updates: Partial<DataField>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...updates };
    setCustomFields(updated);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Combine selected fields and custom fields into a single object
      const data: Record<string, any> = {};
      
      selectedFields.forEach((field) => {
        data[field.label] = field.value;
      });
      
      customFields.forEach((field) => {
        if (field.label.trim() && field.value !== undefined && field.value !== "") {
          data[field.label] = field.value;
        }
      });
      
      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Error saving additional data:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-surface-primary rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-primary">
          <h2 className="text-lg sm:text-xl font-bold text-foreground-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-foreground-tertiary hover:text-foreground-secondary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Available Fields from Steps */}
          {availableFields.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground-primary mb-3">
                Select from Completed Steps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {availableFields.map((field) => {
                  const isSelected = selectedFields.some((f) => f.key === field.key);
                  return (
                    <button
                      key={field.key}
                      onClick={() => !isSelected && handleAddField(field)}
                      disabled={isSelected}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "border-green-300 bg-green-50 dark:bg-green-900/30 text-foreground-tertiary cursor-not-allowed"
                          : "border-border-primary hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-medium text-foreground-secondary truncate">
                        {field.label}
                      </p>
                      <p className="text-xs sm:text-sm text-foreground-tertiary mt-1 truncate">
                        {typeof field.value === "boolean"
                          ? field.value
                            ? "Yes"
                            : "No"
                          : String(field.value)}
                      </p>
                      {isSelected && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Selected</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Fields */}
          {selectedFields.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground-primary mb-3">
                Selected Fields ({selectedFields.length})
              </h3>
              <div className="space-y-2">
                {selectedFields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs sm:text-sm font-medium text-foreground-primary truncate">
                        {field.label}
                      </p>
                      <p className="text-xs sm:text-sm text-foreground-tertiary truncate">
                        {typeof field.value === "boolean"
                          ? field.value
                            ? "Yes"
                            : "No"
                          : String(field.value)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveField(field.key)}
                      className="flex-shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground-primary">
                Custom Fields
              </h3>
              <button
                onClick={handleAddCustomField}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>
            <div className="space-y-3">
              {customFields.length === 0 ? (
                <p className="text-xs sm:text-sm text-foreground-tertiary text-center py-6 bg-background-secondary rounded-lg border-2 border-dashed border-border-secondary">
                  No custom fields added. Click "Add Field" to create one.
                </p>
              ) : (
                customFields.map((field, index) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-3 bg-background-secondary rounded-lg border border-border-primary"
                  >
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateCustomField(index, { label: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-border-secondary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary text-foreground-primary"
                        placeholder="Field name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Value
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            handleUpdateCustomField(index, { value: e.target.value })
                          }
                          className="flex-1 px-3 py-2 text-sm border border-border-secondary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary text-foreground-primary"
                          placeholder="Value"
                        />
                        <button
                          onClick={() => handleRemoveCustomField(index)}
                          className="flex-shrink-0 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-border-primary">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 text-sm border border-border-secondary text-foreground-secondary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (selectedFields.length === 0 && customFields.length === 0)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
