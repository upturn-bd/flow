import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!cookieStore.get("company_id")?.value) {
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (employeeError) {
      return NextResponse.json(
        { error: employeeError.message },
        { status: 500 }
      );
    }

    if (employee.company_id) {
      cookieStore.set("company_id", employee.company_id);
    }
  }

  try {
    const { data: grades, error } = await supabase
      .from("grades")
      .select("*")
      .eq("company_id", cookieStore.get("company_id")?.value)
    if (error) throw error;

    return NextResponse.json(
      { success: true, grades: grades },
      { status: 200 }
    );
  } catch (error) {
    console.error(error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // check if company_id cookie is set, if not, fetch it from the database
  if (!cookieStore.get("company_id")?.value) {
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (employeeError) {
      return NextResponse.json(
        { error: employeeError.message },
        { status: 500 }
      );
    }
    if (employee.company_id) {
      cookieStore.set("company_id", employee.company_id);
    }
  }

  try {
    const body = await req.json();
    const { id, ...rest } = body;
    const formattedData = {
      ...rest,
      company_id: cookieStore.get("company_id")?.value,
    };

    const { data, error } = await supabase
      .from("grades")
      .insert(formattedData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error(error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "grade ID is required for deletion." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("id", Number(id));

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "grade deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
