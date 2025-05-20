import { supabase } from "@/lib/supabase/client";

interface Division {
  id: number;
  name: string;
  description?: string;
  company_id: string | number;
  created_at?: string;
}

/**
 * Fetches all divisions for the current user's company
 */
export async function getDivisions(): Promise<Division[]> {
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
    
    // Fetch divisions using the company_id
    const { data: divisions, error } = await supabase
      .from("divisions")
      .select("*")
      .eq("company_id", employee.company_id);
      
    if (error) {
      throw error;
    }
    
    return divisions || [];
  } catch (error) {
    console.error("Error fetching divisions:", error);
    throw error;
  }
}

/**
 * Creates a new division for the current user's company
 */
export async function createDivision(divisionData: Omit<Division, 'id' | 'company_id' | 'created_at'>): Promise<Division> {
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
      ...divisionData,
      company_id: employee.company_id,
    };
    
    // Insert the new division
    const { data, error } = await supabase
      .from("divisions")
      .insert(formattedData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating division:", error);
    throw error;
  }
}

/**
 * Updates an existing division
 */
export async function updateDivision(divisionData: Partial<Division> & { id: number }): Promise<void> {
  try {
    
    if (!divisionData.id) {
      throw new Error("Division ID is required for update");
    }
    
    // Extract id and update data
    const { id, ...updateData } = divisionData;
    
    // Update the division
    const { error } = await supabase
      .from("divisions")
      .update(updateData)
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating division:", error);
    throw error;
  }
}

/**
 * Deletes a division by ID
 */
export async function deleteDivision(id: number): Promise<void> {
  try {
    
    if (!id) {
      throw new Error("Division ID is required for deletion");
    }
    
    // Delete the division
    const { error } = await supabase
      .from("divisions")
      .delete()
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting division:", error);
    throw error;
  }
} 