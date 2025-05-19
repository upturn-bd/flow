"use client";

import { useContext, useEffect, useState, useCallback } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import {
  basicInfoSchema,
  BasicInfoFormData,
  JOB_STATUS_OPTIONS,
} from "./basicInfo.constants";
import { BasicInfoField } from "./BasicInfoField";
import { getBasicInfo } from "@/lib/api/basic-info";
import { AuthContext } from "@/lib/auth/auth-provider";

const initialFormState: BasicInfoFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  department_id: 0,
  designation: "",
  job_status: "",
  hire_date: "",
  id_input: "",
};

const fieldGroups = [
  {
    title: "Personal Info",
    fields: [
      { name: "first_name", label: "First Name", type: "text" },
      { name: "last_name", label: "Last Name", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone_number", label: "Phone Number", type: "tel" },
    ],
  },
  {
    title: "Job Info",
    fields: [
      { name: "department_id", label: "Department", type: "number" },
      { name: "designation", label: "Designation", type: "text" },
      { name: "job_status", label: "Job Status", type: "text" },
      { name: "hire_date", label: "Hire Date", type: "date" },
      { name: "id_input", label: "Employee ID", type: "text" },
    ],
  },
];

export default function BasicInfoTab() {
  const [formValues, setFormValues] = useState<BasicInfoFormData>(initialFormState);
  const [initialData, setInitialData] = useState<BasicInfoFormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BasicInfoFormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  useEffect(() => {
    setLoadingDepartments(true);
    fetchDepartments().finally(() => setLoadingDepartments(false));
  }, [fetchDepartments]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      const { name, value } = e.target;
      setFormValues((prev) => ({
        ...prev,
        [name]: name === "department_id" ? Number(value) : value,
      }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    []
  );

  const handleBlur = useCallback((e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const result = basicInfoSchema.safeParse(formValues);
      if (!result.success) {
        const fieldErrors: typeof errors = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as keyof BasicInfoFormData] = issue.message;
        }
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch("/api/basic-info", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...result.data,
            department_id: Number(result.data.department_id),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setSubmitError(errorData?.message || `Error: ${response.status}`);
          setIsSubmitting(false);
          return;
        }

        const json = await response.json();
        setInitialData(json.data);
        setSubmitSuccess(true);
        setIsEditMode(false);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues]
  );

  const handleEditToggle = useCallback(() => {
    if (!isEditMode) setSubmitSuccess(false);
    setFormValues(initialData ?? formValues);
    setIsEditMode((prev) => !prev);
  }, [isEditMode, initialData, formValues]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { employee } = useContext(AuthContext)!;
        const res = await getBasicInfo(employee!.id);
        if (res) {
          setInitialData(res);
          setFormValues(res);
        }
      } catch (error) {
        setSubmitError("Failed to fetch basic info. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  useEffect(() => {
    const result = basicInfoSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Record<keyof BasicInfoFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as keyof BasicInfoFormData] = issue.message;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const departmentName = useCallback(
    (id: number) => departments.find((dep) => dep.id === id)?.name || "Data unavailable",
    [departments]
  );

  if (loading)
    return (
      <div className="p-4 flex items-center space-x-2">
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></span>
        <span>Loading basic information...</span>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="flex items-center mb-6 space-x-12">
        <h2 className="text-2xl font-bold text-blue-700">Basic Information</h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-6 rounded-full cursor-pointer"
            onClick={handleEditToggle}
            tabIndex={0}
            role="button"
            aria-pressed={isEditMode}
            aria-label="Toggle edit mode"
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleEditToggle(); }}
          >
            <div
              className={`absolute w-full h-full rounded-full transition-colors duration-200 ${
                isEditMode ? "bg-[#192D46]" : "bg-gray-200"
              }`}
            />
            <div
              className={`absolute w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${
                isEditMode ? "translate-x-10" : "translate-x-0"
              } top-0.25`}
            />
          </div>
          <span className="text-blue-700 select-none text-[17px]">
            Edit Mode
          </span>
        </div>
      </div>

      {submitError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" aria-live="polite">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded" aria-live="polite">
          Basic information updated successfully!
        </div>
      )}

      {isEditMode ? (
        <form onSubmit={handleSubmit} autoComplete="off" aria-label="Basic Information Form">
          <div className="space-y-8">
            {fieldGroups.map((group) => (
              <fieldset key={group.title} className="border border-gray-200 rounded p-4">
                <legend className="text-lg font-semibold text-gray-700 mb-2 px-2">{group.title}</legend>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
                  {group.fields.map((field) => (
                    <BasicInfoField
                      key={field.name}
                      id={`basic-info-${field.name}`}
                      name={field.name}
                      label={field.label}
                      type={field.type}
                      value={formValues[field.name as keyof BasicInfoFormData]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched[field.name as keyof BasicInfoFormData] ? errors[field.name as keyof BasicInfoFormData] : undefined}
                      departments={departments}
                      loadingDepartments={loadingDepartments}
                      readOnly={field.name === "id_input"}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isSubmitting || !isValid || (initialData ? !isDirty : false)
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          {fieldGroups.map((group) => (
            <fieldset key={group.title} className="border border-gray-100 rounded p-4">
              <legend className="text-lg font-semibold text-gray-700 mb-2 px-2">{group.title}</legend>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
                {group.fields.map((field) => {
                  const value = formValues[field.name as keyof BasicInfoFormData];
                  return (
                    <div key={field.name} className="flex items-start space-x-4">
                      <span className="w-32 text-md font-semibold text-gray-800">
                        {field.label}
                      </span>
                      <span className="text-gray-600">
                        {field.name !== "department_id"
                          ? value
                          : departmentName(Number(value))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}
