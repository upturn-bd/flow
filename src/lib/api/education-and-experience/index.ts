"use client";

import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { schoolingSchema, experienceSchema } from "@/lib/types";
import { getCompanyId } from "../company/companyInfo";
import { getEmployeeId } from "../employee";

export async function getSchoolings() {
  const user = await getEmployeeInfo();
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("schoolings")
    .select("*")
    .eq("company_id", company_id)
    .eq("employee_id", user.id);

  if (error) throw error;
  return data;
}

export async function createSchooling(
  payload: z.infer<typeof schoolingSchema>
) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = schoolingSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("schoolings").insert({
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
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = schoolingSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("schoolings")
    .update({ ...validated.data })
    .eq("id", payload.id)
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteSchooling(id: number) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const { error } = await supabase
    .from("schoolings")
    .delete()
    .eq("id", id)
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;
  return { message: "Schooling deleted successfully" };
}

export async function getExperiences() {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("company_id", company_id)
    .eq("employee_id", user.id);

  if (error) throw error;
  return data;
}

export async function createExperience(
  payload: z.infer<typeof experienceSchema>
) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = experienceSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("experiences").insert({
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
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validated = experienceSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("experiences")
    .update({ ...validated.data })
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteExperience(id: number) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const { error } = await supabase
    .from("experiences")
    .delete()
    .eq("id", id)
    .eq("employee_id", uid)
    .eq("company_id", company_id);

  if (error) throw error;

  return { message: "Experience deleted successfully" };
}
