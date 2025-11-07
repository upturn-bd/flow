/**
 * CSV Export Utilities for Flow HRIS System
 * Provides standardized CSV export functionality for various data types
 */

import { ExtendedEmployee } from "@/hooks/useEmployees";
import { Stakeholder } from "@/lib/types/schemas";

/**
 * Convert data to CSV format
 */
function convertToCSV(headers: string[], rows: string[][]): string {
  const csvHeaders = headers.join(",");
  const csvRows = rows.map((row) =>
    row.map((cell) => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const cellStr = String(cell ?? "");
      if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(",")
  );
  
  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Trigger browser download of CSV file
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format date for CSV export
 */
function formatDateForCSV(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Generate timestamp for filename
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

// ==============================================================================
// EMPLOYEE/HRIS DATA EXPORT
// ==============================================================================

export interface EmployeeExportOptions {
  includeEmail?: boolean;
  includePhone?: boolean;
  includeDepartment?: boolean;
  includeDesignation?: boolean;
  includeJoinDate?: boolean;
  includeSalary?: boolean;
}

export function exportEmployeesToCSV(
  employees: ExtendedEmployee[],
  options: EmployeeExportOptions = {}
): void {
  const {
    includeEmail = true,
    includePhone = true,
    includeDepartment = true,
    includeDesignation = true,
    includeJoinDate = true,
    includeSalary = false, // Sensitive data, default to false
  } = options;

  // Build headers dynamically based on options
  const headers: string[] = ["Employee ID", "Name"];
  
  if (includeEmail) headers.push("Email");
  if (includePhone) headers.push("Phone");
  if (includeDepartment) headers.push("Department");
  if (includeDesignation) headers.push("Designation");
  if (includeJoinDate) headers.push("Join Date");
  if (includeSalary) headers.push("Basic Salary");

  // Build rows
  const rows = employees.map((emp) => {
    const row: string[] = [emp.id, emp.name];
    
    if (includeEmail) row.push(emp.email || "");
    if (includePhone) row.push(emp.phone || "");
    if (includeDepartment) row.push(emp.department || "");
    if (includeDesignation) row.push(emp.designation || "");
    if (includeJoinDate) row.push(formatDateForCSV(emp.joinDate));
    if (includeSalary) row.push(emp.basic_salary?.toString() || "");
    
    return row;
  });

  const csvContent = convertToCSV(headers, rows);
  const filename = `employees_${getTimestamp()}.csv`;
  downloadCSV(csvContent, filename);
}

// ==============================================================================
// STAKEHOLDER DATA EXPORT
// ==============================================================================

export interface StakeholderExportOptions {
  includeAddress?: boolean;
  includeContactPersons?: boolean;
  includeStatus?: boolean;
  includeProcess?: boolean;
  includeKAM?: boolean;
  includeType?: boolean;
}

export function exportStakeholdersToCSV(
  stakeholders: Stakeholder[],
  options: StakeholderExportOptions = {}
): void {
  const {
    includeAddress = true,
    includeContactPersons = true,
    includeStatus = true,
    includeProcess = true,
    includeKAM = true,
    includeType = true,
  } = options;

  // Build headers
  const headers: string[] = ["Stakeholder ID", "Name"];
  
  if (includeAddress) headers.push("Address");
  if (includeStatus) headers.push("Status");
  if (includeType) headers.push("Type");
  if (includeProcess) headers.push("Process");
  if (includeKAM) headers.push("KAM");
  if (includeContactPersons) {
    headers.push("Contact Person 1 - Name");
    headers.push("Contact Person 1 - Email");
    headers.push("Contact Person 1 - Phone");
  }
  headers.push("Created At");

  // Build rows
  const rows = stakeholders.map((stakeholder) => {
    const row: string[] = [
      stakeholder.id?.toString() || "",
      stakeholder.name,
    ];
    
    if (includeAddress) row.push(stakeholder.address || "");
    if (includeStatus) row.push(stakeholder.status || "Lead");
    if (includeType) {
      // Handle both direct object and nested structure
      const typeName = stakeholder.stakeholder_type 
        ? (typeof stakeholder.stakeholder_type === 'object' 
          ? (stakeholder.stakeholder_type as any)?.name || ""
          : "")
        : "";
      row.push(typeName);
    }
    if (includeProcess) {
      // Handle both direct object and nested structure
      const processName = stakeholder.process
        ? (typeof stakeholder.process === 'object'
          ? (stakeholder.process as any)?.name || ""
          : "")
        : "";
      row.push(processName);
    }
    if (includeKAM) {
      // Handle KAM which is transformed to have a name property
      const kamName = stakeholder.kam
        ? (typeof stakeholder.kam === 'object'
          ? (stakeholder.kam as any)?.name || ""
          : "")
        : "";
      row.push(kamName);
    }
    if (includeContactPersons) {
      const firstContact = stakeholder.contact_persons?.[0];
      row.push(firstContact?.name || "");
      row.push(firstContact?.email || "");
      row.push(firstContact?.phone || "");
    }
    row.push(formatDateForCSV(stakeholder.created_at));
    
    return row;
  });

  const csvContent = convertToCSV(headers, rows);
  const filename = `stakeholders_${getTimestamp()}.csv`;
  downloadCSV(csvContent, filename);
}

// ==============================================================================
// GENERIC DATA EXPORT (for other modules)
// ==============================================================================

export interface GenericExportColumn {
  header: string;
  accessor: string | ((item: any) => string);
}

export function exportGenericDataToCSV(
  data: any[],
  columns: GenericExportColumn[],
  filename: string
): void {
  const headers = columns.map((col) => col.header);
  
  const rows = data.map((item) => {
    return columns.map((col) => {
      if (typeof col.accessor === "function") {
        return col.accessor(item);
      }
      return item[col.accessor] ?? "";
    });
  });

  const csvContent = convertToCSV(headers, rows);
  const filenameWithTimestamp = `${filename}_${getTimestamp()}.csv`;
  downloadCSV(csvContent, filenameWithTimestamp);
}
