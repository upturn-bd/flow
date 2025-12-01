"use client";

import { motion } from "framer-motion";
import { ComponentType, ReactNode, isValidElement } from "react";
import { TrendUp, TrendDown } from "@/lib/icons";
import { cn } from "./class";

export type StatCardColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "cyan"
  | "indigo"
  | "pink"
  | "teal"
  | "yellow"
  | "amber"
  | "gray";

// Match Phosphor's IconWeight type for better compatibility
type IconWeight = "regular" | "thin" | "light" | "bold" | "fill" | "duotone";

// Icon component props type
type IconComponentProps = {
  size?: number;
  weight?: IconWeight;
  className?: string;
};

interface StatCardProps {
  /** Icon component or rendered icon element */
  icon: ComponentType<IconComponentProps> | ReactNode;
  /** Main statistic value to display */
  value: string | number;
  /** Title for the stat (alternative to label) */
  title?: string;
  /** Label describing the stat (can use title instead) */
  label?: string;
  /** Color theme for the card */
  color?: StatCardColor;
  /** Custom icon color class (e.g., "text-blue-600") - overrides color theme */
  iconColor?: string;
  /** Custom icon background class (e.g., "bg-blue-100") - overrides color theme */
  iconBgColor?: string;
  /** Trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  /** Click handler (makes card interactive) */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Card size variant */
  size?: "sm" | "md" | "lg";
  /** Loading state */
  loading?: boolean;
}

const colorClasses: Record<
  StatCardColor,
  { bg: string; text: string; icon: string }
> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
    icon: "text-green-600 dark:text-green-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
    icon: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-400",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400",
  },
  cyan: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-600 dark:text-cyan-400",
    icon: "text-cyan-600 dark:text-cyan-400",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-600 dark:text-pink-400",
    icon: "text-pink-600 dark:text-pink-400",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    icon: "text-teal-600 dark:text-teal-400",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-600 dark:text-yellow-400",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
  },
  gray: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-600 dark:text-gray-400",
    icon: "text-gray-600 dark:text-gray-400",
  },
};

const sizeClasses = {
  sm: {
    padding: "p-3",
    iconContainer: "p-2",
    iconSize: 18,
    valueText: "text-lg",
    labelText: "text-xs",
    trendText: "text-xs",
  },
  md: {
    padding: "p-4",
    iconContainer: "p-3",
    iconSize: 24,
    valueText: "text-2xl",
    labelText: "text-sm",
    trendText: "text-sm",
  },
  lg: {
    padding: "p-6",
    iconContainer: "p-4",
    iconSize: 28,
    valueText: "text-3xl",
    labelText: "text-base",
    trendText: "text-base",
  },
};

// Helper to render icon - handles both ComponentType and ReactNode
function renderIcon(
  icon: ComponentType<IconComponentProps> | ReactNode,
  iconSize: number,
  iconColorClass: string
): ReactNode {
  // Check if it's a valid React element (already rendered)
  if (isValidElement(icon)) {
    return icon;
  }

  // Check if it's a component (function or ForwardRef)
  // ForwardRef components have $$typeof Symbol but are still callable
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
    const IconComponent = icon as ComponentType<IconComponentProps>;
    return <IconComponent size={iconSize} weight="duotone" className={iconColorClass} />;
  }

  // It's already a ReactNode (string, number, etc.)
  return icon;
}

export function StatCard({
  icon,
  value,
  title,
  label,
  color = "blue",
  iconColor,
  iconBgColor,
  trend,
  onClick,
  className = "",
  size = "md",
  loading = false,
}: StatCardProps) {
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  // Use custom colors if provided, otherwise use theme colors
  const finalIconBg = iconBgColor || colors.bg;
  const finalIconColor = iconColor || colors.icon;

  const CardWrapper = onClick ? motion.button : motion.div;

  const content = (
    <>
      {/* Icon */}
      <div className={cn("rounded-xl", finalIconBg, sizes.iconContainer)}>
        {loading ? (
          <div
            className={cn(
              "animate-pulse rounded-full bg-current opacity-20",
              `w-[${sizes.iconSize}px] h-[${sizes.iconSize}px]`
            )}
          />
        ) : (
          renderIcon(icon, sizes.iconSize, finalIconColor)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {loading ? (
            <div className="h-7 w-16 animate-pulse rounded bg-surface-secondary" />
          ) : (
            <span
              className={cn(
                "font-bold text-foreground-primary tracking-tight",
                sizes.valueText
              )}
            >
              {value}
            </span>
          )}
          {trend && !loading && (
            <span
              className={cn(
                "flex items-center gap-0.5 font-medium",
                sizes.trendText,
                trend.isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {trend.isPositive ? (
                <TrendUp size={14} weight="bold" />
              ) : (
                <TrendDown size={14} weight="bold" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        {loading ? (
          <div className="mt-1 h-4 w-24 animate-pulse rounded bg-surface-secondary" />
        ) : (
          <p className={cn("text-foreground-secondary truncate", sizes.labelText)}>
            {title || label}
          </p>
        )}
        {trend?.label && !loading && (
          <p className={cn("text-foreground-tertiary mt-0.5", "text-xs")}>
            {trend.label}
          </p>
        )}
      </div>
    </>
  );

  return (
    <CardWrapper
      className={cn(
        "flex items-center gap-4 rounded-xl bg-surface-primary border border-border-primary",
        "transition-all duration-200",
        sizes.padding,
        onClick && [
          "cursor-pointer",
          "hover:bg-surface-hover hover:border-primary-300 dark:hover:border-primary-600",
          "hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "active:scale-[0.98]",
        ],
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </CardWrapper>
  );
}

// Compact variant for dashboards with many stats
export function CompactStatCard({
  icon,
  value,
  label,
  color = "blue",
  iconColor,
  iconBgColor,
  onClick,
  className = "",
}: Omit<StatCardProps, "trend" | "size" | "loading" | "title">) {
  const colors = colorClasses[color];
  const finalIconBg = iconBgColor || colors.bg;
  const finalIconColor = iconColor || colors.icon;

  const CardWrapper = onClick ? motion.button : motion.div;

  return (
    <CardWrapper
      className={cn(
        "flex items-center gap-3 rounded-lg bg-surface-primary border border-border-primary p-3",
        "transition-all duration-200",
        onClick && [
          "cursor-pointer",
          "hover:bg-surface-hover hover:border-primary-300 dark:hover:border-primary-600",
          "focus:outline-none focus:ring-2 focus:ring-primary-500",
        ],
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className={cn("rounded-lg p-2", finalIconBg)}>
        {renderIcon(icon, 18, finalIconColor)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground-primary">{value}</p>
        <p className="text-xs text-foreground-secondary truncate">{label}</p>
      </div>
    </CardWrapper>
  );
}

// Grid layout component for StatCards
interface StatCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({ children, columns = 4, className = "" }: StatCardGridProps) {
  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {children}
    </div>
  );
}

// Export types
export type { StatCardProps, StatCardGridProps };
