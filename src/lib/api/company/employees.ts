import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "./companyInfo";

interface Employee {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Fetches all employees for the current user's company
 * Returns a simplified list with id and name
 */
export async function getEmployees(): Promise<Employee[]> {
  try {
    
    const company_id = await getCompanyId();
    
    // Fetch employees using the company_id
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("company_id", company_id);
      
    if (error) {
      throw error;
    }
    
    // Format employee data
    const formattedData = employees?.map((emp) => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      first_name: emp.first_name,
      last_name: emp.last_name
    })) || [];
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
}

/**
 * Fetches a specific employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("id", id)
      .single();
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      first_name: data.first_name,
      last_name: data.last_name
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    throw error;
  }
}

/**
 * Search employees by name (first or last)
 */
export async function searchEmployees(query: string): Promise<Employee[]> {
  try {
    
    const company_id = await getCompanyId();
    
    // Search employees
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("company_id", company_id)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
      
    if (error) {
      throw error;
    }
    
    // Format employee data
    const formattedData = employees?.map((emp) => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      first_name: emp.first_name,
      last_name: emp.last_name
    })) || [];
    
    return formattedData;
  } catch (error) {
    console.error("Error searching employees:", error);
    throw error;
  }
} 