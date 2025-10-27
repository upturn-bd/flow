"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { getPublicFileUrl } from "@/lib/utils/files";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Phone,
  User,
  Edit,
  Trash2,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";
import { Stakeholder, StakeholderProcessStep, StakeholderStepData } from "@/lib/types/schemas";
import StepDataForm from "@/components/stakeholder-processes/StepDataForm";
import StakeholderIssuesTab from "@/components/stakeholder-issues/StakeholderIssuesTab";

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
  } = useStakeholders();

  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [stepData, setStepData] = useState<StakeholderStepData[]>([]);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"process" | "issues">("process");

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
      router.push("/admin-management/stakeholders");
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStepComplete = async () => {
    const data = await fetchStakeholderById(stakeholderId);
    if (data) {
      setStakeholder(data);
    }
    await loadStepData(stakeholderId);
    setActiveStepId(null);
  };

  if (loading && !stakeholder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stakeholder) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertCircle className="mx-auto text-gray-400" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mt-4">Stakeholder Not Found</h2>
          <p className="text-gray-600 mt-2">
            The stakeholder you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push("/admin-management/stakeholders")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Stakeholders
          </button>
        </div>
      </div>
    );
  }

  const processSteps = stakeholder.process?.steps || [];
  const sortedSteps = [...processSteps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{stakeholder.name}</h1>
              {stakeholder.is_completed ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle2 size={16} />
                  Stakeholder
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Clock size={16} />
                  Lead
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Process: {stakeholder.process?.name || "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin-management/stakeholders/${stakeholder.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Information</h2>

            {stakeholder.address && (
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-600 mt-0.5">{stakeholder.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {stakeholder.created_at
                    ? new Date(stakeholder.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {stakeholder.completed_at && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-green-500 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-700">Completed</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {new Date(stakeholder.completed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Persons */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Contact Persons</h2>

            {stakeholder.contact_persons && stakeholder.contact_persons.length > 0 ? (
              <div className="space-y-4">
                {stakeholder.contact_persons.map((contact, index) => (
                  <div key={index} className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start gap-3 mb-2">
                      <User className="text-gray-400 mt-0.5" size={18} />
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-3 ml-9 mb-1">
                        <Mail className="text-gray-400" size={16} />
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
                        <Phone className="text-gray-400" size={16} />
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
              <p className="text-sm text-gray-500">No contact persons added</p>
            )}
          </div>
        </div>

        {/* Right Column - Process Steps */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("process")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "process"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Process Steps
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "issues"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Issues
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "process" ? (
                // Process Steps Content
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Process Steps</h2>

                  {sortedSteps.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No steps configured for this process
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedSteps.map((step, index) => {
                        const stepDataEntry = stepData.find((sd) => sd.step_id === step.id);
                        const isCompleted = stepDataEntry?.is_completed || false;
                        const isCurrent = stakeholder.current_step_id === step.id;
                        const canEdit = isCurrent && !stakeholder.is_completed;

                        return (
                          <div
                            key={step.id}
                            className={`border rounded-lg ${
                              isCurrent
                                ? "border-blue-300 bg-blue-50"
                                : isCompleted
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                      isCompleted
                                        ? "bg-green-500 text-white"
                                        : isCurrent
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-300 text-gray-600"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 size={18} />
                                    ) : (
                                      <span>{step.step_order}</span>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{step.name}</h3>
                                    {step.description && (
                                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span>Team: {step.team?.name || "N/A"}</span>
                                    </div>
                                  </div>
                                </div>

                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      setActiveStepId(activeStepId === step.id ? null : (step.id || null))
                                    }
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                  >
                                    {activeStepId === step.id ? "Cancel" : "Work on Step"}
                                  </button>
                                )}
                              </div>

                              {/* Step Data Form */}
                              {activeStepId === step.id && canEdit && step.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <StepDataForm
                                    stakeholderId={stakeholderId}
                                    step={step}
                                    existingData={stepDataEntry}
                                    onComplete={handleStepComplete}
                                    onCancel={() => setActiveStepId(null)}
                                  />
                                </div>
                              )}

                              {/* Display Completed Data */}
                              {isCompleted && stepDataEntry && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(stepDataEntry.data).map(([key, value]) => {
                                // Check if this is a file field by looking at the field definitions
                                const fieldDef = step.field_definitions?.fields?.find(
                                  (f) => f.key === key
                                );
                                const isFileField = fieldDef?.type === 'file';
                                
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
                                
                                return (
                                  <div key={key}>
                                    <p className="text-xs font-medium text-gray-500 uppercase">
                                      {key.replace(/_/g, " ")}
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
                                          <p className="text-xs text-gray-500 mt-1">
                                            {(fileInfo.size / 1024).toFixed(2)} KB
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-900 mt-1">
                                        {typeof value === "boolean"
                                          ? value
                                            ? "Yes"
                                            : "No"
                                          : String(value)}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {stepDataEntry.completed_at && (
                              <p className="text-xs text-gray-500 mt-4">
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
        ) : (
          // Issues Tab Content
          <StakeholderIssuesTab stakeholderId={stakeholderId} />
        )}
      </div>
    </div>
  </div>
</div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Stakeholder</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{stakeholder.name}"? This action cannot be
              undone and will remove all associated step data.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
