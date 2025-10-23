/**
 * Application Constants
 * Central repository for all application constants and configuration values
 */

// ==============================================================================
// Status Constants
// ==============================================================================

export const STATUS = {
  // General Status
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  
  // Project Status
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  
  // Task Status
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  UNDER_REVIEW: 'Under Review',
  DONE: 'Done',
  
  // Attendance Status
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  
  // Leave Status
  LEAVE_APPLIED: 'Applied',
  LEAVE_APPROVED: 'Approved',
  LEAVE_REJECTED: 'Rejected',
  LEAVE_CANCELLED: 'Cancelled',
  
  // Complaint Status
  SUBMITTED: 'Submitted',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  
  // Settlement Status
  REQUESTED: 'Requested',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  PAID: 'Paid',
  
  // Account Status
  COMPLETE: 'Complete',
} as const;

// Type definitions for status values
export type GeneralStatus = typeof STATUS.PENDING | typeof STATUS.APPROVED | typeof STATUS.REJECTED | typeof STATUS.ACTIVE | typeof STATUS.INACTIVE;
export type ProjectStatus = typeof STATUS.ONGOING | typeof STATUS.COMPLETED | typeof STATUS.ON_HOLD | typeof STATUS.CANCELLED;
export type TaskStatus = typeof STATUS.TODO | typeof STATUS.IN_PROGRESS | typeof STATUS.UNDER_REVIEW | typeof STATUS.DONE;
export type AttendanceStatus = typeof STATUS.PRESENT | typeof STATUS.ABSENT | typeof STATUS.LATE | typeof STATUS.HALF_DAY;
export type LeaveStatus = typeof STATUS.LEAVE_APPLIED | typeof STATUS.LEAVE_APPROVED | typeof STATUS.LEAVE_REJECTED | typeof STATUS.LEAVE_CANCELLED;
export type ComplaintStatus = typeof STATUS.SUBMITTED | typeof STATUS.INVESTIGATING | typeof STATUS.RESOLVED | typeof STATUS.CLOSED;
export type SettlementStatus = typeof STATUS.REQUESTED | typeof STATUS.PROCESSING | typeof STATUS.PROCESSED | typeof STATUS.PAID;
export type AccountStatus = typeof STATUS.COMPLETE | typeof STATUS.PENDING;

// ==============================================================================
// Priority Constants
// ==============================================================================

export const PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
  CRITICAL: 'Critical',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// ==============================================================================
// Urgency Constants
// ==============================================================================

export const URGENCY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;

export type Urgency = typeof URGENCY[keyof typeof URGENCY];

// ==============================================================================
// Job Status Constants
// ==============================================================================

export const JOB_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PROBATION: 'Probation',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

// ==============================================================================
// Education/Schooling Type Constants
// ==============================================================================

export const SCHOOLING_TYPES = {
  HIGH_SCHOOL: 'High School',
  COLLEGE: 'College',
  DIPLOMA: 'Diploma',
  BACHELORS: 'Bachelors',
  MASTERS: 'Masters',
  PGD: 'PGD',
  PHD: 'PhD',
  POST_DOC: 'Post-Doc',
} as const;

export type SchoolingType = typeof SCHOOLING_TYPES[keyof typeof SCHOOLING_TYPES];

// Array format for select options
export const SCHOOLING_TYPE_OPTIONS = Object.values(SCHOOLING_TYPES);

// ==============================================================================
// Route Constants
// ==============================================================================

export const ROUTES = {
  // Auth Routes
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    CHANGE_PASSWORD: '/change-pass',
    AUTH_BASE: '/auth',
  },
  
  // Employee Routes
  EMPLOYEE: {
    HOME: '/home',
    HRIS: '/hris',
    OPERATIONS: '/operations-and-services',
    NOTIFICATIONS: '/notifications',
    ACCOUNT: '/account',
    PROFILE: '/profile',
  },
  
  // Admin Routes
  ADMIN: {
    MANAGEMENT: '/admin-management',
    CONFIG: '/admin-management/config',
    DEPARTMENTS: '/admin-management/departments',
    DIVISIONS: '/admin-management/divisions',
    GRADES: '/admin-management/grades',
    POSITIONS: '/admin-management/positions',
    LEAVE: '/admin-management/leave',
    ATTENDANCE: '/admin-management/attendance',
    COMPLAINTS: '/admin-management/complaints',
    INVENTORY: '/admin-management/inventory',
    NEWS: '/admin-management/news-and-notice',
    SETTLEMENT: '/admin-management/settlement',
    SUPERVISOR: '/admin-management/supervisor-lineage',
  },
  
  // API Routes
  API: {
    BASE: '/api',
    AUTH: '/api/auth',
    EMPLOYEES: '/api/employees',
    DEPARTMENTS: '/api/departments',
    PROJECTS: '/api/projects',
  },
} as const;

