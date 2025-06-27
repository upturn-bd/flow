import { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerContainer, listItem } from "../animations";

export interface GridLayoutProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  };
  className?: string;
  animate?: boolean;
  stagger?: boolean;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3", 
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12"
};

const gapClasses = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6", 
  xl: "gap-8"
};

const responsiveClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4", 
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12"
};

export function GridLayout({
  children,
  columns = 3,
  gap = "md",
  responsive,
  className = "",
  animate = false,
  stagger = false
}: GridLayoutProps) {
  const gridClasses = `
    grid
    ${columnClasses[columns]}
    ${gapClasses[gap]}
    ${responsive?.sm ? `sm:${responsiveClasses[responsive.sm]}` : ""}
    ${responsive?.md ? `md:${responsiveClasses[responsive.md]}` : ""}
    ${responsive?.lg ? `lg:${responsiveClasses[responsive.lg]}` : ""}
    ${responsive?.xl ? `xl:${responsiveClasses[responsive.xl]}` : ""}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        className={gridClasses}
        initial="hidden"
        animate="visible"
        variants={stagger ? staggerContainer : undefined}
      >
        {Array.isArray(children) && stagger
          ? children.map((child, index) => (
              <motion.div key={index} variants={listItem}>
                {child}
              </motion.div>
            ))
          : children
        }
      </motion.div>
    );
  }

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Specialized grid layouts
export function AutoGrid({
  children,
  minItemWidth = "250px",
  gap = "md",
  className = "",
  animate = false,
  stagger = false
}: {
  children: ReactNode;
  minItemWidth?: string;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
  stagger?: boolean;
}) {
  const gridClasses = `
    grid
    ${gapClasses[gap]}
    ${className}
  `;

  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`
  };

  if (animate) {
    return (
      <motion.div
        className={gridClasses}
        style={gridStyle}
        initial="hidden"
        animate="visible"
        variants={stagger ? staggerContainer : undefined}
      >
        {Array.isArray(children) && stagger
          ? children.map((child, index) => (
              <motion.div key={index} variants={listItem}>
                {child}
              </motion.div>
            ))
          : children
        }
      </motion.div>
    );
  }

  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
}

export function MasonryGrid({
  children,
  columns = 3,
  gap = "md",
  responsive,
  className = ""
}: Omit<GridLayoutProps, "animate" | "stagger">) {
  const columnClasses = {
    1: "columns-1",
    2: "columns-2", 
    3: "columns-3",
    4: "columns-4",
    5: "columns-5",
    6: "columns-6",
    12: "columns-12"
  };

  const responsiveColumnClasses = {
    1: "sm:columns-1",
    2: "sm:columns-2",
    3: "sm:columns-3", 
    4: "sm:columns-4",
    5: "sm:columns-5",
    6: "sm:columns-6",
    12: "sm:columns-12"
  };

  const masonryClasses = `
    ${columnClasses[columns]}
    ${gapClasses[gap]}
    ${responsive?.sm ? responsiveColumnClasses[responsive.sm] : ""}
    ${responsive?.md ? responsiveColumnClasses[responsive.md].replace("sm:", "md:") : ""}
    ${responsive?.lg ? responsiveColumnClasses[responsive.lg].replace("sm:", "lg:") : ""}
    ${responsive?.xl ? responsiveColumnClasses[responsive.xl].replace("sm:", "xl:") : ""}
    ${className}
  `;

  return (
    <div className={masonryClasses}>
      {children}
    </div>
  );
}
