import React from "react";

interface PersonalInfoFieldProps {
  id: string;
  name: string;
  label: string;
  type: "text" | "date" | "tel" | "textarea" | "select";
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  options?: string[];
  error?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<any>) => void;
}

const inputClass =
  "w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

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
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <label htmlFor={id} className="w-32 text-md font-semibold text-gray-800">
        {label}
      </label>
      {type === "select" ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          onBlur={onBlur}
        >
          <option value="" disabled>
            Select {label}
          </option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClass}
          rows={3}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          onBlur={onBlur}
        />
      ) : (
        <input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          onBlur={onBlur}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}; 