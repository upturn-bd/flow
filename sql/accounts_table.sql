-- Accounts Table for Financial Transactions
-- Following Flow HRIS patterns with proper indexing and constraints

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  title VARCHAR(255) NOT NULL,
  method VARCHAR(100), -- Nullable dropdown: "Cash", "Bank", etc.
  company_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Complete', 'Pending')),
  
  -- Transaction Details
  from_source VARCHAR(255) NOT NULL, -- Named 'from_source' to avoid SQL keyword conflicts
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) NOT NULL, -- 2-digit precision, supports negative values
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT', -- Free text field, default BDT
  
  -- Additional Data (JSONB for flexible storage)
  additional_data JSONB DEFAULT '{}', -- Stores user_id and other relevant data
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- Employee ID who created the record
  updated_by VARCHAR(255)  -- Employee ID who last updated the record
);

-- Indexes for Performance
CREATE INDEX idx_accounts_company_id ON accounts(company_id);
CREATE INDEX idx_accounts_transaction_date ON accounts(transaction_date DESC); -- Newest first
CREATE INDEX idx_accounts_status_company ON accounts(status, company_id);
CREATE INDEX idx_accounts_method_company ON accounts(method, company_id);
CREATE INDEX idx_accounts_created_at ON accounts(created_at DESC);
CREATE INDEX idx_accounts_additional_data ON accounts USING GIN (additional_data); -- For JSONB queries

-- Trigger function to update updated_at timestamp (reusing from notifications)
-- This function should already exist from notifications_table.sql, but including for completeness
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to accounts table
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO accounts (title, method, company_id, status, from_source, amount, currency, additional_data, created_by) VALUES
('Office Supplies Purchase', 'Cash', 1, 'Complete', 'Petty Cash', -150.00, 'BDT', '{"user_id": "EMP001", "category": "office_supplies"}', 'EMP001'),
('Client Payment Received', 'Bank', 1, 'Complete', 'Bank Transfer', 5000.00, 'BDT', '{"user_id": "EMP002", "client_id": "CLI001", "invoice": "INV-2024-001"}', 'EMP002'),
('Monthly Salary - Admin', 'Bank', 1, 'Pending', 'Payroll System', -45000.00, 'BDT', '{"user_id": "EMP003", "payroll_month": "2024-01", "department": "Administration"}', 'SYSTEM');