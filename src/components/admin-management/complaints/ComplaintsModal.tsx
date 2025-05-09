"use client";

import { useEffect, useState } from "react";
import { complaintsTypeSchema } from "@/lib/types";
import { z } from "zod";

type FormValues = z.infer<typeof complaintsTypeSchema>;

interface ComplaintsModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function ComplaintTypeCreateModal({
  onSubmit,
  onClose,
}: ComplaintsModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    company_id: 0,
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = complaintsTypeSchema.safeParse(formValues);
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
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = complaintsTypeSchema.safeParse(formValues);

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

  useEffect(() => {
    console.log("Form Values:", formValues);
  }, [formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Complaint Type</h2>
        <div className="mt-4">
          <label className="block font-semibold text-blue-800 mb-1">Name</label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
              isSubmitting || !isValid || Object.keys(errors).length > 0
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
