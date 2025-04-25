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
    .from("personal_infos")
    .select(
      `
        date_of_birth,
        gender,
        blood_group,
        marital_status,
        nid_no,
        religion,
        father_name,
        mother_name,
        spouse_name,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        permanent_address
      `
    )
    .eq("id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    return new Response(null, { status: 204 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select(
      `
        company_id
      `
    )
    .eq("id", user.id)
    .single();

  if (employeeError || !employeeData) {
    return NextResponse.json({ error: "Failed to fetch employee data" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("personal_infos")
    .upsert({
      id: user.id,
      company_id: employeeData.company_id,
      ...body,
    })
    .select();

  if (error) {
    console.error("Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data[0] });
}
