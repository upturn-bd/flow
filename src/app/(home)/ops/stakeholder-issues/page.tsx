"use client";

import { useState, useEffect } from "react";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useStakeholderIssueCategories } from "@/hooks/useStakeholderIssueCategories";
import { useTeams } from "@/hooks/useTeams";
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
import { Button } from "@/components/ui/button";
import { WarningCircle, CheckCircle, Clock, Plus, Ticket } from "@phosphor-icons/react";
import { ModulePermissionsBanner, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";
import { PageHeader, StatCard, StatCardGrid } from "@/components/ui";
import { captureError } from "@/lib/sentry";
import { toast } from "sonner";

export default function TicketsPage() {
  const { employeeInfo, canWrite, canDelete } = useAuth();
  const {
    issues,
    loading,
    error,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    highPriorityIssues,
    fetchIssuesByAssignedEmployee,
    createIssue,
    updateIssue,
    deleteIssue,
    getAttachmentUrl,
  } = useStakeholderIssues();

  const { categories, fetchCategories } = useStakeholderIssueCategories();
  const { getEmployeeTeamIds } = useTeams();
  const { modalState, openCreateModal, closeModal } = useModalState();

  const [selectedIssue, setSelectedIssue] = useState<StakeholderIssue | null>(null);
  const [viewingTicketId, setViewingTicketId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatusFilter>("all");
  const [filterPriority, setFilterPriority] = useState<TicketPriorityFilter>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<TicketCategoryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [userTeamIds, setUserTeamIds] = useState<number[]>([]);

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
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
    };

    loadIssues();
  }, [employeeInfo?.id, userTeamIds, fetchIssuesByAssignedEmployee]);

  // Apply client-side filters
  const filteredIssues = issues.filter((issue) => {
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      if (
        !issue.title.toLowerCase().includes(search) &&
        !issue.description?.toLowerCase().includes(search)
      ) {
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

  // Paginated issues
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredIssues.length / pageSize);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  const handleCreateIssue = async (data: any) => {
    try {
      await createIssue(data);
      closeModal();
      setIsCreating(false);
      toast.success("Ticket created successfully");
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
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
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
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
      if (employeeInfo?.id) {
        await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
      }
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

  const handleViewModalSuccess = async () => {
    if (employeeInfo?.id) {
      await fetchIssuesByAssignedEmployee(employeeInfo.id, userTeamIds);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tutorial="tickets-header">
        <PageHeader
          title="My Tickets"
          description="Manage tickets for stakeholders you are assigned to handle"
          icon={Ticket}
          iconColor="text-purple-600"
        />
        {canWrite(PERMISSION_MODULES.STAKEHOLDERS) ? (
          <Button
            data-tutorial="tickets-create-btn"
            size="md"
            variant="primary"
            onClick={() => {
              setSelectedIssue(null);
              setIsCreating(true);
              openCreateModal();
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus size={18} weight="bold" />
            Create Ticket
          </Button>
        ) : (
          <PermissionTooltip message="You don't have permission to create tickets">
            <Button
              size="md"
              variant="primary"
              disabled
              className="flex items-center gap-2 shrink-0"
            >
              <Plus size={18} weight="bold" />
              Create Ticket
            </Button>
          </PermissionTooltip>
        )}
      </div>

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.STAKEHOLDERS} title="Tickets" compact />

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Pending"
          value={pendingIssues.length}
          icon={Clock}
          iconColor="text-warning"
          iconBgColor="bg-warning/10 dark:bg-warning/20"
        />
        <StatCard
          title="In Progress"
          value={inProgressIssues.length}
          icon={WarningCircle}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-100 dark:bg-primary-900/30"
        />
        <StatCard
          title="Resolved"
          value={resolvedIssues.length}
          icon={CheckCircle}
          iconColor="text-success"
          iconBgColor="bg-success/10 dark:bg-success/20"
        />
        <StatCard
          title="High Priority"
          value={highPriorityIssues.length}
          icon={WarningCircle}
          iconColor="text-error"
          iconBgColor="bg-error/10 dark:bg-error/20"
        />
      </StatCardGrid>

      {/* Filters */}
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
        searchPlaceholder="Search tickets..."
      />

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Ticket List */}
      <TicketList
        tickets={paginatedIssues}
        loading={loading}
        emptyTitle="No tickets found"
        emptyDescription={
          searchTerm || filterStatus !== "all" || filterPriority !== "all" || filterCategoryId !== "all"
            ? "Try adjusting your search or filters"
            : "You don't have any tickets assigned yet"
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
