-- ==============================================================================
-- STAKEHOLDER SERVICES SYSTEM
-- ==============================================================================
-- This migration creates a comprehensive services system for stakeholders:
-- 1. Service templates for reusable service definitions
-- 2. Services (recurring or one-off) between company and stakeholders
-- 3. Multi-line item support with pro-rata billing
-- 4. Invoice management for outgoing services
-- 5. Payment records for incoming services (auto-created in accounts)
-- 6. Service history tracking for mid-period change calculations
-- 7. Company invoice settings configuration
--
-- Key Features:
-- - Outgoing services: Company provides service TO stakeholder (generates invoices)
-- - Incoming services: Company receives service FROM stakeholder (auto-creates payment records)
-- - Pro-rata billing: Mid-period changes calculated based on 30-day standard periods
-- - Self-service portal: Stakeholders can view their services and invoices
--
-- Author: Flow HRIS Team
-- Date: December 22, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: COMPANY INVOICE SETTINGS
-- ==============================================================================

-- Company-wide invoice configuration
CREATE TABLE IF NOT EXISTS company_invoice_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Invoice numbering
  invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV',
  
  -- Default settings
  default_payment_terms_days INTEGER DEFAULT 30,
  default_currency VARCHAR(10) DEFAULT 'BDT',
  default_tax_rate DECIMAL(5, 2) DEFAULT 0, -- Default tax rate percentage
  
  -- Company details for invoice header
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_logo_url TEXT,
  
  -- Invoice footer/terms
  invoice_footer_text TEXT,
  payment_instructions TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  CONSTRAINT unique_company_invoice_settings UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_invoice_settings_company_id 
  ON company_invoice_settings(company_id);

-- ==============================================================================
-- PART 2: SERVICE TEMPLATES
-- ==============================================================================

-- Reusable service templates for quick service creation
CREATE TABLE IF NOT EXISTS stakeholder_service_templates (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Template information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Service direction
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  
  -- Default billing configuration
  default_currency VARCHAR(10) DEFAULT 'BDT',
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Default billing cycle (for recurring services)
  default_billing_cycle_type VARCHAR(20) CHECK (
    default_billing_cycle_type IN ('monthly', 'weekly', 'yearly', 'x_days')
  ),
  default_billing_day_of_month INTEGER CHECK (
    default_billing_day_of_month >= 1 AND default_billing_day_of_month <= 28
  ),
  default_billing_day_of_week INTEGER CHECK (
    default_billing_day_of_week >= 1 AND default_billing_day_of_week <= 7
  ),
  default_billing_month_of_year INTEGER CHECK (
    default_billing_month_of_year >= 1 AND default_billing_month_of_year <= 12
  ),
  default_billing_interval_days INTEGER CHECK (default_billing_interval_days >= 1),
  
  -- Default line items (JSONB array)
  -- Format: [{"description": "Monthly fee", "quantity": 1, "unit_price": 1000}]
  default_line_items JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  CONSTRAINT unique_template_name_per_company UNIQUE(name, company_id)
);

CREATE INDEX IF NOT EXISTS idx_service_templates_company_id 
  ON stakeholder_service_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_service_templates_is_active 
  ON stakeholder_service_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_templates_direction 
  ON stakeholder_service_templates(direction);

-- ==============================================================================
-- PART 3: STAKEHOLDER SERVICES
-- ==============================================================================

