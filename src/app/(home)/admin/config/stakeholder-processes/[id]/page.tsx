"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { ArrowLeft, Edit, Play, Pause, ToggleRight, ToggleLeft } from "lucide-react";
import ProcessForm from "@/components/stakeholder-processes/ProcessForm";
import StepManager from "@/components/stakeholder-processes/StepManager";

export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const processId = parseInt(id);

  const {
    fetchProcessById,
    fetchProcessSteps,
    createProcessStep,
    updateProcessStep,
    deleteProcessStep,
    reorderProcessSteps,
    updateProcess,
  } = useStakeholders();

  const [process, setProcess] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadProcess = async () => {
    setLoading(true);
    try {
      const processData = await fetchProcessById(processId);
      if (processData) {
        setProcess(processData);
        setSteps(processData.steps || []);
      }
    } catch (error) {
      console.error("Error loading process:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcess();
  }, [processId]);

  const handleToggleActive = async () => {
    if (process) {
      await updateProcess(processId, { is_active: !process.is_active });
      await loadProcess();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">Process not found</h3>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{process.name}</h1>
              {process.is_active ? (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  Inactive
                </span>
              )}
            </div>
            {process.description && (
              <p className="mt-2 text-gray-600">{process.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <span>
                {process.is_sequential ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Sequential Process
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Independent Steps
                  </span>
                )}
              </span>
              {process.is_sequential && process.allow_rollback && (
                <>
                  <span>•</span>
                  <span>Rollback Allowed</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {process.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {process.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={20} />
            Edit Process
          </button>
        </div>
      </div>

      {/* Step Manager */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <StepManager
          processId={processId}
          steps={steps}
          onStepsChange={loadProcess}
          onCreateStep={createProcessStep}
          onUpdateStep={updateProcessStep}
          onDeleteStep={deleteProcessStep}
          onReorderSteps={reorderProcessSteps}
        />
      </div>

      {/* Edit Process Modal */}
      {showEditModal && (
        <ProcessForm
          process={process}
          onSubmit={async (data) => {
            await updateProcess(processId, data);
            await loadProcess();
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
