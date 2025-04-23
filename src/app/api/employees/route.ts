import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const generateIdInput= () => {
  const letters = Array(3)
    .fill(null)
    .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    .join("");

  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return letters + digits;
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const body = await request.json();

  const {
    first_name,
    last_name,
    email,
    phone_number,
    designation,
    department,
    is_supervisor,
    hire_date,
    company_code,
  } = body;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("employees").insert([
    {
      id: user.id,
      first_name,
      last_name,
      email,
      phone_number,
      designation,
      department,
      role: "Employee",
      is_supervisor: is_supervisor === "yes",
      hire_date,
      company_id: company_code,
      id_input: generateIdInput(),
    },
  ]);

  if (error) {
    console.error("Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Employee inserted successfully." });
}
