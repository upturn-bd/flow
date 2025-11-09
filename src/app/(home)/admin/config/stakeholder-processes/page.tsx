"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { Plus, Settings, Trash2, Edit } from "lucide-react";
import { StakeholderProcess } from "@/lib/types/schemas";
import ProcessForm from "@/components/stakeholder-processes/ProcessForm";

export default function StakeholderProcessesPage() {
  const router = useRouter();
  const {
    processes,
    loading,
    error,
    fetchProcesses,
    createProcess,
    deleteProcess,
    processingId,
  } = useStakeholders();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<StakeholderProcess | null>(null);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleDelete = async (processId: number) => {
    if (window.confirm("Are you sure you want to delete this process? This will affect all stakeholders using this process.")) {
      await deleteProcess(processId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stakeholder Processes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage workflow processes for stakeholders and leads
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Process
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && processes.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && processes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No processes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new stakeholder process.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create Process
            </button>
          </div>
        </div>
      )}

      {/* Process List */}
      {!loading && processes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <div
              key={process.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{process.name}</h3>
                    {process.is_active ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {process.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {process.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="text-gray-600">
                    <span className="font-medium">{process.step_count || 0}</span> steps
                  </div>
                  <div className="text-gray-600">
                    {process.is_sequential ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Sequential
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Independent
                      </span>
                    )}
                  </div>
                  {process.is_sequential && process.allow_rollback && (
                    <div className="text-xs text-gray-500">
                      Rollback allowed
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      router.push(`/admin-management/company-configurations/stakeholder-processes/${process.id}`);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit process"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(process.id!)}
                    disabled={processingId === process.id}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete process"
                  >
                    {processingId === process.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add Create/Edit Modal */}
      {showCreateModal && (
        <ProcessForm
          process={null}
          onSubmit={async (data) => {
            await createProcess(data);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
