"use client";

import { AnimatePresence, motion } from "framer-motion";
import { StakeholderIssue } from "@/lib/types/schemas";
import { TicketCard } from "./TicketCard";
import { EmptyState, InlineSpinner } from "@/components/ui";
import Pagination from "@/components/ui/Pagination";
import { Ticket } from "@phosphor-icons/react";

export interface TicketListProps {
  /** Array of tickets to display */
  tickets: StakeholderIssue[];
  /** Loading state */
  loading?: boolean;
  /** Title for empty state */
  emptyTitle?: string;
  /** Description for empty state */
  emptyDescription?: string;
  /** Called when a ticket card is clicked to view */
  onView?: (ticket: StakeholderIssue) => void;
  /** Called when edit button is clicked */
  onEdit?: (ticket: StakeholderIssue) => void;
  /** Called when delete button is clicked */
  onDelete?: (ticketId: number) => void;
  /** Called when an attachment is downloaded */
  onDownloadAttachment?: (filePath: string, originalName: string) => void;
  /** Whether the user has permission to edit */
  canEdit?: boolean;
  /** Whether the user has permission to delete */
  canDelete?: boolean;
  /** Current user's ID - used to check if user is the creator for edit/delete */
  currentUserId?: string;
  /** Whether to show stakeholder info in cards */
  showStakeholder?: boolean;
  /** Current page number (1-indexed) */
  currentPage?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Total count of all items */
  totalCount?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Called when page changes */
  onPageChange?: (page: number) => void;
  /** Whether to show pagination */
  showPagination?: boolean;
  /** Additional class names */
  className?: string;
}

export function TicketList({
  tickets,
  loading = false,
  emptyTitle = "No tickets found",
  emptyDescription = "No tickets have been created yet",
  onView,
  onEdit,
  onDelete,
  onDownloadAttachment,
  canEdit = true,
  canDelete = true,
  currentUserId,
  showStakeholder = true,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  pageSize = 25,
  onPageChange,
  showPagination = true,
  className = "",
}: TicketListProps) {
  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <InlineSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const displayCount = totalCount ?? tickets.length;
  const startIndex = (currentPage - 1) * pageSize;

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence mode="popLayout">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onDownloadAttachment={onDownloadAttachment}
            canEdit={canEdit}
            canDelete={canDelete}
            currentUserId={currentUserId}
            showStakeholder={showStakeholder}
          />
        ))}
      </AnimatePresence>

      {/* Pagination */}
      {showPagination && totalPages > 1 && onPageChange && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={displayCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-foreground-tertiary text-center py-2">
        {showPagination && totalPages > 1 ? (
          <>
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, displayCount)} of {displayCount} ticket
            {displayCount !== 1 ? "s" : ""}
          </>
        ) : (
          <>
            Showing {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default TicketList;
