"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/lib/auth/auth-context";
import { getPublicFileUrl } from "@/lib/utils/files";
import { formatCalculatedValue, formulaToReadable } from "@/lib/utils/formula-evaluator";
import { ArrowLeft, CheckCircle, Clock, Calendar, MapPin, Envelope, Phone, User, PencilSimple, TrashSimple, WarningCircle, FileText, Download, CurrencyDollar, Database, Calculator } from "@phosphor-icons/react";
import { Stakeholder, StakeholderProcessStep, StakeholderStepData } from "@/lib/types/schemas";
import StepDataForm from "@/components/stakeholder-processes/StepDataForm";
import StakeholderIssuesTab from "@/components/stakeholder-issues/StakeholderIssuesTab";
import StakeholderTransactions from "@/components/stakeholders/StakeholderTransactions";
import AdditionalDataModal from "@/components/stakeholders/AdditionalDataModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import { PERMISSION_MODULES } from "@/lib/constants";

// Helper to convert programming values to human-readable labels
const toHumanReadable = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

// Helper to detect if a value looks like coordinates
const isCoordinates = (value: any): { lat: number; lng: number } | null => {
  if (typeof value === "object" && value !== null) {
    const lat = value.lat ?? value.latitude ?? value.Lat ?? value.Latitude;
    const lng = value.lng ?? value.lon ?? value.longitude ?? value.Lng ?? value.Lon ?? value.Longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }
  
  if (typeof value === "string") {
    const match = value.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  
  return null;
};

// Helper to format values for display
const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (value instanceof Date) return value.toLocaleDateString();
  
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map(item => formatDisplayValue(item)).join(", ");
  }
  
  if (typeof value === "object" && value !== null) {
    if ('path' in value) return "[File]";
    
    const coords = isCoordinates(value);
    if (coords) {
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
    
    if ('name' in value) return String(value.name);
    if ('label' in value) return String(value.label);
    if ('title' in value) return String(value.title);
    const keys = Object.keys(value);
    if (keys.length === 0) return "—";
    return keys.map(k => `${toHumanReadable(k)}: ${formatDisplayValue(value[k])}`).join(", ");
  }
  
  if (typeof value === "string") {
    const coords = isCoordinates(value);
    if (coords) {
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
    
    if (!isNaN(Date.parse(value)) && value.includes("-") && value.length >= 10) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    if (/^[a-z]+(_[a-z]+)+$/.test(value)) {
      return toHumanReadable(value);
    }
    
    if (/^[a-z]+([A-Z][a-z]+)+$/.test(value)) {
      return toHumanReadable(value);
    }
  }
  
  return String(value);
};

// Component to render value with optional maps link
const ValueWithMapsLink = ({ value, fieldKey }: { value: any; fieldKey?: string }) => {
  const coords = isCoordinates(value);
  
  if (coords) {
    const mapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    return (
      <span className="inline-flex items-center gap-2 flex-wrap">
        <span>{formatDisplayValue(value)}</span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
        >
          <MapPin size={12} />
          Open in Maps
        </a>
      </span>
    );
  }
  
  return <span>{formatDisplayValue(value)}</span>;
};

export default function OpsStakeholderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const { employeeInfo, canWrite, canDelete, hasPermission } = useAuth();

  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [stepData, setStepData] = useState<StakeholderStepData[]>([]);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"process" | "issues" | "transactions">("process");
  const [userTeamIds, setUserTeamIds] = useState<number[]>([]);
  const [showAdditionalDataModal, setShowAdditionalDataModal] = useState(false);

  // Check if current user can edit this stakeholder
  const canEditStakeholder = () => {
    if (!stakeholder) return false;
    // User is the KAM for this stakeholder
    if (stakeholder.kam_id === employeeInfo?.id) return true;
    // User has write permission for stakeholders module
    if (canWrite(PERMISSION_MODULES.STAKEHOLDERS)) return true;
    return false;
  };

  // Check if current user can delete this stakeholder
  const canDeleteStakeholder = () => {
    if (!stakeholder) return false;
    // User is the KAM and has delete permission
    if (stakeholder.kam_id === employeeInfo?.id && canDelete(PERMISSION_MODULES.STAKEHOLDERS)) return true;
    // User has delete permission for stakeholders module
    if (canDelete(PERMISSION_MODULES.STAKEHOLDERS)) return true;
    return false;
  };

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
    if (!canDeleteStakeholder()) {
      toast.error("You don't have permission to delete this stakeholder");
      return;
    }
    
    setDeleting(true);
    try {
      await deleteStakeholder(stakeholderId);
      router.push("/ops/stakeholders");
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
      toast.error("Failed to delete stakeholder");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStepComplete = async () => {
    setStakeholder(null);
    setStepData([]);
    
    await loadStepData(stakeholderId);
    const data = await fetchStakeholderById(stakeholderId);
    if (data) {
      setStakeholder(data);
      
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
    if (!stepId || !canEditStakeholder()) return;
    
    try {
      await uncompleteStep(stakeholderId, stepId);
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
    if (!canEditStakeholder()) {
      toast.error("You don't have permission to update this stakeholder");
      return;
    }
    
    try {
      const success = await updateAdditionalData(stakeholderId, data);
      if (success) {
        toast.success("Additional data updated successfully");
        const updatedStakeholder = await fetchStakeholderById(stakeholderId);
        if (updatedStakeholder) {
          setStakeholder(updatedStakeholder);
        }
      } else {
        toast.error("Failed to update additional data");
      }
    } catch (error) {
      console.error("Error updating additional data:", error);
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

  if (error || !stakeholder) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          icon={WarningCircle}
          title="Stakeholder Not Found"
          description="The stakeholder you're looking for doesn't exist or you don't have access."
          action={{
            label: "Back to Stakeholders",
            onClick: () => router.push("/ops/stakeholders"),
          }}
        />
      </div>
    );
  }

  const process = stakeholder.process;
  const steps = process?.steps || [];
  const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);

  // Determine which steps the user can access
  const canUserAccessStep = (step: StakeholderProcessStep) => {
    // KAM can access all steps
    if (stakeholder.kam_id === employeeInfo?.id) return true;
    // Admin users can access all steps
    if (canWrite(PERMISSION_MODULES.STAKEHOLDERS)) return true;
    // Check if user is in any of the step's assigned teams
    if (step.team_ids && step.team_ids.length > 0) {
      return step.team_ids.some((teamId) => userTeamIds.includes(teamId));
    }
    return false;
  };

  const getStepStatus = (step: StakeholderProcessStep) => {
    const data = stepData.find((sd) => sd.step_id === step.id);
    if (data?.is_completed) return "completed";
    if (stakeholder.current_step_id === step.id) return "current";
    
    if (process?.is_sequential) {
      const currentStepOrder = stakeholder.current_step?.step_order || 1;
      if (step.step_order < currentStepOrder) return "skipped";
      if (step.step_order > currentStepOrder) return "locked";
    }
    
    return "pending";
  };

  const renderStepContent = (step: StakeholderProcessStep) => {
    const status = getStepStatus(step);
    const data = stepData.find((sd) => sd.step_id === step.id);
    const canAccess = canUserAccessStep(step);
    const canEdit = canEditStakeholder();

    // If user can't access this step, show limited info
    if (!canAccess) {
      return (
        <div className="p-4 bg-background-secondary dark:bg-background-tertiary rounded-lg">
          <p className="text-sm text-foreground-tertiary">
            You don't have permission to view this step's data.
          </p>
        </div>
      );
    }

    if (status === "locked" && process?.is_sequential) {
      return (
        <div className="p-4 bg-background-secondary dark:bg-background-tertiary rounded-lg">
          <p className="text-sm text-foreground-tertiary">
            Complete the previous steps to unlock this one.
          </p>
        </div>
      );
    }

    // Show form for current/pending steps that user can edit
    if ((status === "current" || status === "pending") && activeStepId === step.id && canEdit) {
      return (
        <StepDataForm
          stakeholderId={stakeholderId}
          step={step}
          existingData={data}
          completedStepsData={stepData
            .filter((sd) => {
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
      );
    }

    // Show existing data if available
    if (data?.data && Object.keys(data.data).length > 0) {
      return (
        <div className="space-y-4">
          {/* Step Status if enabled */}
          {step.status_field?.enabled && data.data["__step_status"] && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Status:</span>
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded">
                {step.status_field.options?.find(opt => opt.value === data.data["__step_status"])?.label || data.data["__step_status"]}
              </span>
            </div>
          )}

          {/* Render field data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {step.field_definitions?.fields
              ?.filter((field) => !field.key.startsWith("__"))
              .map((field) => {
                const value = data.data[field.key];
                if (value === undefined || value === null || value === "") return null;

                // Handle file fields
                if (field.type === "file") {
                  const files = Array.isArray(value) ? value : [value];
                  return (
                    <div key={field.key} className="bg-surface-primary p-3 rounded-lg border border-border-primary">
                      <p className="text-xs font-medium text-foreground-tertiary mb-1">
                        {field.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((file: any, index: number) => (
                          <a
                            key={index}
                            href={getPublicFileUrl(file.path || file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                          >
                            <Download size={12} />
                            {file.originalName || `File ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Handle calculated fields - just show the stored value
                if (field.type === "calculated") {
                  return (
                    <div key={field.key} className="bg-surface-primary p-3 rounded-lg border border-border-primary">
                      <p className="text-xs font-medium text-foreground-tertiary mb-1 flex items-center gap-1">
                        <Calculator size={12} />
                        {field.label}
                      </p>
                      <p className="text-sm text-foreground-primary font-medium">
                        {formatDisplayValue(value)}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={field.key} className="bg-surface-primary p-3 rounded-lg border border-border-primary">
                    <p className="text-xs font-medium text-foreground-tertiary mb-1">
                      {field.label}
                    </p>
                    <p className="text-sm text-foreground-primary">
                      <ValueWithMapsLink value={value} fieldKey={field.key} />
                    </p>
                  </div>
                );
              })}
          </div>

          {/* Action buttons for completed steps */}
          {status === "completed" && canEdit && process?.allow_rollback && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleStepRollback(step.id!)}
                className="text-sm text-foreground-secondary hover:text-foreground-primary transition-colors"
              >
                Reopen Step
              </button>
            </div>
          )}
        </div>
      );
    }

    // Show start button for pending/current steps
    if (canEdit) {
      return (
        <div className="p-4 bg-background-secondary dark:bg-background-tertiary rounded-lg">
          <button
            onClick={() => setActiveStepId(step.id!)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            Start Step
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 bg-background-secondary dark:bg-background-tertiary rounded-lg">
        <p className="text-sm text-foreground-tertiary">No data submitted yet.</p>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/ops/stakeholders")}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Stakeholders</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground-primary">{stakeholder.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stakeholder.status === "Lead"
                    ? "bg-warning/10 text-warning dark:bg-warning/20"
                    : stakeholder.status === "Permanent"
                    ? "bg-success/10 text-success dark:bg-success/20"
                    : "bg-error/10 text-error dark:bg-error/20"
                }`}
              >
                {stakeholder.status}
              </span>
              {stakeholder.kam_id === employeeInfo?.id && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  Your Stakeholder
                </span>
              )}
            </div>
            {stakeholder.stakeholder_type && (
              <p className="text-sm text-foreground-tertiary mt-1">
                Type: {stakeholder.stakeholder_type.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEditStakeholder() && (
              <button
                onClick={() => router.push(`/ops/stakeholders/${stakeholderId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PencilSimple size={18} />
                Edit
              </button>
            )}
            {canDeleteStakeholder() && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors"
              >
                <TrashSimple size={18} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stakeholder Info Card */}
      <div className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholder.address && (
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-foreground-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-foreground-tertiary">Address</p>
                <p className="text-sm text-foreground-primary">{stakeholder.address}</p>
              </div>
            </div>
          )}

          {stakeholder.kam && (
            <div className="flex items-start gap-3">
              <User size={20} className="text-foreground-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-foreground-tertiary">Key Account Manager</p>
                <p className="text-sm text-foreground-primary">{stakeholder.kam.name}</p>
              </div>
            </div>
          )}

          {stakeholder.created_at && (
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-foreground-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-foreground-tertiary">Created</p>
                <p className="text-sm text-foreground-primary">
                  {new Date(stakeholder.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Persons */}
        {stakeholder.contact_persons && stakeholder.contact_persons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-primary">
            <h3 className="text-sm font-medium text-foreground-primary mb-3">Contact Persons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stakeholder.contact_persons.map((contact, index) => (
                <div key={index} className="bg-background-secondary dark:bg-background-tertiary p-3 rounded-lg">
                  <p className="font-medium text-foreground-primary text-sm">{contact.name}</p>
                  <div className="mt-2 space-y-1">
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                        <Phone size={12} />
                        <a href={`tel:${contact.phone}`} className="hover:text-primary-600">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                        <Envelope size={12} />
                        <a href={`mailto:${contact.email}`} className="hover:text-primary-600">
                          {contact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Data - Only show for Permanent stakeholders */}
      {stakeholder.status === "Permanent" && (
        <div className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground-primary">Additional Data</h2>
            {canEditStakeholder() && (
              <button
                onClick={() => setShowAdditionalDataModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 dark:text-primary-400 dark:border-primary-700 dark:hover:bg-primary-950 transition-colors"
              >
                <PencilSimple size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>

          {stakeholder.additional_data && Object.keys(stakeholder.additional_data).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stakeholder.additional_data).map(([sectionKey, sectionValue]) => {
                // Check if this is a nested object (step-grouped data)
                if (typeof sectionValue === "object" && sectionValue !== null && !Array.isArray(sectionValue)) {
                  return (
                    <div key={sectionKey} className="border border-border-secondary rounded-lg overflow-hidden">
                      {/* Section Header */}
                      <div className="px-3 py-2 bg-background-secondary border-b border-border-secondary">
                        <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                          {toHumanReadable(sectionKey)}
                        </span>
                      </div>
                      {/* Section Fields */}
                      <div className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(sectionValue as Record<string, any>).map(([fieldKey, fieldValue]) => (
                            <div key={fieldKey} className="flex items-start gap-2">
                              <Database className="text-foreground-tertiary mt-0.5 shrink-0" size={16} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground-secondary">
                                  {toHumanReadable(fieldKey)}
                                </p>
                                <p className="text-xs sm:text-sm text-foreground-primary mt-0.5 wrap-break-words">
                                  <ValueWithMapsLink value={fieldValue} fieldKey={fieldKey} />
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Handle flat data (legacy format or simple values)
                return (
                  <div key={sectionKey} className="flex items-start gap-3">
                    <Database className="text-foreground-tertiary mt-0.5 shrink-0" size={18} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground-secondary wrap-break-words">
                        {toHumanReadable(sectionKey)}
                      </p>
                      <p className="text-xs sm:text-sm text-foreground-primary mt-0.5 wrap-break-words">
                        <ValueWithMapsLink value={sectionValue} fieldKey={sectionKey} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs sm:text-sm text-foreground-tertiary">
                No additional data added. {canEditStakeholder() && 'Click "Edit" to add data.'}
              </p>
              {canEditStakeholder() && (
                <button
                  onClick={() => setShowAdditionalDataModal(true)}
                  className="mt-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Data Now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step Data Summary - Show all completed step data */}
      {stepData.length > 0 && (
        <div className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground-primary mb-4">Completed Step Data</h2>
          <div className="space-y-4">
            {sortedSteps.map((step) => {
              const stepDataEntry = stepData.find((sd) => sd.step_id === step.id);
              if (!stepDataEntry?.is_completed || !stepDataEntry.data || Object.keys(stepDataEntry.data).length === 0) {
                return null;
              }

              return (
                <div key={step.id} className="border border-border-secondary rounded-lg overflow-hidden">
                  {/* Step Header */}
                  <div className="px-3 py-2 bg-background-secondary border-b border-border-secondary flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-success" />
                      <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                        Step {step.step_order}: {step.name}
                      </span>
                    </div>
                    {stepDataEntry.completed_at && (
                      <span className="text-xs text-foreground-tertiary">
                        {new Date(stepDataEntry.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {/* Step Fields */}
                  <div className="p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(stepDataEntry.data).map(([key, value]) => {
                        // Skip internal fields
                        if (key.startsWith('__')) return null;

                        // Get field definition
                        const fieldDef = step.field_definitions?.fields?.find((f) => f.key === key);
                        const isFileField = fieldDef?.type === 'file';
                        const isMultiSelect = fieldDef?.type === 'multi_select';
                        const isGeolocation = fieldDef?.type === 'geolocation';
                        const isCalculated = fieldDef?.type === 'calculated';
                        const isNumber = fieldDef?.type === 'number';
                        const fieldLabel = fieldDef?.label || toHumanReadable(key);

                        // Extract actual value from nested format
                        const extractActualValue = (val: any) => {
                          if (val && typeof val === 'object' && 'value' in val) {
                            return val.value;
                          }
                          return val;
                        };

                        const actualValue = extractActualValue(value);

                        // Format value based on field type
                        const formatValue = () => {
                          if (typeof actualValue === "boolean") {
                            return actualValue ? "Yes" : "No";
                          }
                          if (isMultiSelect && Array.isArray(actualValue)) {
                            if (actualValue.length === 0) return "None selected";
                            const options = fieldDef?.options || [];
                            const labels = actualValue.map(val => {
                              const option = options.find(opt => opt.value === val);
                              return option ? option.label : toHumanReadable(val);
                            });
                            return labels.join(", ");
                          }
                          if (fieldDef?.type === 'dropdown' && typeof actualValue === 'string') {
                            const options = fieldDef?.options || [];
                            const option = options.find(opt => opt.value === actualValue);
                            return option ? option.label : toHumanReadable(actualValue);
                          }
                          if (isGeolocation && typeof actualValue === 'object' && actualValue !== null && 'latitude' in actualValue && 'longitude' in actualValue) {
                            return `${actualValue.latitude}, ${actualValue.longitude}`;
                          }
                          if (isNumber) {
                            return typeof actualValue === 'number' ? actualValue.toLocaleString() : String(actualValue);
                          }
                          if (typeof actualValue === 'string' && actualValue.includes('_')) {
                            return toHumanReadable(actualValue);
                          }
                          return formatDisplayValue(actualValue);
                        };

                        // Get file info helper
                        const getFileInfo = () => {
                          if (typeof value === 'object' && value !== null && 'path' in value) {
                            return {
                              url: getPublicFileUrl(value.path),
                              name: value.originalName || value.path.split('/').pop(),
                              size: value.size,
                            };
                          } else if (typeof value === 'string') {
                            return {
                              url: getPublicFileUrl(value),
                              name: value.split('/').pop(),
                            };
                          }
                          return null;
                        };

                        const fileInfo = isFileField ? getFileInfo() : null;

                        // Render calculated fields
                        if (isCalculated && fieldDef?.formula) {
                          return (
                            <div key={key} className="col-span-2">
                              <p className="text-xs font-medium text-foreground-tertiary uppercase flex items-center gap-1">
                                <Calculator size={12} />
                                {fieldLabel}
                                <span className="ml-1 px-1.5 py-0.5 bg-success/10 text-success dark:bg-success/20 text-[10px] rounded normal-case">
                                  Calculated
                                </span>
                              </p>
                              <p className="text-sm font-semibold text-foreground-primary mt-1">
                                {actualValue !== null && actualValue !== undefined 
                                  ? formatCalculatedValue(actualValue) 
                                  : "—"}
                              </p>
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
                            </p>
                            {isFileField && fileInfo ? (
                              <div className="mt-1">
                                <a
                                  href={fileInfo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
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
                                  className="text-xs text-primary-600 hover:underline mt-1 inline-block dark:text-primary-400"
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border-primary mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {stakeholder.status !== "Permanent" && (
            <button
              onClick={() => setActiveTab("process")}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "process"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              Process
            </button>
          )}
          <button
            onClick={() => setActiveTab("issues")}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "issues"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-foreground-secondary hover:text-foreground-primary"
            }`}
          >
            Tickets
          </button>
          {stakeholder.status === "Permanent" && (
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "transactions"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              Transactions
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "process" && stakeholder.status !== "Permanent" && (
        <div className="space-y-4">
          {sortedSteps.length === 0 ? (
            <div className="text-center py-8 bg-surface-primary rounded-lg border border-border-primary">
              <p className="text-foreground-tertiary">No process steps defined</p>
            </div>
          ) : (
            sortedSteps.map((step) => {
              const status = getStepStatus(step);
              return (
                <div
                  key={step.id}
                  className={`bg-surface-primary rounded-lg border ${
                    status === "current"
                      ? "border-primary-500"
                      : status === "completed"
                      ? "border-success"
                      : "border-border-primary"
                  } overflow-hidden`}
                >
                  <div className="p-4 border-b border-border-primary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            status === "completed"
                              ? "bg-success/10 text-success"
                              : status === "current"
                              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                              : "bg-background-tertiary text-foreground-tertiary"
                          }`}
                        >
                          {status === "completed" ? <CheckCircle size={18} /> : step.step_order}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground-primary">{step.name}</h3>
                          {step.description && (
                            <p className="text-xs text-foreground-tertiary">{step.description}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === "completed"
                            ? "bg-success/10 text-success"
                            : status === "current"
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            : status === "locked"
                            ? "bg-background-tertiary text-foreground-tertiary"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {status === "completed"
                          ? "Completed"
                          : status === "current"
                          ? "In Progress"
                          : status === "locked"
                          ? "Locked"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">{renderStepContent(step)}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "issues" && (
        <StakeholderIssuesTab stakeholderId={stakeholderId} />
      )}

      {activeTab === "transactions" && stakeholder.status === "Permanent" && (
        <StakeholderTransactions stakeholderId={stakeholderId} stakeholderName={stakeholder.name} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground-primary mb-2">Delete Stakeholder</h3>
            <p className="text-foreground-secondary mb-4">
              Are you sure you want to delete "{stakeholder.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-foreground-secondary hover:bg-surface-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50"
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
