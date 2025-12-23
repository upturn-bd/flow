"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { captureError } from "@/lib/sentry";
import {
  StakeholderServicePayment,
  PaymentFormData,
  PaymentSearchOptions,
  PaymentSearchResult,
  ServicePaymentStatus,
  ServicePaymentSummary,
} from "@/lib/types/stakeholder-services";
import {
  calculateProRataInvoice,
  formatDate,
} from "@/lib/utils/pro-rata-calculation";

// ==============================================================================
// TYPES
// ==============================================================================

export interface UseServicePaymentsReturn {
  payments: StakeholderServicePayment[];
  loading: boolean;
  error: string | null;
  processingId: number | null;
  // Payment CRUD
  fetchPayments: (options?: PaymentSearchOptions) => Promise<PaymentSearchResult>;
  fetchPaymentById: (paymentId: number) => Promise<StakeholderServicePayment | null>;
  fetchPaymentsByService: (serviceId: number) => Promise<StakeholderServicePayment[]>;
  fetchPaymentsByStakeholder: (stakeholderId: number) => Promise<StakeholderServicePayment[]>;
  createPayment: (data: PaymentFormData) => Promise<StakeholderServicePayment | null>;
  updatePaymentStatus: (paymentId: number, status: ServicePaymentStatus, paymentDate?: string) => Promise<boolean>;
  deletePayment: (paymentId: number) => Promise<boolean>;
  // Summary
  fetchPaymentSummary: (stakeholderId?: number, serviceId?: number) => Promise<ServicePaymentSummary | null>;
}

// ==============================================================================
// HOOK
// ==============================================================================

