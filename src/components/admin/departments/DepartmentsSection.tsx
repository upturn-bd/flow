"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import DepartmentModal from "./DepartmentModal";
import DepartmentDetailsModal from "./DepartmentDetailsModal";
import { Building, Plus, Eye, X, Trash } from "@/lib/icons";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getCompanyInfo } from "@/lib/utils/auth";
import BaseModal from "@/components/ui/modals/BaseModal";

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

  // Show only first 10 departments in main view
  const displayedDepartments = departments.slice(0, 10);
  const hasMoreDepartments = departments.length > 10;

  const renderDepartmentCard = (dept: any) => (
    <div
      key={dept.id}
      className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center mb-2 sm:mb-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mr-2 sm:mr-3">
          <Building size={16} />
        </div>
        <span className="font-medium text-gray-800 text-sm sm:text-base">
          {dept.name}
        </span>
      </div>

      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={() => {
            setViewDepartment(dept.id ?? null);
            setShowAllDepartments(false);
          }}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs sm:text-sm flex items-center gap-1 hover:bg-gray-200 transition-colors"
        >
          <Eye size={14} />
          <span className="hidden xs:inline">Details</span>
        </button>
        <button
          onClick={() => handleDeleteDepartment(dept.id ?? 0)}
          disabled={departmentDeleteLoading === dept.id}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-red-50 text-red-600 text-xs sm:text-sm flex items-center gap-1 hover:bg-red-100 transition-colors ${departmentDeleteLoading === dept.id
            ? "opacity-50 cursor-not-allowed"
            : ""
            }`}
        >
          <Trash size={14} />
          <span className="hidden xs:inline">
            {departmentDeleteLoading === dept.id
              ? "Deleting..."
              : "Delete"}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <section className="bg-surface-primary p-4 sm:p-6 rounded-lg border border-border-primary shadow-sm">
      <div className="border-b border-border-primary pb-4 mb-4">
        <h3 className="text-lg font-semibold text-foreground-primary flex items-center">
          <Building className="w-5 h-5 mr-2 text-foreground-tertiary" />
          Departments
        </h3>
        <p className="text-sm text-foreground-tertiary">Manage organization departments</p>
      </div>

      {departmentsLoading ? (
        <LoadingSpinner
          icon={Building}
          text="Loading departments..."
          height="h-40"
          color="gray"
        />
      ) : (
        <div className="space-y-3">
          {departments.length === 0 ? (
            <div className="p-4 sm:p-6 bg-background-secondary rounded-lg text-center text-foreground-tertiary">
              No departments added yet. Click the plus button to add one.
            </div>
          ) : (
            departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mr-2 sm:mr-3">
                    <Building size={16} />
                  </div>
                  <span className="font-medium text-gray-800 text-sm sm:text-base">
                    {dept.name}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setViewDepartment(dept.id ?? null)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs sm:text-sm flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={14} />
                    <span className="hidden xs:inline">Details</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(dept.id ?? 0)}
                    disabled={departmentDeleteLoading === dept.id}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-red-50 text-red-600 text-xs sm:text-sm flex items-center gap-1 hover:bg-red-100 transition-colors ${departmentDeleteLoading === dept.id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                      }`}
                  >
                    <Trash size={14} />
                    <span className="hidden xs:inline">
                      {departmentDeleteLoading === dept.id
                        ? "Deleting..."
                        : "Delete"}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-center sm:justify-start mt-4">
        <button
          onClick={() => setIsCreatingDepartment(true)}
          className="flex items-center justify-center text-white bg-primary-700 dark:bg-primary-600 rounded-full w-10 h-10 sm:w-8 sm:h-8 shadow-sm hover:bg-primary-800 dark:hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

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
            icon={<Building className="w-5 h-5" />}
            size="lg"
          >
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {departments.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                  No departments available.
                </div>
              ) : (
                departments.map((dept) => renderDepartmentCard(dept))
              )}
            </div>
          </BaseModal>
        )}
      </AnimatePresence>
    </section>
  );
}
