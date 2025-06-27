import React, { useEffect, useState } from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField, SelectField, NumberField } from '@/components/forms';
import { validateClaimType, type ClaimTypeData } from '@/lib/validation';
import { useEmployees } from '@/hooks/useEmployees';
import { Receipt, UserPlus, Money } from '@phosphor-icons/react';

interface Position {
  id: number;
  name: string;
}

interface ClaimTypeUpdateModalProps {
  isOpen: boolean;
  initialData: ClaimTypeData;
  onSubmit: (data: ClaimTypeData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ClaimTypeUpdateModal: React.FC<ClaimTypeUpdateModalProps> = ({
  isOpen,
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const { employees: allSettlers, loading: loadingEmployees, fetchEmployees } = useEmployees();
  const [allPositions, setAllPositions] = useState<Position[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      // TODO: Fetch positions if needed
    }
  }, [isOpen, fetchEmployees]);

  if (!isOpen) return null;

  return (
    <FormModal<ClaimTypeData>
      title="Update Settlement Item"
      icon={<Receipt size={24} weight="duotone" className="text-gray-600" />}
      initialValues={initialData}
      validationFn={validateClaimType}
      onSubmit={onSubmit}
      onClose={onClose}
      isLoading={isLoading}
      submitButtonText="Update Settlement Item"
      size="md"
    >
      {({ values, handleChange, errors }) => (
        <>
          <FormField
            name="settlement_item"
            label="Settlement Item"
            value={values.settlement_item}
            onChange={handleChange}
            error={errors.settlement_item}
            required
            placeholder="Enter settlement item name"
            icon={<Receipt size={18} weight="duotone" className="text-gray-500" />}
          />

          <NumberField
            name="allowance"
            label="Allowance"
            value={values.allowance}
            onChange={handleChange}
            error={errors.allowance}
            required
            min={1}
            placeholder="Enter allowance amount"
            icon={<Money size={18} weight="duotone" className="text-gray-500" />}
          />

          <SelectField
            name="settler_id"
            label="Settler"
            value={values.settler_id}
            onChange={handleChange}
            error={errors.settler_id}
            required
            placeholder="Select Settler"
            options={allSettlers.map((employee: any) => ({
              value: employee.id,
              label: employee.name
            }))}
          />

          <SelectField
            name="settlement_level_id"
            label="Settlement Level (Optional)"
            value={values.settlement_level_id || ''}
            onChange={handleChange}
            error={errors.settlement_level_id}
            placeholder="Select Settlement Level"
            options={allPositions.map(position => ({
              value: position.id,
              label: position.name
            }))}
          />
        </>
      )}
    </FormModal>
  );
};

export default ClaimTypeUpdateModal;
