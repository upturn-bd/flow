"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useModalState } from "@/hooks/core/useModalState";
import StakeholderIssueForm from "@/components/stakeholder-issues/StakeholderIssueForm";
import BaseModal from "@/components/ui/modals/BaseModal";
import Pagination from "@/components/ui/Pagination";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { StakeholderIssue } from "@/lib/types/schemas";
import { usePermissions } from "@/hooks/usePermissions";
import { ModulePermissionsBanner, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

export default function StakeholderIssuesPage() {
  const router = useRouter();
  const { canWrite, canDelete } = usePermissions();
  const {
    issues,
    loading,
    error,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    highPriorityIssues,
    searchIssues,
    updateIssue,
    deleteIssue,
    getAttachmentUrl,
  } = useStakeholderIssues();

  const { modalState, openCreateModal, closeModal } = useModalState();
  const [selectedIssue, setSelectedIssue] = useState<StakeholderIssue | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "In Progress" | "Resolved">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "Low" | "Medium" | "High" | "Urgent">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchResult, setSearchResult] = useState<{
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } | null>(null);

  const pageSize = 25;

  useEffect(() => {
    const loadIssues = async () => {
      const result = await searchIssues({
        searchQuery: searchTerm,
        page: currentPage,
        pageSize,
        filterStatus,
        filterPriority,
      });
      setSearchResult(result);
    };
    
    loadIssues();
  }, [searchTerm, currentPage, filterStatus, filterPriority]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (status: "all" | "Pending" | "In Progress" | "Resolved") => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePriorityFilterChange = (priority: "all" | "Low" | "Medium" | "High" | "Urgent") => {
    setFilterPriority(priority);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUpdateIssue = async (data: any) => {
    if (!selectedIssue?.id) return;
    
    try {
      await updateIssue(selectedIssue.id, data);
      closeModal();
      setSelectedIssue(null);
      // Refresh the list
      const result = await searchIssues({
        searchQuery: searchTerm,
        page: currentPage,
        pageSize,
        filterStatus,
        filterPriority,
      });
      setSearchResult(result);
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    
    try {
      await deleteIssue(issueId);
      // Refresh the list
      const result = await searchIssues({
        searchQuery: searchTerm,
        page: currentPage,
        pageSize,
        filterStatus,
        filterPriority,
      });
      setSearchResult(result);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Stakeholder Issues</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage issues for stakeholders you are assigned to handle
          </p>
        </div>
      </div>

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.STAKEHOLDER_ISSUES} title="Stakeholder Issues" compact />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{pendingIssues.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressIssues.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{resolvedIssues.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{highPriorityIssues.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => handleStatusFilterChange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => handlePriorityFilterChange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && issues.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && issues.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900">No issues found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm || filterStatus !== "all" || filterPriority !== "all"
              ? "Try adjusting your search or filters"
              : "You don't have any stakeholder issues assigned yet"}
          </p>
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
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>

                  {/* Stakeholder Info */}
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Stakeholder:</span> {issue.stakeholder?.name}
                  </div>

                  {/* Assigned Employee Info */}
                  {issue.assigned_employee && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Assigned to:</span> {issue.assigned_employee.name}
                      {issue.assigned_employee.email && (
                        <span className="text-gray-500"> ({issue.assigned_employee.email})</span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {issue.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{issue.description}</p>
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
                  {canWrite(PERMISSION_MODULES.STAKEHOLDER_ISSUES) ? (
                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        openCreateModal();
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit issue"
                    >
                      <Eye size={18} />
                    </button>
                  ) : (
                    <PermissionTooltip message="You don't have permission to edit issues">
                      <button
                        disabled
                        className="p-2 text-gray-400 rounded cursor-not-allowed opacity-50"
                        title="Edit issue (no permission)"
                      >
                        <Eye size={18} />
                      </button>
                    </PermissionTooltip>
                  )}
                  
                  {canDelete(PERMISSION_MODULES.STAKEHOLDER_ISSUES) ? (
                    <button
                      onClick={() => issue.id && handleDeleteIssue(issue.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete issue"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <PermissionTooltip message="You don't have permission to delete issues">
                      <button
                        disabled
                        className="p-2 text-gray-400 rounded cursor-not-allowed opacity-50"
                        title="Delete issue (no permission)"
                      >
                        <Trash2 size={18} />
                      </button>
                    </PermissionTooltip>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {searchResult && (
            <Pagination
              currentPage={searchResult.currentPage}
              totalPages={searchResult.totalPages}
              totalCount={searchResult.totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Edit Issue Modal */}
      {modalState.isOpen && selectedIssue && (
        <BaseModal isOpen={modalState.isOpen} onClose={closeModal} title="Update Issue">
          <StakeholderIssueForm
            stakeholderId={selectedIssue.stakeholder_id}
            issueId={selectedIssue.id}
            initialData={{
              title: selectedIssue.title,
              description: selectedIssue.description,
              status: selectedIssue.status,
              priority: selectedIssue.priority,
              assigned_to: selectedIssue.assigned_to,
              attachments: selectedIssue.attachments,
            }}
            onSubmit={handleUpdateIssue}
            onCancel={closeModal}
            submitLabel="Update Issue"
          />
        </BaseModal>
      )}
    </div>
  );
}
