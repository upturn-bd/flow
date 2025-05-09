"use client";

import { useEffect, useState } from "react";
import { Department } from "@/hooks/useDepartments";
import { z } from "zod";
import { dirtyValuesChecker } from "@/lib/utils";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(50),
  head_id: z.string().min(1, "Please select a department head"),
  description: z.string().optional(),
  division_id: z.number().min(1, "Please select a division"), // kept as string for form compatibility
});

type FormValues = z.infer<typeof schema>;

interface DepartmentModalProps {
  initialData?: Department | null;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  employees: { id: number; name: string }[];
  divisions: { id: number; name: string }[];
}

export default function DepartmentModal({
  initialData,
  onSubmit,
  employees,
  divisions,
  onClose,
}: DepartmentModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    head_id: "",
    description: "",
    division_id: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = schema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "division_id") {
      setFormValues((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = schema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
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

  // Check if form values are dirty
  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Department" : "Create Department"}
        </h2>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Department Name
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
            Department Head
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
            Division
          </label>
          <select
            name="division_id"
            value={formValues.division_id}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          >
            <option value="">Select Division</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
          {errors.division_id && (
            <p className="text-red-500 text-sm">{errors.division_id}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Department Description
          </label>
          <textarea
            name="description"
            value={formValues.description || ""}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Add Departmental Description"
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
              isSubmitting ||
              (initialData ? !isDirty : false) ||
              !isValid ||
              Object.keys(errors).length > 0
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
