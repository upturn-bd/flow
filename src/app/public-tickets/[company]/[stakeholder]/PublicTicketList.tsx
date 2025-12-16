"use client";

import { StakeholderIssue } from "@/lib/types/schemas";
import { 
  Clock, 
  CheckCircle, 
  WarningCircle,
  HourglassMedium,
  Paperclip,
  CalendarBlank,
  Tag,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PublicTicketListProps {
  tickets: StakeholderIssue[];
  loading?: boolean;
  onRefresh: () => void;
  getAttachmentUrl: (path: string) => Promise<string | null>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Resolved":
      return CheckCircle;
    case "In Progress":
      return HourglassMedium;
    case "Pending Approval":
      return WarningCircle;
    case "Pending":
    default:
      return Clock;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PublicTicketList({
  tickets,
  loading = false,
  onRefresh,
  getAttachmentUrl,
}: PublicTicketListProps) {
  const handleDownloadAttachment = async (path: string, originalName: string) => {
    try {
      const url = await getAttachmentUrl(path);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = originalName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        icon={ArrowsClockwise}
        text="Loading tickets..."
        color="blue"
        height="h-48"
      />
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={CalendarBlank}
        title="No Tickets Yet"
        description="You haven't created any tickets yet. Create your first ticket to get started."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground-primary">
          Your Tickets ({tickets.length})
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <ArrowsClockwise size={16} weight="bold" />
          Refresh
        </Button>
      </div>

      {/* Ticket Cards */}
      <div className="space-y-4">
        {tickets.map((ticket) => {
          const StatusIcon = getStatusIcon(ticket.status);

          return (
            <Card
              key={ticket.id}
              padding="lg"
              hover
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground-primary mb-2 break-words">
                    {ticket.title}
                  </h3>
                  
                  {/* Status and Priority Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={ticket.status} size="sm" />
                    <PriorityBadge priority={ticket.priority} size="sm" />

                    {ticket.category && (
                      <Badge variant="default" size="sm" icon={<Tag size={14} />}>
                        {ticket.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {ticket.description && (
                <p className="text-sm text-foreground-secondary mb-4 whitespace-pre-wrap break-words">
                  {ticket.description}
                </p>
              )}

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">
                    Attachments
                  </p>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <button
                        key={index}
                        onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-secondary 
                                 border border-border-primary rounded-lg 
                                 hover:bg-surface-hover transition-colors w-full text-left"
                      >
                        <Paperclip size={16} className="text-foreground-tertiary shrink-0" />
                        <span className="text-sm text-foreground-primary truncate flex-1">
                          {attachment.originalName}
                        </span>
                        <span className="text-xs text-foreground-tertiary shrink-0">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Info */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-tertiary pt-4 border-t border-border-primary">
                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={14} />
                  <span>Created: {formatDate(ticket.created_at)}</span>
                </div>
                
                {ticket.resolved_at && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    <span>Resolved: {formatDate(ticket.resolved_at)}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
