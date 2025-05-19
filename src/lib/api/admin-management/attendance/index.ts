import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";
import { siteSchema } from "@/lib/types";

export async function getSites() {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("sites")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createSite(payload: z.infer<typeof siteSchema>) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = siteSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await client.from("sites").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateSite(payload: z.infer<typeof siteSchema>) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = siteSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("sites")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteSite(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("sites")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
