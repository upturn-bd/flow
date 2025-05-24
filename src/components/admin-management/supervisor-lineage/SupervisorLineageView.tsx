"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { useLineage } from "@/hooks/useSupervisorLineage";
import LineageCreateModal, {
  LineageUpdateModal,
} from "./SupervisorLineageModal";
import { TrashSimple, Plus, Eye, UsersThree } from "@phosphor-icons/react";
import { lineageSchema } from "@/lib/types";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
    values: z.infer<typeof lineageSchema>[]
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
    values: z.infer<typeof lineageSchema>[]
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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="px-4 space-y-6 py-4"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
          <UsersThree size={22} weight="duotone" className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Supervision Hierarchy</h3>
        </motion.div>

        {loading ? (
          <LoadingSpinner
            icon={UsersThree}
            text="Loading lineage data..."
            height="h-40"
            color="gray"
          />
        ) : (
          <motion.div variants={fadeInUp}>
            <AnimatePresence mode="wait">
              {groupedLineages.length > 0 ? (
                <motion.div
                  key="lineage-list"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid gap-4 grid-cols-1 md:grid-cols-2"
                >
                  {groupedLineages.map((lineage: any, index: number) => (
                    <motion.div
                      key={lineage.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          delay: index * 0.05,
                          duration: 0.4
                        }
                      }}
                      className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-3">
                          <UsersThree size={20} weight="duotone" className="text-gray-600" />
                          <h4 className="font-medium text-gray-800">{lineage.name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLineage(lineage.name)}
                          isLoading={deleteLoading === lineage.name}
                          disabled={deleteLoading === lineage.name}
                          className="p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashSimple size={16} weight="bold" />
                        </Button>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <div className="px-3 py-1.5 rounded-md bg-gray-50 text-gray-600 text-sm border border-gray-200">
                            {lineage.details.length} position{lineage.details.length !== 1 ? 's' : ''}
                          </div>
                          <span className="text-gray-400 text-sm hidden sm:inline">•</span>
                          <div className="text-sm text-gray-500">
                            {lineage.details.length > 0 ? 'Hierarchy defined' : 'No positions assigned'}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditLineage(lineage.name)}
                          className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <Eye size={16} weight="bold" />
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex justify-center mb-3"
                  >
                    <UsersThree
                      size={40}
                      weight="duotone"
                      className="text-gray-400"
                    />
                  </motion.div>
                  <p className="text-gray-500 mb-1">No supervision lineages found</p>
                  <p className="text-gray-400 text-sm mb-4">Define reporting structures for your organization</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
        <motion.div variants={fadeIn} className="flex justify-end mt-4">
          <Button
            variant="primary"
            onClick={() => setIsCreatingLineage(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Lineage
          </Button>
        </motion.div>

        <AnimatePresence>
          {isCreatingLineage && (
            <LineageCreateModal
              onSubmit={handleCreateLineage}
              onClose={() => setIsCreatingLineage(false)}
              isLoading={creating}
            />
          )}

          {selectedLineageEdit.length > 0 && (
            <LineageUpdateModal
              initialData={selectedLineageEdit[0].details}
              onSubmit={handleUpdateLineage}
              onClose={() => setEditLineage(null)}
              isLoading={updating}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Collapsible>
  );
}
