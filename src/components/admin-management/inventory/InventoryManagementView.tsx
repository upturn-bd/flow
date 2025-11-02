"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { 
  RequisitionTypeModal as RequisitionTypeCreateModal,
  RequisitionInventoryCreateModal,
  RequisitionInventoryUpdateModal,
} from "./";
import { RequisitionInventory, useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { TrashSimple, Package, Tag, Plus, Eye } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function InventoryManagementView() {
  const {
    requisitionTypes,
    fetchRequisitionTypes,
    createRequisitionType,
    deleteRequisitionType,
    loading: typesLoading
  } = useRequisitionTypes();
  const [isCreatingRequisitionType, setIsCreatingRequisitionType] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleCreateRequisitionType = async (values: any) => {
    try {
      setIsLoading(true);
      await createRequisitionType(values);
      setIsCreatingRequisitionType(false);
      fetchRequisitionTypes();
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequisitionType = async (id: number) => {
    try {
      setDeleteLoading(id);
      await deleteRequisitionType(id);
      fetchRequisitionTypes();
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setDeleteLoading(null);
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
    loading: inventoriesLoading
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
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryDeleteLoading, setInventoryDeleteLoading] = useState<number | null>(null);

  const handleCreateRequisitionInventory = async (values: any) => {
    try {
      setInventoryLoading(true);
      await createRequisitionInventory(values);
      setIsCreatingRequisitionInventory(false);
      fetchRequisitionInventories();
    } catch (error) {
      console.error("Error creating inventory item:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleUpdateRequisitionInventory = async (values: any) => {
    try {
      setInventoryLoading(true);
      await updateRequisitionInventory(values);
      setSelectedRequisitionInventoryEdit(null);
      setEditRequisitionInventory(null);
      fetchRequisitionInventories();
    } catch (error) {
      console.error("Error updating inventory item:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleDeleteRequisitionInventory = async (id: number) => {
    try {
      setInventoryDeleteLoading(id);
      await deleteRequisitionInventory(id);
      fetchRequisitionInventories();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
    } finally {
      setInventoryDeleteLoading(null);
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
      setSelectedRequisitionInventoryEdit(selectedRequisitionInventory);
    }
  }, [editRequisitionInventory, requisitionInventories]);

  return (
    <Collapsible title="Inventory/Equipment/Supplies">
      <div className="px-4 space-y-6 py-4">
        {/* Categories Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Tag size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
          </div>

          {typesLoading ? (
            <LoadingSpinner
              icon={Tag}
              text="Loading categories..."
              height="h-40"
              color="gray"
            />
          ) : (
            <div>
              <AnimatePresence>
                {requisitionTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {requisitionTypes.map((type, idx) => (
                      <div
                        key={type.id || idx}
                        className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border border-gray-200 shadow-sm"
                      >
                        <span className="text-gray-800 font-medium">{type.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => type.id !== undefined && handleDeleteRequisitionType(type.id)}
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
                    <p className="text-gray-500 mb-1">No categories found</p>
                    <p className="text-gray-400 text-sm mb-4">Create categories to organize your inventory items</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingRequisitionType(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Category
            </Button>
          </div>

          <AnimatePresence>
            {isCreatingRequisitionType && (
              <RequisitionTypeCreateModal
                isOpen={isCreatingRequisitionType}
                onSubmit={handleCreateRequisitionType}
                onClose={() => setIsCreatingRequisitionType(false)}
                isLoading={isLoading}
              />
            )}
          </AnimatePresence>
        </section>

        {/* Inventory Items Section */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Package size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
          </div>

          {inventoriesLoading ? (
            <LoadingSpinner
              icon={Package}
              text="Loading inventory items..."
              height="h-40"
              color="gray"
            />
          ) : (
            <div>
              <AnimatePresence>
                {requisitionInventories.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {requisitionInventories.map((item: RequisitionInventory, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <Package size={20} weight="duotone" className="text-gray-600" />
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => item.id !== undefined && handleDeleteRequisitionInventory(item.id)}
                            isLoading={inventoryDeleteLoading === item.id}
                            disabled={inventoryDeleteLoading === item.id}
                            className="p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                          >
                            <TrashSimple size={16} weight="bold" />
                          </Button>
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                            Qty: {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditRequisitionInventory(item.id!)}
                            className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
                          >
                            <Eye size={16} weight="bold" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                    <div className="flex justify-center mb-3">
                      <Package size={40} weight="duotone" className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-1">No inventory items found</p>
                    <p className="text-gray-400 text-sm mb-4">Add items to your inventory to keep track of your supplies</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingRequisitionInventory(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Inventory Item
            </Button>
          </div>
        </section>

        <AnimatePresence>
          {isCreatingRequisitionInventory && (
            <RequisitionInventoryCreateModal
              isOpen={isCreatingRequisitionInventory}
              requisitionCategories={requisitionTypes}
              onSubmit={handleCreateRequisitionInventory}
              onClose={() => setIsCreatingRequisitionInventory(false)}
              isLoading={inventoryLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedRequisitionInventoryEdit && (
            <RequisitionInventoryUpdateModal
              isOpen={!!selectedRequisitionInventoryEdit}
              initialData={selectedRequisitionInventoryEdit}
              requisitionCategories={requisitionTypes}
              onSubmit={handleUpdateRequisitionInventory}
              onClose={() => {
                setSelectedRequisitionInventoryEdit(null);
                setEditRequisitionInventory(null);
              }}
              isLoading={inventoryLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
