"use client";

import { EmployeeSalaryList } from "@/components/admin-management/salary/SalaryManagement"

export default function PayrollSettingsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Payroll Settings Configuration
      </h1>
      {/* Assuming PayrollTab contains the specific configuration logic */}
      <EmployeeSalaryList />
    </>
  );
}
