import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { supabase } from "@/lib/supabase/client";
import { noticeSchema } from "@/lib/types";
import { z } from "zod";

export async function getAllNotices() {
  const company_id = await getCompanyId();
  const user = await getEmployeeInfo();
  const currentDate = new Date().toISOString();

  const { data, error } = await supabase
    .from("notice_records")
    .select("*")
    .eq("company_id", company_id)
    .gte("valid_till", currentDate)
    .order("valid_from", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getNoticesByDepartment() {
  const company_id = await getCompanyId();
  const currentDate = new Date().toISOString();
  const user = await getEmployeeInfo();

  const { data, error } = await supabase
    .from("notice_records")
    .select("*")
    .eq("company_id", company_id)
    .eq("department_id", user.department_id)
    .gte("valid_till", currentDate)
    .order("valid_from", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createNotice(payload: z.infer<typeof noticeSchema>) {
  const company_id = await getCompanyId();

  const validated = noticeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("notice_records")
    .insert({
      ...payload,
      company_id,
    });

  if (error) throw error;
  return data;
}

export async function updateNotice(payload: z.infer<typeof noticeSchema>) {
  const company_id = await getCompanyId();

  const validated = noticeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("notice_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteNotice(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("notice_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
