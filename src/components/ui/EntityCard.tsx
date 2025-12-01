"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Trash, Eye } from "@/lib/icons";
import { Button } from "./button";
import type { IconType } from "@/lib/icons";

export type EntityCardProps = {
  /** Card title */
  title: string;
  /** Icon component to display next to the title */
  icon?: IconType;
  /** Optional subtitle or description */
  description?: string;
  /** Additional metadata items to display */
  metadata?: ReactNode;
  /** Called when delete button is clicked */
  onDelete?: () => void;
  /** Whether delete is in progress */
  deleteLoading?: boolean;
  /** Called when view/edit button is clicked */
  onView?: () => void;
  /** Custom view button text */
  viewButtonText?: string;
  /** Additional action buttons */
  actions?: ReactNode;
  /** Custom content to render below title */
  children?: ReactNode;
};

export function EntityCard({
  title,
  icon: Icon,
  description,
  metadata,
  onDelete,
  deleteLoading = false,
  onView,
  viewButtonText = "View Details",
  actions,
  children,
}: EntityCardProps) {
  return (
    <motion.div
      className="bg-surface-primary p-4 rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon size={20} weight="duotone" className="text-foreground-secondary" />}
          <h4 className="font-medium text-foreground-primary">{title}</h4>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            isLoading={deleteLoading}
            disabled={deleteLoading}
            className="p-1 rounded-full text-foreground-tertiary hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash size={16} weight="bold" />
          </Button>
        )}
      </div>

      {description && (
        <p className="text-foreground-secondary text-sm mb-3 line-clamp-2">{description}</p>
      )}

      {metadata && (
        <div className="mt-2 space-y-1.5">
          {metadata}
        </div>
      )}

      {children}

      {(onView || actions) && (
        <div className="flex items-center justify-end gap-2 mt-3">
          {actions}
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="text-sm flex items-center gap-1 text-foreground-secondary hover:text-foreground-primary"
            >
              <Eye size={16} weight="bold" />
              {viewButtonText}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export type EntityCardGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
};

/**
 * Grid wrapper for EntityCards
 */
export function EntityCardGrid({ children, columns = 3 }: EntityCardGridProps) {
  const colClasses = {
    1: "grid-cols-1",
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

export type EntityCardMetaItemProps = {
  icon?: IconType;
  children: ReactNode;
  className?: string;
};

/**
 * Metadata item for EntityCard
 */
export function EntityCardMetaItem({ icon: Icon, children, className = "" }: EntityCardMetaItemProps) {
  return (
    <div className={`flex items-center gap-1.5 text-sm text-foreground-secondary ${className}`}>
      {Icon && <Icon size={16} weight="duotone" className="text-foreground-tertiary" />}
      <span>{children}</span>
    </div>
  );
}

export type EntityCardBadgeProps = {
  icon?: IconType;
  children: ReactNode;
  className?: string;
};

/**
 * Badge item for EntityCard (styled with background)
 */
export function EntityCardBadge({ icon: Icon, children, className = "" }: EntityCardBadgeProps) {
  return (
    <span className={`flex items-center gap-1.5 text-sm bg-background-tertiary dark:bg-surface-secondary px-2 py-1 rounded text-foreground-secondary w-fit ${className}`}>
      {Icon && <Icon size={16} weight="duotone" className="text-foreground-tertiary" />}
      {children}
    </span>
  );
}

export default EntityCard;
