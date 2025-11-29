"use client";

interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = "",
}: ToggleProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${checked ? "bg-primary-600" : "bg-background-tertiary"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={id}
              className="block text-sm font-medium text-foreground-primary cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-foreground-secondary mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
