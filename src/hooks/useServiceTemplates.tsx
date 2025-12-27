"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { captureError } from "@/lib/sentry";
import {
  StakeholderServiceTemplate,
  ServiceTemplateFormData,
  CompanyInvoiceSettings,
  CompanyInvoiceSettingsFormData,
} from "@/lib/types/stakeholder-services";

// ==============================================================================
// TYPES
// ==============================================================================

export interface UseServiceTemplatesReturn {
  templates: StakeholderServiceTemplate[];
  invoiceSettings: CompanyInvoiceSettings | null;
  loading: boolean;
  error: string | null;
  processingId: number | null;
  // Template CRUD
  fetchTemplates: (activeOnly?: boolean) => Promise<StakeholderServiceTemplate[]>;
  fetchTemplateById: (templateId: number) => Promise<StakeholderServiceTemplate | null>;
  createTemplate: (data: ServiceTemplateFormData) => Promise<StakeholderServiceTemplate | null>;
  updateTemplate: (templateId: number, data: Partial<ServiceTemplateFormData>) => Promise<boolean>;
  deleteTemplate: (templateId: number) => Promise<boolean>;
  toggleTemplateActive: (templateId: number, isActive: boolean) => Promise<boolean>;
  // Invoice Settings
  fetchInvoiceSettings: () => Promise<CompanyInvoiceSettings | null>;
  saveInvoiceSettings: (data: CompanyInvoiceSettingsFormData) => Promise<CompanyInvoiceSettings | null>;
}

// ==============================================================================
// HOOK
// ==============================================================================

