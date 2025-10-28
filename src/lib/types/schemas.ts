/**
 * Type definitions to replace Zod schemas
 */

import { SCHOOLING_TYPES, SchoolingType as ConstantsSchoolingType } from '@/lib/constants';

export const schoolingTypes = Object.values(SCHOOLING_TYPES);

export type SchoolingType = ConstantsSchoolingType;

export interface Schooling {
  type: SchoolingType;
  name: string;
  institute: string;
  from_date: string;
  to_date: string;
  result: string;
  attachments?: string[];
  id?: number;
  employee_id?: string;
  company_id?: number;
}

export interface Leave {
  id?: number;
  type_id?: number;
  start_date: string;
  end_date: string;
  remarks?: string;
  status: string;
  approved_by_id?: string;
  employee_id?: string;
  requested_to?: string;
  company_id?: number;
  description?: string;
}

export interface Experience {
  company_name: string;
  designation: string;
  from_date: string;
  to_date: string;
  description?: string;
  employee_id?: string;
  company_id?: number;
  id?: number;
}

export interface Lineage {
  name: string;
  hierarchical_level: number;
  position_id: number;
  company_id?: number;
  id?: number;
}

export interface Site {
  id?: number;
  name: string;
  longitude: number;
  latitude: number;
  check_in: string;
  check_out: string;
  location: string;
  company_id?: number;
}

export interface LeaveType {
  id?: number;
  name: string;
  annual_quota: number;
  company_id?: number;
}

export interface HolidayConfig {
  start_day: string;
  end_day: string;
  id?: number;
  name: string;
  date: string;
  company_id?: number;
}

export interface WeeklyHolidayConfig {
  id?: number;
  day: number;
  company_id?: number;
}

export interface RequisitionType {
  id?: number;
  name: string;
  company_id?: number;
}

export interface NoticeType {
  id?: number;
  name: string;
  company_id?: number;
}

export interface ComplaintsType {
  id?: number;
  name: string;
  company_id?: number;
}

export interface RequisitionInventory {
  id?: number;
  name: string;
  requisition_category_id?: number;
  description?: string;
  asset_owner: string;
  quantity: number;
  company_id?: number;
  department_id?: number;
}

export interface ClaimType {
  id?: number;
  settlement_item: string;
  allowance: number;
  settlement_level_id?: number;
  settler_id: string;
  company_id?: number;
}

export interface Project {
  id?: number;
  project_title: string;
  description?: string;
  start_date: string;
  end_date: string;
  project_lead_id: string;
  remark?: string;
  department_ids?: number[];
  goal?: string;
  progress?: number | null;
  status: string;
  company_id?: number;
  assignees?: string[];
  created_by?: string;
  created_at?: string;
}

export interface Milestone {
  id?: number;
  milestone_title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  weightage: number;
  project_id?: number;
  company_id?: number;
  assignees?: string[];
}

