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

type SettlementType = z.infer<typeof claimTypeSchema>;

export default function ClaimSettlementView() {
  const {
    claimTypes,
    fetchClaimTypes,
    createClaimType,
    deleteClaimType,
    updateClaimType,
  } = useClaimTypes();
  const [editClaimType, setEditClaimType] = useState<number | null>(null);
  const [isCreatingClaimType, setIsCreatingSettlementType] = useState(false);
  const [selectedClaimTypeEdit, setSelectedClaimTypeEdit] =
    useState<SettlementType | null>(null);

  const handleCreateClaimType = async (values: any) => {
    try {
      await createClaimType(values);
      alert("SettlementType created!");
      setIsCreatingSettlementType(false);
      fetchClaimTypes();
    } catch {
      alert("Error creating SettlementType.");
    }
  };

  const handleUpdateClaimType = async (values: any) => {
    try {
      await updateClaimType(values);
      alert("SettlementType updated!");
      setSelectedClaimTypeEdit(null);
      setEditClaimType(null);
      fetchClaimTypes();
    } catch {
      alert("Error updating SettlementType.");
    }
  };

  const handleDeleteClaimType = async (id: number) => {
    try {
      await deleteClaimType(id);
      alert("SettlementType deleted!");
      fetchClaimTypes();
    } catch {
      alert("Error deleting SettlementType.");
    }
  };

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  useEffect(() => {
    if (editClaimType) {
      const selectedClaimType = claimTypes.filter(
        (SettlementType: SettlementType) => SettlementType.id === editClaimType
      )[0];
      setSelectedClaimTypeEdit(selectedClaimType);
    }
  }, [editClaimType, claimTypes]);

  return (
    <Collapsible title="Settlement">
      <div className="px-4 space-y-2 py-2">
        <label className="block font-bold text-blue-800 mb-2">Settlement type</label>
        {claimTypes.length > 0 ? (
          claimTypes.map((settlementType: SettlementType) => (
            <div key={settlementType.id} className="flex items-end gap-x-6">
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Item Name</p>
                <div className="px-3 py-1 rounded-md bg-gray-300">
                    {settlementType.settlement_item}
                </div>
              </div>
              <div className="w-1/2 md:w-1/3 space-y-1">
                <p>Description</p>
                <button
                  onClick={() => {
                    if (settlementType.id !== undefined) setEditClaimType(settlementType.id);
                  }}
                  className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() => settlementType.id !== undefined && handleDeleteClaimType(settlementType.id)}
                className="p-1"
              >
                <TrashSimple className="text-red-600" size={24} />
              </button>
            </div>
          ))
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No settlement type found.</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCreatingSettlementType(true)}
          className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingClaimType && (
          <ClaimTypeCreateModal
            onSubmit={handleCreateClaimType}
            onClose={() => setIsCreatingSettlementType(false)}
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
