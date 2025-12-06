/**
 * Validation schemas for stakeholder issue categories and subcategories
 */

import { IssueCategoryFormData, IssueSubcategoryFormData } from "@/hooks/useStakeholderIssueCategories";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validate issue category form data
 */
export function validateIssueCategory(
  data: IssueCategoryFormData
): ValidationResult<IssueCategoryFormData> {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name || data.name.trim() === "") {
    errors.push({
      field: "name",
      message: "Category name is required",
    });
  } else if (data.name.length > 100) {
    errors.push({
      field: "name",
      message: "Category name must not exceed 100 characters",
    });
  }

  // Validate color - must be a valid hex color
  if (!data.color) {
    errors.push({
      field: "color",
      message: "Color is required",
    });
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.push({
      field: "color",
      message: "Color must be a valid hex color (e.g., #6366f1)",
    });
  }

  // Validate description length if provided
  if (data.description && data.description.length > 500) {
    errors.push({
      field: "description",
      message: "Description must not exceed 500 characters",
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

/**
 * Validate issue subcategory form data
 */
export function validateIssueSubcategory(
  data: IssueSubcategoryFormData
): ValidationResult<IssueSubcategoryFormData> {
  const errors: ValidationError[] = [];

  // Validate category_id
  if (!data.category_id) {
    errors.push({
      field: "category_id",
      message: "Parent category is required",
    });
  }

  // Validate name
  if (!data.name || data.name.trim() === "") {
    errors.push({
      field: "name",
      message: "Subcategory name is required",
    });
  } else if (data.name.length > 100) {
    errors.push({
      field: "name",
      message: "Subcategory name must not exceed 100 characters",
    });
  }

  // Validate description length if provided
  if (data.description && data.description.length > 500) {
    errors.push({
      field: "description",
      message: "Description must not exceed 500 characters",
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
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
