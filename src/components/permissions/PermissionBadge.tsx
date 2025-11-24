"use client";

import React from "react";
import { Lock, LockOpen, Eye, PencilSimple, Trash, CheckCircle, ChatCircle } from "@phosphor-icons/react";
import { PermissionAction, PERMISSION_ACTIONS } from "@/lib/constants";

interface PermissionBadgeProps {
  /** Type of permission action */
  action: PermissionAction | string;
  /** Whether the user has this permission */
  hasPermission: boolean;
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Show as icon only or with text */
  iconOnly?: boolean;
}

const actionConfig = {
  [PERMISSION_ACTIONS.READ]: {
    icon: Eye,
    label: "View",
    colorGranted: "bg-blue-100 text-blue-700 border-blue-200",
    colorDenied: "bg-gray-100 text-gray-400 border-gray-200",
  },
  [PERMISSION_ACTIONS.WRITE]: {
    icon: PencilSimple,
    label: "Edit",
    colorGranted: "bg-green-100 text-green-700 border-green-200",
    colorDenied: "bg-gray-100 text-gray-400 border-gray-200",
  },
  [PERMISSION_ACTIONS.DELETE]: {
    icon: Trash,
    label: "Delete",
    colorGranted: "bg-red-100 text-red-700 border-red-200",
    colorDenied: "bg-gray-100 text-gray-400 border-gray-200",
  },
  [PERMISSION_ACTIONS.APPROVE]: {
    icon: CheckCircle,
    label: "Approve",
    colorGranted: "bg-purple-100 text-purple-700 border-purple-200",
    colorDenied: "bg-gray-100 text-gray-400 border-gray-200",
  },
  [PERMISSION_ACTIONS.COMMENT]: {
    icon: ChatCircle,
    label: "Comment",
    colorGranted: "bg-orange-100 text-orange-700 border-orange-200",
    colorDenied: "bg-gray-100 text-gray-400 border-gray-200",
  },
};

const sizeConfig = {
  sm: {
    icon: 12,
    padding: "px-2 py-0.5",
    text: "text-xs",
  },
  md: {
    icon: 16,
    padding: "px-3 py-1",
    text: "text-sm",
  },
  lg: {
    icon: 20,
    padding: "px-4 py-1.5",
    text: "text-base",
  },
};

/**
 * Badge component that displays permission status
 * 
 * Usage:
 * ```tsx
 * <PermissionBadge action="can_write" hasPermission={true} />
 * <PermissionBadge action="can_delete" hasPermission={false} iconOnly />
 * ```
 */
export function PermissionBadge({
  action,
  hasPermission,
  size = "sm",
  iconOnly = false,
}: PermissionBadgeProps) {
  const config = actionConfig[action as keyof typeof actionConfig] || {
    icon: Lock,
    label: "Unknown",
    colorGranted: "bg-gray-100 text-gray-700 border-gray-200",
    colorDenied: "bg-gray-100 text-gray-400 border-gray-200",
  };

  const sizeSettings = sizeConfig[size];
  const Icon = hasPermission ? config.icon : Lock;
  const colorClass = hasPermission ? config.colorGranted : config.colorDenied;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${colorClass} ${sizeSettings.padding} ${sizeSettings.text} font-medium transition-colors`}
      title={hasPermission ? `You can ${config.label.toLowerCase()}` : `You cannot ${config.label.toLowerCase()}`}
    >
      <Icon size={sizeSettings.icon} weight="fill" />
      {!iconOnly && <span>{hasPermission ? config.label : `No ${config.label}`}</span>}
    </span>
  );
}

interface PermissionsBadgeGroupProps {
  permissions: {
    can_read?: boolean;
    can_write?: boolean;
    can_delete?: boolean;
    can_approve?: boolean;
    can_comment?: boolean;
  };
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
}

/**
 * Component that displays a group of permission badges
 * 
 * Usage:
 * ```tsx
 * <PermissionsBadgeGroup 
 *   permissions={{ can_read: true, can_write: true, can_delete: false }}
 *   iconOnly
 * />
 * ```
 */
export function PermissionsBadgeGroup({
  permissions,
  size = "sm",
  iconOnly = false,
}: PermissionsBadgeGroupProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {permissions.can_read !== undefined && (
        <PermissionBadge
          action={PERMISSION_ACTIONS.READ}
          hasPermission={permissions.can_read}
          size={size}
          iconOnly={iconOnly}
        />
      )}
      {permissions.can_write !== undefined && (
        <PermissionBadge
          action={PERMISSION_ACTIONS.WRITE}
          hasPermission={permissions.can_write}
          size={size}
          iconOnly={iconOnly}
        />
      )}
      {permissions.can_delete !== undefined && (
        <PermissionBadge
          action={PERMISSION_ACTIONS.DELETE}
          hasPermission={permissions.can_delete}
          size={size}
          iconOnly={iconOnly}
        />
      )}
      {permissions.can_approve !== undefined && (
        <PermissionBadge
          action={PERMISSION_ACTIONS.APPROVE}
          hasPermission={permissions.can_approve}
          size={size}
          iconOnly={iconOnly}
        />
      )}
      {permissions.can_comment !== undefined && (
        <PermissionBadge
          action={PERMISSION_ACTIONS.COMMENT}
          hasPermission={permissions.can_comment}
          size={size}
          iconOnly={iconOnly}
        />
      )}
    </div>
  );
}
