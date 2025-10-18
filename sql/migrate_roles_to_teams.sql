-- ==============================================================================
-- Data Migration Script: Roles to Teams
-- ==============================================================================
-- This script migrates existing role-based users (Admin, Manager, Employee)
-- to the new team-based permissions system.
--
-- Prerequisites:
-- - teams_permissions_system.sql must be run first
-- - Backup database before running this script
--
-- Author: Flow HRIS Team
-- Date: 2025-10-16
-- Version: 1.0
-- ==============================================================================

-- ==============================================================================
-- 1. Create Default Teams for Each Company
-- ==============================================================================

-- Create Administrators team for each company
INSERT INTO teams (name, description, company_id, is_default, created_by)
SELECT 
  'Administrators',
  'Full system access with all permissions',
  c.id AS company_id,
  true,
  (SELECT id FROM employees WHERE company_id = c.id AND role = 'Admin' LIMIT 1)
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM teams WHERE name = 'Administrators' AND company_id = c.id
);

-- Create Managers team for each company
INSERT INTO teams (name, description, company_id, is_default, created_by)
SELECT 
  'Managers',
  'Management access with approval permissions',
  c.id AS company_id,
  true,
  (SELECT id FROM employees WHERE company_id = c.id AND role = 'Admin' LIMIT 1)
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM teams WHERE name = 'Managers' AND company_id = c.id
);

-- Create Employees team for each company
INSERT INTO teams (name, description, company_id, is_default, created_by)
SELECT 
  'Employees',
  'Standard employee access',
  c.id AS company_id,
  true,
  (SELECT id FROM employees WHERE company_id = c.id AND role = 'Admin' LIMIT 1)
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM teams WHERE name = 'Employees' AND company_id = c.id
);

-- ==============================================================================
-- 2. Assign Permissions to Default Teams
-- ==============================================================================

-- Helper function to assign all permissions to a team
CREATE OR REPLACE FUNCTION assign_team_permissions(
  team_name_param VARCHAR,
  read_perms VARCHAR[],
  write_perms VARCHAR[],
  delete_perms VARCHAR[],
  approve_perms VARCHAR[],
  comment_perms VARCHAR[]
)
RETURNS VOID AS $$
DECLARE
  team_record RECORD;
  perm_record RECORD;
BEGIN
  -- Loop through all teams with the given name
  FOR team_record IN 
    SELECT id, company_id FROM teams WHERE name = team_name_param
  LOOP
    -- Loop through all permissions
    FOR perm_record IN SELECT id, module_name FROM permissions
    LOOP
      INSERT INTO team_permissions (
        team_id,
        permission_id,
        can_read,
        can_write,
        can_delete,
        can_approve,
        can_comment
      ) VALUES (
        team_record.id,
        perm_record.id,
        perm_record.module_name = ANY(read_perms),
        perm_record.module_name = ANY(write_perms),
        perm_record.module_name = ANY(delete_perms),
        perm_record.module_name = ANY(approve_perms),
        perm_record.module_name = ANY(comment_perms)
      )
      ON CONFLICT (team_id, permission_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2a. Administrators Team Permissions
-- ==============================================================================
-- Full access to everything

DO $$
DECLARE
  all_modules VARCHAR[] := ARRAY[
    'tasks', 'projects', 'milestones',
    'attendance', 'leave', 'notice', 'requisition', 'settlement', 'complaints', 'payroll', 'stakeholders',
    'onboarding', 'offboarding', 'hris',
    'admin_config', 'departments', 'divisions', 'grades', 'positions', 'company_logs', 'teams'
  ];
BEGIN
  PERFORM assign_team_permissions(
    'Administrators',
    all_modules,  -- can_read
    all_modules,  -- can_write
    all_modules,  -- can_delete
    ARRAY['leave', 'requisition', 'settlement', 'complaints', 'onboarding', 'offboarding'],  -- can_approve
    all_modules   -- can_comment
  );
END $$;

-- ==============================================================================
-- 2b. Managers Team Permissions
-- ==============================================================================
-- Read/Write/Comment on workflow and services
-- Approve on specific modules
-- Read-only on admin modules

DO $$
BEGIN
  PERFORM assign_team_permissions(
    'Managers',
    -- can_read: All modules
    ARRAY['tasks', 'projects', 'milestones', 'attendance', 'leave', 'notice', 'requisition', 'settlement', 'complaints', 'payroll', 'stakeholders', 'onboarding', 'offboarding', 'hris', 'admin_config', 'departments', 'divisions', 'grades', 'positions', 'company_logs'],
    -- can_write: Workflow, services, and operations
    ARRAY['tasks', 'projects', 'milestones', 'attendance', 'leave', 'notice', 'requisition', 'settlement', 'complaints', 'stakeholders', 'onboarding', 'offboarding', 'hris'],
    -- can_delete: Workflow and some services
    ARRAY['tasks', 'projects', 'milestones', 'notice'],
    -- can_approve: Key approval workflows
    ARRAY['leave', 'requisition', 'settlement', 'complaints', 'onboarding'],
    -- can_comment: All workflow and services
    ARRAY['tasks', 'projects', 'milestones', 'attendance', 'leave', 'notice', 'requisition', 'settlement', 'complaints', 'payroll', 'stakeholders', 'onboarding', 'offboarding', 'hris']
  );
END $$;

-- ==============================================================================
-- 2c. Employees Team Permissions
-- ==============================================================================
-- Basic access for standard employees

DO $$
BEGIN
  PERFORM assign_team_permissions(
    'Employees',
    -- can_read: Workflow, services, own HRIS data
    ARRAY['tasks', 'projects', 'milestones', 'attendance', 'leave', 'notice', 'requisition', 'settlement', 'complaints', 'payroll', 'hris'],
    -- can_write: Own tasks, requests, and attendance
    ARRAY['tasks', 'attendance', 'leave', 'requisition', 'settlement', 'complaints'],
    -- can_delete: Own tasks only
    ARRAY['tasks'],
    -- can_approve: None
    ARRAY[]::VARCHAR[],
    -- can_comment: Workflow modules
    ARRAY['tasks', 'projects', 'milestones']
  );
END $$;

-- ==============================================================================
-- 3. Migrate Existing Users to Teams
-- ==============================================================================

-- Migrate Admin users to Administrators team
INSERT INTO team_members (team_id, employee_id, added_by)
SELECT 
  t.id AS team_id,
  e.id AS employee_id,
  e.id AS added_by  -- Self-added during migration
FROM employees e
JOIN teams t ON t.company_id = e.company_id AND t.name = 'Administrators'
WHERE e.role = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = t.id AND tm.employee_id = e.id
  );

