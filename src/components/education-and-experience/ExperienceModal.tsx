"use client";

import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { Experience } from "@/hooks/useExperience";
import { experienceSchema } from "@/lib/types";

interface ExperienceModalProps {
  initialData?: Experience | null;
  onSubmit: (values: Experience) => void;
  onClose: () => void;
}

export default function ExperienceModal({
  initialData,
  onSubmit,
  onClose,
}: ExperienceModalProps) {
  const [formValues, setFormValues] = useState<Experience>({
    company_name: "",
    designation: "",
    from_date: "",
    to_date: "",
    description: "",
    id: 0,
    employee_id: "",
    company_id: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<Experience>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = experienceSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Experience> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof Experience] = err.message as any;
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
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = experienceSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<Experience> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Experience] = issue.message as any;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    onSubmit(result.data);
    setErrors({});
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  return (
    <div className="fixed max-h-screen overflow-y-auto inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white px-6 pt-48 pb-12 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Experience" : "Create Experience"}
        </h2>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Company Name
          </label>
          <input
            name="company_name"
            value={formValues.company_name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Company Name"
          />
          {errors.company_name && (
            <p className="text-red-500 text-sm">{errors.company_name}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Designation
          </label>
          <input
            name="designation"
            value={formValues.designation}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Designation"
          />
          {errors.designation && (
            <p className="text-red-500 text-sm">{errors.designation}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            From Date
          </label>
          <input
            type="date"
            name="from_date"
            value={formValues.from_date}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.from_date && (
            <p className="text-red-500 text-sm">{errors.from_date}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            To Date
          </label>
          <input
            type="date"
            name="to_date"
            value={formValues.to_date}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.to_date && (
            <p className="text-red-500 text-sm">{errors.to_date}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formValues.description}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Experience Description"
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
              isSubmitting || (initialData ? !isDirty : false) || !isValid
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
