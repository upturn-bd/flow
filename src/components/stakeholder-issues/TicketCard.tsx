"use client";

import { motion } from "framer-motion";
import { StakeholderIssue } from "@/lib/types/schemas";
import { CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import {
  Download,
  TrashSimple,
  PencilSimple,
  Tag,
  UsersThree,
  Link as LinkIcon,
  User,
  Eye,
} from "@phosphor-icons/react";

export interface TicketCardProps {
  /** The ticket data to display */
  ticket: StakeholderIssue;
  /** Called when the card is clicked to view details */
  onView?: (ticket: StakeholderIssue) => void;
  /** Called when edit button is clicked */
  onEdit?: (ticket: StakeholderIssue) => void;
  /** Called when delete button is clicked */
  onDelete?: (ticketId: number) => void;
  /** Called when an attachment is downloaded */
  onDownloadAttachment?: (filePath: string, originalName: string) => void;
  /** Whether the user has permission to edit (base permission) */
  canEdit?: boolean;
  /** Whether the user has permission to delete (base permission) */
  canDelete?: boolean;
  /** Current user's ID - used to check if user is the creator for edit/delete */
  currentUserId?: string;
  /** Whether to show stakeholder info */
  showStakeholder?: boolean;
  /** Additional class names */
  className?: string;
}

export function TicketCard({
  ticket,
  onView,
  onEdit,
  onDelete,
  onDownloadAttachment,
  canEdit = true,
  canDelete = true,
  currentUserId,
  showStakeholder = true,
  className = "",
}: TicketCardProps) {
  // Check if user is the creator - only creators can edit/delete
  const isCreator = currentUserId && ticket.created_by === currentUserId;
  const effectiveCanEdit = canEdit && isCreator;
  const effectiveCanDelete = canDelete && isCreator;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or attachments
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[role='button']")) {
      return;
    }
    onView?.(ticket);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={handleCardClick}
      className={`bg-surface-primary border border-border-primary shadow-sm hover:shadow-lg transition-all rounded-xl ${
        onView ? "cursor-pointer hover:border-primary-300 dark:hover:border-primary-700" : ""
      } ${className}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title and Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground-primary wrap-break-word">
                {ticket.title}
              </h3>
              <StatusBadge status={ticket.status} size="xs" />
              <PriorityBadge priority={ticket.priority} size="xs" />
              {/* Category Badge - custom styled with dynamic color */}
              {ticket.category && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: ticket.category.color }}
                >
                  <Tag size={12} />
                  {ticket.category.name}
                  {ticket.subcategory && (
                    <span className="opacity-75">/ {ticket.subcategory.name}</span>
                  )}
                </span>
              )}
            </div>

            {/* Stakeholder Info */}
            {showStakeholder && ticket.stakeholder && (
              <div className="text-sm text-foreground-secondary mb-2">
                <span className="font-medium">Stakeholder:</span>{" "}
                <span className="text-foreground-primary">{ticket.stakeholder.name || "Unknown"}</span>
              </div>
            )}

            {/* Assignment Info */}
            {(ticket.assigned_employee || ticket.assigned_team) && (
              <div className="text-sm text-foreground-secondary mb-2 flex items-center gap-1 flex-wrap">
                <span className="font-medium">Assigned to:</span>
                {ticket.assigned_employee ? (
                  <>
                    <User size={14} className="text-foreground-tertiary" />
                    {ticket.assigned_employee.name}
                    {ticket.assigned_employee.email && (
                      <span className="text-foreground-tertiary"> ({ticket.assigned_employee.email})</span>
                    )}
                  </>
                ) : (
                  <>
                    <UsersThree size={14} className="text-foreground-tertiary" />
                    {ticket.assigned_team?.name}
                    <span className="text-foreground-tertiary">(Team)</span>
                  </>
                )}
              </div>
            )}

            {/* Linked Fields Info */}
            {ticket.linked_fields && ticket.linked_fields.length > 0 && (
              <div className="text-sm text-foreground-secondary mb-2 flex items-center gap-1">
                <LinkIcon size={14} className="text-primary-600" />
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  {ticket.linked_fields.length} linked field{ticket.linked_fields.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Legacy: Linked Step Data Info */}
            {(!ticket.linked_fields || ticket.linked_fields.length === 0) &&
              ticket.linked_step_data_ids &&
              ticket.linked_step_data_ids.length > 0 && (
                <div className="text-sm text-foreground-secondary mb-2 flex items-center gap-1">
                  <LinkIcon size={14} className="text-primary-600" />
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {ticket.linked_step_data_ids.length} linked step{ticket.linked_step_data_ids.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

            {/* Description */}
            {ticket.description && (
              <p className="text-sm text-foreground-secondary mt-2 line-clamp-2">{ticket.description}</p>
            )}

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && onDownloadAttachment && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.attachments.map((attachment, index) => (
                  <button
                    key={index}
                    onClick={() => onDownloadAttachment(attachment.path, attachment.originalName)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background-tertiary dark:bg-surface-secondary hover:bg-surface-hover rounded transition-colors"
                  >
                    <Download size={12} />
                    {attachment.originalName}
                  </button>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary flex-wrap">
              <span>Created {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "N/A"}</span>
              {ticket.creator && <span>by {ticket.creator.name}</span>}
              {ticket.resolved_at && <span>Resolved {new Date(ticket.resolved_at).toLocaleDateString()}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onView && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(ticket);
                }}
                className="p-2"
                title="View ticket details"
              >
                <Eye size={16} />
              </Button>
            )}

            {onEdit && effectiveCanEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(ticket);
                }}
                className="p-2"
                title="Edit ticket"
              >
                <PencilSimple size={16} />
              </Button>
            )}

            {onDelete && effectiveCanDelete && (
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  ticket.id && onDelete(ticket.id);
                }}
                className="p-2"
                title="Delete ticket"
              >
                <TrashSimple size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
}

export default TicketCard;
