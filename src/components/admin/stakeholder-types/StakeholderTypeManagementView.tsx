"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "@/lib/icons";
import { useStakeholderTypes } from "@/hooks/useStakeholderTypes";
import { StakeholderTypeFormData } from "@/hooks/useStakeholderTypes";
import StakeholderTypeFormModal from "./StakeholderTypeFormModal";
import Collapsible from "../CollapsibleComponent";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tag, TrashSimple, PencilSimple } from "@/lib/icons";

export default function StakeholderTypeManagementView() {
  const {
    stakeholderTypes,
    loading,
    error,
    fetchStakeholderTypes,
    createStakeholderType,
    updateStakeholderType,
    deleteStakeholderType,
    processingId,
  } = useStakeholderTypes();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStakeholderTypes(true);
  }, [fetchStakeholderTypes]);

  const handleAdd = () => {
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async (typeId: number) => {
    try {
      setDeleteLoading(typeId);
      await deleteStakeholderType(typeId);
      fetchStakeholderTypes(true);
    } catch (error) {
      console.error("Error deleting stakeholder type:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSave = async (data: StakeholderTypeFormData) => {
    try {
      setIsLoading(true);
      if (editingType) {
        await updateStakeholderType(editingType.id, data);
      } else {
        await createStakeholderType(data);
      }
      setIsFormOpen(false);
      setEditingType(null);
      fetchStakeholderTypes(true);
    } catch (error) {
      console.error("Error saving stakeholder type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Collapsible title="Stakeholder Types">
      <div className="px-4 space-y-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Tag size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Stakeholder Types</h3>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner
            icon={Tag}
            text="Loading stakeholder types..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            {stakeholderTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stakeholderTypes.map((type, idx) => (
                  <div
                    key={type.id || idx}
                    className="flex items-center bg-background-secondary dark:bg-background-tertiary rounded-lg px-3 py-2 border border-border-primary shadow-sm"
                  >
                    <div className="flex flex-col mr-2">
                      <span className="text-foreground-primary font-medium">{type.name}</span>
                      {type.description && (
                        <span className="text-xs text-foreground-tertiary">{type.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      {!type.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-background-tertiary dark:bg-surface-primary text-foreground-tertiary rounded-full mr-1">
                          Inactive
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(type)}
                        className="p-1 rounded-full text-foreground-tertiary hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-500"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => type.id !== undefined && handleDelete(type.id)}
                        isLoading={deleteLoading === type.id}
                        disabled={deleteLoading === type.id}
                        className="p-1 rounded-full text-foreground-tertiary hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                      >
                        <TrashSimple size={16} weight="bold" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-background-secondary dark:bg-background-tertiary rounded-lg p-6 text-center border border-border-primary">
                <div className="flex justify-center mb-3">
                  <Tag size={40} weight="duotone" className="text-foreground-tertiary" />
                </div>
                <p className="text-foreground-secondary mb-1">No stakeholder types found</p>
                <p className="text-foreground-tertiary text-sm mb-4">Create stakeholder types to categorize stakeholders</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary"
            onClick={handleAdd}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Type
          </Button>
        </div>

        <AnimatePresence>
          {isFormOpen && (
            <StakeholderTypeFormModal
              type={editingType}
              onClose={() => {
                setIsFormOpen(false);
                setEditingType(null);
              }}
              onSubmit={handleSave}
              isOpen={isFormOpen}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
