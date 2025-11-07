-- ==============================================================================
-- AUTO-ASSIGN NEW EMPLOYEES TO DEFAULT TEAM
-- ==============================================================================
-- This script creates a trigger that automatically adds new employees to their
-- company's default "Employees" team when:
-- 1. A new employee record is created with has_approval = 'ACCEPTED'
-- 2. An employee's approval status changes from PENDING/REJECTED to ACCEPTED
--
-- This ensures all approved employees have team membership and can access the app
-- ==============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS auto_assign_employee_to_team ON employees;
DROP FUNCTION IF EXISTS assign_employee_to_default_team();

-- Create function to assign employee to default team
CREATE OR REPLACE FUNCTION assign_employee_to_default_team()
RETURNS TRIGGER AS $$
DECLARE
  default_team_id INTEGER;
  team_name TEXT;
BEGIN
  -- Only process if employee has been approved
  IF NEW.has_approval = 'ACCEPTED' THEN
    -- Determine which default team to use based on role
    team_name := CASE 
      WHEN NEW.role = 'Admin' THEN 'Administrators'
      WHEN NEW.role = 'Manager' THEN 'Managers'
      ELSE 'Employees'
    END;

    -- Get the default team ID for this company and role
    SELECT id INTO default_team_id
    FROM teams
    WHERE company_id = NEW.company_id 
      AND name = team_name
      AND is_default = true
    LIMIT 1;

    -- If default team exists, add employee to it
    IF default_team_id IS NOT NULL THEN
      -- Insert team membership (ignore if already exists)
      INSERT INTO team_members (team_id, employee_id, added_by)
      VALUES (default_team_id, NEW.id, NEW.id)
      ON CONFLICT (team_id, employee_id) DO NOTHING;

      RAISE NOTICE '✅ Employee % automatically added to team % (company %)', 
        NEW.id, team_name, NEW.company_id;
    ELSE
      RAISE WARNING '⚠️ No default % team found for company %. Employee % not added to any team.', 
        team_name, NEW.company_id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when employee record is inserted or updated
CREATE TRIGGER auto_assign_employee_to_team
  AFTER INSERT OR UPDATE OF has_approval, role ON employees
  FOR EACH ROW
  WHEN (NEW.has_approval = 'ACCEPTED')
  EXECUTE FUNCTION assign_employee_to_default_team();

-- ==============================================================================
-- BACKFILL: Add any existing approved employees who aren't in teams yet
-- ==============================================================================

DO $$
DECLARE
  employee_record RECORD;
  default_team_id INTEGER;
  team_name TEXT;
  added_count INTEGER := 0;
BEGIN
  -- Find all approved employees who aren't in any team
  FOR employee_record IN 
    SELECT e.id, e.company_id, e.role, e.first_name, e.last_name
    FROM employees e
    LEFT JOIN team_members tm ON tm.employee_id = e.id
    WHERE e.has_approval = 'ACCEPTED'
      AND tm.id IS NULL
  LOOP
    -- Determine team based on role
    team_name := CASE 
      WHEN employee_record.role = 'Admin' THEN 'Administrators'
      WHEN employee_record.role = 'Manager' THEN 'Managers'
      ELSE 'Employees'
    END;

    -- Get default team for this company
    SELECT id INTO default_team_id
    FROM teams
    WHERE company_id = employee_record.company_id 
      AND name = team_name
      AND is_default = true
    LIMIT 1;

    -- Add to team if found
    IF default_team_id IS NOT NULL THEN
      INSERT INTO team_members (team_id, employee_id, added_by)
      VALUES (default_team_id, employee_record.id, employee_record.id)
      ON CONFLICT (team_id, employee_id) DO NOTHING;

      added_count := added_count + 1;
      RAISE NOTICE '✅ Backfilled: Added % % (%) to % team', 
        employee_record.first_name, employee_record.last_name, employee_record.id, team_name;
    ELSE
      RAISE WARNING '⚠️ No default % team for company %. Skipping employee % %',
        team_name, employee_record.company_id, employee_record.first_name, employee_record.last_name;
    END IF;
  END LOOP;

  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ Backfill complete: Added % employees to teams', added_count;
  RAISE NOTICE '===============================================';
END $$;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

SELECT '===============================================' as divider;
SELECT '✅ AUTO-ASSIGN TRIGGER SETUP COMPLETE!' as status;
SELECT '===============================================' as divider;

-- Show employees without team membership (should be empty or only PENDING/REJECTED)
SELECT 
  'Employees without team membership:' as info;

SELECT 
  e.id,
  e.first_name,
  e.last_name,
  e.email,
  e.role,
  e.has_approval,
  e.company_id
FROM employees e
LEFT JOIN team_members tm ON tm.employee_id = e.id
WHERE tm.id IS NULL
ORDER BY e.has_approval, e.company_id;

SELECT '===============================================' as divider;
SELECT '🎉 All new approved employees will now automatically join their default team!' as message;
SELECT '===============================================' as divider;
