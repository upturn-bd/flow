import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";
import { lineageSchema } from "@/lib/types";

export async function getLineages() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("lineages")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createLineage(payload: z.infer<typeof lineageSchema>[]) {
  const company_id = await getCompanyId();

  const validatedLineageData = payload.map((lineage) => {
    return { ...lineage, company_id };
  });

  const { data, error } = await supabase
    .from("lineages")
    .insert(validatedLineageData);

  if (error) throw error;
  return;
}

export async function updateLineage(payload: z.infer<typeof lineageSchema>[]) {
  const company_id = await getCompanyId();
  const formattedPayload = payload.map((lineage) => {
    const { id, ...rest } = lineage;
    return { ...rest, company_id };
  });

  const { data: existingLineages, error: fetchError } = await supabase
    .from("lineages")
    .delete()
    .eq("company_id", company_id)
    .eq("name", formattedPayload[0].name);

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from("lineages")
    .insert(formattedPayload);

  if (error) throw error;
  return data;
}

export async function deleteLineage(name: string) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("lineages")
    .delete()
    .eq("name", name)
    .eq("company_id", company_id);

  if (error) throw error;
  return { message: "Lineage deleted successfully" };
}
