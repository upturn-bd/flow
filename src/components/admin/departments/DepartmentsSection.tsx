"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import DepartmentModal from "./DepartmentModal";
import DepartmentDetailsModal from "./DepartmentDetailsModal";
import { Building } from "@phosphor-icons/react";
import { Section, EntityListItem, EntityList, BaseModal } from "@/components/ui";

type DepartmentsSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function DepartmentsSection({
  showNotification,
}: DepartmentsSectionProps) {
  // Use context instead of individual hooks
  const {
    departments,
    divisions,
    employees,
    departmentsLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useAdminData();
  const [viewDepartment, setViewDepartment] = useState<number | null>(null);
  const [editDepartment, setEditDepartment] = useState<number | null>(null);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  const [departmentDeleteLoading, setDepartmentDeleteLoading] = useState<
    number | null
  >(null);

  const handleCreateDepartment = async (values: any) => {
    try {
      await createDepartment(values);
      setIsCreatingDepartment(false);
      showNotification("Department created successfully");
    } catch {
      showNotification("Error creating department", true);
    }
  };

  const handleUpdateDepartment = async (values: any) => {
    try {
      if (editDepartment) {
        await updateDepartment(editDepartment, values);
        setEditDepartment(null);
        showNotification("Department updated successfully");
      }
    } catch {
      showNotification("Error updating department", true);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      setDepartmentDeleteLoading(id);
      await deleteDepartment(id);
      showNotification("Department deleted successfully");
    } catch {
      showNotification("Error deleting department", true);
    } finally {
      setDepartmentDeleteLoading(null);
    }
  };

  const selectedDepartmentView = departments.find(
    (d) => d.id === viewDepartment
  );
  const selectedDepartmentEdit = departments.find(
    (d) => d.id === editDepartment
  );

  return (
    <Section
      icon={<Building size={20} />}
      title="Departments"
      description="Manage organization departments"
      loading={departmentsLoading}
      loadingText="Loading departments..."
      loadingIcon={Building}
      emptyState={{
        show: departments.length === 0,
        message: "No departments added yet. Click the plus button to add one.",
      }}
      addButton={{
        onClick: () => setIsCreatingDepartment(true),
        label: "Add Department",
      }}
    >
      <EntityList>
        {departments.map((dept) => (
          <EntityListItem
            key={dept.id}
            icon={<Building size={16} />}
            name={dept.name || "Unnamed Department"}
            actions={{
              onView: () => setViewDepartment(dept.id ?? null),
              onDelete: () => handleDeleteDepartment(dept.id ?? 0),
            }}
            deleteLoading={departmentDeleteLoading === dept.id}
          />
        ))}
      </EntityList>

      <AnimatePresence>
        {isCreatingDepartment && (
          <DepartmentModal
            key={`CreateDepartmentModal`}
            isOpen={isCreatingDepartment}
            employees={employees}
            divisions={divisions}
            onSubmit={handleCreateDepartment}
            onClose={() => setIsCreatingDepartment(false)}
          />
        )}
        {selectedDepartmentView && (
          <DepartmentDetailsModal
            key={`DepartmentDetailsModal-${selectedDepartmentView.id}`}
            employees={employees}
            divisions={divisions}
            editDepartment={() => setEditDepartment(selectedDepartmentView.id ?? null)}
            deleteDepartment={() =>
              handleDeleteDepartment(selectedDepartmentView.id ?? 0)
            }
            department={selectedDepartmentView}
            onClose={() => setViewDepartment(null)}
          />
        )}
        {selectedDepartmentEdit && (
          <DepartmentModal
            key={`EditDepartmentModal-${selectedDepartmentEdit.id}`}
            isOpen={!!selectedDepartmentEdit}
            employees={employees}
            divisions={divisions}
            initialData={selectedDepartmentEdit}
            onSubmit={handleUpdateDepartment}
            onClose={() => setEditDepartment(null)}
          />
        )}
        {showAllDepartments && (
          <BaseModal
            isOpen={showAllDepartments}
            onClose={() => setShowAllDepartments(false)}
            title="All Departments"
            icon={<Building size={20} />}
            size="lg"
          >
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <EntityList>
                {departments.length === 0 ? (
                  <div className="p-6 bg-background-secondary rounded-lg text-center text-foreground-tertiary">
                    No departments available.
                  </div>
                ) : (
                  departments.map((dept) => (
                    <EntityListItem
                      key={dept.id}
                      icon={<Building size={16} />}
                      name={dept.name || "Unnamed Department"}
                      actions={{
                        onView: () => {
                          setViewDepartment(dept.id ?? null);
                          setShowAllDepartments(false);
                        },
                        onDelete: () => handleDeleteDepartment(dept.id ?? 0),
                      }}
                      deleteLoading={departmentDeleteLoading === dept.id}
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
