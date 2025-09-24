-- Payroll System Database Schema

-- 1. Update companies table to include payroll configuration fields
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS payroll_generation_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS fiscal_year_start DATE DEFAULT '2024-01-01',
ADD COLUMN IF NOT EXISTS pay_frequency VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS live_payroll_enabled BOOLEAN DEFAULT false;

-- 2. Update employees table to include basic_salary (moved from grades)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS basic_salary DECIMAL(12,2) DEFAULT 0.00;

-- 3. Create salary change audit log table
CREATE TABLE IF NOT EXISTS salary_change_log (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  change_data JSONB NOT NULL, -- stores old_value, new_value, reason, etc.
  changed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add indexes for salary change log
CREATE INDEX IF NOT EXISTS idx_salary_change_log_employee_id ON salary_change_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_change_log_company_id ON salary_change_log(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_change_log_changed_by ON salary_change_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_salary_change_log_created_at ON salary_change_log(created_at);

-- 3. Create payrolls table
CREATE TABLE IF NOT EXISTS payrolls (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  grade_name VARCHAR(255) NOT NULL, -- snapshot of grade name
  basic_salary DECIMAL(12,2) NOT NULL, -- snapshot of basic salary
  adjustments JSONB DEFAULT '[]', -- array of PayrollAdjustment objects
  total_amount DECIMAL(12,2) NOT NULL,
  generation_date DATE NOT NULL,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Published')),
  supervisor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_employee_generation_date UNIQUE (employee_id, generation_date),
  CONSTRAINT positive_basic_salary CHECK (basic_salary >= 0),
  CONSTRAINT positive_total_amount CHECK (total_amount >= 0)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_company_id ON payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_generation_date ON payrolls(generation_date);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status);
CREATE INDEX IF NOT EXISTS idx_payrolls_supervisor_id ON payrolls(supervisor_id);

-- 5. Add RLS (Row Level Security) policies
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;

-- Policy for employees to see their own payrolls
CREATE POLICY "Employees can view their own payrolls" ON payrolls
  FOR SELECT USING (
    employee_id = auth.uid()::uuid
  );

-- Policy for supervisors to see payrolls of their supervisees  
CREATE POLICY "Supervisors can view supervisee payrolls" ON payrolls
  FOR SELECT USING (
    supervisor_id = auth.uid()::uuid
  );

-- Policy for company admins to see all company payrolls (assuming role-based access)
CREATE POLICY "Company admins can view all company payrolls" ON payrolls
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM employees 
      WHERE id = auth.uid()::uuid 
      AND role IN ('Admin', 'Manager')
    )
  );

-- Policy for supervisors to update payroll status (for adjustments)
CREATE POLICY "Supervisors can update supervisee payrolls" ON payrolls
  FOR UPDATE USING (
    supervisor_id = auth.uid()::uuid
  );

-- Policy for admins to insert new payrolls
CREATE POLICY "Admins can insert payrolls" ON payrolls
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM employees 
      WHERE id = auth.uid()::uuid 
      AND role IN ('Admin', 'Manager')
    )
  );

-- Policy for admins to update all company payrolls
CREATE POLICY "Admins can update all company payrolls" ON payrolls
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM employees 
      WHERE id = auth.uid()::uuid 
      AND role IN ('Admin', 'Manager')
    )
  );

-- 8. Add RLS policies for salary_change_log
ALTER TABLE salary_change_log ENABLE ROW LEVEL SECURITY;

-- Policy for employees to see their own salary changes
CREATE POLICY "Employees can view their own salary changes" ON salary_change_log
  FOR SELECT USING (
    employee_id = auth.uid()::uuid
  );

-- Policy for company admins to see all company salary changes
CREATE POLICY "Company admins can view all company salary changes" ON salary_change_log
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM employees 
      WHERE id = auth.uid()::uuid 
      AND role IN ('Admin', 'Manager')
    )
  );

-- Policy for admins to insert salary change logs
CREATE POLICY "Admins can insert salary change logs" ON salary_change_log
  FOR INSERT WITH CHECK (
    changed_by = auth.uid()::uuid
    AND company_id IN (
      SELECT company_id FROM employees 
      WHERE id = auth.uid()::uuid 
      AND role IN ('Admin', 'Manager')
    )
  );
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payrolls_updated_at ON payrolls;
CREATE TRIGGER update_payrolls_updated_at 
    BEFORE UPDATE ON payrolls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();