/**
 * Education and Experience API functions
 * Handles employee education and experience management
 */

import { supabase } from "@/lib/supabase/client";

// Function to fetch user education records
export async function fetchUserEducation(userId: string) {
  const { data, error } = await supabase
    .from('schoolings')
    .select('*')
    .eq('employee_id', userId);

  if (error) throw error;
  return data || [];
}

// Function to fetch user experience records  
export async function fetchUserExperience(userId: string) {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('employee_id', userId);

  if (error) throw error;
  return data || [];
}