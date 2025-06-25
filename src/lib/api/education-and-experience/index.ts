"use client";

import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { Schooling, Experience } from "@/lib/types";
import { validateSchooling, validateExperience } from "@/lib/utils/validation";
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
  payload: Schooling
) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validation = validateSchooling(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase.from("schoolings").insert({
    ...validation.data,
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

      return { success: true };
    } catch {
      return { error: "File upload failed" };
    }
  }
  return { error: "No file provided" };
}

export async function updateSchooling(
  payload: Schooling
) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validation = validateSchooling(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase
    .from("schoolings")
    .update({ ...validation.data })
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
  payload: Experience
) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validation = validateExperience(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase.from("experiences").insert({
    ...validation.data,
    company_id,
    employee_id: uid,
  });

  if (error) throw error;
  return data;
}

export async function updateExperience(
  payload: Experience
) {
  const company_id = await getCompanyId();
  const uid = await getEmployeeId();

  const validation = validateExperience(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase
    .from("experiences")
    .update({ ...validation.data })
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
