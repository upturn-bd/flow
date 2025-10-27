"use client";

import { useState, useEffect } from "react";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useModalState } from "@/hooks/core/useModalState";
import StakeholderIssueForm from "@/components/stakeholder-issues/StakeholderIssueForm";
import FormModal from "@/components/ui/modals/FormModal";
import {
  Plus,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";
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
    getAttachmentUrl,
  } = useStakeholderIssues();

  const { isOpen, openModal, closeModal } = useModalState();
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
      const url = await getAttachmentUrl(filePath);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock size={16} />;
      case "In Progress":
        return <AlertCircle size={16} />;
      case "Resolved":
        return <CheckCircle2 size={16} />;
      default:
        return null;
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Issues</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage issues for this stakeholder
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedIssue(null);
            openModal();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Issue
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900">No issues yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create an issue to start tracking problems or requests
          </p>
          <button
            onClick={() => {
              setSelectedIssue(null);
              openModal();
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Issue
          </button>
        </div>
      )}

      {/* Issues List */}
      {!loading && issues.length > 0 && (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      {issue.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>

                  {/* Description */}
                  {issue.description && (
                    <p className="text-sm text-gray-600 mt-2">{issue.description}</p>
                  )}

                  {/* Attachments */}
                  {issue.attachments && issue.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {issue.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Download size={12} />
                          {attachment.originalName}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>Created {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "N/A"}</span>
                    {issue.resolved_at && (
                      <span>Resolved {new Date(issue.resolved_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedIssue(issue);
                      openModal();
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit issue"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => issue.id && handleDeleteIssue(issue.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete issue"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Issue Modal */}
      {isOpen && (
        <FormModal isOpen={isOpen} onClose={closeModal} title={selectedIssue ? "Update Issue" : "Create New Issue"}>
          <StakeholderIssueForm
            stakeholderId={stakeholderId}
            initialData={selectedIssue ? {
              title: selectedIssue.title,
              description: selectedIssue.description,
              status: selectedIssue.status,
              priority: selectedIssue.priority,
            } : undefined}
            onSubmit={selectedIssue ? handleUpdateIssue : handleCreateIssue}
            onCancel={closeModal}
            submitLabel={selectedIssue ? "Update Issue" : "Create Issue"}
          />
        </FormModal>
      )}
    </div>
  );
}
