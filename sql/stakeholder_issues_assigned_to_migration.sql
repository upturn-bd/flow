-- ==============================================================================
-- STAKEHOLDER ISSUES ASSIGNED_TO MIGRATION
-- ==============================================================================
-- Adds assigned_to field to stakeholder_issues table for individual issue assignment
-- Removes deprecated issue_handler_id from stakeholders table
-- Author: Flow HRIS Team
-- Date: November 4, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: ADD ASSIGNED_TO TO STAKEHOLDER_ISSUES TABLE
-- ==============================================================================

-- Add assigned_to column to stakeholder_issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN assigned_to UUID REFERENCES employees(id);
    COMMENT ON COLUMN stakeholder_issues.assigned_to IS 'Employee assigned to handle this specific issue';
  END IF;
END $$;

-- Create index for assigned_to
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_assigned_to ON stakeholder_issues(assigned_to);

-- Create compound index for filtering issues by assigned employee and company
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_assigned_company ON stakeholder_issues(assigned_to, company_id);

-- ==============================================================================
-- PART 2: MIGRATE EXISTING DATA (IF ANY)
-- ==============================================================================

-- Migrate existing issues to use assigned_to from stakeholder's issue_handler_id
-- This is a one-time migration for existing data
DO $$
BEGIN
  -- Only migrate if issue_handler_id exists in stakeholders table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'issue_handler_id'
  ) THEN
    UPDATE stakeholder_issues si
    SET assigned_to = s.issue_handler_id
    FROM stakeholders s
    WHERE si.stakeholder_id = s.id
      AND si.assigned_to IS NULL
      AND s.issue_handler_id IS NOT NULL;
  END IF;
END $$;

-- ==============================================================================
-- PART 3: DEPRECATE ISSUE_HANDLER_ID FROM STAKEHOLDERS (OPTIONAL CLEANUP)
-- ==============================================================================

-- Note: We're NOT dropping the issue_handler_id column from stakeholders as it's been
-- renamed to kam_id (Key Account Manager). The KAM manages the overall stakeholder
-- relationship, while individual issues are assigned to specific employees via assigned_to.

COMMENT ON TABLE stakeholder_issues IS 'Issue tracking/ticketing system for stakeholders - issues are assigned to individual employees';

-- ==============================================================================
-- PART 4: UPDATE RLS POLICIES FOR ASSIGNED_TO FILTERING
-- ==============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS stakeholder_issues_select_policy ON stakeholder_issues;
DROP POLICY IF EXISTS stakeholder_issues_insert_policy ON stakeholder_issues;
DROP POLICY IF EXISTS stakeholder_issues_update_policy ON stakeholder_issues;
DROP POLICY IF EXISTS stakeholder_issues_delete_policy ON stakeholder_issues;

-- Policy: Users can view issues in their company OR issues assigned to them
CREATE POLICY stakeholder_issues_select_policy ON stakeholder_issues
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert issues for stakeholders in their company
CREATE POLICY stakeholder_issues_insert_policy ON stakeholder_issues
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: Users can update issues in their company OR issues assigned to them
CREATE POLICY stakeholder_issues_update_policy ON stakeholder_issues
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete issues in their company (typically admin only)
CREATE POLICY stakeholder_issues_delete_policy ON stakeholder_issues
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );
