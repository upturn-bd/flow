"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { useLineage } from "@/hooks/useSupervisorLineage";
import { Lineage } from "@/lib/types/schemas";
import LineageCreateModal, {
  LineageUpdateModal,
} from "./SupervisorLineageModal";
import { TrashSimple, Plus, Eye, UsersThree } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import {
  fadeIn,
  fadeInUp,
  staggerContainer,
  scaleIn,
} from "@/components/ui/animations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const groupLineageData = (lineages: any[]) => {
  return lineages.reduce((acc, lineage) => {
    const existingGroup = acc.find((group: any) => group.name === lineage.name);

    if (existingGroup) {
      existingGroup.details.push(lineage);
    } else {
      acc.push({
        name: lineage.name,
        details: [lineage],
      });
    }

    return acc;
  }, []);
};

export default function SupervisorLineageView() {
  const {
    lineages,
    loading,
    creating,
    updating,
    fetchLineages,
    createLineage,
    deleteLineage,
    updateLineage,
  } = useLineage();
  const [editLineage, setEditLineage] = useState<string | null>(null);
  const [isCreatingLineage, setIsCreatingLineage] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedLineageEdit, setSelectedLineageEdit] = useState<
    { name: string; details: any }[] | []
  >([]);

  const handleCreateLineage = async (
    values: Lineage[]
  ) => {
    try {
      await createLineage(values);
      setIsCreatingLineage(false);
      fetchLineages();
    } catch (error) {
      console.error("Error creating lineage:", error);
    }
  };

  const handleUpdateLineage = async (
    values: Lineage[]
  ) => {
    try {
      await updateLineage(values);
      setEditLineage(null);
      fetchLineages();
    } catch (error) {
      console.error("Error updating lineage:", error);
    }
  };

  const handleDeleteLineage = async (name: string) => {
    try {
      setDeleteLoading(name);
      await deleteLineage(name);
      fetchLineages();
    } catch (error) {
      console.error("Error deleting lineage:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchLineages();
  }, [fetchLineages]);

  useEffect(() => {
    if (editLineage && groupLineageData(lineages).length > 0) {
      const selectedL = groupLineageData(lineages).filter(
        (lineage: any) => lineage.name === editLineage
      );
      setSelectedLineageEdit(selectedL);
    } else {
      setSelectedLineageEdit([]);
    }
  }, [editLineage, lineages]);

  const groupedLineages = groupLineageData(lineages);

  return (
    <Collapsible title="Supervisor Lineage">
      <div className="px-4 space-y-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <UsersThree size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Supervision Hierarchy</h3>
        </div>

        {loading ? (
          <LoadingSpinner
            icon={UsersThree}
            text="Loading lineage data..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            <AnimatePresence mode="wait">
              {groupedLineages.length > 0 ? (
                <div
                  key="lineage-list"
                  className="grid gap-4 grid-cols-1 md:grid-cols-2"
                >
                  {groupedLineages.map((lineage: any, index: number) => (
                    <div
                      key={lineage.name}
                      className="p-4 bg-surface-primary rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-3">
                          <UsersThree size={20} weight="duotone" className="text-foreground-secondary" />
                          <h4 className="font-medium text-foreground-primary">{lineage.name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLineage(lineage.name)}
                          isLoading={deleteLoading === lineage.name}
                          disabled={deleteLoading === lineage.name}
                          className="p-1 rounded-full text-foreground-tertiary hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashSimple size={16} weight="bold" />
                        </Button>
                      </div>

                      <div className="mt-2 pt-2 border-t border-border-primary">
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <div className="px-3 py-1.5 rounded-md bg-background-secondary dark:bg-background-tertiary text-foreground-secondary text-sm border border-border-primary">
                            {lineage.details.length} position{lineage.details.length !== 1 ? 's' : ''}
                          </div>
                          <span className="text-foreground-tertiary text-sm hidden sm:inline">•</span>
                          <div className="text-sm text-foreground-tertiary">
                            {lineage.details.length > 0 ? 'Hierarchy defined' : 'No positions assigned'}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditLineage(lineage.name)}
                          className="text-sm flex items-center gap-1 text-foreground-secondary hover:text-foreground-primary"
                        >
                          <Eye size={16} weight="bold" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  key="empty-state"
                  className="bg-background-secondary dark:bg-background-tertiary rounded-lg p-6 text-center border border-border-primary"
                >
                  <div className="flex justify-center mb-3">
                    <UsersThree
                      size={40}
                      weight="duotone"
                      className="text-foreground-tertiary"
                    />
                  </div>
                  <p className="text-foreground-tertiary mb-1">No supervision lineages found</p>
                  <p className="text-foreground-tertiary text-sm mb-4">Define reporting structures for your organization</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button
            variant="primary"
            onClick={() => setIsCreatingLineage(true)}
            className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Lineage
          </Button>
        </div>

        <AnimatePresence>
          {isCreatingLineage && (
            <LineageCreateModal
              key={`create-lineage-${isCreatingLineage}`}
              onSubmit={handleCreateLineage}
              onClose={() => setIsCreatingLineage(false)}
              isLoading={creating}
            />
          )}

          {selectedLineageEdit.length > 0 && (
            <LineageUpdateModal
              key={`update-lineage-${selectedLineageEdit[0].name}`}
              initialData={selectedLineageEdit[0].details}
              onSubmit={handleUpdateLineage}
              onClose={() => setEditLineage(null)}
              isLoading={updating}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
