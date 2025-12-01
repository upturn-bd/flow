"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { 
  RequisitionTypeModal as RequisitionTypeCreateModal,
  RequisitionInventoryCreateModal,
  RequisitionInventoryUpdateModal,
} from ".";
import { RequisitionInventory, useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { Trash, Package, Tag, Plus } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EntityCard, EntityCardGrid, EmptyState } from "@/components/ui";

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

  // Inventory states and functions
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
            <Tag size={22} weight="duotone" className="text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground-primary">Categories</h3>
          </div>

          {typesLoading ? (
            <LoadingSpinner
              icon={Tag}
              text="Loading categories..."
              height="h-40"
              color="gray"
            />
          ) : (
            <AnimatePresence>
              {requisitionTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {requisitionTypes.map((type, idx) => (
                    <div
                      key={type.id || idx}
                      className="flex items-center bg-background-tertiary rounded-lg px-3 py-2 border border-border-primary shadow-sm"
                    >
                      <span className="text-foreground-primary font-medium">{type.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => type.id !== undefined && handleDeleteRequisitionType(type.id)}
                        isLoading={deleteLoading === type.id}
                        disabled={deleteLoading === type.id}
                        className="ml-2 p-1 rounded-full text-foreground-tertiary hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <Trash size={16} weight="bold" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Tag}
                  title="No categories found"
                  description="Create categories to organize your inventory items"
                />
              )}
            </AnimatePresence>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingRequisitionType(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
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
            <Package size={22} weight="duotone" className="text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground-primary">Inventory Items</h3>
          </div>

          {inventoriesLoading ? (
            <LoadingSpinner
              icon={Package}
              text="Loading inventory items..."
              height="h-40"
              color="gray"
            />
          ) : (
            <AnimatePresence>
              {requisitionInventories.length > 0 ? (
                <EntityCardGrid columns={3}>
                  {requisitionInventories.map((item: RequisitionInventory, idx) => (
                    <EntityCard
                      key={item.id || idx}
                      title={item.name}
                      icon={Package}
                      description={item.description}
                      onDelete={item.id !== undefined ? () => handleDeleteRequisitionInventory(item.id!) : undefined}
                      deleteLoading={inventoryDeleteLoading === item.id}
                      onView={() => setEditRequisitionInventory(item.id!)}
                    >
                      <div className="flex items-center mt-2">
                        <span className="text-sm bg-background-tertiary dark:bg-surface-secondary px-2 py-1 rounded text-foreground-secondary">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </EntityCard>
                  ))}
                </EntityCardGrid>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No inventory items found"
                  description="Add items to your inventory to keep track of your supplies"
                />
              )}
            </AnimatePresence>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingRequisitionInventory(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
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