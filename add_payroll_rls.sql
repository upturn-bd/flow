-- Add missing RLS policies for payrolls table
-- Run this in your Supabase SQL Editor

-- First, drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert payrolls" ON payrolls;
DROP POLICY IF EXISTS "Admins can update all company payrolls" ON payrolls;

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
