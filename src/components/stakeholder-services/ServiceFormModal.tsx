"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  CalendarBlank,
  CurrencyDollar,
  ArrowsClockwise,
  ArrowRight,
  ArrowLeft,
  Percent,
  FileText,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  CaretDown,
  Info,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStakeholderServices } from "@/hooks/useStakeholderServices";
import { useServiceTemplates } from "@/hooks/useServiceTemplates";
import {
  StakeholderService,
  StakeholderServiceTemplate,
  ServiceDirection,
  ServiceType,
  ServiceStatus,
  BillingCycleType,
  ServiceFormData,
  ServiceLineItemFormData,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  DAYS_OF_MONTH,
  PAYMENT_ACCOUNT_CATEGORIES,
} from "@/lib/types/stakeholder-services";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";
import FormNumberField from "@/components/ui/FormNumberField";
import ServiceLineItemsEditor, {
  LineItemFormData,
  lineItemsApiToForm,
  templateLineItemsToForm,
} from "./ServiceLineItemsEditor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fadeInUp } from "@/components/ui/animations";

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholderId: number;
  stakeholderName: string;
  existingService?: StakeholderService;
  onSuccess?: (service: StakeholderService) => void;
}

const directionOptions = [
  { value: "outgoing", label: "Outgoing (Bill stakeholder)" },
  { value: "incoming", label: "Incoming (Stakeholder bills us)" },
];

const serviceTypeOptions = [
  { value: "recurring", label: "Recurring" },
  { value: "one_off", label: "One-off" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const billingCycleOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "x_days", label: "Every X Days" },
];

interface FormData {
  template_id: number | null;
  service_name: string;
  description: string;
  direction: ServiceDirection;
  service_type: ServiceType;
  currency: string;
  tax_rate: number;
  status: ServiceStatus;
  start_date: string;
  end_date: string;
  billing_cycle_type: BillingCycleType;
  billing_day_of_month: number;
  billing_day_of_week: number;
  billing_month_of_year: number;
  billing_interval_days: number;
  payment_account_category: string;
  auto_create_payment: boolean;
  line_items: LineItemFormData[];
}

const initialFormData: FormData = {
  template_id: null,
  service_name: "",
  description: "",
  direction: "outgoing",
  service_type: "recurring",
  currency: "BDT",
  tax_rate: 0,
  status: "active",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  billing_cycle_type: "monthly",
  billing_day_of_month: 1,
  billing_day_of_week: 1,
  billing_month_of_year: 1,
  billing_interval_days: 30,
  payment_account_category: "Income",
  auto_create_payment: true,
  line_items: [],
};

