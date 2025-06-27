import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cardHover, cardTap, fadeInUp } from "../animations";

export interface CardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "xl" | "none";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  border?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  hoverable?: boolean;
  clickable?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
  none: ""
};

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl"
};

const roundedClasses = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md", 
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full"
};

export function CardLayout({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = "",
  padding = "lg",
  shadow = "md",
  border = true,
  rounded = "lg",
  hoverable = false,
  clickable = false,
  animate = true,
  onClick,
  ...props
}: CardLayoutProps) {
  const cardClasses = `
    bg-white
    ${border ? "border border-gray-200" : ""}
    ${shadowClasses[shadow]}
    ${roundedClasses[rounded]}
    ${clickable ? "cursor-pointer" : ""}
    ${className}
  `;

  const motionProps = {
    ...(hoverable && cardHover),
    ...(clickable && cardTap),
    ...(onClick && { onClick })
  };

  const content = (
    <div className={cardClasses} {...props}>
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <div className={`
          border-b border-gray-200 pb-4 mb-4
          ${paddingClasses[padding]} 
          ${padding === "none" ? "pb-4 mb-4" : ""}
        `}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={padding !== "none" ? paddingClasses[padding] : ""}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`
          border-t border-gray-200 pt-4 mt-4
          ${paddingClasses[padding]}
          ${padding === "none" ? "pt-4 mt-4" : ""}
        `}>
          {footer}
        </div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        {...motionProps}
      >
        {content}
      </motion.div>
    );
  }

  if (hoverable || clickable || onClick) {
    return (
      <motion.div {...motionProps}>
        {content}
      </motion.div>
    );
  }

  return content;
}
