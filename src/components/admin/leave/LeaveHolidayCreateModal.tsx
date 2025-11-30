import React from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField, DateField } from '@/components/forms';
import { validateHolidayConfig, type HolidayConfigData } from '@/lib/validation';
import { CalendarBlank } from '@/lib/icons';

interface LeaveHolidayCreateModalProps {
  isOpen: boolean;
  onSubmit: (data: HolidayConfigData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const LeaveHolidayCreateModal: React.FC<LeaveHolidayCreateModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const defaultData: HolidayConfigData = {
    name: '',
    start_day: '',
    end_day: '',
  };

  if (!isOpen) return null;

  return (
    <FormModal<HolidayConfigData>
      title="Configure Holiday"
      icon={<CalendarBlank size={24} weight="duotone" className="text-foreground-secondary" />}
      initialValues={defaultData}
      validationFn={validateHolidayConfig}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Create Holiday"
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
            icon={<CalendarBlank size={18} weight="duotone" className="text-foreground-tertiary" />}
          />

          <DateField
            name="start_day"
            label="Holiday Start Date"
            value={values.start_day}
            onChange={handleChange}
            error={errors.start_day}
            required
            placeholder="Select holiday start date"
          />

          <DateField
            name="end_day"
            label="Holiday End Date"
            value={values.end_day}
            onChange={handleChange}
            error={errors.end_day}
            required
            placeholder="Select holiday end date"
          />
          
        </>
      )}
    </FormModal>
  );
};

export default LeaveHolidayCreateModal;
