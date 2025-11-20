"use client";

import { useState, useEffect } from "react";
import { useStakeholders } from "@/hooks/useStakeholders";
import { deleteFile, getPublicFileUrl } from "@/lib/utils/files";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { StakeholderProcessStep, StakeholderStepData, FieldDefinition, NestedFieldValue } from "@/lib/types/schemas";
import { Upload, X, CheckCircle2, File as FileIcon, Loader2, XCircle, Calculator } from "lucide-react";
import GeolocationPicker, { GeolocationValue } from "@/components/ui/GeolocationPicker";
import DropdownField from "@/components/ui/DropdownField";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { calculateFieldValue, formatCalculatedValue } from "@/lib/utils/formula-evaluator";

interface StepDataFormProps {
  stakeholderId: number;
  step: StakeholderProcessStep;
  existingData?: StakeholderStepData;
  completedStepsData?: Array<{ step_order: number; data: Record<string, any> }>;
  onComplete: () => void;
  onCancel: () => void;
}

export default function StepDataForm({
  stakeholderId,
  step,
  existingData,
  completedStepsData = [],
  onComplete,
  onCancel,
}: StepDataFormProps) {
  const { saveStepData, completeStep, updateStakeholder } = useStakeholders();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
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
      const hasNestedFields = field.nested && field.nested.length > 0;
      
      if (existingValue !== undefined && existingValue !== null) {
        // Check if this is new nested format
        if (hasNestedFields && typeof existingValue === 'object' && 'type' in existingValue && 'value' in existingValue) {
          // New nested format - preserve as is
          initialData[field.key] = existingValue;
        } else if (field.type === "file") {
          // Handle file type - preserve file metadata object or legacy string path
          if (typeof existingValue === "object" && existingValue.path) {
            initialData[field.key] = hasNestedFields ? {
              type: field.type,
              value: existingValue,
              nested: {}
            } : existingValue;
          } else if (typeof existingValue === "string") {
            // Legacy format: just a path string
            initialData[field.key] = hasNestedFields ? {
              type: field.type,
              value: existingValue,
              nested: {}
            } : existingValue;
          } else {
            // Unknown format, reset
            initialData[field.key] = hasNestedFields ? {
              type: field.type,
              value: null,
              nested: {}
            } : null;
          }
        } else if (hasNestedFields) {
          // Convert legacy format to new nested format
          initialData[field.key] = {
            type: field.type,
            value: existingValue,
            nested: existingValue.nested || {}
          };
        } else {
          // Legacy format without nested fields - preserve as is
          initialData[field.key] = existingValue;
        }
      } else {
        // Set default values based on type
        if (hasNestedFields) {
          // New nested format
          let defaultValue: any;
          switch (field.type) {
            case "boolean":
              defaultValue = false;
              break;
            case "date":
              defaultValue = "";
              break;
            case "file":
              defaultValue = null;
              break;
            case "geolocation":
              defaultValue = null;
              break;
            case "dropdown":
              defaultValue = "";
              break;
            case "multi_select":
              defaultValue = [];
              break;
            default:
              defaultValue = "";
          }
          initialData[field.key] = {
            type: field.type,
            value: defaultValue,
            nested: {}
          };
        } else {
          // Legacy format
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
            case "geolocation":
              initialData[field.key] = null;
              break;
            case "dropdown":
              initialData[field.key] = "";
              break;
            case "multi_select":
              initialData[field.key] = [];
              break;
            default:
              initialData[field.key] = "";
          }
        }
      }
    });
    
    // Add status field if enabled
    if (step.status_field?.enabled) {
      const existingStatus = existingData?.data?.["__step_status"];
      initialData["__step_status"] = existingStatus || "";
    }
    
    setFormData(initialData);
  }, [step, existingData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = step.field_definitions?.fields || [];

    if (!Array.isArray(fields)) {
      console.error("validateForm: fields is not an array", fields);
      return false;
    }

    const validateNestedFields = (
      nestedDefs: FieldDefinition[],
      nestedData: Record<string, NestedFieldValue>,
      parentKey: string
    ): boolean => {
      let hasErrors = false;
      nestedDefs.forEach((nestedField) => {
        if (nestedField.required) {
          const nestedValue = nestedData[nestedField.key];
          if (
            !nestedValue ||
            nestedValue.value === undefined ||
            nestedValue.value === null ||
            nestedValue.value === "" ||
            (Array.isArray(nestedValue.value) && nestedValue.value.length === 0)
          ) {
            newErrors[`${parentKey}.${nestedField.key}`] = `${nestedField.label} is required`;
            hasErrors = true;
          }
        }
      });
      return !hasErrors;
    };

    fields.forEach((field) => {
      const value = formData[field.key];
      const hasNestedFields = field.nested && field.nested.length > 0;
      
      if (field.required) {
        // Handle nested format
        if (hasNestedFields && typeof value === 'object' && 'value' in value) {
          const actualValue = value.value;
          if (
            actualValue === undefined ||
            actualValue === null ||
            actualValue === "" ||
            (Array.isArray(actualValue) && actualValue.length === 0)
          ) {
            newErrors[field.key] = `${field.label} is required`;
          } else {
            // Validate general nested fields if present
            if (value.nested && field.nested) {
              validateNestedFields(field.nested, value.nested, field.key);
            }
            
            // For multi-select, validate option-specific nested fields
            if (field.type === 'multi_select' && Array.isArray(actualValue)) {
              actualValue.forEach((selectedValue) => {
                const option = field.options?.find(opt => opt.value === selectedValue);
                if (option && option.nested && option.nested.length > 0) {
                  const optionNestedKey = `${selectedValue}_nested`;
                  const optionNestedData = value.nested?.[optionNestedKey] || {};
                  option.nested.forEach((nestedField) => {
                    if (nestedField.required) {
                      const nestedValue = optionNestedData[nestedField.key];
                      if (
                        !nestedValue ||
                        nestedValue.value === undefined ||
                        nestedValue.value === null ||
                        nestedValue.value === "" ||
                        (Array.isArray(nestedValue.value) && nestedValue.value.length === 0)
                      ) {
                        newErrors[`${field.key}.${optionNestedKey}.${nestedField.key}`] = `${nestedField.label} is required for ${option.label}`;
                      }
                    }
                  });
                }
              });
            }
          }
        } else {
          // Handle legacy format
          if (
            value === undefined ||
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            newErrors[field.key] = `${field.label} is required`;
          }
        }
      } else if (hasNestedFields && typeof value === 'object' && 'value' in value) {
        // Validate nested fields even if parent is not required
        if (value.nested && field.nested) {
          validateNestedFields(field.nested, value.nested, field.key);
        }
        
        // For multi-select, validate option-specific nested fields
        if (field.type === 'multi_select' && Array.isArray(value.value)) {
          value.value.forEach((selectedValue: string) => {
            const option = field.options?.find(opt => opt.value === selectedValue);
            if (option && option.nested && option.nested.length > 0) {
              const optionNestedKey = `${selectedValue}_nested`;
              const optionNestedData = value.nested?.[optionNestedKey] || {};
              option.nested.forEach((nestedField) => {
                if (nestedField.required) {
                  const nestedValue = optionNestedData[nestedField.key];
                  if (
                    !nestedValue ||
                    nestedValue.value === undefined ||
                    nestedValue.value === null ||
                    nestedValue.value === "" ||
                    (Array.isArray(nestedValue.value) && nestedValue.value.length === 0)
                  ) {
                    newErrors[`${field.key}.${optionNestedKey}.${nestedField.key}`] = `${nestedField.label} is required for ${option.label}`;
                  }
                }
              });
            }
          });
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

  const handleNestedFieldChange = (parentFieldName: string, nestedFieldKey: string, value: any, nestedFieldType: string) => {
    setFormData((prev) => {
      const parentValue = prev[parentFieldName];
      if (typeof parentValue === 'object' && 'nested' in parentValue) {
        return {
          ...prev,
          [parentFieldName]: {
            ...parentValue,
            nested: {
              ...parentValue.nested,
              [nestedFieldKey]: {
                type: nestedFieldType,
                value: value,
                nested: parentValue.nested?.[nestedFieldKey]?.nested || {}
              }
            }
          }
        };
      }
      return prev;
    });
    
    // Clear error for nested field
    const errorKey = `${parentFieldName}.${nestedFieldKey}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleMultiSelectNestedChange = (
    parentFieldName: string,
    optionValue: string,
    nestedFieldKey: string,
    value: any,
    nestedFieldType: string
  ) => {
    setFormData((prev) => {
      const parentValue = prev[parentFieldName];
      if (typeof parentValue === 'object' && 'value' in parentValue && Array.isArray(parentValue.value)) {
        // Find or create nested data for this specific option
        const optionNestedKey = `${optionValue}_nested`;
        const currentOptionNested = parentValue.nested?.[optionNestedKey] || {};
        
        return {
          ...prev,
          [parentFieldName]: {
            ...parentValue,
            nested: {
              ...parentValue.nested,
              [optionNestedKey]: {
                ...currentOptionNested,
                [nestedFieldKey]: {
                  type: nestedFieldType,
                  value: value,
                  nested: currentOptionNested[nestedFieldKey]?.nested || {}
                }
              }
            }
          }
        };
      }
      return prev;
    });
  };

  const handleFileRemove = async (fieldName: string) => {
    const currentValue = formData[fieldName];
    
    // Handle nested format
    if (currentValue && typeof currentValue === 'object' && 'value' in currentValue) {
      const fileValue = currentValue.value;
      if (fileValue && typeof fileValue === 'object' && 'path' in fileValue) {
        setFilesToDelete(prev => [...prev, fileValue.path]);
      }
      handleFieldChange(fieldName, { ...currentValue, value: null });
    } else {
      // Handle legacy format
      if (currentValue && typeof currentValue === 'object' && 'path' in currentValue) {
        setFilesToDelete(prev => [...prev, currentValue.path]);
      }
      handleFieldChange(fieldName, null);
    }
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
    const fieldData = formData[field.key];
    const hasNestedFields = field.nested && field.nested.length > 0;
    
    // Extract actual value from nested format or use legacy format
    const actualValue = hasNestedFields && typeof fieldData === 'object' && 'value' in fieldData
      ? fieldData.value
      : fieldData;
    
    const hasError = !!errors[field.key];

    // Helper to update field value (handles both nested and legacy formats)
    const updateValue = (newValue: any) => {
      if (hasNestedFields) {
        handleFieldChange(field.key, {
          type: field.type,
          value: newValue,
          nested: fieldData?.nested || {}
        });
      } else {
        handleFieldChange(field.key, newValue);
      }
    };

    // Helper to render nested fields
    const renderNestedFields = () => {
      if (!hasNestedFields || !field.nested) return null;
      
      const nestedData = typeof fieldData === 'object' && fieldData?.nested ? fieldData.nested : {};
      
      return (
        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Additional Information:</p>
          {field.nested.map((nestedField) => {
            const nestedValue = nestedData[nestedField.key]?.value;
            const nestedError = errors[`${field.key}.${nestedField.key}`];
            
            return (
              <div key={nestedField.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {nestedField.label}
                  {nestedField.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderNestedFieldInput(nestedField, nestedValue, field.key, nestedError)}
              </div>
            );
          })}
        </div>
      );
    };

    // Helper to render nested field input based on type
    const renderNestedFieldInput = (
      nestedField: FieldDefinition,
      value: any,
      parentKey: string,
      error?: string
    ) => {
      const updateNestedValue = (newValue: any) => {
        handleNestedFieldChange(parentKey, nestedField.key, newValue, nestedField.type);
      };

      switch (nestedField.type) {
        case "text":
          return (
            <>
              <input
                type="text"
                value={value || ""}
                onChange={(e) => updateNestedValue(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={nestedField.placeholder || nestedField.label}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </>
          );
        
        case "boolean":
          return (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => updateNestedValue(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          );
        
        case "date":
          return (
            <>
              <input
                type="date"
                value={value || ""}
                onChange={(e) => updateNestedValue(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </>
          );
        
        default:
          return (
            <input
              type="text"
              value={value || ""}
              onChange={(e) => updateNestedValue(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />
          );
      }
    };

    // Helper to render nested field input for multi-select option-specific nested fields
    const renderOptionNestedFieldInput = (
      nestedField: FieldDefinition,
      value: any,
      parentKey: string,
      optionValue: string,
      error?: string
    ) => {
      const updateNestedValue = (newValue: any) => {
        handleMultiSelectNestedChange(parentKey, optionValue, nestedField.key, newValue, nestedField.type);
      };

      switch (nestedField.type) {
        case "text":
          return (
            <>
              <input
                type="text"
                value={value || ""}
                onChange={(e) => updateNestedValue(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={nestedField.placeholder || nestedField.label}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </>
          );
        
        case "boolean":
          return (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => updateNestedValue(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
          );
        
        case "date":
          return (
            <>
              <input
                type="date"
                value={value || ""}
                onChange={(e) => updateNestedValue(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </>
          );
        
        default:
          return (
            <input
              type="text"
              value={value || ""}
              onChange={(e) => updateNestedValue(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />
          );
      }
    };

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
              value={actualValue || ""}
              onChange={(e) => updateValue(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={field.placeholder || field.label}
            />
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
            {renderNestedFields()}
          </div>
        );

      case "number":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={actualValue || ""}
              onChange={(e) => updateValue(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={field.placeholder || field.label}
              step="any"
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderNestedFields()}
          </div>
        );

      case "calculated":
        // Evaluate formula using completed steps data
        const calculationResult = field.formula
          ? calculateFieldValue(field.formula, completedStepsData)
          : { value: null, error: "No formula defined" };
        
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                <Calculator size={12} />
                Calculated
              </span>
            </label>
            <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {calculationResult.value !== null
                    ? formatCalculatedValue(calculationResult.value)
                    : "—"}
                </span>
                {calculationResult.missingRefs && calculationResult.missingRefs.length > 0 && (
                  <span className="text-xs text-amber-600">
                    Missing data
                  </span>
                )}
              </div>
            </div>
            {field.formula && (
              <p className="text-xs text-gray-500 mt-1">
                Formula: <code className="bg-gray-100 px-1 py-0.5 rounded">{field.formula}</code>
              </p>
            )}
            {calculationResult.error && (
              <p className="text-xs text-red-500 mt-1">{calculationResult.error}</p>
            )}
            {calculationResult.missingRefs && calculationResult.missingRefs.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Missing references: {calculationResult.missingRefs.join(", ")}
              </p>
            )}
            {renderNestedFields()}
          </div>
        );

      case "boolean":
        return (
          <div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={actualValue || false}
                onChange={(e) => updateValue(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {hasError && <p className="text-red-500 text-sm">{errors[field.key]}</p>}
          </div>
            {renderNestedFields()}
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
              value={actualValue || ""}
              onChange={(e) => updateValue(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                hasError ? "border-red-500" : "border-gray-300"
              }`}
            />
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
            {renderNestedFields()}
          </div>
        );

      case "file":
        const isUploading = uploadingFiles.has(field.key);
        const hasFile = actualValue && (actualValue instanceof File || typeof actualValue === 'string' || (typeof actualValue === 'object' && actualValue !== null));
        
        // Helper to get display filename
        const getFileName = () => {
          if (actualValue instanceof File) {
            return (actualValue as File).name;
          } else if (typeof actualValue === 'object' && actualValue !== null && 'originalName' in actualValue) {
            return actualValue.originalName;
          } else if (typeof actualValue === 'string') {
            return actualValue.split('/').pop() || 'Uploaded file';
          }
          return 'Uploaded file';
        };

        // Helper to get file URL for viewing
        const getFileUrl = () => {
          if (typeof actualValue === 'object' && actualValue !== null && 'path' in actualValue) {
            return getPublicFileUrl(actualValue.path);
          } else if (typeof actualValue === 'string') {
            return getPublicFileUrl(actualValue);
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
                  {getFileUrl() && !(actualValue instanceof File) && (
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
                        updateValue(file);
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              )}
            </div>
            {hasError && <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>}
            {renderNestedFields()}
          </div>
        );

      case "geolocation":
        return (
          <div>
            <GeolocationPicker
              label={field.label}
              value={actualValue || null}
              onChange={(coords) => updateValue(coords)}
              required={field.required}
              error={errors[field.key]}
            />
            {renderNestedFields()}
          </div>
        );

      case "dropdown":
        return (
          <div>
            <DropdownField
              label={field.label}
              value={actualValue || ""}
              onChange={(val) => updateValue(val)}
              options={field.options || []}
              placeholder={field.placeholder || "Select an option"}
              required={field.required}
              error={errors[field.key]}
            />
            {renderNestedFields()}
          </div>
        );

      case "multi_select":
        // For multi-select with option-specific nested fields, we need to render differently
        const hasOptionNestedFields = field.options?.some(opt => opt.nested && opt.nested.length > 0);
        
        return (
          <div>
            <MultiSelectDropdown
              label={field.label}
              value={Array.isArray(actualValue) ? actualValue : []}
              onChange={(val) => updateValue(val)}
              options={field.options || []}
              placeholder={field.placeholder || "Select options"}
              required={field.required}
              error={errors[field.key]}
            />
            
            {/* Render nested fields for each selected option */}
            {hasOptionNestedFields && Array.isArray(actualValue) && actualValue.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-gray-600">Additional Information for Selected Options:</p>
                {actualValue.map((selectedValue) => {
                  const option = field.options?.find(opt => opt.value === selectedValue);
                  if (!option || !option.nested || option.nested.length === 0) return null;
                  
                  const optionNestedKey = `${selectedValue}_nested`;
                  const optionNestedData = typeof fieldData === 'object' && fieldData?.nested?.[optionNestedKey] || {};
                  
                  return (
                    <div key={selectedValue} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700 mb-2">{option.label}</p>
                      <div className="space-y-2">
                        {option.nested.map((nestedField) => {
                          const nestedValue = optionNestedData[nestedField.key]?.value;
                          const nestedError = errors[`${field.key}.${optionNestedKey}.${nestedField.key}`];
                          
                          return (
                            <div key={nestedField.key}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {nestedField.label}
                                {nestedField.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {renderOptionNestedFieldInput(
                                nestedField,
                                nestedValue,
                                field.key,
                                selectedValue,
                                nestedError
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Render general nested fields (not option-specific) */}
            {renderNestedFields()}
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

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrors({ ...errors, rejection: "Please provide a reason for rejection" });
      return;
    }

    setRejecting(true);
    try {
      // Get current employee info for rejected_by
      const employeeInfo = await getEmployeeInfo();
      
      // Reject the stakeholder
      await updateStakeholder(stakeholderId, {
        status: "Rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: employeeInfo?.id,
        rejection_reason: rejectionReason,
        is_active: false,
      } as any);

      setShowRejectionDialog(false);
      onComplete();
    } catch (error) {
      console.error("Error rejecting stakeholder:", error);
      setErrors({ ...errors, rejection: "Failed to reject stakeholder" });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-4">
          {/* Step Status Field (if enabled) */}
          {step.status_field?.enabled && (
            <div>
              <DropdownField
                label={step.status_field.label || "Status"}
                value={formData["__step_status"] || ""}
                onChange={(val) => handleFieldChange("__step_status", val)}
                options={step.status_field.options || []}
                placeholder="Select status"
                required={false}
                error={errors["__step_status"]}
              />
            </div>
          )}

          {/* Regular Fields */}
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

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting || rejecting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {step.can_reject && (
              <button
                type="button"
                onClick={() => setShowRejectionDialog(true)}
                disabled={submitting || rejecting}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                <XCircle size={16} />
                Reject
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || rejecting}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleCompleteStep}
              disabled={submitting || rejecting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {submitting ? "Completing..." : "Complete Step"}
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      {showRejectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Stakeholder</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this stakeholder. This action will mark the stakeholder as rejected and make it inactive.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            {errors.rejection && (
              <p className="text-red-500 text-sm mt-2">{errors.rejection}</p>
            )}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason("");
                  const newErrors = { ...errors };
                  delete newErrors.rejection;
                  setErrors(newErrors);
                }}
                disabled={rejecting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejecting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
