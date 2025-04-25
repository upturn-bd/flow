"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfileTabs } from "@/components/profile/tab-bar";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  job_status: z.string().min(1, "Job status is required"),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  id_input: z.string().min(1, "ID is required"),
});

type FormData = z.infer<typeof formSchema>;

const basicInfoFields: Array<{
  name: keyof FormData;
  label: string;
  type: "text" | "email" | "tel" | "date";
}> = [
  { name: "first_name", label: "First Name", type: "text" },
  { name: "last_name", label: "Last Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone_number", label: "Phone Number", type: "tel" },
  { name: "department", label: "Department", type: "text" },
  { name: "designation", label: "Designation", type: "text" },
  { name: "job_status", label: "Job Status", type: "text" },
  { name: "hire_date", label: "Hire Date", type: "date" },
  { name: "id_input", label: "Employee ID", type: "text" },
];

export default function BasicInfoForm() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [basicInfo, setBasicInfo] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);

  const { control, handleSubmit, formState, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: basicInfo || {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      department: "",
      designation: "",
      job_status: "",
      hire_date: "",
      id_input: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch("/api/basic-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setBasicInfo(result.data);
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
      reset(basicInfo || {});
      setIsEditMode(false);
    } else {
      reset(basicInfo || {});
      setIsEditMode(true);
      setSubmitSuccess(false);
    }
  };

  useEffect(() => {
    const fetchBasicInfo = async () => {
      try {
        const response = await fetch("/api/basic-info");
        if (response.ok) {
          const { data } = await response.json();
          setBasicInfo(data);
          if (data && isEditMode) {
            reset(data);
          }
        } else if (response.status === 204) {
          setBasicInfo(null);
        }
      } catch (error) {
        console.error("Failed to fetch basic info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBasicInfo();
  }, [isEditMode, reset]);

  if (loading) {
    return <div className="p-4">Loading basic information...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <ProfileTabs />
      <div className="flex items-center mb-6 space-x-12">
        <h2 className="text-2xl font-bold text-blue-700">
          Basic Information
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
          Basic information updated successfully!
        </div>
      )}

      {isEditMode ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
            {basicInfoFields.map((field) => (
              <Controller
                key={field.name}
                name={field.name}
                control={control}
                render={({ field: formField }) => (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <label className="w-32 text-md font-semibold text-gray-800">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      {...formField}
                      className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formState.errors[field.name] && (
                      <p className="mt-1 text-sm text-red-600">
                        {formState.errors[field.name]?.message}
                      </p>
                    )}
                  </div>
                )}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="submit"
              className={"px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"}
              disabled={
                isSubmitting || !formState.isValid || Object.keys(formState.dirtyFields).length === 0
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 space-y-6">
          {basicInfoFields.map((field) => {
            const fieldValue = basicInfo?.[field.name];
            const displayValue = fieldValue || "Data unavailable";

            return (
              <div key={field.name} className="flex items-start space-x-4">
                <span className="w-32 text-md font-semibold text-gray-800">
                  {field.label}
                </span>
                <span className="text-gray-600">{displayValue}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}