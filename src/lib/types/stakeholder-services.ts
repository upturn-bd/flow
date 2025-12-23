/**
 * Stakeholder Services System Type Definitions
 * 
 * This module defines types for the stakeholder services system including:
 * - Service templates
 * - Services (recurring/one-off, outgoing/incoming)
 * - Line items
 * - Invoices (for outgoing services)
 * - Payments (for incoming services)
 * - Service history (for pro-rata calculations)
 */

import { ContactPerson } from './schemas';

// ==============================================================================
// ENUMS & CONSTANTS
// ==============================================================================

/**
 * Direction of service
 * - outgoing: Company provides service TO stakeholder (generates invoices)
 * - incoming: Company receives service FROM stakeholder (auto-creates payments)
 */
export type ServiceDirection = 'outgoing' | 'incoming';

/**
 * Type of service
 * - recurring: Periodic billing based on cycle configuration
 * - one_off: Single transaction (product sale, one-time service)
 */
export type ServiceType = 'recurring' | 'one_off';

/**
 * Service status
 */
export type ServiceStatus = 'active' | 'paused' | 'cancelled' | 'completed';

/**
 * Billing cycle type for recurring services
 * - monthly: Bill on specific day of month (1-28)
 * - weekly: Bill on specific day of week (1=Monday, 7=Sunday)
 * - yearly: Bill on specific day and month each year
 * - x_days: Bill every X days
 */
export type BillingCycleType = 'monthly' | 'weekly' | 'yearly' | 'x_days';

/**
 * Invoice status
 */
export type ServiceInvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'paid' 
  | 'partially_paid' 
  | 'overdue' 
  | 'cancelled' 
  | 'void';

/**
 * Payment status (for incoming services)
 */
export type ServicePaymentStatus = 'pending' | 'paid' | 'cancelled';

/**
 * Service history change types
 */
export type ServiceChangeType = 
  | 'created' 
  | 'updated' 
  | 'status_changed' 
  | 'line_items_changed';

// ==============================================================================
// COMPANY INVOICE SETTINGS
// ==============================================================================

/**
 * Company-wide invoice configuration
 */
