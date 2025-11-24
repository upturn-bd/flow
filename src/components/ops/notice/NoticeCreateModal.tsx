import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, SelectField, TextAreaField, DateField } from '@/components/forms';
import { validateNotice, type NoticeData } from '@/lib/validation';
import { useDepartmentsContext } from '@/contexts';
import { Bell } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useNoticeTypes } from '@/hooks/useNotice';

interface NoticeCreateModalProps {
  onSubmit: (data: NoticeData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const urgencyOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function NoticeCreateModal({
  onSubmit,
  onClose,
  isLoading = false
}: NoticeCreateModalProps) {
  const [formData, setFormData] = useState<NoticeData>({
    title: '',
    description: '',
    urgency: 'normal',
    valid_from: '',
    valid_till: '',
    notice_type_id: undefined,
    department_id: undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { departments, loading: departmentsLoading, fetchDepartments } = useDepartmentsContext();
  const { items: noticeTypes, loading: noticesLoading, fetchItems: fetchNoticeTypes } = useNoticeTypes();

  useEffect(() => {
    fetchDepartments();
    fetchNoticeTypes();
  }, []);

  const handleInputChange = (field: keyof NoticeData, value: any) => {
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

  const handleSubmit = async () => {
    // Transform data for validation (convert empty strings to undefined for optional fields)
    const dataToValidate = {
      ...formData,
      notice_type_id: formData.notice_type_id || undefined,
      department_id: formData.department_id || undefined,
    };

    const validation = validateNotice(dataToValidate as any);

    if (!validation.success && validation.errors) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    if (validation.success && validation.data) {
      await onSubmit(validation.data);
    }

  };

  const isFormValid = () => {
    const validation = validateNotice({
      ...formData,
      notice_type_id: formData.notice_type_id || undefined,
      department_id: formData.department_id || undefined,
    } as any);
    return validation.success;
  };

  // Prepare options for selects
  const departmentOptions = departments.map((dept: any) => ({
    value: dept.id.toString(),
    label: dept.name
  }));

  const noticeTypeOptions = noticeTypes.map((type: any) => ({
    value: type.id.toString(),
    label: type.name
  }));

  return (
    <BaseModal
      isOpen={true}
      title="Create Notice"
      icon={<Bell size={24} weight="duotone" />}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter notice title"
            error={errors.title}
            required
          />

          <SelectField
            label="Urgency"
            value={formData.urgency}
            onChange={(e) => handleInputChange('urgency', e.target.value)}
            options={urgencyOptions}
            placeholder="Select urgency level"
            error={errors.urgency}
            required
          />
        </div>

        <TextAreaField
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter notice description"
          error={errors.description}
          rows={4}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateField
            label="Valid From"
            name="valid_from"
            value={formData.valid_from}
            onChange={(e) => handleInputChange('valid_from', e.target.value)}
            error={errors.valid_from}
            required
          />

          <DateField
            label="Valid Till"
            name="valid_till"
            value={formData.valid_till}
            onChange={(e) => handleInputChange('valid_till', e.target.value)}
            error={errors.valid_till}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Notice Type"
            value={formData.notice_type_id?.toString() || ''}
            onChange={(e) => handleInputChange('notice_type_id', e.target.value ? parseInt(e.target.value) : undefined)}
            options={noticeTypeOptions}
            placeholder="Select notice type"
            error={errors.notice_type_id}
            required
          />

          <SelectField
            label="Department"
            value={formData.department_id?.toString() || ''}
            onChange={(e) => handleInputChange('department_id', e.target.value ? parseInt(e.target.value) : undefined)}
            options={departmentOptions}
            placeholder="Select department"
            error={errors.department_id}
            required
          />
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
          disabled={isLoading}
        >
          Create Notice
        </Button>
      </div>
    </BaseModal>
  );
}
