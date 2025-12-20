"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import {
  StakeholderInvoice,
  StakeholderInvoiceItem,
  StakeholderBillingCycle,
  StakeholderFieldChangeAudit,
  StakeholderInvoiceSummary,
  InvoiceStatus,
  BillingCycleType,
  InvoiceItemType,
  FieldChangeType,
  StakeholderStepData,
  FieldDefinition,
} from "@/lib/types/schemas";
import { captureError, captureSupabaseError } from "@/lib/sentry";
import { sendNotificationEmail } from "@/lib/email";
import { createNotification } from "@/lib/utils/notifications";

// ==============================================================================
// Form Data Interfaces
// ==============================================================================

export interface BillingCycleFormData {
  process_id: number;
  cycle_type: BillingCycleType;
  billing_day_of_month?: number;
  cycle_days?: number;
  billing_field_keys: string[];
  default_currency: string;
  finance_team_id?: number;
  is_active: boolean;
}

export interface InvoiceFormData {
  stakeholder_id: number;
  process_id: number;
  billing_start_date: string;
  billing_end_date: string;
  invoice_date: string;
  due_date?: string;
  currency: string;
  notes?: string;
  internal_notes?: string;
  items: InvoiceItemFormData[];
}

export interface InvoiceItemFormData {
  description: string;
  field_key?: string;
  step_id?: number;
  quantity: number;
  unit_price: number;
  item_type: InvoiceItemType;
  formula?: string;
  metadata?: Record<string, any>;
}

export interface BillingPeriod {
  start_date: string;
  end_date: string;
}

// ==============================================================================
// Main Hook
// ==============================================================================

