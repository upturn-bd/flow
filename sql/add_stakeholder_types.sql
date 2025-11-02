-- ==============================================================================
-- ADD STAKEHOLDER TYPES SYSTEM
-- ==============================================================================
-- This migration adds stakeholder types back to the system with proper 
-- company_id relationships for multi-tenant support.
-- 
-- Author: Flow HRIS Team
-- Date: November 1, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: CREATE STAKEHOLDER TYPES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  
  CONSTRAINT unique_stakeholder_type_name_per_company UNIQUE(name, company_id)
);

-- ==============================================================================
-- PART 2: CREATE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_stakeholder_types_company_id ON stakeholder_types(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_types_is_active ON stakeholder_types(is_active);
CREATE INDEX IF NOT EXISTS idx_stakeholder_types_created_by ON stakeholder_types(created_by);

-- ==============================================================================
-- PART 3: ADD STAKEHOLDER_TYPE_ID TO STAKEHOLDERS TABLE
-- ==============================================================================

-- Add stakeholder_type_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'stakeholder_type_id'
  ) THEN
    ALTER TABLE stakeholders 
    ADD COLUMN stakeholder_type_id INTEGER REFERENCES stakeholder_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for stakeholder_type_id
CREATE INDEX IF NOT EXISTS idx_stakeholders_type_id ON stakeholders(stakeholder_type_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_type_company ON stakeholders(stakeholder_type_id, company_id);

-- ==============================================================================
-- PART 4: UPDATE TRIGGERS
-- ==============================================================================

-- Add update trigger for stakeholder_types (assuming update_updated_at_column function exists)
DROP TRIGGER IF EXISTS update_stakeholder_types_updated_at ON stakeholder_types;
CREATE TRIGGER update_stakeholder_types_updated_at
  BEFORE UPDATE ON stakeholder_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on stakeholder_types table
ALTER TABLE stakeholder_types ENABLE ROW LEVEL SECURITY;

-- Users can view types from their company
CREATE POLICY "Users can view company stakeholder types" ON stakeholder_types
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Users with stakeholder process write permission can manage types
CREATE POLICY "Admins can manage stakeholder types" ON stakeholder_types
  FOR ALL
  USING (
    has_permission(auth.uid(), 'stakeholder_processes', 'can_write')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- ==============================================================================
-- PART 6: VERIFY COMPANY_ID IN ALL STAKEHOLDER TABLES
-- ==============================================================================

-- Verify stakeholder_processes has company_id (should already exist from refactor)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_processes' 
    AND column_name = 'company_id'
  ) THEN
    RAISE EXCEPTION 'stakeholder_processes table missing company_id column';
  END IF;
END $$;

-- Verify stakeholders has company_id (should already exist from refactor)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'company_id'
  ) THEN
    RAISE EXCEPTION 'stakeholders table missing company_id column';
  END IF;
END $$;

-- Verify stakeholder_step_data references stakeholder which has company_id
-- (No direct company_id needed as it's inherited from stakeholder relationship)

-- ==============================================================================
-- PART 7: SAMPLE DATA (Optional - commented out)
-- ==============================================================================

-- Uncomment to insert sample stakeholder types for testing
/*
INSERT INTO stakeholder_types (name, description, company_id, created_by) VALUES
  ('Client', 'External clients and customers', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)),
  ('Vendor', 'Suppliers and service providers', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)),
  ('Partner', 'Business partners and collaborators', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)),
  ('Investor', 'Financial stakeholders and investors', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1))
ON CONFLICT (name, company_id) DO NOTHING;
*/

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

COMMENT ON TABLE stakeholder_types IS 'Categorization system for stakeholders (e.g., Client, Vendor, Partner)';
COMMENT ON COLUMN stakeholder_types.company_id IS 'Company isolation - each company has its own stakeholder types';
COMMENT ON COLUMN stakeholders.stakeholder_type_id IS 'Optional categorization of stakeholder';
