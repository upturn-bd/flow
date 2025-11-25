import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, SelectField, TextAreaField, DateField, NumberField, AssigneeField } from '@/components/forms';
import { validateMilestone, type MilestoneData } from '@/lib/validation';
import { useEmployees } from '@/hooks/useEmployees';
import { Target } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface MilestoneUpdateModalProps {
  currentTotalWeightage: number;
  initialData: MilestoneData;
  onSubmit: (data: MilestoneData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
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

  function formatDateForInput(date: string | Date | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    // Use local time to get YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    setFormData(initialData);
    console.log("initial data in modal", initialData)
    setFormData({
      ...initialData,
      start_date: formatDateForInput(initialData.start_date),
      end_date: formatDateForInput(initialData.end_date),
    });
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
    console.log(formData)
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
    return 100 - (currentTotalWeightage);
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

        <div className="flex flex-wrap gap-2 mt-6">
          <span className="text-sm font-medium text-blue-700 bg-blue-100 px-4 py-1 rounded-full shadow-sm">
            Weightage: {formData.weightage}%
          </span>

          <span
            className={`text-sm font-medium px-4 py-1 rounded-full shadow-sm ${formData.status === "Not Started"
              ? "text-red-700 bg-red-100"
              : formData.status === "In Progress"
                ? "text-yellow-700 bg-yellow-100"
                : formData.status === "Completed"
                  ? "text-green-700 bg-green-100"
                  : "text-gray-700 bg-gray-100"
              }`}
          >
            Status: {formData.status}
          </span>
        </div>

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




        <AssigneeField
          label="Assignees"
          value={formData.assignees || []}
          onChange={(assignees) => handleInputChange('assignees', assignees)}
          employees={employees}
          error={errors.assignees}
          disabled={isLoading || employeesLoading}
          placeholder="Search and select assignees..."
        />

        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Current Project Weightage:</strong> {currentTotalWeightage}%
            <br />
            <strong>Available Weightage:</strong> {getMaxWeightage()}%
            <br />
            <strong>Original Milestone Weightage:</strong> {initialData.weightage}%
          </p>
        </div> */}
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
          disabled={!hasChanges() || isLoading}
        >
          Update Milestone
        </Button>
      </div>
    </BaseModal>
  );
}
