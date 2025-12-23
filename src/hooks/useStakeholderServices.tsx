"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { captureSupabaseError, captureError } from "@/lib/sentry";
import {
  StakeholderService,
  StakeholderServiceLineItem,
  StakeholderServiceHistory,
  ServiceFormData,
  ServiceLineItemFormData,
  ServiceSearchOptions,
  ServiceSearchResult,
  ServiceStatus,
  ServiceSummary,
} from "@/lib/types/stakeholder-services";
import {
  calculateNextBillingDate,
  formatDate,
} from "@/lib/utils/pro-rata-calculation";

// ==============================================================================
// TYPES
// ==============================================================================

export interface UseStakeholderServicesReturn {
  services: StakeholderService[];
  loading: boolean;
  error: string | null;
  processingId: number | null;
  // Service CRUD
  fetchServices: (options?: ServiceSearchOptions) => Promise<ServiceSearchResult>;
  fetchServiceById: (serviceId: number) => Promise<StakeholderService | null>;
  fetchServicesByStakeholder: (stakeholderId: number) => Promise<StakeholderService[]>;
  createService: (data: ServiceFormData) => Promise<StakeholderService | null>;
  updateService: (serviceId: number, data: Partial<ServiceFormData>) => Promise<StakeholderService | null>;
  updateServiceStatus: (serviceId: number, status: ServiceStatus) => Promise<boolean>;
  deleteService: (serviceId: number) => Promise<boolean>;
  // Line Items
  updateLineItems: (serviceId: number, lineItems: ServiceLineItemFormData[]) => Promise<boolean>;
  // History
  fetchServiceHistory: (serviceId: number) => Promise<StakeholderServiceHistory[]>;
  // Summary
  fetchServiceSummary: (stakeholderId?: number) => Promise<ServiceSummary | null>;
}

// ==============================================================================
// HOOK
// ==============================================================================

