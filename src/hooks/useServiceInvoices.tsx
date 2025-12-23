"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { captureError } from "@/lib/sentry";
import {
  StakeholderServiceInvoice,
  StakeholderInvoiceLineItem,
  InvoiceFormData,
  InvoiceSearchOptions,
  InvoiceSearchResult,
  ServiceInvoiceStatus,
  ServiceInvoiceSummary,
  ProRataDetails,
} from "@/lib/types/stakeholder-services";
import {
  calculateProRataInvoice,
  formatDate,
} from "@/lib/utils/pro-rata-calculation";

// ==============================================================================
// TYPES
// ==============================================================================

export interface UseServiceInvoicesReturn {
  invoices: StakeholderServiceInvoice[];
  loading: boolean;
  error: string | null;
  processingId: number | null;
  // Invoice CRUD
  fetchInvoices: (options?: InvoiceSearchOptions) => Promise<InvoiceSearchResult>;
  fetchInvoiceById: (invoiceId: number) => Promise<StakeholderServiceInvoice | null>;
  fetchInvoicesByService: (serviceId: number) => Promise<StakeholderServiceInvoice[]>;
  fetchInvoicesByStakeholder: (stakeholderId: number) => Promise<StakeholderServiceInvoice[]>;
  createInvoice: (data: InvoiceFormData) => Promise<StakeholderServiceInvoice | null>;
  updateInvoice: (invoiceId: number, data: Partial<StakeholderServiceInvoice>) => Promise<boolean>;
  updateInvoiceStatus: (invoiceId: number, status: ServiceInvoiceStatus) => Promise<boolean>;
  recordPayment: (invoiceId: number, amount: number, paymentDate?: string, reference?: string) => Promise<boolean>;
  deleteInvoice: (invoiceId: number) => Promise<boolean>;
  sendInvoice: (invoiceId: number) => Promise<boolean>;
  // Summary
  fetchInvoiceSummary: (stakeholderId?: number, serviceId?: number) => Promise<ServiceInvoiceSummary | null>;
  // Invoice Preview/Generation
  previewInvoice: (data: InvoiceFormData) => Promise<{
    lineItems: StakeholderInvoiceLineItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    proRataDetails: ProRataDetails | null;
  } | null>;
}

// ==============================================================================
// HOOK
// ==============================================================================

