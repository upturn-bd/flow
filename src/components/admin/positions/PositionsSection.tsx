"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import PositionDetailsModal from "./PositionDetailsModal";
import PositionModal from "./PositionModal";
import { BriefcaseBusiness, Plus, Eye } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TrashSimple } from "@phosphor-icons/react";

type PositionsSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function PositionsSection({
  showNotification,
}: PositionsSectionProps) {
  // Use context instead of individual hooks
  const {
    departments,
    grades,
    positions,
    positionsLoading,
    createPosition,
    updatePosition,
    deletePosition,
  } = useAdminData();

  const [viewPosition, setViewPosition] = useState<number | null>(null);
  const [editPosition, setEditPosition] = useState<number | null>(null);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [positionDeleteLoading, setPositionDeleteLoading] = useState<
    number | null
  >(null);

  const handleCreatePosition = async (values: any) => {
    try {
      await createPosition(values);
      setIsCreatingPosition(false);
      showNotification("Position created successfully");
    } catch {
      showNotification("Error creating Position", true);
    }
  };

  const handleUpdatePosition = async (values: any) => {
    try {
      if (editPosition) {
        await updatePosition(editPosition.toString(), values);
      }
      setEditPosition(null);
      showNotification("Position updated successfully");
    } catch {
      showNotification("Error updating Position", true);
    }
  };

  const handleDeletePosition = async (id: number) => {
    try {
      setPositionDeleteLoading(id);
      await deletePosition(id.toString());
      showNotification("Position deleted successfully");
    } catch {
      showNotification("Error deleting Position", true);
    } finally {
      setPositionDeleteLoading(null);
    }
  };

  const selectedPositionView = positions.find((d) => d.id === viewPosition);
  const selectedPositionEdit = positions.find((d) => d.id === editPosition);

  return (
    <section className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <BriefcaseBusiness className="w-5 h-5 mr-2 text-gray-600" />
          Positions
        </h3>
        <p className="text-sm text-gray-600">Manage job positions and roles</p>
      </div>

      {positionsLoading ? (
        <LoadingSpinner
          icon={BriefcaseBusiness}
          text="Loading positions..."
          height="h-40"
          color="gray"
        />
      ) : (
        <div className="space-y-3">
          {positions.length === 0 ? (
            <div className="p-4 sm:p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              No positions added yet. Click the plus button to add one.
            </div>
          ) : (
            positions.map((position) => (
              <div
                key={position.id}
                className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mr-3">
                    <BriefcaseBusiness size={16} />
                  </div>
                  <span className="font-medium text-gray-800">
                    {position.name}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setViewPosition(position.id ?? null)}
                    className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Details</span>
                  </button>
                  <button
                    onClick={() => handleDeletePosition(position.id ?? 0)}
                    disabled={positionDeleteLoading === position.id}
                    className={`px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-1 hover:bg-red-100 transition-colors ${
                      positionDeleteLoading === position.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <TrashSimple size={14} />
                    {positionDeleteLoading === position.id ? (
                      <span className="hidden sm:inline">Deleting...</span>
                    ) : (
                      <span className="hidden sm:inline">Delete</span>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-center sm:justify-start mt-4">
        <button
          onClick={() => setIsCreatingPosition(true)}
          className="flex items-center justify-center text-white bg-gray-800 rounded-full w-10 h-10 sm:w-8 sm:h-8 shadow-sm hover:bg-gray-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence>
        {isCreatingPosition && (
          <PositionModal
            key={`CreatePositionModal`}
            departments={departments.filter(d => d.id != null) as { id: number; name: string }[]}
            grades={grades.filter(g => g.id != null) as { id: number; name: string }[]}
            onSubmit={handleCreatePosition}
            onClose={() => setIsCreatingPosition(false)}
            isOpen={isCreatingPosition}
          />
        )}
        {selectedPositionView && (
          <PositionDetailsModal
            key={`PositionDetailsModal-${selectedPositionView.id}`}
            editPosition={() => setEditPosition(selectedPositionView.id ?? null)}
            deletePosition={() => handleDeletePosition(selectedPositionView.id!)}
            position={selectedPositionView}
            onClose={() => setViewPosition(null)}
            departments={departments}
            grades={grades}
          />
        )}
        {selectedPositionEdit && (
          <PositionModal
            key={`EditPositionModal-${selectedPositionEdit.id}`}
            departments={departments.filter(d => d.id != null) as { id: number; name: string }[]}
            grades={grades.filter(g => g.id != null) as { id: number; name: string }[]}
            initialData={selectedPositionEdit}
            onSubmit={handleUpdatePosition}
            onClose={() => setEditPosition(null)}
            isOpen={!!selectedPositionEdit}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