export default function ServiceFormModal({
  isOpen,
  onClose,
  stakeholderId,
  stakeholderName,
  existingService,
  onSuccess,
}: ServiceFormProps) {
  const { employeeInfo } = useAuth();
  const { createService, updateService, loading } = useStakeholderServices();
  const { templates, fetchTemplates } = useServiceTemplates();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isEditing = !!existingService;

  // Load templates on mount
  useEffect(() => {
    if (isOpen && employeeInfo?.company_id) {
      fetchTemplates(true); // Active templates only
    }
  }, [isOpen, employeeInfo?.company_id, fetchTemplates]);

  // Initialize form with existing service data
  useEffect(() => {
    if (existingService) {
      setFormData({
        template_id: existingService.template_id || null,
        service_name: existingService.service_name,
        description: existingService.description || "",
        direction: existingService.direction,
        service_type: existingService.service_type,
        currency: existingService.currency,
        tax_rate: existingService.tax_rate,
        status: existingService.status,
        start_date: existingService.start_date,
        end_date: existingService.end_date || "",
        billing_cycle_type: existingService.billing_cycle_type || "monthly",
        billing_day_of_month: existingService.billing_day_of_month || 1,
        billing_day_of_week: existingService.billing_day_of_week || 1,
        billing_month_of_year: existingService.billing_month_of_year || 1,
        billing_interval_days: existingService.billing_interval_days || 30,
        payment_account_category: existingService.payment_account_category || "Income",
        auto_create_payment: existingService.auto_create_payment,
        line_items: existingService.line_items
          ? lineItemsApiToForm(existingService.line_items)
          : [],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [existingService, isOpen]);

  // Filter templates based on direction
  const filteredTemplates = useMemo(() => {
    if (!formData.direction) return templates;
    return templates.filter((t) => t.direction === formData.direction);
  }, [templates, formData.direction]);

  const handleTemplateSelect = (templateId: number | null) => {
    if (!templateId) {
      setFormData((prev) => ({ ...prev, template_id: null }));
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setFormData((prev) => ({
      ...prev,
      template_id: templateId,
      service_name: template.name,
      description: template.description || "",
      direction: template.direction,
      currency: template.default_currency,
      tax_rate: template.default_tax_rate,
      billing_cycle_type: template.default_billing_cycle_type || "monthly",
      billing_day_of_month: template.default_billing_day_of_month || 1,
      billing_day_of_week: template.default_billing_day_of_week || 1,
      billing_month_of_year: template.default_billing_month_of_year || 1,
      billing_interval_days: template.default_billing_interval_days || 30,
      line_items: template.default_line_items
        ? templateLineItemsToForm(template.default_line_items)
        : [],
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    // Handle checkboxes
    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    // Handle numbers
    else if (type === "number") {
      newValue = value === "" ? 0 : parseFloat(value);
    }
    // Handle "null" string for select fields
    else if (value === "null") {
      newValue = null;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLineItemsChange = (items: LineItemFormData[]) => {
    setFormData((prev) => ({ ...prev, line_items: items }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.service_name.trim()) {
      newErrors.service_name = "Service name is required";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    if (formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date must be after start date";
    }
    if (formData.line_items.length === 0) {
      newErrors.line_items = "At least one line item is required";
    }
    if (formData.line_items.some((item) => !item.description.trim())) {
      newErrors.line_items = "All line items must have a description";
    }

    // Validate billing cycle for recurring services
    if (formData.service_type === "recurring") {
      if (formData.billing_cycle_type === "monthly" && (formData.billing_day_of_month < 1 || formData.billing_day_of_month > 28)) {
        newErrors.billing_day_of_month = "Day must be between 1 and 28";
      }
      if (formData.billing_cycle_type === "weekly" && (formData.billing_day_of_week < 1 || formData.billing_day_of_week > 7)) {
        newErrors.billing_day_of_week = "Day must be between 1 and 7";
      }
      if (formData.billing_cycle_type === "x_days" && formData.billing_interval_days < 1) {
        newErrors.billing_interval_days = "Interval must be at least 1 day";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (!employeeInfo?.company_id) {
      toast.error("Company information not found");
      return;
    }

    const serviceData: ServiceFormData = {
      stakeholder_id: stakeholderId,
      template_id: formData.template_id || undefined,
      service_name: formData.service_name.trim(),
      description: formData.description.trim() || undefined,
      direction: formData.direction,
      service_type: formData.service_type,
      currency: formData.currency,
      tax_rate: formData.tax_rate,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      // Billing cycle (only for recurring)
      billing_cycle_type: formData.service_type === "recurring" ? formData.billing_cycle_type : undefined,
      billing_day_of_month:
        formData.service_type === "recurring" && formData.billing_cycle_type === "monthly"
          ? formData.billing_day_of_month
          : undefined,
      billing_day_of_week:
        formData.service_type === "recurring" && formData.billing_cycle_type === "weekly"
          ? formData.billing_day_of_week
          : undefined,
      billing_month_of_year:
        formData.service_type === "recurring" && formData.billing_cycle_type === "yearly"
          ? formData.billing_month_of_year
          : undefined,
      billing_interval_days:
        formData.service_type === "recurring" && formData.billing_cycle_type === "x_days"
          ? formData.billing_interval_days
          : undefined,
      // Incoming service options
      payment_account_category: formData.direction === "incoming" ? formData.payment_account_category : undefined,
      auto_create_payment: formData.direction === "incoming" ? formData.auto_create_payment : false,
      // Line items
      line_items: formData.line_items.map((item, index) => ({
        item_order: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    try {
      let result: StakeholderService | null;

      if (isEditing && existingService?.id) {
        result = await updateService(existingService.id, serviceData);
        if (result) {
          toast.success("Service updated successfully");
        }
      } else {
        result = await createService(serviceData);
        if (result) {
          toast.success("Service created successfully");
        }
      }

      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(isEditing ? "Failed to update service" : "Failed to create service");
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Service" : "Create Service"}
      icon={<Package size={24} className="text-primary-500" />}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stakeholder Info */}
        <div className="bg-surface-secondary rounded-lg p-4 border border-border-primary">
          <p className="text-sm text-foreground-secondary">
            <span className="font-medium">Stakeholder:</span>{" "}
            <span className="text-foreground-primary">{stakeholderName}</span>
          </p>
        </div>

        {/* Template Selection */}
        {!isEditing && filteredTemplates.length > 0 && (
          <motion.div variants={fadeInUp}>
            <FormSelectField
              name="template_id"
              label="Use Template (Optional)"
              icon={<FileText size={18} />}
              options={filteredTemplates.map((t) => ({
                value: t.id!,
                label: t.name,
              }))}
              placeholder="Select a template..."
              value={formData.template_id}
              onChange={(e) =>
                handleTemplateSelect(e.target.value === "null" ? null : parseInt(e.target.value))
              }
            />
          </motion.div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div variants={fadeInUp}>
            <FormInputField
              name="service_name"
              label="Service Name"
              icon={<Package size={18} />}
              value={formData.service_name}
              onChange={handleChange}
              error={errors.service_name}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <FormSelectField
              name="direction"
              label="Direction"
              icon={
                formData.direction === "outgoing" ? (
                  <ArrowRight size={18} />
                ) : (
                  <ArrowLeft size={18} />
                )
              }
              options={directionOptions}
              placeholder="Select direction"
              value={formData.direction}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <FormSelectField
              name="service_type"
              label="Service Type"
              icon={<ArrowsClockwise size={18} />}
              options={serviceTypeOptions}
              placeholder="Select type"
              value={formData.service_type}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <FormSelectField
              name="status"
              label="Status"
              icon={
                formData.status === "active" ? (
                  <CheckCircle size={18} />
                ) : formData.status === "paused" ? (
                  <Pause size={18} />
                ) : (
                  <XCircle size={18} />
                )
              }
              options={statusOptions}
              placeholder="Select status"
              value={formData.status}
              onChange={handleChange}
            />
          </motion.div>
        </div>

        {/* Description */}
        <motion.div variants={fadeInUp}>
          <label className="block text-sm font-semibold text-foreground-primary mb-1">
            Description (Optional)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-foreground-tertiary">
              <FileText size={18} />
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full pl-10 pr-4 py-2.5 text-foreground-primary rounded-lg border border-border-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary resize-none"
              placeholder="Service description..."
            />
          </div>
        </motion.div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div variants={fadeInUp}>
            <FormInputField
              name="start_date"
              label="Start Date"
              icon={<CalendarBlank size={18} />}
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              error={errors.start_date}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <FormInputField
              name="end_date"
              label="End Date (Optional)"
              icon={<CalendarBlank size={18} />}
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              error={errors.end_date}
            />
          </motion.div>
        </div>

        {/* Currency & Tax */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div variants={fadeInUp}>
            <FormSelectField
              name="currency"
              label="Currency"
              icon={<CurrencyDollar size={18} />}
              options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))}
              placeholder="Select currency"
              value={formData.currency}
              onChange={handleChange}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <FormNumberField
              name="tax_rate"
              label="Tax Rate (%)"
              icon={<Percent size={18} />}
              value={formData.tax_rate}
              onChange={handleChange}
              min={0}
              max={100}
              step={0.01}
              error={errors.tax_rate}
            />
          </motion.div>
        </div>

        {/* Billing Cycle (for recurring) */}
        {formData.service_type === "recurring" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 bg-surface-secondary rounded-lg border border-border-primary"
          >
            <h4 className="text-sm font-semibold text-foreground-primary flex items-center gap-2">
              <ArrowsClockwise size={18} className="text-primary-500" />
              Billing Cycle Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelectField
                name="billing_cycle_type"
                label="Billing Cycle"
                icon={<Clock size={18} />}
                options={billingCycleOptions}
                placeholder="Select cycle"
                value={formData.billing_cycle_type}
                onChange={handleChange}
              />

              {formData.billing_cycle_type === "monthly" && (
                <FormSelectField
                  name="billing_day_of_month"
                  label="Day of Month"
                  icon={<CalendarBlank size={18} />}
                  options={DAYS_OF_MONTH.map((d) => ({ value: d.value, label: d.label }))}
                  placeholder="Select day"
                  value={formData.billing_day_of_month}
                  onChange={handleChange}
                  error={errors.billing_day_of_month}
                />
              )}

              {formData.billing_cycle_type === "weekly" && (
                <FormSelectField
                  name="billing_day_of_week"
                  label="Day of Week"
                  icon={<CalendarBlank size={18} />}
                  options={DAYS_OF_WEEK.map((d) => ({ value: d.value, label: d.label }))}
                  placeholder="Select day"
                  value={formData.billing_day_of_week}
                  onChange={handleChange}
                  error={errors.billing_day_of_week}
                />
              )}

              {formData.billing_cycle_type === "yearly" && (
                <>
                  <FormSelectField
                    name="billing_month_of_year"
                    label="Month"
                    icon={<CalendarBlank size={18} />}
                    options={MONTHS_OF_YEAR.map((m) => ({ value: m.value, label: m.label }))}
                    placeholder="Select month"
                    value={formData.billing_month_of_year}
                    onChange={handleChange}
                  />
                  <FormSelectField
                    name="billing_day_of_month"
                    label="Day"
                    icon={<CalendarBlank size={18} />}
                    options={DAYS_OF_MONTH.map((d) => ({ value: d.value, label: d.label }))}
                    placeholder="Select day"
                    value={formData.billing_day_of_month}
                    onChange={handleChange}
                    error={errors.billing_day_of_month}
                  />
                </>
              )}

              {formData.billing_cycle_type === "x_days" && (
                <FormNumberField
                  name="billing_interval_days"
                  label="Interval (Days)"
                  icon={<Clock size={18} />}
                  value={formData.billing_interval_days}
                  onChange={handleChange}
                  min={1}
                  error={errors.billing_interval_days}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Incoming Service Options */}
        {formData.direction === "incoming" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 bg-info/5 rounded-lg border border-info/30"
          >
            <h4 className="text-sm font-semibold text-foreground-primary flex items-center gap-2">
              <ArrowLeft size={18} className="text-info" />
              Incoming Service Options
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelectField
                name="payment_account_category"
                label="Account Category"
                icon={<CurrencyDollar size={18} />}
                options={PAYMENT_ACCOUNT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="Select category"
                value={formData.payment_account_category}
                onChange={handleChange}
              />

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="auto_create_payment"
                  name="auto_create_payment"
                  checked={formData.auto_create_payment}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-border-primary rounded focus:ring-primary-500"
                />
                <label htmlFor="auto_create_payment" className="text-sm text-foreground-primary">
                  Auto-create payment records
                </label>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-info bg-info/10 rounded-lg p-3">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>
                Incoming services will create pending payment records in your accounts when billing
                occurs. These can be tracked and marked as paid.
              </p>
            </div>
          </motion.div>
        )}

        {/* Line Items */}
        <ServiceLineItemsEditor
          items={formData.line_items}
          onChange={handleLineItemsChange}
          currency={formData.currency}
          error={errors.line_items}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Service" : "Create Service"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
