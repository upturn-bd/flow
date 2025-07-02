"use client";

import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { Department } from "@/lib/types/schemas";
import { validateDepartment, validationErrorsToObject } from "@/lib/utils/validation";
import { BaseModal } from "@/components/ui/modals";
import { FormField, SelectField, TextAreaField } from "@/components/forms";
import { Button } from "@/components/ui/button";

interface DepartmentModalProps {
  isOpen: boolean;
  initialData?: Department | null;
  onSubmit: (values: Department) => void;
  onClose: () => void;
  isLoading?: boolean;
  employees?: { id: string; name: string }[];
  divisions: any[];
}

export default function DepartmentModal({
  isOpen,
  initialData,
  onSubmit,
  onClose,
  employees = [],
  divisions = [],
}: DepartmentModalProps) {
  const [formValues, setFormValues] = useState<Department>({
    id: initialData?.id,
    name: initialData?.name ?? "",
    head_id: initialData?.head_id ?? "",
    description: initialData?.description ?? "",
    division_id: initialData?.division_id ?? 0,
  });

  const [errors, setErrors] = useState<Partial<Department>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = validateDepartment(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle division_id as number
    if (name === 'division_id') {
      setFormValues((prev) => ({ 
        ...prev, 
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = validateDepartment(formValues);

    if (!result.success) {
      const fieldErrors = validationErrorsToObject(result.errors);
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formValues);
      onClose();
    } catch (error) {
      console.error("Error submitting department:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  const isDisabled = isSubmitting || 
                    (initialData ? !isDirty : false) || 
                    !isValid;

  // Prepare options for employee select
  const employeeOptions = [
    ...employees.map(employee => ({
      value: employee.id,
      label: employee.name
    }))
  ];

  // Prepare options for division select
  const divisionOptions = [
    ...divisions.map(division => ({
      value: division.id.toString(),
      label: division.name
    }))
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Department" : "Create Department"}
      size="sm"
      preventBackdropClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <FormField
          label="Department Name"
          name="name"
          value={formValues.name}
          onChange={handleChange}
          placeholder="Enter Department Name"
          error={errors.name as string}
          required
        />

        <SelectField
          label="Department Head"
          name="head_id"
          value={formValues.head_id}
          onChange={handleChange}
          options={employeeOptions}
          placeholder="Select Employee"
          error={errors.head_id as string}
          required
        />

        <TextAreaField
          label="Description"
          name="description"
          value={formValues.description}
          onChange={handleChange}
          placeholder="Enter department description"
          error={errors.description as string}
          rows={3}
        />

        <SelectField
          label="Division"
          name="division_id"
          value={formValues.division_id?.toString() ?? ""}
          onChange={handleChange}
          options={divisionOptions}
          placeholder="Select Division"
          error={errors.division_id ? String(errors.division_id) : undefined}
          required
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isDisabled}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : (initialData ? "Update Department" : "Create Department")}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
