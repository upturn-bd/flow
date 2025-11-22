"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { TrashSimple, Receipt, Money, Plus, Eye, MoneyIcon, EyeIcon, ReceiptIcon } from "@phosphor-icons/react";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { ClaimType } from "@/lib/types/schemas";
import {
  ClaimTypeCreateModal,
  ClaimTypeUpdateModal,
} from ".";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

type SettlementType = ClaimType;

export default function ClaimSettlementView() {
  const {
    claimTypes,
    fetchClaimTypes,
    createClaimType,
    deleteClaimType,
    updateClaimType,
    loading
  } = useClaimTypes();
  const [editClaimType, setEditClaimType] = useState<number | null>(null);
  const [isCreatingClaimType, setIsCreatingSettlementType] = useState(false);
  const [selectedClaimTypeEdit, setSelectedClaimTypeEdit] =
    useState<SettlementType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const handleCreateClaimType = async (values: any) => {
    try {
      setIsLoading(true);
      await createClaimType(values);
      setIsCreatingSettlementType(false);
      fetchClaimTypes();
    } catch (error) {
      console.error("Error creating settlement type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClaimType = async (values: any) => {
    try {
      setIsLoading(true);
      await updateClaimType(values);
      setSelectedClaimTypeEdit(null);
      setEditClaimType(null);
      fetchClaimTypes();
    } catch (error) {
      console.error("Error updating settlement type:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClaimType = async (id: number) => {
    try {
      setDeleteLoading(id);
      await deleteClaimType(id);
      fetchClaimTypes();
    } catch (error) {
      console.error("Error deleting settlement type:", error);
    } finally {
      setDeleteLoading(null);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Collapsible title="Settlement">
      <div className="px-4 space-y-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Receipt size={22} weight="duotone" className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Settlement Types</h3>
        </div>

        {loading ? (
          <LoadingSpinner
            icon={Receipt}
            text="Loading settlement types..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            <AnimatePresence>
              {claimTypes.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {claimTypes.map((settlementType: SettlementType, idx) => (
                    <div
                      key={settlementType.id || idx}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt size={20} weight="duotone" className="text-gray-600" />
                          <h4 className="font-medium text-gray-800">{settlementType.settlement_item}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => settlementType.id !== undefined && handleDeleteClaimType(settlementType.id)}
                          isLoading={deleteLoading === settlementType.id}
                          disabled={deleteLoading === settlementType.id}
                          className="p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashSimple size={16} weight="bold" />
                        </Button>
                      </div>
                      
                      <div className="mt-2">
                        <span className="flex items-center gap-1.5 text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 w-fit">
                          <MoneyIcon size={16} weight="duotone" className="text-gray-500" />
                          Allowance: {formatCurrency(settlementType.allowance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => settlementType.id !== undefined && setEditClaimType(settlementType.id)}
                          className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <EyeIcon size={16} weight="bold" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                  <div className="flex justify-center mb-3">
                    <ReceiptIcon size={40} weight="duotone" className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-1">No settlement types found</p>
                  <p className="text-gray-400 text-sm mb-4">Add settlement types to configure the settlement system</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingSettlementType(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Settlement Type
          </Button>
        </div>

        <AnimatePresence>
          {isCreatingClaimType && (
            <ClaimTypeCreateModal
              isOpen={isCreatingClaimType}
              onSubmit={handleCreateClaimType}
              onClose={() => setIsCreatingSettlementType(false)}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedClaimTypeEdit && (
            <ClaimTypeUpdateModal
              isOpen={!!selectedClaimTypeEdit}
              initialData={selectedClaimTypeEdit}
              onSubmit={handleUpdateClaimType}
              onClose={() => {
                setEditClaimType(null);
                setSelectedClaimTypeEdit(null);
              }}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
