import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/auth/getUser";
import { attendanceSchema } from "@/lib/types";

export async function getAttendances() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createAttendance(
  payload: z.infer<typeof attendanceSchema>
) {
  const company_id = await getCompanyId();

  const validated = attendanceSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      ...payload,
      company_id,
    });

  if (error) throw error;
  return data;
}

export async function updateAttendance(
  payload: z.infer<typeof attendanceSchema>
) {
  const company_id = await getCompanyId();

  const validated = attendanceSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("attendance_records")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteAttendance(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
