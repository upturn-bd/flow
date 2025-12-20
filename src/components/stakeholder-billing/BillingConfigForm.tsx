"use client";

import { useState, useEffect } from "react";
import { useStakeholderBilling } from "@/hooks/useStakeholderBilling";
import { StakeholderBillingCycle, BillingCycleType } from "@/lib/types/schemas";
import { toast } from "sonner";
import { BaseForm, FormField } from "@/components/forms/BaseForm";
import { useFormState } from "@/hooks/useFormState";
import { BILLING_CYCLE_TYPE, CURRENCY_OPTIONS } from "@/lib/constants";
import { useTeams } from "@/hooks/useTeams";
import { CurrencyDollar, CalendarBlank, Hash, Users } from "@phosphor-icons/react";

interface BillingConfigFormProps {
  processId: number;
  fieldKeys: string[]; // Available field keys from process steps
  onSave?: () => void;
}

export default function BillingConfigForm({ processId, fieldKeys, onSave }: BillingConfigFormProps) {
  const {
    fetchBillingCycleByProcess,
    createBillingCycle,
    updateBillingCycle,
    loading,
  } = useStakeholderBilling();
  
  const { teams, fetchTeams } = useTeams();
  const [existingConfig, setExistingConfig] = useState<StakeholderBillingCycle | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const initialState = {
    cycle_type: "date_to_date" as BillingCycleType,
    billing_day_of_month: 1,
    cycle_days: 30,
    billing_field_keys: [] as string[],
    default_currency: "BDT",
    finance_team_id: undefined as number | undefined,
    is_active: true,
  };

  const { formData, errors, handleChange, setFormData, resetForm } = useFormState(initialState);

  useEffect(() => {
    loadBillingConfig();
    fetchTeams();
  }, [processId]);

  const loadBillingConfig = async () => {
    setLoadingConfig(true);
    try {
      const config = await fetchBillingCycleByProcess(processId);
      if (config) {
        setExistingConfig(config);
        setFormData({
          cycle_type: config.cycle_type,
          billing_day_of_month: config.billing_day_of_month || 1,
          cycle_days: config.cycle_days || 30,
          billing_field_keys: config.billing_field_keys || [],
          default_currency: config.default_currency || "BDT",
          finance_team_id: config.finance_team_id || undefined,
          is_active: config.is_active,
        });
      }
    } catch (error) {
      console.error("Error loading billing config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.cycle_type === "date_to_date") {
      if (!formData.billing_day_of_month || formData.billing_day_of_month < 1 || formData.billing_day_of_month > 31) {
        newErrors.billing_day_of_month = "Billing day must be between 1 and 31";
      }
    } else if (formData.cycle_type === "x_days") {
      if (!formData.cycle_days || formData.cycle_days < 1) {
        newErrors.cycle_days = "Cycle days must be at least 1";
      }
    }

    if (formData.billing_field_keys.length === 0) {
      newErrors.billing_field_keys = "Please select at least one billing field";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      Object.values(validationErrors).forEach((error) => toast.error(error));
      return;
    }

    try {
      const billingData = {
        process_id: processId,
        cycle_type: formData.cycle_type,
        billing_day_of_month: formData.cycle_type === "date_to_date" ? formData.billing_day_of_month : undefined,
        cycle_days: formData.cycle_type === "x_days" ? formData.cycle_days : undefined,
        billing_field_keys: formData.billing_field_keys,
        default_currency: formData.default_currency,
        finance_team_id: formData.finance_team_id,
        is_active: formData.is_active,
      };

      if (existingConfig) {
        await updateBillingCycle(existingConfig.id!, billingData);
        toast.success("Billing configuration updated");
      } else {
        await createBillingCycle(billingData);
        toast.success("Billing configuration created");
      }

      await loadBillingConfig();
      onSave?.();
    } catch (error) {
      console.error("Error saving billing config:", error);
      toast.error("Failed to save billing configuration");
    }
  };

  const handleFieldKeyToggle = (fieldKey: string) => {
    const currentKeys = formData.billing_field_keys;
    const newKeys = currentKeys.includes(fieldKey)
      ? currentKeys.filter((k) => k !== fieldKey)
      : [...currentKeys, fieldKey];
    
    handleChange("billing_field_keys", newKeys);
  };

  if (loadingConfig) {
    return (
      <div className="p-6 text-center text-foreground-secondary">
        Loading billing configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground-primary mb-2">
          Billing Configuration
        </h3>
        <p className="text-sm text-foreground-secondary">
          Configure how invoices are generated for stakeholders in this process
        </p>
      </div>

      <BaseForm
        onSubmit={handleSubmit}
        submitText={existingConfig ? "Update Configuration" : "Create Configuration"}
        isLoading={loading}
      >
        <div className="space-y-6">
          {/* Billing Cycle Type */}
          <FormField
            label="Billing Cycle Type"
            required
            error={errors.cycle_type}
            icon={<CalendarBlank size={20} />}
          >
            <select
              value={formData.cycle_type}
              onChange={(e) => handleChange("cycle_type", e.target.value as BillingCycleType)}
              className="input-field"
            >
              <option value={BILLING_CYCLE_TYPE.DATE_TO_DATE}>
                Date-to-Date (Monthly on same date)
              </option>
              <option value={BILLING_CYCLE_TYPE.X_DAYS}>
                Every X Days
              </option>
            </select>
            <p className="text-xs text-foreground-secondary mt-1">
              {formData.cycle_type === "date_to_date"
                ? "Billing happens on the same date each month (e.g., 5th to 5th)"
                : "Billing happens every specified number of days"}
            </p>
          </FormField>

          {/* Conditional Fields based on Cycle Type */}
          {formData.cycle_type === "date_to_date" && (
            <FormField
              label="Billing Day of Month"
              required
              error={errors.billing_day_of_month}
              icon={<Hash size={20} />}
            >
              <input
                type="number"
                min="1"
                max="31"
                value={formData.billing_day_of_month}
                onChange={(e) => handleChange("billing_day_of_month", parseInt(e.target.value) || 1)}
                className="input-field"
                placeholder="e.g., 5 for 5th of each month"
              />
              <p className="text-xs text-foreground-secondary mt-1">
                Day of the month when billing cycle starts (1-31)
              </p>
            </FormField>
          )}

          {formData.cycle_type === "x_days" && (
            <FormField
              label="Cycle Days"
              required
              error={errors.cycle_days}
              icon={<Hash size={20} />}
            >
              <input
                type="number"
                min="1"
                value={formData.cycle_days}
                onChange={(e) => handleChange("cycle_days", parseInt(e.target.value) || 30)}
                className="input-field"
                placeholder="e.g., 30 for 30-day billing cycle"
              />
              <p className="text-xs text-foreground-secondary mt-1">
                Number of days between billing cycles
              </p>
            </FormField>
          )}

          {/* Default Currency */}
          <FormField
            label="Default Currency"
            required
            error={errors.default_currency}
            icon={<CurrencyDollar size={20} />}
          >
            <select
              value={formData.default_currency}
              onChange={(e) => handleChange("default_currency", e.target.value)}
              className="input-field"
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <p className="text-xs text-foreground-secondary mt-1">
              Default currency for invoices (can be changed per invoice)
            </p>
          </FormField>

          {/* Finance Team */}
          <FormField
            label="Finance Team (Optional)"
            error={errors.finance_team_id}
            icon={<Users size={20} />}
          >
            <select
              value={formData.finance_team_id || ""}
              onChange={(e) => handleChange("finance_team_id", e.target.value ? parseInt(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">Select a team...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-foreground-secondary mt-1">
              Team to be notified about invoice status changes
            </p>
          </FormField>

          {/* Billing Fields Selection */}
          <FormField
            label="Billing Fields"
            required
            error={errors.billing_field_keys}
          >
            <div className="space-y-2">
              <p className="text-sm text-foreground-secondary mb-3">
                Select which fields should be included in invoices. Only number and calculated fields can be billed.
              </p>
              
              {fieldKeys.length === 0 ? (
                <div className="p-4 bg-surface-secondary rounded-lg text-center text-foreground-secondary">
                  No billable fields available. Add number or calculated fields to process steps first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fieldKeys.map((fieldKey) => (
                    <label
                      key={fieldKey}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border-primary hover:border-primary-500 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.billing_field_keys.includes(fieldKey)}
                        onChange={() => handleFieldKeyToggle(fieldKey)}
                        className="form-checkbox h-4 w-4 text-primary-600 rounded border-border-primary focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-foreground-primary">
                        {fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {/* Active Toggle */}
          <FormField label="Status">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="form-checkbox h-5 w-5 text-primary-600 rounded border-border-primary focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-foreground-primary">
                Active (invoices can be generated)
              </span>
            </label>
          </FormField>
        </div>
      </BaseForm>
    </div>
  );
}
