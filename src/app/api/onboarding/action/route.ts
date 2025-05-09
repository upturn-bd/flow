import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { id, action, reason } = await request.json();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!["ACCEPTED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const update = await supabase
    .from("employees")
    .update({
      has_approval: action,
      rejection_reason: action === "REJECTED" ? reason || "No reason provided" : null,
    })
    .eq("id", id)
    .select("supervisor_id, company_id")
    .single();

  if (update.error) {
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }

  if(action === "ACCEPTED" && update.data.supervisor_id !== "Not Applicable") {
    const {data, error} = await supabase.from("supervisor_employees").insert({
      supervisor_id: update.data.supervisor_id,
      employee_id: id,
      company_id: update.data.company_id,
    })

    console.log("Insert error:", error);
    console.log("Insert data:", data);
  }

  return NextResponse.json({ message: `User ${action.toLowerCase()}` });
}
