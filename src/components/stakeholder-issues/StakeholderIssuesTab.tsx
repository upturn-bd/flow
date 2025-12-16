"use client";

import { useState, useEffect } from "react";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useModalState } from "@/hooks/core/useModalState";
import StakeholderIssueForm from "@/components/stakeholder-issues/StakeholderIssueForm";
import BaseModal from "@/components/ui/modals/BaseModal";
import { Plus, WarningCircle, Download, TrashSimple, Eye, CheckCircle, Clock, Link as LinkIcon, ShieldCheck } from "@phosphor-icons/react";
import { StakeholderIssue } from "@/lib/types/schemas";
import { InlineSpinner } from "@/components/ui";

interface StakeholderIssuesTabProps {
  stakeholderId: number;
}

export default function StakeholderIssuesTab({ stakeholderId }: StakeholderIssuesTabProps) {
  const {
    issues,
    loading,
    error,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    downloadAttachment,
  } = useStakeholderIssues();

  const { modalState, openCreateModal, closeModal } = useModalState();
  const [selectedIssue, setSelectedIssue] = useState<StakeholderIssue | null>(null);

  useEffect(() => {
    fetchIssues(stakeholderId);
  }, [stakeholderId, fetchIssues]);

  const handleCreateIssue = async (data: any) => {
    try {
      await createIssue(data);
      closeModal();
    } catch (error) {
      console.error("Error creating issue:", error);
    }
  };

  const handleUpdateIssue = async (data: any) => {
    if (!selectedIssue?.id) return;
    
    try {
      await updateIssue(selectedIssue.id, data);
      closeModal();
      setSelectedIssue(null);
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    
    try {
      await deleteIssue(issueId);
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  };

  const handleDownloadAttachment = async (filePath: string, originalName: string) => {
    try {
      await downloadAttachment(filePath, originalName);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      alert("Failed to download attachment. The file may not exist or you may not have permission.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-warning/10 dark:bg-warning/20 text-warning";
      case "In Progress":
        return "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300";
      case "Pending Approval":
        return "bg-info/10 dark:bg-info/20 text-info";
      case "Resolved":
        return "bg-success/10 dark:bg-success/20 text-success";
      default:
        return "bg-background-secondary dark:bg-background-tertiary text-foreground-primary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-error/10 dark:bg-error/20 text-error";
      case "High":
        return "bg-warning/10 dark:bg-warning/20 text-warning";
      case "Medium":
        return "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300";
      case "Low":
        return "bg-background-secondary dark:bg-background-tertiary text-foreground-primary";
      default:
        return "bg-background-secondary dark:bg-background-tertiary text-foreground-primary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock size={16} />;
      case "In Progress":
        return <WarningCircle size={16} />;
      case "Pending Approval":
        return <ShieldCheck size={16} />;
      case "Resolved":
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground-primary">Tickets</h2>
          <p className="text-xs sm:text-sm text-foreground-tertiary mt-1">
            Track and manage tickets for this stakeholder
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedIssue(null);
            openCreateModal();
          }}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Ticket</span>
          <span className="sm:hidden">New Ticket</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 dark:bg-error/20 border border-error/30 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && issues.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-background-secondary rounded-lg border-2 border-dashed border-border-secondary">
          <h3 className="text-base sm:text-lg font-semibold text-foreground-primary">No tickets yet</h3>
          <p className="text-xs sm:text-sm text-foreground-tertiary mt-1">
            Create a ticket to start tracking problems or requests
          </p>
          <button
            onClick={() => {
              setSelectedIssue(null);
              openCreateModal();
            }}
            className="mt-4 inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Ticket</span>
            <span className="sm:hidden">New Ticket</span>
          </button>
        </div>
      )}

      {/* Issues List */}
      {!loading && issues.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground-primary wrap-break-words">{issue.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      <span className="hidden sm:inline">{issue.status}</span>
                    </span>
                    <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    {/* Category Badge */}
                    {issue.category && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: issue.category.color }}
                      >
                        {issue.category.name}
                        {issue.subcategory && (
                          <span className="opacity-75">/ {issue.subcategory.name}</span>
                        )}
                      </span>
                    )}
                    {/* Public Page Badge */}
                    {issue.created_from_public_page && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium 
                                 bg-info/20 text-info border border-info/30"
                        title="Created from public page"
                      >
                        <LinkIcon size={12} weight="bold" />
                        <span className="hidden sm:inline">Public</span>
                      </span>
                    )}
                  </div>

                  {/* Assignment Info */}
                  {(issue.assigned_employee || issue.assigned_team) && (
                    <div className="text-xs text-foreground-tertiary mb-2">
                      Assigned to: {issue.assigned_employee?.name || issue.assigned_team?.name}
                      {issue.assigned_team && <span className="ml-1">(Team)</span>}
                    </div>
                  )}

                  {/* Linked Fields Info (new format) */}
                  {issue.linked_fields && issue.linked_fields.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mb-2">
                      <LinkIcon size={12} />
                      <span>
                        {issue.linked_fields.length} linked field{issue.linked_fields.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {/* Legacy: Linked Step Data Info */}
                  {(!issue.linked_fields || issue.linked_fields.length === 0) && issue.linked_step_data_ids && issue.linked_step_data_ids.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mb-2">
                      <LinkIcon size={12} />
                      <span>
                        {issue.linked_step_data_ids.length} linked step{issue.linked_step_data_ids.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {issue.description && (
                    <p className="text-xs sm:text-sm text-foreground-tertiary mt-2 wrap-break-words">{issue.description}</p>
                  )}

                  {/* Attachments */}
                  {issue.attachments && issue.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {issue.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background-secondary hover:bg-background-tertiary rounded transition-colors"
                        >
                          <Download size={12} />
                          <span className="truncate max-w-[150px] sm:max-w-none">{attachment.originalName}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-foreground-tertiary">
                    <span>Created {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "N/A"}</span>
                    {issue.resolved_at && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>Resolved {new Date(issue.resolved_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                  <button
                    onClick={() => {
                      setSelectedIssue(issue);
                      openCreateModal();
                    }}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                    title="Edit Ticket"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => issue.id && handleDeleteIssue(issue.id)}
                    className="p-2 text-error hover:bg-error/10 dark:hover:bg-error/20 rounded transition-colors"
                    title="Delete ticket"
                  >
                    <TrashSimple size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Ticket Modal */}
      {modalState.isOpen && (
        <BaseModal isOpen={modalState.isOpen} onClose={closeModal} title={selectedIssue ? "Update Ticket" : "Create New Ticket"}>
          <StakeholderIssueForm
            stakeholderId={stakeholderId}
            issueId={selectedIssue?.id}
            initialData={selectedIssue ? {
              title: selectedIssue.title,
              description: selectedIssue.description,
              status: selectedIssue.status,
              priority: selectedIssue.priority,
              assigned_to: selectedIssue.assigned_to,
              assigned_team_id: selectedIssue.assigned_team_id,
              category_id: selectedIssue.category_id,
              subcategory_id: selectedIssue.subcategory_id,
              linked_step_data_ids: selectedIssue.linked_step_data_ids || [],
              linked_fields: selectedIssue.linked_fields || [],
              attachments: selectedIssue.attachments || [],
            } : undefined}
            onSubmit={selectedIssue ? handleUpdateIssue : handleCreateIssue}
            onCancel={closeModal}
            submitLabel={selectedIssue ? "Update Ticket" : "Create Ticket"}
          />
        </BaseModal>
      )}
    </div>
  );
}
