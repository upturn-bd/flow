/**
 * Payroll to Accounts Integration
 * Functions to automatically create account entries when payroll is processed
 */

import { supabase } from "@/lib/supabase/client";
import { Payroll, Account, PayrollAccountEntry } from "@/lib/types/schemas";
import { getCompanyId } from "@/lib/utils/auth";
import { createAccountNotification } from "@/lib/utils/notifications";

/**
 * Create an account entry from payroll data with enhanced error handling and retry mechanism
 */
export async function createAccountFromPayroll(
  payrollData: PayrollAccountEntry,
  userId?: string,
  maxRetries: number = 3
): Promise<Account> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const company_id = await getCompanyId();
      
      // Get current user if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        userId = user.id;
      }

      // Use employee name from payrollData if available, otherwise fetch
      let employeeName = payrollData.employee_name;
      if (!employeeName) {
        const { data: employee } = await supabase
          .from("employees")
          .select("first_name, last_name")
          .eq("id", payrollData.employee_id)
          .single();

        employeeName = employee 
          ? `${employee.first_name} ${employee.last_name}`
          : `Employee ${payrollData.employee_id}`;
      }

      // Create account entry with enhanced data
      const accountData = {
        title: `Payroll - ${employeeName} (${payrollData.generation_date})`,
        method: 'Bank', // Payroll typically goes through bank
        company_id,
        status: 'Pending' as const, // Payroll entries are typically complete when logged
        from_source: `Payroll System - ${payrollData.source || 'Generated'}`,
        transaction_date: payrollData.generation_date,
        amount: -Math.abs(payrollData.total_amount || 0), // Negative because it's an expense for the company
        currency: 'BDT',
        additional_data: {
          payroll_id: payrollData.payroll_id,
          employee_id: payrollData.employee_id,
          employee_name: employeeName, // Store employee name
          basic_salary: payrollData.basic_salary,
          adjustments: payrollData.adjustments,
          source: payrollData.source || 'payroll_generation',
          category: 'payroll',
          generated_by: 'system',
          sync_attempt: attempts + 1
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
            actionUrl: '/admin?tab=accounts',
          }
        );
      } catch (notificationError) {
        // Don't fail the account creation if notification fails
        console.warn('Failed to send payroll account notification:', notificationError);
      }

      return data;
    } catch (error) {
      attempts++;
      console.error(`Account creation attempt ${attempts} failed:`, error);
      
      if (attempts >= maxRetries) {
        console.error('Max retries reached for account creation:', error);
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  throw new Error('Account creation failed after all retry attempts');
}

/**
 * Create account entries for multiple payroll records with enhanced error handling
 */
export async function createAccountsFromPayrolls(
  payrollsData: PayrollAccountEntry[],
  userId?: string
): Promise<{ success: Account[], failed: { payroll: PayrollAccountEntry, error: any }[] }> {
  const results: Account[] = [];
  const failed: { payroll: PayrollAccountEntry, error: any }[] = [];
  
  for (const payroll of payrollsData) {
    try {
      const account = await createAccountFromPayroll(payroll, userId);
      results.push(account);
    } catch (error) {
      console.error(`Error creating account for payroll ${payroll.payroll_id}:`, error);
      failed.push({ payroll, error });
    }
  }
  
  return { success: results, failed };
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
 * Update account status to Complete when payroll is marked as paid
 */
export async function markPayrollAccountComplete(payrollId: number): Promise<Account | null> {
  try {
    const company_id = await getCompanyId();
    
    // Find the account entry for this payroll
    const { data: existingAccount, error: findError } = await supabase
      .from("accounts")
      .select("*")
      .eq("company_id", company_id)
      .contains("additional_data", { payroll_id: payrollId })
      .single();

    if (findError) throw findError;
    
    if (!existingAccount) {
      console.warn(`No account entry found for payroll ${payrollId}`);
      return null;
    }

    // Update the account status to Complete
    const { data, error } = await supabase
      .from("accounts")
      .update({ 
        status: 'Complete',
        updated_at: new Date().toISOString()
      })
      .eq("id", existingAccount.id)
      .select()
      .single();

    if (error) throw error;

    console.log(`Account entry ${existingAccount.id} marked as Complete for payroll ${payrollId}`);
    
    // Send notification about account completion
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAccountNotification(
          user.id,
          'statusChanged',
          {
            employeeName: existingAccount.additional_data?.employee_name || 'Employee',
            amount: Math.abs(existingAccount.amount),
            date: existingAccount.transaction_date,
          },
          {
            referenceId: existingAccount.id,
            actionUrl: '/admin?tab=accounts',
          }
        );
      }
    } catch (notificationError) {
      console.warn('Failed to send payroll completion notification:', notificationError);
    }

    return data;
  } catch (error) {
    console.error('Error marking payroll account as complete:', error);
    throw error;
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