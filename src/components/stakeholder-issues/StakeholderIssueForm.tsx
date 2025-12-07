"use client";

import { useState, useEffect, useCallback } from "react";
import BaseForm from "@/components/forms/BaseForm";
import {
  validateStakeholderIssue,
  validationErrorsToObject,
} from "@/lib/validation/schemas/stakeholder-issues";
import { StakeholderIssueFormData } from "@/hooks/useStakeholderIssues";
import { StakeholderIssueAttachment, StakeholderIssueCategory, StakeholderIssueSubcategory, LinkedStepField } from "@/lib/types/schemas";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeams } from "@/hooks/useTeams";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useStakeholderIssueCategories } from "@/hooks/useStakeholderIssueCategories";
import { X, Upload, TrashSimple, Download, FileText, User, UsersThree, Tag, Link, CheckCircle, CaretDown, CaretRight, CheckSquare, Square } from "@phosphor-icons/react";
import InlineSpinner from "@/components/ui/InlineSpinner";
import { FormField, SelectField, TextAreaField } from "@/components/forms";
import { captureError } from "@/lib/sentry";
import { formatDisplayValue, getFieldLabel } from "@/lib/utils/step-data-utils";

type AssignmentType = 'employee' | 'team';

import { FieldDefinitionsSchema } from "@/lib/types/schemas";

interface StakeholderStepDataOption {
  id: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  data: Record<string, any>;
  fieldDefinitions?: FieldDefinitionsSchema;
}

