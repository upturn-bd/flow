"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField, TextAreaField } from "@/components/forms";
import { ModalActionButtons } from "@/components/ui/ModalActionButtons";
import { Warning, PaperPlaneTilt, Paperclip, X } from "@phosphor-icons/react";
import { StakeholderIssueCategory } from "@/lib/types/schemas";

interface PublicTicketFormProps {
  stakeholder: any;
  categories: StakeholderIssueCategory[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function PublicTicketForm({
  stakeholder,
  categories,
  onSubmit,
  onCancel,
  loading = false,
}: PublicTicketFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium" as "Low" | "Medium" | "High" | "Urgent",
    category_id: undefined as number | undefined,
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        attachments,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activCategories = categories.filter(cat => cat.is_active);

  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div>
          <h2 className="text-xl font-bold text-foreground-primary mb-2">
            Create New Ticket
          </h2>
          <p className="text-sm text-foreground-secondary">
            Fill in the details below to submit your support request
          </p>
        </div>

        {/* Title */}
        <FormField
          label="Ticket Title"
          required
          error={errors.title}
        >
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Brief description of your issue"
            className="w-full px-4 py-2 bg-surface-primary border border-border-primary rounded-lg
                     text-foreground-primary placeholder-foreground-tertiary
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-colors"
            disabled={isSubmitting}
          />
        </FormField>

        {/* Description */}
        <TextAreaField
          label="Description"
          value={formData.description || ""}
          onChange={(value) => handleInputChange("description", value)}
          placeholder="Provide detailed information about your issue..."
          required
          rows={5}
          error={errors.description}
          disabled={isSubmitting}
        />

        {/* Priority */}
        <SelectField
          label="Priority"
          value={formData.priority}
          onChange={(value) => handleInputChange("priority", value)}
          options={[
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" },
            { value: "Urgent", label: "Urgent" },
          ]}
          required
          disabled={isSubmitting}
        />

        {/* Category (Optional) */}
        {activCategories.length > 0 && (
          <SelectField
            label="Category"
            value={formData.category_id?.toString() || ""}
            onChange={(value) => handleInputChange("category_id", value ? parseInt(value) : undefined)}
            options={[
              { value: "", label: "Select a category (optional)" },
              ...activCategories
                .filter(cat => cat.id !== undefined)
                .map(cat => ({
                  value: cat.id!.toString(),
                  label: cat.name,
                })),
            ]}
            disabled={isSubmitting}
          />
        )}

        {/* Contact Information */}
        <div className="border-t border-border-primary pt-6">
          <h3 className="text-sm font-semibold text-foreground-primary mb-4">
            Contact Information (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Contact Name">
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 bg-surface-primary border border-border-primary rounded-lg
                         text-foreground-primary placeholder-foreground-tertiary
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Contact Email">
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 bg-surface-primary border border-border-primary rounded-lg
                         text-foreground-primary placeholder-foreground-tertiary
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Contact Phone">
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 bg-surface-primary border border-border-primary rounded-lg
                         text-foreground-primary placeholder-foreground-tertiary
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors"
                disabled={isSubmitting}
              />
            </FormField>
          </div>
        </div>

        {/* File Attachments */}
        <div className="border-t border-border-primary pt-6">
          <FormField label="Attachments">
            <div className="space-y-3">
              <label
                className="flex items-center justify-center gap-2 px-4 py-3 
                         bg-surface-secondary border-2 border-dashed border-border-primary 
                         rounded-lg cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <Paperclip size={20} className="text-foreground-secondary" />
                <span className="text-sm font-medium text-foreground-secondary">
                  Choose files or drag and drop
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
              </label>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 
                               bg-surface-secondary rounded-lg border border-border-primary"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip size={16} className="text-foreground-tertiary shrink-0" />
                        <span className="text-sm text-foreground-primary truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-foreground-tertiary shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-error/10 rounded text-error transition-colors"
                        disabled={isSubmitting}
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Info Banner */}
        <div className="bg-info/10 dark:bg-info/20 border border-info/30 rounded-lg p-4 flex items-start gap-3">
          <Warning size={20} weight="fill" className="text-info shrink-0 mt-0.5" />
          <div className="text-xs text-foreground-primary">
            <p className="font-medium mb-1">Important Information</p>
            <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
              <li>Your ticket will be reviewed by our support team</li>
              <li>You will receive updates on this ticket via email (if provided)</li>
              <li>Please provide as much detail as possible to help us assist you better</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <ModalActionButtons
          submitLabel={isSubmitting ? "Creating..." : "Create Ticket"}
          cancelLabel="Cancel"
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          submitIcon={<PaperPlaneTilt size={18} weight="fill" />}
        />
      </form>
    </div>
  );
}
