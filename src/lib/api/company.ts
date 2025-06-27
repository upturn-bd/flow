/**
 * Company validation API functions
 */

import { supabase } from "@/lib/supabase/client";

export async function validateCompanyCode(code: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return { exists: !!data };
}
