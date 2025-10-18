-- ==============================================================================
-- COMPLETE TEAM-BASED PERMISSIONS SETUP
-- ==============================================================================
-- This is the ONLY script you need to set up the team-based permissions system
-- Run this on a fresh database or it will preserve existing data
--
-- What this does:
-- 1. Creates all necessary tables (teams, team_members, permissions, team_permissions)
-- 2. Sets up RLS policies (fixed for circular dependencies)
-- 3. Seeds permissions data
-- 4. Creates default teams for each company
-- 5. Migrates existing role-based users to teams
-- 6. Creates helper functions
--
-- Author: Flow HRIS Team
-- Date: 2025-10-18
-- Version: 2.0 (Fixed RLS circular dependencies)
-- ==============================================================================

-- ==============================================================================
-- PART 1: CREATE TABLES
-- ==============================================================================

-- 1.1 Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  CONSTRAINT unique_team_name_per_company UNIQUE(name, company_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_is_default ON teams(is_default);

-- 1.2 Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES employees(id),
  CONSTRAINT unique_team_membership UNIQUE(team_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_added_by ON team_members(added_by);

-- 1.3 Permissions Table (Master List)
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('workflow', 'services', 'operations', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_module_name ON permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- 1.4 Team Permissions Table
CREATE TABLE IF NOT EXISTS team_permissions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  can_read BOOLEAN DEFAULT FALSE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_approve BOOLEAN DEFAULT FALSE,
  can_comment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_team_permission UNIQUE(team_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_team_permissions_team_id ON team_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_permissions_permission_id ON team_permissions(permission_id);

-- ==============================================================================
-- PART 2: SEED PERMISSIONS DATA
-- ==============================================================================

INSERT INTO permissions (module_name, display_name, description, category) VALUES
  -- Workflow modules
  ('tasks', 'Tasks', 'Task management and tracking', 'workflow'),
  ('projects', 'Projects', 'Project planning and execution', 'workflow'),
  ('milestones', 'Milestones', 'Project milestone tracking', 'workflow'),
  
  -- Services modules
  ('attendance', 'Attendance', 'Check-in and check-out tracking', 'services'),
  ('leave', 'Leave', 'Leave application and approval', 'services'),
  ('notice', 'Notice', 'Company announcements and notices', 'services'),
  ('requisition', 'Requisition', 'Asset and resource requests', 'services'),
  ('settlement', 'Settlement', 'Expense claims and settlements', 'services'),
  ('complaints', 'Complaints', 'Workplace complaint management', 'services'),
  ('payroll', 'Payroll', 'Salary and payroll information', 'services'),
  ('stakeholders', 'Stakeholders', 'External stakeholder management', 'services'),
  
  -- Operations modules
  ('onboarding', 'Onboarding', 'New employee onboarding process', 'operations'),
  ('offboarding', 'Offboarding', 'Employee exit process', 'operations'),
  ('hris', 'HRIS', 'Employee information management', 'operations'),
  
  -- Admin modules
  ('admin_config', 'Admin Configuration', 'Company settings and configuration', 'admin'),
  ('departments', 'Departments', 'Department management', 'admin'),
  ('divisions', 'Divisions', 'Division management', 'admin'),
  ('grades', 'Grades', 'Grade and level management', 'admin'),
  ('positions', 'Positions', 'Position and role management', 'admin'),
  ('company_logs', 'Company Logs', 'System audit trails and logs', 'admin'),
  ('teams', 'Team Management', 'Team and permission management', 'admin')
ON CONFLICT (module_name) DO NOTHING;

-- ==============================================================================
-- PART 3: CREATE HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS)
-- ==============================================================================

-- 3.1 Function to check if user can manage teams
CREATE OR REPLACE FUNCTION user_can_manage_teams(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  can_manage BOOLEAN;
BEGIN
  SELECT bool_or(tp.can_write) INTO can_manage
  FROM team_members tm
  JOIN team_permissions tp ON tp.team_id = tm.team_id
  JOIN permissions p ON p.id = tp.permission_id
  WHERE tm.employee_id = user_id
    AND p.module_name = 'teams';
  
  RETURN COALESCE(can_manage, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_can_manage_teams(UUID) TO authenticated;

-- 3.2 Function to check if user can delete teams
CREATE OR REPLACE FUNCTION user_can_delete_teams(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  can_del BOOLEAN;
BEGIN
  SELECT bool_or(tp.can_delete) INTO can_del
  FROM team_members tm
  JOIN team_permissions tp ON tp.team_id = tm.team_id
  JOIN permissions p ON p.id = tp.permission_id
  WHERE tm.employee_id = user_id
    AND p.module_name = 'teams';
  
  RETURN COALESCE(can_del, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_can_delete_teams(UUID) TO authenticated;

-- 3.3 Function to check specific permission (used by middleware)
CREATE OR REPLACE FUNCTION has_permission(
    user_id UUID,
    module VARCHAR,
    action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT bool_or(
        CASE 
            WHEN action = 'can_read' THEN tp.can_read
            WHEN action = 'can_write' THEN tp.can_write
            WHEN action = 'can_delete' THEN tp.can_delete
            WHEN action = 'can_approve' THEN tp.can_approve
            WHEN action = 'can_comment' THEN tp.can_comment
            ELSE false
        END
    ) INTO has_perm
    FROM team_members tm
    JOIN team_permissions tp ON tm.team_id = tp.team_id
    JOIN permissions p ON tp.permission_id = p.id
    WHERE tm.employee_id = user_id
    AND p.module_name = module;
    
    RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_permission(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(UUID, VARCHAR, VARCHAR) TO anon;

-- 3.4 Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE (
  module_name VARCHAR(100),
  can_read BOOLEAN,
  can_write BOOLEAN,
  can_delete BOOLEAN,
  can_approve BOOLEAN,
  can_comment BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.module_name,
    MAX(tp.can_read::int)::boolean AS can_read,
    MAX(tp.can_write::int)::boolean AS can_write,
    MAX(tp.can_delete::int)::boolean AS can_delete,
    MAX(tp.can_approve::int)::boolean AS can_approve,
    MAX(tp.can_comment::int)::boolean AS can_comment
  FROM team_members tm
  JOIN team_permissions tp ON tp.team_id = tm.team_id
  JOIN permissions p ON p.id = tp.permission_id
  WHERE tm.employee_id = user_id
  GROUP BY p.module_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;

-- ==============================================================================
-- PART 4: SETUP RLS POLICIES (Fixed for circular dependencies)
-- ==============================================================================

-- 4.1 Teams Table RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view company teams" ON teams;
CREATE POLICY "Employees can view company teams" ON teams
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create teams" ON teams;
CREATE POLICY "Admins can create teams" ON teams
  FOR INSERT
  WITH CHECK (
    user_can_manage_teams(auth.uid())
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update teams" ON teams;
CREATE POLICY "Admins can update teams" ON teams
  FOR UPDATE
  USING (user_can_manage_teams(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete teams" ON teams;
CREATE POLICY "Admins can delete teams" ON teams
  FOR DELETE
  USING (user_can_delete_teams(auth.uid()));

-- 4.2 Team Members Table RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view team members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;
DROP POLICY IF EXISTS "Company employees can view team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can delete team members" ON team_members;
DROP POLICY IF EXISTS "Team managers can add members" ON team_members;
DROP POLICY IF EXISTS "Team managers can remove members" ON team_members;

CREATE POLICY "Company employees can view team members" ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team managers can add members" ON team_members
  FOR INSERT
  WITH CHECK (
    user_can_manage_teams(auth.uid())
    AND team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team managers can remove members" ON team_members
  FOR DELETE
  USING (
    user_can_manage_teams(auth.uid())
    AND team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

-- 4.3 Permissions Table RLS (Read-only for all)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can view permissions" ON permissions;
CREATE POLICY "All authenticated users can view permissions" ON permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4.4 Team Permissions Table RLS
ALTER TABLE team_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Admins can manage team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Company employees can view team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team admins can insert team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team admins can update team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team admins can delete team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can insert permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can update permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can delete permissions" ON team_permissions;

CREATE POLICY "Company employees can view team permissions" ON team_permissions
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team managers can insert permissions" ON team_permissions
  FOR INSERT
  WITH CHECK (
    user_can_manage_teams(auth.uid())
    AND team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team managers can update permissions" ON team_permissions
  FOR UPDATE
  USING (
    user_can_manage_teams(auth.uid())
    AND team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team managers can delete permissions" ON team_permissions
  FOR DELETE
  USING (
    user_can_delete_teams(auth.uid())
    AND team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

-- ==============================================================================
-- PART 5: CREATE TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_permissions_updated_at ON team_permissions;
CREATE TRIGGER update_team_permissions_updated_at
  BEFORE UPDATE ON team_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 6: CREATE DEFAULT TEAMS AND MIGRATE EXISTING USERS
-- ==============================================================================

-- Create default teams for each company
DO $$
DECLARE
  company_record RECORD;
  admin_team_id INTEGER;
  manager_team_id INTEGER;
  employee_team_id INTEGER;
  perm_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM companies LOOP
    -- Create Administrators team
    INSERT INTO teams (name, description, company_id, is_default, created_by)
    VALUES (
      'Administrators',
      'Full system access and management',
      company_record.id,
      true,
      (SELECT id FROM employees WHERE company_id = company_record.id AND role = 'Admin' LIMIT 1)
    )
    ON CONFLICT (name, company_id) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO admin_team_id;

    -- Create Managers team
    INSERT INTO teams (name, description, company_id, is_default, created_by)
    VALUES (
      'Managers',
      'Management and approval permissions',
      company_record.id,
      true,
      (SELECT id FROM employees WHERE company_id = company_record.id AND role = 'Admin' LIMIT 1)
    )
    ON CONFLICT (name, company_id) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO manager_team_id;

    -- Create Employees team
    INSERT INTO teams (name, description, company_id, is_default, created_by)
    VALUES (
      'Employees',
      'Basic access permissions',
      company_record.id,
      true,
      (SELECT id FROM employees WHERE company_id = company_record.id AND role = 'Admin' LIMIT 1)
    )
    ON CONFLICT (name, company_id) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO employee_team_id;

    -- Grant full permissions to Administrators team
    FOR perm_record IN SELECT id FROM permissions LOOP
      INSERT INTO team_permissions (team_id, permission_id, can_read, can_write, can_delete, can_approve, can_comment)
      VALUES (admin_team_id, perm_record.id, true, true, true, true, true)
      ON CONFLICT (team_id, permission_id) 
      DO UPDATE SET can_read = true, can_write = true, can_delete = true, can_approve = true, can_comment = true;
    END LOOP;

    -- Grant appropriate permissions to Managers team (read, write, approve most things)
    FOR perm_record IN SELECT id, module_name FROM permissions LOOP
      INSERT INTO team_permissions (team_id, permission_id, can_read, can_write, can_delete, can_approve, can_comment)
      VALUES (
        manager_team_id, 
        perm_record.id, 
        true, 
        perm_record.module_name NOT IN ('admin_config', 'teams', 'company_logs'),  -- No write on admin modules
        false,  -- No delete
        perm_record.module_name IN ('leave', 'requisition', 'settlement', 'complaints'),  -- Can approve these
        true
      )
      ON CONFLICT (team_id, permission_id) DO NOTHING;
    END LOOP;

    -- Grant basic permissions to Employees team (mostly read, some write)
    FOR perm_record IN SELECT id, module_name FROM permissions LOOP
      INSERT INTO team_permissions (team_id, permission_id, can_read, can_write, can_delete, can_approve, can_comment)
      VALUES (
        employee_team_id, 
        perm_record.id, 
        perm_record.module_name NOT IN ('admin_config', 'teams', 'company_logs', 'payroll'),  -- Limited read
        perm_record.module_name IN ('tasks', 'attendance', 'leave', 'requisition', 'settlement', 'complaints'),  -- Can write own
        false,  -- No delete
        false,  -- No approve
        true  -- Can comment
      )
      ON CONFLICT (team_id, permission_id) DO NOTHING;
    END LOOP;

    -- Migrate existing Admin users
    INSERT INTO team_members (team_id, employee_id, added_by)
    SELECT 
      admin_team_id,
      e.id,
      e.id
    FROM employees e
    WHERE e.company_id = company_record.id 
      AND e.role = 'Admin'
    ON CONFLICT (team_id, employee_id) DO NOTHING;

    -- Migrate existing Manager users
    INSERT INTO team_members (team_id, employee_id, added_by)
    SELECT 
      manager_team_id,
      e.id,
      (SELECT id FROM employees WHERE company_id = company_record.id AND role = 'Admin' LIMIT 1)
    FROM employees e
    WHERE e.company_id = company_record.id 
      AND e.role = 'Manager'
    ON CONFLICT (team_id, employee_id) DO NOTHING;

    -- Migrate existing Employee users
    INSERT INTO team_members (team_id, employee_id, added_by)
    SELECT 
      employee_team_id,
      e.id,
      (SELECT id FROM employees WHERE company_id = company_record.id AND role = 'Admin' LIMIT 1)
    FROM employees e
    WHERE e.company_id = company_record.id 
      AND e.role = 'Employee'
    ON CONFLICT (team_id, employee_id) DO NOTHING;

    RAISE NOTICE '✅ Company % setup complete', company_record.id;
  END LOOP;
END $$;

-- ==============================================================================
-- PART 7: VERIFICATION
-- ==============================================================================

SELECT '===============================================' as divider;
SELECT '✅ TEAM PERMISSIONS SYSTEM SETUP COMPLETE!' as status;
SELECT '===============================================' as divider;

-- Show summary
SELECT 
  'Teams Created' as metric,
  COUNT(*) as count
FROM teams
UNION ALL
SELECT 
  'Team Members' as metric,
  COUNT(*) as count
FROM team_members
UNION ALL
SELECT 
  'Permissions (Master)' as metric,
  COUNT(*) as count
FROM permissions
UNION ALL
SELECT 
  'Team Permissions' as metric,
  COUNT(*) as count
FROM team_permissions;

-- Show teams per company
SELECT 
  '===============================================' as divider;
SELECT 'Teams by Company:' as info;
SELECT 
  c.id as company_id,
  c.name as company_name,
  t.name as team_name,
  (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as members,
  (SELECT COUNT(*) FROM team_permissions WHERE team_id = t.id) as permissions
FROM companies c
JOIN teams t ON t.company_id = c.id
ORDER BY c.id, t.name;

SELECT '===============================================' as divider;
SELECT '🎉 Setup complete! You can now manage teams in the admin panel.' as message;
