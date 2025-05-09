import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      `
      id,
      name,
      code,
      country_id,
      industry_id
    `
    )
    .eq("id", cookieStore.get("company_id")?.value)
    .single();

  if (companyError?.code === "PGRST116") {
    return new Response(null, { status: 204 });
  }

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  const { data: countries, error: countriesError } = await supabase
    .from("countries")
    .select("id, name");

  if (countriesError) {
    return NextResponse.json(
      { error: countriesError.message },
      { status: 500 }
    );
  }

  const { data: industries, error: industriesError } = await supabase
    .from("industries")
    .select("id, name");

  if (industriesError) {
    return NextResponse.json(
      { error: industriesError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    company,
    countries,
    industries,
  });
}
