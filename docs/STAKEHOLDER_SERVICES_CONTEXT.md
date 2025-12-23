# Stakeholder Services System - Implementation Context

## Overview

This document tracks the implementation of a new **Stakeholder Services** system that separates billing from stakeholder processes. The system allows companies to manage services with their permanent stakeholders - either services the company provides TO stakeholders or services the company receives FROM stakeholders.

## Core Concepts

### 1. Stakeholder Service
A service relationship between the company and a permanent stakeholder. Each stakeholder can have multiple services.

**Service Direction:**
- **Outgoing Service (Company → Stakeholder)**: Company provides service, generates invoices to bill the stakeholder
- **Incoming Service (Stakeholder → Company)**: Stakeholder provides service, auto-generates payment records/bills in the accounts system

**Service Type:**
- **Recurring**: Ongoing service with billing cycles (monthly, weekly, yearly, or every X days)
- **One-off**: Single transaction (product sale, one-time service)

### 2. Billing Cycles
For recurring services, billing can occur:
- **Fixed Date of Month**: e.g., Bill on the 15th of every month
- **Fixed Day of Week**: e.g., Bill every Monday
- **Fixed Day of Year**: e.g., Bill on January 1st yearly
- **Every X Days**: e.g., Bill every 30 days

### 3. Pro-rata Billing
When a service is edited mid-billing-period:
- Old service details apply for days it was active
- New service details apply for remaining days
- Final bill = (old_amount × old_days/total_days) + (new_amount × new_days/total_days)

### 4. Service History
Track all changes to a service for audit and pro-rata calculations:
- Service amount changes
- Description/details changes
- Status changes
- All changes timestamped with user

---

## Database Schema Design

### Tables to Create

#### 1. `stakeholder_service_templates`
Reusable service templates:
- `id` (PK)
- `company_id` (FK)
- `name`
- `description`
- `direction` ('outgoing' | 'incoming')
- `default_amount`
- `currency`
- `default_billing_cycle`
- `default_line_items` (JSONB)
- `tax_rate` (optional)
- `is_active`
- Audit fields

#### 2. `stakeholder_services`
Main services table:
- `id` (PK)
- `company_id` (FK)
- `stakeholder_id` (FK) - Must be permanent stakeholder
- `template_id` (FK, nullable) - Reference to template used
- `service_name`
- `description`
- `direction` ('outgoing' | 'incoming')
- `service_type` ('recurring' | 'one_off')
- `currency`
- `tax_rate` (optional, decimal)
- `status` ('active' | 'paused' | 'cancelled' | 'completed')
- `start_date`
- `end_date` (nullable for indefinite)
- Billing cycle config (for recurring):
  - `billing_cycle_type` ('monthly' | 'weekly' | 'yearly' | 'x_days')
  - `billing_day_of_month` (1-28 for monthly)
  - `billing_day_of_week` (1-7 for weekly)
  - `billing_month_of_year` (1-12 for yearly)
  - `billing_interval_days` (for x_days type)
- `last_billed_date`
- `next_billing_date`
- For incoming services:
  - `payment_account_category` (preset category)
  - `auto_create_payment` (boolean)
- Audit fields

#### 3. `stakeholder_service_line_items`
Line items for each service (current):
- `id` (PK)
- `service_id` (FK)
- `item_order`
- `description`
- `quantity`
- `unit_price`
- `amount` (computed: quantity × unit_price)
- Audit fields

#### 4. `stakeholder_service_history`
Track changes for pro-rata billing:
- `id` (PK)
- `service_id` (FK)
- `change_type` ('created' | 'updated' | 'status_changed' | 'line_item_changed')
- `field_changed`
- `old_value` (JSONB)
- `new_value` (JSONB)
- `effective_from`
- `effective_to`
- `changed_by`
- `changed_at`

#### 5. `stakeholder_service_invoices`
Invoices for outgoing services:
- `id` (PK)
- `service_id` (FK)
- `company_id` (FK)
- `stakeholder_id` (FK)
- `invoice_number` (format: PREFIX-YYYY-MM-DD-SEQ)
- `billing_period_start`
- `billing_period_end`
- `subtotal`
- `tax_rate`
- `tax_amount`
- `total_amount`
- `pro_rata_details` (JSONB for breakdown when mid-period changes)
- `status` ('draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void')
- `due_date`
- `paid_date`
- `paid_amount`
- `notes`
- `pdf_url` (storage URL)
- Audit fields

#### 6. `stakeholder_invoice_line_items`
Line items snapshot for each invoice:
- `id` (PK)
- `invoice_id` (FK)
- `item_order`
- `description`
- `quantity`
- `unit_price`
- `amount`
- `pro_rata_days` (if applicable)
- `pro_rata_total_days` (if applicable)

