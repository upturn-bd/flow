// Entity-specific validation schemas
import { ValidationResult, ValidationError, validateString, validateNumber, validateRequired } from './common';

// Department validation
export interface DepartmentData {
  id?: number;
  name: string;
  head_id?: string;
  description?: string;
  division_id?: number;
  company_id?: string | number;
}

export function validateDepartment(data: DepartmentData): ValidationResult<DepartmentData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  // Validate division_id if provided
  if (data.division_id !== undefined) {
    const divisionError = validateNumber(data.division_id, 'division_id', { min: 1 });
    if (divisionError) errors.push(divisionError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Division validation
export interface DivisionData {
  id?: number;
  name: string;
  head_id?: string;
  company_id?: number | string;
  created_at?: string;
  description?: string;
}

export function validateDivision(data: DivisionData): ValidationResult<DivisionData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Grade validation
export interface GradeData {
  id?: number;
  name: string;
  company_id?: number;
  description?: string;
  basic_salary?: number;
}

export function validateGrade(data: GradeData): ValidationResult<GradeData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 1, maxLength: 50 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  // Validate basic_salary if provided
  if (data.basic_salary !== undefined) {
    const salaryError = validateNumber(data.basic_salary, 'basic_salary', { min: 0 });
    if (salaryError) errors.push(salaryError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Position validation
export interface PositionData {
  id?: number;
  name: string;
  description?: string;
  department_id?: number;
  grade?: number;
  company_id?: string | number;
}

export function validatePosition(data: PositionData): ValidationResult<PositionData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  // Validate department_id if provided
  if (data.department_id !== undefined) {
    const deptError = validateNumber(data.department_id, 'department_id', { min: 1 });
    if (deptError) errors.push(deptError);
  }
  
  // Validate grade if provided
  if (data.grade !== undefined) {
    const gradeError = validateNumber(data.grade, 'grade', { min: 1 });
    if (gradeError) errors.push(gradeError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// News and Notice Type validation
export interface NewsAndNoticeTypeData {
  id?: number;
  name: string;
  company_id?: number;
  description?: string;
}

export function validateNewsAndNoticeType(data: NewsAndNoticeTypeData): ValidationResult<NewsAndNoticeTypeData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Complaint Type validation
export interface ComplaintTypeData {
  id?: number;
  name: string;
  company_id?: number;
  description?: string;
}

export function validateComplaintType(data: ComplaintTypeData): ValidationResult<ComplaintTypeData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Requisition Type validation
export interface RequisitionTypeData {
  id?: number;
  name: string;
  company_id?: number;
}

export function validateRequisitionType(data: RequisitionTypeData): ValidationResult<RequisitionTypeData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 50 });
  if (nameError) errors.push(nameError);
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Requisition Inventory validation
export interface RequisitionInventoryData {
  id?: number;
  name: string;
  requisition_category_id?: number;
  description?: string;
  asset_owner: string;
  quantity: number;
  company_id?: number;
  department_id?: number;
}

export function validateRequisitionInventory(data: RequisitionInventoryData): ValidationResult<RequisitionInventoryData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 50 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  // Validate quantity (required, minimum 1)
  const quantityError = validateNumber(data.quantity, 'quantity', { required: true, min: 1 });
  if (quantityError) errors.push(quantityError);
  
  // Validate asset_owner (required)
  const ownerError = validateString(data.asset_owner, 'asset_owner', { required: true, minLength: 1 });
  if (ownerError) errors.push(ownerError);
  
  // Validate requisition_category_id if provided
  if (data.requisition_category_id !== undefined) {
    const categoryError = validateNumber(data.requisition_category_id, 'requisition_category_id', { min: 1 });
    if (categoryError) errors.push(categoryError);
  }
  
  // Validate department_id if provided
  if (data.department_id !== undefined) {
    const deptError = validateNumber(data.department_id, 'department_id', { min: 1 });
    if (deptError) errors.push(deptError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Inventory validation
export interface InventoryData {
  id?: number;
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  requisition_type_id?: number;
  company_id?: number;
}

export function validateInventory(data: InventoryData): ValidationResult<InventoryData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 2, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate description if provided
  if (data.description) {
    const descError = validateString(data.description, 'description', { maxLength: 500 });
    if (descError) errors.push(descError);
  }
  
  // Validate quantity if provided
  if (data.quantity !== undefined) {
    const quantityError = validateNumber(data.quantity, 'quantity', { min: 0 });
    if (quantityError) errors.push(quantityError);
  }
  
  // Validate unit if provided
  if (data.unit) {
    const unitError = validateString(data.unit, 'unit', { maxLength: 50 });
    if (unitError) errors.push(unitError);
  }
  
  // Validate requisition_type_id if provided
  if (data.requisition_type_id !== undefined) {
    const reqTypeError = validateNumber(data.requisition_type_id, 'requisition_type_id', { min: 1 });
    if (reqTypeError) errors.push(reqTypeError);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Leave Type validation
export interface LeaveTypeData {
  id?: number;
  name: string;
  annual_quota: number;
  company_id?: number;
}

export function validateLeaveType(data: LeaveTypeData): ValidationResult<LeaveTypeData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 1, maxLength: 30 });
  if (nameError) errors.push(nameError);
  
  // Validate annual_quota
  const quotaError = validateNumber(data.annual_quota, 'annual_quota', { required: true, min: 1 });
  if (quotaError) errors.push(quotaError);
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Holiday Config validation
export interface HolidayConfigData {
  id?: number;
  name: string;
  date: string;
  company_id?: number;
}

export function validateHolidayConfig(data: HolidayConfigData): ValidationResult<HolidayConfigData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 1, maxLength: 50 });
  if (nameError) errors.push(nameError);
  
  // Validate date (basic string validation, could be enhanced for date format)
  const dateError = validateString(data.date, 'date', { required: true });
  if (dateError) errors.push(dateError);
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Site (Attendance) validation
export interface SiteData {
  id?: number;
  name: string;
  longitude: number;
  latitude: number;
  check_in: string;
  check_out: string;
  location: string;
  company_id?: number;
}

export function validateSite(data: SiteData): ValidationResult<SiteData> {
  const errors: ValidationError[] = [];
  
  // Validate name
  const nameError = validateString(data.name, 'name', { required: true, minLength: 1, maxLength: 100 });
  if (nameError) errors.push(nameError);
  
  // Validate check_in time
  const checkInError = validateString(data.check_in, 'check_in', { required: true, minLength: 1 });
  if (checkInError) errors.push(checkInError);
  
  // Validate check_out time
  const checkOutError = validateString(data.check_out, 'check_out', { required: true, minLength: 1 });
  if (checkOutError) errors.push(checkOutError);
  
  // Validate longitude
  const longitudeError = validateNumber(data.longitude, 'longitude', { required: true });
  if (longitudeError) errors.push(longitudeError);
  
  // Validate latitude
  const latitudeError = validateNumber(data.latitude, 'latitude', { required: true });
  if (latitudeError) errors.push(latitudeError);
  
  // Validate location
  const locationError = validateString(data.location, 'location', { required: true, minLength: 1 });
  if (locationError) errors.push(locationError);
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
