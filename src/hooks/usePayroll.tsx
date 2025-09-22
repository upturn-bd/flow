"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/utils/auth";
import { Payroll, PayrollAdjustment, PayrollAccountEntry } from "@/lib/types/schemas";
import { createPayrollNotification } from "@/lib/utils/notifications";
import { formatDate } from "@/lib/utils";
import { createAccountFromPayroll } from "@/lib/utils/payroll-accounts";

export function usePayroll() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch payroll history for current employee
  const fetchPayrollHistory = useCallback(async (employeeId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const companyId = await getCompanyId();
      
      let query = supabase
        .from("payrolls")
        .select(`
          *,
          employee:employees!payrolls_employee_id_fkey(first_name, last_name, email),
          supervisor:employees!payrolls_supervisor_id_fkey(first_name, last_name)
        `)
        .eq("company_id", companyId)
        .order("generation_date", { ascending: false });

      // If employeeId is provided, filter by that employee
      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPayrolls(data || []);
      return data || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch payrolls supervised by current user
  const fetchSupervisedPayrolls = useCallback(async (supervisorId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const companyId = await getCompanyId();
      
      let query = supabase
        .from("payrolls")
        .select(`
          *,
          employee:employees!payrolls_employee_id_fkey(first_name, last_name, email, department_id),
          supervisor:employees!payrolls_supervisor_id_fkey(first_name, last_name)
        `)
        .eq("company_id", companyId)
        .order("generation_date", { ascending: false });

      // If supervisorId is provided, filter by that supervisor
      if (supervisorId) {
        query = query.eq("supervisor_id", supervisorId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPayrolls(data || []);
      return data || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update payroll status (for adjustments)
  const updatePayrollStatus = useCallback(async (
    payrollId: number, 
    status: 'Paid' | 'Pending' | 'Published', // Updated status types
    adjustments?: PayrollAdjustment[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updateData: Partial<Payroll> = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (adjustments) {
        updateData.adjustments = adjustments;
        // Recalculate total amount
        const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
        const payroll = payrolls.find(p => p.id === payrollId);
        if (payroll) {
          updateData.total_amount = payroll.basic_salary + adjustmentTotal;
        }
      }

      const { data, error } = await supabase
        .from("payrolls")
        .update(updateData)
        .eq("id", payrollId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPayrolls(prev => 
        prev.map(payroll => 
          payroll.id === payrollId 
            ? { ...payroll, ...updateData }
            : payroll
        )
      );

      // Send notification to employee about payroll status change
      try {
        const payroll = payrolls.find(p => p.id === payrollId);
        if (payroll && payroll.employee_id) {
          if (status === 'Published') { // Updated from 'Adjusted'
            const adjustmentReason = adjustments && adjustments.length > 0 
              ? adjustments.map(adj => adj.type).join(', ')
              : 'Payroll published';
            
            await createPayrollNotification(
              payroll.employee_id,
              'adjusted',
              {
                gradeName: payroll.grade_name,
                newAmount: updateData.total_amount || payroll.total_amount,
                adjustmentReason
              },
              {
                referenceId: payrollId,
                actionUrl: '/operations-and-services/services/payroll'
              }
            );
          } else if (status === 'Paid') {
            await createPayrollNotification(
              payroll.employee_id,
              'paid',
              {
                gradeName: payroll.grade_name,
                amount: payroll.total_amount,
                date: formatDate(payroll.generation_date)
              },
              {
                referenceId: payrollId,
                actionUrl: '/operations-and-services/services/payroll'
              }
            );
          }
        }
      } catch (notificationError) {
        console.warn('Failed to send payroll notification:', notificationError);
        // Don't fail the entire operation for notification errors
      }

      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [payrolls]);

  // Get payroll statistics
  const payrollStats = useMemo(() => {
    if (!payrolls.length) return { total: 0, paid: 0, pending: 0, published: 0 }; // Updated from 'adjusted' to 'published'
    
    return {
      total: payrolls.length,
      paid: payrolls.filter(p => p.status === 'Paid').length,
      pending: payrolls.filter(p => p.status === 'Pending').length,
      published: payrolls.filter(p => p.status === 'Published').length, // Updated from 'adjusted'
    };
  }, [payrolls]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create account entry from payroll (for automatic accounting)
  const logPayrollToAccounts = useCallback(async (payroll: Payroll) => {
    try {
      // Get employee name for the account entry
      const { data: employee } = await supabase
        .from("employees")
        .select("first_name, last_name")
        .eq("id", payroll.employee_id)
        .single();

      const employeeName = employee 
        ? `${employee.first_name} ${employee.last_name}`
        : `Employee ${payroll.employee_id}`;

      const payrollAccountData: PayrollAccountEntry = {
        payroll_id: payroll.id!,
        employee_id: payroll.employee_id,
        employee_name: employeeName,
        total_amount: payroll.total_amount,
        basic_salary: payroll.basic_salary,
        adjustments: payroll.adjustments,
        generation_date: payroll.generation_date,
        source: payroll.status === 'Published' ? 'manual_adjustment' : 'payroll_generation'
      };

      const account = await createAccountFromPayroll(payrollAccountData);
      return account;
    } catch (error) {
      console.error('Error logging payroll to accounts:', error);
      throw error;
    }
  }, []);

  // Process payroll with automatic account creation
  const processPayrollWithAccounting = useCallback(async (payrollId: number) => {
    try {
      // Update payroll status to Paid
      const updatedPayroll = await updatePayrollStatus(payrollId, 'Paid');
      
      // Create corresponding account entry
      if (updatedPayroll) {
        await logPayrollToAccounts(updatedPayroll);
      }

      return updatedPayroll;
    } catch (error) {
      console.error('Error processing payroll with accounting:', error);
      throw error;
    }
  }, [updatePayrollStatus, logPayrollToAccounts]);

  // Check for pending payrolls for any employee in the company
  const checkPendingPayrolls = useCallback(async () => {
    try {
      const companyId = await getCompanyId();
      
      const { data, error } = await supabase
        .from("payrolls")
        .select("id, employee_id, generation_date")
        .eq("company_id", companyId)
        .in("status", ["Pending", "Published"])
        .limit(1);

      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking pending payrolls:', error);
      return null;
    }
  }, []);

  // Generate payroll for company with retry mechanism
  const generatePayrollWithRetry = useCallback(async (
    generationDate: string,
    maxRetries: number = 3
  ) => {
    setLoading(true);
    setError(null);
    
    let attempts = 0;
    const failedOperations: string[] = [];
    
    while (attempts < maxRetries) {
      try {
        // Check if there are pending payrolls first
        const pendingPayroll = await checkPendingPayrolls();
        if (pendingPayroll) {
          throw new Error(`Cannot generate payroll. There is a pending payroll for employee from ${pendingPayroll.generation_date}`);
        }

        // Call the edge function for payroll generation
        const { data, error } = await supabase.functions.invoke('generate_payroll', {
          body: { generation_date: generationDate }
        });

        if (error) throw error;

        // If successful, publish payrolls (change status to Published)
        const { error: publishError } = await supabase
          .from("payrolls")
          .update({ status: 'Published' })
          .eq("generation_date", generationDate)
          .eq("status", "Pending");

        if (publishError) {
          // Log the error but don't fail completely
          failedOperations.push('Failed to publish some payrolls');
          console.error('Error publishing payrolls:', publishError);
        }

        // Sync with accounts system
        try {
          const { data: generatedPayrolls } = await supabase
            .from("payrolls")
            .select("*")
            .eq("generation_date", generationDate)
            .eq("status", "Published");

          if (generatedPayrolls && generatedPayrolls.length > 0) {
            for (const payroll of generatedPayrolls) {
              try {
                await logPayrollToAccounts(payroll);
              } catch (accountError) {
                failedOperations.push(`Failed to sync payroll ${payroll.id} to accounts`);
                console.error(`Failed to sync payroll ${payroll.id}:`, accountError);
              }
            }
          }
        } catch (syncError) {
          failedOperations.push('Failed to sync with accounts system');
          console.error('Account sync error:', syncError);
        }

        setLoading(false);
        
        // Return results with any failed operations noted
        return {
          success: true,
          data,
          failedOperations: failedOperations.length > 0 ? failedOperations : null
        };

      } catch (error) {
        attempts++;
        console.error(`Payroll generation attempt ${attempts} failed:`, error);
        
        if (attempts >= maxRetries) {
          // Final attempt failed, rollback any partial changes
          try {
            await supabase
              .from("payrolls")
              .delete()
              .eq("generation_date", generationDate)
              .eq("status", "Pending");
          } catch (rollbackError) {
            console.error('Failed to rollback payroll generation:', rollbackError);
          }
          
          setError(error instanceof Error ? error : new Error(String(error)));
          setLoading(false);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }, [checkPendingPayrolls, logPayrollToAccounts]);

  return {
    // State
    payrolls,
    loading,
    error,
    payrollStats,

    // Actions
    fetchPayrollHistory,
    fetchSupervisedPayrolls,
    updatePayrollStatus,
    clearError,
    
    // Accounting Integration
    logPayrollToAccounts,
    processPayrollWithAccounting,

    // Enhanced Payroll Generation
    checkPendingPayrolls,
    generatePayrollWithRetry,
  };
}