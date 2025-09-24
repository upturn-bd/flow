"use client";

import { motion } from "framer-motion";
import { Settings, Calendar, DollarSign, Clock, Activity, Timer } from "lucide-react";
import { staggerContainer } from "@/components/ui/animations";
import FormToggleField from "@/components/ui/FormToggleField";
import FormNumberField from "@/components/ui/FormNumberField";
import FormDateField from "@/components/ui/FormDateField";

interface CompanySettingsConfigViewProps {
  formValues: {
    live_absent_enabled: boolean;
    fiscal_year_start: string;
  };
  onChange: (field: string, value: any) => void;
  errors: {
    live_absent_enabled?: string;
    payroll_generation_day?: string;
    fiscal_year_start?: string;
    live_payroll_enabled?: string;
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
    if (field === 'payroll_generation_day') {
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
      {/* Operations Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl shadow-sm"
      >
        <div className="border-b border-gray-200 px-3 py-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-gray-600" />
            Operations Settings
          </h3>
        </div>
        
        <div className="p-3 sm:p-6">
          <FormToggleField
            name="live_absent_enabled"
            label="Live Absence Tracking"
            icon={<Clock size={18} />}
            checked={formValues.live_absent_enabled}
            onChange={handleToggleChange('live_absent_enabled')}
            error={errors.live_absent_enabled}
            description="Enable real-time tracking of employee absences"
          />
        </div>
      </motion.div>

      {/* Time Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm"
      >
        <div className="border-b border-gray-200 px-3 py-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <Timer className="w-5 h-5 mr-2 text-gray-600" />
            Time Settings
          </h3>
        </div>
        
        <div className="p-3 sm:p-6 space-y-4">
          <FormDateField
            name="fiscal_year_start"
            label="Fiscal Year Start"
            icon={<Calendar size={18} />}
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
