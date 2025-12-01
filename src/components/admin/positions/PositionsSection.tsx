"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import PositionDetailsModal from "./PositionDetailsModal";
import PositionModal from "./PositionModal";
import { Briefcase } from "@/lib/icons";
import { Section, EntityListItem, EntityList, BaseModal, Button } from "@/components/ui";

type PositionsSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function PositionsSection({
  showNotification,
}: PositionsSectionProps) {
  // Use context instead of individual hooks
  const {
    departments,
    grades,
    positions,
    positionsLoading,
    createPosition,
    updatePosition,
    deletePosition,
  } = useAdminData();

  const [viewPosition, setViewPosition] = useState<number | null>(null);
  const [editPosition, setEditPosition] = useState<number | null>(null);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [positionDeleteLoading, setPositionDeleteLoading] = useState<
    number | null
  >(null);

  const handleCreatePosition = async (values: any) => {
    try {
      await createPosition(values);
      setIsCreatingPosition(false);
      showNotification("Position created successfully");
    } catch {
      showNotification("Error creating Position", true);
    }
  };

  const handleUpdatePosition = async (values: any) => {
    try {
      if (editPosition) {
        await updatePosition(editPosition.toString(), values);
      }
      setEditPosition(null);
      showNotification("Position updated successfully");
    } catch {
      showNotification("Error updating Position", true);
    }
  };

  const handleDeletePosition = async (id: number) => {
    try {
      setPositionDeleteLoading(id);
      await deletePosition(id.toString());
      showNotification("Position deleted successfully");
    } catch {
      showNotification("Error deleting Position", true);
    } finally {
      setPositionDeleteLoading(null);
    }
  };

  const selectedPositionView = positions.find((d) => d.id === viewPosition);
  const selectedPositionEdit = positions.find((d) => d.id === editPosition);

  // Show only first 10 positions in main view
  const displayedPositions = positions.slice(0, 10);
  const hasMorePositions = positions.length > 10;

  return (
    <Section
      icon={<Briefcase size={20} />}
      title="Positions"
      description="Manage job positions and roles"
      loading={positionsLoading}
      loadingText="Loading positions..."
      loadingIcon={Briefcase}
      emptyState={{
        show: positions.length === 0,
        message: "No positions added yet. Click the plus button to add one.",
      }}
      addButton={{
        onClick: () => setIsCreatingPosition(true),
        label: "Add Position",
      }}
    >
      <EntityList>
        {displayedPositions.map((position) => (
          <EntityListItem
            key={position.id}
            icon={<Briefcase size={16} />}
            name={position.name || "Unnamed Position"}
            actions={{
              onView: () => {
                setViewPosition(position.id ?? null);
                setShowAllPositions(false);
              },
              onDelete: () => handleDeletePosition(position.id ?? 0),
            }}
            deleteLoading={positionDeleteLoading === position.id}
          />
        ))}
      </EntityList>
      
      {hasMorePositions && (
        <Button
          variant="secondary"
          onClick={() => setShowAllPositions(true)}
          fullWidth
          className="mt-3"
        >
          <Briefcase size={16} />
          View All Positions ({positions.length})
        </Button>
      )}

      <AnimatePresence>
        {isCreatingPosition && (
          <PositionModal
            key={`CreatePositionModal`}
            departments={departments.filter(d => d.id != null) as { id: number; name: string }[]}
            grades={grades.filter(g => g.id != null) as { id: number; name: string }[]}
            onSubmit={handleCreatePosition}
            onClose={() => setIsCreatingPosition(false)}
            isOpen={isCreatingPosition}
          />
        )}
        {selectedPositionView && (
          <PositionDetailsModal
            key={`PositionDetailsModal-${selectedPositionView.id}`}
            editPosition={() => setEditPosition(selectedPositionView.id ?? null)}
            deletePosition={() => handleDeletePosition(selectedPositionView.id!)}
            position={selectedPositionView}
            onClose={() => setViewPosition(null)}
            departments={departments}
            grades={grades}
          />
        )}
        {selectedPositionEdit && (
          <PositionModal
            key={`EditPositionModal-${selectedPositionEdit.id}`}
            departments={departments.filter(d => d.id != null) as { id: number; name: string }[]}
            grades={grades.filter(g => g.id != null) as { id: number; name: string }[]}
            initialData={selectedPositionEdit}
            onSubmit={handleUpdatePosition}
            onClose={() => setEditPosition(null)}
            isOpen={!!selectedPositionEdit}
          />
        )}
        {showAllPositions && (
          <BaseModal
            isOpen={showAllPositions}
            onClose={() => setShowAllPositions(false)}
            title="All Positions"
            icon={<Briefcase size={20} />}
            size="lg"
          >
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <EntityList>
                {positions.length === 0 ? (
                  <div className="p-6 bg-background-secondary rounded-lg text-center text-foreground-tertiary">
                    No positions available.
                  </div>
                ) : (
                  positions.map((position) => (
                    <EntityListItem
                      key={position.id}
                      icon={<Briefcase size={16} />}
                      name={position.name || "Unnamed Position"}
                      actions={{
                        onView: () => {
                          setViewPosition(position.id ?? null);
                          setShowAllPositions(false);
                        },
                        onDelete: () => handleDeletePosition(position.id ?? 0),
                      }}
                      deleteLoading={positionDeleteLoading === position.id}
                    />
                  ))
                )}
              </EntityList>
            </div>
          </BaseModal>
        )}
      </AnimatePresence>
    </Section>
  );
}
