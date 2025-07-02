/**
 * Company validation API functions
 */

import { supabase } from "@/lib/supabase/client";

export async function validateCompanyCode(name: string,code: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('code', code)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return { 
    exists: !!data,
    isValid: !!data,
    id: data?.id || null,
    name: data?.name || null
  };
}
