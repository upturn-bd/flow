"use client";

import { useEffect, useState } from "react";
import { dirtyValuesChecker, extractFilenameFromUrl } from "@/lib/utils";
import { Education } from "@/hooks/useEducation";
import { schoolingTypes } from "@/lib/types";
import { validateSchooling, validationErrorsToObject } from "@/lib/utils/validation";
import { FiUploadCloud } from "react-icons/fi";
import { useFileUpload } from "@/hooks/useFileUpload";

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
    employee_id: "",
  });
  
  const { uploading, uploadFiles } = useFileUpload();

  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
      setExistingAttachments(initialData.attachments || []);
      setAttachments([]);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<Education>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const result = validateSchooling(formValues);
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
    const result = validateSchooling(formValues);

    if (!result.success) {
      const fieldErrors = validationErrorsToObject(result.errors);
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (attachments.length > 0) {
        const uploadResult = await uploadFiles(attachments, "education-certificates");
  
        if (!uploadResult.success) {
          throw new Error("Failed to upload files");
        }
  
        onSubmit({
          ...result.data,
          attachments: [...existingAttachments, ...(uploadResult.fileUrls || [])],
        });
      } else {
        onSubmit(result.data);
      }
      
      setErrors({});
    } catch (error) {
      console.error("Error during form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  const removeExistingAttachment = (url: string) => {
    setExistingAttachments((prev) => prev.filter((f) => f !== url));
  };

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
    if (
      attachments.length > 0 ||
      existingAttachments.length !== (initialData?.attachments?.length || 0)
    ) {
      setIsDirty(true);
    }
  }, [initialData, formValues, attachments, existingAttachments]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-4 sm:py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-auto px-4 sm:px-0">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 sm:p-8 rounded-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[#192D46] mb-4 sm:mb-6 border-b pb-3">
            {initialData ? "Edit Education" : "Add Education"}
          </h2>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                Education Type
              </label>
              <select
                name="type"
                value={formValues.type}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-sm sm:text-base"
              >
                {schoolingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.type}</p>}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                Degree/Education Name
              </label>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                placeholder="Enter Degree/Education Name"
              />
              {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 text-sm sm:text-base">
                Institute
              </label>
              <input
                name="institute"
                value={formValues.institute}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                placeholder="Enter Institute Name"
              />
              {errors.institute && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.institute}</p>
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
                Result
              </label>
              <input
                name="result"
                value={formValues.result}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-sm sm:text-base"
                placeholder="Enter Result"
              />
              {errors.result && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.result}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2 text-sm sm:text-base">
                Attachments
              </label>
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 sm:p-6 text-center transition-all hover:bg-gray-100">
                <FiUploadCloud className="mx-auto mb-2 sm:mb-3 text-2xl sm:text-3xl text-blue-500" />
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  Drag and drop files here or click to browse
                </p>
                <label
                  htmlFor="file_upload"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-md cursor-pointer hover:bg-blue-600 transition inline-block"
                >
                  Browse Files
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
                
                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 overflow-y-auto max-h-24 sm:max-h-40 w-full">
                  {existingAttachments.length === 0 &&
                    attachments.length === 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 w-full">No files selected</p>
                    )}
                  
                  {existingAttachments.map((url, index) => (
                    <div
                      key={"existing-" + index}
                      className="px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-100 text-xs sm:text-sm rounded-md flex items-center group hover:bg-blue-200 transition-all"
                    >
                      <span className="truncate overflow-hidden max-w-[120px] sm:max-w-[150px]">
                        {extractFilenameFromUrl(url)}
                      </span>
                      <button
                        type="button"
                        className="ml-1.5 sm:ml-2 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                        onClick={() => removeExistingAttachment(url)}
                        aria-label="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  
                  {attachments.map((file, index) => (
                    <div
                      key={"new-" + index}
                      className="px-2 py-1.5 sm:px-3 sm:py-2 bg-green-100 text-xs sm:text-sm rounded-md flex items-center group hover:bg-green-200 transition-all"
                    >
                      <span className="truncate overflow-hidden max-w-[120px] sm:max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="ml-1.5 sm:ml-2 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                        onClick={() => removeFile(file.name)}
                        aria-label="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
                "Save Education"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
