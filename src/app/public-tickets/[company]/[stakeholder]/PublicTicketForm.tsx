"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { FormField, SelectField, TextAreaField, FileUploadField } from "@/components/forms";
import { Info } from "@phosphor-icons/react";
import { StakeholderIssueCategory } from "@/lib/types/schemas";

interface PublicTicketFormProps {
  categories: StakeholderIssueCategory[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function PublicTicketForm({
  categories,
  onSubmit,
  onCancel,
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

  const handleFilesChange = (files: File[]) => {
    setAttachments(files);
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
    <Card padding="lg" hover={false}>
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
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Brief description of your issue"
          disabled={isSubmitting}
        />

        {/* Description */}
        <TextAreaField
          label="Description"
          value={formData.description || ""}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Provide detailed information about your issue..."
          required
          rows={5}
          error={errors.description}
          disabled={isSubmitting}
        />

        {/* Priority */}
        <SelectField
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={(e) => handleInputChange("priority", e.target.value)}
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
            name="category_id"
            value={formData.category_id?.toString() || ""}
            onChange={(e) => handleInputChange("category_id", e.target.value ? parseInt(e.target.value) : undefined)}
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
            <FormField
              label="Contact Name"
              type="text"
              value={formData.contact_name}
              onChange={(e) => handleInputChange("contact_name", e.target.value)}
              placeholder="Your name"
              disabled={isSubmitting}
            />

            <FormField
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange("contact_email", e.target.value)}
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />

            <FormField
              label="Contact Phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange("contact_phone", e.target.value)}
              placeholder="+1234567890"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* File Attachments */}
        <div className="border-t border-border-primary pt-6">
          <FileUploadField
            label="Attachments"
            files={attachments}
            onFilesChange={handleFilesChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            multiple
          />
        </div>

        {/* Info Banner */}
        <div className="bg-info/10 dark:bg-info/20 border border-info/30 rounded-lg p-4 flex items-start gap-3">
          <Info size={20} weight="fill" className="text-info shrink-0 mt-0.5" />
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
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-border-primary">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
