import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "./companyInfo";
interface Position {
  id: number;
  name: string;
  description?: string;
  department_id?: number;
  grade_id?: number;
  company_id: string | number;
  created_at?: string;
}

/**
 * Fetches all positions for the current user's company
 */
export async function getPositions(): Promise<Position[]> {
  try {
    
    const company_id = await getCompanyId();
      
    
    // Fetch positions using the company_id
    const { data: positions, error } = await supabase
      .from("positions")
      .select("*")
      .eq("company_id", company_id);
      
    if (error) {
      throw error;
    }
    
    return positions || [];
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
}

/**
 * Creates a new position for the current user's company
 */
export async function createPosition(positionData: Omit<Position, 'id' | 'company_id' | 'created_at'>): Promise<Position> {
  try {
    
    const company_id = await getCompanyId();
      
    
    // Create formatted data with company_id
    const formattedData = {
      ...positionData,
      company_id: company_id,
    };
    
    // Insert the new position
    const { data, error } = await supabase
      .from("positions")
      .insert(formattedData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating position:", error);
    throw error;
  }
}

/**
 * Updates an existing position
 */
export async function updatePosition(positionData: Partial<Position> & { id: number }): Promise<void> {
  try {
    
    if (!positionData.id) {
      throw new Error("Position ID is required for update");
    }
    
    // Extract id and update data
    const { id, ...updateData } = positionData;
    
    // Update the position
    const { error } = await supabase
      .from("positions")
      .update(updateData)
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating position:", error);
    throw error;
  }
}

/**
 * Deletes a position by ID
 */
export async function deletePosition(id: number): Promise<void> {
  try {
    
    if (!id) {
      throw new Error("Position ID is required for deletion");
    }
    
    // Delete the position
    const { error } = await supabase
      .from("positions")
      .delete()
      .eq("id", id);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting position:", error);
    throw error;
  }
} 