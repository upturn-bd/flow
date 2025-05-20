import React from "react";
import { JOB_STATUS_OPTIONS } from "./basicInfo.constants";

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
  options?: Array<{ value: string; label: string }>;
  loading?: boolean;
  onBlur?: (e: React.FocusEvent<any>) => void;
}

const inputClass =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

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
      <div>
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClass}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          disabled={disabled}
          onBlur={onBlur}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {showError && <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
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
  return (
    <div>
      <input
        id={fieldId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={inputClass}
        aria-invalid={!!showError}
        aria-describedby={showError ? `${fieldId}-error` : undefined}
        onBlur={onBlur}
        disabled={disabled}
      />
      {showError && <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
    </div>
  );
}; 