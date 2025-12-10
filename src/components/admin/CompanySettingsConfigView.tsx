"use client";

import { motion } from "framer-motion";
import { Gear, Calendar, CurrencyDollar, Clock, Pulse, Timer, ShieldCheck } from "@phosphor-icons/react";
import { staggerContainer } from "@/components/ui/animations";
import { ToggleField, DateField, NumberField } from "@/components/forms";
import { SectionHeader } from "@/components/ui";

interface CompanySettingsConfigViewProps {
  formValues: {
    live_absent_enabled: boolean;
    fiscal_year_start: string;
    max_device_limit?: number;
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
