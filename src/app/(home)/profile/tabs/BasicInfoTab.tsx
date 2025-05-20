"use client";

import { useEffect, useState, useCallback } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import {
  basicInfoSchema,
  BasicInfoFormData,
  JOB_STATUS_OPTIONS,
} from "./basicInfo.constants";
import { BasicInfoField } from "./BasicInfoField";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, Calendar, Save, X, CheckCircle, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
    icon: <User className="h-5 w-5 text-blue-600" />,
    fields: [
      { name: "first_name", label: "First Name", type: "text" },
      { name: "last_name", label: "Last Name", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone_number", label: "Phone Number", type: "tel" },
    ],
  },
  {
    title: "Job Info",
    icon: <Briefcase className="h-5 w-5 text-blue-600" />,
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
        const res = await fetch("/api/basic-info");
        if (res.ok) {
          const { data } = await res.json();
          setInitialData(data);
          setFormValues(data);
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

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  if (loading)
    return (
      <LoadingSpinner 
        icon={Calendar}
        text="Loading basic information..."
      />
    );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-2 h-6 w-6 text-blue-600" />
          Basic Information
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEditToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              isEditMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={isEditMode}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isEditMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {isEditMode ? 'Edit Mode On' : 'Edit Mode Off'}
          </span>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-green-700">Basic information updated successfully!</p>
          </div>
        </div>
      )}

      {isEditMode ? (
        <form onSubmit={handleSubmit} autoComplete="off" aria-label="Basic Information Form">
          <div className="space-y-6">
            {fieldGroups.map((group) => (
              <fieldset key={group.title} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                <legend className="px-2 text-lg font-semibold text-gray-800 flex items-center gap-2 bg-white">
                  {group.icon}
                  {group.title}
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
          <div className="flex justify-end mt-8 space-x-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              onClick={handleEditToggle}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isDirty || !isValid}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {fieldGroups.map((group) => (
            <div key={group.title} className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                {group.icon}
                {group.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                {group.fields.map((field) => {
                  const value = formValues[field.name as keyof BasicInfoFormData];
                  return (
                    <div key={field.name} className="flex flex-col sm:flex-row sm:items-baseline">
                      <span className="text-sm font-medium text-gray-500 w-32 mb-1 sm:mb-0">
                        {field.label}:
                      </span>
                      <span className="text-gray-800 flex-1">
                        {field.name !== "department_id"
                          ? value || <span className="text-gray-400 italic">Not provided</span>
                          : departmentName(Number(value))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Information
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
