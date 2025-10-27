"use client";

import { useState, useEffect } from "react";
import { StakeholderProcessStep, FieldDefinitionsSchema, FieldType } from "@/lib/types/schemas";
import { useTeams } from "@/hooks/useTeams";
import { Plus, Trash2, GripVertical, Calendar } from "lucide-react";
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
              {/* Drag Handle */}
              <div className="pt-1 cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical size={20} />
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
  });

  const [loading, setLoading] = useState(false);

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
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Field Label"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Object.values(FIELD_TYPES).map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 col-span-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Required field</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
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
