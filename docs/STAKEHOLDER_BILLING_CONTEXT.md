# Stakeholder Billing System - Context Document

## System Overview (IMPLEMENTED)

The stakeholder billing system handles both **incoming** and **outgoing** services between the company and stakeholders:

- **Outgoing Services**: Services the company provides TO stakeholders (generates invoices to stakeholders)
- **Incoming Services**: Services stakeholders provide TO the company (payment records to pay stakeholders)

---

## Database Tables

### Core Tables (all in `stakeholder_*` schema)

1. **stakeholder_services** - Service definitions
   - `direction`: 'incoming' | 'outgoing'
   - `service_type`: 'one_off' | 'recurring'
   - `billing_cycle_type`: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'x_days'
   - `status`: 'draft' | 'active' | 'paused' | 'cancelled' | 'completed'
   - Pro-rata settings: `enable_pro_rata`, `pro_rata_calculation`
   - Tax settings: `tax_rate`, `currency`

2. **stakeholder_service_line_items** - Line items for services
   - `description`, `quantity`, `unit_price`, `amount`
   - Optional pro-rata fields: `pro_rata_days`, `pro_rata_total_days`

3. **stakeholder_service_invoices** - Invoices for outgoing services
   - `invoice_number` (auto-generated)
   - `status`: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
   - `billing_period_start/end`
   - `stakeholder_snapshot` - Captures stakeholder info at invoice time
   - `paid_amount`, `total_amount` for partial payment tracking

4. **stakeholder_invoice_line_items** - Line items for invoices

5. **stakeholder_invoice_payments** - Payment records against invoices

6. **stakeholder_service_payments** - Payment records for incoming services
   - `status`: 'pending' | 'paid' | 'cancelled'
   - `billing_period_start/end`
   - `vendor_snapshot` - Captures stakeholder info at payment time

7. **stakeholder_payment_line_items** - Line items for payments

8. **stakeholder_service_templates** - Reusable service templates
9. **stakeholder_invoice_settings** - Company invoice configuration

---

## React Hooks

### useStakeholderServices.tsx
- `fetchServices(options)` - List services with filters
- `fetchServiceById(id)` - Get single service
- `createService(data)` - Create new service
- `updateService(id, data)` - Update service
- `updateServiceStatus(id, status)` - Change service status
- `deleteService(id)` - Soft delete

### useServiceInvoices.tsx
- `fetchInvoices(options)` - List invoices with filters
- `fetchInvoiceById(id)` - Get single invoice with line items
- `previewInvoice(data)` - Calculate invoice preview with pro-rata
- `createInvoice(data)` - Generate and save invoice
- `sendInvoice(id)` - Mark as sent
- `recordPayment(invoiceId, amount, date, reference)` - Record payment
- `updateInvoiceStatus(id, status)` - Change status

### useServicePayments.tsx
- `fetchPayments(options)` - List payment records
- `fetchPaymentById(id)` - Get single payment
- `createPayment(data)` - Create payment record for incoming service
- `updatePaymentStatus(id, status, paymentDate)` - Update status
- `deletePayment(id)` - Delete payment record

### useServiceTemplates.tsx
- `fetchTemplates()` - List templates
- `createTemplate(data)` - Create template
- `fetchInvoiceSettings()` - Get invoice config
- `saveInvoiceSettings(data)` - Save invoice config

---

## UI Components

### Service Management
- **StakeholderServicesList** - Main services list with filters
- **ServiceFormModal** - Create/edit service form
- **ServiceDetailModal** - Service details with Invoices/Payments tabs
- **ServiceLineItemsEditor** - Manage service line items

### Invoice Management (for outgoing services)
- **InvoicesList** - List invoices with filters, summary cards
- **InvoiceDetailModal** - Full invoice view with actions
- **InvoiceGenerationForm** - Generate invoice from service
- **RecordPaymentModal** - Record payment against invoice

### Payment Management (for incoming services)
- **PaymentRecordsList** - List payment records with filters
- **PaymentFormModal** - Create payment record
- **PaymentDetailModal** - View payment details with status actions

### Public Access (for stakeholders)
- **PublicStakeholderServices** - View services (read-only)
- **PublicStakeholderInvoices** - View invoices (read-only)

---

## API Routes (Admin Access via Supabase Admin Client)

- `/api/stakeholders/public/services` - Public service listing
- `/api/stakeholders/public/invoices` - Public invoice listing

These use admin Supabase client to bypass RLS for public stakeholder access.

---

## Pro-Rata Calculation

The system supports pro-rata billing for partial periods:

```typescript
// Located in src/lib/utils/pro-rata-calculation.ts
calculateProRataInvoice({
  service_id,
  billing_period_start,
  billing_period_end,
}) => {
  // Returns: lineItems[], subtotal, taxAmount, totalAmount, proRataDetails
}
```

Calculation methods:
- `daily` - Divide monthly rate by 30 days
- `calendar_days` - Divide by actual days in month
- `business_days` - Only count business days

---

## Status Workflows

### Invoice Status Flow
```
draft → sent → viewed → partially_paid → paid
                   ↘          ↘
                   overdue → cancelled
```

### Payment Status Flow
```
pending → paid
       ↘
       cancelled
```

---

## Next Steps (TODO)

1. ~~**Edge Function for Auto-Payments**~~ ✅ - Implemented in `supabase/functions/auto-create-stakeholder-payments/`
2. **Email Notifications** - Send invoice to stakeholders via email
3. **PDF Generation** - Generate downloadable invoice PDFs
4. **Overdue Detection** - Cron job to mark overdue invoices
5. **Integration with Accounts** - Link payments to company accounts system

---

## Migration Notes

The old process-based billing system has been completely replaced:

**Deleted Files:**
- `sql/stakeholder_billing_system.sql` - Old SQL schema
- `src/hooks/useStakeholderBilling.tsx` - Old hook
- `src/components/stakeholder-billing/` - Old components
- Old types in `schemas.ts` (StakeholderBillingCycle, StakeholderInvoice, etc.)

**New System Files:**
- `sql/stakeholder_services_system.sql` - New service-based SQL schema
- `src/lib/types/stakeholder-services.ts` - All service billing types
- `src/hooks/useStakeholderServices.tsx` - Service management
- `src/hooks/useServiceInvoices.tsx` - Invoice management
- `src/hooks/useServicePayments.tsx` - Payment management
- `src/hooks/useServiceTemplates.tsx` - Templates and settings
- `src/components/stakeholder-services/` - All UI components
- `supabase/functions/auto-create-stakeholder-payments/` - Edge function for auto-payments
