import React, { useEffect } from 'react';
import { FormModal } from '@/components/ui/modals';
import { FormField, SelectField, NumberField, SingleEmployeeSelector } from '@/components/forms';
import { validateClaimType, type ClaimTypeData } from '@/lib/validation';
import { useEmployeesContext, usePositionsContext } from '@/contexts';
import { Receipt, UserPlus, Money } from '@phosphor-icons/react';

interface ClaimTypeCreateModalProps {
  isOpen: boolean;
  onSubmit: (data: ClaimTypeData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ClaimTypeCreateModal: React.FC<ClaimTypeCreateModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const { employees: allSettlers, loading: loadingEmployees, fetchEmployees } = useEmployeesContext();
  const { positions: allPositions, fetchPositions } = usePositionsContext();

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchPositions();
    }
  }, [isOpen]);

  const defaultData: ClaimTypeData = {
    settlement_item: '',
    allowance: 0,
    settler_id: '',
    settlement_level_id: undefined,
  };

  if (!isOpen) return null;

  return (
    <FormModal<ClaimTypeData>
      title="Configure Settlement Item"
      icon={<Receipt size={24} weight="duotone" className="text-gray-600" />}
      initialValues={defaultData}
      validationFn={validateClaimType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText="Create Settlement Item"
      size="md"
    >
      {({ values, handleChange, errors, setFieldValue }) => (
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

          <SingleEmployeeSelector
            label="Settler"
            value={values.settler_id || ''}
            onChange={(value) => setFieldValue('settler_id', value)}
            employees={allSettlers}
            placeholder="Search and select settler..."
            error={errors.settler_id}
            required
          />

          <SelectField
            name="settlement_level_id"
            label="Settlement Level (Optional)"
            value={values.settlement_level_id ? String(values.settlement_level_id) : ''}
            onChange={handleChange}
            error={errors.settlement_level_id}
            placeholder="Select Settlement Level"
            options={allPositions.map(position => ({
              value: String(position.id),
              label: position.name
            }))}
          />
        </>
      )}
    </FormModal>
  );
};

export default ClaimTypeCreateModal;