export function useServicePayments(): UseServicePaymentsReturn {
  const { employeeInfo } = useAuth();
  const [payments, setPayments] = useState<StakeholderServicePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // FETCH PAYMENTS
  // ==========================================================================

  const fetchPayments = useCallback(async (
    options: PaymentSearchOptions = {}
  ): Promise<PaymentSearchResult> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const {
        service_id,
        stakeholder_id,
        status,
        from_date,
        to_date,
        search_query,
        page = 1,
        page_size = 20,
      } = options;

      // Build query
      let query = supabase
        .from("stakeholder_service_payments")
        .select(`
          *,
          service:stakeholder_services(id, service_name, direction),
          stakeholder:stakeholders(id, name, contact_persons),
          account:accounts(id, title, status),
          line_items:stakeholder_payment_line_items(*)
        `, { count: "exact" })
        .eq("company_id", companyId);

      // Apply filters
      if (service_id) {
        query = query.eq("service_id", service_id);
      }
      if (stakeholder_id) {
        query = query.eq("stakeholder_id", stakeholder_id);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (from_date) {
        query = query.gte("billing_period_start", from_date);
      }
      if (to_date) {
        query = query.lte("billing_period_end", to_date);
      }
      if (search_query) {
        query = query.ilike("reference_number", `%${search_query}%`);
      }

      // Pagination
      const from = (page - 1) * page_size;
      const to = from + page_size - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setPayments(data || []);

      const totalCount = count || 0;
      return {
        payments: data || [],
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / page_size),
        current_page: page,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch payments";
      setError(message);
      captureError(err, { operation: "fetchPayments", 
        companyId: employeeInfo?.company_id,
        options 
      });
      return {
        payments: [],
        total_count: 0,
        total_pages: 0,
        current_page: 1,
      };
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH PAYMENT BY ID
  // ==========================================================================

  const fetchPaymentById = useCallback(async (
    paymentId: number
  ): Promise<StakeholderServicePayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_payments")
        .select(`
          *,
          service:stakeholder_services(id, service_name, direction, currency, tax_rate),
          stakeholder:stakeholders(id, name, address, contact_persons),
          account:accounts(id, title, status, amount),
          line_items:stakeholder_payment_line_items(*)
        `)
        .eq("id", paymentId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch payment";
      setError(message);
      captureError(err, { operation: "fetchPaymentById", 
        companyId: employeeInfo?.company_id,
        paymentId 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH PAYMENTS BY SERVICE
  // ==========================================================================

  const fetchPaymentsByService = useCallback(async (
    serviceId: number
  ): Promise<StakeholderServicePayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_payments")
        .select(`
          *,
          account:accounts(id, title, status),
          line_items:stakeholder_payment_line_items(*)
        `)
        .eq("company_id", companyId)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch service payments";
      setError(message);
      captureError(err, { operation: "fetchPaymentsByService", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH PAYMENTS BY STAKEHOLDER
  // ==========================================================================

  const fetchPaymentsByStakeholder = useCallback(async (
    stakeholderId: number
  ): Promise<StakeholderServicePayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_payments")
        .select(`
          *,
          service:stakeholder_services(id, service_name),
          account:accounts(id, title, status),
          line_items:stakeholder_payment_line_items(*)
        `)
        .eq("company_id", companyId)
        .eq("stakeholder_id", stakeholderId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch stakeholder payments";
      setError(message);
      captureError(err, { operation: "fetchPaymentsByStakeholder", 
        companyId: employeeInfo?.company_id,
        stakeholderId 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // CREATE PAYMENT
  // ==========================================================================

  const createPayment = useCallback(async (
    data: PaymentFormData
  ): Promise<StakeholderServicePayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Fetch service with stakeholder and line items
      const { data: service, error: serviceError } = await supabase
        .from("stakeholder_services")
        .select(`
          *,
          line_items:stakeholder_service_line_items(*),
          stakeholder:stakeholders(id, name, address, contact_persons)
        `)
        .eq("id", data.service_id)
        .eq("company_id", companyId)
        .single();

      if (serviceError) {
        throw serviceError;
      }

      // Verify this is an incoming service
      if (service.direction !== 'incoming') {
        throw new Error("Payment records can only be created for incoming services");
      }

      // Fetch service history for pro-rata calculation
      const { data: history, error: historyError } = await supabase
        .from("stakeholder_service_history")
        .select("*")
        .eq("service_id", data.service_id)
        .order("effective_from", { ascending: true });

      if (historyError) {
        throw historyError;
      }

      // Calculate pro-rata amounts
      const result = calculateProRataInvoice(
        service.line_items || [],
        history || [],
        data.billing_period_start,
        data.billing_period_end,
        service.tax_rate || 0
      );

      // Create vendor snapshot
      const stakeholder = service.stakeholder as any;
      const vendorSnapshot = {
        name: stakeholder?.name || '',
        address: stakeholder?.address,
        contact_persons: stakeholder?.contact_persons,
      };

      // Create payment record
      const { data: payment, error: createError } = await supabase
        .from("stakeholder_service_payments")
        .insert({
          service_id: data.service_id,
          company_id: companyId,
          stakeholder_id: service.stakeholder_id,
          billing_period_start: data.billing_period_start,
          billing_period_end: data.billing_period_end,
          currency: service.currency,
          subtotal: result.subtotal,
          tax_rate: service.tax_rate || 0,
          tax_amount: result.taxAmount,
          total_amount: result.totalAmount,
          pro_rata_details: result.proRataDetails,
          status: 'pending',
          reference_number: data.reference_number,
          notes: data.notes,
          vendor_snapshot: vendorSnapshot,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Create payment line items
      const lineItemsData = result.lineItems.map((item, index) => ({
        payment_id: payment.id,
        item_order: index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        pro_rata_days: item.pro_rata_days,
        pro_rata_total_days: 30,
        original_amount: item.original_amount,
      }));

      const { error: lineItemsError } = await supabase
        .from("stakeholder_payment_line_items")
        .insert(lineItemsData);

      if (lineItemsError) {
        // Rollback payment
        await supabase
          .from("stakeholder_service_payments")
          .delete()
          .eq("id", payment.id);
        throw lineItemsError;
      }

      // Update service last_billed_date
      await supabase
        .from("stakeholder_services")
        .update({ 
          last_billed_date: data.billing_period_end,
          updated_by: userId,
        })
        .eq("id", data.service_id);

      // If auto_create_payment is enabled, create account entry via edge function
      // This is handled by the edge function that triggers on payment insert
      // The edge function will create the account entry and update payment.account_id

      return await fetchPaymentById(payment.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create payment";
      setError(message);
      captureError(err, { operation: "createPayment", 
        companyId: employeeInfo?.company_id,
        serviceId: data.service_id 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id, fetchPaymentById]);

  // ==========================================================================
  // UPDATE PAYMENT STATUS
  // ==========================================================================

  const updatePaymentStatus = useCallback(async (
    paymentId: number,
    status: ServicePaymentStatus,
    paymentDate?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(paymentId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      const updateData: Record<string, any> = {
        status,
        updated_by: userId,
      };

      if (status === 'paid' && paymentDate) {
        updateData.payment_date = paymentDate;
      } else if (status === 'paid') {
        updateData.payment_date = formatDate(new Date());
      }

      const { error: updateError } = await supabase
        .from("stakeholder_service_payments")
        .update(updateData)
        .eq("id", paymentId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPayments(prev => prev.map(p => 
        p.id === paymentId 
          ? { ...p, status, payment_date: updateData.payment_date || p.payment_date } 
          : p
      ));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update payment status";
      setError(message);
      captureError(err, { operation: "updatePaymentStatus", 
        companyId: employeeInfo?.company_id,
        paymentId,
        status 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // DELETE PAYMENT
  // ==========================================================================

  const deletePayment = useCallback(async (
    paymentId: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(paymentId);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Only allow deleting pending payments
      const { data: payment, error: fetchError } = await supabase
        .from("stakeholder_service_payments")
        .select("status")
        .eq("id", paymentId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (payment.status !== 'pending') {
        throw new Error("Only pending payments can be deleted");
      }

      const { error: deleteError } = await supabase
        .from("stakeholder_service_payments")
        .delete()
        .eq("id", paymentId)
        .eq("company_id", companyId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setPayments(prev => prev.filter(p => p.id !== paymentId));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete payment";
      setError(message);
      captureError(err, { operation: "deletePayment", 
        companyId: employeeInfo?.company_id,
        paymentId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH PAYMENT SUMMARY
  // ==========================================================================

  const fetchPaymentSummary = useCallback(async (
    stakeholderId?: number,
    serviceId?: number
  ): Promise<ServicePaymentSummary | null> => {
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      let query = supabase
        .from("stakeholder_service_payments")
        .select("id, status, total_amount")
        .eq("company_id", companyId);

      if (stakeholderId) {
        query = query.eq("stakeholder_id", stakeholderId);
      }
      if (serviceId) {
        query = query.eq("service_id", serviceId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const payments = data || [];

      const summary: ServicePaymentSummary = {
        total_payments: payments.length,
        total_amount: payments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        paid_amount: payments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (p.total_amount || 0), 0),
        pending_amount: payments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + (p.total_amount || 0), 0),
      };

      return summary;
    } catch (err) {
      captureError(err, { operation: "fetchPaymentSummary", 
        companyId: employeeInfo?.company_id,
        stakeholderId,
        serviceId 
      });
      return null;
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    payments,
    loading,
    error,
    processingId,
    fetchPayments,
    fetchPaymentById,
    fetchPaymentsByService,
    fetchPaymentsByStakeholder,
    createPayment,
    updatePaymentStatus,
    deletePayment,
    fetchPaymentSummary,
  };
}
