export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    supervisorName: string;
    username: string;
    role: 'end user' | 'supervisor' | 'HR' | 'system admin' | 'super admin';
    lastLogin: Date;
    isActive: boolean;
    subordinates: string[];
    companyName: string;
    designation: string;
    department: string;
    phone: string;
    jobStatus: string;
    joiningDate: Date;
}