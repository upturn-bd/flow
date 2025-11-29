"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import DivisionModal from "./DivisionModal";
import DivisionDetailsModal from "./DivisionDetailsModal";
import { Layers, Plus, Eye, X } from "@/lib/icons";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Trash } from "@/lib/icons";
import { getCompanyInfo } from "@/lib/utils/auth";

type DivisionsSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function DivisionsSection({ showNotification }: DivisionsSectionProps) {
  // Use context instead of individual hook
  const {
    divisions,
    employees,
    divisionsLoading,
    createDivision,
    updateDivision,
    deleteDivision,
  } = useAdminData();
  const [viewDivision, setViewDivision] = useState<number | null>(null);
  const [editDivision, setEditDivision] = useState<number | null>(null);
  const [isCreatingDivision, setIsCreatingDivision] = useState(false);
  const [divisionDeleteLoading, setDivisionDeleteLoading] = useState<number | null>(null);


  const handleCreateDivision = async (values: any) => {
    try {
      await createDivision(values);
      setIsCreatingDivision(false);
      showNotification("Division created successfully");
    } catch {
      showNotification("Error creating Division", true);
    }
  };

  const handleUpdateDivision = async (values: any) => {
    try {
      if (editDivision) {
        await updateDivision(editDivision.toString(), values);
        setEditDivision(null);
        showNotification("Division updated successfully");
      }
    } catch {
      showNotification("Error updating Division", true);
    }
  };

  const handleDeleteDivision = async (id: number) => {
    try {
      setDivisionDeleteLoading(id);
      await deleteDivision(id.toString());
      showNotification("Division deleted successfully");
    } catch {
      showNotification("Error deleting Division", true);
    } finally {
      setDivisionDeleteLoading(null);
    }
  };

  const selectedDivisionView = divisions.find((d) => d.id === viewDivision);
  const selectedDivisionEdit = divisions.find((d) => d.id === editDivision);

  return (
    <section className="bg-surface-primary p-3 sm:p-6 rounded-lg border border-border-primary shadow-sm">
      <div className="border-b border-border-primary pb-4 mb-4">
        <h3 className="text-lg font-semibold text-foreground-primary flex items-center">
          <Layers className="w-5 h-5 mr-2 text-foreground-secondary" />
          Divisions
        </h3>
        <p className="text-sm text-foreground-secondary">Manage organization divisions</p>
      </div>

      {divisionsLoading ? (
        <LoadingSpinner
          icon={Layers}
          text="Loading divisions..."
          height="h-40"
          color="gray"
        />
      ) : (
        <div className="space-y-3">
          {divisions.length === 0 ? (
            <div className="p-4 sm:p-6 bg-background-secondary dark:bg-background-tertiary rounded-lg text-center text-foreground-tertiary">
              No divisions added yet. Click the plus button to add one.
            </div>
          ) : (
            divisions.map((div) => (
              <div 
                key={div.id} 
                className="bg-surface-primary rounded-lg border border-border-primary p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-background-secondary dark:bg-background-tertiary rounded-full flex items-center justify-center text-foreground-secondary mr-2 sm:mr-3">
                    <Layers size={16} />
                  </div>
                  <span className="font-medium text-foreground-primary text-sm sm:text-base">{div.name}</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setViewDivision(div.id ?? null)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-background-secondary dark:bg-background-tertiary text-foreground-secondary text-xs sm:text-sm flex items-center gap-1 hover:bg-background-tertiary dark:hover:bg-surface-secondary transition-colors"
                  >
                    <Eye size={14} />
                    <span className="hidden xs:inline">Details</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDivision(div.id ?? 0)}
                    disabled={divisionDeleteLoading === div.id}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ${divisionDeleteLoading === div.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash size={14} />
                    <span className="hidden xs:inline">
                      {divisionDeleteLoading === div.id ? 'Deleting...' : 'Delete'}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      <div className="flex justify-center sm:justify-start mt-4">
        <button
          onClick={() => setIsCreatingDivision(true)}
          className="flex items-center justify-center text-white bg-primary-700 dark:bg-primary-600 rounded-full w-8 h-8 shadow-sm hover:bg-primary-800 dark:hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence>
        {isCreatingDivision && (
          <DivisionModal
            key={`CreateDivisionModal`}
            isOpen={isCreatingDivision}
            employees={employees}
            onSubmit={handleCreateDivision}
            onClose={() => setIsCreatingDivision(false)}
          />
        )}
        {selectedDivisionView && (
          <DivisionDetailsModal
            key={`DivisionDetailsModal-${selectedDivisionView.id}`}
            editDivision={() => setEditDivision(selectedDivisionView.id ?? null)}
            deleteDivision={() => handleDeleteDivision(selectedDivisionView.id!)}
            division={selectedDivisionView}
            onClose={() => setViewDivision(null)}
            employees={employees}
          />
        )}
        {selectedDivisionEdit && (
          <DivisionModal
            key={`EditDivisionModal-${selectedDivisionEdit.id}`}
            isOpen={!!selectedDivisionEdit}
            employees={employees}
            initialData={selectedDivisionEdit}
            onSubmit={handleUpdateDivision}
            onClose={() => setEditDivision(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
} 