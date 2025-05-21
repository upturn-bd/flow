"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { Division } from "@/hooks/useDivisions";

// Define the schema using Zod
const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  head_id: z.string().min(1),
  description: z.string().optional(),
  company_id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
});


interface DivisionModalProps {
  initialData?: Division | null;
  onSubmit: (values: Division) => void;
  onClose: () => void;
  employees: { id: string; name: string }[];
}

export default function DivisionModal({
  initialData,
  onSubmit,
  onClose,
  employees,
}: DivisionModalProps) {
  const [formValues, setFormValues] = useState<Division>({
    id: initialData?.id ?? 0,
    name: initialData?.name ?? "",
    head_id: initialData?.head_id ?? "",
    description: initialData?.description ?? "",
  });

  const [errors, setErrors] = useState<Partial<Division>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = schema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Division> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Division] = issue.message as any;
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
    } else {
      const dirty = Object.values(formValues).some((v) => v !== "");
      setIsDirty(dirty);
    }
  }, [initialData, formValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      const fieldErrors: Partial<Division> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Division] = issue.message as any;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(formValues);
    setIsSubmitting(false);
  };

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

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Division Description
          </label>
          <textarea
            name="description"
            value={formValues.description || ""}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Add Division Description"
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
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
