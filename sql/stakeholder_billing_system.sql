-- ==============================================================================
-- STAKEHOLDER BILLING SYSTEM
-- ==============================================================================
-- This migration adds a comprehensive billing system for stakeholders:
-- 1. Invoice management with status tracking
-- 2. Billing cycles configuration per process
-- 3. Field change audit trail
-- 4. Multi-currency support
-- 5. Integration with existing accounts system
--
-- Author: Flow HRIS Team
-- Date: December 20, 2024
-- ==============================================================================

-- ==============================================================================
-- PART 1: BILLING CYCLES TABLE
-- ==============================================================================

-- Billing cycles configuration per stakeholder process
-- Defines how often invoices should be generated
CREATE TABLE IF NOT EXISTS stakeholder_billing_cycles (
  id SERIAL PRIMARY KEY,
  process_id INTEGER NOT NULL REFERENCES stakeholder_processes(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL,
  
  -- Billing cycle type
  cycle_type VARCHAR(50) NOT NULL CHECK (cycle_type IN ('date_to_date', 'x_days')),
  
  -- For 'date_to_date': billing happens on same date each month (e.g., 5th to 5th)
  billing_day_of_month INTEGER CHECK (billing_day_of_month >= 1 AND billing_day_of_month <= 31),
  
  -- For 'x_days': billing happens every X days
  cycle_days INTEGER CHECK (cycle_days >= 1),
  
  -- Billing fields configuration
  -- Array of field keys that should be included in billing
  billing_field_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Default currency for this process
  default_currency VARCHAR(10) DEFAULT 'BDT',
  
  -- Finance team to be notified
  finance_team_id INTEGER REFERENCES teams(id),
  
  -- Whether billing is active for this process
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  CONSTRAINT billing_cycle_type_check CHECK (
    (cycle_type = 'date_to_date' AND billing_day_of_month IS NOT NULL) OR
    (cycle_type = 'x_days' AND cycle_days IS NOT NULL)
  )
);

-- Indexes for billing cycles
CREATE INDEX IF NOT EXISTS idx_billing_cycles_process_id ON stakeholder_billing_cycles(process_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_company_id ON stakeholder_billing_cycles(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_active ON stakeholder_billing_cycles(is_active) WHERE is_active = TRUE;

-- ==============================================================================
-- PART 2: STAKEHOLDER INVOICES TABLE
-- ==============================================================================

-- Main invoices table for stakeholders
CREATE TABLE IF NOT EXISTS stakeholder_invoices (
  id SERIAL PRIMARY KEY,
  
  -- Invoice identification
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  
  -- Relationships
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  process_id INTEGER NOT NULL REFERENCES stakeholder_processes(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL,
  
  -- Billing period
  billing_start_date DATE NOT NULL,
  billing_end_date DATE NOT NULL,
  
  -- Invoice dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Financial information
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void')
  ),
  
  -- Additional information
  notes TEXT, -- Additional notes to include in invoice
  internal_notes TEXT, -- Internal notes (not shown on invoice)
  
  -- Customer information snapshot (for historical accuracy)
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_contact_persons JSONB, -- Array of contact persons
  
  -- Payment tracking
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  payment_date DATE,
  
  -- Integration with accounts system
  account_id INTEGER REFERENCES accounts(id),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID REFERENCES employees(id),
  
  -- Constraints
  CONSTRAINT valid_billing_period CHECK (billing_end_date >= billing_start_date),
  CONSTRAINT valid_amounts CHECK (
    subtotal >= 0 AND 
    tax_amount >= 0 AND 
    discount_amount >= 0 AND 
    total_amount >= 0 AND
    paid_amount >= 0 AND
    paid_amount <= total_amount
  )
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_stakeholder_id ON stakeholder_invoices(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_invoices_process_id ON stakeholder_invoices(process_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON stakeholder_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON stakeholder_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON stakeholder_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_period ON stakeholder_invoices(billing_start_date, billing_end_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON stakeholder_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_account_id ON stakeholder_invoices(account_id);

-- ==============================================================================
-- PART 3: INVOICE ITEMS TABLE
-- ==============================================================================

-- Individual line items for each invoice
CREATE TABLE IF NOT EXISTS stakeholder_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES stakeholder_invoices(id) ON DELETE CASCADE,
  
  -- Item details
  item_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  field_key VARCHAR(255), -- Reference to step data field key
  step_id INTEGER REFERENCES stakeholder_process_steps(id),
  
  -- Quantity and pricing
  quantity DECIMAL(15, 4) DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  
  -- Additional information
  item_type VARCHAR(50) DEFAULT 'standard' CHECK (item_type IN ('standard', 'calculated', 'manual', 'adjustment')),
  formula VARCHAR(500), -- If calculated, store the formula used
  metadata JSONB, -- Additional metadata about the item
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_item_amounts CHECK (
    quantity >= 0 AND 
    unit_price >= 0 AND 
    amount >= 0
  )
);

-- Indexes for invoice items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON stakeholder_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_field_key ON stakeholder_invoice_items(field_key);
CREATE INDEX IF NOT EXISTS idx_invoice_items_step_id ON stakeholder_invoice_items(step_id);

-- Prevent duplicate step-based line items per invoice
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoice_items_invoice_field_step
  ON stakeholder_invoice_items(invoice_id, field_key, step_id)
  WHERE field_key IS NOT NULL AND step_id IS NOT NULL;

-- ==============================================================================
-- PART 4: FIELD CHANGE AUDIT TABLE
-- ==============================================================================

-- Track changes to billing-related fields in step data
CREATE TABLE IF NOT EXISTS stakeholder_field_change_audit (
  id SERIAL PRIMARY KEY,
  
  -- What changed
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES stakeholder_process_steps(id) ON DELETE CASCADE,
  step_data_id INTEGER REFERENCES stakeholder_step_data(id) ON DELETE CASCADE,
  field_key VARCHAR(255) NOT NULL,
  
  -- Change details
  old_value JSONB,
  new_value JSONB,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
  
  -- Field metadata at time of change
  field_label VARCHAR(255),
  field_type VARCHAR(50),
  
  -- Audit information
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES employees(id),
  company_id INTEGER NOT NULL,
  
  -- Additional context
  change_reason TEXT,
  ip_address INET
);

-- Indexes for field change audit
CREATE INDEX IF NOT EXISTS idx_field_audit_stakeholder_id ON stakeholder_field_change_audit(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_field_audit_step_id ON stakeholder_field_change_audit(step_id);
CREATE INDEX IF NOT EXISTS idx_field_audit_field_key ON stakeholder_field_change_audit(field_key);
CREATE INDEX IF NOT EXISTS idx_field_audit_changed_at ON stakeholder_field_change_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_audit_company_id ON stakeholder_field_change_audit(company_id);

-- ==============================================================================
-- PART 5: TRIGGERS
-- ==============================================================================

-- Update timestamp trigger for billing cycles
CREATE TRIGGER update_billing_cycles_updated_at
  BEFORE UPDATE ON stakeholder_billing_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON stakeholder_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for invoice items
CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON stakeholder_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal DECIMAL(15, 2);
  v_invoice_id INTEGER;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate subtotal from invoice items
  SELECT COALESCE(SUM(amount), 0)
  INTO v_subtotal
  FROM stakeholder_invoice_items
  WHERE invoice_id = v_invoice_id;
  
  -- Update invoice with new subtotal and recalculate total
  UPDATE stakeholder_invoices
  SET 
    subtotal = v_subtotal,
    total_amount = v_subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0)
  WHERE id = v_invoice_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate invoice totals on item changes
DROP TRIGGER IF EXISTS trigger_update_invoice_totals_on_item_change ON stakeholder_invoice_items;
CREATE TRIGGER trigger_update_invoice_totals_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON stakeholder_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent overpayment
  IF NEW.paid_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'Paid amount (%) cannot exceed invoice total (%)', NEW.paid_amount, NEW.total_amount;
  END IF;
  
  -- Update status based on paid amount
  IF NEW.paid_amount >= NEW.total_amount AND NEW.total_amount > 0 THEN
    NEW.status = 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status = 'partially_paid';
  ELSIF NEW.status = 'paid' AND NEW.paid_amount < NEW.total_amount THEN
    NEW.status = 'partially_paid';
  END IF;
  
  -- Update payment date if fully paid
  IF NEW.status = 'paid' AND NEW.payment_date IS NULL THEN
    NEW.payment_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status on payment changes (including total_amount changes)
DROP TRIGGER IF EXISTS trigger_update_invoice_status ON stakeholder_invoices;
CREATE TRIGGER trigger_update_invoice_status
  BEFORE UPDATE OF paid_amount, total_amount ON stakeholder_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- ==============================================================================
-- PART 6: HELPER FUNCTIONS
-- ==============================================================================

-- Function to generate unique invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(
  p_company_id INTEGER,
  p_invoice_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_sequence INTEGER;
  v_invoice_number VARCHAR(100);
BEGIN
  v_year := TO_CHAR(p_invoice_date, 'YYYY');
  v_month := TO_CHAR(p_invoice_date, 'MM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM stakeholder_invoices
  WHERE company_id = p_company_id
    AND invoice_number LIKE 'INV-' || v_year || v_month || '%';
  
  -- Format: INV-YYYYMM-XXXX
  v_invoice_number := 'INV-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get invoice summary for a stakeholder
CREATE OR REPLACE FUNCTION get_stakeholder_invoice_summary(
  p_stakeholder_id INTEGER
)
RETURNS TABLE (
  total_invoices BIGINT,
  total_amount DECIMAL(15, 2),
  paid_amount DECIMAL(15, 2),
  outstanding_amount DECIMAL(15, 2),
  overdue_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_invoices,
    COALESCE(SUM(total_amount), 0) as total_amount,
    COALESCE(SUM(paid_amount), 0) as paid_amount,
    COALESCE(SUM(total_amount - paid_amount), 0) as outstanding_amount,
    COUNT(*) FILTER (WHERE status = 'overdue')::BIGINT as overdue_count
  FROM stakeholder_invoices
  WHERE stakeholder_id = p_stakeholder_id
    AND status NOT IN ('cancelled', 'void');
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PART 7: RLS POLICIES
-- ==============================================================================

-- Enable RLS on all billing tables
ALTER TABLE stakeholder_billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_field_change_audit ENABLE ROW LEVEL SECURITY;

-- Billing Cycles Policies
DROP POLICY IF EXISTS billing_cycles_company_isolation ON stakeholder_billing_cycles;
DROP POLICY IF EXISTS billing_cycles_select ON stakeholder_billing_cycles;
DROP POLICY IF EXISTS billing_cycles_modify ON stakeholder_billing_cycles;

CREATE POLICY billing_cycles_select ON stakeholder_billing_cycles
  FOR SELECT
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_read')
  );

CREATE POLICY billing_cycles_modify ON stakeholder_billing_cycles
  FOR INSERT
  WITH CHECK (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

CREATE POLICY billing_cycles_update ON stakeholder_billing_cycles
  FOR UPDATE
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  )
  WITH CHECK (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

CREATE POLICY billing_cycles_delete ON stakeholder_billing_cycles
  FOR DELETE
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_delete')
  );

-- Invoices Policies
DROP POLICY IF EXISTS invoices_company_isolation ON stakeholder_invoices;
DROP POLICY IF EXISTS invoices_select ON stakeholder_invoices;
DROP POLICY IF EXISTS invoices_modify ON stakeholder_invoices;

CREATE POLICY invoices_select ON stakeholder_invoices
  FOR SELECT
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_read')
  );

CREATE POLICY invoices_insert ON stakeholder_invoices
  FOR INSERT
  WITH CHECK (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

CREATE POLICY invoices_update ON stakeholder_invoices
  FOR UPDATE
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  )
  WITH CHECK (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

CREATE POLICY invoices_delete ON stakeholder_invoices
  FOR DELETE
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_delete')
  );

-- Invoice Items Policies (through invoice's company_id)
DROP POLICY IF EXISTS invoice_items_company_isolation ON stakeholder_invoice_items;
DROP POLICY IF EXISTS invoice_items_select ON stakeholder_invoice_items;
DROP POLICY IF EXISTS invoice_items_modify ON stakeholder_invoice_items;

CREATE POLICY invoice_items_select ON stakeholder_invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id
      FROM stakeholder_invoices
      WHERE company_id = get_auth_company_id()
    )
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_read')
  );

CREATE POLICY invoice_items_insert ON stakeholder_invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id
      FROM stakeholder_invoices
      WHERE company_id = get_auth_company_id()
    )
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

CREATE POLICY invoice_items_update ON stakeholder_invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id
      FROM stakeholder_invoices
      WHERE company_id = get_auth_company_id()
    )
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id
      FROM stakeholder_invoices
      WHERE company_id = get_auth_company_id()
    )
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

CREATE POLICY invoice_items_delete ON stakeholder_invoice_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id
      FROM stakeholder_invoices
      WHERE company_id = get_auth_company_id()
    )
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_delete')
  );

-- Field Change Audit Policies
DROP POLICY IF EXISTS field_audit_company_isolation ON stakeholder_field_change_audit;
DROP POLICY IF EXISTS field_audit_select ON stakeholder_field_change_audit;
DROP POLICY IF EXISTS field_audit_modify ON stakeholder_field_change_audit;

CREATE POLICY field_audit_select ON stakeholder_field_change_audit
  FOR SELECT
  USING (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_read')
  );

CREATE POLICY field_audit_insert ON stakeholder_field_change_audit
  FOR INSERT
  WITH CHECK (
    company_id = get_auth_company_id()
    AND has_permission(auth.uid(), 'stakeholder_billing', 'can_write')
  );

-- Audit records should not be updated or deleted (immutable audit log)
CREATE POLICY field_audit_no_update ON stakeholder_field_change_audit
  FOR UPDATE
  USING (false);

CREATE POLICY field_audit_no_delete ON stakeholder_field_change_audit
  FOR DELETE
  USING (false);

-- ==============================================================================
-- PART 8: COMMENTS
-- ==============================================================================

COMMENT ON TABLE stakeholder_billing_cycles IS 'Configuration for billing cycles per stakeholder process';
COMMENT ON TABLE stakeholder_invoices IS 'Invoices generated for stakeholders based on process data';
COMMENT ON TABLE stakeholder_invoice_items IS 'Line items for each invoice';
COMMENT ON TABLE stakeholder_field_change_audit IS 'Audit trail for changes to billing-related fields';

COMMENT ON COLUMN stakeholder_billing_cycles.cycle_type IS 'Type of billing cycle: date_to_date (monthly on same date) or x_days (every X days)';
COMMENT ON COLUMN stakeholder_invoices.invoice_number IS 'Unique invoice number in format INV-YYYYMM-XXXX';
COMMENT ON COLUMN stakeholder_invoices.status IS 'Invoice status: draft, sent, viewed, partially_paid, paid, overdue, cancelled, void';
COMMENT ON COLUMN stakeholder_invoice_items.item_type IS 'Type of item: standard (from step data), calculated (formula), manual (added manually), adjustment';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
