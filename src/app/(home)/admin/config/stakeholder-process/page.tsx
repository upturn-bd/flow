"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { Plus, Settings, Trash, Edit } from "@/lib/icons";
import { StakeholderProcess } from "@/lib/types/schemas";
import ProcessForm from "@/components/stakeholder-processes/ProcessForm";
import { InlineSpinner } from "@/components/ui";

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
          <h1 className="text-2xl font-bold text-foreground-primary">Stakeholder Processes</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage workflow processes for stakeholders and leads
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
          <InlineSpinner size="lg" color="blue" />
        </div>
      )}

      {/* Empty State */}
      {!loading && processes.length === 0 && (
        <div className="text-center py-12 bg-background-secondary dark:bg-background-tertiary rounded-lg border-2 border-dashed border-border-secondary">
          <Settings className="mx-auto h-12 w-12 text-foreground-tertiary" />
          <h3 className="mt-2 text-sm font-semibold text-foreground-primary">No processes</h3>
          <p className="mt-1 text-sm text-foreground-tertiary">
            Get started by creating a new stakeholder process.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
              className="bg-surface-primary rounded-lg border border-border-primary p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground-primary">{process.name}</h3>
                    {process.is_active ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-background-tertiary dark:bg-surface-secondary text-foreground-primary rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {process.description && (
                    <p className="mt-2 text-sm text-foreground-secondary line-clamp-2">
                      {process.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="text-foreground-secondary">
                    <span className="font-medium">{process.step_count || 0}</span> steps
                  </div>
                  <div className="text-foreground-secondary">
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
                    <div className="text-xs text-foreground-tertiary">
                      Rollback allowed
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      router.push(`/admin/config/stakeholder-process/${process.id}`);
                    }}
                    className="p-2 text-foreground-secondary hover:text-blue-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded transition-colors"
                    title="Edit process"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(process.id!)}
                    disabled={processingId === process.id}
                    className="p-2 text-foreground-secondary hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete process"
                  >
                    {processingId === process.id ? (
                      <InlineSpinner size="sm" color="red" />
                    ) : (
                      <Trash size={18} />
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
