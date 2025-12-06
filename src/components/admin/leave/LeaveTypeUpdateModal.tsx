import React from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField, NumberField, SelectField } from '@/components/forms';
import { validateLeaveType, type LeaveTypeData } from '@/lib/validation';
import { Tag } from "@phosphor-icons/react";

interface LeaveTypeUpdateModalProps {
  isOpen: boolean;
  initialData: LeaveTypeData;
  onSubmit: (data: LeaveTypeData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const LeaveTypeUpdateModal: React.FC<LeaveTypeUpdateModalProps> = ({
  isOpen,
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const colorOptions = [
    { label: 'Red', value: 'red' },
    { label: 'Orange', value: 'orange' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Green', value: 'green' },
    { label: 'Blue', value: 'blue' },
    { label: 'Indigo', value: 'indigo' },
    { label: 'Violet', value: 'violet' },
  ];

  return (
    <FormModal<LeaveTypeData>
      title="Update Leave Type"
      icon={<Tag size={24} weight="duotone" className="text-foreground-secondary" />}
      initialValues={initialData}
      validationFn={validateLeaveType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Update Leave Type"
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
            icon={<Tag size={18} weight="duotone" className="text-foreground-tertiary" />}
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

          <NumberField
            name="max_carryover"
            label="Maximum Carryover Days"
            value={values.max_carryover || 0}
            onChange={handleChange}
            error={errors.max_carryover}
            required
            min={0}
            placeholder="Enter max days that can be carried over"
          />

          <SelectField
            name="color"
            label="Leave Type Color"
            value={values.color}
            onChange={handleChange}
            error={errors.color}
            required
            options={colorOptions}
            placeholder="Select a color"
          />
        </>
      )}
    </FormModal>
  );
};

export default LeaveTypeUpdateModal;
