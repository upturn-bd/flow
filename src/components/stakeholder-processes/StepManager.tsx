"use client";

import { useState, useEffect } from "react";
import { StakeholderProcessStep, FieldType, FieldDefinition, DropdownOption } from "@/lib/types/schemas";
import { useTeams } from "@/hooks/useTeams";
import { Plus, Trash, Calendar, CaretDown, CaretUp, ArrowUp, ArrowDown, List, X, Calculator, WarningCircle } from "@/lib/icons";
import { FIELD_TYPES, generateFieldKey } from "@/lib/constants";
import Toggle from "@/components/ui/Toggle";
import FormulaEditor from "./FormulaEditor";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";

interface StepManagerProps {
  processId: number;
  steps: StakeholderProcessStep[];
  onStepsChange: () => void;
  onCreateStep: (stepData: any) => Promise<void>;
  onUpdateStep: (stepId: number, stepData: any) => Promise<void>;
  onDeleteStep: (stepId: number, processId: number) => Promise<boolean>;
  onReorderSteps: (processId: number, stepIds: number[]) => Promise<boolean>;
}

export default function StepManager({
  processId,
  steps,
  onStepsChange,
  onCreateStep,
  onUpdateStep,
  onDeleteStep,
  onReorderSteps,
}: StepManagerProps) {
  const { teams, fetchTeams } = useTeams();
  const [showAddStep, setShowAddStep] = useState(false);
  const [editingStep, setEditingStep] = useState<StakeholderProcessStep | null>(null);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleAddStep = () => {
    setEditingStep(null);
    setShowAddStep(true);
  };

  const handleEditStep = (step: StakeholderProcessStep) => {
    setEditingStep(step);
    setShowAddStep(true);
  };

  const handleDeleteStep = async (step: StakeholderProcessStep) => {
    if (window.confirm(`Are you sure you want to delete the step "${step.name}"?`)) {
      await onDeleteStep(step.id!, processId);
      onStepsChange();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return; // Already at the top
    
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    
    const stepIds = newSteps.map(step => step.id!);
    const success = await onReorderSteps(processId, stepIds);
    
    if (success) {
      onStepsChange();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === steps.length - 1) return; // Already at the bottom
    
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    
    const stepIds = newSteps.map(step => step.id!);
    const success = await onReorderSteps(processId, stepIds);
    
    if (success) {
      onStepsChange();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground-primary">Process Steps</h3>
        <button
          onClick={handleAddStep}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <div className="text-center py-8 bg-background-secondary rounded-lg border-2 border-dashed border-border-primary">
          <p className="text-sm text-foreground-secondary">No steps defined yet</p>
          <p className="text-xs text-foreground-tertiary mt-1">Add at least one step to create the process</p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col sm:flex-row items-start gap-3 p-3 sm:p-4 bg-surface-primary border border-border-primary rounded-lg hover:shadow-md transition-all"
            >
              {/* Reorder Buttons + Step Number - Mobile: Horizontal, Desktop: Vertical */}
              <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 w-full sm:w-auto">
                <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-1.5 sm:p-1 rounded transition-colors ${
                      index === 0
                        ? "text-foreground-tertiary/50 cursor-not-allowed"
                        : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground-primary"
                    }`}
                    title="Move up"
                    aria-label="Move step up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === steps.length - 1}
                    className={`p-1.5 sm:p-1 rounded transition-colors ${
                      index === steps.length - 1
                        ? "text-foreground-tertiary/50 cursor-not-allowed"
                        : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground-primary"
                    }`}
                    title="Move down"
                    aria-label="Move step down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                  {step.step_order}
                </div>
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground-primary text-base">{step.name}</h4>
                    {step.description && (
                      <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">{step.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-foreground-tertiary">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">
                          {step.teams && step.teams.length > 1 ? "Teams:" : "Team:"}
                        </span>
                        {step.teams && step.teams.length > 0 ? (
                          <span className="inline-flex flex-wrap gap-1">
                            {step.teams.map((team, idx) => (
                              <span key={team.id}>
                                {team.name}
                                {idx < step.teams!.length - 1 && ","}
                              </span>
                            ))}
                          </span>
                        ) : step.team?.name ? (
                          step.team.name
                        ) : (
                          "Not assigned"
                        )}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{step.field_definitions?.fields?.length || 0} fields</span>
                      {step.use_date_range && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Date range
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-1 self-end sm:self-start">
                    <button
                      onClick={() => handleEditStep(step)}
                      className="px-3 py-1.5 text-xs sm:text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step)}
                      className="p-1.5 sm:p-1 text-error hover:bg-error/10 rounded transition-colors"
                      aria-label="Delete step"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Step Modal */}
      {showAddStep && (
        <StepFormModal
          processId={processId}
          step={editingStep}
          teams={teams}
          nextStepOrder={steps.length + 1}
          availableSteps={steps}
          onSubmit={async (data) => {
            try {
              if (editingStep) {
                await onUpdateStep(editingStep.id!, data);
              } else {
                await onCreateStep(data);
              }
              setShowAddStep(false);
              setEditingStep(null);
              onStepsChange();
            } catch (error) {
              console.error("Error in onSubmit:", error);
              throw error; // Re-throw to be caught by handleSubmit
            }
          }}
          onClose={() => {
            setShowAddStep(false);
            setEditingStep(null);
          }}
        />
      )}
    </div>
  );
}

// Step Form Modal Component
interface StepFormModalProps {
  processId: number;
  step: StakeholderProcessStep | null;
  teams: any[];
  nextStepOrder: number;
  availableSteps: StakeholderProcessStep[];
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

function StepFormModal({ processId, step, teams, nextStepOrder, availableSteps, onSubmit, onClose }: StepFormModalProps) {
  const [formData, setFormData] = useState({
    process_id: processId,
    name: step?.name || "",
    description: step?.description || "",
    step_order: step?.step_order || nextStepOrder,
    team_ids: step?.team_ids || [],
    field_definitions: step?.field_definitions || { fields: [] },
    use_date_range: step?.use_date_range || false,
    start_date: step?.start_date || "",
    end_date: step?.end_date || "",
    can_reject: step?.can_reject || false,
    status_field: step?.status_field || { enabled: false, label: "Status", options: [] },
  });

  const [loading, setLoading] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [statusOptionInput, setStatusOptionInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate step name
    if (!formData.name.trim()) {
      errors.name = "Step name is required";
    }
    
    // Validate team selection
    if (!formData.team_ids || formData.team_ids.length === 0) {
      errors.team_ids = "Please assign at least one team to this step";
    }
    
    // Validate fields
    formData.field_definitions.fields.forEach((field, index) => {
      const fieldKey = `field_${index}`;
      
      // Check if field has a label
      if (!field.label.trim()) {
        errors[`${fieldKey}_label`] = `Field ${index + 1}: Label is required`;
      }
      
      // Validate dropdown/multi-select fields have options
      if ((field.type === 'dropdown' || field.type === 'multi_select') && (!field.options || field.options.length === 0)) {
        errors[`${fieldKey}_options`] = `Field "${field.label || index + 1}": Add at least one option`;
      }
      
      // Validate calculated fields have a formula
      if (field.type === 'calculated' && (!field.formula || !field.formula.trim())) {
        errors[`${fieldKey}_formula`] = `Field "${field.label || index + 1}": Formula is required`;
      }
      
      // Validate nested fields have labels
      if (field.nested && field.nested.length > 0) {
        field.nested.forEach((nestedField, nestedIndex) => {
          if (!nestedField.label.trim()) {
            errors[`${fieldKey}_nested_${nestedIndex}`] = `Nested field in "${field.label || index + 1}" is missing a label`;
          }
        });
      }
      
      // Validate option-specific nested fields
      if (field.options) {
        field.options.forEach((option, optIndex) => {
          if (option.nested && option.nested.length > 0) {
            option.nested.forEach((nestedField, nestedIndex) => {
              if (!nestedField.label.trim()) {
                errors[`${fieldKey}_option_${optIndex}_nested_${nestedIndex}`] = `Nested field in option "${option.label}" is missing a label`;
              }
            });
          }
        });
      }
    });
    
    // Validate status field if enabled
    if (formData.status_field?.enabled && (!formData.status_field.options || formData.status_field.options.length === 0)) {
      errors.status_field = "Add at least one status option";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addField = () => {
    const existingKeys = formData.field_definitions.fields.map(f => f.key);
    const newField = {
      key: `field_${Date.now()}`, // Temporary key, will be updated when label is set
      label: "",
      type: "text" as FieldType,
      required: true, // Default to required
    };

    setFormData({
      ...formData,
      field_definitions: {
        fields: [...formData.field_definitions.fields, newField],
      },
    });
  };

  const removeField = (index: number) => {
    const newFields = formData.field_definitions.fields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      field_definitions: { fields: newFields },
    });
  };

  const updateField = (index: number, updates: any) => {
    const newFields = formData.field_definitions.fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setFormData({
      ...formData,
      field_definitions: { fields: newFields },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-validation-error]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    try {
      // Convert empty date strings to null for PostgreSQL
      const submissionData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      
      await onSubmit(submissionData);
      // Clear any validation errors on success
      setValidationErrors({});
    } catch (error) {
      console.error("Error submitting step:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save step";
      setValidationErrors({ 
        submit: `${errorMessage}. Please check your permissions and try again.` 
      });
      // Don't close modal on error - keep it open so user can see the error
      setLoading(false);
      return;
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-primary rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-primary sticky top-0 bg-surface-primary z-10">
          <h3 className="text-lg sm:text-xl font-bold text-foreground-primary">
            {step ? "Edit Step" : "Add New Step"}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-background-secondary rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Validation Errors Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-4" data-validation-error>
              <div className="flex items-start gap-2">
                <WarningCircle className="text-error flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-error mb-2">Please fix the following errors:</h4>
                  <ul className="text-sm text-error space-y-1 list-disc list-inside">
                    {Object.entries(validationErrors).slice(0, 5).map(([key, message]) => (
                      <li key={key}>{message}</li>
                    ))}
                    {Object.keys(validationErrors).length > 5 && (
                      <li className="text-error">...and {Object.keys(validationErrors).length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Step Name */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Step Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (validationErrors.name) {
                  const { name, ...rest } = validationErrors;
                  setValidationErrors(rest);
                }
              }}
              className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors ${
                validationErrors.name ? 'border-error' : 'border-border-primary'
              }`}
              required
            />
            {validationErrors.name && (
              <p className="text-error text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 sm:py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Team Assignment */}
          <div>
            <MultiSelectDropdown
              label="Teams"
              value={formData.team_ids.map(String)}
              onChange={(values) => {
                const teamIds = values.map(Number);
                setFormData({ 
                  ...formData, 
                  team_ids: teamIds
                });
                if (validationErrors.team_ids) {
                  const { team_ids, ...rest } = validationErrors;
                  setValidationErrors(rest);
                }
              }}
              options={teams.map(team => ({
                label: team.name,
                value: String(team.id)
              }))}
              placeholder="Select teams..."
              required
              error={validationErrors.team_ids}
            />
            <p className="text-xs text-foreground-tertiary mt-1">
              Select one or more teams that can work on this step
            </p>
          </div>

          {/* Date Range */}
          <div className="pt-2">
            <Toggle
              checked={formData.use_date_range}
              onChange={(checked) => setFormData({ ...formData, use_date_range: checked })}
              label="Enable Date Range"
            />

            {formData.use_date_range && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pl-0 sm:pl-14">
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Field Definitions */}
          <div className="border-t border-border-primary pt-5 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <label className="text-sm font-medium text-foreground-secondary">Data Fields</label>
              <button
                type="button"
                onClick={addField}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors font-medium"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>

            <div className="space-y-3">
              {formData.field_definitions.fields.map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  index={index}
                  onUpdate={updateField}
                  onRemove={removeField}
                  isEditing={editingFieldIndex === index}
                  onEditToggle={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}
                  availableSteps={availableSteps}
                  currentStepOrder={formData.step_order}
                  validationErrors={validationErrors}
                  onClearError={(key) => {
                    const newErrors = { ...validationErrors };
                    delete newErrors[key];
                    setValidationErrors(newErrors);
                  }}
                  allFields={formData.field_definitions.fields}
                />
              ))}
            </div>
          </div>

          {/* Rejection Option */}
          <div className="border-t border-border-primary pt-5 sm:pt-6">
            <Toggle
              checked={formData.can_reject}
              onChange={(checked) => setFormData({ ...formData, can_reject: checked })}
              label="Allow Rejection"
              description="Team members can reject stakeholders at this step"
            />
          </div>

          {/* Status Field Option */}
          <div className="border-t border-border-primary pt-5 sm:pt-6">
            <Toggle
              checked={formData.status_field?.enabled || false}
              onChange={(checked) => setFormData({ 
                ...formData, 
                status_field: { 
                  ...formData.status_field,
                  enabled: checked,
                  label: formData.status_field?.label || "Status",
                  options: formData.status_field?.options || []
                } 
              })}
              label="Enable Step Status"
              description="Add a status dropdown field to track step progress"
            />

            {formData.status_field?.enabled && (
              <div className="mt-4 pl-0 sm:pl-14 space-y-4">
                {/* Status Field Error Warning */}
                {validationErrors.status_field && (
                  <div className="p-2 bg-error/10 border border-error/30 rounded flex items-start gap-2">
                    <WarningCircle className="text-error flex-shrink-0 mt-0.5" size={14} />
                    <p className="text-xs text-error">{validationErrors.status_field}</p>
                  </div>
                )}
                
                {/* Status Label */}
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Status Field Label
                  </label>
                  <input
                    type="text"
                    value={formData.status_field?.label || "Status"}
                    onChange={(e) => setFormData({
                      ...formData,
                      status_field: {
                        ...formData.status_field,
                        enabled: true,
                        label: e.target.value,
                        options: formData.status_field?.options || []
                      }
                    })}
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                    placeholder="e.g., Status, Progress, Stage"
                  />
                </div>

                {/* Status Options */}
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-2">
                    Status Options
                  </label>
                  
                  {/* Add Option Input */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={statusOptionInput}
                      onChange={(e) => setStatusOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (statusOptionInput.trim()) {
                            const newOption = {
                              label: statusOptionInput.trim(),
                              value: statusOptionInput.trim().toLowerCase().replace(/\s+/g, '_'),
                            };
                            setFormData({
                              ...formData,
                              status_field: {
                                ...formData.status_field,
                                enabled: true,
                                label: formData.status_field?.label || "Status",
                                options: [...(formData.status_field?.options || []), newOption]
                              }
                            });
                            setStatusOptionInput("");
                          }
                        }
                      }}
                      placeholder="Enter status option (e.g., In Progress, Completed)"
                      className="flex-1 px-3 py-2 text-sm border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (statusOptionInput.trim()) {
                          const newOption = {
                            label: statusOptionInput.trim(),
                            value: statusOptionInput.trim().toLowerCase().replace(/\s+/g, '_'),
                          };
                          setFormData({
                            ...formData,
                            status_field: {
                              ...formData.status_field,
                              enabled: true,
                              label: formData.status_field?.label || "Status",
                              options: [...(formData.status_field?.options || []), newOption]
                            }
                          });
                          setStatusOptionInput("");
                        }
                      }}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {(formData.status_field?.options || []).length > 0 ? (
                      (formData.status_field?.options || []).map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center justify-between p-2.5 sm:p-2 bg-surface-primary border border-border-primary rounded text-sm"
                        >
                          <span className="text-foreground-secondary">{option.label}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = (formData.status_field?.options || []).filter((_, i) => i !== optIndex);
                              setFormData({
                                ...formData,
                                status_field: {
                                  ...formData.status_field,
                                  enabled: true,
                                  label: formData.status_field?.label || "Status",
                                  options: newOptions
                                }
                              });
                            }}
                            className="text-error hover:text-error/80 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-foreground-tertiary italic">No status options added yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-border-primary sticky bottom-0 bg-surface-primary -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 border border-border-primary text-foreground-secondary rounded-lg hover:bg-background-secondary transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? "Saving..." : step ? "Update Step" : "Add Step"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Field Editor Component for handling different field types including dropdown options
interface FieldEditorProps {
  field: FieldDefinition;
  index: number;
  onUpdate: (index: number, updates: any) => void;
  onRemove: (index: number) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  availableSteps: StakeholderProcessStep[];
  currentStepOrder: number;
  validationErrors: Record<string, string>;
  onClearError: (key: string) => void;
  allFields: FieldDefinition[]; // All fields in current step for formula validation
}

function FieldEditor({ 
  field, 
  index, 
  onUpdate, 
  onRemove, 
  isEditing, 
  onEditToggle, 
  availableSteps, 
  currentStepOrder,
  validationErrors,
  onClearError,
  allFields
}: FieldEditorProps) {
  const [optionInput, setOptionInput] = useState("");
  const [showNestedFields, setShowNestedFields] = useState(false);
  const [editingOptionNested, setEditingOptionNested] = useState<number | null>(null);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  
  const isDropdownType = field.type === 'dropdown' || field.type === 'multi_select';
  const isCalculatedField = field.type === 'calculated';
  
  // Check for validation errors related to this field
  const fieldKey = `field_${index}`;
  const hasLabelError = !!validationErrors[`${fieldKey}_label`];
  const hasOptionsError = !!validationErrors[`${fieldKey}_options`];
  const hasFormulaError = !!validationErrors[`${fieldKey}_formula`];

  const addOption = () => {
    if (!optionInput.trim()) return;
    
    const newOption: DropdownOption = {
      label: optionInput.trim(),
      value: optionInput.trim().toLowerCase().replace(/\s+/g, '_'),
    };
    
    const currentOptions = field.options || [];
    onUpdate(index, { options: [...currentOptions, newOption] });
    setOptionInput("");
    
    // Clear options error when adding first option
    if (currentOptions.length === 0 && hasOptionsError) {
      onClearError(`${fieldKey}_options`);
    }
  };

  const removeOption = (optionIndex: number) => {
    const currentOptions = field.options || [];
    onUpdate(index, { options: currentOptions.filter((_, i) => i !== optionIndex) });
  };

  const updateOption = (optionIndex: number, updates: Partial<DropdownOption>) => {
    const currentOptions = field.options || [];
    const updatedOptions = currentOptions.map((opt, i) =>
      i === optionIndex ? { ...opt, ...updates } : opt
    );
    onUpdate(index, { options: updatedOptions });
  };

  const addNestedField = (parentNested?: FieldDefinition[]) => {
    const newField: FieldDefinition = {
      key: `nested_${Date.now()}`, // Temporary key, will be updated when label is set
      label: "",
      type: "text" as FieldType,
      required: true, // Default to required
    };

    const currentNested = parentNested || field.nested || [];
    onUpdate(index, { nested: [...currentNested, newField] });
  };

  const updateNestedField = (nestedIndex: number, updates: Partial<FieldDefinition>) => {
    const currentNested = field.nested || [];
    const updatedNested = currentNested.map((f, i) =>
      i === nestedIndex ? { ...f, ...updates } : f
    );
    onUpdate(index, { nested: updatedNested });
  };

  const removeNestedField = (nestedIndex: number) => {
    const currentNested = field.nested || [];
    onUpdate(index, { nested: currentNested.filter((_, i) => i !== nestedIndex) });
  };

  const addOptionNestedField = (optionIndex: number) => {
    const currentOptions = field.options || [];
    const option = currentOptions[optionIndex];
    const newField: FieldDefinition = {
      key: `opt_nested_${Date.now()}`, // Temporary key, will be updated when label is set
      label: "",
      type: "text" as FieldType,
      required: true, // Default to required
    };
    
    const currentNested = option.nested || [];
    updateOption(optionIndex, { nested: [...currentNested, newField] });
  };

  const updateOptionNestedField = (optionIndex: number, nestedIndex: number, updates: Partial<FieldDefinition>) => {
    const currentOptions = field.options || [];
    const option = currentOptions[optionIndex];
    const currentNested = option.nested || [];
    const updatedNested = currentNested.map((f, i) =>
      i === nestedIndex ? { ...f, ...updates } : f
    );
    updateOption(optionIndex, { nested: updatedNested });
  };

  const removeOptionNestedField = (optionIndex: number, nestedIndex: number) => {
    const currentOptions = field.options || [];
    const option = currentOptions[optionIndex];
    const currentNested = option.nested || [];
    updateOption(optionIndex, { nested: currentNested.filter((_, i) => i !== nestedIndex) });
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      number: 'Number',
      boolean: 'Boolean',
      date: 'Date',
      file: 'File',
      geolocation: 'Geolocation',
      dropdown: 'Dropdown',
      multi_select: 'Multi-Select',
      calculated: 'Calculated Field',
    };
    return labels[type] || type;
  };

  return (
    <div className={`bg-background-secondary rounded-lg border ${
      hasLabelError || hasOptionsError || hasFormulaError ? 'border-error/30 bg-error/10' : 'border-border-primary'
    }`}>
      {/* Validation Error Banner */}
      {(hasLabelError || hasOptionsError || hasFormulaError) && (
        <div className="px-3 py-2 bg-error/20 border-b border-error/30 flex items-center gap-2">
          <WarningCircle className="text-error flex-shrink-0" size={16} />
          <div className="flex-1">
            <p className="text-xs font-medium text-error">
              {hasLabelError && validationErrors[`${fieldKey}_label`]}
              {hasOptionsError && validationErrors[`${fieldKey}_options`]}
              {hasFormulaError && validationErrors[`${fieldKey}_formula`]}
            </p>
          </div>
        </div>
      )}
      
      {/* Field Header */}
      <div className="flex flex-col sm:flex-row items-start gap-3 p-3">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              value={field.label}
              onChange={(e) => {
                const newLabel = e.target.value;
                const updates: any = { label: newLabel };
                
                // Generate human-readable key when label changes
                if (newLabel.trim()) {
                  const existingKeys = allFields
                    .filter((f, i) => i !== index)
                    .map(f => f.key);
                  updates.key = generateFieldKey(newLabel, existingKeys);
                }
                
                onUpdate(index, updates);
                if (hasLabelError) {
                  onClearError(`${fieldKey}_label`);
                }
              }}
              placeholder="Field Label"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-surface-primary transition-colors ${
                hasLabelError ? 'border-error' : 'border-border-primary'
              }`}
            />
            {hasLabelError && (
              <p className="text-error text-xs mt-1">{validationErrors[`${fieldKey}_label`]}</p>
            )}
          </div>
          <select
            value={field.type}
            onChange={(e) => {
              const newType = e.target.value as FieldType;
              onUpdate(index, { type: newType, options: newType === 'dropdown' || newType === 'multi_select' ? [] : undefined });
            }}
            className="px-3 py-2 text-sm border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-surface-primary transition-colors"
          >
            {Object.values(FIELD_TYPES).map((type) => (
              <option key={type} value={type}>
                {getFieldTypeLabel(type)}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <Toggle
              checked={field.required}
              onChange={(checked) => onUpdate(index, { required: checked })}
              label="Required field"
            />
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-1 w-full sm:w-auto">
          {isDropdownType && (
            <button
              type="button"
              onClick={onEditToggle}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-1.5 ${
                isEditing 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
              }`}
              title={isEditing ? "Collapse options" : "Edit options"}
            >
              {isEditing ? <CaretUp size={16} /> : <CaretDown size={16} />}
              <span>{isEditing ? "Collapse" : "Options"}</span>
            </button>
          )}
          {isCalculatedField && (
            <button
              type="button"
              onClick={() => setShowFormulaEditor(!showFormulaEditor)}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-1.5 ${
                showFormulaEditor 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
              title={showFormulaEditor ? "Hide formula editor" : "Edit formula"}
            >
              <Calculator size={16} />
              <span>{showFormulaEditor ? "Hide" : "Formula"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNestedFields(!showNestedFields)}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-1.5 ${
              showNestedFields 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
            title={showNestedFields ? "Hide nested fields" : "Configure nested fields"}
          >
            <List size={16} />
            <span>{showNestedFields ? "Hide" : "Nested"}</span>
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-error hover:bg-error/10 rounded transition-colors"
            aria-label="Remove field"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {/* Dropdown Options Editor */}
      {isDropdownType && isEditing && (
        <div className="px-3 pb-3 border-t border-border-primary mt-2 pt-3 bg-surface-primary">
          {/* Options Error Warning */}
          {hasOptionsError && (
            <div className="mb-3 p-2 bg-error/10 border border-error/30 rounded flex items-start gap-2">
              <WarningCircle className="text-error flex-shrink-0 mt-0.5" size={14} />
              <p className="text-xs text-error">{validationErrors[`${fieldKey}_options`]}</p>
            </div>
          )}
          
          {/* Section Header */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-foreground-primary mb-1">
              {field.type === 'multi_select' ? 'Multi-Select Options' : 'Dropdown Options'}
            </h4>
            <p className="text-xs text-foreground-secondary">
              Add the options that users can select from for this field
            </p>
          </div>
          
          {/* Add Option Input */}
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <label className="block text-xs font-medium text-primary-900 mb-2">
              Add New Option
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                  }
                }}
                placeholder="Type option name and press Enter or click Add"
                className="flex-1 px-3 py-2 text-sm border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary"
              />
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus size={14} />
                Add Option
              </button>
            </div>
          </div>

          {/* Options List */}
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-2">
              Available Options ({(field.options || []).length})
            </label>
            <div className="space-y-2">
              {(field.options || []).length > 0 ? (
                (field.options || []).map((option, optIndex) => (
                <div key={optIndex} className="bg-surface-primary border border-border-primary rounded">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-foreground-secondary text-sm">{option.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingOptionNested(editingOptionNested === optIndex ? null : optIndex)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          editingOptionNested === optIndex
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-foreground-tertiary hover:bg-background-secondary'
                        }`}
                        title="Configure nested fields for this option"
                      >
                        Nested ({option.nested?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOption(optIndex)}
                        className="text-error hover:text-error/80 text-xs px-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {/* Option Nested Fields Editor */}
                  {editingOptionNested === optIndex && (
                    <div className="px-3 pb-3 border-t border-border-secondary bg-background-secondary">
                      <div className="flex items-center justify-between mb-2 mt-2">
                        <label className="text-xs font-medium text-foreground-secondary">
                          Nested Fields for "{option.label}"
                        </label>
                        <button
                          type="button"
                          onClick={() => addOptionNestedField(optIndex)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <Plus size={12} />
                          Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(option.nested || []).map((nestedField, nestedIdx) => (
                          <div key={nestedIdx} className="bg-surface-primary p-2 sm:p-2.5 rounded border border-border-primary space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={nestedField.label}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  const updates: any = { label: newLabel };
                                  
                                  // Generate human-readable key when label changes
                                  if (newLabel.trim()) {
                                    const existingKeys = (option.nested || [])
                                      .filter((_, i) => i !== nestedIdx)
                                      .map(f => f.key);
                                    updates.key = generateFieldKey(newLabel, existingKeys);
                                  }
                                  
                                  updateOptionNestedField(optIndex, nestedIdx, updates);
                                }}
                                placeholder="Field Label"
                                className="flex-1 px-2 py-1.5 sm:py-1 text-xs border border-border-primary rounded focus:ring-1 focus:ring-primary-500 outline-none"
                              />
                              <select
                                value={nestedField.type}
                                onChange={(e) => updateOptionNestedField(optIndex, nestedIdx, { type: e.target.value as FieldType })}
                                className="w-full sm:w-auto px-2 py-1.5 sm:py-1 text-xs border border-border-primary rounded focus:ring-1 focus:ring-primary-500 outline-none"
                              >
                                {Object.values(FIELD_TYPES).map((type) => (
                                  <option key={type} value={type}>
                                    {getFieldTypeLabel(type)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Toggle
                                  checked={nestedField.required}
                                  onChange={(checked) => updateOptionNestedField(optIndex, nestedIdx, { required: checked })}
                                />
                                <span className="text-xs text-foreground-secondary font-medium">Required</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOptionNestedField(optIndex, nestedIdx)}
                                className="px-2 py-1 text-xs text-error hover:bg-error/10 rounded font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!option.nested || option.nested.length === 0) && (
                          <p className="text-xs text-foreground-tertiary italic text-center py-2">
                            No nested fields defined
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 px-4 bg-background-secondary border-2 border-dashed border-border-primary rounded-lg">
                <p className="text-sm text-foreground-secondary mb-1">No options added yet</p>
                <p className="text-xs text-foreground-tertiary">Use the "Add New Option" section above to create your first option</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Formula Editor (for calculated fields) */}
      {isCalculatedField && showFormulaEditor && (
        <div className="px-3 pb-3 border-t border-border-primary mt-2 pt-3 bg-surface-primary">
          {hasFormulaError && (
            <div className="mb-3 p-2 bg-warning/10 border border-warning/30 rounded flex items-start gap-2">
              <WarningCircle className="text-warning flex-shrink-0 mt-0.5" size={14} />
              <p className="text-xs text-warning">
                Please configure a valid formula for this calculated field
              </p>
            </div>
          )}
          <FormulaEditor
            formula={field.formula || ""}
            onChange={(formula, references) => {
              onUpdate(index, { formula, referencedFields: references });
              if (hasFormulaError && formula.trim()) {
                onClearError(`${fieldKey}_formula`);
              }
            }}
            availableSteps={availableSteps}
            currentStepOrder={currentStepOrder}
            currentStepFields={allFields.filter(f => f.key !== field.key)}
            onClose={() => setShowFormulaEditor(false)}
          />
        </div>
      )}

      {/* General Nested Fields Editor (for all field types) */}
      {showNestedFields && (
        <div className="px-3 pb-3 border-t border-border-primary mt-2 pt-3 bg-surface-primary">
          {/* Section Header */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-foreground-primary mb-1">
              Nested Fields
            </h4>
            <p className="text-xs text-foreground-secondary">
              Define additional fields that appear when this field is filled
            </p>
          </div>
          
          {/* Add Nested Field Button */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => addNestedField()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors font-medium w-full justify-center"
            >
              <Plus size={14} />
              Add Nested Field
            </button>
          </div>
          
          {/* Nested Fields List */}
          <div className="space-y-2">
            {(field.nested || []).map((nestedField, nestedIdx) => (
              <div key={nestedIdx} className="bg-surface-primary p-2 sm:p-2.5 rounded border border-border-primary space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={nestedField.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      const updates: any = { label: newLabel };
                      
                      // Generate human-readable key when label changes
                      if (newLabel.trim()) {
                        const existingKeys = (field.nested || [])
                          .filter((_, i) => i !== nestedIdx)
                          .map(f => f.key);
                        updates.key = generateFieldKey(newLabel, existingKeys);
                      }
                      
                      updateNestedField(nestedIdx, updates);
                    }}
                    placeholder="Field Label"
                    className="flex-1 px-2 py-1.5 sm:py-1 text-xs border border-border-secondary rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <select
                    value={nestedField.type}
                    onChange={(e) => updateNestedField(nestedIdx, { type: e.target.value as FieldType })}
                    className="w-full sm:w-auto px-2 py-1.5 sm:py-1 text-xs border border-border-secondary rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {Object.values(FIELD_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {getFieldTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={nestedField.required}
                      onChange={(checked) => updateNestedField(nestedIdx, { required: checked })}
                    />
                    <span className="text-xs text-foreground-secondary font-medium">Required</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNestedField(nestedIdx)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {(!field.nested || field.nested.length === 0) && (
              <p className="text-xs text-foreground-tertiary italic text-center py-2">
                No nested fields defined. Click "Add Nested Field" to create one.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
