/**
 * Simple validation utilities to replace Zod
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors: ValidationError[];
}

/**
 * Validates a notice object
 */
export function validateNotice(notice: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Required field validations
  if (!notice.notice_type_id || notice.notice_type_id < 1) {
    errors.push({ field: 'notice_type_id', message: 'Please select a notice type' });
  }

  if (!notice.title || typeof notice.title !== 'string' || notice.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Please enter a title' });
  } else if (notice.title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or fewer' });
  }

  if (!notice.description || typeof notice.description !== 'string' || notice.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Please enter a description' });
  }

  if (!notice.urgency || typeof notice.urgency !== 'string' || notice.urgency.trim().length === 0) {
    errors.push({ field: 'urgency', message: 'Please select an urgency level' });
  }

  if (!notice.valid_from || typeof notice.valid_from !== 'string' || notice.valid_from.trim().length === 0) {
    errors.push({ field: 'valid_from', message: 'Please select a start date' });
  }

  if (!notice.valid_till || typeof notice.valid_till !== 'string' || notice.valid_till.trim().length === 0) {
    errors.push({ field: 'valid_till', message: 'Please select an end date' });
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? notice : undefined,
    errors
  };
}

/**
 * Helper function to convert validation errors to object format (like Zod used to)
 */
export function validationErrorsToObject(errors: ValidationError[]): Record<string, string> {
  const errorObj: Record<string, string> = {};
  errors.forEach(error => {
    errorObj[error.field] = error.message;
  });
  return errorObj;
}
