import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  
  // Use ref to track the last initial data to prevent unnecessary updates
  const lastInitialDataRef = useRef<T | null>(null);
  const initialDataStringified = useMemo(() => JSON.stringify(initialData), [initialData]);

  // Update form values when initial data changes
  useEffect(() => {
    const lastInitialDataStringified = JSON.stringify(lastInitialDataRef.current);
    
    if (initialData && initialDataStringified !== lastInitialDataStringified) {
      setFormValues(initialData);
      lastInitialDataRef.current = initialData;
      // Reset form state when initial data changes
      setErrors({});
      setTouched({});
      setIsDirty(false);
    }
  }, [initialDataStringified, initialData]);

  // Memoize dirty check to prevent unnecessary recalculations
  const isDirtyMemo = useMemo(() => {
    if (!lastInitialDataRef.current) return false;
    return dirtyValuesChecker(lastInitialDataRef.current, formValues);
  }, [formValues]);

  // Update isDirty state when the memoized value changes
  useEffect(() => {
    setIsDirty(isDirtyMemo);
  }, [isDirtyMemo]);

  // Validate form and update state
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
  }, [formValues]); // Only depend on formValues, not the functions

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
    if (lastInitialDataRef.current) {
      setFormValues(lastInitialDataRef.current);
    }
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, []);

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
