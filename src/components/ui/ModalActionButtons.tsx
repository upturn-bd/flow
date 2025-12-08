"use client";

import { Button } from "@/components/ui/button";

interface ModalActionButtonsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  submitText?: string;
  cancelText?: string;
  submitVariant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  type?: "button" | "submit";
}

/**
 * ModalActionButtons - Standardized action buttons for modals
 * Provides consistent Cancel/Submit button layout for all modal forms
 */
export default function ModalActionButtons({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isDisabled = false,
  submitText = "Save",
  cancelText = "Cancel",
  submitVariant = "primary",
  type = "submit",
}: ModalActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-border-primary">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {cancelText}
      </Button>
      
      <Button
        type={type}
        variant={submitVariant}
        onClick={onSubmit}
        disabled={isDisabled}
        isLoading={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Saving..." : submitText}
      </Button>
    </div>
  );
}