#### 7. `stakeholder_service_payments`
Payment records for incoming services:
- `id` (PK)
- `service_id` (FK)
- `company_id` (FK)
- `stakeholder_id` (FK)
- `account_id` (FK to accounts, created by edge function)
- `billing_period_start`
- `billing_period_end`
- `amount`
- `pro_rata_details` (JSONB)
- `status` ('pending' | 'paid' | 'cancelled')
- `payment_date`
- `reference_number`
- Audit fields

#### 8. `company_invoice_settings`
Company-wide invoice configuration:
- `id` (PK)
- `company_id` (FK, unique)
- `invoice_prefix` (e.g., 'ABC')
- `next_invoice_seq` (auto-increment per day reset)
- `default_payment_terms_days`
- `default_currency`
- `company_address`
- `company_logo_url`
- `invoice_footer_text`
- Audit fields

---

## UI Components to Create

### Admin Section (`/admin/stakeholders/services/`)
1. **Services List Page** - View all services across stakeholders
2. **Service Detail Page** - View/manage individual service
3. **Service Form** - Create/edit service
4. **Invoice Generation** - Manual invoice generation with preview
5. **Billing Configuration** - Company-wide billing settings

### Stakeholder Detail Enhancement
- Add "Services" tab in stakeholder detail view
- Quick service creation from stakeholder page
- Service summary cards

### Reports/Dashboard
- Outstanding invoices
- Upcoming billing cycles
- Service revenue summary

---

## Integration Points

### 1. Accounts System
- Auto-generate account entries for incoming service payments
- Link invoices to accounts for outgoing services
- Payment reconciliation

### 2. Notification System
- Invoice generated notification
- Payment due reminder
- Payment received confirmation
- Service status change alerts

### 3. Email System (Resend)
- Invoice email with PDF attachment
- Payment reminder emails
- Service confirmation emails

### 4. Sentry Error Tracking
- Wrap all service operations
- Track billing cycle failures
- Monitor auto-generation jobs

---

## Design Decisions (Confirmed)

### Service Configuration
1. **Tax rates**: Yes, optional tax rate configuration (VAT, GST, etc.) - UI tucked away by default
2. **Service templates**: Yes, service catalog/template system for common services
3. **Line items**: Yes, support multiple line items per service

### Billing Logic
4. **Pro-rata calculation**: Bill for 30 days standard, but use day of month (1-28) for billing dates
5. **Invoice generation**: Manual trigger only (button click)
6. **End date handling**: No auto-generation; invoices generated on demand via button

### Incoming Services (Company receives from Stakeholder)
7. **Account categories**: Preset category for service payments, stored with stakeholder data
8. **Payment records**: Created as "pending" on invoice generation. Auto-added to accounts via Supabase Edge Function

### Permissions
9. **Access control**: Use existing `stakeholders` permissions module
10. **Stakeholder portal**: Yes, self-service access to view invoices/services

### Notifications & Email
11. **Email templates needed**:
    - Service Activated
    - Service Paused
    - Service Cancelled
    - Invoice Generated
12. **Reminders**: None needed for now

### Technical
13. **PDF invoices**: Yes, PDF generation with email attachment
14. **Invoice numbering**: Company-specific prefix, human readable format: `{PREFIX}-{YYYY}-{MM}-{DD}-{SEQ}`
    - Example: `ABC-2026-12-21-001`

---

## Implementation Phases

### Phase 1: Database & Core Logic ✅ COMPLETE
- [x] Create SQL schema (`sql/stakeholder_services_system.sql`)
- [x] Create TypeScript types (`src/lib/types/stakeholder-services.ts`)
- [x] Create Supabase hooks:
  - [x] `useStakeholderServices` - Service CRUD, line items, history
  - [x] `useServiceInvoices` - Invoice generation, payments, status
  - [x] `useServicePayments` - Payment records for incoming services
  - [x] `useServiceTemplates` - Templates and invoice settings
- [x] Implement pro-rata calculation logic (`src/lib/utils/pro-rata-calculation.ts`)

### Phase 2: Service Management UI ✅ COMPLETE
- [x] Service list page (`StakeholderServicesList`)
- [x] Service creation/edit form (`ServiceFormModal`)
- [x] Service detail view (`ServiceDetailModal`)
- [x] Service line items editor (`ServiceLineItemsEditor`)
- [x] Service templates management (`/admin/stakeholder-services/templates`)
- [x] Integration with stakeholder detail page

### Phase 3: Invoice System (Outgoing) ✅ COMPLETE
- [x] Invoice generation logic (`useServiceInvoices`)
- [x] Invoice list/detail UI (`InvoicesList`, `InvoiceDetailModal`)
- [x] Manual invoice creation with preview (`InvoiceGenerationForm`)
- [x] Invoice status management
- [x] Record payment modal (`RecordPaymentModal`)
- [ ] PDF generation (future)

