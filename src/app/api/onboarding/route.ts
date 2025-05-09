import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const generateIdInput = () => {
  const letters = Array(3)
    .fill(null)
    .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    .join("");

  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return letters + digits;
};

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
        first_name,
        last_name,
        email,
        phone_number,
        department_id,
        designation,
        job_status,
        hire_date,
        company_id,
        role
      `
    )
    .eq("id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    // No row found (PostgREST code for no result on single)
    return new Response(null, { status: 204 }); // No Content
  }

  if (error) {
    console.log("Fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .select(
      `name, code
      `
    )
    .eq("id", data.company_id)
    .single();

  if (companyError) {
    console.log("Fetch error:", companyError);
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: { userData: data, companyData: companyData },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();

  const {
    first_name,
    last_name,
    email,
    phone_number,
    designation,
    department_id,
    hire_date,
    company_id,
    job_status,
  } = body;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("employees").upsert([
    {
      id: user.id,
      first_name,
      last_name,
      email,
      phone_number,
      designation,
      department_id,
      job_status,
      role: "Employee",
      is_supervisor: false,
      hire_date,
      company_id,
      rejection_reason: null,
      has_approval: "PENDING",
      id_input: generateIdInput(),
    },
  ]);

  if (error) {
    console.error("Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Employee inserted successfully." });
}
