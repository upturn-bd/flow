"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, WarningCircle, FileText, CircleNotch, Circle } from "@phosphor-icons/react";

interface StatusIndicatorProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = "md", 
  showIcon = true, 
  animate = true,
  className = "" 
}: StatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes("completed") || statusLower.includes("approved") || statusLower.includes("success")) {
      return {
        icon: CheckCircle,
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200",
        dotColor: "bg-green-500"
      };
    }
    
    if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return {
        icon: Clock,
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
        dotColor: "bg-yellow-500"
      };
    }
    
    if (statusLower.includes("rejected") || statusLower.includes("failed") || statusLower.includes("error")) {
      return {
        icon: XCircle,
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
        dotColor: "bg-red-500"
      };
    }
    
    if (statusLower.includes("in progress") || statusLower.includes("ongoing") || statusLower.includes("processing")) {
      return {
        icon: CircleNotch,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
        dotColor: "bg-blue-500"
      };
    }
    
    if (statusLower.includes("draft")) {
      return {
        icon: FileText,
        bgColor: "bg-background-tertiary dark:bg-surface-secondary",
        textColor: "text-foreground-secondary",
        borderColor: "border-border-primary",
        dotColor: "bg-foreground-tertiary"
      };
    }
    
    if (statusLower.includes("review")) {
      return {
        icon: WarningCircle,
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        textColor: "text-orange-800 dark:text-orange-300",
        borderColor: "border-orange-200 dark:border-orange-800",
        dotColor: "bg-orange-500"
      };
    }
    
    // Default case
    return {
      icon: Circle,
      bgColor: "bg-background-tertiary dark:bg-surface-secondary",
      textColor: "text-foreground-secondary",
      borderColor: "border-border-primary",
      dotColor: "bg-foreground-tertiary"
    };
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: {
      text: "text-xs px-2 py-1",
      icon: "w-3 h-3",
      dot: "w-2 h-2"
    },
    md: {
      text: "text-sm px-3 py-1.5",
      icon: "w-4 h-4",
      dot: "w-3 h-3"
    },
    lg: {
      text: "text-base px-4 py-2",
      icon: "w-5 h-5",
      dot: "w-4 h-4"
    }
  };

  const Component = animate ? motion.span : "span";
  const iconProps = animate && Icon === CircleNotch ? {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity }
  } : {};

  return (
    <Component
      {...(animate ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.2 }
      } : {})}
      className={`
        inline-flex items-center gap-2 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size].text}
        ${className}
      `}
    >
      {showIcon && (
        <motion.div {...iconProps}>
          <Icon className={sizeClasses[size].icon} />
        </motion.div>
      )}
      {status}
    </Component>
  );
}

interface StatusDotProps {
  status: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export function StatusDot({ 
  status, 
  size = "md", 
  animate = true,
  className = "" 
}: StatusDotProps) {
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes("completed") || statusLower.includes("approved") || statusLower.includes("success")) {
      return "bg-green-500";
    }
    if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return "bg-yellow-500";
    }
    if (statusLower.includes("rejected") || statusLower.includes("failed") || statusLower.includes("error")) {
      return "bg-red-500";
    }
    if (statusLower.includes("in progress") || statusLower.includes("ongoing") || statusLower.includes("processing")) {
      return "bg-blue-500";
    }
    if (statusLower.includes("draft")) {
      return "bg-gray-500";
    }
    if (statusLower.includes("review")) {
      return "bg-orange-500";
    }
    return "bg-gray-500";
  };

  const bgColor = getStatusConfig(status);
  
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const Component = animate ? motion.div : "div";

  return (
    <Component
      {...(animate ? {
        initial: { scale: 0 },
        animate: { scale: 1 },
        transition: { duration: 0.2, type: "spring", stiffness: 500 }
      } : {})}
      className={`
        rounded-full shrink-0
        ${bgColor}
        ${sizeClasses[size]}
        ${className}
      `}
    />
  );
}
