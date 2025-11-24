"use client";

import { useState, useEffect } from "react";
import BaseForm from "@/components/forms/BaseForm";
import {
  validateStakeholderIssue,
  validationErrorsToObject,
} from "@/lib/validation/schemas/stakeholder-issues";
import { StakeholderIssueFormData } from "@/hooks/useStakeholderIssues";
import { StakeholderIssueAttachment } from "@/lib/types/schemas";
import { useEmployeesContext } from "@/contexts";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { X, Upload, Trash2, Download, FileText } from "lucide-react";

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
  const { employees, loading: loadingEmployees } = useEmployeesContext();
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter issue title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.priority ? "border-red-500" : "border-gray-300"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign To Employee
          </label>
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            disabled={loadingEmployees}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.assigned_to ? "border-red-500" : "border-gray-300"
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
          <p className="mt-1 text-xs text-gray-500">
            Optional: Assign this issue to a specific employee
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.status ? "border-red-500" : "border-gray-300"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Describe the issue in detail..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments
          </label>
          <div className="space-y-3">
            {/* Existing Attachments (for edit mode) */}
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Existing Attachments</p>
                {existingAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} className="text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {attachment.originalName}
                      </span>
                      {attachment.size && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                        disabled={downloadingAttachment === attachment.path}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                        title="Download"
                      >
                        {downloadingAttachment === attachment.path ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      {issueId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingAttachment(attachment.path)}
                          disabled={deletingAttachment === attachment.path}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingAttachment === attachment.path ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 size={16} />
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
                <p className="text-xs font-medium text-gray-600 mb-2">Add New Attachments</p>
              )}
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
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
                <p className="text-xs font-medium text-gray-600">New Files to Upload</p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} className="text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