interface StakeholderIssueFormProps {
  stakeholderId: number;
  issueId?: number;
  initialData?: {
    title?: string;
    description?: string;
    status?: 'Pending' | 'In Progress' | 'Resolved';
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    assigned_to?: string;
    assigned_team_id?: number;
    category_id?: number;
    subcategory_id?: number;
    linked_step_data_ids?: number[];
    linked_fields?: LinkedStepField[];
    attachments?: StakeholderIssueAttachment[];
  };
  onSubmit: (data: StakeholderIssueFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function StakeholderIssueForm({
  stakeholderId,
  issueId,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Issue",
}: StakeholderIssueFormProps) {
  const { employees, fetchEmployees, loading: loadingEmployees } = useEmployees();
  const { teams, fetchTeams, loading: loadingTeams } = useTeams();
  const { deleteAttachment, downloadAttachment, fetchStakeholderStepData } = useStakeholderIssues();
  const { categories, fetchCategories, loading: loadingCategories } = useStakeholderIssueCategories();
  
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<StakeholderIssueAttachment[]>(
    initialData?.attachments || []
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  
  // Linked step data state
  const [availableStepData, setAvailableStepData] = useState<StakeholderStepDataOption[]>([]);
  const [loadingStepData, setLoadingStepData] = useState(false);
  
  // Determine initial assignment type
  const getInitialAssignmentType = (): AssignmentType => {
    if (initialData?.assigned_team_id) return 'team';
    return 'employee';
  };
  
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(getInitialAssignmentType());
  
  const [formData, setFormData] = useState<StakeholderIssueFormData>({
    stakeholder_id: stakeholderId,
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "Pending",
    priority: initialData?.priority || "Medium",
    assigned_to: initialData?.assigned_to || "",
    assigned_team_id: initialData?.assigned_team_id,
    category_id: initialData?.category_id,
    subcategory_id: initialData?.subcategory_id,
    linked_fields: initialData?.linked_fields || [],
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track which steps are expanded for field selection
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const availableSubcategories = selectedCategory?.subcategories?.filter(s => s.is_active) || [];

  // Load initial data
  useEffect(() => {
    fetchEmployees();
    fetchTeams();
    fetchCategories();
  }, [fetchEmployees, fetchTeams, fetchCategories]);

  // Load stakeholder step data for linking
  useEffect(() => {
    const loadStepData = async () => {
      setLoadingStepData(true);
      try {
        const data = await fetchStakeholderStepData(stakeholderId);
        const stepDataOptions: StakeholderStepDataOption[] = data.map((sd: any) => ({
          id: sd.id,
          stepName: sd.step?.name || `Step ${sd.step_id}`,
          stepOrder: sd.step?.step_order || 0,
          isCompleted: sd.is_completed,
          data: sd.data || {},
          fieldDefinitions: sd.step?.field_definitions,
        }));
        setAvailableStepData(stepDataOptions.sort((a, b) => a.stepOrder - b.stepOrder));
      } catch (err) {
        captureError(err, { operation: "loadStepData" });
        console.error("Error loading step data:", err);
      } finally {
        setLoadingStepData(false);
      }
    };

    loadStepData();
  }, [stakeholderId, fetchStakeholderStepData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCategoryChange = (categoryId: number | "") => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId === "" ? undefined : categoryId,
      subcategory_id: undefined, // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (subcategoryId: number | "") => {
    setFormData(prev => ({
      ...prev,
      subcategory_id: subcategoryId === "" ? undefined : subcategoryId,
    }));
  };

  const handleAssignmentTypeChange = (type: AssignmentType) => {
    setAssignmentType(type);
    // Clear the other assignment field
    if (type === 'employee') {
      setFormData(prev => ({ ...prev, assigned_team_id: undefined }));
    } else {
      setFormData(prev => ({ ...prev, assigned_to: "" }));
    }
  };

  // Toggle step expansion for field selection
  const toggleStepExpansion = (stepDataId: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepDataId)) {
        next.delete(stepDataId);
      } else {
        next.add(stepDataId);
      }
      return next;
    });
  };

  // Check if a specific field is linked
  const isFieldLinked = (stepDataId: number, fieldKey: string): boolean => {
    return formData.linked_fields?.some(
      f => f.stepDataId === stepDataId && f.fieldKey === fieldKey
    ) ?? false;
  };

  // Toggle a specific field's linked state
  const handleFieldToggle = (stepDataId: number, fieldKey: string, stepData: StakeholderStepDataOption) => {
    setFormData(prev => {
      const currentLinkedFields = prev.linked_fields || [];
      const existingIndex = currentLinkedFields.findIndex(
        f => f.stepDataId === stepDataId && f.fieldKey === fieldKey
      );
      
      if (existingIndex >= 0) {
        // Remove the field
        return {
          ...prev,
          linked_fields: currentLinkedFields.filter((_, i) => i !== existingIndex),
        };
      } else {
        // Add the field with metadata
        const newField: LinkedStepField = {
          stepDataId,
          fieldKey,
          stepName: stepData.stepName,
          stepOrder: stepData.stepOrder,
          fieldLabel: getFieldLabel(fieldKey, stepData.fieldDefinitions),
          fieldValue: stepData.data[fieldKey],
        };
        return {
          ...prev,
          linked_fields: [...currentLinkedFields, newField],
        };
      }
    });
  };

  // Select all fields from a step
  const selectAllFieldsFromStep = (stepData: StakeholderStepDataOption) => {
    const fieldKeys = Object.keys(stepData.data).filter(key => {
      // Skip file fields
      const value = stepData.data[key];
      return !(typeof value === 'object' && value !== null && 'path' in value);
    });
    
    setFormData(prev => {
      const currentLinkedFields = prev.linked_fields || [];
      // Remove any existing fields from this step
      const withoutThisStep = currentLinkedFields.filter(f => f.stepDataId !== stepData.id);
      // Add all fields from this step
      const newFields: LinkedStepField[] = fieldKeys.map(fieldKey => ({
        stepDataId: stepData.id,
        fieldKey,
        stepName: stepData.stepName,
        stepOrder: stepData.stepOrder,
        fieldLabel: getFieldLabel(fieldKey, stepData.fieldDefinitions),
        fieldValue: stepData.data[fieldKey],
      }));
      return {
        ...prev,
        linked_fields: [...withoutThisStep, ...newFields],
      };
    });
  };

  // Deselect all fields from a step
  const deselectAllFieldsFromStep = (stepDataId: number) => {
    setFormData(prev => ({
      ...prev,
      linked_fields: (prev.linked_fields || []).filter(f => f.stepDataId !== stepDataId),
    }));
  };

  // Count linked fields for a step
  const getLinkedFieldCount = (stepDataId: number): number => {
    return (formData.linked_fields || []).filter(f => f.stepDataId === stepDataId).length;
  };

  // Check if all fields in a step are linked
  const areAllFieldsLinked = (stepData: StakeholderStepDataOption): boolean => {
    const fieldKeys = Object.keys(stepData.data).filter(key => {
      const value = stepData.data[key];
      return !(typeof value === 'object' && value !== null && 'path' in value);
    });
    if (fieldKeys.length === 0) return false;
    return fieldKeys.every(key => isFieldLinked(stepData.id, key));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selectedFiles = Array.from(e.target.files || []);
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    // Calculate total files including existing attachments and already selected new files
    const totalFiles = existingAttachments.length + files.length + selectedFiles.length;

    if (totalFiles > maxFiles) {
      setFileError(`You can upload a maximum of ${maxFiles} files total (including existing attachments)`);
      return;
    }

    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setFileError(`Some files exceed the maximum size of 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = async (attachmentPath: string) => {
    if (!issueId) return;
    
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    setDeletingAttachment(attachmentPath);
    try {
      const success = await deleteAttachment(issueId, attachmentPath);
      if (success) {
        setExistingAttachments(existingAttachments.filter(att => att.path !== attachmentPath));
      }
    } catch (error) {
      captureError(error, { operation: "deleteAttachment", issueId });
      console.error("Error deleting attachment:", error);
    } finally {
      setDeletingAttachment(null);
    }
  };

  const handleDownloadAttachment = async (filePath: string, originalName: string) => {
    setDownloadingAttachment(filePath);
    try {
      await downloadAttachment(filePath, originalName);
    } catch (error) {
      captureError(error, { operation: "downloadAttachment" });
      console.error("Error downloading attachment:", error);
      setFileError("Failed to download attachment. The file may not exist or you may not have permission.");
      setTimeout(() => setFileError(null), 5000);
    } finally {
      setDownloadingAttachment(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToValidate = {
      ...formData,
      attachments: files,
    };

    const validationErrors = validateStakeholderIssue(dataToValidate);
    if (validationErrors.length > 0) {
      setErrors(validationErrorsToObject(validationErrors));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(dataToValidate);
    } catch (error) {
      captureError(error, { operation: "submitIssueForm" });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <FormField
          label="Title"
          required
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="Enter issue title"
        />

        {/* Category and Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Category"
            name="category_id"
            value={formData.category_id?.toString() || ""}
            onChange={(e) => handleCategoryChange(e.target.value ? parseInt(e.target.value) : "")}
            disabled={loadingCategories}
            placeholder="-- Select category --"
            options={categories.filter(c => c.is_active).map((category) => ({
              value: category.id?.toString() || "",
              label: category.name,
            }))}
            className={loadingCategories ? "opacity-50 cursor-not-allowed" : ""}
          />

          <SelectField
            label="Subcategory"
            name="subcategory_id"
            value={formData.subcategory_id?.toString() || ""}
            onChange={(e) => handleSubcategoryChange(e.target.value ? parseInt(e.target.value) : "")}
            disabled={!formData.category_id || availableSubcategories.length === 0}
            placeholder={!formData.category_id ? "-- Select category first --" : "-- Select subcategory --"}
            options={availableSubcategories.map((subcategory) => ({
              value: subcategory.id?.toString() || "",
              label: subcategory.name,
            }))}
            className={!formData.category_id ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>

        {/* Category Color Preview */}
        {selectedCategory && (
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span>Category: {selectedCategory.name}</span>
          </div>
        )}

        {/* Priority */}
        <SelectField
          label="Priority"
          required
          name="priority"
          value={formData.priority}
          onChange={(e) => handleChange({ target: { name: 'priority', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
          error={errors.priority}
          options={[
            { value: 'Low', label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High', label: 'High' },
            { value: 'Urgent', label: 'Urgent' },
          ]}
        />

        {/* Assignment Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-2">
            Assign To
          </label>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleAssignmentTypeChange('employee')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                assignmentType === 'employee'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface-primary text-foreground-secondary border-border-primary hover:border-primary-500'
              }`}
            >
              <User size={18} />
              <span>Employee</span>
            </button>
            <button
              type="button"
              onClick={() => handleAssignmentTypeChange('team')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                assignmentType === 'team'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface-primary text-foreground-secondary border-border-primary hover:border-primary-500'
              }`}
            >
              <UsersThree size={18} />
              <span>Team</span>
            </button>
          </div>

          {/* Employee Selection */}
          {assignmentType === 'employee' && (
            <SelectField
              label=""
              name="assigned_to"
              value={formData.assigned_to || ""}
              onChange={(e) => handleChange({ target: { name: 'assigned_to', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
              disabled={loadingEmployees}
              error={errors.assigned_to}
              placeholder="-- Select an employee --"
              options={employees.map((employee) => ({
                value: employee.id,
                label: employee.name,
              }))}
              className={loadingEmployees ? "opacity-50 cursor-not-allowed" : ""}
            />
          )}

          {/* Team Selection */}
          {assignmentType === 'team' && (
            <SelectField
              label=""
              name="assigned_team_id"
              value={formData.assigned_team_id?.toString() || ""}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                assigned_team_id: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              disabled={loadingTeams}
              error={errors.assigned_team_id}
              placeholder="-- Select a team --"
              options={teams.map((team) => ({
                value: team.id?.toString() || "",
                label: team.name,
              }))}
              className={loadingTeams ? "opacity-50 cursor-not-allowed" : ""}
            />
          )}
        </div>

        {/* Status */}
        <SelectField
          label="Status"
          required
          name="status"
          value={formData.status}
          onChange={(e) => handleChange({ target: { name: 'status', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
          error={errors.status}
          options={[
            { value: 'Pending', label: 'Pending' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
          ]}
        />

        {/* Linked Step Data - Field Level Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-2">
            <div className="flex items-center gap-2">
              <Link size={16} />
              <span>Link Step Data Fields</span>
            </div>
          </label>
          <p className="text-xs text-foreground-tertiary mb-3">
            Expand steps to select specific fields to link to this issue.
          </p>
          
          {loadingStepData ? (
            <div className="flex items-center justify-center py-4">
              <InlineSpinner size="sm" color="primary" />
            </div>
          ) : availableStepData.length === 0 ? (
            <p className="text-sm text-foreground-tertiary italic py-2">
              No step data available for this stakeholder.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto border border-border-primary rounded-lg p-3">
              {availableStepData.map((stepData) => {
                const isExpanded = expandedSteps.has(stepData.id);
                const linkedCount = getLinkedFieldCount(stepData.id);
                const allLinked = areAllFieldsLinked(stepData);
                const fieldKeys = Object.keys(stepData.data).filter(key => {
                  const value = stepData.data[key];
                  return !(typeof value === 'object' && value !== null && 'path' in value);
                });
                
                return (
                  <div
                    key={stepData.id}
                    className="bg-surface-secondary rounded-lg border border-border-secondary overflow-hidden"
                  >
                    {/* Step Header */}
                    <div
                      className="flex items-center gap-2 p-3 cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => toggleStepExpansion(stepData.id)}
                    >
                      {isExpanded ? (
                        <CaretDown size={16} className="text-foreground-tertiary shrink-0" />
                      ) : (
                        <CaretRight size={16} className="text-foreground-tertiary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground-primary">
                            Step {stepData.stepOrder}: {stepData.stepName}
                          </span>
                          {stepData.isCompleted && (
                            <span className="px-1.5 py-0.5 text-xs bg-success/10 dark:bg-success/20 text-success rounded">
                              Completed
                            </span>
                          )}
                          {linkedCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                              {linkedCount} field{linkedCount > 1 ? 's' : ''} linked
                            </span>
                          )}
                        </div>
                        {!isExpanded && fieldKeys.length > 0 && (
                          <p className="text-xs text-foreground-tertiary mt-1">
                            {fieldKeys.length} field{fieldKeys.length > 1 ? 's' : ''} available
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Fields List (expanded) */}
                    {isExpanded && fieldKeys.length > 0 && (
                      <div className="border-t border-border-secondary">
                        {/* Select All / Deselect All */}
                        <div className="px-3 py-2 bg-background-secondary flex items-center justify-between">
                          <span className="text-xs text-foreground-tertiary">
                            {linkedCount} of {fieldKeys.length} fields selected
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAllFieldsFromStep(stepData);
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              Select All
                            </button>
                            <span className="text-foreground-tertiary">|</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deselectAllFieldsFromStep(stepData.id);
                              }}
                              className="text-xs text-foreground-tertiary hover:text-foreground-secondary"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        
                        {/* Individual Fields */}
                        <div className="p-2 space-y-1">
                          {fieldKeys.map(fieldKey => {
                            const isLinked = isFieldLinked(stepData.id, fieldKey);
                            const fieldLabel = getFieldLabel(fieldKey, stepData.fieldDefinitions);
                            const fieldValue = stepData.data[fieldKey];
                            
                            return (
                              <div
                                key={fieldKey}
                                onClick={() => handleFieldToggle(stepData.id, fieldKey, stepData)}
                                className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                                  isLinked
                                    ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700'
                                    : 'hover:bg-surface-hover border border-transparent'
                                }`}
                              >
                                <div className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                                  isLinked
                                    ? 'bg-primary-600 border-primary-600 text-white'
                                    : 'border-border-primary bg-surface-primary'
                                }`}>
                                  {isLinked && <CheckCircle size={12} weight="bold" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground-primary">
                                    {fieldLabel}
                                  </div>
                                  <div className="text-xs text-foreground-tertiary truncate mt-0.5">
                                    {formatDisplayValue(fieldValue)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* No fields message */}
                    {isExpanded && fieldKeys.length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-foreground-tertiary border-t border-border-secondary">
                        No fields available in this step
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Summary of linked fields */}
          {formData.linked_fields && formData.linked_fields.length > 0 && (
            <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-2">
                {formData.linked_fields.length} field{formData.linked_fields.length > 1 ? 's' : ''} linked:
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.linked_fields.map((field, idx) => (
                  <span
                    key={`${field.stepDataId}-${field.fieldKey}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 text-xs rounded"
                  >
                    <span className="font-medium">{field.fieldLabel || field.fieldKey}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const stepData = availableStepData.find(s => s.id === field.stepDataId);
                        if (stepData) {
                          handleFieldToggle(field.stepDataId, field.fieldKey, stepData);
                        }
                      }}
                      className="ml-1 hover:text-error transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <TextAreaField
          label="Description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange({ target: { name: 'description', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
          rows={4}
          error={errors.description}
          placeholder="Describe the issue in detail..."
        />

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-foreground-primary mb-1">
            Attachments
          </label>
          <div className="space-y-3">
            {/* Existing Attachments (for edit mode) */}
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground-tertiary">Existing Attachments</p>
                {existingAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/30 rounded border border-primary-200 dark:border-primary-800"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} className="text-primary-600 shrink-0" />
                      <span className="text-sm text-foreground-secondary truncate">
                        {attachment.originalName}
                      </span>
                      {attachment.size && (
                        <span className="text-xs text-foreground-tertiary whitespace-nowrap">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                        disabled={downloadingAttachment === attachment.path}
                        className="p-1.5 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded transition-colors disabled:opacity-50"
                        title="Download"
                      >
                        {downloadingAttachment === attachment.path ? (
                          <InlineSpinner size="xs" color="primary" />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      {issueId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingAttachment(attachment.path)}
                          disabled={deletingAttachment === attachment.path}
                          className="p-1.5 text-error hover:bg-error/10 dark:hover:bg-error/20 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingAttachment === attachment.path ? (
                            <InlineSpinner size="xs" color="red" />
                          ) : (
                            <TrashSimple size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File Input for New Uploads */}
            <div>
              {existingAttachments.length > 0 && (
                <p className="text-xs font-medium text-foreground-tertiary mb-2">Add New Attachments</p>
              )}
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border-secondary rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-foreground-tertiary" />
                  <span className="text-sm text-foreground-tertiary">
                    Click to upload files (max 10MB each, up to 10 files total)
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="*/*"
                />
              </label>
            </div>

            {/* File Error */}
            {fileError && (
              <p className="text-sm text-error">{fileError}</p>
            )}

            {/* New File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground-tertiary">New Files to Upload</p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-success/10 dark:bg-success/20 rounded border border-success/30 dark:border-success/40"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} className="text-success shrink-0" />
                      <span className="text-sm text-foreground-secondary truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-foreground-tertiary whitespace-nowrap">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-error hover:bg-error/10 dark:hover:bg-error/20 rounded transition-colors"
                    >
                      <TrashSimple size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-primary">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-border-secondary text-foreground-secondary rounded-lg hover:bg-surface-hover disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
