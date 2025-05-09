"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import RequisitionTypeCreateModal, {
  RequisitionInventoryCreateModal,
  RequisitionInventoryUpdateModal,
} from "./InventoryModal";
import { useRequisitionTypes } from "@/hooks/useRequisitionTypes";
import {
  RequisitionInventory,
  useRequisitionInventories,
} from "@/hooks/useInventory";
import { TrashSimple } from "@phosphor-icons/react";

export default function InventoryManagementView() {
  const {
    requisitionTypes,
    fetchRequisitionTypes,
    createRequisitionType,
    deleteRequisitionType,
  } = useRequisitionTypes();
  const [isCreatingRequisitionType, setIsCreatingRequisitionType] =
    useState(false);

  const handleCreateRequisitionType = async (values: any) => {
    try {
      await createRequisitionType(values);
      alert("RequisitionType created!");
      setIsCreatingRequisitionType(false);
      fetchRequisitionTypes();
    } catch {
      alert("Error creating RequisitionType.");
    }
  };

  const handleDeleteRequisitionType = async (id: number) => {
    try {
      await deleteRequisitionType(id);
      alert("RequisitionType deleted!");
      fetchRequisitionTypes();
    } catch {
      alert("Error deleting RequisitionType.");
    }
  };

  useEffect(() => {
    fetchRequisitionTypes();
  }, [fetchRequisitionTypes]);

  //Inventory states and functions
  const {
    requisitionInventories,
    fetchRequisitionInventories,
    createRequisitionInventory,
    updateRequisitionInventory,
    deleteRequisitionInventory,
  } = useRequisitionInventories();
  const [editRequisitionInventory, setEditRequisitionInventory] = useState<
    number | null
  >(null);
  const [isCreatingRequisitionInventory, setIsCreatingRequisitionInventory] =
    useState(false);
  const [
    selectedRequisitionInventoryEdit,
    setSelectedRequisitionInventoryEdit,
  ] = useState<RequisitionInventory | null>(null);

  const handleCreateRequisitionInventory = async (values: any) => {
    try {
      await createRequisitionInventory(values);
      alert("RequisitionInventory created!");
      setIsCreatingRequisitionInventory(false);
      fetchRequisitionInventories();
    } catch {
      alert("Error creating RequisitionInventory.");
    }
  };

  const handleUpdateRequisitionInventory = async (values: any) => {
    try {
      await updateRequisitionInventory(values);
      alert("RequisitionInventory updated!");
      setSelectedRequisitionInventoryEdit(null);
      setEditRequisitionInventory(null);
      fetchRequisitionInventories();
    } catch {
      alert("Error updating RequisitionInventory.");
    }
  };

  const handleDeleteRequisitionInventory = async (id: number) => {
    try {
      await deleteRequisitionInventory(id);
      alert("RequisitionInventory deleted!");
      fetchRequisitionInventories();
    } catch {
      alert("Error deleting RequisitionInventory.");
    }
  };

  useEffect(() => {
    fetchRequisitionInventories();
  }, [fetchRequisitionInventories]);

  useEffect(() => {
    if (editRequisitionInventory) {
      const selectedRequisitionInventory = requisitionInventories.filter(
        (requisitionInventory: RequisitionInventory) =>
          requisitionInventory.id === editRequisitionInventory
      )[0];
      console.log("Selected Leave Type:", selectedRequisitionInventory);
      setSelectedRequisitionInventoryEdit(selectedRequisitionInventory);
    }
  }, [editRequisitionInventory, requisitionInventories]);

  return (
    <Collapsible title="Inventory/Equipment/Supplies">
      <div className="px-4 space-y-2 py-2">
        <label className="block font-bold text-blue-800 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {requisitionTypes.length > 0 ? (
            requisitionTypes.map((type, idx) => (
              <div
                key={idx}
                className="flex items-center bg-white rounded-sm shadow-sm px-3 py-1"
              >
                {type.name}
                <button
                  type="button"
                  className="ml-2 text-gray-600"
                  onClick={() => handleDeleteRequisitionType(type.id)}
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
              <p>No categories found.</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingRequisitionType(true)}
          className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingRequisitionType && (
          <RequisitionTypeCreateModal
            onSubmit={handleCreateRequisitionType}
            onClose={() => setIsCreatingRequisitionType(false)}
          />
        )}
      </div>
      <div className="px-4 space-y-2 py-2">
        <label className="block font-bold text-blue-800 mb-2">Inventory</label>
        {requisitionInventories.length > 0 ? (
          requisitionInventories.map(
            (requisitionInventory: RequisitionInventory) => (
              <div
                key={requisitionInventory.name}
                className="flex items-end gap-x-6"
              >
                <div className="w-1/2 md:w-1/3 space-y-1">
                  <p>Holiday Name</p>
                  <div className="px-3 py-1 rounded-md bg-gray-300">
                    {requisitionInventory.name}
                  </div>
                </div>
                <div className="w-1/2 md:w-1/3 space-y-1">
                  <p>Description</p>
                  <button
                    onClick={() => {
                      setEditRequisitionInventory(
                        parseInt(requisitionInventory.id)
                      );
                    }}
                    className="w-full px-3 py-1 rounded-md bg-gray-300 text-left"
                  >
                    View Details
                  </button>
                </div>
                <button
                  onClick={() =>
                    handleDeleteRequisitionInventory(
                      parseInt(requisitionInventory.id)
                    )
                  }
                  className="p-1"
                >
                  <TrashSimple className="text-red-600" size={24} />
                </button>
              </div>
            )
          )
        ) : (
          <div className="w-full flex items-center gap-x-6 text-center text-lg font-semibold">
            <p>No inventory found.</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCreatingRequisitionInventory(true)}
          className="mt-4 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingRequisitionInventory && (
          <RequisitionInventoryCreateModal
            requisitionCategories={requisitionTypes}
            onSubmit={handleCreateRequisitionInventory}
            onClose={() => setIsCreatingRequisitionInventory(false)}
          />
        )}

        {selectedRequisitionInventoryEdit && (
          <RequisitionInventoryUpdateModal
            initialData={selectedRequisitionInventoryEdit}
            requisitionCategories={requisitionTypes}
            onSubmit={handleUpdateRequisitionInventory}
            onClose={() => {
              setEditRequisitionInventory(null);
              setSelectedRequisitionInventoryEdit(null);
            }}
          />
        )}
      </div>
    </Collapsible>
  );
}
