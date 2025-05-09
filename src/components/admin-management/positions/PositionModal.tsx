"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { dirtyValuesChecker } from "@/lib/utils";

// Define the schema using Zod
const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  department_id: z.number().min(1),
  grade: z.number().min(1),
});

type FormValues = z.infer<typeof schema>;

interface PositionModalProps {
  initialData?: FormValues | null;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  departments: { id: number; name: string }[];
  grades: { id: number; name: string }[];
}

export default function PositionModal({
  initialData,
  onSubmit,
  departments,
  grades,
  onClose,
}: PositionModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    description: "",
    department_id: 0,
    grade: 0,
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Reset form values when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    }
  }, [initialData]);

  // Check for dirty values
  useEffect(() => {
    if (initialData) {
      const dirty = dirtyValuesChecker(initialData, formValues);
      setIsDirty(dirty);
    } else {
      const dirty = Object.values(formValues).some((v) => v !== "");
      setIsDirty(dirty);
    }
  }, [formValues, initialData]);

  // Update validation state whenever form values change
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

    console.log("Form Values:", formValues);
  }, [formValues]);

  const handleChange =
    (field: keyof FormValues) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setFormValues((prev) => {
        if (field === "department_id" || field === "grade") {
          return { ...prev, [field]: parseInt(event.target.value) };
        }
        const newValues = { ...prev, [field]: event.target.value };
        return newValues;
      });
    };

  const submitHandler = async () => {
    if (isValid) {
      setIsSubmitting(true);
      await onSubmit(formValues);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitHandler();
        }}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Position" : "Create Position"}
        </h2>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Position Name
          </label>
          <input
            value={formValues.name}
            onChange={handleChange("name")}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Department
          </label>
          <select
            value={formValues.department_id}
            onChange={handleChange("department_id")}
            className="w-full rounded-md bg-blue-50 p-2"
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {errors.department_id && (
            <p className="text-red-500 text-sm">{errors.department_id}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Grade
          </label>
          <select
            value={formValues.grade}
            onChange={handleChange("grade")}
            className="w-full rounded-md bg-blue-50 p-2"
          >
            <option value="">Select Grade</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
          {errors.grade && (
            <p className="text-red-500 text-sm">{errors.grade}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Position Description
          </label>
          <textarea
            value={formValues.description || ""}
            onChange={handleChange("description")}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Add Position Description"
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
              !isDirty ||
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
