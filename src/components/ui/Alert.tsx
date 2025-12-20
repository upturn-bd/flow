"use client";

import { ReactNode, ComponentType, isValidElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Warning, CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

type IconWeight = "regular" | "thin" | "light" | "bold" | "fill" | "duotone";

export interface AlertProps {
  /** Variant determines the color scheme */
  variant?: "info" | "success" | "warning" | "error";
  /** Optional title displayed in bold */
  title?: string;
  /** Main message content */
  children: ReactNode;
  /** Optional custom icon - defaults to variant-appropriate icon */
  icon?: ComponentType<{ size?: number; weight?: IconWeight; className?: string }> | ReactNode;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the alert */
  animate?: boolean;
}

const variantStyles = {
  info: {
    container: "bg-info/10 dark:bg-info/20 border-info/30 text-foreground-primary",
    icon: "text-info",
    DefaultIcon: Info,
  },
  success: {
    container: "bg-success/10 dark:bg-success/20 border-success/30 text-foreground-primary",
    icon: "text-success",
    DefaultIcon: CheckCircle,
  },
  warning: {
    container: "bg-warning/10 dark:bg-warning/20 border-warning/30 text-foreground-primary",
    icon: "text-warning",
    DefaultIcon: Warning,
  },
  error: {
    container: "bg-error/10 dark:bg-error/20 border-error/30 text-error",
    icon: "text-error",
    DefaultIcon: WarningCircle,
  },
};

function renderIcon(
  icon: ComponentType<{ size?: number; weight?: IconWeight; className?: string }> | ReactNode,
  className?: string
): ReactNode {
  if (!icon) return null;

  if (isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
    const IconComponent = icon as ComponentType<{ size?: number; weight?: IconWeight; className?: string }>;
    return <IconComponent size={20} weight="fill" className={className} />;
  }

  return icon;
}

export function Alert({
  variant = "info",
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  className = "",
  animate = true,
}: AlertProps) {
  const styles = variantStyles[variant];
  const IconToRender = icon || styles.DefaultIcon;

  const content = (
    <div
      className={`
        border rounded-lg p-4 flex items-start gap-3
        ${styles.container}
        ${className}
      `}
    >
      <div className={`shrink-0 mt-0.5 ${styles.icon}`}>
        {renderIcon(IconToRender, styles.icon)}
      </div>
      <div className="flex-1 text-sm">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className={title ? "text-foreground-secondary" : ""}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </motion.div>
  );
}

export default Alert;
