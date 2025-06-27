// Example of how to use the new modal and form infrastructure
import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { EntityForm, FormField, NumberField } from '@/components/forms';
import { validateGrade } from '@/lib/validation';
import { Building } from '@phosphor-icons/react';

interface GradeFormData {
  name: string;
  description?: string;
  basic_salary?: number;
}

interface ExampleGradeModalProps {
  isOpen: boolean;
  mode: 'create' | 'update';
  initialData?: GradeFormData;
  onSubmit: (data: GradeFormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const ExampleGradeModal: React.FC<ExampleGradeModalProps> = ({
  isOpen,
  mode,
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<GradeFormData>({
    name: '',
    description: '',
    basic_salary: undefined,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (mode === 'update' && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        description: '',
        basic_salary: undefined,
      });
    }
  }, [mode, initialData, isOpen]);

  // Validation effect
  useEffect(() => {
    const validation = validateGrade(formData);
    setIsValid(validation.success);
    
    if (validation.errors) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
    } else {
      setErrors({});
    }
  }, [formData]);

  // Track changes for update mode
  useEffect(() => {
    if (mode === 'update' && initialData) {
      const hasAnyChanges = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof GradeFormData];
        const initialValue = initialData[key as keyof GradeFormData];
        return formValue !== initialValue;
      });
      setHasChanges(hasAnyChanges);
    } else {
      setHasChanges(true);
    }
  }, [formData, initialData, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basic_salary' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && hasChanges) {
      await onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Grade' : 'Edit Grade'}
      icon={<Building size={24} weight="duotone" className="text-gray-600" />}
      size="md"
    >
      <EntityForm
        mode={mode}
        entityName="Grade"
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        isValid={isValid}
        hasChanges={hasChanges}
        icon={<Building size={20} weight="duotone" className="text-gray-600" />}
      >
        <FormField
          name="name"
          label="Grade Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="Enter grade name"
          icon={<Building size={18} weight="duotone" className="text-gray-500" />}
        />

        <FormField
          name="description"
          label="Description"
          value={formData.description || ''}
          onChange={handleChange}
          error={errors.description}
          placeholder="Enter grade description (optional)"
        />

        <NumberField
          name="basic_salary"
          label="Basic Salary"
          value={formData.basic_salary || ''}
          onChange={handleChange}
          error={errors.basic_salary}
          placeholder="Enter basic salary (optional)"
          min={0}
          step={1000}
        />
      </EntityForm>
    </BaseModal>
  );
};

export default ExampleGradeModal;
