import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export interface EmployeeData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    designation: string;
    department_id: number;
    job_status: string;
    hire_date: string;
    company_id: number;
    supervisor_id?: string;
    role?: string;
}

export interface CompanyData {
    name: string;
    code: string;
}

export interface EmployeeOnboardingData {
    userData: EmployeeData | null;
    companyData: CompanyData | null;
}


/**
 * Client-side wrapper for fetching onboarding data
 */
export async function getOnboardingData(): Promise<EmployeeOnboardingData> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    // Check if user exists in employees table
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

    // If employee does not exist yet, return null data
    if (error?.code === "PGRST116") {
        return { userData: null, companyData: null };
    }

    if (error) {
        console.error("Fetch error:", error);
        throw new Error(`Failed to fetch employee data: ${error.message}`);
    }

    // Fetch company data
    const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("name, code")
        .eq("id", data.company_id)
        .single();

    if (companyError) {
        console.error("Fetch error:", companyError);
        throw new Error(`Failed to fetch company data: ${companyError.message}`);
    }

    return {
        userData: data,
        companyData: companyData,
    };
}

const generateIdInput = () => {
    const letters = Array(3)
        .fill(null)
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
        .join("");

    const digits = String(Math.floor(1000 + Math.random() * 9000));
    return letters + digits;
};


/**
 * Submits employee onboarding data
 * @param employeeData The employee data to submit
 * @returns A success message if the operation was successful
 */
export async function submitEmployeeOnboarding(employeeData: EmployeeData): Promise<{ message: string }> {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    console.log("User data:", user);


    if (authError || !user) {
        console.log("Auth error:", authError);
        throw new Error("Not authenticated");
    }

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
        supervisor_id,
    } = employeeData;

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
            supervisor_id: supervisor_id || null,
        },
    ]);

    if (error) {
        console.error("Insert error:", error.message);
        throw new Error(`Failed to submit employee data: ${error.message}`);
    }

    return { message: "Employee inserted successfully." };
}

export async function getEmployeeId() {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    return user.id;
}

export async function getUser(): Promise<{ user: User | null }> {
    const { data, error } = await supabase.auth.getUser();

    if (data.user) {
        return { user: data.user };
    }
    if (error) console.error(error);
    return { user: null };
}

function getFormattedEmployeeData(data: any) {
    return {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        role: data.role,
        company_id: data.company_id,
        supervisor_id: data.supervisor_id,
        department_id: data.department_id,
        has_approval: data.has_approval,
        email: data.email,
        phone_number: data.phone_number,
        designation: data.designation,
    };
}
export async function getEmployeeInfo() {
    // Check if we have cached data in localStorage
    const cachedData = localStorage.getItem('employeeInfo');
    const now = new Date();

    let cachedUserInfo = null;
    let cachedUpdatedAt = null;

    if (cachedData) {
        const { data, updated_at } = JSON.parse(cachedData);
        cachedUserInfo = data;
        cachedUpdatedAt = updated_at;
    }

    // If no valid cache, fetch from API
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }


    // If we have valid cached data, only check for updates
    if (cachedUserInfo && cachedUpdatedAt) {
        const { data, error } = await supabase
            .from("employees")
            .select("id, first_name, last_name, role, company_id, supervisor_id, department_id, has_approval, email, phone_number, designation")
            .eq("id", user.id)
            .gt("updated_at", cachedUpdatedAt)
            .single();

        if (error?.code === "PGRST116") {
            console.log("No updated data found");
            return cachedUserInfo;
        }

        if (error) {
            console.error("Fetch error:", error);
            throw new Error(`Failed to fetch employee data: ${error.message}`);
        }

        return getFormattedEmployeeData(data);
    }

    // If no cache exists, fetch all employee data
    const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, company_id, supervisor_id, department_id, has_approval, email, phone_number, designation")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Fetch error:", error);
        throw new Error(`Failed to fetch employee data: ${error.message}`);
    }

    const employeeData = getFormattedEmployeeData(data);

    // Cache the data with timestamp
    localStorage.setItem('employeeInfo', JSON.stringify({
        data: employeeData,
        updated_at: now.toISOString()
    }));

    return employeeData;
}