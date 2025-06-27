// Advanced validation schemas for complex entities
import { ValidationResult, ValidationError, validateString, validateNumber, validateRequired } from './common';

// Education/Experience validation
export interface EducationData {
  type: any; // SchoolingType
  name: string;
  institute: string;
  from_date: string;
  to_date: string;
  result: string;
  attachments?: string[];
}

export function validateEducation(data: EducationData): ValidationResult<EducationData> {
  const errors: ValidationError[] = [];
  
  // Validate required fields
  const requiredError = validateRequired(data.type, 'type');
  if (requiredError) errors.push(requiredError);
  
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  const instituteError = validateString(data.institute, 'institute', { required: true, minLength: 2, maxLength: 200 });
  if (instituteError) errors.push(instituteError);
  
  const fromDateError = validateRequired(data.from_date, 'from_date');
  if (fromDateError) errors.push(fromDateError);
  
  const toDateError = validateRequired(data.to_date, 'to_date');
  if (toDateError) errors.push(toDateError);
  
  const resultError = validateString(data.result, 'result', { required: true, maxLength: 50 });
  if (resultError) errors.push(resultError);
  
  // Validate date logic
  if (data.from_date && data.to_date && new Date(data.from_date) > new Date(data.to_date)) {
    errors.push({ field: 'to_date', message: 'End date must be after start date' });
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export interface ExperienceData {
  company_name: string;
  designation: string;
  from_date: string;
  to_date?: string;
  currently_working?: boolean;
  description?: string;
  salary?: number;
  attachments?: string[];
}

export function validateExperience(data: ExperienceData): ValidationResult<ExperienceData> {
  const errors: ValidationError[] = [];
  
  // Validate required fields
  const companyError = validateString(data.company_name, 'company_name', { required: true, minLength: 2, maxLength: 100 });
  if (companyError) errors.push(companyError);
  
  const designationError = validateString(data.designation, 'designation', { required: true, minLength: 2, maxLength: 100 });
  if (designationError) errors.push(designationError);
  
  const fromDateError = validateRequired(data.from_date, 'from_date');
  if (fromDateError) errors.push(fromDateError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 1000 });
    if (descError) errors.push(descError);
  }
  
  // Validate salary if provided
  if (data.salary !== undefined) {
    const salaryError = validateNumber(data.salary, 'salary', { min: 0 });
    if (salaryError) errors.push(salaryError);
  }
  
  // Validate date logic if not currently working
  if (!data.currently_working && data.to_date && data.from_date && 
      new Date(data.from_date) > new Date(data.to_date)) {
    errors.push({ field: 'to_date', message: 'End date must be after start date' });
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Project Management validation
export interface ProjectData {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  priority?: string;
  budget?: number;
  client_name?: string;
}

export function validateProject(data: ProjectData): ValidationResult<ProjectData> {
  const errors: ValidationError[] = [];
  
  // Validate required fields
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  const startDateError = validateRequired(data.start_date, 'start_date');
  if (startDateError) errors.push(startDateError);
  
  const statusError = validateRequired(data.status, 'status');
  if (statusError) errors.push(statusError);
  
  // Validate optional fields
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 1000 });
    if (descError) errors.push(descError);
  }
  
  if (data.budget !== undefined) {
    const budgetError = validateNumber(data.budget, 'budget', { min: 0 });
    if (budgetError) errors.push(budgetError);
  }
  
  if (data.client_name) {
    const clientError = validateString(data.client_name, 'client_name', { maxLength: 100 });
    if (clientError) errors.push(clientError);
  }
  
  // Validate date logic
  if (data.end_date && data.start_date && new Date(data.start_date) > new Date(data.end_date)) {
    errors.push({ field: 'end_date', message: 'End date must be after start date' });
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export interface MilestoneData {
  milestone_title: string;
  description?: string;
  start_date: string;
  end_date: string;
  weightage: number;
  status: string;
  project_id: number;
  assignees: string[];
}

export function validateMilestone(data: MilestoneData): ValidationResult<MilestoneData> {
  const errors: ValidationError[] = [];
  
  // Validate milestone title
  const titleError = validateString(data.milestone_title, 'milestone_title', { required: true, minLength: 2, maxLength: 100 });
  if (titleError) errors.push(titleError);
  
  // Validate description (optional)
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  // Validate dates
  const startDateError = validateRequired(data.start_date, 'start_date');
  if (startDateError) errors.push(startDateError);
  
  const endDateError = validateRequired(data.end_date, 'end_date');
  if (endDateError) errors.push(endDateError);
  
  // Validate date logic
  if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
    errors.push({ field: 'end_date', message: 'End date must be after start date' });
  }
  
  // Validate weightage
  const weightageError = validateNumber(data.weightage, 'weightage', { required: true, min: 0, max: 100 });
  if (weightageError) errors.push(weightageError);
  
  // Validate status
  const statusError = validateString(data.status, 'status', { required: true });
  if (statusError) errors.push(statusError);
  
  // Validate project_id
  const projectError = validateNumber(data.project_id, 'project_id', { required: true, min: 1 });
  if (projectError) errors.push(projectError);
  
  // Validate assignees (optional array)
  if (data.assignees && !Array.isArray(data.assignees)) {
    errors.push({ field: 'assignees', message: 'Assignees must be an array' });
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Task validation
export interface TaskData {
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  project_id: number;
  milestone_id?: number;
  assignees: string[];
  estimated_hours?: number;
}

export function validateTask(data: TaskData): ValidationResult<TaskData> {
  const errors: ValidationError[] = [];
  
  // Validate required fields
  const titleError = validateString(data.title, 'title', { required: true, minLength: 2, maxLength: 200 });
  if (titleError) errors.push(titleError);
  
  const priorityError = validateRequired(data.priority, 'priority');
  if (priorityError) errors.push(priorityError);
  
  const statusError = validateRequired(data.status, 'status');
  if (statusError) errors.push(statusError);
  
  const projectIdError = validateNumber(data.project_id, 'project_id', { required: true, min: 1 });
  if (projectIdError) errors.push(projectIdError);
  
  // Validate optional fields
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 1000 });
    if (descError) errors.push(descError);
  }
  
  if (data.milestone_id !== undefined) {
    const milestoneError = validateNumber(data.milestone_id, 'milestone_id', { min: 1 });
    if (milestoneError) errors.push(milestoneError);
  }
  
  if (data.estimated_hours !== undefined) {
    const hoursError = validateNumber(data.estimated_hours, 'estimated_hours', { min: 0.1 });
    if (hoursError) errors.push(hoursError);
  }
  
  // Validate assignees (optional array)
  if (data.assignees && !Array.isArray(data.assignees)) {
    errors.push({ field: 'assignees', message: 'Assignees must be an array' });
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Claim Type validation
export interface ClaimTypeData {
  settlement_item: string;
  allowance: number;
  settler_id: string;
  settlement_level_id?: number;
}

export function validateClaimType(data: ClaimTypeData): ValidationResult<ClaimTypeData> {
  const errors: ValidationError[] = [];
  
  // Validate settlement_item
  const itemError = validateString(data.settlement_item, 'settlement_item', { required: true, minLength: 1, maxLength: 25 });
  if (itemError) errors.push(itemError);
  
  // Validate allowance
  const allowanceError = validateNumber(data.allowance, 'allowance', { required: true, min: 1 });
  if (allowanceError) errors.push(allowanceError);
  
  // Validate settler_id
  const settlerError = validateString(data.settler_id, 'settler_id', { required: true, minLength: 1 });
  if (settlerError) errors.push(settlerError);
  
  // Validate settlement_level_id if provided
  if (data.settlement_level_id !== undefined) {
    const levelError = validateNumber(data.settlement_level_id, 'settlement_level_id', { min: 1 });
    if (levelError) errors.push(levelError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Lineage validation
export interface LineageData {
  name: string;
  hierarchy: Array<{
    level: number;
    position_id: number | null;
  }>;
}

export function validateLineage(data: LineageData): ValidationResult<LineageData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate hierarchy
  if (!data.hierarchy || !Array.isArray(data.hierarchy)) {
    errors.push({ field: 'hierarchy', message: 'Hierarchy is required' });
  } else if (data.hierarchy.length === 0) {
    errors.push({ field: 'hierarchy', message: 'At least one level is required' });
  } else {
    // Validate each hierarchy level
    data.hierarchy.forEach((level, index) => {
      if (level.position_id === null || level.position_id === undefined) {
        errors.push({ field: `hierarchy[${index}].position_id`, message: `Position is required for level ${level.level}` });
      }
      
      const levelError = validateNumber(level.level, `hierarchy[${index}].level`, { required: true, min: 1 });
      if (levelError) errors.push(levelError);
    });
    
    // Check for duplicate position_ids
    const positionIds = data.hierarchy.map(h => h.position_id).filter(id => id !== null);
    const uniquePositionIds = new Set(positionIds);
    if (positionIds.length !== uniquePositionIds.size) {
      errors.push({ field: 'hierarchy', message: 'Each position can only be used once in the hierarchy' });
    }
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Notice validation
export interface NoticeData {
  notice_type_id?: number;
  title: string;
  description: string;
  urgency: string;
  valid_from: string;
  valid_till: string;
  department_id?: number;
}

export function validateNotice(data: NoticeData): ValidationResult<NoticeData> {
  const errors: ValidationError[] = [];
  
  // Validate title
  const titleError = validateString(data.title, 'title', { required: true, minLength: 3, maxLength: 200 });
  if (titleError) errors.push(titleError);
  
  // Validate description
  const descriptionError = validateString(data.description, 'description', { required: true, minLength: 10, maxLength: 1000 });
  if (descriptionError) errors.push(descriptionError);
  
  // Validate urgency
  const urgencyError = validateString(data.urgency, 'urgency', { required: true });
  if (urgencyError) errors.push(urgencyError);
  
  // Validate dates
  const validFromError = validateRequired(data.valid_from, 'valid_from');
  if (validFromError) errors.push(validFromError);
  
  const validTillError = validateRequired(data.valid_till, 'valid_till');
  if (validTillError) errors.push(validTillError);
  
  // Validate date logic
  if (data.valid_from && data.valid_till && new Date(data.valid_from) > new Date(data.valid_till)) {
    errors.push({ field: 'valid_till', message: 'End date must be after start date' });
  }
  
  // Validate optional fields
  if (data.notice_type_id !== undefined) {
    const typeError = validateNumber(data.notice_type_id, 'notice_type_id', { required: false, min: 1 });
    if (typeError) errors.push(typeError);
  }
  
  if (data.department_id !== undefined) {
    const departmentError = validateNumber(data.department_id, 'department_id', { required: false, min: 1 });
    if (departmentError) errors.push(departmentError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
