import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, SelectField, TextAreaField, DateField, AssigneeField } from '@/components/forms';
import { validateTask, type TaskData } from '@/lib/validation';
import { useEmployees } from '@/hooks/useEmployees';
import { CheckSquare } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface TaskCreateModalProps {
  milestoneId?: number;
  projectId: number;
  onSubmit: (data: TaskData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export default function TaskCreateModal({
  milestoneId,
  projectId,
  onSubmit,
  onClose,
  isLoading = false
}: TaskCreateModalProps) {
  const [formData, setFormData] = useState<TaskData>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'not_started',
    project_id: projectId,
    milestone_id: milestoneId,
    assignees: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleInputChange = (field: keyof TaskData, value: any) => {
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
    const validation = validateTask(formData);
    
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
    const validation = validateTask(formData);
    return validation.success;
  };

  return (
    <BaseModal
      isOpen={true}
      title="Create Task"
      icon={<CheckSquare size={24} weight="duotone" />}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        <FormField
          label="Task Title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title"
          error={errors.title}
          required
        />

        <TextAreaField
          label="Description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description"
          error={errors.description}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateField
            label="Due Date"
            name="due_date"
            value={formData.due_date || ''}
            onChange={(e) => handleInputChange('due_date', e.target.value)}
            error={errors.due_date}
          />

          <SelectField
            label="Priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            options={priorityOptions}
            placeholder="Select priority"
            error={errors.priority}
            required
          />
        </div>

        <AssigneeField
          label="Assignees"
          value={formData.assignees}
          onChange={(assignees) => handleInputChange('assignees', assignees)}
          employees={employees}
          error={errors.assignees}
          disabled={isLoading || employeesLoading}
          placeholder="Search and select assignees..."
        />

        {milestoneId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This task will be associated with milestone ID: {milestoneId}
            </p>
          </div>
        )}
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
          disabled={!isFormValid() || isLoading}
        >
          Create Task
        </Button>
      </div>
    </BaseModal>
  );
}
