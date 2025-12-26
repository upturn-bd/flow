"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  MagnifyingGlass,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  PencilSimple,
  TrashSimple,
  DotsThree,
  Copy,
  CurrencyDollar,
  Percent,
  Clock,
  Gear,
  ArrowsClockwise,
  ArrowUDownLeft,
  CalendarBlank,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useServiceTemplates } from "@/hooks/useServiceTemplates";
import {
  StakeholderServiceTemplate,
  CompanyInvoiceSettings,
  ServiceDirection,
  BillingCycleType,
  TemplateLineItem,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  DAYS_OF_MONTH,
} from "@/lib/types/stakeholder-services";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";

// Convert currency options to select format
const currencySelectOptions = CURRENCY_OPTIONS.map(currency => ({ value: currency, label: currency }));
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormModal from "@/components/ui/modals/FormModal";
import FormInputField from "@/components/ui/FormInputField";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import FormSelectField from "@/components/ui/FormSelectField";
import FormNumberField from "@/components/ui/FormNumberField";
import ServiceLineItemsEditor, {
  LineItemFormData,
  templateLineItemsToForm,
} from "@/components/stakeholder-services/ServiceLineItemsEditor";
import { toast } from "sonner";

// Invoice Settings Form
interface InvoiceSettingsFormData {
  invoice_prefix: string;
  default_payment_terms_days: number;
  default_currency: string;
  default_tax_rate: number;
  company_address: string;
  company_phone: string;
  company_email: string;
  invoice_footer_text: string;
  payment_instructions: string;
}

// Template Form Data
interface TemplateFormData {
  name: string;
  description: string;
  direction: ServiceDirection;
  default_currency: string;
  default_tax_rate: number;
  default_billing_cycle_type: BillingCycleType;
  default_billing_day_of_month: number;
  default_billing_day_of_week: number;
  default_billing_month_of_year: number;
  default_billing_interval_days: number;
  is_active: boolean;
  default_line_items: LineItemFormData[];
}

const directionOptions = [
  { value: "outgoing", label: "Outgoing (Bill stakeholder)" },
  { value: "incoming", label: "Incoming (Stakeholder bills us)" },
];

const billingCycleOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "x_days", label: "Every X Days" },
];

