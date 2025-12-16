"use client";

import { motion } from "framer-motion";
import { Gear, Calendar, CurrencyDollar, Clock, Pulse, Timer, ShieldCheck, Lock, Users, Info } from "@phosphor-icons/react";
import { staggerContainer } from "@/components/ui/animations";
import { ToggleField, DateField, NumberField } from "@/components/forms";
import { SectionHeader } from "@/components/ui";

interface CompanySettingsConfigViewProps {
  formValues: {
    live_absent_enabled: boolean;
    fiscal_year_start: string;
    max_device_limit?: number;
    max_users?: number;
  };
  onChange: (field: string, value: any) => void;
  errors: {
    live_absent_enabled?: string;
    payroll_generation_day?: string;
    fiscal_year_start?: string;
    live_payroll_enabled?: string;
    max_device_limit?: string;
  };
}

export default function CompanySettingsConfigView({
  formValues,
  onChange,
  errors
}: CompanySettingsConfigViewProps) {

  const handleToggleChange = (field: string) => (checked: boolean) => {
    onChange(field, checked);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.value;

    // Convert to appropriate type based on field
    if (field === 'payroll_generation_day' || field === 'max_device_limit') {
      const numValue = parseInt(value);
      value = isNaN(numValue) ? 1 : numValue; // Default to 1 if invalid
    }

    onChange(field, value);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Security Gear */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-surface-primary rounded-xl shadow-sm"
      >
        <SectionHeader
          title="Security Gear"
          icon={<ShieldCheck className="w-5 h-5" />}
        />

        <div className="p-3 sm:p-6">
          <NumberField
            name="max_device_limit"
            label="Max Device Limit"
            value={formValues.max_device_limit || 3}
            onChange={handleInputChange('max_device_limit')}
            error={errors.max_device_limit}
            min={1}
            max={10}
          />
          <p className="text-sm text-foreground-secondary mt-1">
            Maximum number of devices a user can be logged in from simultaneously
          </p>

          <div className="mt-6 pt-6 border-t border-border-secondary">
            <div className="flex items-center gap-2 mb-2">
              <label className="block font-medium text-foreground-primary text-sm sm:text-base">
                Max Users
              </label>
              <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs font-medium text-foreground-tertiary border border-border-secondary flex items-center gap-1">
                <Lock size={12} /> Locked
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-tertiary">
                <Users size={18} />
              </div>
              <input
                type="number"
                value={formValues.max_users || 50}
                disabled
                readOnly
                className="w-full pl-10 rounded-lg bg-surface-secondary p-2.5 border border-border-primary text-foreground-secondary cursor-not-allowed"
              />
            </div>
            <p className="text-sm text-foreground-tertiary mt-1.5 flex items-center gap-1.5">
              <Info size={14} />
              Contact support to increase this limit
            </p>
          </div>
        </div>
      </motion.div>

      {/* Operations Gear */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-surface-primary rounded-xl shadow-sm"
      >
        <SectionHeader
          title="Operations Gear"
          icon={<Pulse className="w-5 h-5" />}
        />

        <div className="p-3 sm:p-6">
          <ToggleField
            label="Live Absence Tracking"
            checked={formValues.live_absent_enabled}
            onChange={handleToggleChange('live_absent_enabled')}
            error={errors.live_absent_enabled}
            description="Enable real-time tracking of employee absences"
          />
        </div>
      </motion.div>

      {/* Time Gear */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-surface-primary rounded-xl shadow-sm"
      >
        <SectionHeader
          title="Time Gear"
          icon={<Timer className="w-5 h-5" />}
        />

        <div className="p-3 sm:p-6 space-y-4">
          <DateField
            name="fiscal_year_start"
            label="Fiscal Year Start"
            value={formValues.fiscal_year_start}
            onChange={handleInputChange('fiscal_year_start')}
            error={errors.fiscal_year_start}
            description="Select the start date of your fiscal year (month and day)"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
