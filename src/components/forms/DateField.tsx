import React from 'react';
import { Calendar } from "@phosphor-icons/react";

interface DateFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  description?: string;
  readOnly?: boolean;
  disabled?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  min,
  max,
  className = "",
  description,
  readOnly = false,
  disabled = false,
}) => {
  return (
    <div className={className}>
      <label className="block font-medium text-foreground-primary mb-1">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-foreground-tertiary mb-2">{description}</p>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar size={18} weight="duotone" className="text-foreground-tertiary" />
        </div>
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={`w-full pl-10 rounded-lg bg-surface-primary text-foreground-primary p-2.5 border border-border-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${error ? 'border-error focus:ring-error' : ''} ${readOnly || disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
};

export default DateField;
