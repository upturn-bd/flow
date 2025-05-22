"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDivisions } from "@/hooks/useDivisions";
import DivisionModal from "./DivisionModal";
import DivisionDetailsModal from "./DivisionDetailsModal";
import { Layers, Plus, Eye, X } from "lucide-react";
import { fadeInUp } from "@/components/ui/animations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TrashSimple } from "@phosphor-icons/react";

type DivisionsSectionProps = {
  employees: { id: string; name: string }[];
  showNotification: (message: string, isError?: boolean) => void;
};

export default function DivisionsSection({ employees, showNotification }: DivisionsSectionProps) {
  const {
    divisions,
    loading: divisionsLoading,
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
  } = useDivisions();
  const [viewDivision, setViewDivision] = useState<number | null>(null);
  const [editDivision, setEditDivision] = useState<number | null>(null);
  const [isCreatingDivision, setIsCreatingDivision] = useState(false);
  const [divisionDeleteLoading, setDivisionDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const handleCreateDivision = async (values: any) => {
    try {
      await createDivision(values);
      setIsCreatingDivision(false);
      fetchDivisions();
      showNotification("Division created successfully");
    } catch {
      showNotification("Error creating Division", true);
    }
  };

  const handleUpdateDivision = async (values: any) => {
    try {
      await updateDivision(values);
      setEditDivision(null);
      fetchDivisions();
      showNotification("Division updated successfully");
    } catch {
      showNotification("Error updating Division", true);
    }
  };

  const handleDeleteDivision = async (id: number) => {
    try {
      setDivisionDeleteLoading(id);
      await deleteDivision(id);
      showNotification("Division deleted successfully");
      fetchDivisions();
    } catch {
      showNotification("Error deleting Division", true);
    } finally {
      setDivisionDeleteLoading(null);
    }
  };

  const selectedDivisionView = divisions.find((d) => d.id === viewDivision);
  const selectedDivisionEdit = divisions.find((d) => d.id === editDivision);

  return (
    <motion.section 
      variants={fadeInUp}
      className="bg-white p-3 sm:p-6 rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-gray-600" />
          Divisions
        </h3>
        <p className="text-sm text-gray-600">Manage organization divisions</p>
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
            <div className="p-4 sm:p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              No divisions added yet. Click the plus button to add one.
            </div>
          ) : (
            divisions.map((div) => (
              <motion.div 
                key={div.id} 
                className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mr-2 sm:mr-3">
                    <Layers size={16} />
                  </div>
                  <span className="font-medium text-gray-800 text-sm sm:text-base">{div.name}</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewDivision(div.id)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs sm:text-sm flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={14} />
                    <span className="hidden xs:inline">Details</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteDivision(div.id)}
                    disabled={divisionDeleteLoading === div.id}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-red-50 text-red-600 text-xs sm:text-sm flex items-center gap-1 hover:bg-red-100 transition-colors ${divisionDeleteLoading === div.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <TrashSimple size={14} />
                    <span className="hidden xs:inline">
                      {divisionDeleteLoading === div.id ? 'Deleting...' : 'Delete'}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
      
      <div className="flex justify-center sm:justify-start mt-4">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreatingDivision(true)}
          className="flex items-center justify-center text-white bg-gray-800 rounded-full w-8 h-8 shadow-sm hover:bg-gray-700 transition-colors"
        >
          <Plus size={18} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isCreatingDivision && (
          <DivisionModal
            employees={employees}
            onSubmit={handleCreateDivision}
            onClose={() => setIsCreatingDivision(false)}
          />
        )}
        {selectedDivisionView && (
          <DivisionDetailsModal
            editDivision={() => setEditDivision(selectedDivisionView.id)}
            deleteDivision={() => handleDeleteDivision(selectedDivisionView.id)}
            division={selectedDivisionView}
            onClose={() => setViewDivision(null)}
            employees={employees}
          />
        )}
        {selectedDivisionEdit && (
          <DivisionModal
            employees={employees}
            initialData={selectedDivisionEdit}
            onSubmit={handleUpdateDivision}
            onClose={() => setEditDivision(null)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
} 