export default function ServiceTemplatesPage() {
  const router = useRouter();
  const { canWrite, canDelete, employeeInfo } = useAuth();
  const {
    templates,
    invoiceSettings,
    loading,
    error,
    fetchTemplates,
    fetchInvoiceSettings,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    saveInvoiceSettings,
  } = useServiceTemplates();

  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StakeholderServiceTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Form states
  const [settingsFormData, setSettingsFormData] = useState<InvoiceSettingsFormData>({
    invoice_prefix: "",
    default_payment_terms_days: 30,
    default_currency: "BDT",
    default_tax_rate: 0,
    company_address: "",
    company_phone: "",
    company_email: "",
    invoice_footer_text: "",
    payment_instructions: "",
  });

  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    direction: "outgoing",
    default_currency: "BDT",
    default_tax_rate: 0,
    default_billing_cycle_type: "monthly",
    default_billing_day_of_month: 1,
    default_billing_day_of_week: 1,
    default_billing_month_of_year: 1,
    default_billing_interval_days: 30,
    is_active: true,
    default_line_items: [],
  });

  const [templateErrors, setTemplateErrors] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Load data
  useEffect(() => {
    if (employeeInfo?.company_id) {
      fetchTemplates();
      fetchInvoiceSettings();
    }
  }, [employeeInfo?.company_id, fetchTemplates, fetchInvoiceSettings]);

  // Update settings form when data loads
  useEffect(() => {
    if (invoiceSettings) {
      setSettingsFormData({
        invoice_prefix: invoiceSettings.invoice_prefix || "",
        default_payment_terms_days: invoiceSettings.default_payment_terms_days,
        default_currency: invoiceSettings.default_currency,
        default_tax_rate: invoiceSettings.default_tax_rate,
        company_address: invoiceSettings.company_address || "",
        company_phone: invoiceSettings.company_phone || "",
        company_email: invoiceSettings.company_email || "",
        invoice_footer_text: invoiceSettings.invoice_footer_text || "",
        payment_instructions: invoiceSettings.payment_instructions || "",
      });
    }
  }, [invoiceSettings]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !template.name.toLowerCase().includes(search) &&
          !template.description?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Direction filter
      if (directionFilter !== "all" && template.direction !== directionFilter) {
        return false;
      }

      // Active filter
      if (activeFilter === "active" && !template.is_active) {
        return false;
      }
      if (activeFilter === "inactive" && template.is_active) {
        return false;
      }

      return true;
    });
  }, [templates, searchTerm, directionFilter, activeFilter]);

  // Settings form handlers
  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setSettingsFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!employeeInfo?.company_id) return;

    setSavingSettings(true);
    try {
      const success = await saveInvoiceSettings(settingsFormData);
      if (success) {
        toast.success("Invoice settings saved");
        setShowSettingsModal(false);
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Template form handlers
  const openTemplateModal = (template?: StakeholderServiceTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateFormData({
        name: template.name,
        description: template.description || "",
        direction: template.direction,
        default_currency: template.default_currency,
        default_tax_rate: template.default_tax_rate,
        default_billing_cycle_type: template.default_billing_cycle_type || "monthly",
        default_billing_day_of_month: template.default_billing_day_of_month || 1,
        default_billing_day_of_week: template.default_billing_day_of_week || 1,
        default_billing_month_of_year: template.default_billing_month_of_year || 1,
        default_billing_interval_days: template.default_billing_interval_days || 30,
        is_active: template.is_active,
        default_line_items: template.default_line_items
          ? templateLineItemsToForm(template.default_line_items)
          : [],
      });
    } else {
      setEditingTemplate(null);
      setTemplateFormData({
        name: "",
        description: "",
        direction: "outgoing",
        default_currency: invoiceSettings?.default_currency || "BDT",
        default_tax_rate: invoiceSettings?.default_tax_rate || 0,
        default_billing_cycle_type: "monthly",
        default_billing_day_of_month: 1,
        default_billing_day_of_week: 1,
        default_billing_month_of_year: 1,
        default_billing_interval_days: 30,
        is_active: true,
        default_line_items: [],
      });
    }
    setTemplateErrors({});
    setShowTemplateModal(true);
    setActiveMenuId(null);
  };

  const handleTemplateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      newValue = parseFloat(value) || 0;
    } else if (value === "null") {
      newValue = null;
    }

    setTemplateFormData((prev) => ({ ...prev, [name]: newValue }));
    setTemplateErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateTemplate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!templateFormData.name.trim()) {
      errors.name = "Template name is required";
    }

    setTemplateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTemplate = async () => {
    if (!validateTemplate() || !employeeInfo?.company_id) return;

    setSavingTemplate(true);
    try {
      const templateData = {
        company_id: employeeInfo.company_id,
        name: templateFormData.name.trim(),
        description: templateFormData.description.trim() || undefined,
        direction: templateFormData.direction,
        default_currency: templateFormData.default_currency,
        default_tax_rate: templateFormData.default_tax_rate,
        default_billing_cycle_type: templateFormData.default_billing_cycle_type,
        default_billing_day_of_month: templateFormData.default_billing_day_of_month,
        default_billing_day_of_week: templateFormData.default_billing_day_of_week,
        default_billing_month_of_year: templateFormData.default_billing_month_of_year,
        default_billing_interval_days: templateFormData.default_billing_interval_days,
        is_active: templateFormData.is_active,
        default_line_items: templateFormData.default_line_items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      let success: StakeholderServiceTemplate | boolean | null;

      if (editingTemplate?.id) {
        success = await updateTemplate(editingTemplate.id, templateData);
        if (success) toast.success("Template updated");
      } else {
        success = await createTemplate(templateData);
        if (success) toast.success("Template created");
      }

      if (success) {
        setShowTemplateModal(false);
        fetchTemplates();
      }
    } catch (err) {
      toast.error("Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setDeletingTemplateId(templateId);
    try {
      const success = await deleteTemplate(templateId);
      if (success) {
        toast.success("Template deleted");
        fetchTemplates();
      }
    } catch (err) {
      toast.error("Failed to delete template");
    } finally {
      setDeletingTemplateId(null);
      setActiveMenuId(null);
    }
  };

  const handleToggleActive = async (templateId: number, currentState: boolean) => {
    try {
      const success = await toggleTemplateActive(templateId, !currentState);
      if (success) {
        toast.success(currentState ? "Template deactivated" : "Template activated");
      }
    } catch (err) {
      toast.error("Failed to update template");
    }
    setActiveMenuId(null);
  };

  const calculateTemplateTotal = (items: TemplateLineItem[]): number => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  if (loading && templates.length === 0) {
    return (
      <LoadingSpinner
        icon={FileText}
        text="Loading templates..."
        color="blue"
        height="min-h-screen"
      />
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* Breadcrumbs */}
      <AdminBreadcrumbs 
        section="Company Configurations"
        pageName="Service Templates"
        icon={<FileText className="w-4 h-4" />}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground-primary mb-2"
          >
            <ArrowUDownLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-foreground-primary">Service Templates</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage reusable service templates and invoice settings
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <Gear size={16} className="mr-2" />
            Invoice Settings
          </Button>
          {canWrite("stakeholders") && (
            <Button onClick={() => openTemplateModal()}>
              <Plus size={16} className="mr-2" />
              Create Template
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Settings Summary */}
      {invoiceSettings && (
        <motion.div
          variants={fadeInUp}
          className="bg-surface-primary rounded-lg border border-border-primary p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gear size={18} className="text-foreground-tertiary" />
            <h3 className="font-semibold text-foreground-primary">Invoice Settings</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-foreground-tertiary">Prefix</p>
              <p className="font-medium text-foreground-primary">{invoiceSettings.invoice_prefix || "-"}</p>
            </div>
            <div>
              <p className="text-foreground-tertiary">Payment Terms</p>
              <p className="font-medium text-foreground-primary">{invoiceSettings.default_payment_terms_days} days</p>
            </div>
            <div>
              <p className="text-foreground-tertiary">Default Currency</p>
              <p className="font-medium text-foreground-primary">{invoiceSettings.default_currency}</p>
            </div>
            <div>
              <p className="text-foreground-tertiary">Default Tax Rate</p>
              <p className="font-medium text-foreground-primary">{invoiceSettings.default_tax_rate}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
        >
          <option value="all">All Directions</option>
          <option value="outgoing">Outgoing</option>
          <option value="incoming">Incoming</option>
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={templates.length === 0 ? "No Templates" : "No Matching Templates"}
          description={
            templates.length === 0
              ? "Create templates to quickly set up common services"
              : "Try adjusting your search or filters"
          }
          action={
            templates.length === 0 && canWrite("stakeholders")
              ? {
                  label: "Create Template",
                  onClick: () => openTemplateModal(),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              variants={fadeInUp}
              className="bg-surface-primary rounded-lg border border-border-primary p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {template.direction === "outgoing" ? (
                      <ArrowRight size={16} className="text-primary-500 shrink-0" />
                    ) : (
                      <ArrowLeft size={16} className="text-info shrink-0" />
                    )}
                    <h4 className="font-semibold text-foreground-primary truncate">
                      {template.name}
                    </h4>
                  </div>
                  <Badge
                    variant={template.is_active ? "success" : "default"}
                    size="xs"
                    icon={template.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === template.id ? null : template.id!)}
                    className="p-1.5 text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-secondary rounded-lg transition-colors"
                  >
                    <DotsThree size={18} weight="bold" />
                  </button>

                  <AnimatePresence>
                    {activeMenuId === template.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 w-40 bg-surface-primary border border-border-primary rounded-lg shadow-lg z-10 overflow-hidden"
                      >
                        {canWrite("stakeholders") && (
                          <>
                            <button
                              onClick={() => openTemplateModal(template)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                            >
                              <PencilSimple size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(template.id!, template.is_active)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                            >
                              {template.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                              {template.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        )}
                        {canDelete("stakeholders") && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id!)}
                            disabled={deletingTemplateId === template.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 disabled:opacity-50"
                          >
                            <TrashSimple size={14} />
                            Delete
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-foreground-tertiary mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-foreground-secondary">
                <div className="flex items-center gap-2">
                  <CurrencyDollar size={14} />
                  <span>{template.default_currency}</span>
                  {template.default_tax_rate > 0 && (
                    <>
                      <span className="text-foreground-tertiary">|</span>
                      <Percent size={14} />
                      <span>{template.default_tax_rate}% tax</span>
                    </>
                  )}
                </div>
                {template.default_billing_cycle_type && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span className="capitalize">{template.default_billing_cycle_type}</span>
                  </div>
                )}
                {template.default_line_items && template.default_line_items.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span>{template.default_line_items.length} line item(s)</span>
                    <span className="text-foreground-tertiary">|</span>
                    <span className="font-medium">
                      {formatCurrency(calculateTemplateTotal(template.default_line_items), template.default_currency)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setActiveMenuId(null)} />
      )}

      {/* Invoice Settings Modal */}
      <BaseModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Invoice Settings"
        icon={<Gear size={24} className="text-primary-500" />}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInputField
              name="invoice_prefix"
              label="Invoice Prefix"
              icon={<FileText size={18} />}
              value={settingsFormData.invoice_prefix}
              onChange={handleSettingsChange}
            />
            <FormNumberField
              name="default_payment_terms_days"
              label="Payment Terms (Days)"
              icon={<Clock size={18} />}
              value={settingsFormData.default_payment_terms_days}
              onChange={handleSettingsChange}
              min={1}
            />
            <FormSelectField
              name="default_currency"
              label="Default Currency"
              icon={<CurrencyDollar size={18} />}
              options={currencySelectOptions}
              placeholder="Select currency"
              value={settingsFormData.default_currency}
              onChange={handleSettingsChange}
            />
            <FormNumberField
              name="default_tax_rate"
              label="Default Tax Rate (%)"
              icon={<Percent size={18} />}
              value={settingsFormData.default_tax_rate}
              onChange={handleSettingsChange}
              min={0}
              max={100}
              step={0.01}
            />
          </div>

          <FormInputField
            name="company_email"
            label="Company Email"
            icon={<FileText size={18} />}
            value={settingsFormData.company_email}
            onChange={handleSettingsChange}
            type="email"
          />

          <FormInputField
            name="company_phone"
            label="Company Phone"
            icon={<FileText size={18} />}
            value={settingsFormData.company_phone}
            onChange={handleSettingsChange}
          />

          <div>
            <label className="block text-sm font-semibold text-foreground-primary mb-1">
              Company Address
            </label>
            <textarea
              name="company_address"
              value={settingsFormData.company_address}
              onChange={handleSettingsChange}
              rows={2}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground-primary mb-1">
              Invoice Footer
            </label>
            <textarea
              name="invoice_footer_text"
              value={settingsFormData.invoice_footer_text}
              onChange={handleSettingsChange}
              rows={2}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary resize-none"
              placeholder="Thank you for your business!"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground-primary mb-1">
              Payment Instructions
            </label>
            <textarea
              name="payment_instructions"
              value={settingsFormData.payment_instructions}
              onChange={handleSettingsChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary resize-none"
              placeholder="Bank details, payment methods..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Template Form Modal */}
      <BaseModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={editingTemplate ? "Edit Template" : "Create Template"}
        icon={<FileText size={24} className="text-primary-500" />}
        size="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTemplate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInputField
              name="name"
              label="Template Name"
              icon={<FileText size={18} />}
              value={templateFormData.name}
              onChange={handleTemplateChange}
              error={templateErrors.name}
            />
            <FormSelectField
              name="direction"
              label="Direction"
              icon={templateFormData.direction === "outgoing" ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              options={directionOptions}
              placeholder="Select direction"
              value={templateFormData.direction}
              onChange={handleTemplateChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={templateFormData.description}
              onChange={handleTemplateChange}
              rows={2}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelectField
              name="default_currency"
              label="Default Currency"
              icon={<CurrencyDollar size={18} />}
              options={currencySelectOptions}
              placeholder="Select currency"
              value={templateFormData.default_currency}
              onChange={handleTemplateChange}
            />
            <FormNumberField
              name="default_tax_rate"
              label="Default Tax Rate (%)"
              icon={<Percent size={18} />}
              value={templateFormData.default_tax_rate}
              onChange={handleTemplateChange}
              min={0}
              max={100}
              step={0.01}
            />
          </div>

          {/* Billing Cycle */}
          <div className="p-4 bg-surface-secondary rounded-lg border border-border-primary space-y-4">
            <h4 className="text-sm font-semibold text-foreground-primary flex items-center gap-2">
              <ArrowsClockwise size={18} className="text-primary-500" />
              Default Billing Cycle
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelectField
                name="default_billing_cycle_type"
                label="Cycle Type"
                icon={<Clock size={18} />}
                options={billingCycleOptions}
                placeholder="Select cycle"
                value={templateFormData.default_billing_cycle_type}
                onChange={handleTemplateChange}
              />

              {templateFormData.default_billing_cycle_type === "monthly" && (
                <FormSelectField
                  name="default_billing_day_of_month"
                  label="Day of Month"
                  icon={<CalendarBlank size={18} />}
                  options={DAYS_OF_MONTH}
                  placeholder="Select day"
                  value={templateFormData.default_billing_day_of_month}
                  onChange={handleTemplateChange}
                />
              )}

              {templateFormData.default_billing_cycle_type === "weekly" && (
                <FormSelectField
                  name="default_billing_day_of_week"
                  label="Day of Week"
                  icon={<CalendarBlank size={18} />}
                  options={DAYS_OF_WEEK.map((d) => ({ value: d.value, label: d.label }))}
                  placeholder="Select day"
                  value={templateFormData.default_billing_day_of_week}
                  onChange={handleTemplateChange}
                />
              )}

              {templateFormData.default_billing_cycle_type === "yearly" && (
                <>
                  <FormSelectField
                    name="default_billing_month_of_year"
                    label="Month"
                    icon={<CalendarBlank size={18} />}
                    options={MONTHS_OF_YEAR.map((m) => ({ value: m.value, label: m.label }))}
                    placeholder="Select month"
                    value={templateFormData.default_billing_month_of_year}
                    onChange={handleTemplateChange}
                  />
                  <FormSelectField
                    name="default_billing_day_of_month"
                    label="Day"
                    icon={<CalendarBlank size={18} />}
                    options={DAYS_OF_MONTH}
                    placeholder="Select day"
                    value={templateFormData.default_billing_day_of_month}
                    onChange={handleTemplateChange}
                  />
                </>
              )}

              {templateFormData.default_billing_cycle_type === "x_days" && (
                <FormNumberField
                  name="default_billing_interval_days"
                  label="Interval (Days)"
                  icon={<Clock size={18} />}
                  value={templateFormData.default_billing_interval_days}
                  onChange={handleTemplateChange}
                  min={1}
                />
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={templateFormData.is_active}
              onChange={handleTemplateChange}
              className="w-4 h-4 text-primary-600 border-border-primary rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm text-foreground-primary">
              Template is active and available for use
            </label>
          </div>

          {/* Line Items */}
          <ServiceLineItemsEditor
            items={templateFormData.default_line_items}
            onChange={(items) =>
              setTemplateFormData((prev) => ({ ...prev, default_line_items: items }))
            }
            currency={templateFormData.default_currency}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingTemplate}>
              {savingTemplate ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </BaseModal>
    </motion.div>
  );
}
