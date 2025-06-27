// Common validation schemas and utilities without external dependencies
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Common validation utilities
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

export function validateString(value: string, fieldName: string, options: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
} = {}): ValidationError | null {
  if (options.required && (!value || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  
  if (value && options.minLength && value.length < options.minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${options.minLength} characters` };
  }
  
  if (value && options.maxLength && value.length > options.maxLength) {
    return { field: fieldName, message: `${fieldName} must be less than ${options.maxLength} characters` };
  }
  
  return null;
}

export function validateNumber(value: any, fieldName: string, options: {
  min?: number;
  max?: number;
  required?: boolean;
  integer?: boolean;
} = {}): ValidationError | null {
  if (options.required && (value === undefined || value === null || value === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  
  if (value !== undefined && value !== null && value !== '') {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) {
      return { field: fieldName, message: `${fieldName} must be a valid number` };
    }
    
    if (options.integer && !Number.isInteger(num)) {
      return { field: fieldName, message: `${fieldName} must be an integer` };
    }
    
    if (options.min !== undefined && num < options.min) {
      return { field: fieldName, message: `${fieldName} must be at least ${options.min}` };
    }
    
    if (options.max !== undefined && num > options.max) {
      return { field: fieldName, message: `${fieldName} must be at most ${options.max}` };
    }
  }
  
  return null;
}

export function validateEmail(value: string, fieldName: string, required: boolean = true): ValidationError | null {
  if (required && (!value || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  
  if (value && value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: `${fieldName} must be a valid email address` };
    }
  }
  
  return null;
}

export function validateDate(value: string, fieldName: string, required: boolean = true): ValidationError | null {
  if (required && (!value || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  
  if (value && value.trim()) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return { field: fieldName, message: `${fieldName} must be in YYYY-MM-DD format` };
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: `${fieldName} must be a valid date` };
    }
  }
  
  return null;
}

export function validateTime(value: string, fieldName: string, required: boolean = true): ValidationError | null {
  if (required && (!value || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  
  if (value && value.trim()) {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(value)) {
      return { field: fieldName, message: `${fieldName} must be in HH:MM format` };
    }
  }
  
  return null;
}

export function validateUrl(value: string, fieldName: string, required: boolean = false): ValidationError | null {
  if (required && (!value || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  
  if (value && value.trim()) {
    try {
      new URL(value);
    } catch {
      return { field: fieldName, message: `${fieldName} must be a valid URL` };
    }
  }
  
  return null;
}

// Utility to combine validation results
export function combineValidationResults<T>(
  data: T,
  validationErrors: (ValidationError | null)[]
): ValidationResult<T> {
  const errors = validationErrors.filter(error => error !== null) as ValidationError[];
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Helper to convert validation errors to object format (compatible with existing code)
export function validationErrorsToObject(errors: ValidationError[] = []): Record<string, string> {
  const errorObj: Record<string, string> = {};
  errors.forEach(error => {
    errorObj[error.field] = error.message;
  });
  return errorObj;
}
