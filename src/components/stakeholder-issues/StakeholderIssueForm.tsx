"use client";

import { useState } from "react";
import BaseForm from "@/components/forms/BaseForm";
import { useFormState } from "@/hooks/useFormState";
import {
  validateStakeholderIssue,
  validationErrorsToObject,
} from "@/lib/validation/schemas/stakeholder-issues";
import { StakeholderIssueFormData } from "@/hooks/useStakeholderIssues";
import { X, Upload, Trash2 } from "lucide-react";

interface StakeholderIssueFormProps {
  stakeholderId: number;
  initialData?: Partial<StakeholderIssueFormData>;
  onSubmit: (data: StakeholderIssueFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function StakeholderIssueForm({
  stakeholderId,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Issue",
}: StakeholderIssueFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    formData,
    errors,
    isDirty,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldError,
  } = useFormState<StakeholderIssueFormData>(
    {
      stakeholder_id: stakeholderId,
      title: initialData?.title || "",
      description: initialData?.description || "",
      status: initialData?.status || "Pending",
      priority: initialData?.priority || "Medium",
      attachments: [],
    },
    (data) => {
      const validationErrors = validateStakeholderIssue(data);
      return validationErrorsToObject(validationErrors);
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selectedFiles = Array.from(e.target.files || []);
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (files.length + selectedFiles.length > maxFiles) {
      setFileError(`You can upload a maximum of ${maxFiles} files`);
      return;
    }

    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setFileError(`Some files exceed the maximum size of 10MB`);
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async () => {
    const dataToSubmit = {
      ...formData,
      attachments: files,
    };

    await onSubmit(dataToSubmit);
  };

  return (
    <BaseForm
      title={initialData ? "Edit Issue" : "Create New Issue"}
      onSubmit={handleSubmit(handleFormSubmit)}
      onCancel={onCancel}
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      isDirty={isDirty}
    >
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
          <div className="space-y-2">
            {/* File Input */}
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload files (max 10MB each, up to 10 files)
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

            {/* File Error */}
            {fileError && (
              <p className="text-sm text-red-600">{fileError}</p>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
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
    </BaseForm>
  );
}
