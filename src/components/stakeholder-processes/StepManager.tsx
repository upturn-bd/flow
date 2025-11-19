"use client";

import { useState, useEffect } from "react";
import { StakeholderProcessStep, FieldDefinitionsSchema, FieldType, FieldDefinition, DropdownOption } from "@/lib/types/schemas";
import { useTeams } from "@/hooks/useTeams";
import { Plus, Trash2, GripVertical, Calendar, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { FIELD_TYPES } from "@/lib/constants";

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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Process Steps</h3>
        <button
          onClick={handleAddStep}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      {/* Steps List */}
      {steps.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-600">No steps defined yet</p>
          <p className="text-xs text-gray-500 mt-1">Add at least one step to create the process</p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className={`p-1 rounded transition-colors ${
                    index === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === steps.length - 1}
                  className={`p-1 rounded transition-colors ${
                    index === steps.length - 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title="Move down"
                >
                  <ArrowDown size={16} />
                </button>
              </div>

              {/* Step Number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                {step.step_order}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{step.name}</h4>
                    {step.description && (
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Team: {step.team?.name || "Not assigned"}</span>
                      <span>•</span>
                      <span>{step.field_definitions?.fields?.length || 0} fields</span>
                      {step.use_date_range && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Date range enabled
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditStep(step)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
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
          onSubmit={async (data) => {
            if (editingStep) {
              await onUpdateStep(editingStep.id!, data);
            } else {
              await onCreateStep(data);
            }
            setShowAddStep(false);
            setEditingStep(null);
            onStepsChange();
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
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

function StepFormModal({ processId, step, teams, nextStepOrder, onSubmit, onClose }: StepFormModalProps) {
  const [formData, setFormData] = useState({
    process_id: processId,
    name: step?.name || "",
    description: step?.description || "",
    step_order: step?.step_order || nextStepOrder,
    team_id: step?.team_id || 0,
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

  const addField = () => {
    const newField = {
      key: `field_${Date.now()}`,
      label: "",
      type: "text" as FieldType,
      required: false,
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
    setLoading(true);
    try {
      // Convert empty date strings to null for PostgreSQL
      const submissionData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      await onSubmit(submissionData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {step ? "Edit Step" : "Add New Step"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Team Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Team <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value={0}>Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.use_date_range}
                onChange={(e) => setFormData({ ...formData, use_date_range: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Date Range</span>
            </label>

            {formData.use_date_range && (
              <div className="mt-3 grid grid-cols-2 gap-4 pl-7">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Field Definitions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">Data Fields</label>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                />
              ))}
            </div>
          </div>

          {/* Rejection Option */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.can_reject}
                onChange={(e) => setFormData({ ...formData, can_reject: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Allow Rejection</span>
                <p className="text-xs text-gray-500">
                  Team members can reject stakeholders at this step
                </p>
              </div>
            </label>
          </div>

          {/* Status Field Option */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.status_field?.enabled || false}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status_field: { 
                    ...formData.status_field,
                    enabled: e.target.checked,
                    label: formData.status_field?.label || "Status",
                    options: formData.status_field?.options || []
                  } 
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable Step Status</span>
                <p className="text-xs text-gray-500">
                  Add a status dropdown field to track step progress
                </p>
              </div>
            </label>

            {formData.status_field?.enabled && (
              <div className="mt-4 pl-7 space-y-4">
                {/* Status Label */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Status, Progress, Stage"
                  />
                </div>

                {/* Status Options */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Status Options
                  </label>
                  
                  {/* Add Option Input */}
                  <div className="flex gap-2 mb-3">
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
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-sm"
                        >
                          <span className="text-gray-700">{option.label}</span>
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
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No status options added yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
}

function FieldEditor({ field, index, onUpdate, onRemove, isEditing, onEditToggle }: FieldEditorProps) {
  const [optionInput, setOptionInput] = useState("");
  
  const isDropdownType = field.type === 'dropdown' || field.type === 'multi_select';

  const addOption = () => {
    if (!optionInput.trim()) return;
    
    const newOption: DropdownOption = {
      label: optionInput.trim(),
      value: optionInput.trim().toLowerCase().replace(/\s+/g, '_'),
    };
    
    const currentOptions = field.options || [];
    onUpdate(index, { options: [...currentOptions, newOption] });
    setOptionInput("");
  };

  const removeOption = (optionIndex: number) => {
    const currentOptions = field.options || [];
    onUpdate(index, { options: currentOptions.filter((_, i) => i !== optionIndex) });
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      boolean: 'Boolean',
      date: 'Date',
      file: 'File',
      geolocation: 'Geolocation',
      dropdown: 'Dropdown',
      multi_select: 'Multi-Select',
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      {/* Field Header */}
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            placeholder="Field Label"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
          <select
            value={field.type}
            onChange={(e) => {
              const newType = e.target.value as FieldType;
              onUpdate(index, { type: newType, options: newType === 'dropdown' || newType === 'multi_select' ? [] : undefined });
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {Object.values(FIELD_TYPES).map((type) => (
              <option key={type} value={type}>
                {getFieldTypeLabel(type)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate(index, { required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>
        </div>
        <div className="flex items-center gap-1">
          {isDropdownType && (
            <button
              type="button"
              onClick={onEditToggle}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title={isEditing ? "Collapse options" : "Edit options"}
            >
              {isEditing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Dropdown Options Editor */}
      {isDropdownType && isEditing && (
        <div className="px-3 pb-3 border-t border-gray-200 mt-2 pt-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            {field.type === 'multi_select' ? 'Multi-Select Options' : 'Dropdown Options'}
          </label>
          
          {/* Add Option Input */}
          <div className="flex gap-2 mb-3">
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
              placeholder="Enter option label"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
            <button
              type="button"
              onClick={addOption}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Options List */}
          <div className="space-y-2">
            {(field.options || []).length > 0 ? (
              (field.options || []).map((option, optIndex) => (
                <div
                  key={optIndex}
                  className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-sm"
                >
                  <span className="text-gray-700">{option.label}</span>
                  <button
                    type="button"
                    onClick={() => removeOption(optIndex)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No options added yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
