"use client";

import { useState, useEffect, useCallback } from "react";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useStakeholderIssueCategories } from "@/hooks/useStakeholderIssueCategories";
import { useModalState } from "@/hooks/core/useModalState";
import { useAuth } from "@/lib/auth/auth-context";
import { StakeholderIssue } from "@/lib/types/schemas";
import StakeholderIssueForm from "@/components/stakeholder-issues/StakeholderIssueForm";
import BaseModal from "@/components/ui/modals/BaseModal";
import Pagination from "@/components/ui/Pagination";
import TabView from "@/components/ui/TabView";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { 
  WarningCircle, 
  CheckCircle, 
  Clock, 
  Download, 
  Eye, 
  TrashSimple, 
  Building, 
  Tag, 
  UsersThree, 
  Link as LinkIcon,
  PencilSimple,
  FunnelSimple,
  Plus,
  Ticket
} from "@phosphor-icons/react";
import { ModulePermissionsBanner, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";
import { SearchBar, InlineSpinner, EmptyState } from "@/components/ui";
import { SelectField } from "@/components/forms";
import { captureError } from "@/lib/sentry";
import { toast } from "sonner";

export default function TicketsLogsPage() {
  const { canWrite, canDelete, employeeInfo } = useAuth();
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
  
  const { categories, fetchCategories } = useStakeholderIssueCategories();
  const { modalState, openCreateModal, closeModal } = useModalState();
  
  const [selectedIssue, setSelectedIssue] = useState<StakeholderIssue | null>(null);
  const [isCreating, setIsCreating] = useState(false); // Track if creating new vs editing
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "In Progress" | "Resolved">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "Low" | "Medium" | "High" | "Urgent">("all");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "all">("all");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "in-progress" | "resolved">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const pageSize = 25;

  // Load categories and all issues on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      await fetchIssues(); // Fetch ALL issues (no stakeholder filter)
    };
    loadInitialData();
  }, [fetchCategories, fetchIssues]);

  // Filter issues based on current filters and tab
  const filteredIssues = issues.filter(issue => {
    // Tab filter
    if (activeTab === "pending" && issue.status !== "Pending") return false;
    if (activeTab === "in-progress" && issue.status !== "In Progress") return false;
    if (activeTab === "resolved" && issue.status !== "Resolved") return false;
    
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const matchesTitle = issue.title.toLowerCase().includes(search);
      const matchesDescription = issue.description?.toLowerCase().includes(search);
      const matchesStakeholder = issue.stakeholder?.name?.toLowerCase().includes(search);
      if (!matchesTitle && !matchesDescription && !matchesStakeholder) {
        return false;
      }
    }
    
    // Status filter (only if not using tab filter)
    if (activeTab === "all" && filterStatus !== "all" && issue.status !== filterStatus) {
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

  // Paginated issues
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredIssues.length / pageSize);

  // Stats
  const pendingCount = issues.filter(i => i.status === "Pending").length;
  const inProgressCount = issues.filter(i => i.status === "In Progress").length;
  const resolvedCount = issues.filter(i => i.status === "Resolved").length;

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "all" | "pending" | "in-progress" | "resolved");
    setCurrentPage(1);
    // Reset status filter when using tabs
    if (tab !== "all") {
      setFilterStatus("all");
    }
  };

  const handleCreateIssue = async (data: any) => {
    try {
      await createIssue(data);
      closeModal();
      setIsCreating(false);
      toast.success("Ticket created successfully");
      // Refresh the list
      await fetchIssues();
    } catch (err) {
      captureError(err, { operation: "createIssue" });
      toast.error("Failed to create ticket");
    }
  };

  const handleUpdateIssue = async (data: any) => {
    if (!selectedIssue?.id) return;
    
    try {
      await updateIssue(selectedIssue.id, data);
      closeModal();
      setSelectedIssue(null);
      toast.success("Ticket updated successfully");
      // Refresh the list
      await fetchIssues();
    } catch (err) {
      captureError(err, { operation: "updateIssue" });
      toast.error("Failed to update ticket");
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    
    try {
      await deleteIssue(issueId);
      toast.success("Ticket deleted successfully");
      await fetchIssues();
    } catch (err) {
      captureError(err, { operation: "deleteIssue" });
      toast.error("Failed to delete ticket");
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
      toast.error("Failed to download attachment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-warning/10 text-warning dark:bg-warning/20";
      case "In Progress":
        return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
      case "Resolved":
        return "bg-success/10 text-success dark:bg-success/20";
      default:
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-error/10 text-error dark:bg-error/20";
      case "High":
        return "bg-warning/20 text-warning dark:bg-warning/30";
      case "Medium":
        return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
      case "Low":
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary";
      default:
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary";
    }
  };

  const renderIssueCard = (issue: StakeholderIssue) => (
    <Card
      key={issue.id}
      className="border border-border-primary shadow-sm hover:shadow-lg transition-all rounded-xl"
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title and Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground-primary wrap-break-word">
                {issue.title}
              </h3>
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
              <span className="font-medium">Stakeholder:</span>{" "}
              <span className="text-foreground-primary">{issue.stakeholder?.name || "Unknown"}</span>
            </div>

            {/* Assignment Info */}
            {(issue.assigned_employee || issue.assigned_team) && (
              <div className="text-sm text-foreground-secondary mb-2 flex items-center gap-1 flex-wrap">
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

            {/* Linked Fields Info */}
            {issue.linked_fields && issue.linked_fields.length > 0 && (
              <div className="text-sm text-foreground-secondary mb-2 flex items-center gap-1">
                <LinkIcon size={14} className="text-primary-600" />
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  {issue.linked_fields.length} linked field{issue.linked_fields.length > 1 ? 's' : ''}
                </span>
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
            <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary flex-wrap">
              <span>Created {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : "N/A"}</span>
              {issue.creator && (
                <span>by {issue.creator.name}</span>
              )}
              {issue.resolved_at && (
                <span>Resolved {new Date(issue.resolved_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {canWrite(PERMISSION_MODULES.STAKEHOLDERS) ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedIssue(issue);
                  setIsCreating(false);
                  openCreateModal();
                }}
                className="p-2"
                title="Edit ticket"
              >
                <PencilSimple size={16} />
              </Button>
            ) : (
              <PermissionTooltip message="You don't have permission to edit tickets">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                  className="p-2 opacity-50 cursor-not-allowed"
                >
                  <PencilSimple size={16} />
                </Button>
              </PermissionTooltip>
            )}
            
            {canDelete(PERMISSION_MODULES.STAKEHOLDERS) ? (
              <Button
                size="sm"
                variant="danger"
                onClick={() => issue.id && handleDeleteIssue(issue.id)}
                className="p-2"
                title="Delete ticket"
              >
                <TrashSimple size={16} />
              </Button>
            ) : (
              <PermissionTooltip message="You don't have permission to delete tickets">
                <Button
                  size="sm"
                  variant="danger"
                  disabled
                  className="p-2 opacity-50 cursor-not-allowed"
                >
                  <TrashSimple size={16} />
                </Button>
              </PermissionTooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderIssuesList = (issuesList: StakeholderIssue[]) => {
    if (issuesList.length === 0) {
      return (
        <EmptyState
          icon={Ticket}
          title="No tickets found"
          description={
            searchTerm || filterPriority !== "all" || filterCategoryId !== "all"
              ? "Try adjusting your search or filters"
              : "No tickets have been created yet"
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        {issuesList.map(renderIssueCard)}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={filteredIssues.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
        
        {/* Results count */}
        <div className="text-sm text-foreground-tertiary text-center py-2">
          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredIssues.length)} of {filteredIssues.length} ticket{filteredIssues.length !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader
          title="Tickets Log"
          subtitle="View and manage all tickets across the organization"
          action={
            canWrite(PERMISSION_MODULES.STAKEHOLDERS) ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedIssue(null);
                  setIsCreating(true);
                  openCreateModal();
                }}
              >
                <Plus size={16} className="mr-1" />
                Create Ticket
              </Button>
            ) : (
              <PermissionTooltip message="You don't have permission to create tickets">
                <Button
                  size="sm"
                  variant="primary"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <Plus size={16} className="mr-1" />
                  Create Ticket
                </Button>
              </PermissionTooltip>
            )
          }
        />
        <CardContent>
          {/* Permission Banner */}
          <ModulePermissionsBanner module={PERMISSION_MODULES.STAKEHOLDERS} title="Tickets" compact />
          
          {/* Filters Section */}
          <div className="flex flex-col gap-4 mb-6 mt-4">
            {/* Search */}
            <SearchBar
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search tickets by title, description, or stakeholder..."
              withContainer={false}
            />
            
            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Priority Filter */}
              <SelectField
                name="filterPriority"
                value={filterPriority}
                onChange={(e) => {
                  setFilterPriority(e.target.value as any);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "All Priorities" },
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                  { value: "Urgent", label: "Urgent" },
                ]}
                containerClassName="w-full sm:w-48"
              />

              {/* Category Filter */}
              <SelectField
                name="filterCategory"
                value={filterCategoryId.toString()}
                onChange={(e) => {
                  setFilterCategoryId(e.target.value === "all" ? "all" : parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categories.filter(c => c.is_active).map(cat => ({
                    value: cat.id?.toString() || "",
                    label: cat.name,
                  }))
                ]}
                containerClassName="w-full sm:w-48"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Tabs and Content */}
          {loading && issues.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <InlineSpinner size="lg" color="primary" />
            </div>
          ) : (
            <TabView
              tabs={[
                {
                  key: "all",
                  label: `All Tickets (${issues.length})`,
                  icon: <Ticket size={16} />,
                  color: "text-primary-600",
                  content: renderIssuesList(paginatedIssues),
                },
                {
                  key: "pending",
                  label: `Pending (${pendingCount})`,
                  icon: <Clock size={16} />,
                  color: "text-warning",
                  content: renderIssuesList(paginatedIssues),
                },
                {
                  key: "in-progress",
                  label: `In Progress (${inProgressCount})`,
                  icon: <WarningCircle size={16} />,
                  color: "text-primary-600",
                  content: renderIssuesList(paginatedIssues),
                },
                {
                  key: "resolved",
                  label: `Resolved (${resolvedCount})`,
                  icon: <CheckCircle size={16} />,
                  color: "text-success",
                  content: renderIssuesList(paginatedIssues),
                },
              ]}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Ticket Modal */}
      {modalState.isOpen && isCreating && (
        <BaseModal isOpen={modalState.isOpen} onClose={() => { closeModal(); setIsCreating(false); }} title="Create New Ticket">
          <StakeholderIssueForm
            showStakeholderSelector={true}
            onSubmit={handleCreateIssue}
            onCancel={() => { closeModal(); setIsCreating(false); }}
            submitLabel="Create Ticket"
          />
        </BaseModal>
      )}

      {/* Edit Ticket Modal */}
      {modalState.isOpen && selectedIssue && !isCreating && (
        <BaseModal isOpen={modalState.isOpen} onClose={closeModal} title="Update Ticket">
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
              linked_step_data_ids: selectedIssue.linked_step_data_ids || [],
              linked_fields: selectedIssue.linked_fields || [],
              attachments: selectedIssue.attachments,
            }}
            onSubmit={handleUpdateIssue}
            onCancel={closeModal}
            submitLabel="Update Ticket"
          />
        </BaseModal>
      )}
    </div>
  );
}
