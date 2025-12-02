"use client";

import { ReactNode, ComponentType, isValidElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "@/lib/icons";
import { InlineSpinner } from "../InlineSpinner";

type IconWeight = "regular" | "thin" | "light" | "bold" | "fill" | "duotone";

interface SuperadminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  icon: ComponentType<{ size?: number; className?: string; weight?: IconWeight }> | ReactNode;
  /** Color scheme for the modal header gradient and accents */
  colorScheme: "emerald" | "violet" | "blue" | "amber" | "red" | "indigo";
  /** Whether the form is currently saving */
  saving?: boolean;
  /** Whether the submit button should be disabled */
  submitDisabled?: boolean;
  /** Text for the submit button */
  submitText?: string;
  /** Whether this is editing an existing item */
  isEditing?: boolean;
  /** Modal size */
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const colorSchemes = {
  emerald: {
    gradient: "from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconText: "text-emerald-600 dark:text-emerald-400",
    button: "from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
    focus: "focus:ring-emerald-500",
  },
  violet: {
    gradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconText: "text-violet-600 dark:text-violet-400",
    button: "from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800",
    focus: "focus:ring-violet-500",
  },
  blue: {
    gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconText: "text-blue-600 dark:text-blue-400",
    button: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
    focus: "focus:ring-blue-500",
  },
  amber: {
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconText: "text-amber-600 dark:text-amber-400",
    button: "from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800",
    focus: "focus:ring-amber-500",
  },
  red: {
    gradient: "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    iconText: "text-red-600 dark:text-red-400",
    button: "from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
    focus: "focus:ring-red-500",
  },
  indigo: {
    gradient: "from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    iconText: "text-indigo-600 dark:text-indigo-400",
    button: "from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800",
    focus: "focus:ring-indigo-500",
  },
};

// Helper to render icon - handles both ComponentType and ReactNode
function renderIcon(
  icon: ComponentType<{ size?: number; className?: string; weight?: IconWeight }> | ReactNode,
  className: string
): ReactNode {
  if (isValidElement(icon)) {
    return icon;
  }
  
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
    const IconComponent = icon as ComponentType<{ size?: number; className?: string; weight?: IconWeight }>;
    return <IconComponent size={24} className={className} weight="duotone" />;
  }
  
  return icon;
}

export default function SuperadminFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon,
  colorScheme,
  saving = false,
  submitDisabled = false,
  submitText,
  isEditing = false,
  size = "md",
  children,
}: SuperadminFormModalProps) {
  const colors = colorSchemes[colorScheme];
  const defaultSubmitText = isEditing ? "Update" : "Create";
  const sizeClass = sizeClasses[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-surface-primary rounded-2xl shadow-2xl ${sizeClass} w-full max-h-[90vh] overflow-hidden flex flex-col`}
          >
            {/* Header */}
            <div className={`p-6 border-b border-border-primary bg-linear-to-r ${colors.gradient}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${colors.iconBg} rounded-xl`}>
                    {renderIcon(icon, colors.iconText)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground-primary">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-sm text-foreground-tertiary">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-primary/50 rounded-lg transition-colors"
                >
                  <X size={20} className="text-foreground-secondary" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {children}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-border-secondary rounded-xl hover:bg-surface-hover transition-colors text-foreground-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || submitDisabled}
                  className={`px-6 py-2.5 bg-linear-to-r ${colors.button} text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2`}
                >
                  {saving ? (
                    <>
                      <InlineSpinner size="sm" color="white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {submitText || defaultSubmitText}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
