import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "./companyInfo";

interface Grade {
  id: number;
  name: string;
  level?: number;
  description?: string;
  company_id: string | number;
  created_at?: string;
}

/**
 * Fetches all grades for the current user's company
 */
export async function getGrades(): Promise<Grade[]> {
  try {
    
    const company_id = await getCompanyId();
      
    // Fetch grades using the company_id
    const { data: grades, error } = await supabase
      .from("grades")
      .select("*")
      .eq("company_id", company_id);

    if (error) {
      throw error;
    }
    
    return grades || [];
  } catch (error) {
    console.error("Error fetching grades:", error);
    throw error;
  }
}

/**
 * Creates a new grade for the current user's company
 */
export async function createGrade(gradeData: Omit<Grade, 'id' | 'company_id' | 'created_at'>): Promise<Grade> {
  try {
    
    const company_id = await getCompanyId();
      
    
    // Create formatted data with company_id
    const formattedData = {
      ...gradeData,
      company_id: company_id,
    };
    
    // Insert the new grade
    const { data, error } = await supabase
      .from("grades")
      .insert(formattedData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating grade:", error);
    throw error;
  }
}

/**
 * Updates an existing grade
 */
export async function updateGrade(gradeData: Partial<Grade> & { id: number }): Promise<void> {
  try {
    
    if (!gradeData.id) {
      throw new Error("Grade ID is required for update");
    }
    
    // Extract id and update data
    const { id, ...updateData } = gradeData;
    
    // Update the grade
    const { error } = await supabase
      .from("grades")
      .update(updateData)
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating grade:", error);
    throw error;
  }
}

/**
 * Deletes a grade by ID
 */
export async function deleteGrade(id: number): Promise<void> {
  try {
    
    if (!id) {
      throw new Error("Grade ID is required for deletion");
    }
    
    // Delete the grade
    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting grade:", error);
    throw error;
  }
} 