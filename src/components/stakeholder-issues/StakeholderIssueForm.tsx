"use client";

import { useState, useEffect } from "react";
import BaseForm from "@/components/forms/BaseForm";
import {
  validateStakeholderIssue,
  validationErrorsToObject,
} from "@/lib/validation/schemas/stakeholder-issues";
import { StakeholderIssueFormData } from "@/hooks/useStakeholderIssues";
import { StakeholderIssueAttachment } from "@/lib/types/schemas";
import { useEmployees } from "@/hooks/useEmployees";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { X, Upload, Trash, Download, FileText } from "@/lib/icons";

interface StakeholderIssueFormProps {
  stakeholderId: number;
  issueId?: number;
  initialData?: {
    title?: string;
    description?: string;
    status?: 'Pending' | 'In Progress' | 'Resolved';
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    assigned_to?: string;
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
  const { deleteAttachment, downloadAttachment } = useStakeholderIssues();
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<StakeholderIssueAttachment[]>(
    initialData?.attachments || []
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  const [formData, setFormData] = useState<StakeholderIssueFormData>({
    stakeholder_id: stakeholderId,
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "Pending",
    priority: initialData?.priority || "Medium",
    assigned_to: initialData?.assigned_to || "",
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary text-foreground-primary ${
              errors.title ? "border-red-500" : "border-border-secondary"
            }`}
            placeholder="Enter issue title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary text-foreground-primary ${
              errors.priority ? "border-red-500" : "border-border-secondary"
            }`}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
          )}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Assign To Employee
          </label>
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            disabled={loadingEmployees}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary text-foreground-primary ${
              errors.assigned_to ? "border-red-500" : "border-border-secondary"
            } ${loadingEmployees ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <option value="">-- Select an employee --</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {errors.assigned_to && (
            <p className="mt-1 text-sm text-red-600">{errors.assigned_to}</p>
          )}
          <p className="mt-1 text-xs text-foreground-tertiary">
            Optional: Assign this issue to a specific employee
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary text-foreground-primary ${
              errors.status ? "border-red-500" : "border-border-secondary"
            }`}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none bg-surface-primary text-foreground-primary ${
              errors.description ? "border-red-500" : "border-border-secondary"
            }`}
            placeholder="Describe the issue in detail..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
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
                      <FileText size={16} className="text-primary-600 flex-shrink-0" />
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
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
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
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
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
                      <FileText size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
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
