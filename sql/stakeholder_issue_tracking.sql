-- ==============================================================================
-- STAKEHOLDER ISSUE TRACKING SYSTEM
-- ==============================================================================
-- Adds issue tracking/ticketing system for the process-based stakeholder system
-- Author: Flow HRIS Team
-- Date: October 27, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: ADD ISSUE HANDLER TO STAKEHOLDERS TABLE
-- ==============================================================================

-- Add issue_handler_id column to stakeholders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'issue_handler_id'
  ) THEN
    ALTER TABLE stakeholders ADD COLUMN issue_handler_id UUID REFERENCES employees(id);
  END IF;
END $$;

-- Create index for issue handler
CREATE INDEX IF NOT EXISTS idx_stakeholders_issue_handler_id ON stakeholders(issue_handler_id);

-- ==============================================================================
-- PART 2: CREATE STAKEHOLDER ISSUES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_issues (
  id SERIAL PRIMARY KEY,
  
  -- Relationships
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  
  -- Issue Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  
  -- File attachments (JSONB array)
  -- Format: [{"path": "file/path", "originalName": "file.pdf", "size": 12345, "type": "application/pdf", "uploadedAt": "2025-10-27T..."}]
  attachments JSONB DEFAULT '[]',
  
  -- Company
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES employees(id)
);

-- ==============================================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_company_id ON stakeholder_issues(company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_stakeholder_id ON stakeholder_issues(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_status_company ON stakeholder_issues(status, company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_priority_company ON stakeholder_issues(priority, company_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_created_by ON stakeholder_issues(created_by);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_created_at ON stakeholder_issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_attachments ON stakeholder_issues USING GIN (attachments);

-- ==============================================================================
-- PART 4: CREATE UPDATE TRIGGER
-- ==============================================================================

CREATE TRIGGER update_stakeholder_issues_updated_at
  BEFORE UPDATE ON stakeholder_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS on stakeholder_issues table
ALTER TABLE stakeholder_issues ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view issues for stakeholders in their company
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

-- Policy: Users can update issues for stakeholders in their company
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

-- Policy: Users can delete issues for stakeholders in their company
CREATE POLICY stakeholder_issues_delete_policy ON stakeholder_issues
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- ==============================================================================
-- PART 6: ADD COMMENTS
-- ==============================================================================

COMMENT ON TABLE stakeholder_issues IS 'Issue tracking/ticketing system for stakeholders';
COMMENT ON COLUMN stakeholder_issues.stakeholder_id IS 'Reference to the stakeholder this issue belongs to';
COMMENT ON COLUMN stakeholder_issues.status IS 'Current status: Pending, In Progress, or Resolved';
COMMENT ON COLUMN stakeholder_issues.priority IS 'Priority level: Low, Medium, High, or Urgent';
COMMENT ON COLUMN stakeholder_issues.attachments IS 'JSONB array of file attachment metadata';
COMMENT ON COLUMN stakeholders.issue_handler_id IS 'Employee assigned as the primary issue handler for this stakeholder';
