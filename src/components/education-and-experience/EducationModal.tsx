"use client";

import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { Education } from "@/hooks/useEducation";
import { schoolingSchema, schoolingTypes } from "@/lib/types";
import { uploadFile } from "@/lib/api/education-and-experience";

interface EducationModalProps {
  initialData?: Education | null;
  onSubmit: (values: Education) => void;
  onClose: () => void;
}

export default function EducationModal({
  initialData,
  onSubmit,
  onClose,
}: EducationModalProps) {
  const [formValues, setFormValues] = useState<Education>({
    type: "High School",
    name: "",
    institute: "",
    from_date: "",
    to_date: "",
    result: "",
    file_path: "",
    id: 0,
    employee_id: "",
    company_id: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<Education>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const result = schoolingSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Education> = {};
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
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFormValues((prev) => ({ ...prev, file_path: selectedFile.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = schoolingSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<Education> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Education] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    if (file) {
      const uploadResult = await uploadFile(file);
      if (uploadResult.error) {
        setErrors({ file_path: "File upload failed" });
        setIsSubmitting(false);
        return;
      } else {
        onSubmit(result.data);
        setErrors({});
        setIsSubmitting(false);
      }
    } else {
      onSubmit(result.data);
      setErrors({});
      setIsSubmitting(false);
    }
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
          {initialData ? "Edit Education" : "Create Education"}
        </h2>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Education Type
          </label>
          <select
            name="type"
            value={formValues.type}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          >
            {schoolingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Degree/Education Name
          </label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Degree/Education Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Institute
          </label>
          <input
            name="institute"
            value={formValues.institute}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Institute Name"
          />
          {errors.institute && (
            <p className="text-red-500 text-sm">{errors.institute}</p>
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
            Result
          </label>
          <input
            name="result"
            value={formValues.result}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Result"
          />
          {errors.result && (
            <p className="text-red-500 text-sm">{errors.result}</p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Certificate
          </label>
          <input
            name="file_path"
            type="file"
            accept="application/pdf, image/*"
            onChange={handleFileChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.file_path && (
            <p className="text-red-500 text-sm">{errors.file_path}</p>
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
