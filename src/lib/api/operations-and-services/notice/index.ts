import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import { noticeSchema } from "@/lib/types";
import { z } from "zod";

export async function getNotices() {
  const client = createClient();
  const company_id = await getCompanyId();
  const user = await getUserInfo();
  const currentDate = new Date().toISOString();

  const { data, error } = await client
    .from("notice_records")
    .select("*")
    .eq("company_id", company_id)
    .or(`department_id.is.null, department_id.eq.${user.department_id}`)
    .gte("valid_till", currentDate)
    .order("valid_from", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createNotice(payload: z.infer<typeof noticeSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = noticeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client.from("notice_records").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateNotice(payload: z.infer<typeof noticeSchema>) {
  const client = createClient();
  const company_id = await getCompanyId();

  const validated = noticeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("notice_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteNotice(id: number) {
  const client = createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("notice_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
