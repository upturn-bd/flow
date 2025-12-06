"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react";
import type { IconType } from "@phosphor-icons/react";

export type NavigationCardProps = {
  /** Card title/name */
  name: string;
  /** Navigation path */
  path: string;
  /** Icon component */
  icon: IconType;
  /** Description text */
  description?: string;
  /** Icon container color classes (e.g., "bg-blue-100 text-blue-700") */
  iconColor?: string;
};

/**
 * A navigation card component for linking to different pages/sections.
 * Used in admin management and operations pages.
 */
export function NavigationCard({
  name,
  path,
  icon: Icon,
  description,
  iconColor = "bg-primary-100 text-primary-700",
}: NavigationCardProps) {
  return (
    <Link
      href={path}
      className="group flex items-start p-4 bg-surface-primary rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 h-28"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`shrink-0 w-12 h-12 rounded-md ${iconColor} flex items-center justify-center mr-4 transition-transform`}
      >
        <Icon size={28} className="text-current" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground-primary group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate">
            {name}
          </h3>
          <CaretRight
            size={16}
            weight="bold"
            className="text-primary-600 ml-2 shrink-0 group-hover:translate-x-1 transition-transform"
          />
        </div>
        {description && (
          <p className="text-sm text-foreground-secondary mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

export type NavigationCardGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

/**
 * Grid wrapper for NavigationCards
 */
export function NavigationCardGrid({ children, columns = 3 }: NavigationCardGridProps) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${colClasses[columns]}`}>
      {children}
    </div>
  );
}

export type NavigationSectionProps = {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Navigation items */
  items: NavigationCardProps[];
  /** Number of columns for grid */
  columns?: 2 | 3 | 4;
};

/**
 * A complete navigation section with title, description, and card grid
 */
export function NavigationSection({
  title,
  description,
  items,
  columns = 3,
}: NavigationSectionProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <motion.div
      className="mb-10"
      initial="hidden"
      animate="visible"
      exit="hidden"
      layout
    >
      <motion.div className="flex items-center mb-4" variants={itemVariants}>
        <h2 className="text-xl font-bold text-foreground-primary mr-2">
          {title}
        </h2>
        <div className="h-px grow bg-border-primary"></div>
      </motion.div>
      {description && (
        <motion.p
          className="text-foreground-secondary mb-6"
          variants={itemVariants}
        >
          {description}
        </motion.p>
      )}

      <NavigationCardGrid columns={columns}>
        {items.map((item) => (
          <motion.div key={item.name} variants={itemVariants} layout>
            <NavigationCard {...item} />
          </motion.div>
        ))}
      </NavigationCardGrid>
    </motion.div>
  );
}

export default NavigationCard;
