"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import DivisionModal from "./DivisionModal";
import DivisionDetailsModal from "./DivisionDetailsModal";
import { Stack } from "@phosphor-icons/react";
import { Section, EntityListItem, EntityList } from "@/components/ui";

type DivisionsSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function DivisionsSection({ showNotification }: DivisionsSectionProps) {
  // Use context instead of individual hook
  const {
    divisions,
    employees,
    divisionsLoading,
    createDivision,
    updateDivision,
    deleteDivision,
  } = useAdminData();
  const [viewDivision, setViewDivision] = useState<number | null>(null);
  const [editDivision, setEditDivision] = useState<number | null>(null);
  const [isCreatingDivision, setIsCreatingDivision] = useState(false);
  const [divisionDeleteLoading, setDivisionDeleteLoading] = useState<number | null>(null);

  const handleCreateDivision = async (values: any) => {
    try {
      await createDivision(values);
      setIsCreatingDivision(false);
      showNotification("Division created successfully");
    } catch {
      showNotification("Error creating Division", true);
    }
  };

  const handleUpdateDivision = async (values: any) => {
    try {
      if (editDivision) {
        await updateDivision(editDivision.toString(), values);
        setEditDivision(null);
        showNotification("Division updated successfully");
      }
    } catch {
      showNotification("Error updating Division", true);
    }
  };

  const handleDeleteDivision = async (id: number) => {
    try {
      setDivisionDeleteLoading(id);
      await deleteDivision(id.toString());
      showNotification("Division deleted successfully");
    } catch {
      showNotification("Error deleting Division", true);
    } finally {
      setDivisionDeleteLoading(null);
    }
  };

  const selectedDivisionView = divisions.find((d) => d.id === viewDivision);
  const selectedDivisionEdit = divisions.find((d) => d.id === editDivision);

  return (
    <Section
      icon={<Stack size={20} />}
      title="Divisions"
      description="Manage organization divisions"
      loading={divisionsLoading}
      loadingText="Loading divisions..."
      loadingIcon={Stack}
      emptyState={{
        show: divisions.length === 0,
        message: "No divisions added yet. Click the plus button to add one.",
      }}
      addButton={{
        onClick: () => setIsCreatingDivision(true),
        label: "Add Division",
      }}
      padding="sm"
    >
      <EntityList>
        {divisions.map((div) => (
          <EntityListItem
            key={div.id}
            icon={<Stack size={16} />}
            name={div.name || "Unnamed Division"}
            actions={{
              onView: () => setViewDivision(div.id ?? null),
              onDelete: () => handleDeleteDivision(div.id ?? 0),
            }}
            deleteLoading={divisionDeleteLoading === div.id}
          />
        ))}
      </EntityList>

      <AnimatePresence>
        {isCreatingDivision && (
          <DivisionModal
            key={`CreateDivisionModal`}
            isOpen={isCreatingDivision}
            employees={employees}
            onSubmit={handleCreateDivision}
            onClose={() => setIsCreatingDivision(false)}
          />
        )}
        {selectedDivisionView && (
          <DivisionDetailsModal
            key={`DivisionDetailsModal-${selectedDivisionView.id}`}
            editDivision={() => setEditDivision(selectedDivisionView.id ?? null)}
            deleteDivision={() => handleDeleteDivision(selectedDivisionView.id!)}
            division={selectedDivisionView}
            onClose={() => setViewDivision(null)}
            employees={employees}
          />
        )}
        {selectedDivisionEdit && (
          <DivisionModal
            key={`EditDivisionModal-${selectedDivisionEdit.id}`}
            isOpen={!!selectedDivisionEdit}
            employees={employees}
            initialData={selectedDivisionEdit}
            onSubmit={handleUpdateDivision}
            onClose={() => setEditDivision(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
} 