### Phase 4: Payment System (Incoming) ✅ COMPLETE
- [x] Payment record generation (`useServicePayments`)
- [x] Edge function for auto-creating payments (`supabase/functions/auto-create-stakeholder-payments`)
- [x] Payment tracking UI (`PaymentRecordsList`, `PaymentFormModal`, `PaymentDetailModal`)

### Phase 5: Notifications & Email (Partial)
- [x] Invoice email template (`src/lib/email/invoice-email.ts`)
- [ ] Notification triggers
- [x] Sentry error tracking (integrated in hooks)

### Phase 6: Self-Service Portal ✅ COMPLETE
- [x] Public stakeholder services view (`PublicStakeholderServices`)
- [x] Public invoice view (`PublicStakeholderInvoices`)

### Admin Pages ✅ COMPLETE
- [x] All invoices page (`/admin/stakeholders/invoices`)
- [x] All payments page (`/admin/stakeholders/payments`)

---

## Files to Create/Modify

### New Files
```
sql/stakeholder_services_system.sql
src/lib/types/stakeholder-services.ts
src/hooks/useStakeholderServices.tsx
src/hooks/useServiceInvoices.tsx
src/hooks/useServicePayments.tsx
src/hooks/useServiceTemplates.tsx
src/lib/utils/pro-rata-calculation.ts
src/lib/utils/invoice-number-generator.ts
src/lib/email/service-email.ts
src/components/stakeholders/services/ServiceCard.tsx
src/components/stakeholders/services/ServiceForm.tsx
src/components/stakeholders/services/ServiceLineItemsEditor.tsx
src/components/stakeholders/services/ServiceTemplateSelector.tsx
src/components/stakeholders/services/InvoiceList.tsx
src/components/stakeholders/services/InvoiceForm.tsx
src/components/stakeholders/services/InvoicePreview.tsx
src/components/stakeholders/services/PaymentList.tsx
src/app/(home)/admin/stakeholders/[id]/services/page.tsx
src/app/(home)/admin/stakeholders/[id]/services/new/page.tsx
src/app/(home)/admin/stakeholders/[id]/services/[serviceId]/page.tsx
src/app/(home)/admin/stakeholders/[id]/services/[serviceId]/edit/page.tsx
src/app/(home)/admin/stakeholders/[id]/services/[serviceId]/invoices/page.tsx
src/app/(home)/admin/stakeholders/[id]/services/[serviceId]/invoices/new/page.tsx
src/app/(home)/admin/stakeholder-services/page.tsx (overview of all services)
src/app/(home)/admin/stakeholder-services/templates/page.tsx
src/app/(home)/admin/stakeholder-services/templates/new/page.tsx
src/app/(home)/admin/stakeholder-services/settings/page.tsx (invoice settings)
src/app/public-stakeholders/[company]/[stakeholder]/services/page.tsx (self-service portal)
supabase/functions/auto-create-service-payment/index.ts (edge function)
```

### Files to Modify
```
src/lib/types/schemas.ts (add service types)
src/app/(home)/admin/stakeholders/[id]/page.tsx (add services tab)
src/app/(home)/ops/stakeholders/[id]/page.tsx (add services tab)
```

---

## Notes

- Old `stakeholder_billing_system.sql` has been deleted (was never used)
- Old `useStakeholderBilling` hook has been deleted
- Old `stakeholder-billing` components directory has been deleted
- Old billing types removed from `schemas.ts`
- Follow existing patterns from stakeholder processes for consistency
- Use existing UI components where possible
- All monetary amounts support multiple currencies
- Use `stakeholders` permission module for access control
- PDF generation for invoices is planned for future
- Edge function for auto-creating incoming service payments is complete

---

## Pro-rata Calculation Logic

### Standard Billing Period
- Always use 30 days as the billing period standard
- Billing dates use day of month (1-28 to avoid month-end issues)

### Mid-Period Changes Example
If a service changes from $300/month to $450/month on day 10 of a 30-day period:
- Old rate: $300 × (10/30) = $100
- New rate: $450 × (20/30) = $300
- Total invoice: $400

### Change Tracking
All changes are logged in `stakeholder_service_history` with:
- Effective from/to timestamps
- Old and new values as JSONB
- Changed by user reference

---

## Invoice Number Format

Format: `{PREFIX}-{YYYY}-{MM}-{DD}-{SEQ}`

Example: `ABC-2026-12-21-001`

- PREFIX: Company-specific, configurable in invoice settings
- YYYY-MM-DD: Invoice generation date
- SEQ: Sequential number, resets daily, zero-padded to 3 digits

---

*Last Updated: December 22, 2025*
*Status: Design Confirmed - Ready for Implementation*
