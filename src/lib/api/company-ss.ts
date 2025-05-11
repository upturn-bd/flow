"use server";

import { createClient } from "../supabase/server";

export async function validateCompanyCode(
    name: string,
    code: string
  ): Promise<{ isValid: boolean; id: number | null }> {
    const client = await createClient();
    const id: number | null = null;
    const isValid: boolean = false;
    const { data, error } = await client
      .from("companies")
      .select("id, name")
      .eq("code", code)
      .single();
  
    if (error) {
      if (error.code === "PGRST116") {
        // No row found (PostgREST code for no result on single)
        return { isValid, id };
      }
      throw error;
    }
    if (!data || data.name !== name) {
      return { isValid: false, id };
    }
  
    return { isValid: true, id: data.id };
  }