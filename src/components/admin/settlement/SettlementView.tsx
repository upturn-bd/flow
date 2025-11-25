"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { TrashSimple, Receipt, Money, Plus, Eye, MoneyIcon, EyeIcon, ReceiptIcon } from "@/lib/icons";
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
          <Receipt size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Settlement Types</h3>
          <Receipt size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Settlement Types</h3>
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
                      className="bg-surface-primary p-4 rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all"
                      className="bg-surface-primary p-4 rounded-lg border border-border-primary shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt size={20} weight="duotone" className="text-foreground-secondary" />
                          <h4 className="font-medium text-foreground-primary">{settlementType.settlement_item}</h4>
                          <Receipt size={20} weight="duotone" className="text-foreground-secondary" />
                          <h4 className="font-medium text-foreground-primary">{settlementType.settlement_item}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => settlementType.id !== undefined && handleDeleteClaimType(settlementType.id)}
                          isLoading={deleteLoading === settlementType.id}
                          disabled={deleteLoading === settlementType.id}
                          className="p-1 rounded-full text-foreground-tertiary hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                        >
                          <TrashSimple size={16} weight="bold" />
                        </Button>
                      </div>
                      
                      <div className="mt-2">
                        <span className="flex items-center gap-1.5 text-sm bg-background-tertiary dark:bg-surface-secondary px-2 py-1 rounded text-foreground-secondary w-fit">
                          <MoneyIcon size={16} weight="duotone" className="text-foreground-tertiary" />
                        <span className="flex items-center gap-1.5 text-sm bg-background-tertiary dark:bg-surface-secondary px-2 py-1 rounded text-foreground-secondary w-fit">
                          <MoneyIcon size={16} weight="duotone" className="text-foreground-tertiary" />
                          Allowance: {formatCurrency(settlementType.allowance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => settlementType.id !== undefined && setEditClaimType(settlementType.id)}
                          className="text-sm flex items-center gap-1 text-foreground-secondary hover:text-foreground-primary"
                          className="text-sm flex items-center gap-1 text-foreground-secondary hover:text-foreground-primary"
                        >
                          <EyeIcon size={16} weight="bold" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background-secondary dark:bg-background-tertiary rounded-lg p-6 text-center border border-border-primary">
                <div className="bg-background-secondary dark:bg-background-tertiary rounded-lg p-6 text-center border border-border-primary">
                  <div className="flex justify-center mb-3">
                    <ReceiptIcon size={40} weight="duotone" className="text-foreground-tertiary" />
                    <ReceiptIcon size={40} weight="duotone" className="text-foreground-tertiary" />
                  </div>
                  <p className="text-foreground-tertiary mb-1">No settlement types found</p>
                  <p className="text-foreground-tertiary text-sm mb-4">Add settlement types to configure the settlement system</p>
                  <p className="text-foreground-tertiary mb-1">No settlement types found</p>
                  <p className="text-foreground-tertiary text-sm mb-4">Add settlement types to configure the settlement system</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingSettlementType(true)}
            className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
            className="flex items-center gap-2 bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white"
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
