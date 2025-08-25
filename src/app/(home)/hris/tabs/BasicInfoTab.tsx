"use client";

import { useEffect, useState, useCallback } from "react";
import { useDepartments } from "@/hooks/useDepartments";
import {
  BasicInfoFormData,
  JOB_STATUS_OPTIONS,
} from "./basicInfo.constants";
import { validateBasicInfo, validationErrorsToObject } from "@/lib/utils/validation";
import { BasicInfoField } from "./BasicInfoField";
import { motion } from "framer-motion";
import { User, Briefcase, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fadeIn } from "@/components/ui/animations";
import { useProfile } from "@/hooks/useProfile";
import { useFormState } from "@/hooks/useFormState";
import ValidationFeedback from "@/components/ui/ValidationFeedback";
import SubmitActions from "@/components/ui/SubmitActions";
import { showNotification } from "@/lib/utils/notifications";

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
  const [initialData, setInitialData] = useState<BasicInfoFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { departments, fetchDepartments } = useDepartments();
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const {
    loading,
    isCurrentUser,
    fetchCurrentUserBasicInfo,
    fetchUserBasicInfo,
    updateBasicInfo: updateBasicInfoApi,
  } = useProfile();

  const {
    formValues,
    errors,
    touched,
    isDirty,
    isValid,
    handleChange: baseHandleChange,
    handleBlur,
    resetForm
  } = useFormState({
    initialData,
    validateFn: validateBasicInfo,
    validationErrorsToObject
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      const { name, value } = e.target;
      baseHandleChange({
        ...e,
        target: {
          ...e.target,
          name,
          value: name === "department_id" ? Number(value) : value,
        }
      });
    },
    [baseHandleChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const result = validateBasicInfo(formValues);
      if (!result.success) {
        showNotification({ 
          message: "Please fix the validation errors before submitting", 
          type: "error" 
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await updateBasicInfoApi(result.data);
        setInitialData(response.data);
        setSubmitSuccess(true);
        showNotification({ 
          message: "Basic information updated successfully!", 
          type: "success" 
        });
        setTimeout(() => setSubmitSuccess(false), 3000);
        setIsEditMode(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setSubmitError(errorMessage);
        showNotification({ 
          message: errorMessage, 
          type: "error" 
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, updateBasicInfoApi]
  );

  const handleEditToggle = useCallback(() => {
    if (!isEditMode) {
      setSubmitSuccess(false);
      setSubmitError(null);
    } else {
      resetForm();
    }
    setIsEditMode((prev) => !prev);
  }, [isEditMode, resetForm]);

  useEffect(() => {
    setLoadingDepartments(true);
    fetchDepartments().finally(() => setLoadingDepartments(false));
  }, [fetchDepartments]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data;
        if (uid) {
          data = await fetchUserBasicInfo(uid);
        } else {
          data = await fetchCurrentUserBasicInfo();
        }
        
        setInitialData(data);
      } catch (error) {
        setSubmitError("Failed to fetch basic info. Please try again later.");
      }
    };
    
    fetchData();
  }, [uid, fetchUserBasicInfo, fetchCurrentUserBasicInfo]);

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
                                    ? departments.filter(dep => dep.id != null).map((dep) => ({
                                        value: dep.id!.toString(),
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
            <>
              <ValidationFeedback 
                isDirty={isDirty}
                isValid={isValid}
                errors={errors}
                className="mt-6"
              />
              
              <SubmitActions
                isSubmitting={isSubmitting}
                isDirty={isDirty}
                isValid={isValid}
                onCancel={handleEditToggle}
                className="mt-6"
              />
            </>
          )}
        </form>
    </motion.div>
  );
}
