"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import ComplaintTypeCreateModal from "./ComplaintsModal";
import { useComplaintTypes } from "@/hooks/useConfigTypes";
import ComplaintsTable from "./ComplaintsTable";
import ComplaintsModal from "./ComplaintsModal";
import { Button } from "@/components/ui/button";

export default function ComplaintsView() {
  const {
    complaintTypes,
    fetchComplaintTypes,
    createComplaintType,
    deleteComplaintType,
  } = useComplaintTypes();
  const [isCreatingComplaintType, setIsCreatingComplaintType] =
    useState(false);

  const handleCreateComplaintType = async (values: any) => {
    try {
      await createComplaintType(values);
      alert("ComplaintType created!");
      setIsCreatingComplaintType(false);
      fetchComplaintTypes();
    } catch {
      alert("Error creating ComplaintType.");
    }
  };

  const handleDeleteComplaintType = async (id: number) => {
    try {
      await deleteComplaintType(id);
      alert("ComplaintType deleted!");
      fetchComplaintTypes();
    } catch {
      alert("Error deleting ComplaintType.");
    }
  };

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  return (
    <Collapsible title="Complaints">
      <div className="px-4 space-y-2 py-2">
        <label className="block font-bold text-blue-800 mb-2">Complaint type</label>
        <div className="flex flex-wrap gap-2">
          {complaintTypes.length > 0 ? (
            complaintTypes.map((type, idx) => (
              <div
                key={idx}
                className="flex items-center bg-white rounded-sm shadow-sm px-3 py-1"
              >
                {type.name}
                <button
                  type="button"
                  className="ml-2 text-gray-600"
                  onClick={() => handleDeleteComplaintType(type.id)}
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
              <p>No complaint type found.</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingComplaintType(true)}
          className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingComplaintType && (
          <ComplaintTypeCreateModal
            onSubmit={handleCreateComplaintType}
            onClose={() => setIsCreatingComplaintType(false)}
          />
        )}
      </div>
    </Collapsible>
  );
}
