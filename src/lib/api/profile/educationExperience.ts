/**
 * Education and Experience API functions
 * Handles employee education and experience management
 */

import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "../context";

export async function fetchEducationExperience() {
  const employeeInfo = await getEmployeeInfo();
  
  const [educationResult, experienceResult] = await Promise.all([
    supabase
      .from('education')
      .select('*')
      .eq('employee_id', employeeInfo.id),
    supabase
      .from('experience')
      .select('*')
      .eq('employee_id', employeeInfo.id)
  ]);

  if (educationResult.error) throw educationResult.error;
  if (experienceResult.error) throw experienceResult.error;

  return {
    education: educationResult.data || [],
    experience: experienceResult.data || []
  };
}

export async function updateEducationExperience(data: { education: any[], experience: any[] }) {
  const employeeInfo = await getEmployeeInfo();
  
  // This is a simplified implementation
  // In practice, you'd handle individual education/experience records
  return data;
}
