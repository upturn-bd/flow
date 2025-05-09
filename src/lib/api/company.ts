"use server";

import { cookies } from "next/headers";
import { createClient } from "../supabase/server";

export async function getCompanyId(uid: string): Promise<number> {
  const cookiestore = await cookies();
  const client = await createClient();
  const company_id = cookiestore.get("company_id")?.value;
  if (!company_id) {
    const { data, error } = await client
      .from("employees")
      .select("company_id")
      .eq("id", uid)
      .single();
    if (!data) {
      throw error;
    }

    cookiestore.set("company_id", data.company_id);

    return parseInt(data.company_id);
  } else {
    return parseInt(company_id);
  }
}

export async function getDesignations(uid: string) {
  const client = await createClient();

  const company_id = await getCompanyId(uid);

  const { data, error } = await client
    .from("designations")
    .select(
      `
    id,
    positions(
        name
    )
    `
    )
    .eq("company_id", company_id);
  console.log(data);
  if (error) {
    throw error;
  }
  return data;
}

export async function validateCompanyCode(
  name: string,
  code: string
): Promise<{ isValid: boolean; id: number | null }> {
  const client = await createClient();
  const id: number | null = null;
  const isValid: boolean = false;
  const { data, error } = await client
    .from("companies")
    .select("id, name")
    .eq("code", code)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No row found (PostgREST code for no result on single)
      return { isValid, id };
    }
    throw error;
  }
  if (!data || data.name !== name) {
    return { isValid: false, id };
  }

  return { isValid: true, id: data.id };
}

export async function getDepartments(uid: string) {
  const client = await createClient();

  const company_id = await getCompanyId(uid);

  const { data, error } = await client
    .from("depts")
    .select(
      `
    id,
    name
    `
    )
    .eq("company_id", company_id.toString());
  if (error) {
    throw error;
  }
  return data;
}
