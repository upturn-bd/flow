"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/utils/auth";
import { Payroll, PayrollAdjustment } from "@/lib/types/schemas";
import { createPayrollNotification } from "@/lib/utils/notifications";
import { formatDate } from "@/lib/utils";

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
    status: 'Paid' | 'Pending' | 'Adjusted',
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
          if (status === 'Adjusted') {
            const adjustmentReason = adjustments && adjustments.length > 0 
              ? adjustments.map(adj => adj.type).join(', ')
              : 'Payroll adjusted';
            
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
    if (!payrolls.length) return { total: 0, paid: 0, pending: 0, adjusted: 0 };
    
    return {
      total: payrolls.length,
      paid: payrolls.filter(p => p.status === 'Paid').length,
      pending: payrolls.filter(p => p.status === 'Pending').length,
      adjusted: payrolls.filter(p => p.status === 'Adjusted').length,
    };
  }, [payrolls]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
  };
}