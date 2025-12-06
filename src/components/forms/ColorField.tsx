import { Palette } from "@phosphor-icons/react";
import { forwardRef, useState, useRef, useEffect } from "react";

export interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  presetColors?: string[];
  showPresets?: boolean;
  allowCustom?: boolean;
}

const DEFAULT_PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE',
  '#AED6F1', '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB'
];

export const ColorField = forwardRef<HTMLInputElement, ColorFieldProps>(
  ({ 
    value = "#000000",
    onChange,
    label,
    error,
    className = "",
    disabled = false,
    presetColors = DEFAULT_PRESET_COLORS,
    showPresets = true,
    allowCustom = true,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customColor, setCustomColor] = useState(value);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleColorSelect = (color: string) => {
      onChange(color);
      setCustomColor(color);
      setIsOpen(false);
    };

    const handleCustomColorChange = (color: string) => {
      setCustomColor(color);
      onChange(color);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync custom color with value prop
    useEffect(() => {
      setCustomColor(value);
    }, [value]);

    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            {label}
          </label>
        )}
        
        <div ref={dropdownRef} className="relative">
          {/* Color display button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              w-full h-10 border border-border-secondary rounded-lg
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-background-secondary disabled:cursor-not-allowed
              flex items-center gap-3 px-3
              ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-border-primary'}
            `}
          >
            <div 
              className="w-6 h-6 rounded border border-border-secondary shrink-0"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 text-left text-sm text-foreground-primary dark:text-foreground-primary">
              {value.toUpperCase()}
            </span>
            <Palette className="h-4 w-4 text-foreground-tertiary dark:text-foreground-tertiary" />
          </button>

          {/* Color picker dropdown */}
          {isOpen && !disabled && (
            <div className="absolute z-10 w-full mt-1 bg-surface-primary dark:bg-surface-primary border border-border-primary dark:border-border-primary rounded-lg shadow-lg p-4">
              {allowCustom && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground-secondary dark:text-foreground-secondary mb-2">
                    Custom Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={ref}
                      type="color"
                      value={customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-12 h-8 border border-border-primary dark:border-border-primary rounded cursor-pointer"
                      {...props}
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-border-primary dark:border-border-primary rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary dark:bg-surface-primary text-foreground-primary dark:text-foreground-primary"
                      placeholder="#000000"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              )}

              {showPresets && presetColors.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-2">
                    Preset Colors
                  </label>
                  <div className="grid grid-cols-10 gap-1">
                    {presetColors.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`
                          w-6 h-6 rounded border-2 transition-all
                          hover:scale-110 focus:scale-110 focus:outline-none
                          ${value === color ? 'border-foreground-primary ring-2 ring-primary-500' : 'border-border-secondary hover:border-border-primary'}
                        `}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

ColorField.displayName = "ColorField";