// ==============================================================================
// Auth Route Arrays
// ==============================================================================

export const AUTH_ROUTES = [
  ROUTES.AUTH.SIGNUP,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.AUTH_BASE,
  ROUTES.AUTH.FORGOT_PASSWORD,
];

export const EXCLUDE_PATHS = [
  ...AUTH_ROUTES,
  '/unauthorized',
  '/test-notifications',
  ROUTES.API.BASE,
];

export const EMPLOYEE_ROUTES = [
  ROUTES.EMPLOYEE.HOME,
  ROUTES.EMPLOYEE.HRIS,
  ROUTES.EMPLOYEE.OPERATIONS,
  ROUTES.EMPLOYEE.NOTIFICATIONS,
  ROUTES.EMPLOYEE.ACCOUNT,
  ROUTES.EMPLOYEE.PROFILE,
];

// ==============================================================================
// User Roles
// ==============================================================================

export const USER_ROLES = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  HR: 'HR',
  SUPERVISOR: 'Supervisor',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ==============================================================================
// Gender Constants
// ==============================================================================

export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
} as const;

export type Gender = typeof GENDER[keyof typeof GENDER];

// ==============================================================================
// Marital Status Constants
// ==============================================================================

export const MARITAL_STATUS = {
  SINGLE: 'Single',
  MARRIED: 'Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  SEPARATED: 'Separated',
} as const;

export type MaritalStatus = typeof MARITAL_STATUS[keyof typeof MARITAL_STATUS];

// ==============================================================================
// Stakeholder Management Constants
// ==============================================================================

export const FIELD_TYPES = {
  TEXT: 'text',
  BOOLEAN: 'boolean',
  DATE: 'date',
  FILE: 'file',
} as const;

export type FieldType = typeof FIELD_TYPES[keyof typeof FIELD_TYPES];

export const FIELD_TYPE_OPTIONS = Object.values(FIELD_TYPES);

// ==============================================================================
// Blood Group Constants
// ==============================================================================

export const BLOOD_GROUP = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
} as const;

export type BloodGroup = typeof BLOOD_GROUP[keyof typeof BLOOD_GROUP];

// ==============================================================================
// File Upload Constants
// ==============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  get ALL_TYPES() {
    return [
      ...this.ALLOWED_TYPES.IMAGE,
      ...this.ALLOWED_TYPES.DOCUMENT,
      ...this.ALLOWED_TYPES.SPREADSHEET,
    ];
  },
} as const;

// ==============================================================================
// Pagination Constants
// ==============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ==============================================================================
// Time Constants
// ==============================================================================

export const TIME = {
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30, // Average
  DAYS_IN_YEAR: 365,
  
  // Cache durations (in seconds)
  CACHE: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 2 * 60 * 60, // 2 hours
    VERY_LONG: 24 * 60 * 60, // 24 hours
  },
} as const;

// ==============================================================================
// Validation Constants
// ==============================================================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_COMMENT_LENGTH: 500,
  
  // Regex patterns
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

// ==============================================================================
// UI Constants
// ==============================================================================

export const UI = {
  MODAL: {
    ANIMATION_DURATION: 200,
    MAX_WIDTH: '600px',
    MIN_WIDTH: '400px',
  },
  
  TOAST: {
    DURATION: 5000,
    MAX_VISIBLE: 3,
  },
  
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#64748B',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
  },
} as const;

// ==============================================================================
// Account System Constants
// ==============================================================================

export const PAYMENT_METHODS = [
  'Cash',
  'Bank',
  'Credit Card',
  'Mobile Banking',
  'Check',
  'Online Transfer',
] as const;

export const CURRENCIES = [
  'BDT', // Bangladesh Taka - Default
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'INR', // Indian Rupee
] as const;

export const ACCOUNT_CATEGORIES = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  PAYROLL: 'Payroll', 
  OFFICE_SUPPLIES: 'Office Supplies',
  UTILITIES: 'Utilities',
  TRAVEL: 'Travel',
  CLIENT_PAYMENT: 'Client Payment',
  VENDOR_PAYMENT: 'Vendor Payment',
  MISCELLANEOUS: 'Miscellaneous',
} as const;

// ==============================================================================
// Export Arrays for Select Options
// ==============================================================================

export const SELECT_OPTIONS = {
  STATUS: Object.values(STATUS),
  PRIORITY: Object.values(PRIORITY),
  URGENCY: Object.values(URGENCY),
  JOB_STATUS: Object.values(JOB_STATUS),
  USER_ROLES: Object.values(USER_ROLES),
  GENDER: Object.values(GENDER),
  MARITAL_STATUS: Object.values(MARITAL_STATUS),
  BLOOD_GROUP: Object.values(BLOOD_GROUP),
  SCHOOLING_TYPES: Object.values(SCHOOLING_TYPES),
  ACCOUNT_STATUS: [STATUS.COMPLETE, STATUS.PENDING],
  PAYMENT_METHODS: PAYMENT_METHODS,
  CURRENCIES: CURRENCIES,
} as const;


