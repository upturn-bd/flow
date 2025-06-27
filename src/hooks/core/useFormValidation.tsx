"use client";

import { useState, useCallback, useEffect } from "react";
import { FormValidationResult } from "./types";

interface FormValidationHookResult<T> {
  values: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  setValues: (values: T) => void;
  setFieldValue: (field: keyof T, value: any) => void;
}

interface FormValidationConfig<T> {
  initialValues: T;
  validationFn: (values: T) => FormValidationResult<T>;
  onSubmit: (values: T) => void | Promise<void>;
  enableReinitialize?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  config: FormValidationConfig<T>
): FormValidationHookResult<T> {
  const [values, setValues] = useState<T>(config.initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialValues, setInitialValues] = useState<T>(config.initialValues);

  // Validation effect
  useEffect(() => {
    const result = config.validationFn(values);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      if (result.errors) {
        const errorObj: Record<string, string> = {};
        result.errors.forEach(error => {
          errorObj[error.field] = error.message;
        });
        setErrors(errorObj);
      }
    }
  }, [values, config.validationFn]);

  // Dirty checking effect
  useEffect(() => {
    const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
    setIsDirty(hasChanges);
  }, [values, initialValues]);

  // Reinitialize effect
  useEffect(() => {
    if (config.enableReinitialize) {
      setValues(config.initialValues);
      setInitialValues(config.initialValues);
      setIsDirty(false);
    }
  }, [config.initialValues, config.enableReinitialize]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  }, []);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = config.validationFn(values);
    if (result.success && result.data) {
      await config.onSubmit(result.data);
    }
  }, [values, config]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const setValuesDirectly = useCallback((newValues: T) => {
    setValues(newValues);
    setInitialValues(newValues);
    setIsDirty(false);
  }, []);

  return {
    values,
    errors,
    isValid,
    isDirty,
    handleChange,
    handleSubmit,
    resetForm,
    setValues: setValuesDirectly,
    setFieldValue,
  };
}

export default useFormValidation;
