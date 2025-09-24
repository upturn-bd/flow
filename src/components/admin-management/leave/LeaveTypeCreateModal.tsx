import React from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField, NumberField } from '@/components/forms';
import { validateLeaveType, type LeaveTypeData } from '@/lib/validation';
import { Tag } from '@phosphor-icons/react';

interface LeaveTypeCreateModalProps {
  isOpen: boolean;
  onSubmit: (data: LeaveTypeData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const LeaveTypeCreateModal: React.FC<LeaveTypeCreateModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const defaultData: LeaveTypeData = {
    name: '',
    annual_quota: 0,
  };

  if (!isOpen) return null;

  return (
    <FormModal<LeaveTypeData>
      title="Configure Leave Type"
      icon={<Tag size={24} weight="duotone" className="text-gray-600" />}
      initialValues={defaultData}
      validationFn={validateLeaveType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Create Leave Type"
      size="sm"
    >
      {({ values, handleChange, errors }) => (
        <>
          <FormField
            name="name"
            label="Leave Type"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Enter leave type name"
            icon={<Tag size={18} weight="duotone" className="text-gray-500" />}
          />

          <NumberField
            name="annual_quota"
            label="Annual Quota"
            value={values.annual_quota}
            onChange={handleChange}
            error={errors.annual_quota}
            required
            min={1}
            placeholder="Enter annual quota"
          />
        </>
      )}
    </FormModal>
  );
};

export default LeaveTypeCreateModal;
