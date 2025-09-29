"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "elevated";
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "error" | "info" | "pending";
  size?: "sm" | "md";
}

interface PriorityBadgeProps {
  priority: "urgent" | "high" | "normal" | "low";
  size?: "sm" | "md";
}

const paddingClasses = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const variantClasses = {
  default: "bg-white border border-gray-200",
  outlined: "bg-white border-2 border-gray-300",
  elevated: "bg-white border border-gray-200 shadow-lg",
};

export function Card({
  children,
  className = "",
  hover = true,
  padding = "md",
  variant = "default"
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 1, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        rounded-lg
        transition-all duration-200
        ${hover ? "hover:shadow-md hover:border-gray-300" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, icon, action, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className="flex-shrink-0 text-gray-600">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ status, variant, size = "sm" }: StatusBadgeProps) {
  const getVariantClasses = (status: string, variant?: string) => {
    if (variant) {
      const variantMap = {
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        error: "bg-red-100 text-red-800 border-red-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
        pending: "bg-gray-100 text-gray-800 border-gray-200",
      };
      return variantMap[variant as keyof typeof variantMap] || variantMap.info;
    }

    // Auto-detect based on status text
    const statusLower = status.toLowerCase();
    if (statusLower.includes("completed") || statusLower.includes("approved") || statusLower.includes("success")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (statusLower.includes("pending") || statusLower.includes("draft")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (statusLower.includes("rejected") || statusLower.includes("failed") || statusLower.includes("error") || statusLower.includes("not started")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (statusLower.includes("in progress") || statusLower.includes("ongoing")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
  };

  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${getVariantClasses(status, variant)}
      ${sizeClasses[size]}
    `}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  const priorityClasses = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-yellow-100 text-yellow-800 border-yellow-200",
    normal: "bg-green-100 text-green-800 border-green-200",
    low: "bg-green-100 text-green-800 border-green-200",

  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
  };

  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${priorityClasses[priority]}
      ${sizeClasses[size]}
    `}>
      {priority}
    </span>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  className = ""
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className="text-gray-500 flex-shrink-0">
        {icon}
      </div>
      <span className="font-medium text-gray-700 flex-shrink-0">
        {label}:
      </span>
      <span className="text-gray-900 truncate">
        {value}
      </span>
    </div>
  );
}
