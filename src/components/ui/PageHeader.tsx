"use client";

import { ReactNode, ComponentType, isValidElement } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "./animations";
import { Button } from "./button";
import Link from "next/link";
import { CaretRight } from "@/lib/icons";

// Match Phosphor's IconWeight type for better compatibility
type IconWeight = "regular" | "thin" | "light" | "bold" | "fill" | "duotone";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderAction {
  label: string;
  icon?: ComponentType<{ size?: number; weight?: IconWeight; className?: string }> | ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
  color?: string; // For gradient backgrounds
}

export interface PageHeaderProps {
  icon?: ComponentType<{ size?: number; weight?: IconWeight; className?: string }> | ReactNode;
  iconColor?: string;
  title: string;
  description?: string;
  action?: PageHeaderAction;
  actions?: PageHeaderAction[];
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  children?: ReactNode;
  animate?: boolean;
}

// Helper to render icon that can be either a component or ReactNode
function renderIcon(
  icon: ComponentType<{ size?: number; weight?: IconWeight; className?: string }> | ReactNode,
  size: number = 28,
  className?: string
): ReactNode {
  if (!icon) return null;
  
  // Check if it's already a rendered React element
  if (isValidElement(icon)) {
    return icon;
  }
  
  // Check if it's a component (function or ForwardRef)
  // ForwardRef components have $$typeof Symbol but are still callable
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
    const IconComponent = icon as ComponentType<{ size?: number; weight?: IconWeight; className?: string }>;
    return <IconComponent size={size} weight="duotone" className={className} />;
  }
  
  // It's already a ReactNode (string, number, etc.)
  return icon;
}

export function PageHeader({
  icon,
  iconColor = "text-primary-600",
  title,
  description,
  action,
  actions = [],
  breadcrumbs,
  className = "",
  children,
  animate = true,
}: PageHeaderProps) {
  // Combine single action with actions array
  const allActions = action ? [action, ...actions] : actions;

  const renderAction = (act: PageHeaderAction, index: number) => {
    const actionIcon = act.icon ? renderIcon(act.icon, 20) : null;
    
    // Custom gradient button (when color is specified or variant is gradient)
    if (act.color || act.variant === "gradient") {
      const buttonElement = (
        <motion.button
          key={index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={act.onClick}
          className={`
            flex items-center gap-2 px-4 py-2
            ${act.color || "bg-primary-600 hover:bg-primary-700"}
            text-white rounded-lg shadow-sm
            transition-all font-medium
          `}
        >
          {actionIcon}
          {act.label}
        </motion.button>
      );

      if (act.href) {
        return (
          <Link key={index} href={act.href}>
            {buttonElement}
          </Link>
        );
      }

      return buttonElement;
    }

    // Regular Button component (gradient variant is handled above)
    const buttonElement = (
      <Button
        key={index}
        variant={act.variant as "primary" | "secondary" | "outline" | "ghost" | "danger" || "primary"}
        onClick={act.onClick}
        className="flex items-center gap-2"
      >
        {actionIcon}
        {act.label}
      </Button>
    );

    if (act.href) {
      return (
        <Link key={index} href={act.href}>
          {buttonElement}
        </Link>
      );
    }

    return buttonElement;
  };

  const content = (
    <div className={`${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4">
          <ol className="flex items-center flex-wrap gap-1 text-sm text-foreground-tertiary">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <CaretRight size={14} className="mx-1 text-foreground-tertiary" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground-secondary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground-primary font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground-primary flex items-center gap-2 sm:gap-3">
            {icon && (
              <span className={`shrink-0 ${iconColor}`}>
                {renderIcon(icon, 28)}
              </span>
            )}
            <span className="truncate">{title}</span>
          </h1>
          {description && (
            <p className="text-foreground-secondary mt-1 text-sm sm:text-base">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {allActions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {allActions.map((act, index) => renderAction(act, index))}
          </div>
        )}
      </div>

      {/* Optional children slot for custom content */}
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

export default PageHeader;
