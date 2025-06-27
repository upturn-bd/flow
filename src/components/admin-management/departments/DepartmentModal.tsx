"use client";

import { Department } from "@/lib/types";
import { validateDepartment } from "@/lib/utils/validation";
import { Buildings } from "@phosphor-icons/react";
import { FormModal } from "@/components/ui/modals";
import { FormField } from "@/components/forms";

interface DepartmentModalProps {
  isOpen: boolean;
  onSubmit: (values: Department) => void;
  onClose: () => void;
  isLoading?: boolean;
  initialData?: Department | null;
  employees?: { id: string; name: string }[]; // Optional, for future use
  divisions?: any[]; // Optional, for future use
}

export default function DepartmentModal({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
  initialData,
}: DepartmentModalProps) {
  const initialValues: Department = {
    name: initialData?.name || "",
  };

  return (
    <FormModal<Department>
      title={initialData ? "Edit Department" : "Create Department"}
      icon={<Buildings size={24} weight="duotone" />}
      initialValues={initialValues}
      validationFn={validateDepartment}
      onSubmit={onSubmit}
      onClose={onClose}
      isLoading={isLoading}
      submitButtonText={initialData ? "Update Department" : "Create Department"}
    >
      {({ values, errors, handleChange }) => (
        <FormField
          name="name"
          label="Department Name"
          icon={<Buildings size={18} weight="duotone" />}
          placeholder="Enter Department Name"
          value={values.name}
          error={errors.name}
          onChange={handleChange}
        />
      )}
    </FormModal>
  );
}
