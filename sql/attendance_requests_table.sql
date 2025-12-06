-- Create attendance_requests table for tracking late/wrong location approval requests

-- Drop table if exists
DROP TABLE IF EXISTS public.attendance_requests CASCADE;

-- Create the table
CREATE TABLE public.attendance_requests (
  id SERIAL PRIMARY KEY,
  attendance_record_id INTEGER NOT NULL,
  employee_id UUID NOT NULL,
  supervisor_id UUID NULL,
  company_id INTEGER NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('late', 'wrong_location')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  reviewed_by UUID NULL,
  
  -- Foreign keys
  CONSTRAINT attendance_requests_attendance_record_id_fkey 
    FOREIGN KEY (attendance_record_id) 
    REFERENCES attendance_records (id) 
    ON DELETE CASCADE,
  
  CONSTRAINT attendance_requests_employee_id_fkey 
    FOREIGN KEY (employee_id) 
    REFERENCES employees (id) 
    ON DELETE CASCADE,
  
  CONSTRAINT attendance_requests_supervisor_id_fkey 
    FOREIGN KEY (supervisor_id) 
    REFERENCES employees (id) 
    ON DELETE SET NULL,
  
  CONSTRAINT attendance_requests_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES companies (id) 
    ON DELETE CASCADE,
  
  CONSTRAINT attendance_requests_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) 
    REFERENCES employees (id) 
    ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX idx_attendance_requests_attendance_record_id ON public.attendance_requests(attendance_record_id);
CREATE INDEX idx_attendance_requests_employee_id ON public.attendance_requests(employee_id);
CREATE INDEX idx_attendance_requests_supervisor_id ON public.attendance_requests(supervisor_id);
CREATE INDEX idx_attendance_requests_company_id ON public.attendance_requests(company_id);
CREATE INDEX idx_attendance_requests_status ON public.attendance_requests(status);
CREATE INDEX idx_attendance_requests_created_at ON public.attendance_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view their own requests
CREATE POLICY "Employees can view own attendance requests"
  ON public.attendance_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Manager')
      AND company_id = attendance_requests.company_id
    )
  );

-- Policy: Employees can create their own requests
CREATE POLICY "Employees can create own attendance requests"
  ON public.attendance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: Supervisors and admins can update requests
CREATE POLICY "Supervisors and admins can update attendance requests"
  ON public.attendance_requests
  FOR UPDATE
  TO authenticated
  USING (
    supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Manager')
      AND company_id = attendance_requests.company_id
    )
  );

-- Policy: Admins can delete requests
CREATE POLICY "Admins can delete attendance requests"
  ON public.attendance_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
      AND role = 'Admin'
      AND company_id = attendance_requests.company_id
    )
  );

-- Add comment
COMMENT ON TABLE public.attendance_requests IS 'Stores approval requests for late check-ins and wrong location check-ins';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ attendance_requests table created successfully';
  RAISE NOTICE '   - Tracks late and wrong location approval requests';
  RAISE NOTICE '   - RLS policies enabled for secure access';
  RAISE NOTICE '   - Indexes created for query performance';
END $$;
