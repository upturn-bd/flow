"use client";

import { ReactNode } from "react";
import { Icon } from "@phosphor-icons/react";

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

/**
 * SectionHeader - Standardized header for card/section components
 * Provides consistent styling for section headers with optional icon and description
 */
export default function SectionHeader({
  title,
  icon,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`border-b border-border-primary px-3 py-4 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground-secondary flex items-center">
        {icon && <span className="mr-2 text-foreground-tertiary">{icon}</span>}
        {title}
      </h3>
      {description && (
        <p className="text-sm text-foreground-tertiary mt-1">{description}</p>
      )}
    </div>
  );
}
