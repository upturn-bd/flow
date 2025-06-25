"use client";

import { useEffect, useState, useCallback } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import {
  BasicInfoFormData,
  JOB_STATUS_OPTIONS,
} from "./basicInfo.constants";
import { validateBasicInfo, validationErrorsToObject } from "@/lib/utils/validation";
import { BasicInfoField } from "./BasicInfoField";
import { motion } from "framer-motion";
import { User, Briefcase, Calendar, Save, X, CheckCircle, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fadeIn } from "@/components/ui/animations";
import { useProfile } from "@/hooks/useProfile";

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

interface BasicInfoTabProps {
  uid?: string | null;
}

export default function BasicInfoTab({ uid }: BasicInfoTabProps) {
  const [formValues, setFormValues] = useState<BasicInfoFormData>(initialFormState);
  const [initialData, setInitialData] = useState<BasicInfoFormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BasicInfoFormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const {
    loading,
    isCurrentUser,
    basicInfo,
    fetchCurrentUserBasicInfo,
    fetchUserBasicInfo,
    updateBasicInfo: updateBasicInfoApi,
  } = useProfile();

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

      const result = validateBasicInfo(formValues);
      if (!result.success) {
        const fieldErrors = validationErrorsToObject(result.errors);
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await updateBasicInfoApi(result.data);
        setInitialData(response.data);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        setIsEditMode(false);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, updateBasicInfoApi]
  );

  const handleEditToggle = useCallback(() => {
    if (!isEditMode) setSubmitSuccess(false);
    setFormValues(initialData ?? formValues);
    setIsEditMode((prev) => !prev);
  }, [isEditMode, initialData, formValues]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data;
        if (uid) {
          // Fetch specific user's basic info
          data = await fetchUserBasicInfo(uid);
        } else {
          // Fetch current user's basic info
          data = await fetchCurrentUserBasicInfo();
        }
        
        setInitialData(data);
        setFormValues(data);
      } catch (error) {
        setSubmitError("Failed to fetch basic info. Please try again later.");
      }
    };
    
    fetchData();
  }, [uid, fetchUserBasicInfo, fetchCurrentUserBasicInfo]);

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  useEffect(() => {
    const result = validateBasicInfo(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues]);

  const departmentName = useCallback(
    (id: number) => departments.find((dep) => dep.id === id)?.name || "Data unavailable",
    [departments]
  );

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
        {isCurrentUser && (
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
        )}
      </div>

      {submitError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700">{submitError}</p>
          </div>
        </motion.div>
      )}

      {submitSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium text-green-700">Basic information updated successfully!</p>
          </div>
        </motion.div>
      )}
      
        <form onSubmit={handleSubmit}>
          {fieldGroups.map((group, groupIndex) => (
            <motion.div 
              key={group.title} 
              className={groupIndex > 0 ? "mt-8" : ""}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="mr-3">{group.icon}</div>
                <h3 className="font-medium text-lg text-gray-800">{group.title}</h3>
              </div>
              
              <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.fields.map((field, fieldIndex) => (
                      <motion.tr 
                        key={field.name} 
                        className={isEditMode ? "hover:bg-blue-50 transition-colors" : ""}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: fieldIndex * 0.05 + groupIndex * 0.1 }}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal sm:whitespace-nowrap text-sm font-medium text-gray-800 bg-gray-50 w-1/3">
                          {field.label}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal text-sm text-gray-600">
                          {isEditMode && isCurrentUser ? (
                            <div className="max-w-full overflow-hidden">
                              <BasicInfoField
                                name={field.name as keyof BasicInfoFormData}
                                label=""
                                type={field.type}
                                value={
                                  field.name === "department_id"
                                    ? formValues[field.name]?.toString() || ""
                                    : formValues[field.name as keyof BasicInfoFormData] || ""
                                }
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors[field.name as keyof BasicInfoFormData]}
                                touched={!!touched[field.name as keyof BasicInfoFormData]}
                                options={
                                  field.name === "department_id"
                                    ? departments.map((dep) => ({
                                        value: dep.id.toString(),
                                        label: dep.name,
                                      }))
                                    : field.name === "job_status"
                                    ? JOB_STATUS_OPTIONS.map(status => ({
                                        value: status,
                                        label: status
                                      }))
                                    : undefined
                                }
                                disabled={!isEditMode || !isCurrentUser}
                                loading={field.name === "department_id" ? loadingDepartments : false}
                              />
                            </div>
                          ) : (
                            <div className="py-1 break-words">
                              {field.name === "department_id" 
                                ? departmentName(Number(formValues[field.name])) 
                                : field.name === "hire_date" && formValues[field.name]
                                ? new Date(formValues[field.name]).toLocaleDateString()
                                : formValues[field.name as keyof BasicInfoFormData] || "—"}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
          
          {isEditMode && isCurrentUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 flex justify-end gap-3"
            >
              <button
                type="button"
                onClick={handleEditToggle}
                className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
              >
                <X className="h-4 w-4 inline mr-1 -mt-px" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className={`px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
                  isSubmitting || !isDirty || !isValid
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 inline mr-1 -mt-px" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 inline mr-1 -mt-px" />
                    Save Changes
                  </>
                )}
              </button>
            </motion.div>
          )}
        </form>
    </motion.div>
  );
}
