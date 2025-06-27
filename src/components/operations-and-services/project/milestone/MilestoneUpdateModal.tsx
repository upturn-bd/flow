import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, SelectField, TextAreaField, DateField, NumberField, AssigneeField } from '@/components/forms';
import { validateMilestone, type MilestoneData } from '@/lib/validation';
import { useEmployees } from '@/hooks/useEmployees';
import { Target } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface MilestoneUpdateModalProps {
  currentTotalWeightage: number;
  initialData: MilestoneData;
  onSubmit: (data: MilestoneData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function MilestoneUpdateModal({
  currentTotalWeightage,
  initialData,
  onSubmit,
  onClose,
  isLoading = false
}: MilestoneUpdateModalProps) {
  const [formData, setFormData] = useState<MilestoneData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (field: keyof MilestoneData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    const validation = validateMilestone(formData);
    
    if (!validation.success && validation.errors) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    if (validation.success && validation.data) {
      onSubmit(validation.data);
    }
  };

  const isFormValid = () => {
    const validation = validateMilestone(formData);
    return validation.success;
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  const getMaxWeightage = () => {
    // For updates, we need to account for the current milestone's weightage
    return 100 - (currentTotalWeightage - (initialData.weightage || 0));
  };

  const getWeightageError = () => {
    const maxWeightage = getMaxWeightage();
    if (formData.weightage > maxWeightage) {
      return `Weightage cannot exceed ${maxWeightage}% (Current total excluding this milestone: ${currentTotalWeightage - (initialData.weightage || 0)}%)`;
    }
    return undefined;
  };

  return (
    <BaseModal
      isOpen={true}
      title="Update Milestone"
      icon={<Target size={24} weight="duotone" />}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        <FormField
          label="Milestone Title"
          value={formData.milestone_title}
          onChange={(e) => handleInputChange('milestone_title', e.target.value)}
          placeholder="Enter milestone title"
          error={errors.milestone_title}
          required
        />

        <TextAreaField
          label="Description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter milestone description"
          error={errors.description}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateField
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            error={errors.start_date}
            required
          />

          <DateField
            label="End Date"
            name="end_date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            error={errors.end_date}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberField
            label="Weightage (%)"
            name="weightage"
            value={formData.weightage}
            onChange={(value) => handleInputChange('weightage', value)}
            min={0}
            max={getMaxWeightage()}
            error={errors.weightage || getWeightageError()}
            placeholder="Enter weightage percentage"
            required
          />

          <SelectField
            label="Status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={statusOptions}
            placeholder="Select status"
            error={errors.status}
            required
          />
        </div>

        <AssigneeField
          label="Assignees"
          value={formData.assignees || []}
          onChange={(assignees) => handleInputChange('assignees', assignees)}
          employees={employees}
          error={errors.assignees}
          disabled={isLoading || employeesLoading}
          placeholder="Search and select assignees..."
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Current Project Weightage:</strong> {currentTotalWeightage}%
            <br />
            <strong>Available Weightage:</strong> {getMaxWeightage()}%
            <br />
            <strong>Original Milestone Weightage:</strong> {initialData.weightage}%
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-8 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={!isFormValid() || !hasChanges() || !!getWeightageError() || isLoading}
        >
          Update Milestone
        </Button>
      </div>
    </BaseModal>
  );
}
