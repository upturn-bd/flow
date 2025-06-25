"use client";

import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { Experience } from "@/hooks/useExperience";
import { validateExperience, validationErrorsToObject } from "@/lib/utils/validation";

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
    employee_id: "",
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
    const result = validateExperience(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
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
    const result = validateExperience(formValues);

    if (!result.success) {
      const fieldErrors = validationErrorsToObject(result.errors);
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-4 sm:py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-auto px-4 sm:px-0">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 sm:p-8 rounded-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[#192D46] mb-4 sm:mb-6 border-b pb-3">
            {initialData ? "Edit Experience" : "Add Experience"}
          </h2>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                Company Name
              </label>
              <input
                name="company_name"
                value={formValues.company_name}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                placeholder="Enter Company Name"
              />
              {errors.company_name && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.company_name}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                Designation
              </label>
              <input
                name="designation"
                value={formValues.designation}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                placeholder="Enter Designation"
              />
              {errors.designation && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.designation}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                  From Date
                </label>
                <input
                  type="date"
                  name="from_date"
                  value={formValues.from_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                />
                {errors.from_date && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.from_date}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                  To Date
                </label>
                <input
                  type="date"
                  name="to_date"
                  value={formValues.to_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                />
                {errors.to_date && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.to_date}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                Description
              </label>
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                placeholder="Enter Experience Description"
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t">
            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium text-sm sm:text-base"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-[#192D46] text-white rounded-lg hover:bg-[#0f1c2d] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
              disabled={
                isSubmitting || (initialData ? !isDirty : false) || !isValid
              }
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Experience"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
