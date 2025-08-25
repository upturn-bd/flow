import { useState, useEffect, useCallback } from "react";
import { dirtyValuesChecker } from "@/lib/utils";

interface UseFormStateOptions<T> {
  initialData: T | null;
  validateFn: (data: T) => { success: boolean; errors: any[] };
  validationErrorsToObject: (errors: any[]) => Partial<Record<keyof T, string>>;
}

export function useFormState<T extends Record<string, any>>({
  initialData,
  validateFn,
  validationErrorsToObject
}: UseFormStateOptions<T>) {
  const [formValues, setFormValues] = useState<T>(initialData || {} as T);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Update form values when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    }
  }, [initialData]);

  // Check if form is dirty
  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  // Validate form
  useEffect(() => {
    const result = validateFn(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues, validateFn, validationErrorsToObject]);

  const handleChange = useCallback((e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const resetForm = useCallback(() => {
    if (initialData) {
      setFormValues(initialData);
    }
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    formValues,
    setFormValues,
    errors,
    touched,
    isDirty,
    isValid,
    handleChange,
    handleBlur,
    resetForm
  };
}
