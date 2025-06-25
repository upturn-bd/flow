import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { ClaimType } from "@/lib/types/schemas";
import { validateClaimType } from "@/lib/utils/validation";

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
  payload: ClaimType
) {
  const company_id = await getCompanyId();

  const validated = validateClaimType(payload);
  if (!validated.success) throw new Error(validated.errors.map(e => e.message).join(', '));

  const { data, error } = await supabase.from("settlement_types").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateClaimType(
  payload: ClaimType
) {
  const company_id = await getCompanyId();

  const validated = validateClaimType(payload);
  if (!validated.success) throw new Error(validated.errors.map(e => e.message).join(', '));

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
