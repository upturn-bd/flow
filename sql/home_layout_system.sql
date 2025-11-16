-- Home Layout Configuration System
-- This table stores personalized home page widget layouts for each employee

CREATE TABLE IF NOT EXISTS home_layout_configs (
  id SERIAL PRIMARY KEY,
  
  -- Employee and company relationship
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Widget configuration (JSONB array)
  -- Format: [{id: "string", type: "widget-type", enabled: boolean, position: {row, col}, size: "small|medium|large|full", order: number, settings: {}}]
  widgets JSONB NOT NULL DEFAULT '[]',
  
  -- Layout version for future migrations
  layout_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one layout per employee
  UNIQUE(employee_id, company_id)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_home_layout_employee ON home_layout_configs(employee_id);
CREATE INDEX IF NOT EXISTS idx_home_layout_company ON home_layout_configs(company_id);

-- ==============================================================================
-- TRIGGER FOR UPDATED_AT
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_home_layout_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_home_layout_configs_timestamp
  BEFORE UPDATE ON home_layout_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_home_layout_configs_updated_at();

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE home_layout_configs IS 'Stores personalized home page widget layouts for employees';
COMMENT ON COLUMN home_layout_configs.employee_id IS 'Employee who owns this layout configuration';
COMMENT ON COLUMN home_layout_configs.company_id IS 'Company context for this layout';
COMMENT ON COLUMN home_layout_configs.widgets IS 'Array of widget configurations in JSONB format';
COMMENT ON COLUMN home_layout_configs.layout_version IS 'Version number for handling future migrations';
