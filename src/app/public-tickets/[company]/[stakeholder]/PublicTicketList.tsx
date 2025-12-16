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
  ArrowsClockwise,
  Package
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PublicTicketListProps {
  tickets: StakeholderIssue[];
  loading?: boolean;
  onRefresh: () => void;
  getAttachmentUrl: (path: string) => Promise<string | null>;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgent":
      return "text-error bg-error/10 border-error/30";
    case "High":
      return "text-warning bg-warning/10 border-warning/30";
    case "Medium":
      return "text-info bg-info/10 border-info/30";
    case "Low":
      return "text-success bg-success/10 border-success/30";
    default:
      return "text-foreground-secondary bg-surface-secondary border-border-primary";
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "Resolved":
      return {
        icon: CheckCircle,
        label: "Resolved",
        color: "text-success",
        bgColor: "bg-success/10",
        borderColor: "border-success/30",
      };
    case "In Progress":
      return {
        icon: HourglassMedium,
        label: "In Progress",
        color: "text-primary-600",
        bgColor: "bg-primary-100 dark:bg-primary-900/30",
        borderColor: "border-primary-300",
      };
    case "Pending Approval":
      return {
        icon: WarningCircle,
        label: "Pending Approval",
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/30",
      };
    case "Pending":
    default:
      return {
        icon: Clock,
        label: "Pending",
        color: "text-info",
        bgColor: "bg-info/10",
        borderColor: "border-info/30",
      };
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto">
            <ArrowsClockwise size={32} className="text-primary-600" />
          </div>
          <p className="text-foreground-secondary">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
          <Package size={40} weight="duotone" className="text-foreground-tertiary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground-primary mb-2">
          No Tickets Yet
        </h3>
        <p className="text-sm text-foreground-secondary mb-6">
          You haven't created any tickets yet. Create your first ticket to get started.
        </p>
      </div>
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
          const statusConfig = getStatusConfig(ticket.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={ticket.id}
              className="bg-surface-primary border border-border-primary rounded-xl p-5 
                       hover:shadow-lg transition-shadow"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground-primary mb-2 break-words">
                    {ticket.title}
                  </h3>
                  
                  {/* Status and Priority Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                               border ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}
                    >
                      <StatusIcon size={14} weight="fill" />
                      {statusConfig.label}
                    </span>
                    
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                               border ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>

                    {ticket.category && (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                                 bg-surface-secondary border border-border-primary text-foreground-secondary"
                      >
                        <Tag size={14} />
                        {ticket.category.name}
                      </span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
