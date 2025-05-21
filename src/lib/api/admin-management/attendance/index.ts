import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { siteSchema } from "@/lib/types";

export async function getSites() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createSite(payload: z.infer<typeof siteSchema>) {
  const company_id = await getCompanyId();

  const validated = siteSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await supabase.from("sites").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateSite(payload: z.infer<typeof siteSchema>) {
  const company_id = await getCompanyId();

  const validated = siteSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("sites")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteSite(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("sites")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
