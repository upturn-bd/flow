# Stakeholder Billing System - Context Document

## Current Stakeholder System Overview

### Core Entities

1. **StakeholderProcess** - Defines a workflow template with sequential/non-sequential steps
2. **StakeholderProcessStep** - Individual steps with customizable field definitions
3. **Stakeholder** - Main entity (Lead/Permanent/Rejected) assigned to a process
4. **StakeholderStepData** - Actual data entered for each step per stakeholder

### Field Types Supported
- `text`, `number`, `boolean`, `date`, `file`, `geolocation`
- `dropdown`, `multi_select` (with nested fields per option)
- `calculated` - Uses formulas referencing fields from current/previous steps

### Formula System
Located in `/src/lib/utils/formula-evaluator.ts`:
- Cell references: `[Step1.fieldKey]` or `[Step2.nested.field]`
- Supports basic arithmetic: `+`, `-`, `*`, `/`, `()`, etc.
- Can reference fields across steps and nested fields

### Data Storage
- Step data stored in `stakeholder_step_data` table
- JSONB `data` column stores field values
- `field_definitions_snapshot` preserves the field schema at save time
- `updated_at` timestamp tracks last modification

---

## Proposed Billing System Design

### Key Requirements

1. **Billing Period**: 1st to 28th of each month (user selects billing date)
2. **Formula-Based**: Uses existing calculated field pattern
3. **Pro-rata Support**: Handle price/quantity changes mid-period on daily basis
4. **PDF Generation**: Human-readable invoice with stakeholder info and line items
5. **Multiple Changes**: Support multiple price changes in one billing period (latest change effective from next day)

### Questions to Clarify

1. **Billing Configuration**:
   - Where should the billing formula be configured? (Per process? Per stakeholder type? Per stakeholder?)
   - Should there be a dedicated "billing step" in processes, or separate billing configuration?
   
2. **Field Selection for Billing**:
   - Which fields should be selectable for billing? (Only number fields? Calculated fields?)
   - Should users be able to label fields differently for invoices (e.g., "Monthly Rate" → "Service Fee")?

3. **Price Change Tracking**:
   - Currently, step data only has `updated_at` but no history tracking
   - Need to create a history table for tracking field value changes with timestamps
   - Should we track ALL field changes or only "billable" fields?

4. **Invoice Details**:
   - What stakeholder information should appear on invoices? (Name, address, contact persons, etc.)
   - Should there be customizable invoice templates per company?
   - What about invoice numbering scheme? (e.g., INV-2024-001)

5. **Currency & Tax**:
   - Should billing support multiple currencies per company?
   - Is tax calculation needed? (VAT, Service tax, etc.)
   - Should there be separate line items for taxes/discounts?

6. **Invoice Storage & Status**:
   - Should generated invoices be stored in the database?
   - Invoice statuses? (Draft, Sent, Paid, Overdue, Cancelled)
   - Payment tracking integration with existing Accounts system?

---

## Proposed Database Schema

```sql
-- Table to track billing-relevant field changes for pro-rata calculation
CREATE TABLE stakeholder_billing_field_history (
  id SERIAL PRIMARY KEY,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES stakeholder_process_steps(id),
  field_key VARCHAR(255) NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  effective_date DATE NOT NULL, -- When this value becomes effective
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES employees(id),
  company_id INTEGER NOT NULL REFERENCES companies(id),
  
  CONSTRAINT unique_field_change_date UNIQUE(stakeholder_id, step_id, field_key, effective_date)
);

-- Billing configuration per process or stakeholder type
CREATE TABLE stakeholder_billing_config (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  process_id INTEGER REFERENCES stakeholder_processes(id) ON DELETE CASCADE,
  stakeholder_type_id INTEGER REFERENCES stakeholder_types(id) ON DELETE CASCADE,
  
  -- Billing formula configuration
  name VARCHAR(255) NOT NULL, -- e.g., "Monthly Service Fee"
  description TEXT,
  
  -- Fields to include in billing (references to step fields)
  billing_fields JSONB NOT NULL DEFAULT '[]',
  -- Format: [
  --   { "stepId": 1, "fieldKey": "rate", "label": "Monthly Rate", "type": "unit_price" },
  --   { "stepId": 2, "fieldKey": "quantity", "label": "Quantity", "type": "quantity" }
  -- ]
  
  -- The billing formula using referenced fields
  billing_formula TEXT, -- e.g., "[Step1.rate] * [Step2.quantity]"
  
  -- Billing date (1-28)
  billing_day INTEGER DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28),
  
  currency VARCHAR(10) DEFAULT 'BDT',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  
  CONSTRAINT at_least_one_reference CHECK (process_id IS NOT NULL OR stakeholder_type_id IS NOT NULL)
);

-- Generated invoices
CREATE TABLE stakeholder_invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  billing_config_id INTEGER REFERENCES stakeholder_billing_config(id),
  
  -- Billing period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Invoice details snapshot
  stakeholder_info JSONB NOT NULL, -- Snapshot of stakeholder details at generation
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Format: [
  --   { "description": "Service Fee (Jan 1-15)", "quantity": 1, "unitPrice": 1000, "amount": 1000, "effectiveFrom": "2024-01-01", "effectiveTo": "2024-01-15" },
  --   { "description": "Service Fee (Jan 16-28) - Updated Rate", "quantity": 1, "unitPrice": 1200, "amount": 1200, "effectiveFrom": "2024-01-16", "effectiveTo": "2024-01-28" }
  -- ]
  
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BDT',
  
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- PDF storage
  pdf_path TEXT, -- Path in storage bucket
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  
  CONSTRAINT unique_invoice_number_per_company UNIQUE(company_id, invoice_number)
);
```

## Next Steps

1. Get answers to clarifying questions
2. Create database migration SQL
3. Implement billing field history tracking (trigger on step data updates)
4. Create billing configuration UI
5. Implement invoice generation logic with pro-rata calculation
6. Create PDF generation utility
7. Build invoice management UI
