/**
 * Payroll to Accounts Integration
 * Functions to automatically create account entries when payroll is processed
 */

import { supabase } from "@/lib/supabase/client";
import { Payroll, Account } from "@/lib/types/schemas";
import { getCompanyId } from "@/lib/utils/auth";
import { createAccountNotification } from "@/lib/utils/notifications";

export interface PayrollAccountEntry {
  payroll_id: number;
  employee_id: string;
  total_amount: number;
  basic_salary: number;
  adjustments: Array<{type: string; amount: number}>;
  generation_date: string;
}

/**
 * Create an account entry from payroll data
 */
export async function createAccountFromPayroll(
  payrollData: PayrollAccountEntry,
  userId?: string
): Promise<Account> {
  try {
    const company_id = await getCompanyId();
    
    // Get current user if userId not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      userId = user.id;
    }

    // Get employee name for title
    const { data: employee } = await supabase
      .from("employees")
      .select("first_name, last_name")
      .eq("id", payrollData.employee_id)
      .single();

    const employeeName = employee 
      ? `${employee.first_name} ${employee.last_name}`
      : `Employee ${payrollData.employee_id}`;

    // Create account entry
    const accountData = {
      title: `Payroll - ${employeeName} (${payrollData.generation_date})`,
      method: 'Bank', // Payroll typically goes through bank
      company_id,
      status: 'Complete' as const, // Payroll entries are typically complete when logged
      from_source: 'Payroll System',
      transaction_date: payrollData.generation_date,
      amount: -Math.abs(payrollData.total_amount), // Negative because it's an expense for the company
      currency: 'BDT',
      additional_data: {
        payroll_id: payrollData.payroll_id,
        employee_id: payrollData.employee_id,
        basic_salary: payrollData.basic_salary,
        adjustments: payrollData.adjustments,
        category: 'payroll',
        generated_by: 'system'
      },
      created_by: userId,
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;

    // Send notification for automatic payroll logging
    try {
      await createAccountNotification(
        userId!,
        'payrollLogged',
        {
          employeeName,
          amount: payrollData.total_amount,
          date: payrollData.generation_date,
        },
        {
          referenceId: data.id,
          actionUrl: '/admin-management?tab=accounts',
        }
      );
    } catch (notificationError) {
      // Don't fail the account creation if notification fails
      console.warn('Failed to send payroll account notification:', notificationError);
    }

    return data;
  } catch (error) {
    console.error('Error creating account from payroll:', error);
    throw error;
  }
}

/**
 * Create account entries for multiple payroll records
 */
export async function createAccountsFromPayrolls(
  payrollsData: PayrollAccountEntry[],
  userId?: string
): Promise<Account[]> {
  const results: Account[] = [];
  
  for (const payroll of payrollsData) {
    try {
      const account = await createAccountFromPayroll(payroll, userId);
      results.push(account);
    } catch (error) {
      console.error(`Error creating account for payroll ${payroll.payroll_id}:`, error);
      // Continue processing other payrolls even if one fails
    }
  }
  
  return results;
}

/**
 * Check if an account entry already exists for a payroll record
 */
export async function checkPayrollAccountExists(payrollId: number): Promise<boolean> {
  try {
    const company_id = await getCompanyId();
    
    const { data, error } = await supabase
      .from("accounts")
      .select("id")
      .eq("company_id", company_id)
      .contains("additional_data", { payroll_id: payrollId })
      .limit(1);

    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking payroll account existence:', error);
    return false;
  }
}

/**
 * Get all account entries related to payroll
 */
export async function getPayrollAccounts(): Promise<Account[]> {
  try {
    const company_id = await getCompanyId();
    
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("company_id", company_id)
      .eq("from_source", "Payroll System")
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payroll accounts:', error);
    throw error;
  }
}