export function useStakeholderServices(): UseStakeholderServicesReturn {
  const { employeeInfo } = useAuth();
  const [services, setServices] = useState<StakeholderService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // FETCH SERVICES
  // ==========================================================================

  const fetchServices = useCallback(async (
    options: ServiceSearchOptions = {}
  ): Promise<ServiceSearchResult> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const {
        stakeholder_id,
        direction,
        service_type,
        status,
        search_query,
        page = 1,
        page_size = 20,
      } = options;

      // Build query
      let query = supabase
        .from("stakeholder_services")
        .select(`
          *,
          stakeholder:stakeholders(id, name, address, contact_persons, status),
          template:stakeholder_service_templates(id, name),
          line_items:stakeholder_service_line_items(*)
        `, { count: "exact" })
        .eq("company_id", companyId);

      // Apply filters
      if (stakeholder_id) {
        query = query.eq("stakeholder_id", stakeholder_id);
      }
      if (direction) {
        query = query.eq("direction", direction);
      }
      if (service_type) {
        query = query.eq("service_type", service_type);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (search_query) {
        query = query.ilike("service_name", `%${search_query}%`);
      }

      // Pagination
      const from = (page - 1) * page_size;
      const to = from + page_size - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Calculate total amount for each service
      const servicesWithTotals = (data || []).map(service => ({
        ...service,
        total_amount: service.line_items?.reduce(
          (sum: number, item: StakeholderServiceLineItem) => sum + (item.amount || 0),
          0
        ) || 0,
      }));

      setServices(servicesWithTotals);

      const totalCount = count || 0;
      return {
        services: servicesWithTotals,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / page_size),
        current_page: page,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch services";
      setError(message);
      captureError(err, { operation: "fetchServices", 
        companyId: employeeInfo?.company_id,
        options 
      });
      return {
        services: [],
        total_count: 0,
        total_pages: 0,
        current_page: 1,
      };
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH SERVICE BY ID
  // ==========================================================================

  const fetchServiceById = useCallback(async (
    serviceId: number
  ): Promise<StakeholderService | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_services")
        .select(`
          *,
          stakeholder:stakeholders(id, name, address, contact_persons, status),
          template:stakeholder_service_templates(id, name, description),
          line_items:stakeholder_service_line_items(*)
        `)
        .eq("id", serviceId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Calculate total amount
      const total_amount = data?.line_items?.reduce(
        (sum: number, item: StakeholderServiceLineItem) => sum + (item.amount || 0),
        0
      ) || 0;

      return { ...data, total_amount };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch service";
      setError(message);
      captureError(err, { operation: "fetchServiceById", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH SERVICES BY STAKEHOLDER
  // ==========================================================================

  const fetchServicesByStakeholder = useCallback(async (
    stakeholderId: number
  ): Promise<StakeholderService[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_services")
        .select(`
          *,
          template:stakeholder_service_templates(id, name),
          line_items:stakeholder_service_line_items(*)
        `)
        .eq("company_id", companyId)
        .eq("stakeholder_id", stakeholderId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Calculate total amounts
      const servicesWithTotals = (data || []).map(service => ({
        ...service,
        total_amount: service.line_items?.reduce(
          (sum: number, item: StakeholderServiceLineItem) => sum + (item.amount || 0),
          0
        ) || 0,
      }));

      return servicesWithTotals;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch stakeholder services";
      setError(message);
      captureError(err, { operation: "fetchServicesByStakeholder", 
        companyId: employeeInfo?.company_id,
        stakeholderId 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // CREATE SERVICE
  // ==========================================================================

  const createService = useCallback(async (
    data: ServiceFormData
  ): Promise<StakeholderService | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Calculate next billing date for recurring services
      let nextBillingDate: string | undefined;
      if (data.service_type === 'recurring' && data.billing_cycle_type) {
        const nextDate = calculateNextBillingDate(
          data.billing_cycle_type,
          data.billing_day_of_month,
          data.billing_day_of_week,
          data.billing_month_of_year,
          data.billing_interval_days,
          undefined, // No last billed date yet
          data.start_date
        );
        if (nextDate) {
          nextBillingDate = formatDate(nextDate);
        }
      }

      // Create service
      const { data: service, error: createError } = await supabase
        .from("stakeholder_services")
        .insert({
          company_id: companyId,
          stakeholder_id: data.stakeholder_id,
          template_id: data.template_id,
          service_name: data.service_name,
          description: data.description,
          direction: data.direction,
          service_type: data.service_type,
          currency: data.currency,
          tax_rate: data.tax_rate,
          start_date: data.start_date,
          end_date: data.end_date,
          billing_cycle_type: data.billing_cycle_type,
          billing_day_of_month: data.billing_day_of_month,
          billing_day_of_week: data.billing_day_of_week,
          billing_month_of_year: data.billing_month_of_year,
          billing_interval_days: data.billing_interval_days,
          next_billing_date: nextBillingDate,
          payment_account_category: data.payment_account_category,
          auto_create_payment: data.auto_create_payment ?? true,
          status: 'active',
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Create line items
      if (data.line_items && data.line_items.length > 0) {
        const lineItemsData = data.line_items.map((item, index) => ({
          service_id: service.id,
          item_order: index,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: lineItemsError } = await supabase
          .from("stakeholder_service_line_items")
          .insert(lineItemsData);

        if (lineItemsError) {
          // Rollback service creation
          await supabase
            .from("stakeholder_services")
            .delete()
            .eq("id", service.id);
          throw lineItemsError;
        }
      }

      // Fetch complete service with line items
      return await fetchServiceById(service.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create service";
      setError(message);
      captureError(err, { operation: "createService", 
        companyId: employeeInfo?.company_id,
        stakeholderId: data.stakeholder_id 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id, fetchServiceById]);

  // ==========================================================================
  // UPDATE SERVICE
  // ==========================================================================

  const updateService = useCallback(async (
    serviceId: number,
    data: Partial<ServiceFormData>
  ): Promise<StakeholderService | null> => {
    setLoading(true);
    setError(null);
    setProcessingId(serviceId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Build update object
      const updateData: Record<string, any> = {
        updated_by: userId,
      };

      // Add optional fields if provided
      if (data.service_name !== undefined) updateData.service_name = data.service_name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.tax_rate !== undefined) updateData.tax_rate = data.tax_rate;
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.billing_cycle_type !== undefined) updateData.billing_cycle_type = data.billing_cycle_type;
      if (data.billing_day_of_month !== undefined) updateData.billing_day_of_month = data.billing_day_of_month;
      if (data.billing_day_of_week !== undefined) updateData.billing_day_of_week = data.billing_day_of_week;
      if (data.billing_month_of_year !== undefined) updateData.billing_month_of_year = data.billing_month_of_year;
      if (data.billing_interval_days !== undefined) updateData.billing_interval_days = data.billing_interval_days;
      if (data.payment_account_category !== undefined) updateData.payment_account_category = data.payment_account_category;
      if (data.auto_create_payment !== undefined) updateData.auto_create_payment = data.auto_create_payment;

      // Recalculate next billing date if cycle changed
      if (data.billing_cycle_type) {
        const nextDate = calculateNextBillingDate(
          data.billing_cycle_type,
          data.billing_day_of_month,
          data.billing_day_of_week,
          data.billing_month_of_year,
          data.billing_interval_days,
          undefined,
          data.start_date
        );
        if (nextDate) {
          updateData.next_billing_date = formatDate(nextDate);
        }
      }

      const { error: updateError } = await supabase
        .from("stakeholder_services")
        .update(updateData)
        .eq("id", serviceId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      // Update line items if provided
      if (data.line_items) {
        await updateLineItems(serviceId, data.line_items);
      }

      return await fetchServiceById(serviceId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update service";
      setError(message);
      captureError(err, { operation: "updateService", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return null;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id, fetchServiceById]);

  // ==========================================================================
  // UPDATE SERVICE STATUS
  // ==========================================================================

  const updateServiceStatus = useCallback(async (
    serviceId: number,
    status: ServiceStatus
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(serviceId);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      const { error: updateError } = await supabase
        .from("stakeholder_services")
        .update({
          status,
          updated_by: userId,
        })
        .eq("id", serviceId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status } : s
      ));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update service status";
      setError(message);
      captureError(err, { operation: "updateServiceStatus", 
        companyId: employeeInfo?.company_id,
        serviceId,
        status 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // DELETE SERVICE
  // ==========================================================================

  const deleteService = useCallback(async (
    serviceId: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(serviceId);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { error: deleteError } = await supabase
        .from("stakeholder_services")
        .delete()
        .eq("id", serviceId)
        .eq("company_id", companyId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setServices(prev => prev.filter(s => s.id !== serviceId));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete service";
      setError(message);
      captureError(err, { operation: "deleteService", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // UPDATE LINE ITEMS
  // ==========================================================================

  const updateLineItems = useCallback(async (
    serviceId: number,
    lineItems: ServiceLineItemFormData[]
  ): Promise<boolean> => {
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Delete existing line items
      const { error: deleteError } = await supabase
        .from("stakeholder_service_line_items")
        .delete()
        .eq("service_id", serviceId);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new line items
      if (lineItems.length > 0) {
        const lineItemsData = lineItems.map((item, index) => ({
          service_id: serviceId,
          item_order: index,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: insertError } = await supabase
          .from("stakeholder_service_line_items")
          .insert(lineItemsData);

        if (insertError) {
          throw insertError;
        }
      }

      return true;
    } catch (err) {
      captureError(err, { operation: "updateLineItems", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return false;
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH SERVICE HISTORY
  // ==========================================================================

  const fetchServiceHistory = useCallback(async (
    serviceId: number
  ): Promise<StakeholderServiceHistory[]> => {
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_history")
        .select("*")
        .eq("service_id", serviceId)
        .order("effective_from", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      captureError(err, { operation: "fetchServiceHistory", 
        companyId: employeeInfo?.company_id,
        serviceId 
      });
      return [];
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH SERVICE SUMMARY
  // ==========================================================================

  const fetchServiceSummary = useCallback(async (
    stakeholderId?: number
  ): Promise<ServiceSummary | null> => {
    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      let query = supabase
        .from("stakeholder_services")
        .select(`
          id,
          direction,
          status,
          line_items:stakeholder_service_line_items(amount)
        `)
        .eq("company_id", companyId);

      if (stakeholderId) {
        query = query.eq("stakeholder_id", stakeholderId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const services = data || [];
      
      // Calculate summary
      const summary: ServiceSummary = {
        total_services: services.length,
        active_services: services.filter(s => s.status === 'active').length,
        outgoing_services: services.filter(s => s.direction === 'outgoing').length,
        incoming_services: services.filter(s => s.direction === 'incoming').length,
        total_monthly_revenue: 0,
        total_monthly_expense: 0,
      };

      // Calculate monthly amounts for active services
      for (const service of services) {
        if (service.status !== 'active') continue;
        
        const total = (service.line_items as any[])?.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        ) || 0;

        if (service.direction === 'outgoing') {
          summary.total_monthly_revenue += total;
        } else {
          summary.total_monthly_expense += total;
        }
      }

      return summary;
    } catch (err) {
      captureError(err, { operation: "fetchServiceSummary", 
        companyId: employeeInfo?.company_id,
        stakeholderId 
      });
      return null;
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    services,
    loading,
    error,
    processingId,
    fetchServices,
    fetchServiceById,
    fetchServicesByStakeholder,
    createService,
    updateService,
    updateServiceStatus,
    deleteService,
    updateLineItems,
    fetchServiceHistory,
    fetchServiceSummary,
  };
}