export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type Currency = typeof CURRENCIES[number];
export type AccountCategory = typeof ACCOUNT_CATEGORIES[keyof typeof ACCOUNT_CATEGORIES];

// ==============================================================================
// Team-Based Permissions Constants
// ==============================================================================

export const PERMISSION_ACTIONS = {
  READ: 'can_read',
  WRITE: 'can_write',
  DELETE: 'can_delete',
  APPROVE: 'can_approve',
  COMMENT: 'can_comment',
} as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];

export const PERMISSION_MODULES = {
  // Workflow
  TASKS: 'tasks',
  PROJECTS: 'projects',
  MILESTONES: 'milestones',
  
  // Services
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  NOTICE: 'notice',
  REQUISITION: 'requisition',
  SETTLEMENT: 'settlement',
  COMPLAINTS: 'complaints',
  PAYROLL: 'payroll',
  STAKEHOLDERS: 'stakeholders',
  STAKEHOLDER_PROCESSES: 'stakeholder_processes',
  
  // Operations
  ONBOARDING: 'onboarding',
  OFFBOARDING: 'offboarding',
  HRIS: 'hris',
  
  // Admin
  ADMIN_CONFIG: 'admin_config',
  DEPARTMENTS: 'departments',
  DIVISIONS: 'divisions',
  GRADES: 'grades',
  POSITIONS: 'positions',
  COMPANY_LOGS: 'company_logs',
  TEAMS: 'teams',
} as const;

export type PermissionModule = typeof PERMISSION_MODULES[keyof typeof PERMISSION_MODULES];

export const MODULE_CATEGORIES = {
  WORKFLOW: 'workflow',
  SERVICES: 'services',
  OPERATIONS: 'operations',
  ADMIN: 'admin',
} as const;

export type ModuleCategory = typeof MODULE_CATEGORIES[keyof typeof MODULE_CATEGORIES];

// Module display names
export const MODULE_DISPLAY_NAMES: Record<PermissionModule, string> = {
  [PERMISSION_MODULES.TASKS]: 'Tasks',
  [PERMISSION_MODULES.PROJECTS]: 'Projects',
  [PERMISSION_MODULES.MILESTONES]: 'Milestones',
  [PERMISSION_MODULES.ATTENDANCE]: 'Attendance',
  [PERMISSION_MODULES.LEAVE]: 'Leave',
  [PERMISSION_MODULES.NOTICE]: 'Notice',
  [PERMISSION_MODULES.REQUISITION]: 'Requisition',
  [PERMISSION_MODULES.SETTLEMENT]: 'Settlement',
  [PERMISSION_MODULES.COMPLAINTS]: 'Complaints',
  [PERMISSION_MODULES.PAYROLL]: 'Payroll',
  [PERMISSION_MODULES.STAKEHOLDERS]: 'Stakeholders & Leads',
  [PERMISSION_MODULES.STAKEHOLDER_PROCESSES]: 'Stakeholder Processes',
  [PERMISSION_MODULES.ONBOARDING]: 'Onboarding',
  [PERMISSION_MODULES.OFFBOARDING]: 'Offboarding',
  [PERMISSION_MODULES.HRIS]: 'HRIS',
  [PERMISSION_MODULES.ADMIN_CONFIG]: 'Admin Configuration',
  [PERMISSION_MODULES.DEPARTMENTS]: 'Departments',
  [PERMISSION_MODULES.DIVISIONS]: 'Divisions',
  [PERMISSION_MODULES.GRADES]: 'Grades',
  [PERMISSION_MODULES.POSITIONS]: 'Positions',
  [PERMISSION_MODULES.COMPANY_LOGS]: 'Company Logs',
  [PERMISSION_MODULES.TEAMS]: 'Team Management',
};

// Module information with categories
export interface ModuleInfo {
  name: PermissionModule;
  displayName: string;
  description?: string;
  category: 'workflow' | 'services' | 'operations' | 'admin';
}

