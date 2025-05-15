"use client";

import { useEffect, useState } from "react";
import { dirtyValuesChecker, extractFilenameFromUrl } from "@/lib/utils";
import { Education } from "@/hooks/useEducation";
import { schoolingSchema, schoolingTypes } from "@/lib/types";
import { uploadFile } from "@/lib/api/education-and-experience";
import { FiUploadCloud } from "react-icons/fi";
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";

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
    attachments: [],
    id: 0,
    employee_id: "",
    company_id: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
      setAttachments(initialData.attachments || []);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<Education>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

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

    if (attachments.length > 0) {
      const { uploadedFilePaths, error: uploadError } = await uploadManyFiles(
        attachments,
        "education-certificates"
      );

      if (uploadError) throw uploadError;

      onSubmit({ ...result.data, attachments: uploadedFilePaths });
      setErrors({});
      setIsSubmitting(false);
    } else {
      onSubmit(result.data);
      setErrors({});
      setIsSubmitting(false);
    }
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
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
          <label className="block font-bold text-[#003366] mb-1">
            Attachment
          </label>
          <div className="bg-gray-100 rounded-md border border-gray-300 p-6 text-center text-sm text-gray-500">
            <FiUploadCloud className="mx-auto mb-4 text-2xl" />
            <label
              htmlFor="file_upload"
              className="px-4 py-2 bg-white border border-gray-400 text-sm rounded-md cursor-pointer hover:bg-gray-200 transition"
            >
              Browse File
            </label>
            <input
              type="file"
              id="file_upload"
              name="attachments"
              className="hidden"
              accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments((prev) => [
                  ...prev,
                  ...files.filter(
                    (file) => !prev.some((f) => f.name === file.name)
                  ),
                ]);
              }}
            />
            <div className="flex gap-3 mt-8 text-gray-600">
              {attachments.length > 0
                ? attachments.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-100 text-sm rounded-sm"
                    >
                      <span>{initialData ? extractFilenameFromUrl(file) : file.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 text-xl"
                        onClick={() => removeFile(file.name)}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                : "No files selected"}
            </div>
          </div>
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