export function useServiceInvoices(): UseServiceInvoicesReturn {
  const { employeeInfo } = useAuth();
  const [invoices, setInvoices] = useState<StakeholderServiceInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // FETCH INVOICES
  // ==========================================================================

  const fetchInvoices = useCallback(async (
    options: InvoiceSearchOptions = {}
  ): Promise<InvoiceSearchResult> => {
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
        .from("stakeholder_service_invoices")
        .select(`
          *,
          service:stakeholder_services(id, service_name, direction),
          stakeholder:stakeholders(id, name, contact_persons),
          line_items:stakeholder_invoice_line_items(*)
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
        query = query.gte("invoice_date", from_date);
      }
      if (to_date) {
        query = query.lte("invoice_date", to_date);
      }
      if (search_query) {
        query = query.ilike("invoice_number", `%${search_query}%`);
      }

      // Pagination
      const from = (page - 1) * page_size;
      const to = from + page_size - 1;
      query = query.range(from, to).order("invoice_date", { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setInvoices(data || []);

      const totalCount = count || 0;
      return {
        invoices: data || [],
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / page_size),
        current_page: page,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch invoices";
      setError(message);
      captureError(err, { operation: "fetchInvoices", 
        companyId: employeeInfo?.company_id,
        options 
      });
      return {
        invoices: [],
        total_count: 0,
        total_pages: 0,
        current_page: 1,
      };
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH INVOICE BY ID
  // ==========================================================================

  const fetchInvoiceById = useCallback(async (
    invoiceId: number
  ): Promise<StakeholderServiceInvoice | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_invoices")
        .select(`
          *,
          service:stakeholder_services(id, service_name, direction, currency, tax_rate),
          stakeholder:stakeholders(id, name, address, contact_persons),
          line_items:stakeholder_invoice_line_items(*)
        `)
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch invoice";
      setError(message);
      captureError(err, { operation: "fetchInvoiceById", 
        companyId: employeeInfo?.company_id,
        invoiceId 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH INVOICES BY SERVICE
  // ==========================================================================

  const fetchInvoicesByService = useCallback(async (
    serviceId: number
  ): Promise<StakeholderServiceInvoice[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_invoices")
        .select(`
          *,
          line_items:stakeholder_invoice_line_items(*)
        `)
        .eq("company_id", companyId)
        .eq("service_id", serviceId)
        .order("invoice_date", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch service invoices";
      setError(message);
      captureError(err, { operation: "fetchInvoicesByService", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH INVOICES BY STAKEHOLDER
  // ==========================================================================

  const fetchInvoicesByStakeholder = useCallback(async (
    stakeholderId: number
  ): Promise<StakeholderServiceInvoice[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_invoices")
        .select(`
          *,
          service:stakeholder_services(id, service_name),
          line_items:stakeholder_invoice_line_items(*)
        `)
        .eq("company_id", companyId)
        .eq("stakeholder_id", stakeholderId)
        .order("invoice_date", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch stakeholder invoices";
      setError(message);
      captureError(err, { operation: "fetchInvoicesByStakeholder", 
        companyId: employeeInfo?.company_id,
        stakeholderId 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // PREVIEW INVOICE (Calculate without creating)
  // ==========================================================================

  const previewInvoice = useCallback(async (
    data: InvoiceFormData
  ): Promise<{
    lineItems: StakeholderInvoiceLineItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    proRataDetails: ProRataDetails | null;
  } | null> => {
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Fetch service with line items and history
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

      // Fetch service history for pro-rata calculation
      const { data: history, error: historyError } = await supabase
        .from("stakeholder_service_history")
        .select("*")
        .eq("service_id", data.service_id)
        .order("effective_from", { ascending: true });

      if (historyError) {
        throw historyError;
      }

      // Calculate pro-rata invoice
      const lineItems = data.line_items && data.line_items.length > 0
        ? data.line_items.map((item, index) => ({
            id: undefined,
            service_id: data.service_id,
            item_order: index,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
          }))
        : service.line_items || [];

      const result = calculateProRataInvoice(
        lineItems,
        history || [],
        data.billing_period_start,
        data.billing_period_end,
        service.tax_rate || 0
      );

      return {
        lineItems: result.lineItems.map((item, index) => ({
          id: undefined,
          invoice_id: 0,
          item_order: index,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          pro_rata_days: item.pro_rata_days,
          pro_rata_total_days: 30,
          original_amount: item.original_amount,
        })),
        subtotal: result.subtotal,
        taxAmount: result.taxAmount,
        totalAmount: result.totalAmount,
        proRataDetails: result.proRataDetails,
      };
    } catch (err) {
      captureError(err, { operation: "previewInvoice", 
        companyId: employeeInfo?.company_id,
        serviceId: data.service_id 
      });
      return null;
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // CREATE INVOICE
  // ==========================================================================

  const createInvoice = useCallback(async (
    data: InvoiceFormData
  ): Promise<StakeholderServiceInvoice | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Fetch service with stakeholder
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

      // Generate preview to get calculated amounts
      const preview = await previewInvoice(data);
      if (!preview) {
        throw new Error("Failed to calculate invoice amounts");
      }

      // Generate invoice number using RPC
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc("generate_service_invoice_number", {
          p_company_id: companyId,
          p_invoice_date: formatDate(new Date()),
        });

      if (numberError) {
        throw numberError;
      }

      // Calculate due date
      const { data: settings } = await supabase
        .from("company_invoice_settings")
        .select("default_payment_terms_days")
        .eq("company_id", companyId)
        .single();

      const paymentTermsDays = settings?.default_payment_terms_days || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTermsDays);

      // Create customer snapshot
      const stakeholder = service.stakeholder as any;
      const customerSnapshot = {
        name: stakeholder?.name || '',
        address: stakeholder?.address,
        contact_persons: stakeholder?.contact_persons,
      };

      // Create invoice
      const { data: invoice, error: createError } = await supabase
        .from("stakeholder_service_invoices")
        .insert({
          service_id: data.service_id,
          company_id: companyId,
          stakeholder_id: service.stakeholder_id,
          invoice_number: invoiceNumber,
          billing_period_start: data.billing_period_start,
          billing_period_end: data.billing_period_end,
          currency: service.currency,
          subtotal: preview.subtotal,
          tax_rate: service.tax_rate || 0,
          tax_amount: preview.taxAmount,
          total_amount: preview.totalAmount,
          pro_rata_details: preview.proRataDetails,
          invoice_date: formatDate(new Date()),
          due_date: data.due_date || formatDate(dueDate),
          status: 'draft',
          notes: data.notes,
          internal_notes: data.internal_notes,
          customer_snapshot: customerSnapshot,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Create invoice line items
      const lineItemsData = preview.lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        item_order: index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        pro_rata_days: item.pro_rata_days,
        pro_rata_total_days: item.pro_rata_total_days,
        original_amount: item.original_amount,
      }));

      const { error: lineItemsError } = await supabase
        .from("stakeholder_invoice_line_items")
        .insert(lineItemsData);

      if (lineItemsError) {
        // Rollback invoice
        await supabase
          .from("stakeholder_service_invoices")
          .delete()
          .eq("id", invoice.id);
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

      return await fetchInvoiceById(invoice.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create invoice";
      setError(message);
      captureError(err, { operation: "createInvoice", 
        companyId: employeeInfo?.company_id,
        serviceId: data.service_id 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id, fetchInvoiceById, previewInvoice]);

  // ==========================================================================
  // UPDATE INVOICE
  // ==========================================================================

  const updateInvoice = useCallback(async (
    invoiceId: number,
    data: Partial<StakeholderServiceInvoice>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(invoiceId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      const updateData: Record<string, any> = {
        updated_by: userId,
      };

      // Add updateable fields
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.internal_notes !== undefined) updateData.internal_notes = data.internal_notes;
      if (data.due_date !== undefined) updateData.due_date = data.due_date;

      const { error: updateError } = await supabase
        .from("stakeholder_service_invoices")
        .update(updateData)
        .eq("id", invoiceId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update invoice";
      setError(message);
      captureError(err, { operation: "updateInvoice", 
        companyId: employeeInfo?.company_id,
        invoiceId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // UPDATE INVOICE STATUS
  // ==========================================================================

  const updateInvoiceStatus = useCallback(async (
    invoiceId: number,
    status: ServiceInvoiceStatus
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(invoiceId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      const { error: updateError } = await supabase
        .from("stakeholder_service_invoices")
        .update({
          status,
          updated_by: userId,
        })
        .eq("id", invoiceId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status } : inv
      ));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update invoice status";
      setError(message);
      captureError(err, { operation: "updateInvoiceStatus", 
        companyId: employeeInfo?.company_id,
        invoiceId,
        status 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // RECORD PAYMENT
  // ==========================================================================

  const recordPayment = useCallback(async (
    invoiceId: number,
    amount: number,
    paymentDate?: string,
    reference?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(invoiceId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Fetch current invoice
      const { data: invoice, error: fetchError } = await supabase
        .from("stakeholder_service_invoices")
        .select("paid_amount, total_amount")
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newPaidAmount = (invoice.paid_amount || 0) + amount;
      
      // Validate
      if (newPaidAmount > invoice.total_amount) {
        throw new Error("Payment amount exceeds outstanding balance");
      }

      const { error: updateError } = await supabase
        .from("stakeholder_service_invoices")
        .update({
          paid_amount: newPaidAmount,
          paid_date: paymentDate || formatDate(new Date()),
          payment_reference: reference,
          updated_by: userId,
        })
        .eq("id", invoiceId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
      setError(message);
      captureError(err, { operation: "recordPayment", 
        companyId: employeeInfo?.company_id,
        invoiceId,
        amount 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // DELETE INVOICE
  // ==========================================================================

  const deleteInvoice = useCallback(async (
    invoiceId: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(invoiceId);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Only allow deleting draft invoices
      const { data: invoice, error: fetchError } = await supabase
        .from("stakeholder_service_invoices")
        .select("status")
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (invoice.status !== 'draft') {
        throw new Error("Only draft invoices can be deleted");
      }

      const { error: deleteError } = await supabase
        .from("stakeholder_service_invoices")
        .delete()
        .eq("id", invoiceId)
        .eq("company_id", companyId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete invoice";
      setError(message);
      captureError(err, { operation: "deleteInvoice", 
        companyId: employeeInfo?.company_id,
        invoiceId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // SEND INVOICE
  // ==========================================================================

  const sendInvoice = useCallback(async (
    invoiceId: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(invoiceId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Update invoice status to sent
      const { error: updateError } = await supabase
        .from("stakeholder_service_invoices")
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: userId,
          updated_by: userId,
        })
        .eq("id", invoiceId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      // TODO: Trigger email sending via edge function or API route
      // This will be implemented in the email integration phase

      // Update local state
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'sent' as ServiceInvoiceStatus, sent_at: new Date().toISOString() } 
          : inv
      ));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invoice";
      setError(message);
      captureError(err, { operation: "sendInvoice", 
        companyId: employeeInfo?.company_id,
        invoiceId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // FETCH INVOICE SUMMARY
  // ==========================================================================

  const fetchInvoiceSummary = useCallback(async (
    stakeholderId?: number,
    serviceId?: number
  ): Promise<ServiceInvoiceSummary | null> => {
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      let query = supabase
        .from("stakeholder_service_invoices")
        .select("id, status, total_amount, paid_amount, due_date")
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

      const invoices = data || [];
      const today = new Date();

      const summary: ServiceInvoiceSummary = {
        total_invoices: invoices.length,
        total_amount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        paid_amount: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
        outstanding_amount: 0,
        overdue_count: 0,
      };

      summary.outstanding_amount = summary.total_amount - summary.paid_amount;

      // Count overdue invoices
      summary.overdue_count = invoices.filter(inv => {
        if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'void') {
          return false;
        }
        if (!inv.due_date) return false;
        return new Date(inv.due_date) < today && inv.paid_amount < inv.total_amount;
      }).length;

      return summary;
    } catch (err) {
      captureError(err, { operation: "fetchInvoiceSummary", 
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
    invoices,
    loading,
    error,
    processingId,
    fetchInvoices,
    fetchInvoiceById,
    fetchInvoicesByService,
    fetchInvoicesByStakeholder,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    recordPayment,
    deleteInvoice,
    sendInvoice,
    fetchInvoiceSummary,
    previewInvoice,
  };
}
