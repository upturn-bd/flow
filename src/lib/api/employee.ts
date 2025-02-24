'use client';
import { createClient } from "../supabase/client";

export interface UserBasicInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    supervisorName?: string;
    username?: string;
    role: 'end user' | 'supervisor' | 'HR' | 'system admin' | 'super admin';
    lastLogin?: Date;
    isActive?: boolean;
    subordinates?: string[];
    companyName?: string;
    designation?: string;
    department?: string;
    phone?: string;
    jobStatus?: string;
    joiningDate?: Date;
}

export interface EmployeePersonalInfo {
    gender?: string;
    fatherName?: string;
    dateOfBirth?: Date;
    motherName?: string;
    religion?: string;
    spouseName?: string;
    bloodGroup?: string;
    emergencyContact?: string;
    maritalStatus?: string;
    relationWithEC?: string;
    children?: string[];
    phoneEC?: string;
    nidNumber?: number;
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
    companyName: string;
    designation: string;
    description?: string;
    from: Date;
    to?: Date;
}

export interface EmployeeInfo {
    name: string;
    employeeId: string;
    designation: string;
    department: string;
    phoneNumber: string;
    email: string;
    jobStatus: string;
    joiningDate: string;
    supervisor: string;
}

export async function getEmployeeBasicInfo(uid: string): Promise<EmployeeInfo> {
    const client = await createClient();
    const { data, error } = await client.from('employees').select(`
    first_name,
    last_name,
    companies (
        name
    ),
    email,
    phone_number,
    hire_date
        `).eq('id', uid).single();
    const { data: designationData } = await client.from('employee_designations').select(`
        designations(
            positions(
            name
            )
        )
        `).eq('employee_id', uid).single();
    if (!data || !designationData) {
        throw new Error('Employee data not found');
    }
    const employeeBasicInfo: EmployeeInfo = {
        name: data.first_name + ' ' + data.last_name,
        email: data.email,
        phoneNumber: data.phone_number,
        designation: designationData.designations.positions.name,
        department: 'Management',
        employeeId: uid,
        jobStatus: 'Permanent',
        joiningDate: data.hire_date,
        supervisor: 'Not Applicable'
    };
    return employeeBasicInfo;
}