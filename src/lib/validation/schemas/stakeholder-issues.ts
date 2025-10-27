/**
 * Validation schemas for stakeholder issue forms
 */

import { StakeholderIssueFormData } from "@/hooks/useStakeholderIssues";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate stakeholder issue form data
 */
export function validateStakeholderIssue(
  data: Partial<StakeholderIssueFormData>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate stakeholder_id
  if (!data.stakeholder_id) {
    errors.push({
      field: "stakeholder_id",
      message: "Stakeholder is required",
    });
  }

  // Validate title
  if (!data.title || data.title.trim() === "") {
    errors.push({
      field: "title",
      message: "Title is required",
    });
  } else if (data.title.length > 255) {
    errors.push({
      field: "title",
      message: "Title must not exceed 255 characters",
    });
  }

  // Validate status
  if (!data.status) {
    errors.push({
      field: "status",
      message: "Status is required",
    });
  } else if (!["Pending", "In Progress", "Resolved"].includes(data.status)) {
    errors.push({
      field: "status",
      message: "Invalid status value",
    });
  }

  // Validate priority
  if (!data.priority) {
    errors.push({
      field: "priority",
      message: "Priority is required",
    });
  } else if (!["Low", "Medium", "High", "Urgent"].includes(data.priority)) {
    errors.push({
      field: "priority",
      message: "Invalid priority value",
    });
  }

  // Validate description length if provided
  if (data.description && data.description.length > 5000) {
    errors.push({
      field: "description",
      message: "Description must not exceed 5000 characters",
    });
  }

  // Validate file attachments if provided
  if (data.attachments && data.attachments.length > 0) {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (data.attachments.length > maxFiles) {
      errors.push({
        field: "attachments",
        message: `You can upload a maximum of ${maxFiles} files`,
      });
    }

    data.attachments.forEach((file, index) => {
      if (file.size > maxFileSize) {
        errors.push({
          field: `attachments[${index}]`,
          message: `File "${file.name}" exceeds the maximum size of 10MB`,
        });
      }
    });
  }

  return errors;
}

/**
 * Convert validation errors to a field-indexed object
 */
export function validationErrorsToObject(
  errors: ValidationError[]
): Record<string, string> {
  const errorObj: Record<string, string> = {};
  errors.forEach((error) => {
    if (!errorObj[error.field]) {
      errorObj[error.field] = error.message;
    }
  });
  return errorObj;
}
