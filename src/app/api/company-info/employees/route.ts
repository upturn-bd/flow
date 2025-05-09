import { NextResponse } from "next/server";
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
        console.log("Fetch error:", employeeError);
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
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("company_id", cookieStore.get("company_id")?.value);

    if (error) throw error;

    if (employees.length > 0) {
      const formattedData = employees.map((employee) => {
        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
        };
      });

      return NextResponse.json(
        { success: true, employees: formattedData },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, employees: [] }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
