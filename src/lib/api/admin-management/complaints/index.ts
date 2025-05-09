"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getUser";
import { complaintsTypeSchema } from "@/lib/types";

export async function getComplaintTypes() {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("complaint_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createComplaintType(
  payload: z.infer<typeof complaintsTypeSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = complaintsTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await client.from("complaint_types").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function deleteComplaintType(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("complaint_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
