import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      phone_number,
      department,
      designation,
      job_status,
      hire_date,
      supervisor:first_name,
      has_approval
    `
    )
    .eq("has_approval", "PENDING");

  if (error) {
    console.error("Fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
