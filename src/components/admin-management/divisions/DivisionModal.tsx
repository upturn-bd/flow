"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  head_id: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface DivisionModalProps {
  initialData?: { id: number; name: string; head_id: string } | null;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function DivisionModal({
  initialData,
  onSubmit,
  onClose,
}: DivisionModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: initialData?.id ?? 0,
    name: initialData?.name ?? "",
    head_id: initialData?.head_id ?? "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { employees, fetchEmployees } = useEmployees();

  useEffect(() => {
    const result = schema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
    } else {
      setIsValid(result.success);
      setErrors({});
    }
  }, [formValues]);

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "id" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = schema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Division" : "Create Division"}
        </h2>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Division Name
          </label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Division Head
          </label>
          <select
            name="head_id"
            value={formValues.head_id}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {errors.head_id && (
            <p className="text-red-500 text-sm">{errors.head_id}</p>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isSubmitting || !isValid || (initialData ? !isDirty : false)
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
