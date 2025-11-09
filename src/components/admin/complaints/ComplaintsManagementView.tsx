"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import ComplaintTypeCreateModal from "./ComplaintsModal";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import { Tag, Plus, TrashSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ComplaintsView() {
  const {
    complaintTypes,
    fetchComplaintTypes,
    createComplaintType,
    deleteComplaintType,
    loading
  } = useComplaintTypes();
  const [isCreatingComplaintType, setIsCreatingComplaintType] =
    useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateComplaintType = async (values: any) => {
    try {
      setIsLoading(true);
      await createComplaintType(values);
      setIsCreatingComplaintType(false);
      fetchComplaintTypes();
    } catch (error) {
      console.error("Error creating complaint type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaintType = async (id: number) => {
    try {
      setDeleteLoading(id);
      await deleteComplaintType(id);
      fetchComplaintTypes();
    } catch (error) {
      console.error("Error deleting complaint type:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  return (
    <Collapsible title="Complaints">
      <div className="px-4 space-y-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Tag size={22} weight="duotone" className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Complaint Types</h3>
        </div>

        {loading ? (
          <LoadingSpinner
            icon={Tag}
            text="Loading complaint types..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            <AnimatePresence>
              {complaintTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {complaintTypes.map((type, idx) => (
                    <div
                      key={type.id || idx}
                      className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 shadow-sm"
                    >
                      <span className="text-gray-800 font-medium">{type.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => type.id !== undefined && handleDeleteComplaintType(type.id)}
                        isLoading={deleteLoading === type.id}
                        disabled={deleteLoading === type.id}
                        className="ml-2 p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                      >
                        <TrashSimple size={16} weight="bold" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                  <div className="flex justify-center mb-3">
                    <Tag size={40} weight="duotone" className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-1">No complaint types found</p>
                  <p className="text-gray-400 text-sm mb-4">Create complaint types to categorize issues</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingComplaintType(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Type
          </Button>
        </div>

        <AnimatePresence>
          {isCreatingComplaintType && (
            <ComplaintTypeCreateModal
              onSubmit={handleCreateComplaintType}
              onClose={() => setIsCreatingComplaintType(false)}
              isOpen={isCreatingComplaintType}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
