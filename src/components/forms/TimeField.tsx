import React from 'react';
import { Clock } from '@/lib/icons';

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
  const IconComponent = icon || <Clock size={18} weight="duotone" className="text-foreground-secondary dark:text-foreground-secondary" />;

  return (
    <div className={className}>
      <label className="block font-semibold text-foreground-primary dark:text-foreground-primary mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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
          className="w-full pl-10 rounded-md bg-background-secondary dark:bg-background-secondary p-2.5 border border-border-primary dark:border-border-primary focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all text-foreground-primary dark:text-foreground-primary"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default TimeField;
