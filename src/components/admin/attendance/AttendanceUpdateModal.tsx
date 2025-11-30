import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, TimeField, MapField } from '@/components/forms';
import { validateSite, type SiteData } from '@/lib/validation';
import { Buildings, Clock } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface Coordinates {
  lat: number;
  lng: number;
}

interface AttendanceUpdateModalProps {
  isOpen: boolean;
  initialData: SiteData;
  onSubmit: (data: SiteData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const AttendanceUpdateModal: React.FC<AttendanceUpdateModalProps> = ({
  isOpen,
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SiteData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  // Validation effect
  useEffect(() => {
    const validation = validateSite(formData);
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
    if (initialData) {
      const hasAnyChanges = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof SiteData];
        const initialValue = initialData[key as keyof SiteData];
        return formValue !== initialValue;
      });
      setHasChanges(hasAnyChanges);
    }
  }, [formData, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCoordinatesChange = (coords: Coordinates) => {
    setFormData(prev => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
      location: `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}`,
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
      title="Update Attendance Site"
      icon={<Buildings size={24} weight="duotone" className="text-foreground-secondary" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          name="name"
          label="Site Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="Enter site name"
          icon={<Buildings size={18} weight="duotone" className="text-foreground-tertiary" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimeField
            name="check_in"
            label="Check In Time"
            value={formData.check_in}
            onChange={handleChange}
            error={errors.check_in}
            required
            icon={<Clock size={18} weight="duotone" className="text-foreground-tertiary" />}
          />

          <TimeField
            name="check_out"
            label="Check Out Time"
            value={formData.check_out}
            onChange={handleChange}
            error={errors.check_out}
            required
            icon={<Clock size={18} weight="duotone" className="text-foreground-tertiary" />}
          />
        </div>

        <MapField
          label="Location"
          value={{ lat: formData.latitude, lng: formData.longitude }}
          onChange={handleCoordinatesChange}
          error={errors.latitude || errors.longitude || errors.location}
          required
        />

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-border-secondary text-foreground-secondary hover:bg-background-secondary dark:bg-background-tertiary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || !hasChanges || isLoading}
            className="bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700 text-white disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Site'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default AttendanceUpdateModal;
