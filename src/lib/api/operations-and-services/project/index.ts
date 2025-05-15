import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { projectSchema } from "@/lib/types";

export async function getProjects() {
  const client = createClient();
  const company_id = await getCompanyId();
  const user = await getUserInfo();

  if (user.role === "Admin") {
    const { data, error } = await client
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
  const { data, error } = await client
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

export async function createProject(payload: z.infer<typeof projectSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = projectSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client.from("project_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateProject(payload: z.infer<typeof projectSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  console.log("payload", payload);

  const validated = projectSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("project_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  console.log("error", error);
  if (error) throw error;
  return data;
}

export async function deleteProject(id: number) {
  const client = createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("project_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
