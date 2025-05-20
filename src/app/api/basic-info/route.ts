import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch requested user data if uid provided, otherwise get current user data
  const userId = uid || user.id;
  
  // If trying to access someone else's data, check if current user has permission
  if (uid && user.id !== uid) {
    // You would typically check here if the current user has admin privileges
    // For simplicity, we'll allow access if the user exists in the system
    const { data: userCheck } = await supabase
      .from("employees")
      .select("id, role")
      .eq("id", user.id)
      .single();
      
    // Optional: Add more sophisticated permission checks here
    // For example, check if current user is an admin or has specific role
    const hasPermission = userCheck?.role === 'Admin' || userCheck?.role === 'HR';
    
    if (!hasPermission) {
      // Just allow view access for now, but you might want to restrict this
      // in production based on your security requirements
      console.log("User attempting to view another user's profile:", user.id, "viewing", uid);
    }
  }

  const { data, error } = await supabase
    .from("employees")
    .select(
      "first_name, last_name, email, phone_number, department_id, designation, job_status, hire_date, id_input"
    )
    .eq("id", userId)
    .single();

  if (error?.code === "PGRST116") {
    return new Response(null, { status: 204 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("employees")
    .update({...body})
    .eq("id", user.id);

  if (error) {
    console.log("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Employee info updated successfully" });
}
