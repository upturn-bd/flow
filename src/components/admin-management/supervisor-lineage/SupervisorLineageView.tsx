"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { Lineage, useLineage } from "@/hooks/useSupervisorLineage";
import LineageCreateModal, {
  LineageUpdateModal,
} from "./SupervisorLineageModal";
import { TrashSimple } from "@phosphor-icons/react";
import { lineageSchema } from "@/lib/types";
import { z } from "zod";

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
  const { lineages, fetchLineages, createLineage, deleteLineage, updateLineage } = useLineage();
  const [editLineage, setEditLineage] = useState<string | null>(null);
  const [isCreatingLineage, setIsCreatingLineage] = useState(false);
  const [selectedLineageEdit, setSelectedLineageEdit] = useState<
    { name: string; details: any }[] | []
  >([]);

  const handleCreateLineage = async (values: z.infer<typeof lineageSchema>[]) => {
    try {
      await createLineage(values);
      alert("Lineage created!");
      setIsCreatingLineage(false);
      fetchLineages();
    } catch {
      alert("Error creating Lineage.");
    }
  };

  const handleUpdateLineage = async (values: z.infer<typeof lineageSchema>[]) => {
    try {
      await updateLineage(values);
      alert("Lineage updated!");
      setEditLineage(null);
      fetchLineages();
    } catch {
      alert("Error updating Lineage.");
    }
  };

  const handleDeleteLineage = async (name: string) => {
    try {
      await deleteLineage(name);
      alert("Lineage deleted!");
      fetchLineages();
    } catch {
      alert("Error deleting Lineage.");
    }
  };

  useEffect(() => {
    fetchLineages();
  }, [fetchLineages]);

  useEffect(() => {
    if (editLineage && groupLineageData(lineages).length > 0) {
      const selectedL = groupLineageData(lineages).filter(
        (lineage: Lineage) => lineage.name === editLineage
      );
      console.log("selectedL", selectedL);
      setSelectedLineageEdit(selectedL);
    } else {
      setSelectedLineageEdit([]);
    }
  }, [editLineage, lineages]);
  return (
    <Collapsible title="Supervisor Lineage">
      <div className="px-4 grid grid-cols-1">
        {groupLineageData(lineages).length > 0 ? (
          groupLineageData(lineages).map((lineage: Lineage) => (
            <div key={lineage.name} className="flex items-end gap-x-6">
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Lineage Name</p>
                <div className="px-3 py-1 rounded-md bg-gray-300">
                  {lineage.name}
                </div>
              </div>
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Description</p>
                <button
                  onClick={() => {
                    setEditLineage(lineage.name);
                  }}
                  className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() => handleDeleteLineage(lineage.name)}
                className="p-1"
              >
                <TrashSimple className="text-red-600" size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No lineages found.</p>
          </div>
        )}
        <button
          onClick={() => setIsCreatingLineage(true)}
          type="button"
          className="mt-6 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
      </div>

      {isCreatingLineage && (
        <LineageCreateModal
          onSubmit={handleCreateLineage}
          onClose={() => setIsCreatingLineage(false)}
        />
      )}

      {selectedLineageEdit.length > 0 && (
        <LineageUpdateModal
          initialData={selectedLineageEdit[0].details}
          onSubmit={handleUpdateLineage}
          onClose={() => setEditLineage(null)}
        />
      )}
    </Collapsible>
  );
}
