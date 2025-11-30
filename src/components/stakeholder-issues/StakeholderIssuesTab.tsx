"use client";

import { useState, useEffect } from "react";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useModalState } from "@/hooks/core/useModalState";
import StakeholderIssueForm from "@/components/stakeholder-issues/StakeholderIssueForm";
import BaseModal from "@/components/ui/modals/BaseModal";
import {
  Plus,
  WarningCircle,
  Download,
  Trash,
  Eye,
  CheckCircle,
  Clock,
} from "@/lib/icons";
import { StakeholderIssue } from "@/lib/types/schemas";

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
    if (!confirm("Are you sure you want to delete this issue?")) return;
    
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
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "In Progress":
        return "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300";
      case "Resolved":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      default:
        return "bg-background-secondary dark:bg-background-tertiary text-foreground-primary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "High":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300";
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
      case "Resolved":
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground-primary">Issues</h2>
          <p className="text-xs sm:text-sm text-foreground-tertiary mt-1">
            Track and manage issues for this stakeholder
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedIssue(null);
            openCreateModal();
          }}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex-shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Issue</span>
          <span className="sm:hidden">New Issue</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && issues.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-background-secondary rounded-lg border-2 border-dashed border-border-secondary">
          <h3 className="text-base sm:text-lg font-semibold text-foreground-primary">No issues yet</h3>
          <p className="text-xs sm:text-sm text-foreground-tertiary mt-1">
            Create an issue to start tracking problems or requests
          </p>
          <button
            onClick={() => {
              setSelectedIssue(null);
              openCreateModal();
            }}
            className="mt-4 inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Issue</span>
            <span className="sm:hidden">New Issue</span>
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
                    <h3 className="text-sm sm:text-base font-semibold text-foreground-primary break-words">{issue.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      <span className="hidden sm:inline">{issue.status}</span>
                    </span>
                    <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>

                  {/* Description */}
                  {issue.description && (
                    <p className="text-xs sm:text-sm text-foreground-tertiary mt-2 break-words">{issue.description}</p>
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
                <div className="flex items-center gap-2 sm:flex-col sm:items-end flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedIssue(issue);
                      openCreateModal();
                    }}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                    title="Edit issue"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => issue.id && handleDeleteIssue(issue.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete issue"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Issue Modal */}
      {modalState.isOpen && (
        <BaseModal isOpen={modalState.isOpen} onClose={closeModal} title={selectedIssue ? "Update Issue" : "Create New Issue"}>
          <StakeholderIssueForm
            stakeholderId={stakeholderId}
            issueId={selectedIssue?.id}
            initialData={selectedIssue ? {
              title: selectedIssue.title,
              description: selectedIssue.description,
              status: selectedIssue.status,
              priority: selectedIssue.priority,
              assigned_to: selectedIssue.assigned_to,
              attachments: selectedIssue.attachments || [],
            } : undefined}
            onSubmit={selectedIssue ? handleUpdateIssue : handleCreateIssue}
            onCancel={closeModal}
            submitLabel={selectedIssue ? "Update Issue" : "Create Issue"}
          />
        </BaseModal>
      )}
    </div>
  );
}
