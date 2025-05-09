"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { TrashSimple } from "@phosphor-icons/react";
import { useClaimTypes } from "@/hooks/useClaimAndSettlement";
import {
  ClaimTypeCreateModal,
  ClaimTypeUpdateModal,
} from "./ClaimSettlementModal";
import { claimTypeSchema } from "@/lib/types";
import { z } from "zod";

type ClaimType = z.infer<typeof claimTypeSchema>;

export default function ClaimSettlementView() {
  const {
    claimTypes,
    fetchClaimTypes,
    createClaimType,
    deleteClaimType,
    updateClaimType,
  } = useClaimTypes();
  const [editClaimType, setEditClaimType] = useState<number | null>(null);
  const [isCreatingClaimType, setIsCreatingClaimType] = useState(false);
  const [selectedClaimTypeEdit, setSelectedClaimTypeEdit] =
    useState<ClaimType | null>(null);

  const handleCreateClaimType = async (values: any) => {
    try {
      await createClaimType(values);
      alert("ClaimType created!");
      setIsCreatingClaimType(false);
      fetchClaimTypes();
    } catch {
      alert("Error creating ClaimType.");
    }
  };

  const handleUpdateClaimType = async (values: any) => {
    try {
      await updateClaimType(values);
      alert("ClaimType updated!");
      setSelectedClaimTypeEdit(null);
      setEditClaimType(null);
      fetchClaimTypes();
    } catch {
      alert("Error updating ClaimType.");
    }
  };

  const handleDeleteClaimType = async (id: number) => {
    try {
      await deleteClaimType(id);
      alert("ClaimType deleted!");
      fetchClaimTypes();
    } catch {
      alert("Error deleting ClaimType.");
    }
  };

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  useEffect(() => {
    if (editClaimType) {
      const selectedClaimType = claimTypes.filter(
        (ClaimType: ClaimType) => ClaimType.id === editClaimType
      )[0];
      console.log("Selected Leave Type:", selectedClaimType);
      setSelectedClaimTypeEdit(selectedClaimType);
    }
  }, [editClaimType, claimTypes]);

  return (
    <Collapsible title="Claim Settlement">
      <div className="px-4 space-y-2 py-2">
        <label className="block font-bold text-blue-800 mb-2">Claim Type</label>
        {claimTypes.length > 0 ? (
          claimTypes.map((claimType: ClaimType) => (
            <div key={claimType.id} className="flex items-end gap-x-6">
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Item Name</p>
                <div className="px-3 py-1 rounded-md bg-gray-300">
                  {claimType.claim_item}
                </div>
              </div>
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Description</p>
                <button
                  onClick={() => {
                    setEditClaimType(parseInt(claimType.id));
                  }}
                  className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() => handleDeleteClaimType(parseInt(claimType.id))}
                className="p-1"
              >
                <TrashSimple className="text-red-600" size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No claim type found.</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCreatingClaimType(true)}
          className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingClaimType && (
          <ClaimTypeCreateModal
            onSubmit={handleCreateClaimType}
            onClose={() => setIsCreatingClaimType(false)}
          />
        )}

        {selectedClaimTypeEdit && (
          <ClaimTypeUpdateModal
            initialData={selectedClaimTypeEdit}
            onSubmit={handleUpdateClaimType}
            onClose={() => {
              setEditClaimType(null);
              setSelectedClaimTypeEdit(null);
            }}
          />
        )}
      </div>
    </Collapsible>
  );
}
