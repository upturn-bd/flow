/**
 * Company and user context utilities
 * Simple functions to get current company and user information
 */

import { supabase } from "@/lib/supabase/client";
import { ApiError } from "./client";

/**
 * Get the current company ID for the authenticated user
 */
export async function getCompanyId(): Promise<number> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new ApiError('User not authenticated');
  }

  const { data, error } = await supabase
    .from('employees')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new ApiError('Failed to get company ID', error.code);
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
    throw new ApiError('User not authenticated');
  }

  const { data, error } = await supabase
    .from('employees')
    .select('id, company_id, department_id, role, supervisor_id, first_name, last_name, has_approval, email, phone_number, designation')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new ApiError('Failed to get employee info', error.code);
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
    throw new ApiError('User not authenticated');
  }

  return user.id;
}

/**
 * Get the current company information
 */
export async function getCompanyInfo(): Promise<{ id: number; name: string; code: string; industry_id: number; country_id: number }> {
  const companyId = await getCompanyId();
  
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, code, industry_id, country_id')
    .eq('id', companyId)
    .single();

  if (error) {
    throw new ApiError('Failed to get company info', error.code);
  }

  return data;
}

/**
 * Upload multiple files to a storage bucket
 */
export async function uploadManyFiles(files: File[], bucketName: string = 'uploads'): Promise<{ uploadedFilePaths: string[]; error?: string }> {
  try {
    const uploadedFilePaths: string[] = [];
    
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        throw new ApiError(`Failed to upload file ${file.name}`, error.message);
      }

      uploadedFilePaths.push(data.path);
    }

    return { uploadedFilePaths };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return { uploadedFilePaths: [], error: errorMessage };
  }
}

/**
 * Upload a single file to a storage bucket
 */
export async function uploadFile(file: File, bucketName: string = 'uploads'): Promise<{ uploadedFilePath?: string; error?: string }> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      throw new ApiError(`Failed to upload file ${file.name}`, error.message);
    }

    return { uploadedFilePath: data.path };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return { uploadedFilePath: undefined, error: errorMessage };
  }
}

/**
 * Get the current employee ID (alias for compatibility)
 */
export async function getEmployeeId(): Promise<string> {
  const employeeInfo = await getEmployeeInfo();
  return employeeInfo.id;
}

/**
 * Get the current user object (alias for compatibility)
 */
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new ApiError('User not authenticated');
  }

  return user;
}
