"use client";

import { useState, useEffect, ReactNode } from "react";
import BaseModal from "./BaseModal";
import { Button } from "@/components/ui/button";
import { validationErrorsToObject } from "@/lib/utils/validation";

interface FormModalProps<T> {
  title: string;
  icon?: ReactNode;
  initialValues: T;
  validationFn: (values: T) => { success: boolean; data?: T; errors?: any[] };
  onSubmit: (values: T) => void;
  onClose: () => void;
  isOpen: boolean;
  isLoading?: boolean;
  submitButtonText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode | ((props: {
    values: T;
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  }) => ReactNode);
}

export default function FormModal<T extends Record<string, any>>({
  title,
  icon,
  initialValues,
  validationFn,
  onSubmit,
  onClose,
  isOpen,
  isLoading = false,
  submitButtonText = "Submit",
  size = "md",
  children,
}: FormModalProps<T>) {
  const [formValues, setFormValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = validationFn(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      if (result.errors) {
        const newErrors = validationErrorsToObject(result.errors);
        setErrors(newErrors);
      }
    }
  }, [formValues, validationFn]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormValues((prev) => {
      // Handle number inputs
      if (type === 'number') {
        return {
          ...prev,
          [name]: value === '' ? '' : Number(value),
        };
      }
      
      // Handle select fields that should be numbers (like department_id, grade)
      if ((name.endsWith('_id') || name === 'grade') && value !== '') {
        return {
          ...prev,
          [name]: value,
        };
      }
      
      // Handle empty values for optional numeric fields
      if ((name.endsWith('_id') || name === 'grade') && value === '') {
        return {
          ...prev,
          [name]: undefined,
        };
      }
      
      // Default string handling
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = validationFn(formValues);

    if (!result.success) {
      if (result.errors) {
        const fieldErrors = validationErrorsToObject(result.errors);
        setErrors(fieldErrors);
      }
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data!);
    setIsSubmitting(false);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      size={size}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {typeof children === 'function' 
            ? children({ values: formValues, errors, handleChange })
            : children
          }
        </div>
        
        <div className="flex justify-end mt-8 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={!!(isLoading || isSubmitting)}
            disabled={
              isLoading ||
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0
            }
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
