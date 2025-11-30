import { ReactNode } from "react";
import { motion } from "framer-motion";
import { pageTransition } from "../animations";

export interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "sm" | "md" | "lg" | "xl" | "none";
  animate?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full"
};

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
  none: ""
};

export function PageLayout({ 
  children,
  title,
  subtitle,
  action,
  breadcrumbs,
  className = "",
  maxWidth = "2xl",
  padding = "lg",
  animate = true
}: PageLayoutProps) {
  const content = (
    <div className={`
      min-h-screen bg-background-secondary dark:bg-background-primary
      ${className}
    `}>
      <div className={`
        mx-auto
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
      `}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-foreground-tertiary">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-foreground-secondary transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-foreground-primary font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Header */}
        {(title || subtitle || action) && (
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-3xl font-bold text-foreground-primary mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-lg text-foreground-secondary">
                    {subtitle}
                  </p>
                )}
              </div>
              {action && (
                <div className="ml-6 flex-shrink-0">
                  {action}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageTransition}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
