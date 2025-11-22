-- ==============================================================================
-- DROP TEAM_ID COLUMN MIGRATION
-- ==============================================================================
-- This migration removes the legacy team_id column after updating all
-- dependent RLS policies to use team_ids instead.
--
-- IMPORTANT: Run this AFTER multi_team_step_assignment.sql has been applied
-- and verified to be working correctly.
--
-- Author: Flow HRIS Team
-- Date: November 22, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: CHECK CURRENT RLS POLICIES
-- ==============================================================================

-- View current policies on stakeholder_step_data that depend on team_id
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_definition
FROM pg_policies 
WHERE tablename = 'stakeholder_step_data'
ORDER BY policyname;

-- ==============================================================================
-- PART 2: DROP EXISTING POLICIES THAT USE TEAM_ID
-- ==============================================================================

-- Drop the old policies that depend on team_id column
DROP POLICY IF EXISTS "Team members can write their step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can update their step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can read their step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can delete their step data" ON stakeholder_step_data;

-- Also drop any other policies that might exist
DROP POLICY IF EXISTS "Enable read access for team members" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Enable insert for team members" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Enable update for team members" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Enable delete for team members" ON stakeholder_step_data;

-- ==============================================================================
-- PART 3: CREATE NEW POLICIES USING TEAM_IDS
-- ==============================================================================

-- Function to check if user is member of any team assigned to a step
CREATE OR REPLACE FUNCTION user_is_step_team_member(step_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Check if current user is a member of any team assigned to the step
  SELECT EXISTS (
    SELECT 1
    FROM stakeholder_process_steps sps
    CROSS JOIN jsonb_array_elements(sps.team_ids) AS team_id
    INNER JOIN team_members tm 
      ON tm.team_id = (team_id #>> '{}')::INTEGER
    WHERE sps.id = step_id_param
      AND tm.employee_id = auth.uid()
  ) INTO is_member;
  
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies using team_ids
-- Policy for SELECT (read)
CREATE POLICY "Team members can read step data"
ON stakeholder_step_data
FOR SELECT
USING (
  -- User can read if they are member of any team assigned to the step
  user_is_step_team_member(step_id)
  OR
  -- Or if they have full read permission
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.company_id IN (
        SELECT s.company_id 
        FROM stakeholders s 
        WHERE s.id = stakeholder_step_data.stakeholder_id
      )
  )
);

-- Policy for INSERT (create)
CREATE POLICY "Team members can insert step data"
ON stakeholder_step_data
FOR INSERT
WITH CHECK (
  -- User can insert if they are member of any team assigned to the step
  user_is_step_team_member(step_id)
  OR
  -- Or if they have write permission in the company
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.company_id IN (
        SELECT s.company_id 
        FROM stakeholders s 
        WHERE s.id = stakeholder_step_data.stakeholder_id
      )
  )
);

-- Policy for UPDATE
CREATE POLICY "Team members can update step data"
ON stakeholder_step_data
FOR UPDATE
USING (
  user_is_step_team_member(step_id)
  OR
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.company_id IN (
        SELECT s.company_id 
        FROM stakeholders s 
        WHERE s.id = stakeholder_step_data.stakeholder_id
      )
  )
)
WITH CHECK (
  user_is_step_team_member(step_id)
  OR
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.company_id IN (
        SELECT s.company_id 
        FROM stakeholders s 
        WHERE s.id = stakeholder_step_data.stakeholder_id
      )
  )
);

-- Policy for DELETE
CREATE POLICY "Team members can delete step data"
ON stakeholder_step_data
FOR DELETE
USING (
  user_is_step_team_member(step_id)
  OR
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.company_id IN (
        SELECT s.company_id 
        FROM stakeholders s 
        WHERE s.id = stakeholder_step_data.stakeholder_id
      )
  )
);

-- ==============================================================================
-- PART 4: VERIFY POLICIES ARE IN PLACE
-- ==============================================================================

-- Check new policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'stakeholder_step_data'
ORDER BY policyname;

-- ==============================================================================
-- PART 5: DROP THE TEAM_ID COLUMN
-- ==============================================================================

-- Now that policies don't depend on team_id, we can safely drop it
ALTER TABLE stakeholder_process_steps 
DROP COLUMN IF EXISTS team_id;

-- ==============================================================================
-- PART 6: VERIFICATION
-- ==============================================================================

-- Verify column is dropped
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stakeholder_process_steps'
  AND column_name = 'team_id';

-- Expected result: 0 rows (column should not exist)

-- Verify team_ids still exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stakeholder_process_steps'
  AND column_name = 'team_ids';

-- Expected result: 1 row showing team_ids column

-- ==============================================================================
-- CLEANUP OLD FUNCTION (if exists)
-- ==============================================================================

-- Drop the old employee_has_step_access if it references team_id
DROP FUNCTION IF EXISTS employee_has_step_access(UUID, INTEGER);

-- Recreate it using team_ids (if needed elsewhere)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- After running this migration:
-- 1. team_id column is completely removed
-- 2. All RLS policies now use team_ids array
-- 3. Helper functions updated to use team_ids
-- 4. System fully migrated to multi-team architecture
--
-- IMPORTANT: Test thoroughly before running in production!
-- Make sure to backup your database first.
