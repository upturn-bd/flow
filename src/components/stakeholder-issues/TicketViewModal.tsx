"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StakeholderIssue, StakeholderIssueRequiredField, LinkedStepField } from "@/lib/types/schemas";
import { useStakeholderIssues } from "@/hooks/useStakeholderIssues";
import { useTeams } from "@/hooks/useTeams";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { EmptyState, InlineSpinner } from "@/components/ui";
import { validateRequiredFieldsForResolution } from "@/lib/validation/schemas/stakeholder-issues";
import { formatDisplayValue, getFieldLabel } from "@/lib/utils/step-data-utils";
import { toast } from "sonner";
import {
  X,
  Ticket,
  User,
  UsersThree,
  Building,
  Tag,
  Calendar,
  Clock,
  Link as LinkIcon,
  Download,
  PencilSimple,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ListChecks,
  CaretDown,
  CaretRight,
  WarningCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react";

// Enriched linked field for display
interface EnrichedLinkedField extends LinkedStepField {
  currentValue?: any;
}

// Linked step data item (legacy support)
interface LinkedStepDataItem {
  id: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  data: Record<string, any>;
  fieldDefinitions?: any;
}

export interface TicketViewModalProps {
  /** Ticket ID to display */
  ticketId: number;
  /** Called when modal is closed */
  onClose: () => void;
  /** Called when ticket is updated successfully */
  onSuccess?: () => void;
  /** Called when user wants to edit the ticket */
  onEdit?: (ticket: StakeholderIssue) => void;
  /** Whether the user can edit the ticket */
  canEdit?: boolean;
  /** Whether the user can delete the ticket */
  canDelete?: boolean;
}

export function TicketViewModal({
  ticketId,
  onClose,
  onSuccess,
  onEdit,
  canEdit = true,
  canDelete = true,
}: TicketViewModalProps) {
  const { employeeInfo } = useAuth();
  const { getEmployeeTeamIds, fetchTeamWithMembers } = useTeams();
  const { createNotification } = useNotifications();
  const {
    fetchIssueById,
    fetchStakeholderStepData,
    updateIssue,
    deleteIssue,
    getAttachmentUrl,
    approveResolution,
    rejectResolution,
    loading: hookLoading,
  } = useStakeholderIssues();

  const [ticket, setTicket] = useState<StakeholderIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userTeamIds, setUserTeamIds] = useState<number[]>([]);

  // Linked data
  const [linkedFields, setLinkedFields] = useState<EnrichedLinkedField[]>([]);
  const [linkedStepData, setLinkedStepData] = useState<LinkedStepDataItem[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Required fields for resolution
  const [requiredFieldValues, setRequiredFieldValues] = useState<Record<string, string | number | null>>({});
  const [requiredFieldErrors, setRequiredFieldErrors] = useState<Record<string, string>>({});

  // Confirmation dialogs
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check if all required fields are filled
  const areRequiredFieldsFilled = useMemo(() => {
    if (!ticket?.required_fields || ticket.required_fields.length === 0) {
      return true; // No required fields, can resolve
    }
    return ticket.required_fields.every((field: StakeholderIssueRequiredField) => {
      const value = requiredFieldValues[field.key] ?? field.value;
      return value !== null && value !== undefined && value !== '';
    });
  }, [ticket?.required_fields, requiredFieldValues]);

  // Load user team IDs
  useEffect(() => {
    const loadTeamIds = async () => {
      if (employeeInfo?.id) {
        const teamIds = await getEmployeeTeamIds(employeeInfo.id);
        setUserTeamIds(teamIds);
      }
    };
    loadTeamIds();
  }, [employeeInfo?.id, getEmployeeTeamIds]);

  // Load ticket data
  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  // Load linked data when ticket is loaded
  useEffect(() => {
    if (ticket?.stakeholder_id) {
      loadLinkedData();
    }
  }, [ticket]);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIssueById(ticketId);
      if (data) {
        setTicket(data);
        // Populate required field values
        if (data.required_fields && data.required_fields.length > 0) {
          const values: Record<string, string | number | null> = {};
          data.required_fields.forEach((field: StakeholderIssueRequiredField) => {
            values[field.key] = field.value ?? null;
          });
          setRequiredFieldValues(values);
        }
      } else {
        setError("Ticket not found");
      }
    } catch (err) {
      console.error("Error loading ticket:", err);
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedData = async () => {
    if (!ticket?.stakeholder_id) return;

    try {
      const allStepData = await fetchStakeholderStepData(ticket.stakeholder_id);

      // Handle new linked_fields format
      if (ticket.linked_fields && ticket.linked_fields.length > 0) {
        const enrichedFields: EnrichedLinkedField[] = ticket.linked_fields.map((field: LinkedStepField) => {
          const stepData = allStepData.find((sd: any) => sd.id === field.stepDataId);
          const stepInfo = Array.isArray(stepData?.step) ? stepData?.step[0] : stepData?.step;
          return {
            ...field,
            stepName: field.stepName || stepInfo?.name || `Step ${field.stepDataId}`,
            stepOrder: field.stepOrder || stepInfo?.step_order || 0,
            fieldLabel: field.fieldLabel || getFieldLabel(field.fieldKey, stepInfo?.field_definitions),
            currentValue: stepData?.data?.[field.fieldKey],
          };
        });
        setLinkedFields(enrichedFields);
        setLinkedStepData([]);
      }
      // Legacy support
      else if (ticket.linked_step_data_ids && ticket.linked_step_data_ids.length > 0) {
        const linked = allStepData
          .filter((sd: any) => ticket.linked_step_data_ids?.includes(sd.id))
          .map((sd: any) => {
            const stepInfo = Array.isArray(sd.step) ? sd.step[0] : sd.step;
            return {
              id: sd.id,
              stepName: stepInfo?.name || `Step ${sd.step_id}`,
              stepOrder: stepInfo?.step_order || 0,
              isCompleted: sd.is_completed,
              data: sd.data || {},
              fieldDefinitions: stepInfo?.field_definitions,
            };
          })
          .sort((a: LinkedStepDataItem, b: LinkedStepDataItem) => a.stepOrder - b.stepOrder);

        setLinkedStepData(linked);
        setLinkedFields([]);
      }
    } catch (err) {
      console.error("Error loading linked data:", err);
    }
  };

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
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

  const handleMarkAsResolved = async () => {
    if (!ticket?.id) return;

    // Validate required fields
    if (ticket.required_fields && ticket.required_fields.length > 0) {
      const updatedFields = ticket.required_fields.map((field: StakeholderIssueRequiredField) => ({
        ...field,
        value: requiredFieldValues[field.key] ?? field.value,
      }));

      const errors = validateRequiredFieldsForResolution(updatedFields);
      if (errors.length > 0) {
        const errorObj: Record<string, string> = {};
        errors.forEach((err) => {
          // err.field is already in format "required_field_${key}"
          errorObj[err.field] = err.message;
        });
        setRequiredFieldErrors(errorObj);
        toast.error("Please fill all required fields before resolving");
        return;
      }
      setRequiredFieldErrors({});
    }

    setSubmitting(true);
    try {
      const updateData: any = { status: "Resolved" };

      if (ticket.required_fields && ticket.required_fields.length > 0) {
        updateData.required_fields = ticket.required_fields.map((field: StakeholderIssueRequiredField) => ({
          ...field,
          value: requiredFieldValues[field.key] ?? field.value,
        }));
      }

      await updateIssue(ticket.id, updateData);

      // Notify checker team members if checker team exists
      if (ticket.checker_team_id && employeeInfo?.company_id) {
        try {
          const checkerTeam = await fetchTeamWithMembers(ticket.checker_team_id);
          if (checkerTeam?.members && checkerTeam.members.length > 0) {
            const checkerMemberIds = checkerTeam.members.map(m => m.employee_id);
            await createNotification({
              title: "Ticket Pending Approval",
              message: `Ticket "${ticket.title}" has been marked as resolved and requires your approval.`,
              priority: 'normal',
              type_id: 1, // General notification type
              recipient_id: checkerMemberIds,
              action_url: `/ops/stakeholder-issues`,
              company_id: Number(employeeInfo.company_id),
              department_id: employeeInfo.department_id ? Number(employeeInfo.department_id) : undefined,
            });
          }
        } catch (notifyError) {
          console.error("Error notifying checker team:", notifyError);
          // Don't fail the resolution if notification fails
        }
      }

      toast.success("Ticket marked as resolved");
      setShowResolveConfirm(false);
      onSuccess?.();
      loadTicket();
    } catch (error) {
      console.error("Error resolving ticket:", error);
      toast.error("Failed to resolve ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!ticket?.id) return;

    setSubmitting(true);
    try {
      await updateIssue(ticket.id, { status: "In Progress" });
      toast.success("Ticket reopened");
      loadTicket();
    } catch (error) {
      console.error("Error reopening ticket:", error);
      toast.error("Failed to reopen ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveResolution = async () => {
    if (!ticket?.id) return;

    setSubmitting(true);
    try {
      await approveResolution(ticket.id);
      toast.success("Resolution approved");
      onSuccess?.();
      loadTicket();
    } catch (error) {
      console.error("Error approving resolution:", error);
      toast.error("Failed to approve resolution");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectResolution = async () => {
    if (!ticket?.id || !rejectionReason.trim()) return;

    setSubmitting(true);
    try {
      await rejectResolution(ticket.id, rejectionReason);
      toast.success("Resolution rejected");
      setShowRejectConfirm(false);
      setRejectionReason("");
      onSuccess?.();
      loadTicket();
    } catch (error) {
      console.error("Error rejecting resolution:", error);
      toast.error("Failed to reject resolution");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket?.id) return;

    setSubmitting(true);
    try {
      await deleteIssue(ticket.id);
      toast.success("Ticket deleted");
      setShowDeleteConfirm(false);
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if current user is in the checker team
  const isInCheckerTeam =
    ticket?.checker_team_id &&
    userTeamIds.includes(ticket.checker_team_id);

  // Check if ticket is pending approval from checker team
  const isPendingApproval = ticket?.is_pending_checker_approval && ticket?.status === "Pending Approval";

  // Check if user can take actions on the ticket (assigned to resolve)
  const canTakeAction =
    ticket?.assigned_to === employeeInfo?.id ||
    (ticket?.assigned_team_id && userTeamIds.includes(ticket.assigned_team_id));

  // Check if user is the creator (only creators can edit the ticket details)
  const isCreator = ticket?.created_by === employeeInfo?.id;

  // Effective edit permission: must have canEdit prop AND be the creator
  const effectiveCanEdit = canEdit && isCreator;

  // Effective delete permission: must have canDelete prop AND be the creator
  const effectiveCanDelete = canDelete && isCreator;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-surface-primary rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-surface-primary border-b border-border-primary px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Ticket size={24} weight="duotone" className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground-primary">Ticket Details</h2>
                {ticket && (
                  <p className="text-sm text-foreground-tertiary">ID: #{ticket.id}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-full transition-colors"
            >
              <X size={20} weight="bold" className="text-foreground-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <InlineSpinner size="lg" color="primary" />
              </div>
            ) : error ? (
              <EmptyState
                icon={XCircle}
                title="Error loading ticket"
                description={error}
                action={{
                  label: "Try Again",
                  onClick: loadTicket,
                }}
              />
            ) : ticket ? (
              <div className="space-y-6">
                {/* Title & Status Section */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold text-foreground-primary flex-1">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={ticket.status} size="sm" />
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  {ticket.category && (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: ticket.category.color }}
                      >
                        <Tag size={14} />
                        {ticket.category.name}
                        {ticket.subcategory && (
                          <span className="opacity-75">/ {ticket.subcategory.name}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Approval status */}
                  {ticket.is_pending_checker_approval && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg">
                      <ShieldCheck size={18} className="text-warning" />
                      <span className="text-sm text-warning font-medium">Awaiting checker team approval</span>
                    </div>
                  )}
                  {ticket.checker_rejection_reason && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-error/10 border border-error/30 rounded-lg">
                      <XCircle size={18} className="text-error mt-0.5" />
                      <div>
                        <span className="text-sm text-error font-medium">Resolution Rejected</span>
                        <p className="text-sm text-error/80">{ticket.checker_rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <Card className="border border-border-primary">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Stakeholder */}
                      {ticket.stakeholder && (
                        <InfoItem
                          icon={<Building size={18} />}
                          label="Stakeholder"
                          value={ticket.stakeholder.name}
                        />
                      )}

                      {/* Assigned To */}
                      <InfoItem
                        icon={ticket.assigned_team ? <UsersThree size={18} /> : <User size={18} />}
                        label="Assigned To"
                        value={
                          ticket.assigned_team
                            ? `${ticket.assigned_team.name} (Team)`
                            : ticket.assigned_employee
                            ? ticket.assigned_employee.name
                            : "Unassigned"
                        }
                      />

                      {/* Checker Team */}
                      {ticket.checker_team && (
                        <InfoItem
                          icon={<ShieldCheck size={18} />}
                          label="Checker Team"
                          value={ticket.checker_team.name}
                        />
                      )}

                      {/* Created */}
                      <InfoItem
                        icon={<Calendar size={18} />}
                        label="Created"
                        value={
                          <>
                            {formatDateTime(ticket.created_at)}
                            {ticket.creator && (
                              <span className="text-foreground-tertiary"> by {ticket.creator.name}</span>
                            )}
                          </>
                        }
                      />

                      {/* Resolved */}
                      {ticket.resolved_at && (
                        <InfoItem
                          icon={<CheckCircle size={18} />}
                          label="Resolved"
                          value={formatDateTime(ticket.resolved_at)}
                        />
                      )}

                      {/* Approved */}
                      {ticket.checker_approved_at && (
                        <InfoItem
                          icon={<ShieldCheck size={18} />}
                          label="Approved"
                          value={formatDateTime(ticket.checker_approved_at)}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {ticket.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground-primary mb-2">Description</h4>
                    <div className="p-4 bg-background-secondary rounded-lg">
                      <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Required Fields */}
                {ticket.required_fields && ticket.required_fields.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks size={18} className="text-foreground-secondary" />
                      <h4 className="text-sm font-semibold text-foreground-primary">
                        Required Fields for Resolution
                      </h4>
                    </div>
                    <div className="border border-border-primary rounded-lg p-4 bg-background-secondary space-y-3">
                      {ticket.required_fields.map((field: StakeholderIssueRequiredField) => (
                        <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2 sm:min-w-48">
                            <span className="text-sm font-medium text-foreground-secondary">
                              {field.label}
                            </span>
                            {field.required && (
                              <span className="px-1.5 py-0.5 text-xs bg-error/10 text-error rounded">
                                Required
                              </span>
                            )}
                          </div>
                          {ticket.status !== "Resolved" && ticket.status !== "Pending Approval" && canTakeAction ? (
                            <div className="flex-1">
                              {field.type === "select" ? (
                                <select
                                  value={requiredFieldValues[field.key] ?? field.value ?? ""}
                                  onChange={(e) =>
                                    setRequiredFieldValues((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value || null,
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select...</option>
                                  {field.options?.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                  value={requiredFieldValues[field.key] ?? field.value ?? ""}
                                  onChange={(e) =>
                                    setRequiredFieldValues((prev) => ({
                                      ...prev,
                                      [field.key]:
                                        field.type === "number"
                                          ? e.target.value
                                            ? Number(e.target.value)
                                            : null
                                          : e.target.value || null,
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                              )}
                              {requiredFieldErrors[`required_field_${field.key}`] && (
                                <p className="text-xs text-error mt-1">
                                  {requiredFieldErrors[`required_field_${field.key}`]}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`text-sm ${
                                field.value ? "text-foreground-primary" : "text-foreground-tertiary italic"
                              }`}
                            >
                              {field.value ?? "Not filled"}
                            </span>
                          )}
                        </div>
                      ))}
                      {/* Hint when required fields are not filled */}
                      {canTakeAction && ticket.status !== "Resolved" && ticket.status !== "Pending Approval" && !areRequiredFieldsFilled && (
                        <p className="text-xs text-warning mt-2 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning"></span>
                          Please fill all required fields to mark this ticket as resolved
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Linked Fields */}
                {linkedFields.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon size={18} className="text-primary-600" />
                      <h4 className="text-sm font-semibold text-foreground-primary">
                        Linked Fields ({linkedFields.length})
                      </h4>
                    </div>
                    <LinkedFieldsSection linkedFields={linkedFields} />
                  </div>
                )}

                {/* Legacy: Linked Step Data */}
                {linkedStepData.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon size={18} className="text-primary-600" />
                      <h4 className="text-sm font-semibold text-foreground-primary">
                        Linked Steps ({linkedStepData.length})
                      </h4>
                    </div>
                    <LinkedStepsSection
                      linkedStepData={linkedStepData}
                      expandedSteps={expandedSteps}
                      onToggle={toggleStepExpansion}
                    />
                  </div>
                )}

                {/* Attachments */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground-primary mb-2">
                      Attachments ({ticket.attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((attachment, index) => (
                        <button
                          key={index}
                          onClick={() => handleDownloadAttachment(attachment.path, attachment.originalName)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-background-tertiary hover:bg-surface-hover rounded-lg transition-colors"
                        >
                          <Download size={16} />
                          {attachment.originalName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolve Confirmation */}
                {showResolveConfirm && (
                  <div className="border border-success/30 bg-success/5 rounded-lg p-4">
                    <h4 className="font-semibold text-success mb-2">Confirm Resolution</h4>
                    <p className="text-sm text-foreground-secondary mb-4">
                      Are you sure you want to mark this ticket as resolved?
                      {ticket.checker_team && " It will be sent to the checker team for approval."}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleMarkAsResolved}
                        disabled={submitting}
                        isLoading={submitting}
                        className="bg-success hover:bg-success/90"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowResolveConfirm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reject Confirmation */}
                {showRejectConfirm && (
                  <div className="border border-error/30 bg-error/5 rounded-lg p-4">
                    <h4 className="font-semibold text-error mb-2">Reject Resolution</h4>
                    <p className="text-sm text-foreground-secondary mb-3">
                      Please provide a reason for rejecting this resolution:
                    </p>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleRejectResolution}
                        disabled={submitting || !rejectionReason.trim()}
                        isLoading={submitting}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowRejectConfirm(false);
                          setRejectionReason("");
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <div className="border border-error/30 bg-error/5 rounded-lg p-4">
                    <h4 className="font-semibold text-error mb-2">Delete Ticket</h4>
                    <p className="text-sm text-foreground-secondary mb-4">
                      Are you sure you want to delete this ticket? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleDeleteTicket}
                        disabled={submitting}
                        isLoading={submitting}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          {ticket && !loading && !error && (
            <div className="sticky bottom-0 bg-surface-primary border-t border-border-primary px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left side - Status actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Checker team approval actions */}
                  {isPendingApproval && isInCheckerTeam && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleApproveResolution}
                        disabled={submitting}
                        className="bg-success hover:bg-success/90 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={submitting}
                        className="flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </Button>
                    </>
                  )}

                  {/* Mark as Resolved (for assigned users) */}
                  {canTakeAction &&
                    ticket.status !== "Resolved" &&
                    ticket.status !== "Pending Approval" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowResolveConfirm(true)}
                        disabled={submitting || showResolveConfirm || !areRequiredFieldsFilled}
                        title={!areRequiredFieldsFilled ? "Please fill all required fields before resolving" : undefined}
                        className="bg-success hover:bg-success/90 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Mark as Resolved
                      </Button>
                    )}

                  {/* Reopen ticket */}
                  {canTakeAction && ticket.status === "Resolved" && !ticket.checker_approved_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReopenTicket}
                      disabled={submitting}
                      className="flex items-center gap-2"
                    >
                      <ArrowsClockwise size={16} />
                      Reopen
                    </Button>
                  )}
                </div>

                {/* Right side - Edit/Delete (only for creators) */}
                <div className="flex items-center gap-2">
                  {effectiveCanEdit && onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(ticket)}
                      disabled={submitting}
                      className="flex items-center gap-2"
                    >
                      <PencilSimple size={16} />
                      Edit
                    </Button>
                  )}
                  {effectiveCanDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={submitting || showDeleteConfirm}
                      className="text-error border-error/30 hover:bg-error/10 flex items-center gap-2"
                    >
                      <X size={16} />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper component for info items
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-foreground-tertiary mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-foreground-tertiary uppercase tracking-wide">{label}</p>
        <p className="text-sm text-foreground-primary">{value}</p>
      </div>
    </div>
  );
}

// Linked Fields Section
function LinkedFieldsSection({ linkedFields }: { linkedFields: EnrichedLinkedField[] }) {
  // Group by step
  const groupedByStep = linkedFields.reduce((acc, field) => {
    const key = field.stepDataId;
    if (!acc[key]) {
      acc[key] = {
        stepName: field.stepName || `Step ${field.stepDataId}`,
        stepOrder: field.stepOrder || 0,
        fields: [],
      };
    }
    acc[key].fields.push(field);
    return acc;
  }, {} as Record<number, { stepName: string; stepOrder: number; fields: EnrichedLinkedField[] }>);

  return (
    <div className="space-y-2">
      {Object.entries(groupedByStep)
        .sort(([, a], [, b]) => a.stepOrder - b.stepOrder)
        .map(([stepDataId, group]) => (
          <div key={stepDataId} className="border border-border-primary rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-surface-secondary border-b border-border-primary">
              <span className="text-xs font-medium text-foreground-secondary">{group.stepName}</span>
            </div>
            <div className="p-3 space-y-2">
              {group.fields.map((field, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-foreground-secondary">{field.fieldLabel || field.fieldKey}:</span>
                  <div className="text-right">
                    <span className="text-foreground-primary font-medium">
                      {formatDisplayValue(field.fieldValue)}
                    </span>
                    {field.currentValue !== undefined && field.currentValue !== field.fieldValue && (
                      <span className="text-xs text-foreground-tertiary ml-2">
                        (current: {formatDisplayValue(field.currentValue)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// Legacy: Linked Steps Section
function LinkedStepsSection({
  linkedStepData,
  expandedSteps,
  onToggle,
}: {
  linkedStepData: LinkedStepDataItem[];
  expandedSteps: Set<number>;
  onToggle: (stepId: number) => void;
}) {
  return (
    <div className="space-y-2">
      {linkedStepData.map((step) => (
        <div key={step.id} className="border border-border-primary rounded-lg overflow-hidden">
          <button
            onClick={() => onToggle(step.id)}
            className="w-full px-3 py-2 bg-surface-secondary border-b border-border-primary flex items-center justify-between hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSteps.has(step.id) ? (
                <CaretDown size={14} />
              ) : (
                <CaretRight size={14} />
              )}
              <span className="text-xs font-medium text-foreground-secondary">{step.stepName}</span>
            </div>
            {step.isCompleted && (
              <CheckCircle size={14} className="text-success" />
            )}
          </button>
          {expandedSteps.has(step.id) && (
            <div className="p-3 space-y-2">
              {Object.entries(step.data).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="text-foreground-secondary">
                    {getFieldLabel(key, step.fieldDefinitions) || key}:
                  </span>
                  <span className="text-foreground-primary font-medium">
                    {formatDisplayValue(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TicketViewModal;
