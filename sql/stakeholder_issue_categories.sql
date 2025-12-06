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
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1', -- Hex color for visual distinction
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  UNIQUE(company_id, name)
);

-- ==============================================================================
-- PART 2: CREATE STAKEHOLDER ISSUE SUBCATEGORIES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_issue_subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES stakeholder_issue_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  UNIQUE(category_id, name)
);

-- ==============================================================================
-- PART 3: ADD COLUMNS TO STAKEHOLDER ISSUES TABLE
-- ==============================================================================

ALTER TABLE stakeholder_issues 
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES stakeholder_issue_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES stakeholder_issue_subcategories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_step_data_ids JSONB DEFAULT '[]';

-- ==============================================================================
-- PART 4: CREATE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_categories_company_id ON stakeholder_issue_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_categories_is_active ON stakeholder_issue_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_subcategories_company_id ON stakeholder_issue_subcategories(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_subcategories_category_id ON stakeholder_issue_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issue_subcategories_is_active ON stakeholder_issue_subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_category_id ON stakeholder_issues(category_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_subcategory_id ON stakeholder_issues(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_assigned_to ON stakeholder_issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_assigned_team_id ON stakeholder_issues(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_linked_step_data ON stakeholder_issues USING GIN (linked_step_data_ids);

-- ==============================================================================
-- PART 5: CREATE UPDATE TRIGGERS
-- ==============================================================================

CREATE OR REPLACE TRIGGER update_stakeholder_issue_categories_updated_at
  BEFORE UPDATE ON stakeholder_issue_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_stakeholder_issue_subcategories_updated_at
  BEFORE UPDATE ON stakeholder_issue_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 6: ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Policies check regular permissions first (most common case), then superadmin as fallback

ALTER TABLE stakeholder_issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_issue_subcategories ENABLE ROW LEVEL SECURITY;

-- Helper expression for permission check (used in policies below)
-- Regular user: has permission AND belongs to same company
-- Superadmin: bypass all checks

-- Categories policies
DROP POLICY IF EXISTS stakeholder_issue_categories_select_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS stakeholder_issue_categories_insert_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS stakeholder_issue_categories_update_policy ON stakeholder_issue_categories;
DROP POLICY IF EXISTS stakeholder_issue_categories_delete_policy ON stakeholder_issue_categories;

CREATE POLICY stakeholder_issue_categories_select_policy ON stakeholder_issue_categories FOR SELECT USING (
  (has_permission(auth.uid(), 'stakeholders', 'can_read') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid()))
  OR is_superadmin()
);

CREATE POLICY stakeholder_issue_categories_insert_policy ON stakeholder_issue_categories FOR INSERT WITH CHECK (
  (has_permission(auth.uid(), 'stakeholders', 'can_write') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid()))
  OR is_superadmin()
);

CREATE POLICY stakeholder_issue_categories_update_policy ON stakeholder_issue_categories FOR UPDATE
  USING ((has_permission(auth.uid(), 'stakeholders', 'can_write') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())) OR is_superadmin())
  WITH CHECK ((has_permission(auth.uid(), 'stakeholders', 'can_write') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())) OR is_superadmin());

CREATE POLICY stakeholder_issue_categories_delete_policy ON stakeholder_issue_categories FOR DELETE USING (
  (has_permission(auth.uid(), 'stakeholders', 'can_delete') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid()))
  OR is_superadmin()
);

-- Subcategories policies
DROP POLICY IF EXISTS stakeholder_issue_subcategories_select_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS stakeholder_issue_subcategories_insert_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS stakeholder_issue_subcategories_update_policy ON stakeholder_issue_subcategories;
DROP POLICY IF EXISTS stakeholder_issue_subcategories_delete_policy ON stakeholder_issue_subcategories;

CREATE POLICY stakeholder_issue_subcategories_select_policy ON stakeholder_issue_subcategories FOR SELECT USING (
  (has_permission(auth.uid(), 'stakeholders', 'can_read') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid()))
  OR is_superadmin()
);

CREATE POLICY stakeholder_issue_subcategories_insert_policy ON stakeholder_issue_subcategories FOR INSERT WITH CHECK (
  (has_permission(auth.uid(), 'stakeholders', 'can_write') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid()))
  OR is_superadmin()
);

CREATE POLICY stakeholder_issue_subcategories_update_policy ON stakeholder_issue_subcategories FOR UPDATE
  USING ((has_permission(auth.uid(), 'stakeholders', 'can_write') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())) OR is_superadmin())
  WITH CHECK ((has_permission(auth.uid(), 'stakeholders', 'can_write') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid())) OR is_superadmin());

CREATE POLICY stakeholder_issue_subcategories_delete_policy ON stakeholder_issue_subcategories FOR DELETE USING (
  (has_permission(auth.uid(), 'stakeholders', 'can_delete') AND company_id IN (SELECT company_id FROM employees WHERE id = auth.uid()))
  OR is_superadmin()
);

-- ==============================================================================
-- PART 7: TABLE & COLUMN COMMENTS
-- ==============================================================================

COMMENT ON TABLE stakeholder_issue_categories IS 'Categories for organizing stakeholder issues with color coding';
COMMENT ON COLUMN stakeholder_issue_categories.color IS 'Hex color code for visual distinction';
COMMENT ON COLUMN stakeholder_issue_categories.is_active IS 'Whether the category can be assigned to new issues';

COMMENT ON TABLE stakeholder_issue_subcategories IS 'Subcategories for further organizing stakeholder issues';
COMMENT ON COLUMN stakeholder_issue_subcategories.category_id IS 'Parent category reference';
COMMENT ON COLUMN stakeholder_issue_subcategories.is_active IS 'Whether the subcategory can be assigned to new issues';

COMMENT ON COLUMN stakeholder_issues.category_id IS 'Optional reference to issue category';
COMMENT ON COLUMN stakeholder_issues.subcategory_id IS 'Optional reference to issue subcategory (must belong to selected category)';
COMMENT ON COLUMN stakeholder_issues.assigned_to IS 'Employee assigned to handle this issue (either employee OR team, not both)';
COMMENT ON COLUMN stakeholder_issues.assigned_team_id IS 'Team assigned to handle this issue (either employee OR team, not both)';
COMMENT ON COLUMN stakeholder_issues.linked_step_data_ids IS 'JSONB array of stakeholder_step_data IDs linked to this issue';
