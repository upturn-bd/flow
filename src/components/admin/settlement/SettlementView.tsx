"use client";

import { useEffect, useState } from "react";
import Collapsible from "../CollapsibleComponent";
import { Receipt, Plus, MoneyIcon } from "@/lib/icons";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { ClaimType } from "@/lib/types/schemas";
import {
  ClaimTypeCreateModal,
  ClaimTypeUpdateModal,
} from ".";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EntityCard, EntityCardGrid, EntityCardBadge, EmptyState } from "@/components/ui";

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
        </div>

        {loading ? (
          <LoadingSpinner
            icon={Receipt}
            text="Loading settlement types..."
            height="h-40"
            color="gray"
          />
        ) : (
          <AnimatePresence>
            {claimTypes.length > 0 ? (
              <EntityCardGrid columns={3}>
                {claimTypes.map((settlementType: SettlementType, idx) => (
                  <EntityCard
                    key={settlementType.id || idx}
                    title={settlementType.settlement_item}
                    icon={Receipt}
                    onDelete={settlementType.id !== undefined ? () => handleDeleteClaimType(settlementType.id!) : undefined}
                    deleteLoading={deleteLoading === settlementType.id}
                    onView={settlementType.id !== undefined ? () => setEditClaimType(settlementType.id!) : undefined}
                  >
                    <div className="mt-2">
                      <EntityCardBadge icon={MoneyIcon}>
                        Allowance: {formatCurrency(settlementType.allowance)}
                      </EntityCardBadge>
                    </div>
                  </EntityCard>
                ))}
              </EntityCardGrid>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No settlement types found"
                description="Add settlement types to configure the settlement system"
              />
            )}
          </AnimatePresence>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary" 
            onClick={() => setIsCreatingSettlementType(true)}
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
