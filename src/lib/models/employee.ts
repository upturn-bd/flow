export interface EmployeeBasicInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    supervisorName?: string;
    username: string;
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
