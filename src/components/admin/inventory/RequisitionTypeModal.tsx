import React from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField } from '@/components/forms';
import { validateRequisitionType, type RequisitionTypeData } from '@/lib/validation';
import { Tag } from "@phosphor-icons/react";

interface RequisitionTypeModalProps {
  isOpen: boolean;
  onSubmit: (data: RequisitionTypeData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const RequisitionTypeModal: React.FC<RequisitionTypeModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const defaultData: RequisitionTypeData = {
    name: '',
  };

  if (!isOpen) return null;

  return (
    <FormModal<RequisitionTypeData>
      title="Create Category"
      icon={<Tag size={24} weight="duotone" className="text-foreground-secondary" />}
      initialValues={defaultData}
      validationFn={validateRequisitionType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Create Category"
      size="sm"
    >
      {({ values, handleChange, errors }) => (
        <>
          <FormField
            name="name"
            label="Category Name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Enter category name"
            icon={<Tag size={18} weight="duotone" className="text-foreground-tertiary" />}
          />
        </>
      )}
    </FormModal>
  );
};

export default RequisitionTypeModal;
