"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfileTabs } from "@/components/profile/tab-bar";
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
  gender: z.nativeEnum(Gender),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  religion: z.string().min(1, "Religion is required"),
  blood_group: z.nativeEnum(BloodGroup),
  marital_status: z.nativeEnum(MaritalStatus),
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

const personalInfoFields: Array<{
  name: keyof FormData;
  label: string;
  type: "select" | "text" | "date" | "tel" | "textarea";
  options?: string[];

  optional?: boolean;
}> = [
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: Object.values(Gender),
  },
  {
    name: "date_of_birth",
    label: "Date of Birth",
    type: "date",
  },
  {
    name: "religion",
    label: "Religion",
    type: "text",
  },
  {
    name: "blood_group",
    label: "Blood Group",
    type: "select",
    options: Object.values(BloodGroup),
  },
  {
    name: "marital_status",
    label: "Marital Status",
    type: "select",
    options: Object.values(MaritalStatus),
  },
  {
    name: "nid_no",
    label: "NID Number",
    type: "text",
  },
  {
    name: "father_name",
    label: "Father's Name",
    type: "text",
  },
  {
    name: "mother_name",
    label: "Mother's Name",
    type: "text",
  },
  {
    name: "spouse_name",
    label: "Spouse's Name",
    type: "text",

    optional: true,
  },
  {
    name: "emergency_contact_name",
    label: "Emergency Contact",
    type: "text",
  },
  {
    name: "emergency_contact_relation",
    label: "Relation with EC",
    type: "text",
  },
  {
    name: "emergency_contact_phone",
    label: "Phone No. of EC",
    type: "tel",
  },
  {
    name: "permanent_address",
    label: "Permanent Address",
    type: "textarea",
  },
];

export default function PersonalInfoForm() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);

  const { control, handleSubmit, formState, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: personalInfo || {
      gender: Gender.MALE,
      date_of_birth: "",
      religion: "",
      blood_group: BloodGroup.AB_POSITIVE,
      marital_status: MaritalStatus.UNMARRIED,
      nid_no: "",
      father_name: "",
      mother_name: "",
      spouse_name: "",
      emergency_contact_name: "",
      emergency_contact_relation: "",
      emergency_contact_phone: "",
      permanent_address: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/personal-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gender: data.gender,
          date_of_birth: new Date(data.date_of_birth).toISOString(),
          blood_group: data.blood_group,
          marital_status: data.marital_status,
          nid_no: data.nid_no,
          religion: data.religion,
          father_name: data.father_name,
          mother_name: data.mother_name,
          spouse_name: data.spouse_name || null,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          emergency_contact_relation: data.emergency_contact_relation,
          permanent_address: data.permanent_address,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setPersonalInfo(result.data);
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

  const handleEdit = () => {
    if (isEditMode) {
      // When turning off edit mode, reset to original values
      reset(personalInfo || {});
      setIsEditMode(false);
    } else {
      // When entering edit mode, ensure form has current data
      reset(personalInfo || {});
      setIsEditMode(true);
      setSubmitSuccess(false);
    }
  };

  useEffect(() => {
    const fetchPersonalInfo = async () => {
      try {
        const response = await fetch("/api/personal-info");
        if (response.ok) {
          const { data } = await response.json();
          setPersonalInfo(data);
          if (data && isEditMode) {
            reset(data);
          }
        } else if (response.status === 204) {
          setPersonalInfo(null);
        }
      } catch (error) {
        console.error("Failed to fetch personal info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalInfo();
  }, [isEditMode, reset]);

  if (loading) {
    return <div className="p-4">Loading personal information...</div>;
  }

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
            onClick={handleEdit}
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
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Personal information updated successfully!
        </div>
      )}

      {isEditMode && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
            {personalInfoFields.map((field) => {
              return (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  rules={{ required: !field.optional }}
                  render={({ field: formField }) => (
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <label className="w-32 text-md font-semibold text-gray-800">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          {...formField}
                          className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          {...formField}
                          rows={3}
                          className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type={field.type}
                          {...formField}
                          className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {formState.errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">
                          {formState.errors[field.name]?.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              );
            })}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="submit"
              className={
                "px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              }
              disabled={
                isSubmitting ||
                !formState.isValid ||
                Object.keys(formState.dirtyFields).length === 0
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {!isEditMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 space-y-6">
          {personalInfoFields.map((field) => {
            const fieldValue = personalInfo?.[field.name as keyof FormData];
            const displayValue =
              fieldValue === null ||
              fieldValue === undefined ||
              fieldValue === ""
                ? "Data unavailable"
                : fieldValue;

            return (
              <div key={field.name} className="flex items-start space-x-4">
                <span className="w-32 text-md font-semibold text-gray-800">
                  {field.label}
                </span>
                <span className="text-gray-600">
                  {field.name === "permanent_address" ? (
                    <>
                      {displayValue === "Data unavailable"
                        ? "Data unavailable"
                        : displayValue?.split("\n").map((line, i) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                    </>
                  ) : (
                    displayValue
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
