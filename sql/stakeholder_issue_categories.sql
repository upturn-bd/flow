-- ==============================================================================
-- STAKEHOLDER ISSUE CATEGORIES SYSTEM
-- ==============================================================================
-- Adds categories and subcategories with colors for stakeholder issues
-- Also extends issue assignment to support team assignment
-- Adds linking to stakeholder step data for dynamic data referencing
-- Author: Flow HRIS Team
-- ==============================================================================

-- ==============================================================================
-- PART 1: CREATE STAKEHOLDER ISSUE CATEGORIES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_issue_categories (
  id SERIAL PRIMARY KEY,
  
  -- Category Details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1', -- Hex color for visual distinction
  
  -- Company
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  -- Ensure unique names within a company
  UNIQUE(company_id, name)
);

-- ==============================================================================
-- PART 2: CREATE STAKEHOLDER ISSUE SUBCATEGORIES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_issue_subcategories (
  id SERIAL PRIMARY KEY,
  
  -- Relationship to parent category
  category_id INTEGER NOT NULL REFERENCES stakeholder_issue_categories(id) ON DELETE CASCADE,
  
  -- Subcategory Details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Company
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  
  -- Ensure unique names within a category
  UNIQUE(category_id, name)
);

-- ==============================================================================
-- PART 3: ADD EXTENDED FIELDS TO STAKEHOLDER ISSUES
-- ==============================================================================

-- Add category_id to stakeholder_issues if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN category_id INTEGER REFERENCES stakeholder_issue_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add subcategory_id to stakeholder_issues if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN subcategory_id INTEGER REFERENCES stakeholder_issue_subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add assigned_to for employee assignment
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add assigned_team_id for team assignment (either employee or team, not both)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'assigned_team_id'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN assigned_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add linked_step_data_ids for linking issues to stakeholder step data (JSONB array of IDs)
-- This allows dynamic linking/editing of step data from issues
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_issues' 
    AND column_name = 'linked_step_data_ids'
  ) THEN
    ALTER TABLE stakeholder_issues ADD COLUMN linked_step_data_ids JSONB DEFAULT '[]';
  END IF;
END $$;

