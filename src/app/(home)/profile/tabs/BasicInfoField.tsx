import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { JOB_STATUS_OPTIONS } from "./basicInfo.constants";

interface Option {
  value: string;
  label: string;
}

interface BasicInfoFieldProps {
  id?: string;
  name: string;
  label: string;
  type: string;
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  touched?: boolean;
  departments?: Array<{ id: number; name: string }>;
  loadingDepartments?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  options?: Option[];
  loading?: boolean;
  onBlur?: (e: React.FocusEvent<any>) => void;
}

const inputClass =
  "w-full rounded-md border border-border-primary bg-background-primary px-3 py-2 text-sm text-foreground-primary placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

export const BasicInfoField: React.FC<BasicInfoFieldProps> = ({
  id,
  name,
  label,
  type,
  value,
  onChange,
  error,
  touched,
  departments = [],
  loadingDepartments = false,
  readOnly = false,
  disabled = false,
  options = [],
  loading = false,
  onBlur,
}) => {
  const fieldId = id || `field-${name}`;
  const showError = error && touched;
  
  const inputClasses = `
    w-full rounded-md border 
    ${
      error && touched
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-border-secondary focus:border-primary-500 focus:ring-primary-500"
    }
    px-3 py-2 text-sm
    shadow-sm focus:outline-none focus:ring-1
    disabled:bg-background-secondary disabled:cursor-not-allowed
    transition-colors
    placeholder:text-foreground-tertiary
    max-w-full
  `;

  const renderField = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner className="h-5 w-5 text-blue-500" />
          <span className="ml-2 text-sm text-foreground-tertiary">Loading...</span>
        </div>
      );
    }

    if (name === "job_status") {
      return (
        <div>
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            className={inputClass}
            aria-invalid={!!showError}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            onBlur={onBlur}
            disabled={disabled}
          >
            <option value="">Select Job Status</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {showError && <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
        </div>
      );
    }
    if (name === "department_id") {
      return (
        <div>
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            className={inputClass}
            aria-invalid={!!showError}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            disabled={loading || loadingDepartments || disabled}
            onBlur={onBlur}
          >
            <option value="">{loading || loadingDepartments ? "Loading..." : "Select Department"}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {showError && <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
        </div>
      );
    }
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
            className={inputClass}
            aria-invalid={showError ? "true" : "false"}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            onBlur={onBlur}
            disabled={disabled}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
    if (name === "id_input") {
      return (
        <div>
          <input
            id={fieldId}
            type={type}
            name={name}
            value={value}
            readOnly
            className={inputClass}
            aria-invalid={!!showError}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            onBlur={onBlur}
            disabled={disabled}
          />
          {showError && <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
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
            className={inputClass}
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
          <label htmlFor={fieldId} className="block text-sm font-medium text-foreground-secondary mb-1">
            {label}
          </label>
        )}
        <input
          id={fieldId}
          type={type === "date" ? "date" : type}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={inputClass}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          onBlur={onBlur}
          disabled={disabled}
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

  return (
    <div className="mb-0">
      {renderField()}
    </div>
  );
}; 