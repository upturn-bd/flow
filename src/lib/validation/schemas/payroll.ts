/**
 * Payroll validation functions
 */

import { Payroll, PayrollAdjustment } from "@/lib/types/schemas";

interface ValidationError {
  field: string;
  message: string;
}

export const validatePayroll = (payroll: Partial<Payroll>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!payroll.employee_id?.trim()) {
    errors.push({ field: "employee_id", message: "Employee ID is required" });
  }

  if (payroll.basic_salary === undefined || payroll.basic_salary < 0) {
    errors.push({ field: "basic_salary", message: "Valid basic salary is required" });
  }

  if (payroll.total_amount === undefined || payroll.total_amount < 0) {
    errors.push({ field: "total_amount", message: "Valid total amount is required" });
  }

  if (!payroll.generation_date?.trim()) {
    errors.push({ field: "generation_date", message: "Generation date is required" });
  }

  if (!payroll.company_id || payroll.company_id <= 0) {
    errors.push({ field: "company_id", message: "Valid company ID is required" });
  }

  if (!payroll.supervisor_id?.trim()) {
    errors.push({ field: "supervisor_id", message: "Supervisor ID is required" });
  }

  // Status validation
  if (payroll.status && !['Paid', 'Pending', 'Published'].includes(payroll.status)) {
    errors.push({ field: "status", message: "Invalid status. Must be Paid, Pending, or Published" });
  }

  // Date validation
  if (payroll.generation_date) {
    const date = new Date(payroll.generation_date);
    if (isNaN(date.getTime())) {
      errors.push({ field: "generation_date", message: "Invalid generation date format" });
    }
  }

  return errors;
};

export const validatePayrollAdjustment = (adjustment: Partial<PayrollAdjustment>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!adjustment.type?.trim()) {
    errors.push({ field: "type", message: "Adjustment type is required" });
  }

  if (adjustment.type && adjustment.type.length > 100) {
    errors.push({ field: "type", message: "Adjustment type must be less than 100 characters" });
  }

  if (adjustment.amount === undefined || adjustment.amount === null) {
    errors.push({ field: "amount", message: "Adjustment amount is required" });
  }

  if (adjustment.amount !== undefined && isNaN(adjustment.amount)) {
    errors.push({ field: "amount", message: "Adjustment amount must be a valid number" });
  }

  return errors;
};

export const validatePayrollAdjustments = (adjustments: Partial<PayrollAdjustment>[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!Array.isArray(adjustments)) {
    errors.push({ field: "adjustments", message: "Adjustments must be an array" });
    return errors;
  }

  adjustments.forEach((adjustment, index) => {
    const adjustmentErrors = validatePayrollAdjustment(adjustment);
    adjustmentErrors.forEach(error => {
      errors.push({ 
        field: `adjustments[${index}].${error.field}`, 
        message: error.message 
      });
    });
  });

  return errors;
};

export const validatePayrollUpdate = (payrollId: number, status: string, adjustments?: PayrollAdjustment[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!payrollId || payrollId <= 0) {
    errors.push({ field: "payrollId", message: "Valid payroll ID is required" });
  }

  if (!status || !['Paid', 'Pending', 'Adjusted'].includes(status)) {
    errors.push({ field: "status", message: "Invalid status. Must be Paid, Pending, or Adjusted" });
  }

  if (adjustments) {
    const adjustmentErrors = validatePayrollAdjustments(adjustments);
    errors.push(...adjustmentErrors);
  }

  return errors;
};

// Helper function to convert validation errors to object format (matching existing pattern)
export const validationErrorsToObject = (errors: ValidationError[]): Record<string, string> => {
  const errorObject: Record<string, string> = {};
  errors.forEach(error => {
    errorObject[error.field] = error.message;
  });
  return errorObject;
};

// Calculate total amount based on basic salary and adjustments
export const calculatePayrollTotal = (basicSalary: number, adjustments: PayrollAdjustment[]): number => {
  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  return Math.max(0, basicSalary + adjustmentTotal); // Ensure non-negative total
};

// Validate payroll calculation
export const validatePayrollCalculation = (payroll: Payroll): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  const expectedTotal = calculatePayrollTotal(payroll.basic_salary, payroll.adjustments);
  
  if (Math.abs(payroll.total_amount - expectedTotal) > 0.01) { // Allow for minor floating point differences
    errors.push({ 
      field: "total_amount", 
      message: `Total amount (${payroll.total_amount}) does not match calculated total (${expectedTotal})` 
    });
  }

  return errors;
};