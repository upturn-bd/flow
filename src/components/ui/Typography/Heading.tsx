import { ReactNode, ElementType } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../animations";

export interface HeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  weight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "muted";
  align?: "left" | "center" | "right";
  className?: string;
  animate?: boolean;
  as?: ElementType;
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm", 
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl"
};

const weightClasses = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium", 
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold"
};

const colorClasses = {
  primary: "text-foreground-primary",
  secondary: "text-foreground-secondary",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400", 
  error: "text-red-600 dark:text-red-400",
  muted: "text-foreground-tertiary"
};

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

const defaultSizeByLevel = {
  1: "3xl" as const,
  2: "2xl" as const,
  3: "xl" as const,
  4: "lg" as const,
  5: "md" as const,
  6: "sm" as const
};

const defaultWeightByLevel = {
  1: "bold" as const,
  2: "bold" as const,
  3: "semibold" as const,
  4: "semibold" as const,
  5: "medium" as const,
  6: "medium" as const
};

export function Heading({
  children,
  level = 1,
  size,
  weight,
  color = "primary",
  align = "left",
  className = "",
  animate = false,
  as,
  ...props
}: HeadingProps) {
  const Component = as || `h${level}` as ElementType;
  const finalSize = size || defaultSizeByLevel[level];
  const finalWeight = weight || defaultWeightByLevel[level];

  const headingClasses = `
    ${sizeClasses[finalSize]}
    ${weightClasses[finalWeight]}
    ${colorClasses[color]}
    ${alignClasses[align]}
    ${className}
  `;

  const content = (
    <Component className={headingClasses} {...props}>
      {children}
    </Component>
  );

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Convenience components for common heading levels
export function H1(props: Omit<HeadingProps, "level">) {
  return <Heading level={1} {...props} />;
}

export function H2(props: Omit<HeadingProps, "level">) {
  return <Heading level={2} {...props} />;
}

export function H3(props: Omit<HeadingProps, "level">) {
  return <Heading level={3} {...props} />;
}

export function H4(props: Omit<HeadingProps, "level">) {
  return <Heading level={4} {...props} />;
}

export function H5(props: Omit<HeadingProps, "level">) {
  return <Heading level={5} {...props} />;
}

export function H6(props: Omit<HeadingProps, "level">) {
  return <Heading level={6} {...props} />;
}
