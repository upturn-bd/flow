"use client";

import { getUser } from "../api/getUser";
import { createClient } from "../supabase/client";

export interface EmployeeBasicInfo {
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

export class Employee {
    basicInfo?: EmployeeBasicInfo;
    personalInfo?: EmployeePersonalInfo;
    educationInfos?: EmployeeEducationInfo[];
    experienceInfos?: EmployeeExperienceInfo[];

    async getBasicInfo() {
        const supabase = createClient();
        const { user } = await getUser();

        const { data, error } = await supabase.from('employees').select('*').eq('id', user?.id).single();
        this.basicInfo = {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            username: data.username,
            role: 'end user',
            phone: data.phone_number,
            joiningDate: new Date(data.hire_date),
            isActive: data.is_active,
        };
        const { data: companyData, error: companyError } = await supabase.from('companies').select('*').eq('id', data.company_id).single();
        this.basicInfo.companyName = companyData.name;
    }
}