"use client";

import { useState, useEffect } from "react";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useStakeholderIssueCategories } from "@/hooks/useStakeholderIssueCategories";
import { useModalState } from "@/hooks/core/useModalState";
import { useAuth } from "@/lib/auth/auth-context";
import { StakeholderIssue } from "@/lib/types/schemas";
import {
  StakeholderIssueForm,
  TicketFilters,
  TicketList,
  TicketViewModal,
  TicketStatusFilter,
  TicketPriorityFilter,
  TicketCategoryFilter,
} from "@/components/stakeholder-issues";
import BaseModal from "@/components/ui/modals/BaseModal";
import TabView from "@/components/ui/TabView";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { WarningCircle, CheckCircle, Clock, Plus, Ticket } from "@phosphor-icons/react";
import { ModulePermissionsBanner, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";
import { InlineSpinner } from "@/components/ui";
import { captureError } from "@/lib/sentry";
import { toast } from "sonner";

export default function TicketsLogsPage() {
  const { employeeInfo, canWrite, canDelete } = useAuth();
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
  const [viewingTicketId, setViewingTicketId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatusFilter>("all");
  const [filterPriority, setFilterPriority] = useState<TicketPriorityFilter>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<TicketCategoryFilter>("all");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "in-progress" | "resolved">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 25;

  // Load categories and all issues on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      await fetchIssues();
    };
    loadInitialData();
  }, [fetchCategories, fetchIssues]);

  // Filter issues based on current filters and tab
  const filteredIssues = issues.filter((issue) => {
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
  const pendingCount = issues.filter((i) => i.status === "Pending").length;
  const inProgressCount = issues.filter((i) => i.status === "In Progress").length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "all" | "pending" | "in-progress" | "resolved");
    setCurrentPage(1);
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
        const link = document.createElement("a");
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

  const handleEditTicket = (ticket: StakeholderIssue) => {
    setViewingTicketId(null); // Close view modal if open
    setSelectedIssue(ticket);
    setIsCreating(false);
    openCreateModal();
  };

  const handleViewTicket = (ticket: StakeholderIssue) => {
    if (ticket.id) {
      setViewingTicketId(ticket.id);
    }
  };

  const handleViewModalSuccess = () => {
    fetchIssues();
  };

  const renderTicketList = () => (
    <TicketList
      tickets={paginatedIssues}
      loading={loading}
      emptyTitle="No tickets found"
      emptyDescription={
        searchTerm || filterPriority !== "all" || filterCategoryId !== "all"
          ? "Try adjusting your search or filters"
          : "No tickets have been created yet"
      }
      onView={handleViewTicket}
      onEdit={handleEditTicket}
      onDelete={handleDeleteIssue}
      onDownloadAttachment={handleDownloadAttachment}
      canEdit={canWrite(PERMISSION_MODULES.STAKEHOLDERS)}
      canDelete={canDelete(PERMISSION_MODULES.STAKEHOLDERS)}
      currentUserId={employeeInfo?.id}
      showStakeholder={true}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={filteredIssues.length}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      showPagination={true}
    />
  );

  return (
    <div className="w-full">
      <Card>
        <CardHeader
          title="Tickets Log"
          subtitle="View and manage all tickets across the organization"
          action={
            canWrite(PERMISSION_MODULES.STAKEHOLDERS) ? (
              <Button
                size="md"
                variant="primary"
                onClick={() => {
                  setSelectedIssue(null);
                  setIsCreating(true);
                  openCreateModal();
                }}
                className="flex items-center gap-2"
              >
                <Plus size={18} weight="bold" />
                Create Ticket
              </Button>
            ) : (
              <PermissionTooltip message="You don't have permission to create tickets">
                <Button size="md" variant="primary" disabled className="flex items-center gap-2">
                  <Plus size={18} weight="bold" />
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
          <div className="my-4">
            <TicketFilters
              searchTerm={searchTerm}
              onSearchChange={handleSearch}
              statusFilter={filterStatus}
              onStatusFilterChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
              priorityFilter={filterPriority}
              onPriorityFilterChange={(value) => {
                setFilterPriority(value);
                setCurrentPage(1);
              }}
              categoryFilter={filterCategoryId}
              onCategoryFilterChange={(value) => {
                setFilterCategoryId(value);
                setCurrentPage(1);
              }}
              categories={categories}
              searchPlaceholder="Search tickets by title, description, or stakeholder..."
              showStatusFilter={activeTab === "all"}
            />
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
                  content: renderTicketList(),
                },
                {
                  key: "pending",
                  label: `Pending (${pendingCount})`,
                  icon: <Clock size={16} />,
                  color: "text-warning",
                  content: renderTicketList(),
                },
                {
                  key: "in-progress",
                  label: `In Progress (${inProgressCount})`,
                  icon: <WarningCircle size={16} />,
                  color: "text-primary-600",
                  content: renderTicketList(),
                },
                {
                  key: "resolved",
                  label: `Resolved (${resolvedCount})`,
                  icon: <CheckCircle size={16} />,
                  color: "text-success",
                  content: renderTicketList(),
                },
              ]}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Modal */}
      {modalState.isOpen && isCreating && (
        <BaseModal
          isOpen={modalState.isOpen}
          onClose={() => {
            closeModal();
            setIsCreating(false);
          }}
          title="Create New Ticket"
        >
          <StakeholderIssueForm
            showStakeholderSelector={true}
            onSubmit={handleCreateIssue}
            onCancel={() => {
              closeModal();
              setIsCreating(false);
            }}
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
              checker_team_id: selectedIssue.checker_team_id,
              category_id: selectedIssue.category_id,
              subcategory_id: selectedIssue.subcategory_id,
              linked_step_data_ids: selectedIssue.linked_step_data_ids || [],
              linked_fields: selectedIssue.linked_fields || [],
              required_fields: selectedIssue.required_fields || [],
              attachments: selectedIssue.attachments,
            }}
            onSubmit={handleUpdateIssue}
            onCancel={closeModal}
            submitLabel="Update Ticket"
          />
        </BaseModal>
      )}

      {/* View Ticket Modal */}
      {viewingTicketId && (
        <TicketViewModal
          ticketId={viewingTicketId}
          onClose={() => setViewingTicketId(null)}
          onSuccess={handleViewModalSuccess}
          onEdit={handleEditTicket}
          canEdit={canWrite(PERMISSION_MODULES.STAKEHOLDERS)}
          canDelete={canDelete(PERMISSION_MODULES.STAKEHOLDERS)}
        />
      )}
    </div>
  );
}
