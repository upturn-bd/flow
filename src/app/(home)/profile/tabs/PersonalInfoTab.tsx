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
        fieldErrors[field] = err.message;
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
        fieldErrors[field] = err.message;
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
      <div className="p-4 flex items-center space-x-2">
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></span>
        <span>Loading personal information...</span>
      </div>
    );

  // Field groups for better UX
  const fieldGroups = [
    {
      title: "Basic Info",
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
      fields: [
        { name: "father_name", label: "Father's Name", type: "text" },
        { name: "mother_name", label: "Mother's Name", type: "text" },
        { name: "spouse_name", label: "Spouse's Name", type: "text" },
      ],
    },
    {
      title: "Emergency Contact",
      fields: [
        { name: "emergency_contact_name", label: "Emergency Contact", type: "text" },
        { name: "emergency_contact_relation", label: "Relation with EC", type: "text" },
        { name: "emergency_contact_phone", label: "Phone No. of EC", type: "tel" },
      ],
    },
    {
      title: "Address",
      fields: [
        { name: "permanent_address", label: "Permanent Address", type: "textarea" },
      ],
    },
  ];

  return (
    <>
      <div className="flex items-center mb-6 space-x-12">
        <h2 className="text-2xl font-bold text-blue-700">
          Personal Information
        </h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-6 rounded-full cursor-pointer"
            onClick={() => setIsEditMode((prev) => !prev)}
            aria-pressed={isEditMode}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setIsEditMode(prev => !prev); }}
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
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 border border-green-400 rounded">
          Personal information updated successfully!
        </div>
      )}
      {isEditMode ? (
        <form onSubmit={handleSubmit} aria-label="Personal Information Form">
          <div className="space-y-8">
            {fieldGroups.map((group) => (
              <fieldset key={group.title} className="border border-gray-200 rounded p-4">
                <legend className="text-lg font-semibold text-gray-700 mb-2 px-2">{group.title}</legend>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
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
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={
                isSubmitting || (initialData ? !isDirty : false) || !isValid
              }
              className="px-4 py-2 bg-[#192D46] text-white rounded-md disabled:opacity-50"
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
                  const value = formValues[field.name as keyof PersonalFormData];
                  return (
                    <div key={field.name} className="flex items-start space-x-4">
                      <span className="w-32 text-md font-semibold text-gray-800">
                        {field.label}
                      </span>
                      <span className="text-gray-600">
                        {value && field.name === "permanent_address"
                          ? value?.split("\n").map((line, i) => (
                              <span key={i}>
                                {line}
                                <br />
                              </span>
                            ))
                          : value}
                        {!value && "Data not available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </>
  );
} 