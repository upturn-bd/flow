"use client";

import { useState, useEffect } from "react";
import { useStakeholders } from "@/hooks/useStakeholders";
import { deleteFile, getPublicFileUrl } from "@/lib/utils/files";
import { StakeholderProcessStep, StakeholderStepData, FieldDefinition } from "@/lib/types/schemas";
import { Upload, X, CheckCircle2, File as FileIcon, Loader2 } from "lucide-react";

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
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]); // Track files to delete on save

  // Safety check: ensure step has required properties
  if (!step || !step.id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
        Invalid step configuration. Please refresh the page.
      </div>
    );
  }

  useEffect(() => {
    // Initialize form with existing data or empty values
    const initialData: Record<string, any> = {};
    const fields = step.field_definitions?.fields || [];
    
    // Ensure fields is an array
    if (!Array.isArray(fields)) {
      console.error("Invalid fields in step:", { step, field_definitions: step.field_definitions, fields });
      return;
    }
    
    fields.forEach((field) => {
      const existingValue = existingData?.data?.[field.key];
      
      if (existingValue !== undefined && existingValue !== null) {
        // Handle file type - preserve file metadata object or legacy string path
        if (field.type === "file") {
          // Check if it's the new format (object with path and metadata)
          if (typeof existingValue === "object" && existingValue.path) {
            initialData[field.key] = existingValue;
          } else if (typeof existingValue === "string") {
            // Legacy format: just a path string
            initialData[field.key] = existingValue;
          } else {
            // Unknown format, reset
            initialData[field.key] = null;
          }
        } else {
          // For other types, use the existing value
          initialData[field.key] = existingValue;
        }
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

    if (!Array.isArray(fields)) {
      console.error("validateForm: fields is not an array", fields);
      return false;
    }

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

  const handleFileRemove = async (fieldName: string) => {
    const currentValue = formData[fieldName];
    
    // If file was already uploaded (has path), mark it for deletion when form is saved
    if (currentValue && typeof currentValue === 'object' && 'path' in currentValue) {
      // Add to deletion queue
      setFilesToDelete(prev => [...prev, currentValue.path]);
    }
    
    // Remove from form data immediately (UI update)
    handleFieldChange(fieldName, null);
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      // Delete files that were marked for deletion
      if (filesToDelete.length > 0) {
        for (const filePath of filesToDelete) {
          try {
            await deleteFile(filePath);
          } catch (error) {
            console.error('Error deleting file:', filePath, error);
            // Continue even if deletion fails
          }
        }
        // Clear the deletion queue
        setFilesToDelete([]);
      }

      await saveStepData({
        stakeholder_id: stakeholderId,
        step_id: step.id!,
        data: formData,
        is_completed: false,
      });
      onComplete();
    } catch (error) {
      console.error("Error saving draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save draft. Please try again.";
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteStep = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Delete files that were marked for deletion
      if (filesToDelete.length > 0) {
        for (const filePath of filesToDelete) {
          try {
            await deleteFile(filePath);
          } catch (error) {
            console.error('Error deleting file:', filePath, error);
            // Continue even if deletion fails
          }
        }
        // Clear the deletion queue
        setFilesToDelete([]);
      }

      await completeStep(stakeholderId, step.id!, formData);
      onComplete();
    } catch (error) {
      console.error("Error completing step:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete step. Please try again.";
      setErrors({ submit: errorMessage });
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
          <div>
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
          <div className="flex items-center gap-3">
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
          <div>
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
        const isUploading = uploadingFiles.has(field.key);
        const hasFile = value && (value instanceof File || typeof value === 'string' || (typeof value === 'object' && value !== null));
        
        // Helper to get display filename
        const getFileName = () => {
          if (value instanceof File) {
            return (value as File).name;
          } else if (typeof value === 'object' && value !== null && 'originalName' in value) {
            return value.originalName;
          } else if (typeof value === 'string') {
            return value.split('/').pop() || 'Uploaded file';
          }
          return 'Uploaded file';
        };

        // Helper to get file URL for viewing
        const getFileUrl = () => {
          if (typeof value === 'object' && value !== null && 'path' in value) {
            return getPublicFileUrl(value.path);
          } else if (typeof value === 'string') {
            return getPublicFileUrl(value);
          }
          return null;
        };
        
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
            >
              {hasFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="text-blue-600 flex-shrink-0" size={20} />
                      <span className="text-sm text-gray-700 truncate">
                        {getFileName()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(field.key)}
                      disabled={isUploading || submitting}
                      className="text-red-600 hover:text-red-700 ml-2 disabled:opacity-50"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {getFileUrl() && !(value instanceof File) && (
                    <a
                      href={getFileUrl() || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      View file
                    </a>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="text-gray-400" size={32} />
                  <span className="text-sm text-gray-600 mt-2">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {field.placeholder || 'PDF, DOC, DOCX, JPG, PNG (max 10MB)'}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (10MB limit)
                        if (file.size > 10 * 1024 * 1024) {
                          setErrors(prev => ({
                            ...prev,
                            [field.key]: 'File size must be less than 10MB'
                          }));
                          return;
                        }
                        handleFieldChange(field.key, file);
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              )}
            </div>
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const fields = step.field_definitions?.fields || [];

  // Safety check: ensure fields is an array
  if (!Array.isArray(fields)) {
    console.error("Invalid field_definitions:", step.field_definitions);
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        Error: Invalid field definitions for this step. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {fields.length > 0 ? (
          fields.map((field) => (
            <div key={field.key}>
              {renderField(field)}
            </div>
          ))
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
