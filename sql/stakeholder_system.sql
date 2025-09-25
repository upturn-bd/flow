-- Stakeholder Management System Tables
-- Following Flow HRIS patterns with proper indexing and constraints

-- Stakeholder Types Table (for categorizing stakeholders)
CREATE TABLE stakeholder_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stakeholders Table
CREATE TABLE stakeholders (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  address TEXT,
  stakeholder_type_id INTEGER REFERENCES stakeholder_types(id),
  manager_id INTEGER, -- Employee ID who manages this stakeholder
  
  -- Contact Details (JSONB for flexible storage)
  contact_details JSONB DEFAULT '{}', -- Stores contacts array with name, role, phone, email, address
  
  -- Assignment & Company
  assigned_employees JSONB DEFAULT '[]', -- Array of employee IDs assigned to this stakeholder
  company_id INTEGER NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- Employee ID who created the record
  updated_by VARCHAR(255)  -- Employee ID who last updated the record
);

-- Stakeholder Issues Table
CREATE TABLE stakeholder_issues (
  id SERIAL PRIMARY KEY,
  
  -- Relationships
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  transaction_id INTEGER, -- Optional reference to accounts table
  
  -- Issue Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  
  -- Assignment
  assigned_to INTEGER, -- Employee ID responsible for resolving the issue
  
  -- Company
  company_id INTEGER NOT NULL,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- Employee ID who created the issue
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(255) -- Employee ID who resolved the issue
);

-- Indexes for Performance
-- Stakeholder Types
CREATE INDEX idx_stakeholder_types_company_id ON stakeholder_types(company_id);

-- Stakeholders
CREATE INDEX idx_stakeholders_company_id ON stakeholders(company_id);
CREATE INDEX idx_stakeholders_type_company ON stakeholders(stakeholder_type_id, company_id);
CREATE INDEX idx_stakeholders_manager_company ON stakeholders(manager_id, company_id);
CREATE INDEX idx_stakeholders_contact_details ON stakeholders USING GIN (contact_details);
CREATE INDEX idx_stakeholders_assigned_employees ON stakeholders USING GIN (assigned_employees);

-- Stakeholder Issues
CREATE INDEX idx_stakeholder_issues_company_id ON stakeholder_issues(company_id);
CREATE INDEX idx_stakeholder_issues_stakeholder_id ON stakeholder_issues(stakeholder_id);
CREATE INDEX idx_stakeholder_issues_status_company ON stakeholder_issues(status, company_id);
CREATE INDEX idx_stakeholder_issues_priority_company ON stakeholder_issues(priority, company_id);
CREATE INDEX idx_stakeholder_issues_assigned_to ON stakeholder_issues(assigned_to);
CREATE INDEX idx_stakeholder_issues_transaction_id ON stakeholder_issues(transaction_id);
CREATE INDEX idx_stakeholder_issues_created_at ON stakeholder_issues(created_at DESC);

-- Apply update triggers (reusing function from accounts_table.sql)
CREATE TRIGGER update_stakeholder_types_updated_at
  BEFORE UPDATE ON stakeholder_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholders_updated_at
  BEFORE UPDATE ON stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholder_issues_updated_at
  BEFORE UPDATE ON stakeholder_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample stakeholder types
INSERT INTO stakeholder_types (name, description, company_id) VALUES
('Client', 'External clients and customers', 1),
('Vendor', 'Suppliers and service providers', 1),
('Partner', 'Business partners and collaborators', 1),
('Investor', 'Financial stakeholders and investors', 1);

-- Insert sample stakeholders
INSERT INTO stakeholders (
  name, 
  address, 
  stakeholder_type_id, 
  manager_id, 
  contact_details, 
  assigned_employees, 
  company_id, 
  created_by
) VALUES
(
  'TechCorp Solutions', 
  '123 Business District, Dhaka, Bangladesh',
  1, -- Client type
  1, -- Manager employee ID
  '{
    "contacts": [
      {
        "name": "John Doe",
        "role": "Account Manager",
        "phone": "+88019xxxxxxx",
        "email": "john@techcorp.com",
        "address": "123 Business District, Dhaka"
      }
    ]
  }',
  '["EMP001", "EMP002"]',
  1,
  'EMP001'
),
(
  'Office Supplies Ltd',
  '456 Supply Street, Chittagong, Bangladesh',
  2, -- Vendor type
  2, -- Manager employee ID
  '{
    "contacts": [
      {
        "name": "Sarah Wilson",
        "role": "Sales Manager",
        "phone": "+88018xxxxxxx",
        "email": "sarah@officesupplies.com",
        "address": "456 Supply Street, Chittagong"
      }
    ]
  }',
  '["EMP003"]',
  1,
  'EMP002'
);

-- Insert sample issues
INSERT INTO stakeholder_issues (
  stakeholder_id,
  title,
  description,
  status,
  priority,
  assigned_to,
  company_id,
  created_by
) VALUES
(
  1,
  'Payment Delay Issue',
  'Client has requested extension for payment due to cash flow issues',
  'Open',
  'High',
  1,
  1,
  'EMP001'
),
(
  2,
  'Delivery Quality Concern',
  'Recent office supplies delivery had quality issues that need to be addressed',
  'In Progress',
  'Medium',
  2,
  1,
  'EMP003'
);