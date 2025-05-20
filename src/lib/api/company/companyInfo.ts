import { supabase } from "@/lib/supabase/client";

export type Company = {
  id: number;
  name: string;
  code: string;
  country_id: number;
  industry_id: number;
};

export type Country = {
  id: number;
  name: string;
};

export type Industry = {
  id: number;
  name: string;
};

export type FormattedEmployee = {
  id: number;
  name: string;
};

export interface CompanyInfoResponse {
  company: Company;
  countries: Country[];
  industries: Industry[];
  formattedEmployees: FormattedEmployee[];
}

/**
 * Get company information for the current user
 * @returns Promise with company information, countries, industries and formatted employees
 */
export async function getCompanyInfo(): Promise<CompanyInfoResponse> {
  try {
    const { company_id, error: companyIdError } = await getCompanyId();

    if (companyIdError) {
      throw new Error(companyIdError.message);
    }

    const companyId = company_id;

    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        code,
        country_id,
        industry_id
      `)
      .eq("id", companyId)
      .single();

    if (companyError) {
      throw new Error(companyError.message);
    }

    // Fetch countries
    const { data: countries, error: countriesError } = await supabase
      .from("countries")
      .select("id, name");

    if (countriesError) {
      throw new Error(countriesError.message);
    }

    // Fetch industries
    const { data: industries, error: industriesError } = await supabase
      .from("industries")
      .select("id, name");

    if (industriesError) {
      throw new Error(industriesError.message);
    }

    // Fetch employees from the company
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("company_id", companyId);

    if (employeesError) {
      throw new Error(employeesError.message);
    }

    // Format employees for dropdown display
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`
    }));

    return {
      company,
      countries,
      industries,
      formattedEmployees
    };
  } catch (error) {
    console.error("Error fetching company info:", error);
    throw error;
  }
}

export async function getCompanyId(): Promise<{ company_id: number | null, error: Error | null }> {

  // Check localStorage for company_id
  const localStorageCompanyId = localStorage.getItem("company_id");
  if (localStorageCompanyId) {
    return {
      company_id: parseInt(localStorageCompanyId),
      error: null
    };
  }
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Get user's company ID
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (employeeError) {
    console.error("Error fetching company ID:", employeeError);
  }

  // Save company_id to localStorage
  localStorage.setItem("company_id", employee?.company_id.toString() || "0");

  return {
    company_id: employee?.company_id || null,
    error: employeeError || null
  };
}