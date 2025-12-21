"use client";

import { useEffect, useState, useCallback } from "react";
import { useDepartments } from "@/hooks/useDepartments";
import { useSalaryManagement } from "@/hooks/useSalaryManagement";
import { useEmployees } from "@/hooks/useEmployees";
import {
  BasicInfoFormData,
  JOB_STATUS_OPTIONS,
} from "./constants";
import { validateBasicInfo, validationErrorsToObject } from "@/lib/utils/validation";
import { BasicInfoField } from "./BasicInfoField";
import SingleEmployeeSelector from "@/components/forms/SingleEmployeeSelector";
import { motion } from "framer-motion";
import { User, Briefcase, Calendar, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fadeIn } from "@/components/ui/animations";
import { useProfile } from "@/hooks/useProfile";
import { useFormState } from "@/hooks/useFormState";
import ValidationFeedback from "@/components/ui/ValidationFeedback";
import SubmitActions from "@/components/ui/SubmitActions";
import { showNotification } from "@/lib/utils/notifications";
import { useAuth } from "@/lib/auth/auth-context";
import { PERMISSION_MODULES } from "@/lib/constants";
import { getEmployeeInfo } from "@/lib/utils/auth";

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
  basic_salary: 0,
  supervisor_id: null,
};

const fieldGroups = [
  {
    title: "Personal Info",
    icon: <User className="h-5 w-5 text-primary-600" />,
    fields: [
      { name: "first_name", label: "First Name", type: "text" },
      { name: "last_name", label: "Last Name", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone_number", label: "Phone Number", type: "tel" },
    ],
  },
  {
    title: "Job Info",
    icon: <Briefcase className="h-5 w-5 text-primary-600" />,
    fields: [
      { name: "department_id", label: "Department", type: "number" },
      { name: "designation", label: "Designation", type: "text" },
      { name: "job_status", label: "Job Status", type: "text" },
      { name: "hire_date", label: "Hire Date", type: "date" },
      { name: "id_input", label: "Employee ID", type: "text" },
      { name: "supervisor_id", label: "Supervisor", type: "select", adminOnly: true },
      { name: "basic_salary", label: "Basic Salary (BDT)", type: "number", adminOnly: true },
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
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>("");
  
  const { canWrite, employeeInfo } = useAuth();
  const canEditSalary = canWrite(PERMISSION_MODULES.PAYROLL) || canWrite(PERMISSION_MODULES.HRIS);
  const canEditSupervisor = canWrite(PERMISSION_MODULES.HRIS);
  
  const { departments, fetchDepartments } = useDepartments();
  const { employees, fetchEmployees, loading: loadingEmployees } = useEmployees();
  const { updateEmployeeSalary } = useSalaryManagement();
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
          value: name === "department_id" ? Number(value) : 
                 name === "supervisor_id" ? (value === "" ? null : value) : value,
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
        // Check if salary changed and user has permission
        const oldSalary = initialData?.basic_salary || 0;
        const newSalary = result.data.basic_salary || 0;
        
        if (oldSalary !== newSalary && canEditSalary) {
          // Update salary separately with audit logging
          await updateEmployeeSalary(
            targetEmployeeId || uid || '', 
            newSalary,
            'Salary updated via HRIS profile'
          );
        }

        // Only update fields that have actually changed to avoid unique constraint violations
        const changedFields: Partial<BasicInfoFormData> = {};
        
        if (initialData) {
          Object.keys(result.data).forEach((key) => {
            const typedKey = key as keyof BasicInfoFormData;
            const oldValue = initialData[typedKey];
            const newValue = result.data[typedKey];
            
            // Skip if values are the same (including proper comparison for numbers and strings)
            if (oldValue !== newValue) {
              // Special handling for numeric fields
              if (typedKey === 'department_id' || typedKey === 'basic_salary') {
                if (Number(oldValue) !== Number(newValue)) {
                  (changedFields as any)[typedKey] = newValue;
                }
              } else if (typedKey === 'email') {
                // Extra validation for email to ensure we're not setting the same email
                const trimmedOld = String(oldValue || '').trim().toLowerCase();
                const trimmedNew = String(newValue || '').trim().toLowerCase();
                if (trimmedOld !== trimmedNew) {
                  (changedFields as any)[typedKey] = newValue;
                }
              } else {
                (changedFields as any)[typedKey] = newValue;
              }
            }
          });
        } else {
          // If no initial data, update all fields except basic_salary (handled separately)
          Object.keys(result.data).forEach((key) => {
            if (key !== 'basic_salary') {
              (changedFields as any)[key] = (result.data as any)[key];
            }
          });
        }

        // Remove basic_salary from the update as it's handled separately above
        delete (changedFields as any).basic_salary;

        // Log what fields are being updated (for debugging)
        console.log('Fields being updated:', changedFields);

        // Always attempt the update - the hook will handle empty updates gracefully
        const response = await updateBasicInfoApi(changedFields);
        if (response) {
          setInitialData(response.data);
        }
        setSubmitSuccess(true);
        showNotification({ 
          message: "Basic information updated successfully!", 
          type: "success" 
        });
        setTimeout(() => setSubmitSuccess(false), 3000);
        setIsEditMode(false);
      } catch (error: any) {
        let errorMessage = "Failed to update basic information";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        // Add more context for common errors
        if (errorMessage.includes("email") && errorMessage.includes("already in use")) {
          errorMessage = "Cannot update: This email address is already registered to another employee.";
        }
        
        setSubmitError(errorMessage);
        showNotification({ 
          message: errorMessage, 
          type: "error" 
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, updateBasicInfoApi, initialData, canEditSalary, updateEmployeeSalary, targetEmployeeId, uid]
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
    // Only fetch when employeeInfo is available (company_id needed for queries)
    if (!employeeInfo?.company_id) return;
    
    setLoadingDepartments(true);
    Promise.all([
      fetchDepartments(),
      fetchEmployees()
    ]).finally(() => setLoadingDepartments(false));
  }, [fetchDepartments, fetchEmployees, employeeInfo?.company_id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let data;
        if (uid) {
          data = await fetchUserBasicInfo(uid);
          setTargetEmployeeId(uid);
        } else {
          data = await fetchCurrentUserBasicInfo();
          const employeeInfo = await getEmployeeInfo();
          if (employeeInfo) {
            setTargetEmployeeId(employeeInfo.id);
          }
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

  const supervisorName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return "Not assigned";
      return employees.find((emp) => emp.id === id)?.name || "Unknown";
    },
    [employees]
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
      className="w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground-primary flex items-center">
          <Calendar className="mr-2 h-6 w-6 text-primary-600" />
          Basic Information
        </h2>
        {isCurrentUser && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                isEditMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              role="switch"
              aria-checked={isEditMode}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-surface-primary shadow transition-transform ${
                  isEditMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-foreground-secondary">
              {isEditMode ? 'Edit Mode On' : 'Edit Mode Off'}
            </span>
          </div>
        )}
      </div>

      {submitError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-error/10 border border-error/30 dark:bg-error/20 rounded-lg shadow-sm"
        >
          <div className="flex items-start">
            <WarningCircle className="h-5 w-5 text-error mt-0.5 mr-3 shrink-0" />
            <p className="text-sm font-medium text-error">{submitError}</p>
          </div>
        </motion.div>
      )}

      {submitSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 bg-success/10 border border-success/30 dark:bg-success/20 rounded-lg shadow-sm"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 mr-3 shrink-0" />
            <p className="text-sm font-medium text-success">Basic information updated successfully!</p>
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
                <h3 className="font-medium text-lg text-foreground-primary">{group.title}</h3>
              </div>
              
              <div className="border border-border-primary rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-border-primary">
                  <tbody className="bg-background-primary divide-y divide-border-primary">
                    {group.fields
                      .filter((field: any) => {
                        // Show admin-only fields only to those with appropriate permissions or for viewing
                        if (field.adminOnly) {
                          if (field.name === "supervisor_id") {
                            return canEditSupervisor || !isEditMode;
                          }
                          return canEditSalary || !isEditMode;
                        }
                        return true;
                      })
                      .map((field: any, fieldIndex) => {
                        const canEditField = field.adminOnly 
                          ? (field.name === "supervisor_id" ? canEditSupervisor : canEditSalary)
                          : isCurrentUser;
                        
                        return (
                      <motion.tr 
                        key={field.name} 
                        className={isEditMode ? "hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors" : ""}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: fieldIndex * 0.05 + groupIndex * 0.1 }}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal sm:whitespace-nowrap text-sm font-medium text-foreground-primary bg-background-secondary w-1/3">
                          <div className="flex items-center">
                            {field.label}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal text-sm text-foreground-secondary">
                          {isEditMode && canEditField ? (
                            <div className="max-w-full">
                              {field.name === "supervisor_id" ? (
                                <>
                                  <SingleEmployeeSelector
                                    value={(formValues.supervisor_id as string) || ""}
                                    onChange={(value) => {
                                      handleChange({
                                        target: {
                                          name: "supervisor_id",
                                          value: value || null,
                                        },
                                      } as React.ChangeEvent<HTMLInputElement>);
                                    }}
                                    employees={employees.filter(emp => emp.id !== targetEmployeeId)}
                                    label=""
                                    placeholder="Search and select supervisor..."
                                    error={errors.supervisor_id}
                                    disabled={!canEditSupervisor || loadingEmployees}
                                  />
                                  {!canEditSupervisor && (
                                    <p className="text-xs text-amber-600 mt-1">Only HRIS administrators can edit supervisor</p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <BasicInfoField
                                    name={field.name as keyof BasicInfoFormData}
                                    label=""
                                    type={field.type}
                                    value={
                                      field.name === "department_id"
                                        ? (formValues[field.name as keyof BasicInfoFormData] as number)?.toString() || ""
                                        : field.name === "basic_salary"
                                        ? (formValues[field.name as keyof BasicInfoFormData] as number)?.toString() || ""
                                        : (formValues[field.name as keyof BasicInfoFormData] as string) || ""
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
                                    readOnly={field.adminOnly && !canEditSalary}
                                    disabled={!canEditField}
                                    loading={field.name === "department_id" ? loadingDepartments : false}
                                  />
                                  {field.adminOnly && !canEditSalary && (
                                    <p className="text-xs text-amber-600 mt-1">Only administrators can edit this field</p>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="py-1 wrap-break-words">
                              {field.name === "department_id" 
                                ? departmentName(Number(formValues[field.name as keyof BasicInfoFormData])) 
                                : field.name === "hire_date" && formValues[field.name as keyof BasicInfoFormData]
                                ? new Date(formValues[field.name as keyof BasicInfoFormData] as string).toLocaleDateString()
                                : field.name === "basic_salary"
                                ? `৳${((formValues[field.name as keyof BasicInfoFormData] as number) || 0).toLocaleString()}`
                                : field.name === "supervisor_id"
                                ? supervisorName(formValues[field.name as keyof BasicInfoFormData] as string | null)
                                : (formValues[field.name as keyof BasicInfoFormData] as string) || "—"}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )})}
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
