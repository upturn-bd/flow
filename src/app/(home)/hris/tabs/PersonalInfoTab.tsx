"use client";

import { useEffect, useState, useCallback } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import {
  PersonalFormData,
  Gender,
  BloodGroup,
  MaritalStatus,
} from "./personalInfo.constants";
import { validatePersonalInfo, validationErrorsToObject } from "@/lib/utils/validation";
import { PersonalInfoField } from "./PersonalInfoField";
import { motion } from "framer-motion";
import { Calendar, User, Heart, Users, PhoneCall, MapPin, Save, X, CheckCircle, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fadeIn } from "@/components/ui/animations";
import { useProfile } from "@/hooks/useProfile";
import { useUserProfile } from "@/hooks/useUserProfile";

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
  const [formValues, setFormValues] = useState<PersonalFormData>(defaultPersonalFormValues);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PersonalFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalFormData, boolean>>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<PersonalFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  const { 
    loading, 
    personalInfo,
    fetchCurrentUserPersonalInfo, 
    fetchUserPersonalInfo, 
    updatePersonalInfo: updatePersonalInfoApi,
    isCurrentUser
  } = useProfile();
  
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
          setFormValues((prev) => ({ ...prev, ...data }));
          setInitialData(data);
        } else {
          setInitialData(defaultPersonalFormValues);
          setFormValues(defaultPersonalFormValues);
        }
      } catch (error) {
        setSubmitError("Failed to fetch personal info. Please try again later.");
      }
    };
    fetchPersonalInfo();
  }, [uid, fetchUserPersonalInfo, fetchCurrentUserPersonalInfo]);

  const handleChange = useCallback((e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const result = validatePersonalInfo(formValues);
    if (!result.success) {
      const fieldErrors = validationErrorsToObject(result.errors);
      setFormErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await updatePersonalInfoApi(formValues);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setIsEditMode(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const result = validatePersonalInfo(formValues);
    if (!result.success) {
      const fieldErrors = validationErrorsToObject(result.errors);
      setFormErrors(fieldErrors);
      setIsValid(false);
    } else {
      setIsValid(true);
      setFormErrors({});
    }
  }, [formValues]);

  useEffect(() => {
    const dirty = initialData
      ? dirtyValuesChecker(initialData, formValues)
      : false;
    setIsDirty(dirty);
  }, [formValues, initialData]);

  if (loading)
    return (
      <LoadingSpinner 
        icon={User}
        text="Loading personal information..."
      />
    );

  const personalInfoFields = [
    {
      title: "Personal Details",
      icon: <User className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "gender", label: "Gender", type: "select" as const, options: Object.values(Gender) },
        { name: "date_of_birth", label: "Date of Birth", type: "date" as const },
        { name: "religion", label: "Religion", type: "text" as const },
        { name: "blood_group", label: "Blood Group", type: "select" as const, options: Object.values(BloodGroup) },
        { name: "marital_status", label: "Marital Status", type: "select" as const, options: Object.values(MaritalStatus) },
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
        { name: "emergency_contact_name", label: "Contact Name", type: "text" as const },
        { name: "emergency_contact_relation", label: "Relation", type: "text" as const },
        { name: "emergency_contact_phone", label: "Contact Phone", type: "tel" as const },
      ],
    },
    {
      title: "Address Information",
      icon: <MapPin className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "permanent_address", label: "Permanent Address", type: "textarea" as const },
      ],
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Heart className="mr-2 h-6 w-6 text-blue-600" />
          Personal Information
        </h2>
        {isCurrentUser && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode((prev) => !prev)}
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
            <p className="text-sm font-medium text-green-700">Personal information updated successfully!</p>
          </div>
        </motion.div>
      )}

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
              <h3 className="font-medium text-lg text-gray-800">{section.title}</h3>
            </div>
            
            <div className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {section.fields.map((field, fieldIndex) => (
                    <motion.tr 
                      key={field.name} 
                      className={isEditMode ? "hover:bg-blue-50 transition-colors" : ""}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: fieldIndex * 0.05 + sectionIndex * 0.1 }}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal sm:whitespace-nowrap text-sm font-medium text-gray-800 bg-gray-50 w-1/3">
                        {field.label}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-normal text-sm text-gray-600">
                        {isEditMode && isCurrentUser ? (
                          <div className="max-w-full overflow-hidden">
                            <PersonalInfoField
                              name={field.name as keyof PersonalFormData}
                              type={field.type}
                              value={String(formValues[field.name as keyof PersonalFormData] || "")}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={formErrors[field.name as keyof PersonalFormData]}
                              touched={!!touched[field.name as keyof PersonalFormData]}
                              options={field.type === "select" ? field.options : undefined}
                              label=""
                            />
                          </div>
                        ) : (
                          <div className="py-1 break-words">
                            {field.name === "date_of_birth" && formValues[field.name]
                              ? new Date(formValues[field.name] as string).toLocaleDateString()
                              : formValues[field.name as keyof PersonalFormData] || "—"}
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
              onClick={() => setIsEditMode(false)}
              className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty || !isValid}
              className={`px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center transition-colors ${
                isSubmitting || !isDirty || !isValid
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
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