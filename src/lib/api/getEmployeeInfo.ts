import { EmployeeBasicInfo } from "../models/employee";
import { createClient } from "../supabase/client";

export async function getBasicEmployeeInfo(): Promise<{ basicInfo?: EmployeeBasicInfo }> {
    const supabase = createClient({ db: { schema: 'employee' } });
    const { data, error } = await supabase.auth.getUser();
    // const { data, error } = await supabase.from('employee').select('*').eq('id', '18d0ac52-570b-46f9-b7ab-26a2f2c213d7').single();
    console.error(data);
    console.error(error);
    return { basicInfo: undefined }; // or fetch and return the actual EmployeeBasicInfo
}