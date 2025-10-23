"use client";

import { useState, useEffect } from "react";
import { useStakeholders } from "@/hooks/useStakeholders";
import { StakeholderProcessStep, StakeholderStepData, FieldDefinition } from "@/lib/types/schemas";
import { Upload, X, CheckCircle2 } from "lucide-react";

interface StepDataFormProps {
  stakeholderId: number;
  step: StakeholderProcessStep;
  existingData?: StakeholderStepData;
  onComplete: () => void;
  onCancel: () => void;
}

export default function StepDataForm({
  stakeholderId,
  step,
  existingData,
  onComplete,
  onCancel,
}: StepDataFormProps) {
  const { saveStepData, completeStep } = useStakeholders();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initialize form with existing data or empty values
    const initialData: Record<string, any> = {};
    const fields = step.field_definitions?.fields || [];
    fields.forEach((field) => {
      if (existingData?.data?.[field.key]) {
        initialData[field.key] = existingData.data[field.key];
      } else {
        // Set default values based on type
        switch (field.type) {
          case "boolean":
            initialData[field.key] = false;
            break;
          case "date":
            initialData[field.key] = "";
            break;
          case "file":
            initialData[field.key] = null;
            break;
          default:
            initialData[field.key] = "";
        }
      }
    });
    setFormData(initialData);
  }, [step, existingData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = step.field_definitions?.fields || [];

    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.key];
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          newErrors[field.key] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      await saveStepData({
        stakeholder_id: stakeholderId,
        step_id: step.id!,
        data: formData,
        is_completed: false,
      });
      onComplete();
    } catch (error) {
      console.error("Error saving draft:", error);
      setErrors({ submit: "Failed to save draft. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteStep = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await completeStep(stakeholderId, step.id!, formData);
      onComplete();
    } catch (error) {
      console.error("Error completing step:", error);
      setErrors({ submit: "Failed to complete step. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.key];
    const hasError = !!errors[field.key];

    switch (field.type) {
      case "text":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={field.placeholder || field.label}
            />
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
          </div>
        );

      case "boolean":
        return (
          <div key={field.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {hasError && <p className="text-red-500 text-sm">{errors[field.key]}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
            />
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
          </div>
        );

      case "file":
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
            >
              {value ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{value.name || value}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(field.key, null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="text-gray-400" size={32} />
                  <span className="text-sm text-gray-600 mt-2">
                    Click to upload or drag and drop
                  </span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFieldChange(field.key, file);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Note: File upload integration pending
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const fields = step.field_definitions?.fields || [];

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {fields.length > 0 ? (
          fields.map((field) => renderField(field))
        ) : (
          <p className="text-sm text-gray-500">No fields defined for this step</p>
        )}
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting}
          className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleCompleteStep}
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          {submitting ? "Completing..." : "Complete Step"}
        </button>
      </div>
    </div>
  );
}
