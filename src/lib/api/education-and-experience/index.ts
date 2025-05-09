"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeId, getCompanyId } from "@/lib/auth/getUser";
import { schoolingSchema, experienceSchema } from "@/lib/types";

export async function getSchoolings() {
  const client = await createClient();

  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("schoolings")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createSchooling(
  payload: z.infer<typeof schoolingSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = schoolingSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client.from("schoolings").insert({
    ...validated.data,
    company_id,
    employee_id: uid,
  });

  if (error) throw error;
  return data;
}

export async function uploadFile(
  file: File | null
): Promise<{ success?: boolean; error?: string }> {
  if (file) {
    try {
      const supabase = await createClient();
      const uid = await getEmployeeId();
      const { data, error } = await supabase.storage
        .from("education-certificates")
        .upload(`${uid}/${file.name}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      console.log("File upload response:", data, error);
      return { success: true };
    } catch {
      return { error: "File upload failed" };
    }
  }
  return { error: "No file provided" };
}

export async function updateSchooling(
  payload: z.infer<typeof schoolingSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = schoolingSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("schoolings")
    .update({ ...validated.data })
    .eq("id", payload.id)
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteSchooling(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const { error } = await client
    .from("schoolings")
    .delete()
    .eq("id", id)
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;
  return { message: "Schooling deleted successfully" };
}

export async function getExperiences() {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("experiences")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createExperience(
  payload: z.infer<typeof experienceSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = experienceSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client.from("experiences").insert({
    ...validated.data,
    company_id,
    employee_id: uid,
  });

  if (error) throw error;
  return data;
}

export async function updateExperience(
  payload: z.infer<typeof experienceSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = experienceSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("experiences")
    .update({ ...validated.data })
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteExperience(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const { error } = await client
    .from("experiences")
    .delete()
    .eq("id", id)
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;

  return { message: "Experience deleted successfully" };
}
