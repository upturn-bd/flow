"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { ProfileTabs } from "@/components/profile/tab-bar";
import { dirtyValuesChecker } from "@/lib/utils";

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  OTHER = "Other",
}

export enum BloodGroup {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

export enum MaritalStatus {
  MARRIED = "Married",
  UNMARRIED = "Unmarried",
  SINGLE = "Single",
}

const formSchema = z.object({
  gender: z.string().refine((val) => {
    return Object.values(Gender).includes(val as Gender);
  }),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  religion: z.string().min(1, "Religion is required"),
  blood_group: z.string().refine((val) => {
    return Object.values(BloodGroup).includes(val as BloodGroup);
  }),
  marital_status: z.string().refine((val) => {
    return Object.values(MaritalStatus).includes(val as MaritalStatus);
  }),
  nid_no: z.string().min(1, "NID is required"),
  father_name: z.string().min(1, "Father's name is required"),
  mother_name: z.string().min(1, "Mother's name is required"),
  spouse_name: z.string().optional(),
  emergency_contact_name: z.string().min(1, "Emergency contact is required"),
  emergency_contact_relation: z.string().min(1, "Relation is required"),
  emergency_contact_phone: z.string().min(1, "Phone number is required"),
  permanent_address: z.string().min(1, "Address is required"),
});

type FormData = z.infer<typeof formSchema>;

const defaultFormValues: FormData = {
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

export default function PersonalInfoForm() {
  const [formValues, setFormValues] = useState<FormData>(defaultFormValues);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const fetchPersonalInfo = async () => {
      try {
        const res = await fetch("/api/personal-info");
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setFormValues((prev) => ({ ...prev, ...data }));
            setInitialData(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch personal info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalInfo();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const result = formSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
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
          date_of_birth: new Date(formValues.date_of_birth).toISOString(),
          spouse_name: formValues.spouse_name || null,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
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
    const result = formSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
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
    return <div className="p-4">Loading personal information...</div>;

  const renderField = (
    name: keyof FormData,
    label: string,
    type: "text" | "date" | "tel" | "textarea" | "select",
    options?: string[]
  ) => {
    const value = formValues[name] ?? "";
    const error = formErrors[name];

    const inputProps = {
      name,
      value,
      onChange: handleChange,
      className:
        "w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500",
    };

    return (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label className="w-32 text-md font-semibold text-gray-800">
          {label}
        </label>
        {type === "select" ? (
          <select {...inputProps}>
            <option value="" disabled>
              Select {label}
            </option>
            {options?.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea {...inputProps} rows={3} />
        ) : (
          <input {...inputProps} type={type} />
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <ProfileTabs />
      <div className="flex items-center mb-6 space-x-12">
        <h2 className="text-2xl font-bold text-blue-700">
          Personal Information
        </h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-6 rounded-full cursor-pointer"
            onClick={() => setIsEditMode((prev) => !prev)}
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
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
            {renderField("gender", "Gender", "select", Object.values(Gender))}
            {renderField("date_of_birth", "Date of Birth", "date")}
            {renderField("religion", "Religion", "text")}
            {renderField(
              "blood_group",
              "Blood Group",
              "select",
              Object.values(BloodGroup)
            )}
            {renderField(
              "marital_status",
              "Marital Status",
              "select",
              Object.values(MaritalStatus)
            )}
            {renderField("nid_no", "NID Number", "text")}
            {renderField("father_name", "Father's Name", "text")}
            {renderField("mother_name", "Mother's Name", "text")}
            {renderField("spouse_name", "Spouse's Name", "text")}
            {renderField("emergency_contact_name", "Emergency Contact", "text")}
            {renderField(
              "emergency_contact_relation",
              "Relation with EC",
              "text"
            )}
            {renderField("emergency_contact_phone", "Phone No. of EC", "tel")}
            {renderField("permanent_address", "Permanent Address", "textarea")}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 space-y-6">
          {Object.entries(formValues).map(([key, value]) => (
            <div key={key} className="flex items-start space-x-4">
              <span className="w-32 text-md font-semibold text-gray-800">
                {key
                  .replaceAll("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              <span className="text-gray-600">
                {value && key === "permanent_address"
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
          ))}
        </div>
      )}
    </div>
  );
}