export function useServiceTemplates(): UseServiceTemplatesReturn {
  const { employeeInfo } = useAuth();
  const [templates, setTemplates] = useState<StakeholderServiceTemplate[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<CompanyInvoiceSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // FETCH TEMPLATES
  // ==========================================================================

  const fetchTemplates = useCallback(async (
    activeOnly: boolean = false
  ): Promise<StakeholderServiceTemplate[]> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      let query = supabase
        .from("stakeholder_service_templates")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setTemplates(data || []);
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch templates";
      setError(message);
      captureError(err, { 
        operation: "fetchTemplates",
        companyId: employeeInfo?.company_id 
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // FETCH TEMPLATE BY ID
  // ==========================================================================

  const fetchTemplateById = useCallback(async (
    templateId: number
  ): Promise<StakeholderServiceTemplate | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_service_templates")
        .select("*")
        .eq("id", templateId)
        .eq("company_id", companyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch template";
      setError(message);
      captureError(err, { 
        operation: "fetchTemplateById",
        companyId: employeeInfo?.company_id,
        templateId 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // CREATE TEMPLATE
  // ==========================================================================

  const createTemplate = useCallback(async (
    data: ServiceTemplateFormData
  ): Promise<StakeholderServiceTemplate | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      const { data: template, error: createError } = await supabase
        .from("stakeholder_service_templates")
        .insert({
          company_id: companyId,
          name: data.name,
          description: data.description,
          direction: data.direction,
          default_currency: data.default_currency,
          default_tax_rate: data.default_tax_rate,
          default_billing_cycle_type: data.default_billing_cycle_type,
          default_billing_day_of_month: data.default_billing_day_of_month,
          default_billing_day_of_week: data.default_billing_day_of_week,
          default_billing_month_of_year: data.default_billing_month_of_year,
          default_billing_interval_days: data.default_billing_interval_days,
          default_line_items: data.default_line_items,
          is_active: data.is_active,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Update local state
      setTemplates(prev => [...prev, template]);

      return template;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create template";
      setError(message);
      captureError(err, { 
        operation: "createTemplate",
        companyId: employeeInfo?.company_id 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // UPDATE TEMPLATE
  // ==========================================================================

  const updateTemplate = useCallback(async (
    templateId: number,
    data: Partial<ServiceTemplateFormData>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(templateId);

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
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.direction !== undefined) updateData.direction = data.direction;
      if (data.default_currency !== undefined) updateData.default_currency = data.default_currency;
      if (data.default_tax_rate !== undefined) updateData.default_tax_rate = data.default_tax_rate;
      if (data.default_billing_cycle_type !== undefined) updateData.default_billing_cycle_type = data.default_billing_cycle_type;
      if (data.default_billing_day_of_month !== undefined) updateData.default_billing_day_of_month = data.default_billing_day_of_month;
      if (data.default_billing_day_of_week !== undefined) updateData.default_billing_day_of_week = data.default_billing_day_of_week;
      if (data.default_billing_month_of_year !== undefined) updateData.default_billing_month_of_year = data.default_billing_month_of_year;
      if (data.default_billing_interval_days !== undefined) updateData.default_billing_interval_days = data.default_billing_interval_days;
      if (data.default_line_items !== undefined) updateData.default_line_items = data.default_line_items;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { error: updateError } = await supabase
        .from("stakeholder_service_templates")
        .update(updateData)
        .eq("id", templateId)
        .eq("company_id", companyId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, ...updateData } : t
      ));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update template";
      setError(message);
      captureError(err, { 
        operation: "updateTemplate",
        companyId: employeeInfo?.company_id,
        templateId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // DELETE TEMPLATE
  // ==========================================================================

  const deleteTemplate = useCallback(async (
    templateId: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setProcessingId(templateId);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { error: deleteError } = await supabase
        .from("stakeholder_service_templates")
        .delete()
        .eq("id", templateId)
        .eq("company_id", companyId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete template";
      setError(message);
      captureError(err, { 
        operation: "deleteTemplate",
        companyId: employeeInfo?.company_id,
        templateId 
      });
      return false;
    } finally {
      setLoading(false);
      setProcessingId(null);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // TOGGLE TEMPLATE ACTIVE
  // ==========================================================================

  const toggleTemplateActive = useCallback(async (
    templateId: number,
    isActive: boolean
  ): Promise<boolean> => {
    return updateTemplate(templateId, { is_active: isActive });
  }, [updateTemplate]);

  // ==========================================================================
  // FETCH INVOICE SETTINGS
  // ==========================================================================

  const fetchInvoiceSettings = useCallback(async (): Promise<CompanyInvoiceSettings | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const { data, error: fetchError } = await supabase
        .from("company_invoice_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setInvoiceSettings(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch invoice settings";
      setError(message);
      captureError(err, { 
        operation: "fetchInvoiceSettings",
        companyId: employeeInfo?.company_id 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // ==========================================================================
  // SAVE INVOICE SETTINGS
  // ==========================================================================

  const saveInvoiceSettings = useCallback(async (
    data: CompanyInvoiceSettingsFormData
  ): Promise<CompanyInvoiceSettings | null> => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;
      if (!companyId || !userId) {
        throw new Error("User context not found");
      }

      // Check if settings exist
      const { data: existing } = await supabase
        .from("company_invoice_settings")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();

      let settings: CompanyInvoiceSettings | null = null;

      if (existing) {
        // Update existing
        const { data: updated, error: updateError } = await supabase
          .from("company_invoice_settings")
          .update({
            ...data,
            updated_by: userId,
          })
          .eq("company_id", companyId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        settings = updated;
      } else {
        // Create new
        const { data: created, error: createError } = await supabase
          .from("company_invoice_settings")
          .insert({
            company_id: companyId,
            ...data,
            created_by: userId,
            updated_by: userId,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        settings = created;
      }

      setInvoiceSettings(settings);
      return settings;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save invoice settings";
      setError(message);
      captureError(err, { 
        operation: "saveInvoiceSettings",
        companyId: employeeInfo?.company_id 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    templates,
    invoiceSettings,
    loading,
    error,
    processingId,
    fetchTemplates,
    fetchTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    fetchInvoiceSettings,
    saveInvoiceSettings,
  };
}
