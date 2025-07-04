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
} as const;

// Type definitions for status values
export type GeneralStatus = typeof STATUS.PENDING | typeof STATUS.APPROVED | typeof STATUS.REJECTED | typeof STATUS.ACTIVE | typeof STATUS.INACTIVE;
export type ProjectStatus = typeof STATUS.ONGOING | typeof STATUS.COMPLETED | typeof STATUS.ON_HOLD | typeof STATUS.CANCELLED;
export type TaskStatus = typeof STATUS.TODO | typeof STATUS.IN_PROGRESS | typeof STATUS.UNDER_REVIEW | typeof STATUS.DONE;
export type AttendanceStatus = typeof STATUS.PRESENT | typeof STATUS.ABSENT | typeof STATUS.LATE | typeof STATUS.HALF_DAY;
export type LeaveStatus = typeof STATUS.LEAVE_APPLIED | typeof STATUS.LEAVE_APPROVED | typeof STATUS.LEAVE_REJECTED | typeof STATUS.LEAVE_CANCELLED;
export type ComplaintStatus = typeof STATUS.SUBMITTED | typeof STATUS.INVESTIGATING | typeof STATUS.RESOLVED | typeof STATUS.CLOSED;
export type SettlementStatus = typeof STATUS.REQUESTED | typeof STATUS.PROCESSING | typeof STATUS.PROCESSED | typeof STATUS.PAID;

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
} as const;
