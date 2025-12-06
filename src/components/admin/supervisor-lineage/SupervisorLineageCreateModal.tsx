import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, HierarchyField } from '@/components/forms';
import { validateLineageForm, type LineageFormData } from '@/lib/validation';
import { usePositions } from '@/hooks/usePositions';
import { Buildings } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';

interface HierarchyLevel {
  level: number;
  position_id: number | null;
}

interface Lineage {
  position_id: number;
  hierarchical_level: number;
  name: string;
  company_id?: number;
}

interface SupervisorLineageCreateModalProps {
  onSubmit: (data: Lineage[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function SupervisorLineageCreateModal({
  onSubmit,
  onClose,
  isLoading = false
}: SupervisorLineageCreateModalProps) {
  const [formData, setFormData] = useState<LineageFormData>({
    name: '',
    hierarchy: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { positions, loading: positionsLoading, fetchPositions } = usePositions();

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Initialize with first position if available
  useEffect(() => {
    if (positions.length > 0 && formData.hierarchy.length === 0) {
      setFormData(prev => ({
        ...prev,
        hierarchy: [{ level: 1, position_id: positions[0].id || null }]
      }));
    }
  }, [positions, formData.hierarchy.length]);

  const handleInputChange = (field: keyof LineageFormData, value: any) => {
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
    const validation = validateLineageForm(formData);
    
    if (!validation.success && validation.errors) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    if (validation.success && validation.data) {
      // Transform hierarchy data to match expected format
      const lineageData = formData.hierarchy
        .filter((level) => level.position_id !== null)
        .map((level) => ({
          position_id: level.position_id as number,
          hierarchical_level: level.level,
          name: formData.name,
          company_id: 0,
        }));

      if (lineageData.length > 0) {
        onSubmit(lineageData);
      }
    }
  };

  const isFormValid = () => {
    const validation = validateLineageForm(formData);
    return validation.success && 
           formData.hierarchy.length > 0 && 
           formData.hierarchy.every(level => level.position_id !== null) &&
           formData.name.trim().length > 0;
  };

  if (positionsLoading) {
    return (
      <BaseModal
        isOpen={true}
        title="Create Lineage"
        icon={<Buildings size={24} weight="duotone" />}
        onClose={onClose}
        size="md"
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-foreground-tertiary">Loading positions...</div>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={true}
      title="Create Lineage"
      icon={<Buildings size={24} weight="duotone" />}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-6">
        <FormField
          label="Lineage Name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter Lineage Name"
          error={errors.name}
          required
        />

        <HierarchyField
          label="Set Hierarchy"
          value={formData.hierarchy}
          onChange={(hierarchy) => handleInputChange('hierarchy', hierarchy)}
          positions={positions.filter(p => p.id != null) as any}
          error={errors.hierarchy}
          disabled={isLoading}
        />
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
          Create
        </Button>
      </div>
    </BaseModal>
  );
}
