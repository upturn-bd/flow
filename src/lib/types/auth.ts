/**
 * Authentication-related type definitions
 */

// User authentication types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  company_id?: number;
  employee_id?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  avatar_url?: string;
  phone_number?: string;
  timezone?: string;
  language?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  in_app: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  types: NotificationType[];
}

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  widgets: string[];
  default_filters: Record<string, any>;
  auto_refresh: boolean;
  refresh_interval: number;
}

export interface AccessibilityPreferences {
  high_contrast: boolean;
  large_text: boolean;
  reduced_motion: boolean;
  screen_reader: boolean;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'project_updated'
  | 'leave_request'
  | 'requisition_approved'
  | 'complaint_resolved'
  | 'system_maintenance';

// User roles and permissions
export type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'Employee';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  scope: 'global' | 'company' | 'department' | 'own';
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  restrictions?: PermissionRestriction[];
}

export interface PermissionRestriction {
  resource: string;
  condition: string;
  value: any;
}

// Authentication state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  session: AuthSession | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: 'Bearer';
  user: User;
}

// Authentication actions
export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  company_code?: string;
  company_name?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface EmailVerificationData {
  token: string;
}

// OAuth types
export interface OAuthProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
}

export interface OAuthData {
  provider: string;
  code: string;
  state?: string;
  redirect_uri: string;
}

// Two-factor authentication
export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface TwoFactorVerification {
  code: string;
  backup_code?: string;
}

export interface TwoFactorSettings {
  is_enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  phone_number?: string;
  last_used?: string;
  backup_codes_count: number;
}

// Session management
export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  is_current: boolean;
  last_activity: string;
  created_at: string;
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  push_token?: string;
  is_trusted: boolean;
  last_used: string;
}

// Authentication errors
export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export type AuthErrorCode = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'user_disabled'
  | 'company_not_found'
  | 'company_disabled'
  | 'email_not_verified'
  | 'password_expired'
  | 'account_locked'
  | 'token_expired'
  | 'token_invalid'
  | 'session_expired'
  | 'insufficient_permissions'
  | 'rate_limit_exceeded'
  | 'network_error'
  | 'server_error';

// Company authentication
export interface CompanyValidation {
  company_name: string;
  company_code: string;
}

export interface CompanyValidationResult {
  isValid: boolean;
  company_id: number | null;
  company_name?: string;
  error?: string;
}

// Authentication hooks
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

export interface UsePermissionsReturn {
  permissions: Permission[];
  hasPermission: (resource: string, action: string, scope?: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canAccess: (path: string) => boolean;
  isLoading: boolean;
}

export interface UseCompanyReturn {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  validateCompany: (data: CompanyValidation) => Promise<CompanyValidationResult>;
  switchCompany: (companyId: number) => Promise<void>;
  clearError: () => void;
}

// Company types (minimal for auth context)
export interface Company {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  plan: 'trial' | 'basic' | 'premium' | 'enterprise';
  settings: CompanySettings;
}

export interface CompanySettings {
  timezone: string;
  language: string;
  currency: string;
  date_format: string;
  time_format: '12' | '24';
  features: CompanyFeatures;
  security: SecuritySettings;
}

export interface CompanyFeatures {
  attendance: boolean;
  leave_management: boolean;
  project_management: boolean;
  requisition: boolean;
  complaints: boolean;
  settlement: boolean;
  reports: boolean;
  integrations: boolean;
}

export interface SecuritySettings {
  password_policy: PasswordPolicy;
  session_timeout: number;
  max_concurrent_sessions: number;
  require_2fa: boolean;
  allowed_ip_ranges?: string[];
  login_attempts_limit: number;
  account_lockout_duration: number;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  expire_days: number;
  history_count: number;
}
