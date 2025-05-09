"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getUser";
import { leaveTypeSchema, holidayConfigSchema } from "@/lib/types";

export async function getLeaveTypes() {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("leave_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createLeaveType(
  payload: z.infer<typeof leaveTypeSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = leaveTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await client.from("leave_types").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateLeaveType(
  payload: z.infer<typeof leaveTypeSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = leaveTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("leave_types")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteLeaveType(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("leave_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}

export async function getHolidayConfigs() {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { data, error } = await client
    .from("weekly_holiday_configs")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createHolidayConfig(
  payload: z.infer<typeof holidayConfigSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = holidayConfigSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { id, ...rest } = payload;

  const { data, error } = await client.from("weekly_holiday_configs").insert({
    ...rest,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateHolidayConfig(
  payload: z.infer<typeof holidayConfigSchema>
) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const validated = holidayConfigSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await client
    .from("weekly_holiday_configs")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteHolidayConfig(id: number) {
  const client = await createClient();
  const company_id = await getCompanyId();

  const { error } = await client
    .from("weekly_holiday_configs")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}
