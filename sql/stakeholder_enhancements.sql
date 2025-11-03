-- ==============================================================================
-- STAKEHOLDER ENHANCEMENTS MIGRATION
-- ==============================================================================
-- This migration adds new field types and features to the stakeholder system:
-- 1. Geolocation, Dropdown, and Multi-select field types
-- 2. KAM (Key Accounts Manager) - renamed from issue_handler
-- 3. Parent Stakeholder relationships
-- 4. Rejection capability in process steps
-- 5. Status system (Lead, Permanent, Rejected)
--
-- Author: Flow HRIS Team
-- Date: November 3, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: ADD PARENT STAKEHOLDER FIELD
-- ==============================================================================

-- Add parent_stakeholder_id to stakeholders table for hierarchical relationships
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'parent_stakeholder_id'
  ) THEN
    ALTER TABLE stakeholders 
    ADD COLUMN parent_stakeholder_id INTEGER REFERENCES stakeholders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for parent stakeholder lookups
CREATE INDEX IF NOT EXISTS idx_stakeholders_parent_id ON stakeholders(parent_stakeholder_id);

-- ==============================================================================
-- PART 2: RENAME ISSUE_HANDLER TO KAM (KEY ACCOUNTS MANAGER)
-- ==============================================================================

-- Rename issue_handler_id to kam_id (if issue_handler_id exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'issue_handler_id'
  ) THEN
    -- Rename the column
    ALTER TABLE stakeholders RENAME COLUMN issue_handler_id TO kam_id;
    
    -- Drop old index if exists
    DROP INDEX IF EXISTS idx_stakeholders_issue_handler_id;
    
    -- Create new index
    CREATE INDEX IF NOT EXISTS idx_stakeholders_kam_id ON stakeholders(kam_id);
  ELSE
    -- If column doesn't exist, create it
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stakeholders' 
      AND column_name = 'kam_id'
    ) THEN
      ALTER TABLE stakeholders ADD COLUMN kam_id UUID REFERENCES employees(id);
      CREATE INDEX IF NOT EXISTS idx_stakeholders_kam_id ON stakeholders(kam_id);
    END IF;
  END IF;
END $$;

-- ==============================================================================
-- PART 3: ADD STATUS FIELD TO STAKEHOLDERS
-- ==============================================================================

-- Add status field with three states: Lead, Permanent, Rejected
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE stakeholders 
    ADD COLUMN status VARCHAR(50) DEFAULT 'Lead' 
    CHECK (status IN ('Lead', 'Permanent', 'Rejected'));
  END IF;
END $$;

-- Migrate existing data: completed stakeholders → Permanent, others → Lead
UPDATE stakeholders 
SET status = CASE 
  WHEN is_completed = TRUE THEN 'Permanent'
  ELSE 'Lead'
END
WHERE status IS NULL;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_stakeholders_status ON stakeholders(status);
CREATE INDEX IF NOT EXISTS idx_stakeholders_status_company ON stakeholders(status, company_id);

-- ==============================================================================
-- PART 4: ADD REJECTION FIELDS TO STAKEHOLDERS
-- ==============================================================================

-- Add rejection tracking fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE stakeholders ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE stakeholders ADD COLUMN rejected_by UUID REFERENCES employees(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE stakeholders ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- ==============================================================================
-- PART 5: ADD REJECTION CAPABILITY TO PROCESS STEPS
-- ==============================================================================

-- Add can_reject flag to stakeholder_process_steps
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_process_steps' 
    AND column_name = 'can_reject'
  ) THEN
    ALTER TABLE stakeholder_process_steps 
    ADD COLUMN can_reject BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ==============================================================================
-- PART 6: UPDATE TRIGGERS FOR AUTO-STATUS MANAGEMENT
-- ==============================================================================

-- Function to auto-update stakeholder status based on completion
CREATE OR REPLACE FUNCTION update_stakeholder_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if not already rejected
  IF NEW.status != 'Rejected' THEN
    IF NEW.is_completed = TRUE THEN
      NEW.status = 'Permanent';
    ELSE
      NEW.status = 'Lead';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_stakeholder_status ON stakeholders;

-- Create trigger to auto-update status based on completion
CREATE TRIGGER trigger_update_stakeholder_status
  BEFORE UPDATE OF is_completed ON stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholder_status();

-- ==============================================================================
-- PART 7: FUNCTION TO REJECT STAKEHOLDER
-- ==============================================================================

-- Function to handle stakeholder rejection
CREATE OR REPLACE FUNCTION reject_stakeholder(
  p_stakeholder_id INTEGER,
  p_rejected_by UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE stakeholders
  SET 
    status = 'Rejected',
    rejected_at = NOW(),
    rejected_by = p_rejected_by,
    rejection_reason = p_rejection_reason,
    is_active = FALSE
  WHERE id = p_stakeholder_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PART 8: UPDATE COMMENTS
-- ==============================================================================

COMMENT ON COLUMN stakeholders.kam_id IS 'Key Accounts Manager - Employee assigned to handle stakeholder communications and issues';
COMMENT ON COLUMN stakeholders.parent_stakeholder_id IS 'Parent stakeholder for hierarchical relationships (e.g., subsidiary companies)';
COMMENT ON COLUMN stakeholders.status IS 'Stakeholder status: Lead (incomplete), Permanent (all steps completed), Rejected';
COMMENT ON COLUMN stakeholders.rejected_at IS 'Timestamp when stakeholder was rejected';
COMMENT ON COLUMN stakeholders.rejected_by IS 'Employee who rejected the stakeholder';
COMMENT ON COLUMN stakeholders.rejection_reason IS 'Reason for stakeholder rejection';
COMMENT ON COLUMN stakeholder_process_steps.can_reject IS 'Whether team members can reject stakeholders at this step';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Note: Field types (geolocation, dropdown, multi_select) are stored in the
-- field_definitions JSONB column and don't require schema changes.
-- The application layer will handle these new field types.
