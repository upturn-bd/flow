import React from 'react';
import { Hash, Plus, Minus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface NumberFieldProps {
  name: string;
  label: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  icon?: React.ReactNode;
  className?: string;
  showIncrementButtons?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  disabled?: boolean;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  min,
  max,
  step = 1,
  icon,
  className = "",
  showIncrementButtons = false,
  onIncrement,
  onDecrement,
  disabled=false
}) => {
  const IconComponent = icon || <Hash size={18} weight="duotone" className="text-gray-500" />;

  return (
    <div className={className}>
      <label className="block font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {showIncrementButtons ? (
        <div className="flex items-center">
          <Button
            type="button"
            onClick={onDecrement}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-l-md p-2.5"
          >
            <Minus size={16} weight="bold" />
          </Button>
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            className="w-16 text-center p-2.5 border-t border-b border-gray-300 outline-none"
          />
          <Button
            type="button"
            onClick={onIncrement}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-r-md p-2.5"
          >
            <Plus size={16} weight="bold" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {IconComponent}
          </div>
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
          />
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default NumberField;
