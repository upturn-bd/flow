import React from "react";

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

  if (type === "select") {
    return (
      <div>
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
          className={inputClass}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          disabled={disabled}
          onBlur={onBlur}
        >
          <option value="" disabled>
            Select {label || name}
          </option>
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
          <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  } 
  
  if (type === "textarea") {
    return (
      <div>
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
          className={inputClass}
          rows={3}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          disabled={disabled}
          onBlur={onBlur}
        />
        {showError && (
          <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        className={inputClass}
        aria-invalid={!!showError}
        aria-describedby={showError ? `${fieldId}-error` : undefined}
        disabled={disabled}
        onBlur={onBlur}
      />
      {showError && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}; 