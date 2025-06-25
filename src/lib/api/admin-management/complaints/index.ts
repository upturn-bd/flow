import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { ComplaintsType } from "@/lib/types/schemas";
import { validateComplaintsType } from "@/lib/utils/validation";

export async function getComplaintTypes() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("complaint_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createComplaintType(
  payload: ComplaintsType
) {
  const company_id = await getCompanyId();

  const validated = validateComplaintsType(payload);
  if (!validated.success) throw new Error(validated.errors.map(e => e.message).join(', '));

  const { data, error } = await supabase.from("complaint_types").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function deleteComplaintType(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("complaint_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
