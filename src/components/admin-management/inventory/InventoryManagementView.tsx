"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import RequisitionTypeCreateModal, {
  RequisitionInventoryCreateModal,
  RequisitionInventoryUpdateModal,
} from "./InventoryModal";
import { RequisitionInventory, useRequisitionTypes } from "@/hooks/useConfigTypes";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { TrashSimple, Package, Tag, Plus, Eye } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
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
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="px-4 space-y-6 py-4"
      >
        {/* Categories Section */}
        <section>
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
            <Tag size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
          </motion.div>

          {typesLoading ? (
            <LoadingSpinner
              icon={Tag}
              text="Loading categories..."
              height="h-40"
              color="gray"
            />
          ) : (
            <motion.div variants={fadeInUp}>
              <AnimatePresence>
                {requisitionTypes.length > 0 ? (
                  <motion.div className="flex flex-wrap gap-2">
                    {requisitionTypes.map((type, idx) => (
                      <motion.div
                        key={type.id || idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
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
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={fadeIn}
                    className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex justify-center mb-3"
                    >
                      <Tag size={40} weight="duotone" className="text-gray-400" />
                    </motion.div>
                    <p className="text-gray-500 mb-1">No categories found</p>
                    <p className="text-gray-400 text-sm mb-4">Create categories to organize your inventory items</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div variants={fadeIn} className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingRequisitionType(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Category
            </Button>
          </motion.div>

          <AnimatePresence>
            {isCreatingRequisitionType && (
              <RequisitionTypeCreateModal
                onSubmit={handleCreateRequisitionType}
                onClose={() => setIsCreatingRequisitionType(false)}
                isLoading={isLoading}
              />
            )}
          </AnimatePresence>
        </section>

        {/* Inventory Items Section */}
        <section className="mt-8">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
            <Package size={22} weight="duotone" className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
          </motion.div>

          {inventoriesLoading ? (
            <LoadingSpinner
              icon={Package}
              text="Loading inventory items..."
              height="h-40"
              color="gray"
            />
          ) : (
            <motion.div variants={fadeInUp}>
              <AnimatePresence>
                {requisitionInventories.length > 0 ? (
                  <motion.div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {requisitionInventories.map((item: RequisitionInventory, idx) => (
                      <motion.div
                        key={item.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: idx * 0.05 }}
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
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={fadeIn}
                    className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="flex justify-center mb-3"
                    >
                      <Package size={40} weight="duotone" className="text-gray-400" />
                    </motion.div>
                    <p className="text-gray-500 mb-1">No inventory items found</p>
                    <p className="text-gray-400 text-sm mb-4">Add items to your inventory to keep track of your supplies</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div variants={fadeIn} className="flex justify-end mt-4">
            <Button
              variant="primary" 
              onClick={() => setIsCreatingRequisitionInventory(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Plus size={16} weight="bold" />
              Add Inventory Item
            </Button>
          </motion.div>
        </section>

        <AnimatePresence>
          {isCreatingRequisitionInventory && (
            <RequisitionInventoryCreateModal
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
      </motion.div>
    </Collapsible>
  );
}