export const MODULE_INFO: Record<PermissionModule, ModuleInfo> = {
  [PERMISSION_MODULES.TASKS]: {
    name: PERMISSION_MODULES.TASKS,
    displayName: 'Tasks',
    description: 'Create and manage tasks',
    category: 'workflow',
  },
  [PERMISSION_MODULES.PROJECTS]: {
    name: PERMISSION_MODULES.PROJECTS,
    displayName: 'Projects',
    description: 'Manage projects',
    category: 'workflow',
  },
  [PERMISSION_MODULES.MILESTONES]: {
    name: PERMISSION_MODULES.MILESTONES,
    displayName: 'Milestones',
    description: 'Track project milestones',
    category: 'workflow',
  },
  [PERMISSION_MODULES.ATTENDANCE]: {
    name: PERMISSION_MODULES.ATTENDANCE,
    displayName: 'Attendance',
    description: 'Track employee attendance',
    category: 'services',
  },
  [PERMISSION_MODULES.LEAVE]: {
    name: PERMISSION_MODULES.LEAVE,
    displayName: 'Leave',
    description: 'Manage leave requests',
    category: 'services',
  },
  [PERMISSION_MODULES.NOTICE]: {
    name: PERMISSION_MODULES.NOTICE,
    displayName: 'Notice',
    description: 'Create and manage notices',
    category: 'services',
  },
  [PERMISSION_MODULES.REQUISITION]: {
    name: PERMISSION_MODULES.REQUISITION,
    displayName: 'Requisition',
    description: 'Handle requisition requests',
    category: 'services',
  },
  [PERMISSION_MODULES.SETTLEMENT]: {
    name: PERMISSION_MODULES.SETTLEMENT,
    displayName: 'Settlement',
    description: 'Manage settlements',
    category: 'services',
  },
  [PERMISSION_MODULES.COMPLAINTS]: {
    name: PERMISSION_MODULES.COMPLAINTS,
    displayName: 'Complaints',
    description: 'Handle employee complaints',
    category: 'services',
  },
  [PERMISSION_MODULES.PAYROLL]: {
    name: PERMISSION_MODULES.PAYROLL,
    displayName: 'Payroll',
    description: 'View payroll information',
    category: 'services',
  },
  [PERMISSION_MODULES.STAKEHOLDERS]: {
    name: PERMISSION_MODULES.STAKEHOLDERS,
    displayName: 'Stakeholders & Leads',
    description: 'Manage stakeholders and leads',
    category: 'services',
  },
  [PERMISSION_MODULES.STAKEHOLDER_PROCESSES]: {
    name: PERMISSION_MODULES.STAKEHOLDER_PROCESSES,
    displayName: 'Stakeholder Processes',
    description: 'Manage stakeholder process definitions and steps',
    category: 'admin',
  },
  [PERMISSION_MODULES.ONBOARDING]: {
    name: PERMISSION_MODULES.ONBOARDING,
    displayName: 'Onboarding',
    description: 'Handle employee onboarding',
    category: 'operations',
  },
  [PERMISSION_MODULES.OFFBOARDING]: {
    name: PERMISSION_MODULES.OFFBOARDING,
    displayName: 'Offboarding',
    description: 'Manage employee offboarding',
    category: 'operations',
  },
  [PERMISSION_MODULES.HRIS]: {
    name: PERMISSION_MODULES.HRIS,
    displayName: 'HRIS',
    description: 'Access HRIS data',
    category: 'operations',
  },
  [PERMISSION_MODULES.ADMIN_CONFIG]: {
    name: PERMISSION_MODULES.ADMIN_CONFIG,
    displayName: 'Admin Configuration',
    description: 'Configure system settings',
    category: 'admin',
  },
  [PERMISSION_MODULES.DEPARTMENTS]: {
    name: PERMISSION_MODULES.DEPARTMENTS,
    displayName: 'Departments',
    description: 'Manage departments',
    category: 'admin',
  },
  [PERMISSION_MODULES.DIVISIONS]: {
    name: PERMISSION_MODULES.DIVISIONS,
    displayName: 'Divisions',
    description: 'Manage divisions',
    category: 'admin',
  },
  [PERMISSION_MODULES.GRADES]: {
    name: PERMISSION_MODULES.GRADES,
    displayName: 'Grades',
    description: 'Manage employee grades',
    category: 'admin',
  },
  [PERMISSION_MODULES.POSITIONS]: {
    name: PERMISSION_MODULES.POSITIONS,
    displayName: 'Positions',
    description: 'Manage positions',
    category: 'admin',
  },
  [PERMISSION_MODULES.COMPANY_LOGS]: {
    name: PERMISSION_MODULES.COMPANY_LOGS,
    displayName: 'Company Logs',
    description: 'View company activity logs',
    category: 'admin',
  },
  [PERMISSION_MODULES.TEAMS]: {
    name: PERMISSION_MODULES.TEAMS,
    displayName: 'Team Management',
    description: 'Manage teams and permissions',
    category: 'admin',
  },
};

// Default team names
export const DEFAULT_TEAMS = {
  ADMINISTRATORS: 'Administrators',
  MANAGERS: 'Managers',
  EMPLOYEES: 'Employees',
} as const;
