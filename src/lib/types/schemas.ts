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
  department_id?: number;
  goal?: string;
  progress?: number | null;
  status: string;
  company_id?: number;
  assignees?: string[];
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
  priority: string;
  project_id?: number;
  milestone_id?: number;
  assignees: string[];
  department_id?: number;
  status?: boolean;
  company_id?: number;
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
  department_id?: number;
}

export interface Notice {
  id?: number;
  notice_type_id: number | null;
  title: string;
  description: string;
  urgency: string;
  valid_from: string;
  valid_till: string;
  company_id?: number;
  department_id?: number;
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
}