/**
 * Authentication and context utilities
 * Shared functions for getting current user, company, and employee information
 */

import { supabase } from "@/lib/supabase/client";

/**
 * Simple error class for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Get the current company ID for the authenticated user
 */
export async function getCompanyId(): Promise<number> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new DatabaseError('User not authenticated');
  }

  const { data, error } = await supabase
    .from('employees')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new DatabaseError('Failed to get company ID', error.code);
  }

  return data.company_id;
}

/**
 * Get the current employee information
 */
export async function getEmployeeInfo(): Promise<{ 
  id: string; 
  name: string;
  role: string;
  has_approval: string;
  company_id: number; 
  department_id?: number; 
  supervisor_id?: string;
  email?: string;
  phone_number?: string;
  designation?: string;
}> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new DatabaseError('User not authenticated');
  }

  const { data, error } = await supabase
    .from('employees')
    .select('id, company_id, department_id, role, supervisor_id, first_name, last_name, has_approval, email, phone_number, designation')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new DatabaseError('Failed to get employee info', error.code);
  }

  return { 
    id: data.id, 
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    role: data.role || '',
    has_approval: data.has_approval || '',
    company_id: data.company_id,
    department_id: data.department_id,
    supervisor_id: data.supervisor_id,
    email: data.email,
    phone_number: data.phone_number,
    designation: data.designation
  };
}

/**
 * Get the current user ID
 */
export async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new DatabaseError('User not authenticated');
  }

  return user.id;
}

/**
 * Get the current company information
 */
export async function getCompanyInfo(): Promise<{ 
  id: number; 
  name: string; 
  code: string; 
  industry_id: number; 
  country_id: number;
  live_absent_enabled?: boolean;
  payroll_generation_day?: number;
  fiscal_year_start?: string;
  live_payroll_enabled?: boolean;
}> {
  const companyId = await getCompanyId();
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    throw new DatabaseError('Failed to get company info', error.code);
  }

  return data;
}

/**
 * Update company settings
 */
export async function updateCompanySettings(settings: {
  live_absent_enabled?: boolean;
  payroll_generation_day?: number;
  fiscal_year_start?: string;
  live_payroll_enabled?: boolean;
  industry_id?: number;
  country_id?: number;
}): Promise<void> {
  const companyId = await getCompanyId();
  
  const { error } = await supabase
    .from('companies')
    .update(settings)
    .eq('id', companyId);

  if (error) {
    throw new DatabaseError('Failed to update company settings', error.code);
  }
}

/**
 * Get the current employee ID (alias for compatibility)
 */
export async function getEmployeeId(): Promise<string> {
  const employeeInfo = await supabase.auth.getUser();
  return employeeInfo.data.user?.id || '';
}

/**
 * Get the current user object (alias for compatibility)
 */
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new DatabaseError('User not authenticated');
  }

  return user;
}