-- Migrate Manager users to Managers team
INSERT INTO team_members (team_id, employee_id, added_by)
SELECT 
  t.id AS team_id,
  e.id AS employee_id,
  (SELECT id FROM employees WHERE company_id = e.company_id AND role = 'Admin' LIMIT 1) AS added_by
FROM employees e
JOIN teams t ON t.company_id = e.company_id AND t.name = 'Managers'
WHERE e.role = 'Manager'
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = t.id AND tm.employee_id = e.id
  );

-- Migrate Employee users to Employees team
INSERT INTO team_members (team_id, employee_id, added_by)
SELECT 
  t.id AS team_id,
  e.id AS employee_id,
  (SELECT id FROM employees WHERE company_id = e.company_id AND role = 'Admin' LIMIT 1) AS added_by
FROM employees e
JOIN teams t ON t.company_id = e.company_id AND t.name = 'Employees'
WHERE e.role = 'Employee'
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = t.id AND tm.employee_id = e.id
  );

-- ==============================================================================
-- 4. Add Migration Tracking Column (Optional - for rollback support)
-- ==============================================================================

-- Add a column to track migration status
ALTER TABLE employees ADD COLUMN IF NOT EXISTS migrated_to_teams BOOLEAN DEFAULT FALSE;

-- Mark all migrated users
UPDATE employees e
SET migrated_to_teams = TRUE
WHERE EXISTS (
  SELECT 1 FROM team_members tm WHERE tm.employee_id = e.id
);

-- ==============================================================================
-- 5. Create Migration Report View
-- ==============================================================================

CREATE OR REPLACE VIEW migration_report AS
SELECT 
  c.name AS company_name,
  e.role AS old_role,
  COUNT(*) AS user_count,
  COUNT(CASE WHEN e.migrated_to_teams THEN 1 END) AS migrated_count,
  COUNT(CASE WHEN NOT e.migrated_to_teams THEN 1 END) AS pending_count
FROM employees e
JOIN companies c ON c.id = e.company_id
GROUP BY c.name, e.role
ORDER BY c.name, e.role;

-- ==============================================================================
-- 6. Verification Queries
-- ==============================================================================

-- Check that all users have been assigned to teams
SELECT 
  'Users without team assignments' AS check_name,
  COUNT(*) AS count
FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm WHERE tm.employee_id = e.id
)
AND e.has_approval = 'ACCEPTED';

-- Check that all default teams have permissions
SELECT 
  'Teams without permissions' AS check_name,
  COUNT(*) AS count
FROM teams t
WHERE t.is_default = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM team_permissions tp WHERE tp.team_id = t.id
  );

-- Show migration summary
SELECT * FROM migration_report;

-- ==============================================================================
-- 7. Rollback Script (USE WITH CAUTION)
-- ==============================================================================

-- To rollback this migration, run:
-- DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE is_default = TRUE);
-- DELETE FROM team_permissions WHERE team_id IN (SELECT id FROM teams WHERE is_default = TRUE);
-- DELETE FROM teams WHERE is_default = TRUE;
-- UPDATE employees SET migrated_to_teams = FALSE;
-- DROP FUNCTION IF EXISTS assign_team_permissions(VARCHAR, VARCHAR[], VARCHAR[], VARCHAR[], VARCHAR[], VARCHAR[]);
-- DROP VIEW IF EXISTS migration_report;

-- ==============================================================================
-- Migration Complete
-- ==============================================================================

COMMENT ON VIEW migration_report IS 'Summary of role-to-team migration status per company';
COMMENT ON FUNCTION assign_team_permissions IS 'Helper function to bulk assign permissions to teams (used during migration)';

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Team-Based Permissions Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Default teams created for all companies';
  RAISE NOTICE 'Permissions assigned to default teams';
  RAISE NOTICE 'Users migrated to appropriate teams';
  RAISE NOTICE '';
  RAISE NOTICE 'Run: SELECT * FROM migration_report; to see summary';
  RAISE NOTICE '========================================';
END $$;
