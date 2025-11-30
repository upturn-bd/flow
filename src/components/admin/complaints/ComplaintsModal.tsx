"use client";

import { ComplaintsType } from "@/lib/types";
import { validateComplaintsType } from "@/lib/utils/validation";
import { Tag } from "@/lib/icons";
import { FormModal } from "@/components/ui/modals";
import { FormField } from "@/components/forms";

interface ComplaintsModalProps {
  onSubmit: (values: ComplaintsType) => void;
  onClose: () => void;
  isOpen: boolean;
  isLoading?: boolean;
}

export default function ComplaintTypeCreateModal({
  onSubmit,
  onClose,
  isOpen,
  isLoading = false,
}: ComplaintsModalProps) {
  const initialValues: ComplaintsType = {
    name: "",
  };

  return (
    <FormModal<ComplaintsType>
      title="Configure Complaint Type"
      icon={<Tag size={24} weight="duotone" />}
      initialValues={initialValues}
      validationFn={validateComplaintsType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Create Type"
    >
      {({ values, errors, handleChange }) => (
        <FormField
          name="name"
          label="Type Name"
          icon={<Tag size={18} weight="duotone" />}
          placeholder="Enter Type Name"
          value={values.name}
          error={errors.name}
          onChange={handleChange}
        />
      )}
    </FormModal>
  );
}