-- ==============================================================================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_categories_company_id 
  ON stakeholder_issue_categories(company_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_categories_is_active 
  ON stakeholder_issue_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_subcategories_company_id 
  ON stakeholder_issue_subcategories(company_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_subcategories_category_id 
  ON stakeholder_issue_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_subcategories_is_active 
  ON stakeholder_issue_subcategories(is_active);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_category_id 
  ON stakeholder_issues(category_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_subcategory_id 
  ON stakeholder_issues(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_assigned_to 
  ON stakeholder_issues(assigned_to);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_assigned_team_id 
  ON stakeholder_issues(assigned_team_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_linked_step_data 
  ON stakeholder_issues USING GIN (linked_step_data_ids);

-- ==============================================================================
-- PART 5: CREATE UPDATE TRIGGERS
-- ==============================================================================

CREATE OR REPLACE TRIGGER update_stakeholder_issue_categories_updated_at
  BEFORE UPDATE ON stakeholder_issue_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_stakeholder_issue_subcategories_updated_at
  BEFORE UPDATE ON stakeholder_issue_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 6: ENABLE ROW LEVEL SECURITY (RLS) - CONSOLIDATED POLICIES
-- ==============================================================================
-- Using minimal policies by combining logic with OR conditions for superadmin access

-- Enable RLS on categories table
ALTER TABLE stakeholder_issue_categories ENABLE ROW LEVEL SECURITY;

-- Combined SELECT policy for categories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_categories_select_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS "Superadmins can view all issue categories" ON stakeholder_issue_categories;
CREATE POLICY stakeholder_issue_categories_select_policy ON stakeholder_issue_categories
  FOR SELECT
  USING (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_read')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Combined INSERT policy for categories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_categories_insert_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS "Superadmins can create issue categories" ON stakeholder_issue_categories;
CREATE POLICY stakeholder_issue_categories_insert_policy ON stakeholder_issue_categories
  FOR INSERT
  WITH CHECK (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_write')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Combined UPDATE policy for categories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_categories_update_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS "Superadmins can update issue categories" ON stakeholder_issue_categories;
CREATE POLICY stakeholder_issue_categories_update_policy ON stakeholder_issue_categories
  FOR UPDATE
  USING (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_write')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_write')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Combined DELETE policy for categories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_categories_delete_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS "Superadmins can delete issue categories" ON stakeholder_issue_categories;
CREATE POLICY stakeholder_issue_categories_delete_policy ON stakeholder_issue_categories
  FOR DELETE
  USING (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_delete')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Enable RLS on subcategories table
ALTER TABLE stakeholder_issue_subcategories ENABLE ROW LEVEL SECURITY;

-- Combined SELECT policy for subcategories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_subcategories_select_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS "Superadmins can view all issue subcategories" ON stakeholder_issue_subcategories;
CREATE POLICY stakeholder_issue_subcategories_select_policy ON stakeholder_issue_subcategories
  FOR SELECT
  USING (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_read')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Combined INSERT policy for subcategories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_subcategories_insert_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS "Superadmins can create issue subcategories" ON stakeholder_issue_subcategories;
CREATE POLICY stakeholder_issue_subcategories_insert_policy ON stakeholder_issue_subcategories
  FOR INSERT
  WITH CHECK (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_write')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Combined UPDATE policy for subcategories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_subcategories_update_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS "Superadmins can update issue subcategories" ON stakeholder_issue_subcategories;
CREATE POLICY stakeholder_issue_subcategories_update_policy ON stakeholder_issue_subcategories
  FOR UPDATE
  USING (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_write')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_write')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- Combined DELETE policy for subcategories (regular users with permission OR superadmin)
DROP POLICY IF EXISTS stakeholder_issue_subcategories_delete_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS "Superadmins can delete issue subcategories" ON stakeholder_issue_subcategories;
CREATE POLICY stakeholder_issue_subcategories_delete_policy ON stakeholder_issue_subcategories
  FOR DELETE
  USING (
    is_superadmin()
    OR (
      has_permission(auth.uid(), 'stakeholders', 'can_delete')
      AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())
    )
  );

-- ==============================================================================
-- PART 7: ADD COMMENTS
-- ==============================================================================

COMMENT ON TABLE stakeholder_issue_categories IS 'Categories for organizing stakeholder issues with color coding';
COMMENT ON COLUMN stakeholder_issue_categories.name IS 'Name of the category';
COMMENT ON COLUMN stakeholder_issue_categories.color IS 'Hex color code for visual distinction';
COMMENT ON COLUMN stakeholder_issue_categories.is_active IS 'Whether the category is active and can be assigned to new issues';

COMMENT ON TABLE stakeholder_issue_subcategories IS 'Subcategories for further organizing stakeholder issues';
COMMENT ON COLUMN stakeholder_issue_subcategories.category_id IS 'Parent category reference';
COMMENT ON COLUMN stakeholder_issue_subcategories.name IS 'Name of the subcategory';
COMMENT ON COLUMN stakeholder_issue_subcategories.is_active IS 'Whether the subcategory is active and can be assigned to new issues';

COMMENT ON COLUMN stakeholder_issues.category_id IS 'Optional reference to issue category for organization';
COMMENT ON COLUMN stakeholder_issues.subcategory_id IS 'Optional reference to issue subcategory (must belong to selected category)';
COMMENT ON COLUMN stakeholder_issues.assigned_to IS 'Employee ID assigned to handle this issue (either employee OR team)';
COMMENT ON COLUMN stakeholder_issues.assigned_team_id IS 'Team ID assignment - issue can be assigned to either an employee OR a team, not both';
COMMENT ON COLUMN stakeholder_issues.linked_step_data_ids IS 'JSONB array of stakeholder_step_data IDs linked to this issue for dynamic data referencing';
