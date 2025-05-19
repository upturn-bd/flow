"use client";

import { useEffect, useState, useCallback } from "react";
import { dirtyValuesChecker } from "@/lib/utils";
import {
  personalInfoSchema,
  PersonalFormData,
  Gender,
  BloodGroup,
  MaritalStatus,
} from "./personalInfo.constants";
import { PersonalInfoField } from "./PersonalInfoField";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Heart, Users, PhoneCall, MapPin, Save, CheckCircle, AlertCircle } from "lucide-react";

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

export default function PersonalInfoTab() {
  const [formValues, setFormValues] = useState<PersonalFormData>(defaultPersonalFormValues);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PersonalFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalFormData, boolean>>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<PersonalFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const fetchPersonalInfo = async () => {
      try {
        const res = await fetch("/api/personal-info");
        if (res.status === 204) {
          // No personal info row exists; treat as empty, do not show error
          setInitialData(defaultPersonalFormValues);
          setFormValues(defaultPersonalFormValues);
        } else if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setFormValues((prev) => ({ ...prev, ...data }));
            setInitialData(data);
          }
        } else {
          setSubmitError("Failed to load personal information.");
        }
      } catch (error) {
        setSubmitError("Failed to fetch personal info. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPersonalInfo();
  }, []);

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

    const result = personalInfoSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PersonalFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PersonalFormData;
        fieldErrors[field] = err.message as string;
      });
      setFormErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/personal-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValues,
          date_of_birth: formValues.date_of_birth ? new Date(formValues.date_of_birth).toISOString() : undefined,
          blood_group: formValues.blood_group || undefined,
          marital_status: formValues.marital_status || undefined,
          gender: formValues.gender || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSubmitError(errorData?.message || `Error: ${response.status}`);
        setIsSubmitting(false);
        return;
      }
      setSubmitSuccess(true);
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
    const result = personalInfoSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PersonalFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PersonalFormData;
        fieldErrors[field] = err.message as string;
      });
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
      <div className="flex justify-center items-center h-60">
        <div className="flex flex-col items-center">
          <div className="relative h-12 w-12">
            <div className="absolute top-0 left-0 h-full w-full rounded-full border-t-2 border-b-2 border-purple-500 animate-spin"></div>
            <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-purple-500 opacity-50" />
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading personal information...</p>
        </div>
      </div>
    );

  // Field groups for better UX
  const fieldGroups = [
    {
      title: "Basic Info",
      icon: <User className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "gender", label: "Gender", type: "select", options: Object.values(Gender) },
        { name: "date_of_birth", label: "Date of Birth", type: "date" },
        { name: "religion", label: "Religion", type: "text" },
        { name: "blood_group", label: "Blood Group", type: "select", options: Object.values(BloodGroup) },
        { name: "marital_status", label: "Marital Status", type: "select", options: Object.values(MaritalStatus) },
        { name: "nid_no", label: "NID Number", type: "text" },
      ],
    },
    {
      title: "Parental Info",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "father_name", label: "Father's Name", type: "text" },
        { name: "mother_name", label: "Mother's Name", type: "text" },
        { name: "spouse_name", label: "Spouse's Name", type: "text" },
      ],
    },
    {
      title: "Emergency Contact",
      icon: <PhoneCall className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "emergency_contact_name", label: "Emergency Contact", type: "text" },
        { name: "emergency_contact_relation", label: "Relation with EC", type: "text" },
        { name: "emergency_contact_phone", label: "Phone No. of EC", type: "tel" },
      ],
    },
    {
      title: "Address",
      icon: <MapPin className="h-5 w-5 text-blue-600" />,
      fields: [
        { name: "permanent_address", label: "Permanent Address", type: "textarea" },
      ],
    },
  ];

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.4,
        when: "beforeChildren"
      } 
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              isEditMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-pressed={isEditMode}
            role="switch"
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
            <p className="text-sm font-medium text-green-700">Personal information updated successfully!</p>
          </div>
        </div>
      )}

      {isEditMode ? (
        <form onSubmit={handleSubmit} aria-label="Personal Information Form">
          <div className="space-y-6">
            {fieldGroups.map((group) => (
              <fieldset key={group.title} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                <legend className="px-2 text-lg font-semibold text-gray-800 flex items-center gap-2 bg-white">
                  {group.icon}
                  {group.title}
                </legend>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {group.fields.map((field) => (
                    <PersonalInfoField
                      key={field.name}
                      id={`personal-${field.name}`}
                      name={field.name}
                      label={field.label}
                      type={field.type as any}
                      value={formValues[field.name as keyof PersonalFormData] ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={field.options}
                      error={touched[field.name as keyof PersonalFormData] ? formErrors[field.name as keyof PersonalFormData] : undefined}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (initialData ? !isDirty : false) || !isValid}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  const value = formValues[field.name as keyof PersonalFormData];
                  return (
                    <div key={field.name} className="flex flex-col sm:flex-row sm:items-baseline">
                      <span className="text-sm font-medium text-gray-500 w-32 mb-1 sm:mb-0">
                        {field.label}:
                      </span>
                      <span className="text-gray-800 flex-1">
                        {value ? (
                          field.name === "permanent_address" ? (
                            value.split("\n").map((line, i) => (
                              <span key={i} className="block">
                                {line}
                              </span>
                            ))
                          ) : (
                            value
                          )
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsEditMode(true)}
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