export function useStakeholderBilling() {
  const [invoices, setInvoices] = useState<StakeholderInvoice[]>([]);
  const [billingCycles, setBillingCycles] = useState<StakeholderBillingCycle[]>([]);
  const [fieldChangeAudits, setFieldChangeAudits] = useState<StakeholderFieldChangeAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // BILLING CYCLES
  // ==========================================================================

  const fetchBillingCycles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const companyId = await getCompanyId();

      const { data, error: fetchError } = await supabase
        .from("stakeholder_billing_cycles")
        .select(`
          *,
          process:stakeholder_processes(id, name),
          finance_team:teams(id, name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setBillingCycles(data || []);
    } catch (err) {
      console.error("Error fetching billing cycles:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch billing cycles";
      setError(errorMessage);
      captureSupabaseError(err, "fetchBillingCycles", { operation: "fetch" });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBillingCycleByProcess = useCallback(async (processId: number) => {
    try {
      const companyId = await getCompanyId();

      const { data, error: fetchError } = await supabase
        .from("stakeholder_billing_cycles")
        .select(`
          *,
          process:stakeholder_processes(id, name),
          finance_team:teams(id, name)
        `)
        .eq("company_id", companyId)
        .eq("process_id", processId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      return data;
    } catch (err) {
      console.error("Error fetching billing cycle:", err);
      captureSupabaseError(err, "fetchBillingCycleByProcess", { processId });
      return null;
    }
  }, []);

  const createBillingCycle = useCallback(
    async (formData: BillingCycleFormData) => {
      setLoading(true);
      setError(null);

      try {
        const companyId = await getCompanyId();
        const employee = await getEmployeeInfo();

        // Validate based on cycle type
        if (formData.cycle_type === "date_to_date") {
          if (!formData.billing_day_of_month || formData.billing_day_of_month < 1 || formData.billing_day_of_month > 31) {
            throw new Error("Billing day of month must be between 1 and 31");
          }
        } else if (formData.cycle_type === "x_days") {
          if (!formData.cycle_days || formData.cycle_days < 1) {
            throw new Error("Cycle days must be at least 1");
          }
        }

        const { data, error: insertError } = await supabase
          .from("stakeholder_billing_cycles")
          .insert({
            ...formData,
            company_id: companyId,
            created_by: employee.id,
            updated_by: employee.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await fetchBillingCycles();
        return data;
      } catch (err) {
        console.error("Error creating billing cycle:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to create billing cycle";
        setError(errorMessage);
        captureError(err, { operation: "createBillingCycle", formData });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchBillingCycles]
  );

  const updateBillingCycle = useCallback(
    async (id: number, formData: Partial<BillingCycleFormData>) => {
      setLoading(true);
      setError(null);

      try {
        const employee = await getEmployeeInfo();

        const { data, error: updateError } = await supabase
          .from("stakeholder_billing_cycles")
          .update({
            ...formData,
            updated_by: employee.id,
          })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        await fetchBillingCycles();
        return data;
      } catch (err) {
        console.error("Error updating billing cycle:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update billing cycle";
        setError(errorMessage);
        captureError(err, { operation: "updateBillingCycle", id, formData });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchBillingCycles]
  );

  const deleteBillingCycle = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("stakeholder_billing_cycles")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await fetchBillingCycles();
    } catch (err) {
      console.error("Error deleting billing cycle:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete billing cycle";
      setError(errorMessage);
      captureError(err, { operation: "deleteBillingCycle", id });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBillingCycles]);

  // ==========================================================================
  // INVOICES
  // ==========================================================================

  const fetchInvoices = useCallback(async (filters?: {
    stakeholder_id?: number;
    process_id?: number;
    status?: InvoiceStatus;
    from_date?: string;
    to_date?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = await getCompanyId();

      let query = supabase
        .from("stakeholder_invoices")
        .select(`
          *,
          stakeholder:stakeholders(id, name, address, contact_persons, kam_id),
          process:stakeholder_processes(id, name),
          items:stakeholder_invoice_items(*),
          account:accounts(id, title, amount, status),
          creator:employees!stakeholder_invoices_created_by_fkey(id, name, email),
          sender:employees!stakeholder_invoices_sent_by_fkey(id, name, email)
        `)
        .eq("company_id", companyId);

      if (filters?.stakeholder_id) {
        query = query.eq("stakeholder_id", filters.stakeholder_id);
      }
      if (filters?.process_id) {
        query = query.eq("process_id", filters.process_id);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.from_date) {
        query = query.gte("invoice_date", filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte("invoice_date", filters.to_date);
      }

      query = query.order("invoice_date", { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInvoices(data || []);
      return data || [];
    } catch (err) {
      console.error("Error fetching invoices:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch invoices";
      setError(errorMessage);
      captureSupabaseError(err, "fetchInvoices", { filters });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceById = useCallback(async (id: number) => {
    try {
      const companyId = await getCompanyId();

      const { data, error: fetchError } = await supabase
        .from("stakeholder_invoices")
        .select(`
          *,
          stakeholder:stakeholders(id, name, address, contact_persons, kam_id),
          process:stakeholder_processes(id, name),
          items:stakeholder_invoice_items(*),
          account:accounts(id, title, amount, status),
          creator:employees!stakeholder_invoices_created_by_fkey(id, name, email),
          sender:employees!stakeholder_invoices_sent_by_fkey(id, name, email)
        `)
        .eq("company_id", companyId)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      return data;
    } catch (err) {
      console.error("Error fetching invoice:", err);
      captureSupabaseError(err, "fetchInvoiceById", { id });
      return null;
    }
  }, []);

  const generateInvoiceNumber = useCallback(async (invoiceDate?: string) => {
    try {
      const companyId = await getCompanyId();
      const dateStr = invoiceDate || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .rpc("generate_invoice_number", {
          p_company_id: companyId,
          p_invoice_date: dateStr,
        });

      if (error) throw error;

      return data as string;
    } catch (err) {
      console.error("Error generating invoice number:", err);
      captureSupabaseError(err, "generateInvoiceNumber", { invoiceDate });
      // Fallback to simple generation
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000);
      return `INV-${year}${month}-${String(random).padStart(4, '0')}`;
    }
  }, []);

  const createInvoice = useCallback(
    async (formData: InvoiceFormData) => {
      setLoading(true);
      setError(null);
      setProcessingId(formData.stakeholder_id);

      try {
        const companyId = await getCompanyId();
        const employee = await getEmployeeInfo();

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(formData.invoice_date);

        // Get stakeholder info for snapshot
        const { data: stakeholder, error: stakeholderError } = await supabase
          .from("stakeholders")
          .select("name, address, contact_persons")
          .eq("id", formData.stakeholder_id)
          .single();

        if (stakeholderError) throw stakeholderError;

        // Calculate totals
        const subtotal = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        const taxAmount = 0; // Tax amount can be added later
        const discountAmount = 0; // Discount amount can be added later
        const total = subtotal + taxAmount - discountAmount;

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("stakeholder_invoices")
          .insert({
            invoice_number: invoiceNumber,
            stakeholder_id: formData.stakeholder_id,
            process_id: formData.process_id,
            company_id: companyId,
            billing_start_date: formData.billing_start_date,
            billing_end_date: formData.billing_end_date,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            currency: formData.currency,
            subtotal,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: total,
            status: "draft",
            notes: formData.notes,
            internal_notes: formData.internal_notes,
            customer_name: stakeholder.name,
            customer_address: stakeholder.address,
            customer_contact_persons: stakeholder.contact_persons,
            created_by: employee.id,
            updated_by: employee.id,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Create invoice items
        if (formData.items.length > 0) {
          const itemsToInsert = formData.items.map((item, index) => ({
            invoice_id: invoice.id,
            item_order: index,
            description: item.description,
            field_key: item.field_key,
            step_id: item.step_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
            item_type: item.item_type,
            formula: item.formula,
            metadata: item.metadata,
          }));

          const { error: itemsError } = await supabase
            .from("stakeholder_invoice_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        // Fetch the KAM email to notify
        const { data: kamData } = await supabase
          .from("stakeholders")
          .select("kam_id, kam:employees!stakeholders_kam_id_fkey(email, name)")
          .eq("id", formData.stakeholder_id)
          .single();

        // Notify KAM
        if (kamData?.kam?.email) {
          await sendNotificationEmail({
            to: kamData.kam.email,
            subject: `New Invoice Generated: ${invoiceNumber}`,
            title: "New Invoice Generated",
            message: `A new invoice (${invoiceNumber}) has been generated for ${stakeholder.name}.`,
            ctaText: "View Invoice",
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/stakeholders/billing/${invoice.id}`,
          });
        }

        // Create notification for KAM
        if (kamData?.kam_id) {
          await createNotification({
            employee_id: kamData.kam_id,
            title: "New Invoice Generated",
            message: `Invoice ${invoiceNumber} has been generated for ${stakeholder.name}`,
            type: "invoice",
            link: `/admin/stakeholders/billing/${invoice.id}`,
          });
        }

        await fetchInvoices({ stakeholder_id: formData.stakeholder_id });
        return invoice;
      } catch (err) {
        console.error("Error creating invoice:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to create invoice";
        setError(errorMessage);
        captureError(err, { operation: "createInvoice", formData });
        throw err;
      } finally {
        setLoading(false);
        setProcessingId(null);
      }
    },
    [fetchInvoices, generateInvoiceNumber]
  );

  const updateInvoice = useCallback(
    async (id: number, updates: Partial<StakeholderInvoice>) => {
      setLoading(true);
      setError(null);

      try {
        const employee = await getEmployeeInfo();

        const { data, error: updateError } = await supabase
          .from("stakeholder_invoices")
          .update({
            ...updates,
            updated_by: employee.id,
          })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // If status changed to 'sent', update sent_at and sent_by
        if (updates.status === "sent") {
          await supabase
            .from("stakeholder_invoices")
            .update({
              sent_at: new Date().toISOString(),
              sent_by: employee.id,
            })
            .eq("id", id);
        }

        return data;
      } catch (err) {
        console.error("Error updating invoice:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update invoice";
        setError(errorMessage);
        captureError(err, { operation: "updateInvoice", id, updates });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateInvoiceStatus = useCallback(
    async (id: number, status: InvoiceStatus, notifyFinanceTeam?: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const employee = await getEmployeeInfo();

        // Fetch invoice to get process and finance team
        const invoice = await fetchInvoiceById(id);
        if (!invoice) throw new Error("Invoice not found");

        const { data, error: updateError } = await supabase
          .from("stakeholder_invoices")
          .update({
            status,
            updated_by: employee.id,
            ...(status === "sent" && {
              sent_at: new Date().toISOString(),
              sent_by: employee.id,
            }),
          })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Notify finance team if requested
        if (notifyFinanceTeam && invoice.process_id) {
          const billingCycle = await fetchBillingCycleByProcess(invoice.process_id);
          
          if (billingCycle?.finance_team_id) {
            // Get finance team members
            const { data: teamMembers } = await supabase
              .from("team_members")
              .select("employee:employees(id, email, name)")
              .eq("team_id", billingCycle.finance_team_id);

            if (teamMembers) {
              for (const member of teamMembers) {
                if (member.employee?.email) {
                  await sendNotificationEmail({
                    to: member.employee.email,
                    subject: `Invoice Status Updated: ${invoice.invoice_number}`,
                    title: "Invoice Status Update",
                    message: `Invoice ${invoice.invoice_number} status has been updated to ${status}.`,
                    ctaText: "View Invoice",
                    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/stakeholders/billing/${id}`,
                  });
                }

                // Create notification
                if (member.employee?.id) {
                  await createNotification({
                    employee_id: member.employee.id,
                    title: "Invoice Status Updated",
                    message: `Invoice ${invoice.invoice_number} is now ${status}`,
                    type: "invoice",
                    link: `/admin/stakeholders/billing/${id}`,
                  });
                }
              }
            }
          }
        }

        return data;
      } catch (err) {
        console.error("Error updating invoice status:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update invoice status";
        setError(errorMessage);
        captureError(err, { operation: "updateInvoiceStatus", id, status });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchInvoiceById, fetchBillingCycleByProcess]
  );

  const deleteInvoice = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("stakeholder_invoices")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await fetchInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete invoice";
      setError(errorMessage);
      captureError(err, { operation: "deleteInvoice", id });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  // ==========================================================================
  // BILLING PERIOD CALCULATIONS
  // ==========================================================================

  const calculateBillingPeriod = useCallback(
    (
      cycleType: BillingCycleType,
      billingDayOfMonth?: number,
      cycleDays?: number,
      referenceDate?: string
    ): BillingPeriod => {
      const refDate = referenceDate ? new Date(referenceDate) : new Date();

      if (cycleType === "date_to_date") {
        const day = billingDayOfMonth || 1;
        
        // Calculate start date (previous billing day)
        const startDate = new Date(refDate);
        startDate.setDate(day);
        
        // If reference date is before billing day, go back a month
        if (refDate.getDate() < day) {
          startDate.setMonth(startDate.getMonth() - 1);
        }
        
        // Calculate end date (next billing day - 1)
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        
        return {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        };
      } else {
        // x_days cycle
        const days = cycleDays || 30;
        const startDate = new Date(refDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        
        return {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        };
      }
    },
    []
  );

  // ==========================================================================
  // FIELD CHANGE AUDIT
  // ==========================================================================

  const trackFieldChange = useCallback(
    async (
      stakeholderId: number,
      stepId: number,
      stepDataId: number,
      fieldKey: string,
      oldValue: any,
      newValue: any,
      changeType: FieldChangeType,
      fieldLabel?: string,
      fieldType?: string,
      changeReason?: string
    ) => {
      try {
        const companyId = await getCompanyId();
        const employee = await getEmployeeInfo();

        const { error: insertError } = await supabase
          .from("stakeholder_field_change_audit")
          .insert({
            stakeholder_id: stakeholderId,
            step_id: stepId,
            step_data_id: stepDataId,
            field_key: fieldKey,
            old_value: oldValue,
            new_value: newValue,
            change_type: changeType,
            field_label: fieldLabel,
            field_type: fieldType,
            changed_by: employee.id,
            company_id: companyId,
            change_reason: changeReason,
          });

        if (insertError) throw insertError;
      } catch (err) {
        console.error("Error tracking field change:", err);
        captureError(err, {
          operation: "trackFieldChange",
          stakeholderId,
          stepId,
          fieldKey,
        });
      }
    },
    []
  );

  const fetchFieldChangeAudit = useCallback(async (filters?: {
    stakeholder_id?: number;
    step_id?: number;
    field_key?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = await getCompanyId();

      let query = supabase
        .from("stakeholder_field_change_audit")
        .select(`
          *,
          stakeholder:stakeholders(id, name),
          step:stakeholder_process_steps(id, name),
          changer:employees(id, name, email)
        `)
        .eq("company_id", companyId);

      if (filters?.stakeholder_id) {
        query = query.eq("stakeholder_id", filters.stakeholder_id);
      }
      if (filters?.step_id) {
        query = query.eq("step_id", filters.step_id);
      }
      if (filters?.field_key) {
        query = query.eq("field_key", filters.field_key);
      }

      query = query.order("changed_at", { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setFieldChangeAudits(data || []);
      return data || [];
    } catch (err) {
      console.error("Error fetching field change audit:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch field change audit";
      setError(errorMessage);
      captureSupabaseError(err, "fetchFieldChangeAudit", { filters });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================================
  // INVOICE SUMMARY
  // ==========================================================================

  const getInvoiceSummary = useCallback(async (stakeholderId: number) => {
    try {
      const { data, error } = await supabase
        .rpc("get_stakeholder_invoice_summary", {
          p_stakeholder_id: stakeholderId,
        });

      if (error) throw error;

      return data[0] as StakeholderInvoiceSummary;
    } catch (err) {
      console.error("Error fetching invoice summary:", err);
      captureSupabaseError(err, "getInvoiceSummary", { stakeholderId });
      return {
        total_invoices: 0,
        total_amount: 0,
        paid_amount: 0,
        outstanding_amount: 0,
        overdue_count: 0,
      };
    }
  }, []);

  // ==========================================================================
  // BILLING DATA EXTRACTION
  // ==========================================================================

  const extractBillingDataFromSteps = useCallback(
    async (stakeholderId: number, processId: number, billingFieldKeys: string[]) => {
      try {
        // Fetch all step data for the stakeholder
        const { data: stepDataRecords, error: stepDataError } = await supabase
          .from("stakeholder_step_data")
          .select(`
            *,
            step:stakeholder_process_steps(*)
          `)
          .eq("stakeholder_id", stakeholderId);

        if (stepDataError) throw stepDataError;

        // Extract billing fields
        const billingItems: InvoiceItemFormData[] = [];

        for (const stepData of stepDataRecords || []) {
          const fieldDefinitions = stepData.step?.field_definitions?.fields || [];
          
          for (const fieldKey of billingFieldKeys) {
            const fieldDef = fieldDefinitions.find((f: FieldDefinition) => f.key === fieldKey);
            if (!fieldDef) continue;

            const fieldValue = stepData.data?.[fieldKey];
            
            // Skip empty values
            if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue;

            // Handle number and calculated fields
            if (fieldDef.type === 'number' || fieldDef.type === 'calculated') {
              const numValue = Number(fieldValue);
              if (isNaN(numValue)) continue;

              billingItems.push({
                description: `${stepData.step?.name || 'Step'} - ${fieldDef.label}`,
                field_key: fieldKey,
                step_id: stepData.step_id,
                quantity: 1,
                unit_price: numValue,
                item_type: fieldDef.type === 'calculated' ? 'calculated' : 'standard',
                formula: fieldDef.formula,
                metadata: {
                  step_name: stepData.step?.name,
                  field_label: fieldDef.label,
                  field_type: fieldDef.type,
                },
              });
            }
          }
        }

        return billingItems;
      } catch (err) {
        console.error("Error extracting billing data:", err);
        captureError(err, { operation: "extractBillingDataFromSteps", stakeholderId, processId });
        return [];
      }
    },
    []
  );

  return {
    // State
    invoices,
    billingCycles,
    fieldChangeAudits,
    loading,
    error,
    processingId,

    // Billing Cycles
    fetchBillingCycles,
    fetchBillingCycleByProcess,
    createBillingCycle,
    updateBillingCycle,
    deleteBillingCycle,

    // Invoices
    fetchInvoices,
    fetchInvoiceById,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    generateInvoiceNumber,

    // Calculations
    calculateBillingPeriod,
    extractBillingDataFromSteps,

    // Audit
    trackFieldChange,
    fetchFieldChangeAudit,

    // Summary
    getInvoiceSummary,
  };
}
