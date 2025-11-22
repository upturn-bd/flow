-- ==============================================================================
-- MULTI-TEAM STEP ASSIGNMENT MIGRATION
-- ==============================================================================
-- This migration adds support for multiple teams to be assigned to a single
-- stakeholder process step.
-- 
-- Changes:
-- 1. Add team_ids JSONB array column to stakeholder_process_steps
-- 2. Migrate existing team_id data to team_ids array
-- 3. Keep team_id for backward compatibility (can be removed later)
-- 4. Update indexes for efficient querying
--
-- Author: Flow HRIS Team
-- Date: November 22, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: ADD TEAM_IDS COLUMN
-- ==============================================================================

-- Add team_ids column to stakeholder_process_steps table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_process_steps' 
    AND column_name = 'team_ids'
  ) THEN
    ALTER TABLE stakeholder_process_steps 
    ADD COLUMN team_ids JSONB DEFAULT '[]';
    
    COMMENT ON COLUMN stakeholder_process_steps.team_ids IS 
    'Array of team IDs assigned to this step. Format: [1, 2, 3]';
  END IF;
END $$;

-- ==============================================================================
-- PART 2: MIGRATE EXISTING DATA
-- ==============================================================================

-- Migrate existing team_id to team_ids array
-- Only update rows where team_ids is empty and team_id is not null
UPDATE stakeholder_process_steps 
SET team_ids = jsonb_build_array(team_id)
WHERE (team_ids = '[]' OR team_ids IS NULL) 
  AND team_id IS NOT NULL;

-- ==============================================================================
-- PART 3: CREATE INDEXES
-- ==============================================================================

-- Create GIN index for efficient querying of team_ids array
CREATE INDEX IF NOT EXISTS idx_stakeholder_process_steps_team_ids 
ON stakeholder_process_steps USING GIN (team_ids);

-- ==============================================================================
-- PART 4: HELPER FUNCTION FOR CHECKING TEAM MEMBERSHIP
-- ==============================================================================

-- Function to check if an employee has access to a step via any assigned team
CREATE OR REPLACE FUNCTION employee_has_step_access(
  employee_id_param UUID,
  step_id_param INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if employee is a member of any team assigned to the step
  SELECT EXISTS (
    SELECT 1
    FROM stakeholder_process_steps sps
    CROSS JOIN jsonb_array_elements(sps.team_ids) AS team_id
    INNER JOIN team_members tm 
      ON tm.team_id = (team_id #>> '{}')::INTEGER
    WHERE sps.id = step_id_param
      AND tm.employee_id = employee_id_param
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PART 5: NOTES FOR DEVELOPERS
-- ==============================================================================

-- MIGRATION NOTES:
-- 1. The team_id column is kept for backward compatibility
-- 2. team_ids is the new primary source of truth for team assignments
-- 3. When creating/updating steps, populate team_ids array
-- 4. The team_id column can be deprecated in a future migration
-- 5. All queries should now use team_ids instead of team_id
--
-- USAGE EXAMPLES:
-- 
-- Insert new step with multiple teams:
-- INSERT INTO stakeholder_process_steps (process_id, name, step_order, team_id, team_ids, ...)
-- VALUES (1, 'Review', 1, 5, '[5, 7, 9]', ...);
--
-- Query steps accessible to employee:
-- SELECT sps.* FROM stakeholder_process_steps sps
-- WHERE employee_has_step_access('employee-uuid', sps.id);
--
-- Update step to add teams:
-- UPDATE stakeholder_process_steps 
-- SET team_ids = '[1, 2, 3]'
-- WHERE id = 123;