export interface Comment {
  id?: number;
  comment: string;
  commenter_id: string;
  project_id?: number;
  company_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Task {
  id?: number;
  task_title: string;
  task_description: string;
  start_date: string;
  end_date: string;
  priority: "low" | "normal" | "high" | "urgent";
  project_id?: number;
  milestone_id?: number;
  assignees: string[];
  department_id?: number;
  status?: boolean;
  company_id?: number;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
}

export type RequisitionStatus = "Pending" | "Approved" | "Rejected";

export interface Requisition {
  id?: number;
  requisition_category_id?: number;
  employee_id?: string;
  item_id?: number;
  asset_owner?: string;
  description?: string;
  quantity: number;
  approved_by_id?: string;
  status: RequisitionStatus;
  company_id?: number;
  date: string;
  is_one_off: boolean;
  from_time?: string;
  to_time?: string;
  attachments?: string[];
  comment?: string;
  remark?: string;
}

export interface SettlementRecord {
  id?: number;
  settlement_type_id?: number;
  description?: string;
  event_date: string;
  amount: number;
  comment?: string;
  status: string;
  approved_by_id?: string;
  claimant_id?: string;
  requested_to?: string;
  company_id?: string;
  in_advance?: boolean;
  attachments?: string[];
  attachment_download_urls?: string[];
}

export interface ComplaintRecord {
  id?: number;
  complaint_type_id?: number;
  complainer_id: string;
  resolved_by_id?: string;
  requested_to?: string;
  description: string;
  status: string;
  comment?: string;
  company_id?: number;
  anonymous?: boolean;
  against_whom: string;
  attachments?: string[];
  attachment_download_urls?: string[];
  department_id?: number;
}

export interface Notice {
  id?: number;
  notice_type_id?: number;
  title: string;
  description: string;
  urgency: "low" | "normal" | "high" | "urgent";
  valid_from: string;
  valid_till: string;
  company_id?: number;
  department_id?: number;
  created_by?: string;
}

// Notification System Interfaces (separate from Notice system)
export interface NotificationType {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id?: number;
  title: string;
  message: string;
  type_id?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipient_id: string[];
  sender_id?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  context?: string;
  reference_id?: number;
  reference_table?: string;
  company_id: number;
  department_id?: number;
  expires_at?: string;
  scheduled_for?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data from notification_types
  type?: NotificationType;
}

export interface NotificationPreferences {
  id?: number;
  employee_id: string;
  company_id: number;
  email_enabled: boolean;
  push_enabled: boolean;
  notification_types: Record<string, any>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id?: number;
  attendance_date: string;
  tag: string;
  company_id?: number;
  site_id?: number;
  check_in_time?: string;
  check_in_coordinates?: {
    x: number;
    y: number;
  };
  check_out_time?: string;
  check_out_coordinates?: {
    x: number;
    y: number;
  };
  supervisor_id?: string;
  employee_id: string;
}

export interface Division {
  id?: number;
  name: string;
  head_id?: string;
  company_id?: number | string;
  created_at?: string;
}

export interface Department {
  id?: number;
  name: string;
  head_id?: string;
  description?: string;
  division_id?: number;
  company_id?: string | number;
}

export interface Position {
  id?: number;
  name: string;
  description?: string;
  department_id?: number;
  grade?: number;
  company_id?: string | number;
}

export interface Grade {
  id?: number;
  name: string;
  company_id?: number;
}

export interface CompanyBasics {
  company_name: string;
  company_id: string;
  industry_id: string;
  country_id: string;
  // Operations Settings
  live_absent_enabled: boolean;
  fiscal_year_start: string; // Date format: YYYY-MM-DD (e.g., "2024-01-01")
}

export interface BasicInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: number;
  designation: string;
  job_status: string;
  hire_date: string;
  id_input: string;
  basic_salary?: number; // Added for admin/manager editable salary
}

export interface PersonalInfo {
  id?: number;
  gender?: string;
  religion?: string;
  blood_group?: string;
  marital_status?: string;
  nid_no?: string;
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  permanent_address?: string;
  date_of_birth?: string;
}

export interface OnboardingFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: number | null;
  designation: string;
  job_status: string;
  hire_date: string;
  company_name: string;
  company_id: number;
  supervisor_id: string | null;
  basic_salary?: number; // Added for salary management
}

// Account System Interface
export type AccountStatus = "Complete" | "Pending";
export type PaymentMethod = "Cash" | "Bank" | string; // String allows free text

export interface Account {
  id?: number;
  title: string;
  method?: string | null; // Nullable dropdown
  company_id: number;
  status: AccountStatus;
  from_source: string; // Renamed from 'from' to avoid conflicts
  transaction_date: string; // ISO date string
  amount: number; // Supports negative values for expenses
  currency: string; // Default BDT, but allows free text
  additional_data?: Record<string, any>; // JSONB data
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// Payroll System Interfaces
export interface PayrollAdjustment {
  type: string;
  amount: number; // positive for additions, negative for deductions
}

export interface Payroll {
  id?: number;
  employee_id: string;
  basic_salary: number; // snapshot of the basic salary
  adjustments: PayrollAdjustment[]; // JSON array
  total_amount: number;
  generation_date: string;
  company_id: number;
  status: 'Paid' | 'Pending' | 'Published'; // Updated: 'Adjusted' -> 'Published'
  supervisor_id: string;
  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// Stakeholder Management System (Process-Based)
// ==============================================================================

// Contact Person for Stakeholder
export interface ContactPerson {
  name: string;
  phone: string;
  email: string;
}

// Field definition types for process steps
export type FieldType = 'text' | 'boolean' | 'date' | 'file';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: FieldValidation;
  placeholder?: string;
  helpText?: string;
}

export interface FieldDefinitionsSchema {
  fields: FieldDefinition[];
}

// Stakeholder Process - defines the workflow
export interface StakeholderProcess {
  id?: number;
  name: string;
  description?: string;
  company_id: number;
  is_active: boolean;
  is_sequential: boolean; // If true, steps must be completed in order
  allow_rollback: boolean; // If true, can go back to previous steps (only for sequential)
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Joined data
  steps?: StakeholderProcessStep[];
  step_count?: number;
}

// Process Step - individual step in a process
export interface StakeholderProcessStep {
  id?: number;
  process_id: number;
  name: string;
  description?: string;
  step_order: number;
  team_id: number;
  field_definitions: FieldDefinitionsSchema;
  use_date_range: boolean;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  version?: number; // For backward compatibility
  // Joined data
  team?: {
    id: number;
    name: string;
  };
}

// Stakeholder - main entity (called "Lead" until completed)
export interface Stakeholder {
  id?: number;
  name: string;
  address?: string;
  contact_persons: ContactPerson[];
  process_id: number;
  current_step_id?: number;
  current_step_order: number;
  is_active: boolean;
  is_completed: boolean;
  completed_at?: string;
  issue_handler_id?: string; // Employee ID assigned as issue handler
  company_id: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Joined data
  process?: StakeholderProcess;
  current_step?: StakeholderProcessStep;
  step_data?: StakeholderStepData[];
  issue_handler?: {
    id: string;
    name: string;
    email?: string;
  };
}

// Step Data - actual data for each step of each stakeholder
export interface StakeholderStepData {
  id?: number;
  stakeholder_id: number;
  step_id: number;
  data: Record<string, any>; // Dynamic based on field_definitions
  field_definitions_snapshot?: FieldDefinitionsSchema; // Snapshot for backward compatibility
  step_version?: number;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Joined data
  step?: StakeholderProcessStep;
}

// Stakeholder Issue - issue tracking/ticketing for stakeholders
export interface StakeholderIssue {
  id?: number;
  stakeholder_id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  attachments: StakeholderIssueAttachment[];
  company_id: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  // Joined data
  stakeholder?: Stakeholder;
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
  resolver?: {
    id: string;
    name: string;
    email?: string;
  };
}

// File attachment for stakeholder issues
export interface StakeholderIssueAttachment {
  path: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// Salary Change Audit Trail
export interface SalaryChangeLog {
  id?: number;
  employee_id: string;
  company_id: number;
  change_data: {
    old_value: number;
    new_value: number;
    reason?: string;
    employee_name: string;
    changed_at: string;
  };
  changed_by: string;
  created_at?: string;
}

// Enhanced Account Entry for Payroll Integration
export interface PayrollAccountEntry {
  id?: number;
  account_id?: number;
  payroll_id: number;
  employee_id: string;
  employee_name?: string;
  transaction_type?: 'salary_payment' | 'deduction' | 'bonus';
  amount?: number;
  description?: string;
  company_id?: number;
  created_at?: string;
  created_by?: string;
  total_amount?: number;
  basic_salary?: number;
  adjustments?: any;
  generation_date?: string;
  source?: string;
}

// Team-Based Permissions System
// ==============================================================================

export interface Team {
  id?: number;
  name: string;
  description?: string;
  company_id: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface TeamMember {
  id?: number;
  team_id: number;
  employee_id: string;
  joined_at?: string;
  added_by?: string;
  // Populated fields for display
  employee_name?: string;
  employee_email?: string;
  added_by_name?: string;
}

export type PermissionCategory = 'workflow' | 'services' | 'operations' | 'admin';

export interface Permission {
  id?: number;
  module_name: string;
  display_name: string;
  description?: string;
  category: PermissionCategory;
  created_at?: string;
}

export interface TeamPermission {
  id?: number;
  team_id: number;
  permission_id: number;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_comment: boolean;
  created_at?: string;
  updated_at?: string;
  // Populated fields for display
  module_name?: string;
  display_name?: string;
  category?: PermissionCategory;
}

export interface UserPermissions {
  [moduleName: string]: {
    can_read: boolean;
    can_write: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_comment: boolean;
  };
}

export interface TeamWithMembers extends Team {
  member_count?: number;
  members?: TeamMember[];
}

export interface TeamWithPermissions extends Team {
  permissions?: TeamPermission[];
}