-- Main services table
CREATE TABLE IF NOT EXISTS stakeholder_services (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  
  -- Optional reference to template used
  template_id INTEGER REFERENCES stakeholder_service_templates(id) ON DELETE SET NULL,
  
  -- Service information
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Service direction and type
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('recurring', 'one_off')),
  
  -- Currency and tax
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'paused', 'cancelled', 'completed')
  ),
  
  -- Service dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL for indefinite
  
  -- Billing cycle configuration (for recurring services)
  billing_cycle_type VARCHAR(20) CHECK (
    billing_cycle_type IN ('monthly', 'weekly', 'yearly', 'x_days')
  ),
  billing_day_of_month INTEGER CHECK (
    billing_day_of_month >= 1 AND billing_day_of_month <= 28
  ),
  billing_day_of_week INTEGER CHECK (
    billing_day_of_week >= 1 AND billing_day_of_week <= 7
  ),
  billing_month_of_year INTEGER CHECK (
    billing_month_of_year >= 1 AND billing_month_of_year <= 12
  ),
  billing_interval_days INTEGER CHECK (billing_interval_days >= 1),
  
  -- Billing tracking
  last_billed_date DATE,
  next_billing_date DATE,
  
  -- For incoming services (company receives from stakeholder)
  payment_account_category VARCHAR(100), -- Preset category for account entries
  auto_create_payment BOOLEAN DEFAULT TRUE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  -- Constraints
  CONSTRAINT valid_service_dates CHECK (
    end_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT recurring_service_must_have_cycle CHECK (
    service_type = 'one_off' OR (
      service_type = 'recurring' AND billing_cycle_type IS NOT NULL AND (
        (billing_cycle_type = 'monthly' AND billing_day_of_month IS NOT NULL) OR
        (billing_cycle_type = 'weekly' AND billing_day_of_week IS NOT NULL) OR
        (billing_cycle_type = 'yearly' AND billing_month_of_year IS NOT NULL AND billing_day_of_month IS NOT NULL) OR
        (billing_cycle_type = 'x_days' AND billing_interval_days IS NOT NULL)
      )
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_services_company_id ON stakeholder_services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_stakeholder_id ON stakeholder_services(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_services_template_id ON stakeholder_services(template_id);
CREATE INDEX IF NOT EXISTS idx_services_direction ON stakeholder_services(direction);
CREATE INDEX IF NOT EXISTS idx_services_status ON stakeholder_services(status);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON stakeholder_services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_next_billing_date ON stakeholder_services(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_services_start_date ON stakeholder_services(start_date);
CREATE INDEX IF NOT EXISTS idx_services_company_stakeholder 
  ON stakeholder_services(company_id, stakeholder_id);

-- ==============================================================================
-- PART 4: SERVICE LINE ITEMS
-- ==============================================================================

-- Line items for each service
CREATE TABLE IF NOT EXISTS stakeholder_service_line_items (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES stakeholder_services(id) ON DELETE CASCADE,
  
  -- Item details
  item_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  
  -- Computed amount (for convenience, actual calculation done in application)
  amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_line_items_service_id 
  ON stakeholder_service_line_items(service_id);

-- ==============================================================================
-- PART 5: SERVICE HISTORY (For Pro-rata Calculations)
-- ==============================================================================

-- Track all changes to services for pro-rata billing calculations
CREATE TABLE IF NOT EXISTS stakeholder_service_history (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES stakeholder_services(id) ON DELETE CASCADE,
  
  -- Change type
  change_type VARCHAR(50) NOT NULL CHECK (
    change_type IN ('created', 'updated', 'status_changed', 'line_items_changed')
  ),
  
  -- What changed
  field_changed VARCHAR(100),
  
  -- Old and new values as JSONB (for line items, stores full array)
  old_value JSONB,
  new_value JSONB,
  
  -- When this change was/is effective
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE, -- NULL means currently active
  
  -- Who made the change
  changed_by UUID REFERENCES employees(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_history_service_id 
  ON stakeholder_service_history(service_id);
CREATE INDEX IF NOT EXISTS idx_service_history_change_type 
  ON stakeholder_service_history(change_type);
CREATE INDEX IF NOT EXISTS idx_service_history_effective_from 
  ON stakeholder_service_history(effective_from);
CREATE INDEX IF NOT EXISTS idx_service_history_effective_period 
  ON stakeholder_service_history(effective_from, effective_to);

-- ==============================================================================
-- PART 6: SERVICE INVOICES (Outgoing Services)
-- ==============================================================================

-- Invoices for outgoing services (company bills stakeholder)
CREATE TABLE IF NOT EXISTS stakeholder_service_invoices (
  id SERIAL PRIMARY KEY,
  
  -- Relationships
  service_id INTEGER NOT NULL REFERENCES stakeholder_services(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  
  -- Invoice identification
  -- Format: {PREFIX}-{YYYY}-{MM}-{DD}-{SEQ}
  invoice_number VARCHAR(100) NOT NULL,
  
  -- Billing period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Financial information
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Pro-rata breakdown (if mid-period changes occurred)
  -- Format: {"periods": [{"start": "2025-12-01", "end": "2025-12-15", "amount": 500, "line_items": [...]}]}
  pro_rata_details JSONB,
  
  -- Invoice dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'void')
  ),
  
  -- Payment tracking
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  paid_date DATE,
  payment_reference VARCHAR(255),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- PDF storage
  pdf_url TEXT,
  
  -- Customer snapshot (for historical accuracy)
  customer_snapshot JSONB, -- Stores stakeholder name, address, contacts at time of invoice
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID REFERENCES employees(id),
  
  -- Constraints
  CONSTRAINT valid_invoice_billing_period CHECK (billing_period_end >= billing_period_start),
  CONSTRAINT valid_invoice_amounts CHECK (
    subtotal >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0 AND 
    paid_amount >= 0 AND 
    paid_amount <= total_amount
  ),
  CONSTRAINT unique_invoice_number_per_company UNIQUE(invoice_number, company_id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_service_id ON stakeholder_service_invoices(service_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON stakeholder_service_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stakeholder_id ON stakeholder_service_invoices(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON stakeholder_service_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON stakeholder_service_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON stakeholder_service_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON stakeholder_service_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_period 
  ON stakeholder_service_invoices(billing_period_start, billing_period_end);

-- ==============================================================================
-- PART 7: INVOICE LINE ITEMS
-- ==============================================================================

-- Snapshot of line items for each invoice
CREATE TABLE IF NOT EXISTS stakeholder_invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES stakeholder_service_invoices(id) ON DELETE CASCADE,
  
  -- Item details (snapshot from service line items)
  item_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  
  -- Pro-rata information (if applicable)
  pro_rata_days INTEGER, -- Number of days this item was active
  pro_rata_total_days INTEGER DEFAULT 30, -- Total days in period (always 30)
  original_amount DECIMAL(15, 2), -- Original amount before pro-rata
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id 
  ON stakeholder_invoice_line_items(invoice_id);

-- ==============================================================================
-- PART 8: SERVICE PAYMENTS (Incoming Services)
-- ==============================================================================

-- Payment records for incoming services (stakeholder bills company)
-- These are auto-created when generating billing for incoming services
CREATE TABLE IF NOT EXISTS stakeholder_service_payments (
  id SERIAL PRIMARY KEY,
  
  -- Relationships
  service_id INTEGER NOT NULL REFERENCES stakeholder_services(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  
  -- Link to account entry (created by edge function)
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Billing period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Financial information
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Pro-rata breakdown
  pro_rata_details JSONB,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'cancelled')
  ),
  
  -- Payment tracking
  payment_date DATE,
  reference_number VARCHAR(255),
  notes TEXT,
  
  -- Vendor snapshot (for historical accuracy)
  vendor_snapshot JSONB, -- Stores stakeholder name, address, contacts
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  -- Constraints
  CONSTRAINT valid_payment_billing_period CHECK (billing_period_end >= billing_period_start),
  CONSTRAINT valid_payment_amounts CHECK (
    subtotal >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_payments_service_id ON stakeholder_service_payments(service_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON stakeholder_service_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_stakeholder_id ON stakeholder_service_payments(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON stakeholder_service_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON stakeholder_service_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON stakeholder_service_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_billing_period 
  ON stakeholder_service_payments(billing_period_start, billing_period_end);

-- ==============================================================================
-- PART 9: PAYMENT LINE ITEMS
-- ==============================================================================

-- Snapshot of line items for each payment record
CREATE TABLE IF NOT EXISTS stakeholder_payment_line_items (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES stakeholder_service_payments(id) ON DELETE CASCADE,
  
  -- Item details
  item_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  
  -- Pro-rata information
  pro_rata_days INTEGER,
  pro_rata_total_days INTEGER DEFAULT 30,
  original_amount DECIMAL(15, 2),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_line_items_payment_id 
  ON stakeholder_payment_line_items(payment_id);

-- ==============================================================================
-- PART 10: INVOICE SEQUENCE TRACKING
-- ==============================================================================

-- Track daily invoice sequences per company
CREATE TABLE IF NOT EXISTS company_invoice_sequences (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sequence_date DATE NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT unique_company_sequence_date UNIQUE(company_id, sequence_date)
);

CREATE INDEX IF NOT EXISTS idx_invoice_sequences_company_date 
  ON company_invoice_sequences(company_id, sequence_date);

-- ==============================================================================
-- PART 11: TRIGGERS
-- ==============================================================================

-- Update timestamp trigger for all tables
CREATE TRIGGER update_company_invoice_settings_updated_at
  BEFORE UPDATE ON company_invoice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_templates_updated_at
  BEFORE UPDATE ON stakeholder_service_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholder_services_updated_at
  BEFORE UPDATE ON stakeholder_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_line_items_updated_at
  BEFORE UPDATE ON stakeholder_service_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_invoices_updated_at
  BEFORE UPDATE ON stakeholder_service_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_payments_updated_at
  BEFORE UPDATE ON stakeholder_service_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 12: HELPER FUNCTIONS
-- ==============================================================================

-- Function to generate unique invoice number
-- Format: {PREFIX}-{YYYY}-{MM}-{DD}-{SEQ}
CREATE OR REPLACE FUNCTION generate_service_invoice_number(
  p_company_id INTEGER,
  p_invoice_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR(20);
  v_sequence INTEGER;
  v_invoice_number VARCHAR(100);
BEGIN
  -- Get company invoice prefix
  SELECT COALESCE(invoice_prefix, 'INV') INTO v_prefix
  FROM company_invoice_settings
  WHERE company_id = p_company_id;
  
  -- Default prefix if no settings exist
  IF v_prefix IS NULL THEN
    v_prefix := 'INV';
  END IF;
  
  -- Get and increment sequence for this date
  INSERT INTO company_invoice_sequences (company_id, sequence_date, last_sequence)
  VALUES (p_company_id, p_invoice_date, 1)
  ON CONFLICT (company_id, sequence_date)
  DO UPDATE SET last_sequence = company_invoice_sequences.last_sequence + 1
  RETURNING last_sequence INTO v_sequence;
  
  -- Generate invoice number
  v_invoice_number := v_prefix || '-' || 
                      TO_CHAR(p_invoice_date, 'YYYY-MM-DD') || '-' || 
                      LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next billing date
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
  p_billing_cycle_type VARCHAR(20),
  p_billing_day_of_month INTEGER,
  p_billing_day_of_week INTEGER,
  p_billing_month_of_year INTEGER,
  p_billing_interval_days INTEGER,
  p_last_billed_date DATE DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS DATE AS $$
DECLARE
  v_reference_date DATE;
  v_next_date DATE;
BEGIN
  v_reference_date := COALESCE(p_last_billed_date, p_start_date - INTERVAL '1 day');
  
  CASE p_billing_cycle_type
    WHEN 'monthly' THEN
      -- Next month on the specified day
      v_next_date := DATE_TRUNC('month', v_reference_date + INTERVAL '1 month') + 
                     (p_billing_day_of_month - 1) * INTERVAL '1 day';
      -- If that date has already passed, go to next month
      IF v_next_date <= v_reference_date THEN
        v_next_date := DATE_TRUNC('month', v_reference_date + INTERVAL '2 months') + 
                       (p_billing_day_of_month - 1) * INTERVAL '1 day';
      END IF;
      
    WHEN 'weekly' THEN
      -- Calculate days until next occurrence of specified day
      v_next_date := v_reference_date + 
                     ((p_billing_day_of_week - EXTRACT(DOW FROM v_reference_date)::INTEGER + 7) % 7 + 1) * 
                     INTERVAL '1 day';
      IF v_next_date <= v_reference_date THEN
        v_next_date := v_next_date + INTERVAL '7 days';
      END IF;
      
    WHEN 'yearly' THEN
      -- Same day and month next year
      v_next_date := MAKE_DATE(
        EXTRACT(YEAR FROM v_reference_date)::INTEGER,
        p_billing_month_of_year,
        p_billing_day_of_month
      );
      IF v_next_date <= v_reference_date THEN
        v_next_date := MAKE_DATE(
          EXTRACT(YEAR FROM v_reference_date)::INTEGER + 1,
          p_billing_month_of_year,
          p_billing_day_of_month
        );
      END IF;
      
    WHEN 'x_days' THEN
      v_next_date := v_reference_date + (p_billing_interval_days * INTERVAL '1 day');
      
    ELSE
      v_next_date := NULL;
  END CASE;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate pro-rata amount
-- Uses 30-day standard billing period
CREATE OR REPLACE FUNCTION calculate_pro_rata_amount(
  p_full_amount DECIMAL(15, 2),
  p_days_active INTEGER,
  p_total_days INTEGER DEFAULT 30
)
RETURNS DECIMAL(15, 2) AS $$
BEGIN
  IF p_total_days = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((p_full_amount * p_days_active / p_total_days), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get service history for a billing period
CREATE OR REPLACE FUNCTION get_service_history_for_period(
  p_service_id INTEGER,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE (
  history_id INTEGER,
  change_type VARCHAR(50),
  old_value JSONB,
  new_value JSONB,
  effective_from TIMESTAMP WITH TIME ZONE,
  effective_to TIMESTAMP WITH TIME ZONE,
  days_active INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.change_type,
    h.old_value,
    h.new_value,
    h.effective_from,
    h.effective_to,
    -- Calculate days this configuration was active during the billing period
    GREATEST(0, 
      EXTRACT(DAY FROM (
        LEAST(COALESCE(h.effective_to, p_period_end + INTERVAL '1 day')::DATE, p_period_end + INTERVAL '1 day') -
        GREATEST(h.effective_from::DATE, p_period_start)
      ))
    )::INTEGER AS days_active
  FROM stakeholder_service_history h
  WHERE h.service_id = p_service_id
    AND h.effective_from <= p_period_end + INTERVAL '1 day'
    AND (h.effective_to IS NULL OR h.effective_to >= p_period_start)
  ORDER BY h.effective_from;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PART 13: SERVICE HISTORY TRACKING TRIGGER
-- ==============================================================================

-- Function to automatically record service changes
CREATE OR REPLACE FUNCTION track_service_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_old_line_items JSONB;
  v_new_line_items JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Record service creation
    INSERT INTO stakeholder_service_history (
      service_id, change_type, new_value, effective_from, changed_by
    ) VALUES (
      NEW.id, 
      'created', 
      jsonb_build_object(
        'service_name', NEW.service_name,
        'direction', NEW.direction,
        'service_type', NEW.service_type,
        'currency', NEW.currency,
        'tax_rate', NEW.tax_rate,
        'status', NEW.status
      ),
      NEW.created_at,
      NEW.created_by
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check for status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Close previous history entry
      UPDATE stakeholder_service_history
      SET effective_to = NOW()
      WHERE service_id = NEW.id AND effective_to IS NULL;
      
      -- Record status change
      INSERT INTO stakeholder_service_history (
        service_id, change_type, field_changed, old_value, new_value, 
        effective_from, changed_by
      ) VALUES (
        NEW.id, 
        'status_changed', 
        'status',
        to_jsonb(OLD.status),
        to_jsonb(NEW.status),
        NOW(),
        NEW.updated_by
      );
    END IF;
    
    -- Check for other significant changes (price, tax, etc.)
    IF OLD.tax_rate IS DISTINCT FROM NEW.tax_rate OR
       OLD.currency IS DISTINCT FROM NEW.currency THEN
      -- Close previous history entry
      UPDATE stakeholder_service_history
      SET effective_to = NOW()
      WHERE service_id = NEW.id 
        AND effective_to IS NULL 
        AND change_type != 'status_changed';
      
      -- Record update
      INSERT INTO stakeholder_service_history (
        service_id, change_type, old_value, new_value, 
        effective_from, changed_by
      ) VALUES (
        NEW.id, 
        'updated',
        jsonb_build_object(
          'tax_rate', OLD.tax_rate,
          'currency', OLD.currency
        ),
        jsonb_build_object(
          'tax_rate', NEW.tax_rate,
          'currency', NEW.currency
        ),
        NOW(),
        NEW.updated_by
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_service_changes
  AFTER INSERT OR UPDATE ON stakeholder_services
  FOR EACH ROW
  EXECUTE FUNCTION track_service_changes();

-- Function to track line item changes
CREATE OR REPLACE FUNCTION track_line_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_service_id INTEGER;
  v_changed_by UUID;
BEGIN
  v_service_id := COALESCE(NEW.service_id, OLD.service_id);
  
  -- Get the service's updated_by for attribution
  SELECT updated_by INTO v_changed_by
  FROM stakeholder_services
  WHERE id = v_service_id;
  
  -- Close previous line item history entry
  UPDATE stakeholder_service_history
  SET effective_to = NOW()
  WHERE service_id = v_service_id 
    AND effective_to IS NULL 
    AND change_type = 'line_items_changed';
  
  -- Get current line items as snapshot
  INSERT INTO stakeholder_service_history (
    service_id, change_type, new_value, effective_from, changed_by
  )
  SELECT 
    v_service_id,
    'line_items_changed',
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'item_order', li.item_order,
          'description', li.description,
          'quantity', li.quantity,
          'unit_price', li.unit_price,
          'amount', li.amount
        ) ORDER BY li.item_order
      ),
      '[]'::jsonb
    ),
    NOW(),
    v_changed_by
  FROM stakeholder_service_line_items li
  WHERE li.service_id = v_service_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_line_item_changes
  AFTER INSERT OR UPDATE OR DELETE ON stakeholder_service_line_items
  FOR EACH ROW
  EXECUTE FUNCTION track_line_item_changes();

-- ==============================================================================
-- PART 14: INVOICE STATUS UPDATE TRIGGER
-- ==============================================================================

-- Function to update invoice status based on payment
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent overpayment
  IF NEW.paid_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'Paid amount cannot exceed total amount';
  END IF;
  
  -- Update status based on payment
  IF NEW.paid_amount = NEW.total_amount AND NEW.total_amount > 0 THEN
    NEW.status := 'paid';
    IF NEW.paid_date IS NULL THEN
      NEW.paid_date := CURRENT_DATE;
    END IF;
  ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < NEW.total_amount THEN
    NEW.status := 'partially_paid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_status
  BEFORE UPDATE OF paid_amount, total_amount ON stakeholder_service_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- ==============================================================================
-- PART 15: ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE company_invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_service_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_service_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_service_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_payment_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Company Invoice Settings Policies
CREATE POLICY company_invoice_settings_select ON company_invoice_settings
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY company_invoice_settings_insert ON company_invoice_settings
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY company_invoice_settings_update ON company_invoice_settings
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY company_invoice_settings_delete ON company_invoice_settings
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

-- Service Templates Policies
CREATE POLICY service_templates_select ON stakeholder_service_templates
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY service_templates_insert ON stakeholder_service_templates
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY service_templates_update ON stakeholder_service_templates
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY service_templates_delete ON stakeholder_service_templates
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

-- Services Policies
CREATE POLICY services_select ON stakeholder_services
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY services_insert ON stakeholder_services
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY services_update ON stakeholder_services
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY services_delete ON stakeholder_services
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

-- Service Line Items Policies (through service's company_id)
CREATE POLICY service_line_items_select ON stakeholder_service_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stakeholder_services s
      WHERE s.id = service_id
      AND s.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY service_line_items_insert ON stakeholder_service_line_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stakeholder_services s
      WHERE s.id = service_id
      AND s.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY service_line_items_update ON stakeholder_service_line_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stakeholder_services s
      WHERE s.id = service_id
      AND s.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY service_line_items_delete ON stakeholder_service_line_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stakeholder_services s
      WHERE s.id = service_id
      AND s.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Service History Policies
CREATE POLICY service_history_select ON stakeholder_service_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stakeholder_services s
      WHERE s.id = service_id
      AND s.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY service_history_insert ON stakeholder_service_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stakeholder_services s
      WHERE s.id = service_id
      AND s.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- History should not be updated or deleted (immutable audit log)
CREATE POLICY service_history_no_update ON stakeholder_service_history
  FOR UPDATE USING (false);

CREATE POLICY service_history_no_delete ON stakeholder_service_history
  FOR DELETE USING (false);

-- Invoice Policies
CREATE POLICY invoices_select ON stakeholder_service_invoices
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY invoices_insert ON stakeholder_service_invoices
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY invoices_update ON stakeholder_service_invoices
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY invoices_delete ON stakeholder_service_invoices
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

-- Invoice Line Items Policies
CREATE POLICY invoice_line_items_select ON stakeholder_invoice_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stakeholder_service_invoices i
      WHERE i.id = invoice_id
      AND i.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY invoice_line_items_insert ON stakeholder_invoice_line_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stakeholder_service_invoices i
      WHERE i.id = invoice_id
      AND i.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY invoice_line_items_update ON stakeholder_invoice_line_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stakeholder_service_invoices i
      WHERE i.id = invoice_id
      AND i.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY invoice_line_items_delete ON stakeholder_invoice_line_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stakeholder_service_invoices i
      WHERE i.id = invoice_id
      AND i.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Payment Policies
CREATE POLICY payments_select ON stakeholder_service_payments
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY payments_insert ON stakeholder_service_payments
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY payments_update ON stakeholder_service_payments
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY payments_delete ON stakeholder_service_payments
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

-- Payment Line Items Policies
CREATE POLICY payment_line_items_select ON stakeholder_payment_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stakeholder_service_payments p
      WHERE p.id = payment_id
      AND p.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY payment_line_items_insert ON stakeholder_payment_line_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stakeholder_service_payments p
      WHERE p.id = payment_id
      AND p.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY payment_line_items_update ON stakeholder_payment_line_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stakeholder_service_payments p
      WHERE p.id = payment_id
      AND p.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

CREATE POLICY payment_line_items_delete ON stakeholder_payment_line_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stakeholder_service_payments p
      WHERE p.id = payment_id
      AND p.company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Invoice Sequences Policies
CREATE POLICY invoice_sequences_select ON company_invoice_sequences
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY invoice_sequences_insert ON company_invoice_sequences
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

CREATE POLICY invoice_sequences_update ON company_invoice_sequences
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
  );

-- ==============================================================================
-- PART 16: COMMENTS
-- ==============================================================================

-- NOTE: Public stakeholder access to services and invoices is handled via
-- server-side API routes using createAdminClient() which bypasses RLS.
-- The API routes verify the stakeholder's access_code before returning data.
-- See: /api/public/stakeholder/services and /api/public/stakeholder/invoices

COMMENT ON TABLE company_invoice_settings IS 'Company-wide invoice configuration and branding settings';
COMMENT ON TABLE stakeholder_service_templates IS 'Reusable service templates for quick service creation';
COMMENT ON TABLE stakeholder_services IS 'Main services table - services provided to or received from stakeholders';
COMMENT ON TABLE stakeholder_service_line_items IS 'Line items for each service (current state)';
COMMENT ON TABLE stakeholder_service_history IS 'Audit trail for service changes, used for pro-rata calculations';
COMMENT ON TABLE stakeholder_service_invoices IS 'Invoices for outgoing services (company bills stakeholder)';
COMMENT ON TABLE stakeholder_invoice_line_items IS 'Snapshot of line items for each invoice';
COMMENT ON TABLE stakeholder_service_payments IS 'Payment records for incoming services (stakeholder bills company)';
COMMENT ON TABLE stakeholder_payment_line_items IS 'Snapshot of line items for each payment record';
COMMENT ON TABLE company_invoice_sequences IS 'Daily invoice sequence tracking per company';

COMMENT ON COLUMN stakeholder_services.direction IS 'outgoing = company provides service to stakeholder; incoming = company receives service from stakeholder';
COMMENT ON COLUMN stakeholder_services.service_type IS 'recurring = periodic billing; one_off = single transaction';
COMMENT ON COLUMN stakeholder_services.billing_day_of_month IS 'Day 1-28 for monthly billing to avoid end-of-month issues';
COMMENT ON COLUMN stakeholder_service_invoices.invoice_number IS 'Format: {PREFIX}-{YYYY}-{MM}-{DD}-{SEQ}';
COMMENT ON COLUMN stakeholder_service_invoices.pro_rata_details IS 'JSON breakdown when mid-period service changes occurred';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
