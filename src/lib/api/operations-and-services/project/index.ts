import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { Project } from "@/lib/types";
import { validateProject } from "@/lib/utils/validation";

export async function getProjects() {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();

  if (user.role === "Admin") {
    const { data, error } = await supabase
      .from("project_records")
      .select("*")
      .eq("status", "Ongoing")
      .eq("company_id", company_id);

    if (error) throw error;
    const formatData = data?.map((item) => {
      const { created_at, updated_at, ...rest } = item;
      return {
        ...rest,
      };
    });
    return formatData;
  }
  const { data, error } = await supabase
    .from("project_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("status", "Ongoing")
    .or(
      `assignees.cs.{${user.id}}, department_id.eq.${user.department_id}, project_lead_id.eq.${user.id}`
    );

  if (error) throw error;
  const formatData = data?.map((item) => {
    const { created_at, updated_at, ...rest } = item;
    return {
      ...rest,
    };
  });
  return formatData;
}

export async function createProject(payload: Project): Promise<{ id: number }> {
  const company_id = await getCompanyId();

  const validation = validateProject(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase.from("project_records").insert({
    ...payload,
    company_id,
  }).select("id").single();

  if (error) throw error;
  return data;
}

export async function updateProject(payload: Project) {
  const company_id = await getCompanyId();

  console.log("payload", payload);

  const validation = validateProject(payload);
  if (!validation.success) {
    const error = new Error("Validation failed");
    (error as any).issues = validation.errors;
    throw error;
  }

  const { data, error } = await supabase
    .from("project_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  console.log("error", error);
  if (error) throw error;
  return data;
}

export async function deleteProject(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("project_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
