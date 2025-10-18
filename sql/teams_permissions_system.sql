-- ==============================================================================
-- Team-Based Permissions System Migration
-- ==============================================================================
-- This script creates the team-based permissions system to replace the fixed
-- 3-role system (Admin, Manager, Employee) with flexible, granular permissions.
--
-- Author: Flow HRIS Team
-- Date: 2025-10-16
-- Version: 1.0
-- ==============================================================================

-- ==============================================================================
-- 1. Teams Table
-- ==============================================================================
-- Stores team definitions scoped by company
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE, -- For system-created default teams
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  
  -- Ensure unique team names per company
  CONSTRAINT unique_team_name_per_company UNIQUE(name, company_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_is_default ON teams(is_default);

-- ==============================================================================
-- 2. Team Members Table
-- ==============================================================================
-- Associates employees with teams (many-to-many relationship)
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES employees(id),
  
  -- Prevent duplicate team memberships
  CONSTRAINT unique_team_membership UNIQUE(team_id, employee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_added_by ON team_members(added_by);

-- ==============================================================================
-- 3. Permissions Table
-- ==============================================================================
-- Master list of all system modules/features that can have permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('workflow', 'services', 'operations', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_permissions_module_name ON permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- ==============================================================================
-- 4. Team Permissions Table
-- ==============================================================================
-- Defines what permissions each team has for each module
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
  
  -- Each team can only have one permission set per module
  CONSTRAINT unique_team_permission UNIQUE(team_id, permission_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_permissions_team_id ON team_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_permissions_permission_id ON team_permissions(permission_id);

-- ==============================================================================
-- 5. Seed Default Permissions Data
-- ==============================================================================
-- Insert all system modules as permissions

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
-- 6. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view teams in their company
CREATE POLICY "Employees can view company teams" ON teams
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: Only admins can create teams (checked via team membership in admin team)
CREATE POLICY "Admins can create teams" ON teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN team_permissions tp ON tp.team_id = t.id
      JOIN permissions p ON p.id = tp.permission_id
      WHERE tm.employee_id = auth.uid()
        AND p.module_name = 'teams'
        AND tp.can_write = true
    )
  );

-- Policy: Only admins can update teams
CREATE POLICY "Admins can update teams" ON teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN team_permissions tp ON tp.team_id = t.id
      JOIN permissions p ON p.id = tp.permission_id
      WHERE tm.employee_id = auth.uid()
        AND p.module_name = 'teams'
        AND tp.can_write = true
    )
  );

-- Policy: Only admins can delete teams
CREATE POLICY "Admins can delete teams" ON teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN team_permissions tp ON tp.team_id = t.id
      JOIN permissions p ON p.id = tp.permission_id
      WHERE tm.employee_id = auth.uid()
        AND p.module_name = 'teams'
        AND tp.can_delete = true
    )
  );

-- Enable RLS on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view team members in their company
CREATE POLICY "Employees can view team members" ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

-- Policy: Admins can manage team members
CREATE POLICY "Admins can manage team members" ON team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN team_permissions tp ON tp.team_id = t.id
      JOIN permissions p ON p.id = tp.permission_id
      WHERE tm.employee_id = auth.uid()
        AND p.module_name = 'teams'
        AND tp.can_write = true
    )
  );

-- Enable RLS on permissions table (read-only for all authenticated users)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view permissions" ON permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Enable RLS on team_permissions table
ALTER TABLE team_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view permissions for teams in their company
CREATE POLICY "Employees can view team permissions" ON team_permissions
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

-- Policy: Admins can manage team permissions
CREATE POLICY "Admins can manage team permissions" ON team_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN team_permissions tp ON tp.team_id = t.id
      JOIN permissions p ON p.id = tp.permission_id
      WHERE tm.employee_id = auth.uid()
        AND p.module_name = 'teams'
        AND tp.can_write = true
    )
  );

-- ==============================================================================
-- 7. Helper Functions
-- ==============================================================================

-- Function to get all permissions for a user (aggregated from all teams)
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

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  module VARCHAR(100),
  action VARCHAR(20) -- 'read', 'write', 'delete', 'approve', 'comment'
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT 
    CASE action
      WHEN 'read' THEN MAX(tp.can_read::int)::boolean
      WHEN 'write' THEN MAX(tp.can_write::int)::boolean
      WHEN 'delete' THEN MAX(tp.can_delete::int)::boolean
      WHEN 'approve' THEN MAX(tp.can_approve::int)::boolean
      WHEN 'comment' THEN MAX(tp.can_comment::int)::boolean
      ELSE false
    END INTO has_perm
  FROM team_members tm
  JOIN team_permissions tp ON tp.team_id = tm.team_id
  JOIN permissions p ON p.id = tp.permission_id
  WHERE tm.employee_id = user_id
    AND p.module_name = module;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. Triggers for updated_at timestamps
-- ==============================================================================

-- Trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to teams table
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to team_permissions table
DROP TRIGGER IF EXISTS update_team_permissions_updated_at ON team_permissions;
CREATE TRIGGER update_team_permissions_updated_at
  BEFORE UPDATE ON team_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 9. Comments for documentation
-- ==============================================================================

COMMENT ON TABLE teams IS 'Stores team definitions with company-level scoping';
COMMENT ON TABLE team_members IS 'Many-to-many relationship between teams and employees';
COMMENT ON TABLE permissions IS 'Master list of all system modules that can have permissions';
COMMENT ON TABLE team_permissions IS 'Defines granular permissions for each team per module';

COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Returns aggregated permissions for a user across all their teams';
COMMENT ON FUNCTION has_permission(UUID, VARCHAR, VARCHAR) IS 'Checks if a user has a specific permission for a module';

-- ==============================================================================
-- Migration Complete
-- ==============================================================================

-- Next steps:
-- 1. Run the data migration script to create default teams
-- 2. Migrate existing role-based users to appropriate teams
-- 3. Update application code to use team-based permissions
