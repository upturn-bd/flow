import React from "react";
import { motion } from "framer-motion";

interface PersonalInfoFieldProps {
  id?: string;
  name: string;
  label: string;
  type: "text" | "date" | "tel" | "textarea" | "select";
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  options?: string[] | Array<{value: string; label: string}>;
  error?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<any>) => void;
  touched?: boolean;
}

const inputClass =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export const PersonalInfoField: React.FC<PersonalInfoFieldProps> = ({
  id,
  name,
  label,
  type,
  value,
  onChange,
  options,
  error,
  disabled,
  onBlur,
  touched,
}) => {
  const fieldId = id || `field-${name}`;
  const showError = error && touched;

  const inputClasses = `
    w-full rounded-md border 
    ${
      showError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    }
    px-3 py-2 text-sm
    shadow-sm focus:outline-none focus:ring-1
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-colors
    placeholder:text-gray-400
    max-w-full
  `;

  if (type === "select") {
    return (
      <div className="mb-0">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
        >
          <option value="">Select {label || name}</option>
          {Array.isArray(options) && options.map((opt) => {
            if (typeof opt === 'string') {
              return (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              );
            } else {
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            }
          })}
        </select>
        {showError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${fieldId}-error`}
            className="mt-1 text-xs text-red-600"
            aria-live="polite"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  } 
  
  if (type === "textarea") {
    return (
      <div className="mb-0">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          rows={3}
          className={inputClasses}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
        />
        {showError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${fieldId}-error`}
            className="mt-1 text-xs text-red-600"
            aria-live="polite"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
  
  return (
    <div className="mb-0">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={inputClasses}
        aria-invalid={showError ? "true" : "false"}
        aria-describedby={showError ? `${fieldId}-error` : undefined}
        max={type === "date" ? "9999-12-31" : undefined}
      />
      {showError && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          id={`${fieldId}-error`}
          className="mt-1 text-xs text-red-600"
          aria-live="polite"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}; 