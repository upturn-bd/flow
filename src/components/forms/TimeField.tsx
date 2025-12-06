import React from 'react';
import { Clock } from "@phosphor-icons/react";

interface TimeFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const TimeField: React.FC<TimeFieldProps> = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  icon,
  className = "",
}) => {
  const IconComponent = icon || <Clock size={18} weight="duotone" className="text-foreground-tertiary" />;

  return (
    <div className={className}>
      <label className="block font-medium text-foreground-primary mb-1">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {IconComponent}
        </div>
        <input
          type="time"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-10 rounded-lg bg-surface-primary text-foreground-primary p-2.5 border border-border-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${error ? 'border-error focus:ring-error' : ''}`}
        />
      </div>
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
};

export default TimeField;
