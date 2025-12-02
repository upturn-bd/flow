"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PersonalFormData,
  Gender,
  BloodGroup,
  MaritalStatus,
} from "./personalInfo.constants";

// Simple validation function that always passes since all fields are optional
const validatePersonalInfo = (data: PersonalFormData) => ({
  success: true,
  errors: []
});

const validationErrorsToObject = (errors: any[]) => ({});
import { PersonalInfoField } from "./PersonalInfoField";
import { motion } from "framer-motion";
import {
  User,
  Heart,
  Users,
  PhoneCall,
  MapPin,
} from "@/lib/icons";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fadeIn } from "@/components/ui/animations";
import { useProfile } from "@/hooks/useProfile";
import { useFormState } from "@/hooks/useFormState";
import SubmitActions from "@/components/ui/SubmitActions";
import { showNotification } from "@/lib/utils/notifications";

interface PersonalInfoTabProps {
  uid?: string | null;
}

const defaultPersonalFormValues: PersonalFormData = {
  gender: "",
  date_of_birth: "",
  religion: "",
  blood_group: "",
  marital_status: "",
  nid_no: "",
  father_name: "",
  mother_name: "",
  spouse_name: "",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone: "",
  permanent_address: "",
};

export default function PersonalInfoTab({ uid }: PersonalInfoTabProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<PersonalFormData>(defaultPersonalFormValues);

  const {
    loading,
    fetchCurrentUserPersonalInfo,
    fetchUserPersonalInfo,
    updatePersonalInfo: updatePersonalInfoApi,
    isCurrentUser,
  } = useProfile();

  const {
    formValues,
    errors,
    touched,
    isDirty,
    handleChange,
    handleBlur,
    resetForm
  } = useFormState({
    initialData,
    validateFn: validatePersonalInfo,
    validationErrorsToObject
  });

  useEffect(() => {
    const fetchPersonalInfo = async () => {
      try {
        let data = null;

        if (uid) {
          data = await fetchUserPersonalInfo(uid);
        } else {
          data = await fetchCurrentUserPersonalInfo();
        }

        if (data) {
          // Ensure we only keep personal info fields for proper dirty checking
          const personalInfoData: PersonalFormData = {
            gender: data.gender || "",
            date_of_birth: data.date_of_birth || "",
            religion: data.religion || "",
            blood_group: data.blood_group || "",
            marital_status: data.marital_status || "",
            nid_no: data.nid_no || "",
            father_name: data.father_name || "",
            mother_name: data.mother_name || "",
            spouse_name: data.spouse_name || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_relation: data.emergency_contact_relation || "",
            emergency_contact_phone: data.emergency_contact_phone || "",
            permanent_address: data.permanent_address || "",
          };
          setInitialData(personalInfoData);
        } else {
          // No personal info record exists yet - use defaults
          setInitialData(defaultPersonalFormValues);
        }
      } catch (error) {
        console.error("Error fetching personal info:", error);
        // Don't show error notification for missing records - just use defaults
        setInitialData(defaultPersonalFormValues);
      }
    };
    fetchPersonalInfo();
  }, [uid, fetchUserPersonalInfo, fetchCurrentUserPersonalInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only send fields that have actually changed to avoid unnecessary updates
      const changedFields: Partial<PersonalFormData> = {};
      
      Object.keys(formValues).forEach((key) => {
        const typedKey = key as keyof PersonalFormData;
        const oldValue = initialData[typedKey];
        const newValue = formValues[typedKey];
        
        // Include field if it has changed (including from empty to filled or vice versa)
        if (oldValue !== newValue) {
          (changedFields as any)[typedKey] = newValue;
        }
      });

      console.log('Personal info fields being updated:', changedFields);

      // Only proceed if there are changes to make
      if (Object.keys(changedFields).length === 0) {
        showNotification({ 
          message: "No changes to save", 
          type: "info" 
        });
        setIsEditMode(false);
        return;
      }

      // Always attempt update - the hook handles empty updates gracefully
      await updatePersonalInfoApi(changedFields);
      
      // Update initial data with the new values
      setInitialData({ ...initialData, ...changedFields });
      
      showNotification({ 
        message: "Personal information updated successfully!", 
        type: "success" 
      });
      setIsEditMode(false);
    } catch (error: any) {
      let errorMessage = "Failed to update personal information";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showNotification({ 
        message: errorMessage, 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditToggle = useCallback(() => {
    if (!isEditMode) {
      // Entering edit mode - no need to clear states since we removed them
    } else {
      resetForm();
    }
    setIsEditMode((prev) => !prev);
  }, [isEditMode, resetForm]);

  if (loading)
    return (
      <LoadingSpinner icon={User} text="Loading personal information..." />
    );

  const personalInfoFields = [
    {
      title: "Personal Details",
      icon: <User className="h-5 w-5 text-blue-600" />,
      fields: [
        {
          name: "gender",
          label: "Gender",
          type: "select" as const,
          options: Object.values(Gender),
        },
        {
          name: "date_of_birth",
          label: "Date of Birth",
          type: "date" as const,
        },
        { name: "religion", label: "Religion", type: "text" as const },
        {
          name: "blood_group",
          label: "Blood Group",
          type: "select" as const,
          options: Object.values(BloodGroup),
        },
        {
          name: "marital_status",
          label: "Marital Status",
          type: "select" as const,
          options: Object.values(MaritalStatus),
        },
        { name: "nid_no", label: "NID Number", type: "text" as const },
      ],
    },
    {
      title: "Family Information",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "father_name", label: "Father's Name", type: "text" as const },
        { name: "mother_name", label: "Mother's Name", type: "text" as const },
        { name: "spouse_name", label: "Spouse's Name", type: "text" as const },
      ],
    },
    {
      title: "Emergency Contact",
      icon: <PhoneCall className="h-5 w-5 text-blue-600" />,
      fields: [
        {
          name: "emergency_contact_name",
          label: "Contact Name",
          type: "text" as const,
        },
        {
          name: "emergency_contact_relation",
          label: "Relation",
          type: "text" as const,
        },
        {
          name: "emergency_contact_phone",
          label: "Contact Phone",
          type: "tel" as const,
        },
      ],
    },
    {
      title: "Address Information",
      icon: <MapPin className="h-5 w-5 text-primary-600" />,
      fields: [
        {
          name: "permanent_address",
          label: "Permanent Address",
          type: "textarea" as const,
        },
      ],
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground-primary flex items-center">
          <Heart className="mr-2 h-6 w-6 text-primary-600" />
          Personal Information
        </h2>
        {isCurrentUser && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                isEditMode ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
              role="switch"
              aria-checked={isEditMode}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-surface-primary shadow transition-transform ${
                  isEditMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-foreground-secondary">
              {isEditMode ? "Edit Mode On" : "Edit Mode Off"}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {personalInfoFields.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            className={sectionIndex > 0 ? "mt-8" : ""}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <div className="flex items-center mb-4">
              <div className="mr-3">{section.icon}</div>
              <h3 className="font-medium text-lg text-foreground-primary">
                {section.title}
              </h3>
            </div>

            <div className="rounded-xl shadow-sm border border-border-primary overflow-hidden">
              <table className="min-w-full divide-y divide-border-primary">
                <tbody className="bg-background-primary divide-y divide-border-primary">
                  {section.fields.map((field, fieldIndex) => (
                    <motion.tr
                      key={field.name}
                      className={
                        isEditMode ? "hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors" : ""
                      }
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: fieldIndex * 0.05 + sectionIndex * 0.1,
                      }}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal sm:whitespace-nowrap text-sm font-medium text-foreground-primary bg-background-secondary w-1/3">
                        {field.label}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal text-sm text-foreground-secondary">
                        {isEditMode && isCurrentUser ? (
                          <div className="max-w-full overflow-hidden">
                            <PersonalInfoField
                              name={field.name as keyof PersonalFormData}
                              type={field.type}
                              value={String(
                                formValues[
                                  field.name as keyof PersonalFormData
                                ] || ""
                              )}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={
                                errors[field.name as keyof PersonalFormData]
                              }
                              touched={
                                !!touched[field.name as keyof PersonalFormData]
                              }
                              options={
                                field.type === "select"
                                  ? field.options
                                  : undefined
                              }
                              label=""
                            />
                          </div>
                        ) : (
                          <div className="py-1 break-words">
                            {field.name === "date_of_birth" &&
                            formValues[field.name]
                              ? new Date(
                                  formValues[field.name] as string
                                ).toLocaleDateString()
                              : formValues[
                                  field.name as keyof PersonalFormData
                                ] || "—"}
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
            <SubmitActions
              isSubmitting={isSubmitting}
              isDirty={isDirty}
              isValid={true} // Always valid since all fields are optional
              onCancel={handleEditToggle}
              className="mt-6"
            />
          </>
        )}
      </form>
    </motion.div>
  );
}
