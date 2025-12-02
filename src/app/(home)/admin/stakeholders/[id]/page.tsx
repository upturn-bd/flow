"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/lib/auth/auth-context";
import { getPublicFileUrl } from "@/lib/utils/files";
import { calculateFieldValue, formatCalculatedValue, formulaToReadable } from "@/lib/utils/formula-evaluator";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Phone,
  User,
  Edit,
  Trash,
  WarningCircle,
  FileText,
  Download,
  DollarSign,
  Database,
  Calculator,
} from "@/lib/icons";
import { Stakeholder, StakeholderProcessStep, StakeholderStepData } from "@/lib/types/schemas";
import StepDataForm from "@/components/stakeholder-processes/StepDataForm";
import StakeholderIssuesTab from "@/components/stakeholder-issues/StakeholderIssuesTab";
import StakeholderTransactions from "@/components/stakeholders/StakeholderTransactions";
import AdditionalDataModal from "@/components/stakeholders/AdditionalDataModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";

// Helper to convert programming values to human-readable labels
const toHumanReadable = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function StakeholderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const stakeholderId = parseInt(id);

  const {
    loading,
    error,
    fetchStakeholderById,
    fetchStakeholderStepData,
    deleteStakeholder,
    uncompleteStep,
    updateAdditionalData,
  } = useStakeholders();

  const { getEmployeeTeamIds } = useTeams();
  const { hasPermission } = useAuth();

  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [stepData, setStepData] = useState<StakeholderStepData[]>([]);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"process" | "issues" | "transactions">("process");
  const [userTeamIds, setUserTeamIds] = useState<number[]>([]);
  const [showAdditionalDataModal, setShowAdditionalDataModal] = useState(false);

  // Load user's team memberships on mount
  useEffect(() => {
    const loadUserTeams = async () => {
      try {
        const teamIds = await getEmployeeTeamIds();
        setUserTeamIds(teamIds);
      } catch (err) {
        console.error("Error loading user teams:", err);
      }
    };
    loadUserTeams();
  }, [getEmployeeTeamIds]);

  useEffect(() => {
    const loadStakeholder = async () => {
      try {
        const data = await fetchStakeholderById(stakeholderId);
        if (data) {
          setStakeholder(data);
          await loadStepData(stakeholderId);
        }
      } catch (err) {
        console.error("Error loading stakeholder:", err);
      }
    };
    loadStakeholder();
  }, [stakeholderId, fetchStakeholderById]);

  // Change active tab when stakeholder loads if permanent stakeholder
  useEffect(() => {
    if (stakeholder) {
      if (stakeholder.status === "Permanent") {
        setActiveTab("transactions");
      } else {
        setActiveTab("process");
      }
    }
  }, [stakeholder]);

  const loadStepData = async (id: number) => {
    try {
      const data = await fetchStakeholderStepData(id);
      setStepData(data || []);
    } catch (err) {
      console.error("Error loading step data:", err);
      setStepData([]);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStakeholder(stakeholderId);
      router.push("/admin/stakeholders");
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStepComplete = async () => {
    // Force a fresh reload by clearing state first
    setStakeholder(null);
    setStepData([]);
    
    // Reload step data and stakeholder data with fresh queries
    await loadStepData(stakeholderId);
    const data = await fetchStakeholderById(stakeholderId);
    if (data) {
      console.log('After completion - Stakeholder data:', {
        current_step_id: data.current_step_id,
        current_step_order: data.current_step_order,
        is_completed: data.is_completed,
        is_sequential: data.process?.is_sequential,
        total_steps: data.process?.steps?.length,
        completed_steps_count: data.step_data?.filter((sd: any) => sd.is_completed).length
      });
      setStakeholder(data);
      
      // If stakeholder just became permanent and has no additional data, show the modal
      if (data.status === 'Permanent' && (!data.additional_data || Object.keys(data.additional_data).length === 0)) {
        setTimeout(() => {
          setShowAdditionalDataModal(true);
          toast.info("All steps completed! Please add additional data for this permanent stakeholder.");
        }, 500);
      }
    }
    setActiveStepId(null);
  };

  const handleStepRollback = async (stepId: number) => {
    if (!stepId) return;
    
    try {
      await uncompleteStep(stakeholderId, stepId);
      // Reload fresh stakeholder data to update current_step_id
      await loadStepData(stakeholderId);
      const data = await fetchStakeholderById(stakeholderId);
      if (data) {
        setStakeholder(data);
      }
    } catch (error) {
      console.error("Error rolling back step:", error);
    }
  };

  const handleSaveAdditionalData = async (data: Record<string, any>) => {
    try {
      const success = await updateAdditionalData(stakeholderId, data);
      if (success) {
        toast.success("Additional data updated successfully");
        // Reload stakeholder to get updated data
        const updatedStakeholder = await fetchStakeholderById(stakeholderId);
        if (updatedStakeholder) {
          setStakeholder(updatedStakeholder);
        }
      } else {
        toast.error("Failed to update additional data");
      }
    } catch (error) {
      console.error("Error rolling back step:", error);
    }
  };

  if (loading && !stakeholder) {
    return (
      <LoadingSpinner
        icon={User}
        text="Loading stakeholder..."
        color="blue"
        height="min-h-screen"
      />
    );
  }

  if (!stakeholder) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            icon={WarningCircle}
            title="Stakeholder Not Found"
            description="The stakeholder you're looking for doesn't exist or has been deleted."
            action={{
              label: "Back to Stakeholders",
              onClick: () => router.push("/admin/stakeholders")
            }}
          />
        </div>
      </div>
    );
  }

  const processSteps = stakeholder.process?.steps || [];
  const sortedSteps = [...processSteps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary mb-3 sm:mb-4 text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground-primary break-words">{stakeholder.name}</h1>
              {stakeholder.status === "Rejected" ? (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800 flex-shrink-0">
                  <WarningCircle size={14} />
                  Rejected
                </span>
              ) : stakeholder.is_completed || stakeholder.status === "Permanent" ? (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 flex-shrink-0">
                  <CheckCircle size={14} />
                  Stakeholder
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                  <Clock size={14} />
                  Lead
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-foreground-secondary mt-1 break-words">
              Process: {stakeholder.process?.name || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/admin/stakeholders/${stakeholder.id}/edit`)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-foreground-secondary border border-border-secondary rounded-lg hover:bg-background-secondary dark:bg-background-tertiary"
            >
              <Edit size={14} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              <Trash size={14} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Additional Data Prompt Banner - for Permanent stakeholders without additional data */}
      {stakeholder.status === "Permanent" && (!stakeholder.additional_data || Object.keys(stakeholder.additional_data).length === 0) && (
        <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-3">
            <Database className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-800">Add Additional Data</p>
              <p className="text-sm text-blue-700 mt-1">
                This stakeholder is now permanent. Add additional data from completed steps or create custom fields.
              </p>
              <button
                onClick={() => setShowAdditionalDataModal(true)}
                className="mt-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Data Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Warning Banner */}
      {stakeholder.status === "Rejected" && (
        <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-3">
            <WarningCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800">This stakeholder has been rejected</p>
              {stakeholder.rejection_reason && (
                <p className="text-sm text-red-700 mt-1">
                  Reason: {stakeholder.rejection_reason}
                </p>
              )}
              {stakeholder.rejected_at && (
                <p className="text-xs text-red-600 mt-1">
                  Rejected on {new Date(stakeholder.rejected_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <div className="bg-surface-primary rounded-lg border border-border-primary p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground-primary">Information</h2>

            {stakeholder.stakeholder_type && (
              <div className="flex items-start gap-3">
                <FileText className="text-foreground-tertiary mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">Type</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {stakeholder.stakeholder_type.name}
                    </span>
                  </p>
                  {stakeholder.stakeholder_type.description && (
                    <p className="text-xs text-foreground-tertiary mt-1">
                      {stakeholder.stakeholder_type.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {stakeholder.address && (
              <div className="flex items-start gap-3">
                <MapPin className="text-foreground-tertiary mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">Address</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">{stakeholder.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="text-foreground-tertiary mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Created</p>
                <p className="text-sm text-foreground-secondary mt-0.5">
                  {stakeholder.created_at
                    ? new Date(stakeholder.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {stakeholder.completed_at && (
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">Completed</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    {new Date(stakeholder.completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Rejection Information */}
            {stakeholder.status === "Rejected" && (
              <>
                {stakeholder.rejected_at && (
                  <div className="flex items-start gap-3">
                    <WarningCircle className="text-red-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Rejected On</p>
                      <p className="text-sm text-foreground-secondary mt-0.5">
                        {new Date(stakeholder.rejected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {stakeholder.rejected_by && (
                  <div className="flex items-start gap-3">
                    <User className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Rejected By</p>
                      <p className="text-sm text-foreground-secondary mt-0.5">
                        {stakeholder.rejected_by.name}
                      </p>
                    </div>
                  </div>
                )}
                {stakeholder.rejection_reason && (
                  <div className="flex items-start gap-3">
                    <FileText className="text-red-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Rejection Reason</p>
                      <p className="text-sm text-foreground-secondary mt-0.5">
                        {stakeholder.rejection_reason}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* KAM Information */}
            {stakeholder.kam && (
              <div className="flex items-start gap-3">
                <User className="text-foreground-tertiary mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">KAM</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">{stakeholder.kam.name}</p>
                </div>
              </div>
            )}

          </div>

          {/* Contact Persons */}
          <div className="bg-surface-primary rounded-lg border border-border-primary p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground-primary">Contact Persons</h2>

            {stakeholder.contact_persons && stakeholder.contact_persons.length > 0 ? (
              <div className="space-y-4">
                {stakeholder.contact_persons.map((contact, index) => (
                  <div key={index} className="border-t border-border-primary pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-3 mb-2">
                      <User className="text-foreground-tertiary mt-0.5" size={18} />
                      <p className="text-sm font-medium text-foreground-primary">{contact.name}</p>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-3 ml-9 mb-1">
                        <Mail className="text-foreground-tertiary" size={16} />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3 ml-9">
                        <Phone className="text-foreground-tertiary" size={16} />
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-tertiary">No contact persons added</p>
            )}
          </div>

          {/* Additional Data - Only show for Permanent stakeholders */}
          {stakeholder.status === "Permanent" && (
            <div className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-foreground-primary">Additional Data</h2>
                <button
                  onClick={() => setShowAdditionalDataModal(true)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                >
                  <Edit size={16} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>

              {stakeholder.additional_data && Object.keys(stakeholder.additional_data).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(stakeholder.additional_data).map(([key, value]) => (
                    <div key={key} className="border-t border-border-primary pt-3 first:border-t-0 first:pt-0 sm:border-t-0 sm:pt-0">
                      <div className="flex items-start gap-3">
                        <Database className="text-foreground-tertiary mt-0.5 flex-shrink-0" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-foreground-secondary break-words">{key}</p>
                          <p className="text-xs sm:text-sm text-foreground-secondary mt-0.5 break-words">
                            {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-foreground-tertiary">
                  No additional data added. Click "Edit" to add data.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Process Steps */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-surface-primary rounded-lg border border-border-primary overflow-hidden">
            <div className="border-b border-border-primary">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("process")}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "process"
                      ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-950"
                      : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary"
                    }`}
                >
                  Process Steps
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === "issues"
                      ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-950"
                      : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary"
                    }`}
                >
                  Issues
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "transactions"
                      ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-950"
                      : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-secondary dark:bg-background-tertiary"
                    }`}
                >
                  <DollarSign size={16} />
                  Transactions
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {activeTab === "process" ? (
                // Process Steps Content
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground-primary mb-4 sm:mb-6">Process Steps</h2>

                  {sortedSteps.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-foreground-tertiary">
                      No steps configured for this process
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {sortedSteps.map((step, index) => {
                        const stepDataEntry = stepData.find((sd) => sd.step_id === step.id);
                        const isCompleted = stepDataEntry?.is_completed || false;
                        const isCurrent = stakeholder.current_step_id === step.id;
                        const isSequential = stakeholder.process?.is_sequential || false;

                        // Check if user can edit this step:
                        // Both sequential and independent processes: allow editing incomplete steps
                        // Sequential: only current step
                        // Independent: any incomplete step
                        const stepTeamIds = step.team_ids && step.team_ids.length > 0 
                          ? step.team_ids 
                          : (step.team_ids ? step.team_ids : []);
                        const isTeamMember = stepTeamIds.some(teamId => userTeamIds.includes(teamId));
                        const hasFullWritePermission = hasPermission('stakeholders', 'can_write');
                        const hasTeamAccess = isTeamMember || hasFullWritePermission;

                        // Determine if step can be edited based on completion status and access
                        const canEdit = !isCompleted &&
                          hasTeamAccess &&
                          (isSequential ? isCurrent : true);

                        // Determine if this step can be rolled back
                        // Allow rollback of any completed step when rollback is enabled
                        const canRollback = (() => {
                          if (!isCompleted || !stakeholder.process?.allow_rollback || !hasTeamAccess || !step.id) {
                            return false;
                          }

                          // For both sequential and non-sequential processes,
                          // allow rollback of any completed step
                          return true;
                        })();

                        return (
                          <div
                            key={step.id}
                            className={`border rounded-lg ${
                              isCompleted
                                ? "border-green-300 bg-green-50"
                                : isCurrent
                                  ? "border-primary-300 bg-primary-50 dark:bg-primary-950 dark:border-primary-700"
                                  : canEdit && !isSequential
                                    ? "border-blue-200 bg-blue-25"
                                    : "border-border-primary bg-surface-secondary"
                              }`}
                          >
                            <div className="p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                  <div
                                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${isCompleted
                                        ? "bg-green-500 text-white"
                                        : isCurrent
                                          ? "bg-blue-500 text-white"
                                          : "bg-gray-300 text-foreground-secondary"
                                      }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle size={16} />
                                    ) : (
                                      <span>{step.step_order}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground-primary break-words">{step.name}</h3>
                                    {step.description && (
                                      <p className="text-xs sm:text-sm text-foreground-secondary mt-1 break-words">{step.description}</p>
                                    )}
                                    <div className="flex items-center flex-wrap gap-2 sm:gap-4 mt-2 text-xs text-foreground-tertiary">
                                      <span>
                                        {step.teams && step.teams.length > 1 ? "Teams: " : "Team: "}
                                        {step.teams && step.teams.length > 0 ? (
                                          step.teams.map((team, idx) => (
                                            <span key={team.id}>
                                              {team.name}
                                              {idx < step.teams!.length - 1 && ", "}
                                            </span>
                                          ))
                                        ) : step.team?.name ? (
                                          step.team.name
                                        ) : (
                                          "N/A"
                                        )}
                                      </span>
                                    </div>
                                    {/* Show permission/access warnings */}
                                    {!isCompleted && !hasTeamAccess && (
                                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded break-words">
                                        You must be a member of {
                                          step.teams && step.teams.length > 0 
                                            ? `one of these teams: ${step.teams.map(t => t.name).join(', ')}`
                                            : step.team?.name 
                                              ? `the ${step.team.name} team`
                                              : "the assigned team"
                                        } to work on this step
                                      </div>
                                    )}
                                    {!isCompleted && hasTeamAccess && isSequential && !isCurrent && (
                                      <div className="mt-2 text-xs text-foreground-secondary bg-background-secondary dark:bg-background-tertiary px-2 py-1 rounded break-words">
                                        This step will become available after completing the previous steps (sequential process)
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end">
                                  {canEdit && (
                                    <button
                                      onClick={() =>
                                        setActiveStepId(activeStepId === step.id ? null : (step.id || null))
                                      }
                                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white text-xs sm:text-sm rounded-lg hover:bg-primary-700 whitespace-nowrap"
                                    >
                                      {activeStepId === step.id ? "Cancel" : "Work on Step"}
                                    </button>
                                  )}
                                  {canRollback && (
                                    <button
                                      onClick={() => {
                                        // For sequential processes, calculate how many steps will be affected
                                        let message = '';
                                        if (isSequential) {
                                          const subsequentSteps = sortedSteps.filter(s => s.step_order > step.step_order);
                                          const completedSubsequentSteps = subsequentSteps.filter(s => {
                                            const sd = stepData.find(d => d.step_id === s.id);
                                            return sd?.is_completed;
                                          });
                                          
                                          if (completedSubsequentSteps.length > 0) {
                                            message = `Are you sure you want to rollback to "${step.name}"? This will also uncomplete ${completedSubsequentSteps.length} subsequent step(s): ${completedSubsequentSteps.map(s => s.name).join(', ')}`;
                                          } else {
                                            message = `Are you sure you want to rollback "${step.name}"?`;
                                          }
                                        } else {
                                          message = `Are you sure you want to rollback "${step.name}"? This will mark it as incomplete.`;
                                        }
                                        
                                        if (window.confirm(message)) {
                                          handleStepRollback(step.id!);
                                        }
                                      }}
                                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-600 text-white text-xs sm:text-sm rounded-lg hover:bg-amber-700 flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                                      title="Rollback this step"
                                    >
                                      <ArrowLeft size={14} />
                                      <span className="hidden sm:inline">Rollback</span>
                                      <span className="sm:hidden">Back</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Step Data Form */}
                              {activeStepId === step.id && canEdit && step.id && (
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-primary">
                                  <StepDataForm
                                    stakeholderId={stakeholderId}
                                    step={step}
                                    existingData={stepDataEntry}
                                    completedStepsData={stepData
                                      .filter((sd) => {
                                        // Get all previous steps (step_order < current step)
                                        const sdStep = sortedSteps.find((s) => s.id === sd.step_id);
                                        return sdStep && sdStep.step_order < step.step_order;
                                      })
                                      .map((sd) => {
                                        const sdStep = sortedSteps.find((s) => s.id === sd.step_id);
                                        return {
                                          step_order: sdStep?.step_order || 0,
                                          data: sd.data || {},
                                        };
                                      })}
                                    processSteps={sortedSteps}
                                    onComplete={handleStepComplete}
                                    onCancel={() => setActiveStepId(null)}
                                  />
                                </div>
                              )}

                              {/* Display Completed Data */}
                              {isCompleted && stepDataEntry && (
                                <div className="mt-4 pt-4 border-t border-border-primary">
                                  <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(stepDataEntry.data).map(([key, value]) => {
                                      // Check if this is a file field by looking at the field definitions
                                      const fieldDef = step.field_definitions?.fields?.find(
                                        (f) => f.key === key
                                      );
                                      const isFileField = fieldDef?.type === 'file';
                                      const isMultiSelect = fieldDef?.type === 'multi_select';
                                      const isGeolocation = fieldDef?.type === 'geolocation';
                                      const isCalculated = fieldDef?.type === 'calculated';
                                      const isNumber = fieldDef?.type === 'number';
                                      const fieldLabel = fieldDef?.label || key.replace(/_/g, " ");

                                      // Helper to get file info
                                      const getFileInfo = () => {
                                        if (typeof value === 'object' && value !== null && 'path' in value) {
                                          return {
                                            url: getPublicFileUrl(value.path),
                                            name: value.originalName || value.path.split('/').pop(),
                                            size: value.size,
                                            uploadedAt: value.uploadedAt,
                                          };
                                        } else if (typeof value === 'string') {
                                          // Legacy format
                                          return {
                                            url: getPublicFileUrl(value),
                                            name: value.split('/').pop(),
                                          };
                                        }
                                        return null;
                                      };

                                      const fileInfo = isFileField ? getFileInfo() : null;

                                      // Helper to extract actual value from nested format
                                      const extractActualValue = (val: any) => {
                                        if (val && typeof val === 'object' && 'value' in val) {
                                          return val.value;
                                        }
                                        return val;
                                      };

                                      const actualValue = extractActualValue(value);

                                      // Helper to format value based on field type
                                      const formatValue = () => {
                                        if (typeof actualValue === "boolean") {
                                          return actualValue ? "Yes" : "No";
                                        }
                                        if (isMultiSelect && Array.isArray(actualValue)) {
                                          if (actualValue.length === 0) return "None selected";
                                          // Map values to labels using the field definition options
                                          const options = fieldDef?.options || [];
                                          const labels = actualValue.map(val => {
                                            const option = options.find(opt => opt.value === val);
                                            return option ? option.label : toHumanReadable(val);
                                          });
                                          return labels.join(", ");
                                        }
                                        if (fieldDef?.type === 'dropdown' && typeof actualValue === 'string') {
                                          // Map dropdown value to label
                                          const options = fieldDef?.options || [];
                                          const option = options.find(opt => opt.value === actualValue);
                                          return option ? option.label : toHumanReadable(actualValue);
                                        }
                                        if (isGeolocation && typeof actualValue === 'object' && actualValue !== null && 'latitude' in actualValue && 'longitude' in actualValue) {
                                          return `${actualValue.latitude}, ${actualValue.longitude}`;
                                        }
                                        if (isNumber) {
                                          return typeof actualValue === 'number' ? actualValue.toFixed(2) : String(actualValue);
                                        }
                                        // For string values, check if they look like programming identifiers and convert to human-readable
                                        if (typeof actualValue === 'string' && actualValue.includes('_')) {
                                          return toHumanReadable(actualValue);
                                        }
                                        return String(actualValue);
                                      };

                                      // Render calculated fields with stored value
                                      if (isCalculated && fieldDef?.formula) {
                                        // Use stored calculated value
                                        const calculatedValue = extractActualValue(value);
                                        
                                        return (
                                          <div key={key} className="col-span-2">
                                            <p className="text-xs font-medium text-foreground-tertiary uppercase">
                                              {fieldLabel}
                                              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded normal-case">
                                                <Calculator size={12} />
                                                Calculated
                                              </span>
                                            </p>
                                            <div className="mt-1 flex items-baseline gap-3">
                                              <p className="text-lg font-semibold text-foreground-primary">
                                                {calculatedValue !== null && calculatedValue !== undefined 
                                                  ? formatCalculatedValue(calculatedValue) 
                                                  : "—"}
                                              </p>
                                            </div>
                                            <p className="text-xs text-foreground-tertiary mt-1">
                                              Formula: <code className="bg-background-tertiary dark:bg-surface-secondary px-1 py-0.5 rounded">{formulaToReadable(fieldDef.formula, sortedSteps)}</code>
                                            </p>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div key={key}>
                                          <p className="text-xs font-medium text-foreground-tertiary uppercase">
                                            {fieldLabel}
                                            {isCalculated && (
                                              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded normal-case">
                                                Calculated
                                              </span>
                                            )}
                                          </p>
                                          {isFileField && fileInfo ? (
                                            <div className="mt-1">
                                              <a
                                                href={fileInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                              >
                                                <FileText size={16} />
                                                <span className="truncate">{fileInfo.name}</span>
                                                <Download size={14} />
                                              </a>
                                              {fileInfo.size && (
                                                <p className="text-xs text-foreground-tertiary mt-1">
                                                  {(fileInfo.size / 1024).toFixed(2)} KB
                                                </p>
                                              )}
                                            </div>
                                          ) : isGeolocation && typeof actualValue === 'object' && actualValue !== null && 'latitude' in actualValue && 'longitude' in actualValue ? (
                                            <div className="mt-1">
                                              <p className="text-sm text-foreground-primary flex items-center gap-2">
                                                <MapPin size={14} className="text-foreground-tertiary" />
                                                {actualValue.latitude.toFixed(6)}, {actualValue.longitude.toFixed(6)}
                                              </p>
                                              <a
                                                href={`https://www.google.com/maps?q=${actualValue.latitude},${actualValue.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                              >
                                                View on Google Maps
                                              </a>
                                            </div>
                                          ) : (
                                            <p className="text-sm text-foreground-primary mt-1">
                                              {formatValue()}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {stepDataEntry.completed_at && (
                                    <p className="text-xs text-foreground-tertiary mt-4">
                                      Completed on{" "}
                                      {new Date(stepDataEntry.completed_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : activeTab === "issues" ? (
                // Issues Tab Content
                <StakeholderIssuesTab stakeholderId={stakeholderId} />
              ) : (
                // Transactions Tab Content
                <StakeholderTransactions
                  stakeholderId={stakeholderId}
                  stakeholderName={stakeholder.name}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-base sm:text-lg font-bold text-foreground-primary mb-2">Delete Stakeholder</h3>
            <p className="text-sm text-foreground-secondary mb-4 sm:mb-6">
              Are you sure you want to delete "{stakeholder.name}"? This action cannot be
              undone and will remove all associated step data.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2 border border-border-secondary text-foreground-secondary rounded-lg hover:bg-background-secondary dark:bg-background-tertiary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Data Modal */}
      <AdditionalDataModal
        isOpen={showAdditionalDataModal}
        onClose={() => setShowAdditionalDataModal(false)}
        onSave={handleSaveAdditionalData}
        stepData={stepData}
        processSteps={stakeholder?.process?.steps || []}
        existingData={stakeholder?.additional_data || {}}
        title={stakeholder?.additional_data && Object.keys(stakeholder.additional_data).length > 0 
          ? "Edit Additional Data" 
          : "Select Additional Data"}
      />
    </div>
  );
}
