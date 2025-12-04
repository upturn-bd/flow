"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useStakeholderIssueCategories } from "@/hooks/useStakeholderIssueCategories";
import { useTeams } from "@/hooks/useTeams";
import { useModalState } from "@/hooks/core/useModalState";
import StakeholderIssueForm from "@/components/stakeholder-issues/StakeholderIssueForm";
import BaseModal from "@/components/ui/modals/BaseModal";
import Pagination from "@/components/ui/Pagination";
import {
  WarningCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Plus,
  Trash,
  Building,
  Tag,
  UsersThree,
} from "@/lib/icons";
import { StakeholderIssue } from "@/lib/types/schemas";
import { useAuth } from "@/lib/auth/auth-context";
import { ModulePermissionsBanner, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";
import { PageHeader, SearchBar, StatCard, StatCardGrid, EmptyState, InlineSpinner } from "@/components/ui";
import { SelectField } from "@/components/forms";
import { captureError } from "@/lib/sentry";

export default function StakeholderIssuesPage() {
  const router = useRouter();
  const { employeeInfo, canWrite, canDelete } = useAuth();
  const {
    issues,
    loading,
    error,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    highPriorityIssues,
    searchIssues,
    fetchIssuesByAssignedEmployee,
    updateIssue,
    deleteIssue,
    getAttachmentUrl,
  } = useStakeholderIssues();
  
  const { categories, fetchCategories } = useStakeholderIssueCategories();
  const { getEmployeeTeamIds } = useTeams();

  const { modalState, openCreateModal, closeModal } = useModalState();
  const [selectedIssue, setSelectedIssue] = useState<StakeholderIssue | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "In Progress" | "Resolved">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "Low" | "Medium" | "High" | "Urgent">("all");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [userTeamIds, setUserTeamIds] = useState<number[]>([]);
  const [searchResult, setSearchResult] = useState<{
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } | null>(null);

  const pageSize = 25;

  // Load user's teams and categories on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      if (employeeInfo?.id) {
        const teamIds = await getEmployeeTeamIds(employeeInfo.id);
        setUserTeamIds(teamIds);
      }
    };
    loadInitialData();
  }, [fetchCategories, getEmployeeTeamIds, employeeInfo?.id]);

  // Load issues with user's teams for assignment filtering
  useEffect(() => {
    const loadIssues = async () => {
      // Fetch issues assigned to user or their teams
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
    };
    
    loadIssues();
  }, [employeeInfo?.id, userTeamIds, fetchIssuesByAssignedEmployee]);

  // Apply client-side filters (category, status, priority, search)
  const filteredIssues = issues.filter(issue => {
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      if (!issue.title.toLowerCase().includes(search) && 
          !issue.description?.toLowerCase().includes(search)) {
        return false;
      }
    }
    
    // Status filter
    if (filterStatus !== "all" && issue.status !== filterStatus) {
      return false;
    }
    
    // Priority filter
    if (filterPriority !== "all" && issue.priority !== filterPriority) {
      return false;
    }
    
    // Category filter
    if (filterCategoryId !== "all" && issue.category_id !== filterCategoryId) {
      return false;
    }
    
    return true;
  });

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

  const handleCategoryFilterChange = (categoryId: number | "all") => {
    setFilterCategoryId(categoryId);
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
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
    } catch (err) {
      captureError(err, { operation: "updateIssue" });
      console.error("Error updating issue:", err);
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    
    try {
      await deleteIssue(issueId);
      // Refresh the list
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
    } catch (err) {
      captureError(err, { operation: "deleteIssue" });
      console.error("Error deleting issue:", err);
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
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary";
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
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary";
      default:
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="My Stakeholder Issues"
        description="Manage issues for stakeholders you are assigned to handle"
        icon={Building}
        iconColor="text-purple-600"
      />

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.STAKEHOLDERS} title="Stakeholder Issues" compact />

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Pending"
          value={pendingIssues.length}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="In Progress"
          value={inProgressIssues.length}
          icon={WarningCircle}
          iconColor="text-primary-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Resolved"
          value={resolvedIssues.length}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="High Priority"
          value={highPriorityIssues.length}
          icon={WarningCircle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
      </StatCardGrid>

      {/* Filters */}
      <div className="bg-surface-primary rounded-lg border border-border-primary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search issues..."
              withContainer={false}
            />
          </div>

          {/* Status Filter */}
          <SelectField
            name="filterStatus"
            value={filterStatus}
            onChange={(e) => handleStatusFilterChange(e.target.value as any)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Pending", label: "Pending" },
              { value: "In Progress", label: "In Progress" },
              { value: "Resolved", label: "Resolved" },
            ]}
            containerClassName="w-48"
          />

          {/* Priority Filter */}
          <SelectField
            name="filterPriority"
            value={filterPriority}
            onChange={(e) => handlePriorityFilterChange(e.target.value as any)}
            options={[
              { value: "all", label: "All Priorities" },
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
              { value: "Urgent", label: "Urgent" },
            ]}
            containerClassName="w-48"
          />

          {/* Category Filter */}
          <SelectField
            name="filterCategory"
            value={filterCategoryId.toString()}
            onChange={(e) => handleCategoryFilterChange(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.filter(c => c.is_active).map(cat => ({
                value: cat.id?.toString() || "",
                label: cat.name,
              }))
            ]}
            containerClassName="w-48"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && issues.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <InlineSpinner size="lg" color="blue" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredIssues.length === 0 && (
        <div className="text-center py-12 bg-background-secondary dark:bg-background-tertiary rounded-lg border-2 border-dashed border-border-secondary">
          <h3 className="text-lg font-semibold text-foreground-primary">No issues found</h3>
          <p className="text-sm text-foreground-tertiary mt-1">
            {searchTerm || filterStatus !== "all" || filterPriority !== "all" || filterCategoryId !== "all"
              ? "Try adjusting your search or filters"
              : "You don't have any stakeholder issues assigned yet"}
          </p>
        </div>
      )}

      {/* Issues List */}
      {!loading && filteredIssues.length > 0 && (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-surface-primary rounded-lg border border-border-primary p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground-primary">{issue.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    {/* Category Badge */}
                    {issue.category && (
                      <span 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: issue.category.color }}
                      >
                        <Tag size={12} />
                        {issue.category.name}
                        {issue.subcategory && (
                          <span className="opacity-75">/ {issue.subcategory.name}</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Stakeholder Info */}
                  <div className="text-sm text-foreground-secondary mb-2">
                    <span className="font-medium">Stakeholder:</span> {issue.stakeholder?.name}
                  </div>

                  {/* Assignment Info */}
                  {(issue.assigned_employee || issue.assigned_team) && (
                    <div className="text-sm text-foreground-secondary mb-2 flex items-center gap-1">
                      <span className="font-medium">Assigned to:</span>
                      {issue.assigned_employee ? (
                        <>
                          {issue.assigned_employee.name}
                          {issue.assigned_employee.email && (
                            <span className="text-foreground-tertiary"> ({issue.assigned_employee.email})</span>
                          )}
                        </>
                      ) : (
                        <>
                          <UsersThree size={14} className="text-foreground-tertiary" />
                          {issue.assigned_team?.name}
                          <span className="text-foreground-tertiary">(Team)</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {issue.description && (
                    <p className="text-sm text-foreground-secondary mt-2 line-clamp-2">{issue.description}</p>
                  )}

                  {/* Attachments */}
                  {issue.attachments && issue.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {issue.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background-tertiary dark:bg-surface-secondary hover:bg-surface-hover rounded transition-colors"
                        >
                          <Download size={12} />
                          {attachment.originalName}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                    <span>Created {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "N/A"}</span>
                    {issue.resolved_at && (
                      <span>Resolved {new Date(issue.resolved_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {canWrite(PERMISSION_MODULES.STAKEHOLDERS) ? (
                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        openCreateModal();
                      }}
                      className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded transition-colors"
                      title="Edit issue"
                    >
                      <Eye size={18} />
                    </button>
                  ) : (
                    <PermissionTooltip message="You don't have permission to edit issues">
                      <button
                        disabled
                        className="p-2 text-foreground-tertiary rounded cursor-not-allowed opacity-50"
                        title="Edit issue (no permission)"
                      >
                        <Eye size={18} />
                      </button>
                    </PermissionTooltip>
                  )}
                  
                  {canDelete(PERMISSION_MODULES.STAKEHOLDERS) ? (
                    <button
                      onClick={() => issue.id && handleDeleteIssue(issue.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete issue"
                    >
                      <Trash size={18} />
                    </button>
                  ) : (
                    <PermissionTooltip message="You don't have permission to delete issues">
                      <button
                        disabled
                        className="p-2 text-foreground-tertiary rounded cursor-not-allowed opacity-50"
                        title="Delete issue (no permission)"
                      >
                        <Trash size={18} />
                      </button>
                    </PermissionTooltip>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination - using filteredIssues length */}
          {filteredIssues.length > 0 && (
            <div className="text-sm text-foreground-tertiary text-center py-2">
              Showing {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            </div>
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
              assigned_team_id: selectedIssue.assigned_team_id,
              category_id: selectedIssue.category_id,
              subcategory_id: selectedIssue.subcategory_id,
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
