import React from "react";
import { JOB_STATUS_OPTIONS } from "./basicInfo.constants";

interface BasicInfoFieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  departments?: Array<{ id: number; name: string }>;
  loadingDepartments?: boolean;
  readOnly?: boolean;
  onBlur?: (e: React.FocusEvent<any>) => void;
}

const inputClass =
  "w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

export const BasicInfoField: React.FC<BasicInfoFieldProps> = ({
  id,
  name,
  label,
  type,
  value,
  onChange,
  error,
  departments = [],
  loadingDepartments = false,
  readOnly = false,
  onBlur,
}) => {
  if (name === "job_status") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label htmlFor={id} className="w-32 text-md font-semibold text-gray-800">
          {label}
        </label>
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onBlur={onBlur}
        >
          <option value="">Select Job Status</option>
          {JOB_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
      </div>
    );
  }
  if (name === "department_id") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label htmlFor={id} className="w-32 text-md font-semibold text-gray-800">
          {label}
        </label>
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={loadingDepartments}
          onBlur={onBlur}
        >
          <option value="">{loadingDepartments ? "Loading..." : "Select Department"}</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
      </div>
    );
  }
  if (name === "id_input") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label htmlFor={id} className="w-32 text-md font-semibold text-gray-800">
          {label}
        </label>
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          readOnly
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onBlur={onBlur}
        />
        {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <label htmlFor={id} className="w-32 text-md font-semibold text-gray-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={inputClass}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={onBlur}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600" aria-live="polite">{error}</p>}
    </div>
  );
}; 