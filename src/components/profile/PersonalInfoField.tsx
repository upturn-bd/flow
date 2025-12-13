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

const inputClasses = (showError: boolean) => `
  w-full rounded-md border 
  ${
    showError
      ? "border-error focus:border-error focus:ring-error"
      : "border-border-secondary focus:border-primary-500 focus:ring-primary-500"
  }
  px-3 py-2 text-sm
  shadow-sm focus:outline-none focus:ring-1
  disabled:bg-background-secondary disabled:cursor-not-allowed
  transition-colors
  placeholder:text-foreground-tertiary
  max-w-full
`;

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
  const showError = !!(error && touched);

  if (type === "select") {
    return (
      <div className="mb-0">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-foreground-secondary mb-1">
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
          className={inputClasses(showError)}
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
            className="mt-1 text-xs text-error"
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
          <label htmlFor={fieldId} className="block text-sm font-medium text-foreground-secondary mb-1">
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
          className={inputClasses(showError)}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
        />
        {showError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${fieldId}-error`}
            className="mt-1 text-xs text-error"
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
        <label htmlFor={fieldId} className="block text-sm font-medium text-foreground-secondary mb-1">
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
        className={inputClasses(showError)}
        aria-invalid={showError ? "true" : "false"}
        aria-describedby={showError ? `${fieldId}-error` : undefined}
        max={type === "date" ? "9999-12-31" : undefined}
      />
      {showError && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          id={`${fieldId}-error`}
          className="mt-1 text-xs text-error"
          aria-live="polite"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
