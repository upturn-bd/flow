import { supabase } from "@/lib/supabase/client";

interface Department {
  id: number;
  name: string;
  description?: string;
  company_id: string | number;
  created_at?: string;
}

/**
 * Fetches all departments for the current user's company
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    // First get the user to ensure authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    // Get company_id from the employees table
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .single();
      
    if (employeeError) {
      throw new Error(employeeError.message);
    }
    
    // Fetch departments using the company_id
    const { data: departments, error } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", employee.company_id);
      
    if (error) {
      throw error;
    }
    
    return departments || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}

/**
 * Creates a new department for the current user's company
 */
export async function createDepartment(departmentData: Omit<Department, 'id' | 'company_id' | 'created_at'>): Promise<Department> {
  try {
    // First get the user to ensure authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    
    // Get company_id from the employees table
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .single();
      
    if (employeeError) {
      throw new Error(employeeError.message);
    }
    
    // Create formatted data with company_id
    const formattedData = {
      ...departmentData,
      company_id: employee.company_id,
    };
    
    // Insert the new department
    const { data, error } = await supabase
      .from("departments")
      .insert(formattedData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

/**
 * Updates an existing department
 */
export async function updateDepartment(departmentData: Partial<Department> & { id: number }): Promise<void> {
  try {
    if (!departmentData.id) {
      throw new Error("Department ID is required for update");
    }
    
    // Extract id and update data
    const { id, ...updateData } = departmentData;
    
    // Update the department
    const { error } = await supabase
      .from("departments")
      .update(updateData)
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
}

/**
 * Deletes a department by ID
 */
export async function deleteDepartment(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error("Department ID is required for deletion");
    }
    
    // Delete the department
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
} 