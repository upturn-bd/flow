-- ==============================================================================
-- STAKEHOLDER ISSUES CHECKER TEAM AND REQUIRED FIELDS MIGRATION
-- ==============================================================================
-- Adds checker team for issue verification/approval after resolution
-- Adds required_fields for key-value pairs that must be filled before resolution
-- Author: Flow HRIS Team
-- Date: December 10, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: ADD CHECKER TEAM TO STAKEHOLDER_ISSUES TABLE
-- ==============================================================================

-- Add checker_team_id column to stakeholder_issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'checker_team_id'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN checker_team_id INTEGER REFERENCES teams(id);
    COMMENT ON COLUMN stakeholder_issues.checker_team_id IS 'Team assigned to verify and approve the issue resolution';
  END IF;
END $$;

-- Create index for checker_team_id
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_checker_team_id ON stakeholder_issues(checker_team_id);

-- ==============================================================================
-- PART 2: ADD CHECKER APPROVAL STATUS COLUMNS
-- ==============================================================================

-- Add status column for tracking if issue is pending checker approval
DO $$ 
BEGIN
  -- Add is_pending_checker_approval column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'is_pending_checker_approval'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN is_pending_checker_approval BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN stakeholder_issues.is_pending_checker_approval IS 'True when assigned entity has marked as resolved but checker team has not yet approved';
  END IF;
  
  -- Add checker_approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'checker_approved_at'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN checker_approved_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN stakeholder_issues.checker_approved_at IS 'Timestamp when the checker team approved the resolution';
  END IF;
  
  -- Add checker_approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'checker_approved_by'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN checker_approved_by UUID REFERENCES employees(id);
    COMMENT ON COLUMN stakeholder_issues.checker_approved_by IS 'Employee from checker team who approved the resolution';
  END IF;
  
  -- Add checker_rejection_reason column for when checker rejects
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'checker_rejection_reason'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN checker_rejection_reason TEXT;
    COMMENT ON COLUMN stakeholder_issues.checker_rejection_reason IS 'Reason provided by checker team when rejecting the resolution';
  END IF;
END $$;

-- Create compound index for filtering issues pending checker approval
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_pending_approval ON stakeholder_issues(is_pending_checker_approval, checker_team_id) WHERE is_pending_checker_approval = TRUE;

-- ==============================================================================
-- PART 3: ADD REQUIRED FIELDS FOR RESOLUTION
-- ==============================================================================

-- Add required_fields column (JSONB array of key-value field definitions)
-- Format: [{"key": "final_price", "label": "Final Price", "type": "number", "required": true, "value": null}, ...]
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'required_fields'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN required_fields JSONB DEFAULT '[]';
    COMMENT ON COLUMN stakeholder_issues.required_fields IS 'JSONB array of required field definitions that must be filled before resolution. Each field has key, label, type (text/number/date/select), required boolean, value, and options (for select type)';
  END IF;
END $$;

-- Create GIN index for efficient querying of required_fields
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_required_fields ON stakeholder_issues USING GIN (required_fields);

-- ==============================================================================
-- PART 4: UPDATE STATUS CHECK CONSTRAINT
-- ==============================================================================

-- First, drop the old constraint if it exists
DO $$
BEGIN
  ALTER TABLE stakeholder_issues DROP CONSTRAINT IF EXISTS stakeholder_issues_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new status constraint that includes 'Pending Approval' status
ALTER TABLE stakeholder_issues ADD CONSTRAINT stakeholder_issues_status_check 
  CHECK (status IN ('Pending', 'In Progress', 'Pending Approval', 'Resolved'));

-- ==============================================================================
-- PART 5: ADD COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON TABLE stakeholder_issues IS 'Issue tracking/ticketing system for stakeholders with checker team approval workflow and required fields before resolution';