export interface CompanyInvoiceSettings {
  id?: number;
  company_id: number;
  invoice_prefix: string;
  default_payment_terms_days: number;
  default_currency: string;
  default_tax_rate: number;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_logo_url?: string;
  invoice_footer_text?: string;
  payment_instructions?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// ==============================================================================
// SERVICE TEMPLATES
// ==============================================================================

/**
 * Default line item for templates
 */
export interface TemplateLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

/**
 * Reusable service template
 */
export interface StakeholderServiceTemplate {
  id?: number;
  company_id: number;
  name: string;
  description?: string;
  direction: ServiceDirection;
  default_currency: string;
  default_tax_rate: number;
  default_billing_cycle_type?: BillingCycleType;
  default_billing_day_of_month?: number; // 1-28
  default_billing_day_of_week?: number; // 1-7
  default_billing_month_of_year?: number; // 1-12
  default_billing_interval_days?: number;
  default_line_items: TemplateLineItem[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// ==============================================================================
// SERVICES
// ==============================================================================

/**
 * Main stakeholder service
 */
export interface StakeholderService {
  id?: number;
  company_id: number;
  stakeholder_id: number;
  template_id?: number;
  service_name: string;
  description?: string;
  direction: ServiceDirection;
  service_type: ServiceType;
  currency: string;
  tax_rate: number;
  status: ServiceStatus;
  start_date: string; // ISO date
  end_date?: string; // ISO date, null for indefinite
  // Billing cycle (for recurring services)
  billing_cycle_type?: BillingCycleType;
  billing_day_of_month?: number; // 1-28
  billing_day_of_week?: number; // 1-7
  billing_month_of_year?: number; // 1-12
  billing_interval_days?: number;
  // Billing tracking
  last_billed_date?: string; // ISO date
  next_billing_date?: string; // ISO date
  // For incoming services
  payment_account_category?: string;
  auto_create_payment: boolean;
  // Audit
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Joined data
  stakeholder?: {
    id: number;
    name: string;
    address?: string;
    contact_persons?: ContactPerson[];
    status?: string;
  };
  template?: StakeholderServiceTemplate;
  line_items?: StakeholderServiceLineItem[];
  // Computed fields
  total_amount?: number; // Sum of line items
}

/**
 * Service line item
 */
export interface StakeholderServiceLineItem {
  id?: number;
  service_id: number;
  item_order: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number; // Computed: quantity * unit_price
  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// SERVICE HISTORY (For Pro-rata Calculations)
// ==============================================================================

/**
 * Service change history entry
 */
export interface StakeholderServiceHistory {
  id?: number;
  service_id: number;
  change_type: ServiceChangeType;
  field_changed?: string;
  old_value?: any; // JSONB
  new_value?: any; // JSONB
  effective_from: string; // ISO timestamp
  effective_to?: string; // ISO timestamp, null if currently active
  changed_by?: string;
  changed_at: string;
}

/**
 * History period with days active for pro-rata calculation
 */
export interface ServiceHistoryPeriod {
  history_id: number;
  change_type: ServiceChangeType;
  old_value: any;
  new_value: any;
  effective_from: string;
  effective_to?: string;
  days_active: number;
}

// ==============================================================================
// INVOICES (Outgoing Services)
// ==============================================================================

/**
 * Customer snapshot for invoice (stored for historical accuracy)
 */
export interface InvoiceCustomerSnapshot {
  name: string;
  address?: string;
  contact_persons?: ContactPerson[];
}

/**
 * Pro-rata period detail
 */
export interface ProRataPeriod {
  start: string; // ISO date
  end: string; // ISO date
  days: number;
  amount: number;
  line_items: Array<{
    description: string;
    original_amount: number;
    pro_rata_amount: number;
  }>;
}

/**
 * Pro-rata details for invoices with mid-period changes
 */
export interface ProRataDetails {
  periods: ProRataPeriod[];
  total_days: number;
  has_changes: boolean;
}

/**
 * Service invoice (for outgoing services)
 */
export interface StakeholderServiceInvoice {
  id?: number;
  service_id: number;
  company_id: number;
  stakeholder_id: number;
  invoice_number: string; // Format: PREFIX-YYYY-MM-DD-SEQ
  billing_period_start: string; // ISO date
  billing_period_end: string; // ISO date
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  pro_rata_details?: ProRataDetails;
  invoice_date: string; // ISO date
  due_date?: string; // ISO date
  status: ServiceInvoiceStatus;
  paid_amount: number;
  paid_date?: string; // ISO date
  payment_reference?: string;
  notes?: string;
  internal_notes?: string;
  pdf_url?: string;
  customer_snapshot?: InvoiceCustomerSnapshot;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  sent_at?: string;
  sent_by?: string;
  // Joined data
  service?: StakeholderService;
  stakeholder?: {
    id: number;
    name: string;
    address?: string;
    contact_persons?: ContactPerson[];
  };
  line_items?: StakeholderInvoiceLineItem[];
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
  sender?: {
    id: string;
    name: string;
    email?: string;
  };
}

/**
 * Invoice line item (snapshot at time of invoice)
 */
export interface StakeholderInvoiceLineItem {
  id?: number;
  invoice_id: number;
  item_order: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  pro_rata_days?: number;
  pro_rata_total_days?: number; // Always 30
  original_amount?: number; // Amount before pro-rata
  created_at?: string;
}

// ==============================================================================
// PAYMENTS (Incoming Services)
// ==============================================================================

/**
 * Vendor snapshot for payment (stored for historical accuracy)
 */
export interface PaymentVendorSnapshot {
  name: string;
  address?: string;
  contact_persons?: ContactPerson[];
}

/**
 * Service payment record (for incoming services)
 */
export interface StakeholderServicePayment {
  id?: number;
  service_id: number;
  company_id: number;
  stakeholder_id: number;
  account_id?: number; // Link to accounts table (created by edge function)
  billing_period_start: string; // ISO date
  billing_period_end: string; // ISO date
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  pro_rata_details?: ProRataDetails;
  status: ServicePaymentStatus;
  payment_date?: string; // ISO date
  reference_number?: string;
  notes?: string;
  vendor_snapshot?: PaymentVendorSnapshot;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Joined data
  service?: StakeholderService;
  stakeholder?: {
    id: number;
    name: string;
    address?: string;
    contact_persons?: ContactPerson[];
  };
  account?: {
    id: number;
    title: string;
    status: string;
  };
  line_items?: StakeholderPaymentLineItem[];
}

/**
 * Payment line item (snapshot at time of payment)
 */
export interface StakeholderPaymentLineItem {
  id?: number;
  payment_id: number;
  item_order: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  pro_rata_days?: number;
  pro_rata_total_days?: number;
  original_amount?: number;
  created_at?: string;
}

// ==============================================================================
// INVOICE SEQUENCES
// ==============================================================================

/**
 * Daily invoice sequence tracking
 */
export interface CompanyInvoiceSequence {
  id?: number;
  company_id: number;
  sequence_date: string; // ISO date
  last_sequence: number;
}

// ==============================================================================
// FORM DATA INTERFACES
// ==============================================================================

/**
 * Form data for creating/editing company invoice settings
 */
export interface CompanyInvoiceSettingsFormData {
  invoice_prefix: string;
  default_payment_terms_days: number;
  default_currency: string;
  default_tax_rate: number;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_logo_url?: string;
  invoice_footer_text?: string;
  payment_instructions?: string;
}

/**
 * Form data for creating/editing service templates
 */
export interface ServiceTemplateFormData {
  name: string;
  description?: string;
  direction: ServiceDirection;
  default_currency: string;
  default_tax_rate: number;
  default_billing_cycle_type?: BillingCycleType;
  default_billing_day_of_month?: number;
  default_billing_day_of_week?: number;
  default_billing_month_of_year?: number;
  default_billing_interval_days?: number;
  default_line_items: TemplateLineItem[];
  is_active: boolean;
}

/**
 * Form data for creating/editing services
 */
export interface ServiceFormData {
  stakeholder_id: number;
  template_id?: number;
  service_name: string;
  description?: string;
  direction: ServiceDirection;
  service_type: ServiceType;
  currency: string;
  tax_rate: number;
  start_date: string;
  end_date?: string;
  // Billing cycle (for recurring)
  billing_cycle_type?: BillingCycleType;
  billing_day_of_month?: number;
  billing_day_of_week?: number;
  billing_month_of_year?: number;
  billing_interval_days?: number;
  // For incoming services
  payment_account_category?: string;
  auto_create_payment?: boolean;
  // Line items
  line_items: ServiceLineItemFormData[];
}

/**
 * Form data for service line items
 */
export interface ServiceLineItemFormData {
  id?: number; // For existing items
  description: string;
  quantity: number;
  unit_price: number;
}

/**
 * Form data for creating invoices
 */
export interface InvoiceFormData {
  service_id: number;
  billing_period_start: string;
  billing_period_end: string;
  due_date?: string;
  notes?: string;
  internal_notes?: string;
  // Allow manual line item overrides
  line_items?: ServiceLineItemFormData[];
}

/**
 * Form data for creating payment records
 */
export interface PaymentFormData {
  service_id: number;
  billing_period_start: string;
  billing_period_end: string;
  reference_number?: string;
  notes?: string;
}

// ==============================================================================
// SEARCH & FILTER INTERFACES
// ==============================================================================

/**
 * Service search options
 */
export interface ServiceSearchOptions {
  stakeholder_id?: number;
  direction?: ServiceDirection;
  service_type?: ServiceType;
  status?: ServiceStatus;
  search_query?: string;
  page?: number;
  page_size?: number;
}

/**
 * Service search result
 */
export interface ServiceSearchResult {
  services: StakeholderService[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

/**
 * Invoice search options
 */
export interface InvoiceSearchOptions {
  service_id?: number;
  stakeholder_id?: number;
  status?: ServiceInvoiceStatus;
  from_date?: string;
  to_date?: string;
  search_query?: string;
  page?: number;
  page_size?: number;
}

/**
 * Invoice search result
 */
export interface InvoiceSearchResult {
  invoices: StakeholderServiceInvoice[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

/**
 * Payment search options
 */
export interface PaymentSearchOptions {
  service_id?: number;
  stakeholder_id?: number;
  status?: ServicePaymentStatus;
  from_date?: string;
  to_date?: string;
  search_query?: string;
  page?: number;
  page_size?: number;
}

/**
 * Payment search result
 */
export interface PaymentSearchResult {
  payments: StakeholderServicePayment[];
  total_count: number;
  total_pages: number;
  current_page: number;
}

// ==============================================================================
// SUMMARY INTERFACES
// ==============================================================================

/**
 * Service summary statistics
 */
export interface ServiceSummary {
  total_services: number;
  active_services: number;
  outgoing_services: number;
  incoming_services: number;
  total_monthly_revenue: number; // For outgoing
  total_monthly_expense: number; // For incoming
}

/**
 * Invoice summary for a stakeholder or service
 */
export interface ServiceInvoiceSummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  overdue_count: number;
}

/**
 * Payment summary for a stakeholder or service
 */
export interface ServicePaymentSummary {
  total_payments: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

// ==============================================================================
// PRESET CATEGORIES FOR INCOMING SERVICES
// ==============================================================================

/**
 * Preset payment account categories for incoming services
 */
export const PAYMENT_ACCOUNT_CATEGORIES = [
  'Professional Services',
  'Software & Subscriptions',
  'Office Supplies',
  'Equipment & Hardware',
  'Maintenance & Repairs',
  'Consulting',
  'Marketing & Advertising',
  'Utilities',
  'Rent & Lease',
  'Insurance',
  'Transportation',
  'Training & Development',
  'Legal Services',
  'Accounting Services',
  'Other',
] as const;

export type PaymentAccountCategory = typeof PAYMENT_ACCOUNT_CATEGORIES[number];

// ==============================================================================
// BILLING CYCLE HELPERS
// ==============================================================================

/**
 * Days of week for weekly billing
 */
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const;

/**
 * Months of year for yearly billing
 */
export const MONTHS_OF_YEAR = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

/**
 * Days of month for monthly/yearly billing (1-28 to avoid end-of-month issues)
 */
export const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
