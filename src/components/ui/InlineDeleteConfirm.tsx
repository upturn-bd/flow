"use client";

import { Check, X, TrashSimple } from "@phosphor-icons/react";

interface InlineDeleteConfirmProps {
  /** Whether this item is in delete confirmation mode */
  isConfirming: boolean;
  /** Callback when user confirms deletion */
  onConfirm: () => void;
  /** Callback when user cancels deletion */
  onCancel: () => void;
  /** Callback to initiate delete confirmation */
  onDelete: () => void;
  /** Whether the delete button is disabled */
  disabled?: boolean;
  /** Tooltip title when disabled */
  disabledTitle?: string;
  /** Tooltip title when enabled */
  title?: string;
  /** Icon size (default: 16) */
  size?: number;
  /** Color scheme for hover states */
  colorScheme?: "red" | "violet" | "blue" | "emerald" | "amber";
}

const colorSchemes = {
  red: {
    deleteHover: "hover:text-error hover:bg-error/10 dark:hover:bg-error/20",
  },
  violet: {
    deleteHover: "hover:text-error hover:bg-error/10 dark:hover:bg-error/20",
  },
  blue: {
    deleteHover: "hover:text-error hover:bg-error/10 dark:hover:bg-error/20",
  },
  emerald: {
    deleteHover: "hover:text-error hover:bg-error/10 dark:hover:bg-error/20",
  },
  amber: {
    deleteHover: "hover:text-error hover:bg-error/10 dark:hover:bg-error/20",
  },
};

export function InlineDeleteConfirm({
  isConfirming,
  onConfirm,
  onCancel,
  onDelete,
  disabled = false,
  disabledTitle,
  title = "Delete",
  size = 16,
  colorScheme = "red",
}: InlineDeleteConfirmProps) {
  const colors = colorSchemes[colorScheme];

  if (isConfirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onConfirm}
          className="p-1.5 text-white bg-error hover:bg-error/90 rounded-lg transition-colors"
          title="Confirm delete"
        >
          <Check size={size} />
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 text-foreground-tertiary hover:bg-surface-hover rounded-lg transition-colors"
          title="Cancel"
        >
          <X size={size} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onDelete}
      className={`p-1.5 text-foreground-tertiary ${colors.deleteHover} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground-tertiary`}
      disabled={disabled}
      title={disabled ? disabledTitle : title}
    >
      <TrashSimple size={size} />
    </button>
  );
}

export default InlineDeleteConfirm;
