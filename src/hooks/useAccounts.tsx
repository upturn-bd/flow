"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/utils/auth";
import { Account } from "@/lib/types/schemas";
import { createAccountNotification } from "@/lib/utils/notifications";

export interface AccountFormData {
  title: string;
  method?: string | null;
  status: 'Complete' | 'Pending';
  from_source: string;
  transaction_date: string;
  amount: number;
  currency: string;
  additional_data?: Record<string, any>;
  stakeholder_id?: number | null; // Add stakeholder reference
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async (company_id?: number) => {
    setLoading(true);
    setError(null);
    try {
      if (company_id === undefined) {
        company_id = await getCompanyId();
      }

      const { data, error } = await supabase
        .from("accounts")
        .select(`
          *,
          stakeholder:stakeholders(id, name, address, is_completed)
        `)
        .eq("company_id", company_id)
        .order("transaction_date", { ascending: false }) // Newest first
        .order("created_at", { ascending: false }); // Secondary sort by creation time

      if (error) throw error;

      setAccounts(data || []);
      return data || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (accountData: AccountFormData, userId?: string) => {
    setError(null);
    try {
      const company_id = await getCompanyId();
      
      // Get current user if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        userId = user.id;
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert([
          {
            ...accountData,
            company_id,
            created_by: userId,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAccounts(prev => [data, ...prev]); // Add to beginning (newest first)
      
      // Send notification for transaction creation
      try {
        await createAccountNotification(
          userId!,
          'transactionCreated',
          {
            title: data.title,
            amount: data.amount,
            currency: data.currency,
          },
          {
            referenceId: data.id,
            actionUrl: '/admin-management?tab=accounts',
          }
        );

        // Send alert for large transactions (over 50,000 BDT or equivalent)
        if (Math.abs(data.amount) > 50000) {
          await createAccountNotification(
            userId!,
            'largeTransaction',
            {
              title: data.title,
              amount: data.amount,
              currency: data.currency,
            },
            {
              referenceId: data.id,
              actionUrl: '/admin-management?tab=accounts',
            }
          );
        }
      } catch (notificationError) {
        // Don't fail the transaction creation if notification fails
        console.warn('Failed to send account notification:', notificationError);
      }

      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    }
  }, []);

  const updateAccount = useCallback(async (id: number, accountData: Partial<AccountFormData>, userId?: string) => {
    setError(null);
    try {
      // Get current user if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        userId = user.id;
      }

      const { data, error } = await supabase
        .from("accounts")
        .update({
          ...accountData,
          updated_by: userId,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAccounts(prev => prev.map(account => 
        account.id === id ? data : account
      ));
      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    }
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    setError(null);
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setAccounts(prev => prev.filter(account => account.id !== id));
      return true;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    }
  }, []);

  // Fetch accounts by stakeholder ID
  const fetchAccountsByStakeholder = useCallback(async (stakeholderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("accounts")
        .select(`
          *,
          stakeholder:stakeholders(id, name, address, is_completed)
        `)
        .eq("company_id", company_id)
        .eq("stakeholder_id", stakeholderId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get accounts by status
  const getAccountsByStatus = useCallback((status: 'Complete' | 'Pending') => {
    return accounts.filter(account => account.status === status);
  }, [accounts]);

  // Get total amount by status
  const getTotalAmount = useCallback((status?: 'Complete' | 'Pending') => {
    const filteredAccounts = status 
      ? accounts.filter(account => account.status === status)
      : accounts;
    
    return filteredAccounts.reduce((total, account) => total + account.amount, 0);
  }, [accounts]);

  // Get stakeholder transaction summary
  const getStakeholderTransactionSummary = useCallback(async (stakeholderId: number) => {
    try {
      const transactions = await fetchAccountsByStakeholder(stakeholderId);
      
      const totalIncome = transactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
      const totalExpense = transactions.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
      const netAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const pendingTransactions = transactions.filter(t => t.status === 'Pending').length;
      const completedTransactions = transactions.filter(t => t.status === 'Complete').length;

      return {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpense,
        netAmount,
        pendingTransactions,
        completedTransactions,
      };
    } catch (err) {
      console.error('Error getting stakeholder transaction summary:', err);
      return {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        pendingTransactions: 0,
        completedTransactions: 0,
      };
    }
  }, [fetchAccountsByStakeholder]);

  // Memoized summary data
  const summary = useMemo(() => {
    const complete = accounts.filter(account => account.status === 'Complete');
    const pending = accounts.filter(account => account.status === 'Pending');
    
    return {
      total: accounts.length,
      complete: complete.length,
      pending: pending.length,
      totalAmount: accounts.reduce((sum, account) => sum + account.amount, 0),
      completeAmount: complete.reduce((sum, account) => sum + account.amount, 0),
      pendingAmount: pending.reduce((sum, account) => sum + account.amount, 0),
    };
  }, [accounts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    accounts,
    loading,
    error,
    summary,
    
    // Actions
    fetchAccounts,
    fetchAccountsByStakeholder,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountsByStatus,
    getTotalAmount,
    getStakeholderTransactionSummary,
    clearError,
  };
}