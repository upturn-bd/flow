import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";
import { claimTypeSchema } from "@/lib/types";

export async function getClaimTypes() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("settlement_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createClaimType(
  payload: z.infer<typeof claimTypeSchema>
) {
  const company_id = await getCompanyId();

  const validated = claimTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await supabase.from("settlement_types").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateClaimType(
  payload: z.infer<typeof claimTypeSchema>
) {
  const company_id = await getCompanyId();

  const validated = claimTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("settlement_types")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteClaimType(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("settlement_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
