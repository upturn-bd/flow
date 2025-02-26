'use server';

import { createClient } from "../supabase/server";

export interface UserBasicInfo {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    supervisor_name?: string;
    username?: string;
    role: 'end user' | 'supervisor' | 'HR' | 'system admin' | 'super admin';
    last_login?: Date;
    is_active?: boolean;
    subordinates?: string[];
    company_name?: string;
    designation?: string;
    department?: string;
    phone?: string;
    job_status?: string;
    joining_date?: Date;
}

export interface EmployeePersonalInfo {
    gender?: string;
    father_name?: string;
    date_of_birth?: Date;
    mother_name?: string;
    religion?: string;
    spouse_name?: string;
    blood_group?: string;
    emergency_contact?: string;
    marital_status?: string;
    relation_with_ec?: string;
    children?: string[];
    phone_ec?: string;
    nid_number?: number;
    address?: string;
}

export interface EmployeeEducationInfo {
    degree: string;
    institution: string;
    from: Date;
    to?: Date;
    result?: string;
}

export interface EmployeeExperienceInfo {
    company_name: string;
    designation: string;
    description?: string;
    from: Date;
    to?: Date;
}

export interface EmployeeInfo {
    first_name: string;
    last_name: string;
    employee_id: string;
    designation: string;
    department: string;
    phone_number: string;
    email: string;
    job_status: string;
    hire_date: string;
    supervisor: string;
}

export async function getEmployeeBasicInfo(uid: string): Promise<EmployeeInfo> {
    const client = await createClient();

    const [{ data }, { data: designationData }, { data: supervisorData }] = await Promise.all([
        client.from('employees').select(`
            first_name,
            last_name,
            email,
            phone_number,
            hire_date
        `).eq('id', uid).single(),
        client.from('employee_designations').select(`
            designations(
                positions(
                    name
                ),
                depts(
                    name
                )
            )
        `).eq('employee_id', uid).single(),
        client.from('supervisor_employees').select(`
            supervisor_id
        `).eq('employee_id', uid).single()
    ]);

    if (!data || !designationData) {
        throw new Error('Employee data not found');
    }

    let supervisor = 'N/A';
    if (supervisorData && supervisorData.supervisor_id) {
        const { data: supervisorNameData } = await client.from('employees').select(`
            first_name,
            last_name
        `).eq('id', supervisorData.supervisor_id).single();
        if (supervisorNameData) {
            supervisor = `${supervisorNameData.first_name} ${supervisorNameData.last_name}`;
        }
    }

    const employeeBasicInfo: EmployeeInfo = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number,
        designation: designationData.designations.positions.name,
        department: designationData.designations.depts.name,
        employee_id: uid,
        job_status: 'Permanent',
        hire_date: data.hire_date,
        supervisor,
    };

    return employeeBasicInfo;
}

export async function setEmployeeBasicInfo(uid: string, employeeInfo: Partial<EmployeeInfo>): Promise<{ error: Error | null }> {
    const client = await createClient();

    console.log('Updating employee info:', employeeInfo);
    const updates: any = {};
    if (employeeInfo.first_name) updates.first_name = employeeInfo.first_name;
    if (employeeInfo.last_name) updates.last_name = employeeInfo.last_name;
    if (employeeInfo.email) updates.email = employeeInfo.email;
    if (employeeInfo.phone_number) updates.phone_number = employeeInfo.phone_number;
    if (employeeInfo.hire_date) updates.hire_date = employeeInfo.hire_date;

    return await client.from('employees').update(updates).eq('id', uid);
}