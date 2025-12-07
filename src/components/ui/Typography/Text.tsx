import { ReactNode, ElementType } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../animations";

export interface TextProps {
  children: ReactNode;
  variant?: "body1" | "body2" | "caption" | "overline" | "subtitle1" | "subtitle2";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "light" | "normal" | "medium" | "semibold" | "bold";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "muted" | "white";
  align?: "left" | "center" | "right" | "justify";
  className?: string;
  animate?: boolean;
  as?: ElementType;
  truncate?: boolean;
  italic?: boolean;
  underline?: boolean;
  lineThrough?: boolean;
}

const variantClasses = {
  body1: "text-base font-normal leading-relaxed",
  body2: "text-sm font-normal leading-normal",
  caption: "text-xs font-normal leading-tight text-foreground-tertiary",
  overline: "text-xs font-semibold uppercase tracking-wide text-foreground-tertiary",
  subtitle1: "text-lg font-medium leading-normal",
  subtitle2: "text-base font-medium leading-normal"
};

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base", 
  lg: "text-lg",
  xl: "text-xl"
};

const weightClasses = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold", 
  bold: "font-bold"
};

const colorClasses = {
  primary: "text-foreground-primary",
  secondary: "text-foreground-secondary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  muted: "text-foreground-tertiary",
  white: "text-white"
};

const alignClasses = {
  left: "text-left",
  center: "text-center", 
  right: "text-right",
  justify: "text-justify"
};

export function Text({
  children,
  variant = "body1",
  size,
  weight,
  color = "primary",
  align = "left",
  className = "",
  animate = false,
  as = "p",
  truncate = false,
  italic = false,
  underline = false,
  lineThrough = false,
  ...props
}: TextProps) {
  const Component = as;

  // Use variant classes or individual size/weight props
  const useVariant = !size && !weight;
  
  const textClasses = `
    ${useVariant ? variantClasses[variant] : ""}
    ${!useVariant && size ? sizeClasses[size] : ""}
    ${!useVariant && weight ? weightClasses[weight] : ""}
    ${colorClasses[color]}
    ${alignClasses[align]}
    ${truncate ? "truncate" : ""}
    ${italic ? "italic" : ""}
    ${underline ? "underline" : ""}
    ${lineThrough ? "line-through" : ""}
    ${className}
  `;

  const content = (
    <Component className={textClasses} {...props}>
      {children}
    </Component>
  );

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Convenience components for common text variants
export function Body1(props: Omit<TextProps, "variant">) {
  return <Text variant="body1" {...props} />;
}

export function Body2(props: Omit<TextProps, "variant">) {
  return <Text variant="body2" {...props} />;
}

export function Caption(props: Omit<TextProps, "variant">) {
  return <Text variant="caption" {...props} />;
}

export function Overline(props: Omit<TextProps, "variant">) {
  return <Text variant="overline" {...props} />;
}

export function Subtitle1(props: Omit<TextProps, "variant">) {
  return <Text variant="subtitle1" {...props} />;
}

export function Subtitle2(props: Omit<TextProps, "variant">) {
  return <Text variant="subtitle2" {...props} />;
}

// Specialized text components
export function Label({
  children,
  required = false,
  className = "",
  ...props
}: Omit<TextProps, "variant"> & { required?: boolean }) {
  return (
    <Text
      variant="caption"
      weight="medium"
      color="secondary"
      as="label"
      className={`block mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </Text>
  );
}

export function ErrorText({
  children,
  className = "",
  ...props
}: Omit<TextProps, "variant" | "color">) {
  return (
    <Text
      variant="caption"
      color="error"
      className={`mt-1 ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

export function HelperText({
  children,
  className = "",
  ...props
}: Omit<TextProps, "variant" | "color">) {
  return (
    <Text
      variant="caption"
      color="muted"
      className={`mt-1 ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Link({
  children,
  href,
  external = false,
  className = "",
  ...props
}: Omit<TextProps, "as"> & { 
  href: string; 
  external?: boolean;
}) {
  const linkProps = external 
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Text
      as="a"
      color="primary"
      className={`underline hover:no-underline transition-all ${className}`}
      {...props}
      {...linkProps}
      {...{ href }} // Pass href directly as a prop
    >
      {children}
    </Text>
  );
}
