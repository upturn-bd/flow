"use client";

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, SelectField, TextAreaField, DateField } from '@/components/forms';
import { validateNotice, type NoticeData } from '@/lib/validation';
import { useDepartments } from '@/hooks/useDepartments';
import { Bell } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Notice, useNotices } from '@/hooks/useNotice';

interface NoticeUpdateModalProps {
  initialData: Notice;
  onSubmit: (data: Notice) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const urgencyOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export default function NoticeUpdateModal({
  initialData,
  onSubmit,
  onClose,
  isLoading = false
}: NoticeUpdateModalProps) {
  const [formData, setFormData] = useState<Notice>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { items: departments, fetchItems: fetchDepartments } = useDepartments();
  const { items: noticeTypes, fetchItems: fetchNoticeTypes } = useNotices();

  // Fetch once on mount
  useEffect(() => {
    fetchDepartments();
    fetchNoticeTypes();
  }, []);

  // Set initial data once when modal opens
  useEffect(() => {
    setFormData(initialData);
  }, [initialData.id]); // Only update if a new notice is passed in

  const handleInputChange = (field: keyof Notice, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    const dataToValidate = {
      ...formData,
      notice_type_id: formData.notice_type_id || undefined,
      department_id: formData.department_id || undefined,
    };
    
    const validation = validateNotice(dataToValidate);
    
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
    const validation = validateNotice({
      ...formData,
      notice_type_id: formData.notice_type_id || undefined,
      department_id: formData.department_id || undefined,
    });
    return validation.success;
  };

  const hasChanges = () => JSON.stringify(formData) !== JSON.stringify(initialData);

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
      title="Update Notice"
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
            placeholder="Select notice type (optional)"
            error={errors.notice_type_id}
          />

          <SelectField
            label="Department"
            value={formData.department_id?.toString() || ''}
            onChange={(e) => handleInputChange('department_id', e.target.value ? parseInt(e.target.value) : undefined)}
            options={departmentOptions}
            placeholder="Select department (optional)"
            error={errors.department_id}
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
          disabled={!isFormValid() || !hasChanges() || isLoading}
        >
          Update Notice
        </Button>
      </div>
    </BaseModal>
  );
}
