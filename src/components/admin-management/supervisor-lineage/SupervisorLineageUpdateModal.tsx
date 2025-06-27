import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/modals';
import { FormField, HierarchyField } from '@/components/forms';
import { validateLineageForm, type LineageFormData } from '@/lib/validation';
import { usePositions } from '@/hooks/usePositions';
import { Buildings } from '@phosphor-icons/react';
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

interface SupervisorLineageUpdateModalProps {
  initialData: Lineage[];
  onSubmit: (data: Lineage[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function SupervisorLineageUpdateModal({
  initialData,
  onSubmit,
  onClose,
  isLoading = false
}: SupervisorLineageUpdateModalProps) {
  const [formData, setFormData] = useState<LineageFormData>({
    name: '',
    hierarchy: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { positions, loading: positionsLoading, fetchPositions } = usePositions();

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const name = initialData[0].name || '';
      const hierarchy = initialData
        .sort((a, b) => a.hierarchical_level - b.hierarchical_level)
        .map(item => ({
          level: item.hierarchical_level,
          position_id: item.position_id
        }));
      
      setFormData({
        name,
        hierarchy
      });
    }
  }, [initialData]);

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
          company_id: initialData[0]?.company_id || 0,
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

  const hasChanges = () => {
    if (!initialData || initialData.length === 0) return false;
    
    const originalName = initialData[0].name || '';
    const originalHierarchy = initialData
      .sort((a, b) => a.hierarchical_level - b.hierarchical_level)
      .map(item => ({
        level: item.hierarchical_level,
        position_id: item.position_id
      }));
    
    return formData.name !== originalName || 
           JSON.stringify(formData.hierarchy) !== JSON.stringify(originalHierarchy);
  };

  if (positionsLoading) {
    return (
      <BaseModal
        isOpen={true}
        title="Update Lineage"
        icon={<Buildings size={24} weight="duotone" />}
        onClose={onClose}
        size="md"
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Loading positions...</div>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={true}
      title="Update Lineage"
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
          disabled={!isFormValid() || !hasChanges() || isLoading}
        >
          Update
        </Button>
      </div>
    </BaseModal>
  );
}
