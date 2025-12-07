"use client";

import { EmployeeSalaryList } from "@/components/admin/salary/SalaryManagement"

export default function PayrollSettingsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-foreground-primary mb-8">
          Payroll Configuration
      </h1>
      {/* Assuming PayrollTab contains the specific configuration logic */}
      <EmployeeSalaryList />
    </>
  );
}
