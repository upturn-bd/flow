"use client";

import { useState, useEffect } from "react";
import BaseForm from "@/components/forms/BaseForm";
import {
  validateStakeholderIssue,
  validationErrorsToObject,
} from "@/lib/validation/schemas/stakeholder-issues";
import { StakeholderIssueFormData } from "@/hooks/useStakeholderIssues";
import { StakeholderIssueAttachment, StakeholderIssueCategory, StakeholderIssueSubcategory } from "@/lib/types/schemas";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeams } from "@/hooks/useTeams";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useStakeholderIssueCategories } from "@/hooks/useStakeholderIssueCategories";
import { X, Upload, Trash, Download, FileText, User, UsersThree, Tag } from "@/lib/icons";
import InlineSpinner from "@/components/ui/InlineSpinner";
import { FormField, SelectField, TextAreaField } from "@/components/forms";
import { captureError } from "@/lib/sentry";

type AssignmentType = 'employee' | 'team';

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
  const { deleteAttachment, downloadAttachment } = useStakeholderIssues();
  const { categories, fetchCategories, loading: loadingCategories } = useStakeholderIssueCategories();
  
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<StakeholderIssueAttachment[]>(
    initialData?.attachments || []
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  
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
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const availableSubcategories = selectedCategory?.subcategories?.filter(s => s.is_active) || [];

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
    fetchCategories();
  }, [fetchEmployees, fetchTeams, fetchCategories]);

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
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingAttachment === attachment.path ? (
                            <InlineSpinner size="xs" color="red" />
                          ) : (
                            <Trash size={16} />
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
              <p className="text-sm text-red-600">{fileError}</p>
            )}

            {/* New File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground-tertiary">New Files to Upload</p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} className="text-green-600 dark:text-green-400 shrink-0" />
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
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded transition-colors"
                    >
                      <Trash size={16} />
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
