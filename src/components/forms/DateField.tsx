import React from 'react';
import { Calendar } from '@/lib/icons';

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
}) => {
  return (
    <div className={className}>
      <label className="block font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar size={18} weight="duotone" className="text-gray-500" />
        </div>
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-full pl-10 rounded-md bg-background-secondary p-2.5 border border-border-secondary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default DateField;
