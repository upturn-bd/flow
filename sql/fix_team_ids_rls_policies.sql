-- ==============================================================================
-- FIX TEAM_IDS RLS POLICIES - IMMEDIATE FIX
-- ==============================================================================
-- This script updates RLS policies to use team_ids (JSONB array) instead of 
-- the old team_id (integer) column.
--
-- Run this immediately to fix the "operator does not exist: integer #>> unknown" error
-- ==============================================================================

-- Step 1: Drop all existing policies on stakeholder_step_data
DROP POLICY IF EXISTS "Team members can write their step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can update their step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can read their step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Users can view all step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Users can view step data in their company" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can insert step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Team members can update step data" ON stakeholder_step_data;
DROP POLICY IF EXISTS "Admins can delete step data" ON stakeholder_step_data;

-- Step 2: Create helper function to check team membership with team_ids
CREATE OR REPLACE FUNCTION user_is_step_team_member(step_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Check if current user is a member of any team in the team_ids array
  SELECT EXISTS (
    SELECT 1
    FROM stakeholder_process_steps sps
    CROSS JOIN jsonb_array_elements_text(sps.team_ids) AS team_id
    INNER JOIN team_members tm 
      ON tm.team_id = team_id::INTEGER
    WHERE sps.id = step_id_param
      AND tm.employee_id = auth.uid()
  ) INTO is_member;
  
  RETURN COALESCE(is_member, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Create new RLS policies using team_ids

-- Policy for SELECT (read)
CREATE POLICY "Users can view step data in their company"
ON stakeholder_step_data
FOR SELECT
USING (
  -- User can read if they're in the same company as the stakeholder
  EXISTS (
    SELECT 1 
    FROM stakeholders s
    JOIN employees e ON e.id = auth.uid()
    WHERE s.id = stakeholder_step_data.stakeholder_id
      AND s.company_id = e.company_id
  )
);

-- Policy for INSERT (create)
CREATE POLICY "Team members can insert step data"
ON stakeholder_step_data
FOR INSERT
WITH CHECK (
  has_permission(auth.uid(), 'stakeholders', 'can_read')
  AND (
    -- User is member of any team assigned to this step
    user_is_step_team_member(step_id)
    OR
    -- Or has full write permission
    has_permission(auth.uid(), 'stakeholders', 'can_write')
  )
);

-- Policy for UPDATE
CREATE POLICY "Team members can update step data"
ON stakeholder_step_data
FOR UPDATE
USING (
  has_permission(auth.uid(), 'stakeholders', 'can_read')
  AND (
    user_is_step_team_member(step_id)
    OR
    has_permission(auth.uid(), 'stakeholders', 'can_write')
  )
)
WITH CHECK (
  has_permission(auth.uid(), 'stakeholders', 'can_read')
  AND (
    user_is_step_team_member(step_id)
    OR
    has_permission(auth.uid(), 'stakeholders', 'can_write')
  )
);

-- Policy for DELETE
CREATE POLICY "Admins can delete step data"
ON stakeholder_step_data
FOR DELETE
USING (
  has_permission(auth.uid(), 'stakeholders', 'can_delete')
);

-- Step 4: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'stakeholder_step_data'
ORDER BY policyname;
