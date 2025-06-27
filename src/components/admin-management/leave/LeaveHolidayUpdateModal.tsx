import React from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField, DateField } from '@/components/forms';
import { validateHolidayConfig, type HolidayConfigData } from '@/lib/validation';
import { CalendarBlank } from '@phosphor-icons/react';

interface LeaveHolidayUpdateModalProps {
  isOpen: boolean;
  initialData: HolidayConfigData;
  onSubmit: (data: HolidayConfigData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const LeaveHolidayUpdateModal: React.FC<LeaveHolidayUpdateModalProps> = ({
  isOpen,
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <FormModal<HolidayConfigData>
      title="Update Holiday"
      icon={<CalendarBlank size={24} weight="duotone" className="text-gray-600" />}
      initialValues={initialData}
      validationFn={validateHolidayConfig}
      onSubmit={onSubmit}
      onClose={onClose}
      isLoading={isLoading}
      submitButtonText="Update Holiday"
      size="sm"
    >
      {({ values, handleChange, errors }) => (
        <>
          <FormField
            name="name"
            label="Holiday Name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Enter holiday name"
            icon={<CalendarBlank size={18} weight="duotone" className="text-gray-500" />}
          />

          <DateField
            name="date"
            label="Holiday Date"
            value={values.date}
            onChange={handleChange}
            error={errors.date}
            required
            placeholder="Select holiday date"
          />
        </>
      )}
    </FormModal>
  );
};

export default LeaveHolidayUpdateModal;
