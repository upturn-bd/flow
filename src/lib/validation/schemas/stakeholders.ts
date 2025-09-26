/**
 * Validation schemas for stakeholder management system
 */

import { 
  STAKEHOLDER_ISSUE_STATUS_OPTIONS, 
  STAKEHOLDER_ISSUE_PRIORITY_OPTIONS 
} from '@/lib/constants';

export interface ValidationError {
  field: string;
  message: string;
}

// Stakeholder validation
export function validateStakeholder(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Stakeholder name is required' });
  } else if (data.name.trim().length > 255) {
    errors.push({ field: 'name', message: 'Stakeholder name must be less than 255 characters' });
  }

  // Optional address validation
  if (data.address && (typeof data.address !== 'string' || data.address.length > 500)) {
    errors.push({ field: 'address', message: 'Address must be a string with maximum 500 characters' });
  }

  // Stakeholder type validation
  if (data.stakeholder_type_id && (!Number.isInteger(data.stakeholder_type_id) || data.stakeholder_type_id <= 0)) {
    errors.push({ field: 'stakeholder_type_id', message: 'Valid stakeholder type is required' });
  }

  // Manager validation
  if (data.manager_id && (!Number.isInteger(data.manager_id) || data.manager_id <= 0)) {
    errors.push({ field: 'manager_id', message: 'Valid manager is required' });
  }

  // Assigned employees validation
  if (data.assigned_employees) {
    if (!Array.isArray(data.assigned_employees)) {
      errors.push({ field: 'assigned_employees', message: 'Assigned employees must be an array' });
    } else if (data.assigned_employees.some((emp: any) => typeof emp !== 'string' || emp.trim().length === 0)) {
      errors.push({ field: 'assigned_employees', message: 'All assigned employees must be valid employee IDs' });
    }
  }

  // Contact details validation
  if (data.contact_details) {
    if (typeof data.contact_details !== 'object' || !data.contact_details.contacts) {
      errors.push({ field: 'contact_details', message: 'Contact details must have a contacts array' });
    } else if (!Array.isArray(data.contact_details.contacts)) {
      errors.push({ field: 'contact_details', message: 'Contacts must be an array' });
    } else {
      data.contact_details.contacts.forEach((contact: any, index: number) => {
        const contactErrors = validateStakeholderContact(contact, index);
        errors.push(...contactErrors);
      });
    }
  }

  return errors;
}

// Stakeholder contact validation
export function validateStakeholderContact(contact: any, index?: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldPrefix = index !== undefined ? `contact_${index}` : 'contact';

  if (!contact || typeof contact !== 'object') {
    errors.push({ field: fieldPrefix, message: 'Contact must be an object' });
    return errors;
  }

  // Name validation
  if (!contact.name || typeof contact.name !== 'string' || contact.name.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}_name`, message: 'Contact name is required' });
  } else if (contact.name.trim().length > 100) {
    errors.push({ field: `${fieldPrefix}_name`, message: 'Contact name must be less than 100 characters' });
  }

  // Role validation
  if (!contact.role || typeof contact.role !== 'string' || contact.role.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}_role`, message: 'Contact role is required' });
  } else if (contact.role.trim().length > 100) {
    errors.push({ field: `${fieldPrefix}_role`, message: 'Contact role must be less than 100 characters' });
  }

  // Phone validation
  if (!contact.phone || typeof contact.phone !== 'string' || contact.phone.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}_phone`, message: 'Contact phone is required' });
  } else if (!/^[+]?[\d\s\-\(\)]{10,20}$/.test(contact.phone.trim())) {
    errors.push({ field: `${fieldPrefix}_phone`, message: 'Contact phone must be a valid phone number' });
  }

  // Email validation
  if (!contact.email || typeof contact.email !== 'string' || contact.email.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}_email`, message: 'Contact email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    errors.push({ field: `${fieldPrefix}_email`, message: 'Contact email must be a valid email address' });
  } else if (contact.email.trim().length > 255) {
    errors.push({ field: `${fieldPrefix}_email`, message: 'Contact email must be less than 255 characters' });
  }

  // Address validation (optional)
  if (contact.address && (typeof contact.address !== 'string' || contact.address.length > 500)) {
    errors.push({ field: `${fieldPrefix}_address`, message: 'Contact address must be a string with maximum 500 characters' });
  }

  return errors;
}

// Stakeholder issue validation
export function validateStakeholderIssue(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required stakeholder ID
  if (!data.stakeholder_id || !Number.isInteger(data.stakeholder_id) || data.stakeholder_id <= 0) {
    errors.push({ field: 'stakeholder_id', message: 'Valid stakeholder is required' });
  }

  // Title validation
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Issue title is required' });
  } else if (data.title.trim().length > 255) {
    errors.push({ field: 'title', message: 'Issue title must be less than 255 characters' });
  }

  // Description validation (optional)
  if (data.description && (typeof data.description !== 'string' || data.description.length > 1000)) {
    errors.push({ field: 'description', message: 'Description must be a string with maximum 1000 characters' });
  }

  // Status validation
  if (!data.status || !STAKEHOLDER_ISSUE_STATUS_OPTIONS.includes(data.status)) {
    errors.push({ 
      field: 'status', 
      message: `Status must be one of: ${STAKEHOLDER_ISSUE_STATUS_OPTIONS.join(', ')}` 
    });
  }

  // Priority validation
  if (!data.priority || !STAKEHOLDER_ISSUE_PRIORITY_OPTIONS.includes(data.priority)) {
    errors.push({ 
      field: 'priority', 
      message: `Priority must be one of: ${STAKEHOLDER_ISSUE_PRIORITY_OPTIONS.join(', ')}` 
    });
  }

  // Assigned to validation (optional) - should be a valid UUID string
  if (data.assigned_to && (typeof data.assigned_to !== 'string' || data.assigned_to.trim().length === 0)) {
    errors.push({ field: 'assigned_to', message: 'Valid assignee is required' });
  }

  // Transaction ID validation (optional)
  if (data.transaction_id && (!Number.isInteger(data.transaction_id) || data.transaction_id <= 0)) {
    errors.push({ field: 'transaction_id', message: 'Valid transaction ID is required' });
  }

  return errors;
}

// Stakeholder type validation
export function validateStakeholderType(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Stakeholder type name is required' });
  } else if (data.name.trim().length > 255) {
    errors.push({ field: 'name', message: 'Stakeholder type name must be less than 255 characters' });
  }

  // Description validation (optional)
  if (data.description && (typeof data.description !== 'string' || data.description.length > 500)) {
    errors.push({ field: 'description', message: 'Description must be a string with maximum 500 characters' });
  }

  return errors;
}

// Helper function to convert validation errors to object format
export function validationErrorsToObject(errors: ValidationError[]): Record<string, string> {
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);
}