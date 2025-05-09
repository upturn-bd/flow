"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { ProfileTabs } from "@/components/profile/tab-bar";
import { dirtyValuesChecker } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  department_id: z.number().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  job_status: z.string().min(1, "Job status is required"),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  id_input: z.string().min(1, "ID is required"),
});

type FormData = z.infer<typeof schema>;

const fields: Array<{
  name: keyof FormData;
  label: string;
  type: string;
}> = [
  { name: "first_name", label: "First Name", type: "text" },
  { name: "last_name", label: "Last Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone_number", label: "Phone Number", type: "tel" },
  { name: "department_id", label: "Department", type: "number" },
  { name: "designation", label: "Designation", type: "text" },
  { name: "job_status", label: "Job Status", type: "text" },
  { name: "hire_date", label: "Hire Date", type: "date" },
  { name: "id_input", label: "Employee ID", type: "text" },
];

export default function BasicInfoForm() {
  const [formValues, setFormValues] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    department_id: 0,
    designation: "",
    job_status: "",
    hire_date: "",
    id_input: "",
  });

  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "department_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const result = schema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormData] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/basic-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const json = await response.json();
      setInitialData(json.data);
      setSubmitSuccess(true);
      setIsEditMode(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditMode) setSubmitSuccess(false);
    setFormValues(initialData ?? formValues);
    setIsEditMode(!isEditMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/basic-info");
        if (res.ok) {
          const { data } = await res.json();
          setInitialData(data);
          setFormValues(data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    }
  }, [initialData, formValues]);

  useEffect(() => {
    const result = schema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormData> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as keyof FormData] = issue.message;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  if (loading) return <div className="p-4">Loading basic information...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <ProfileTabs />
      <div className="flex items-center mb-6 space-x-12">
        <h2 className="text-2xl font-bold text-blue-700">Basic Information</h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-6 rounded-full cursor-pointer"
            onClick={handleEditToggle}
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
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
            {fields.map(({ name, label, type }) => (
              <div
                key={name}
                className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
              >
                <label className="w-32 text-md font-semibold text-gray-800">
                  {label}
                </label>
                {name === "job_status" ? (
                  <select
                    name={name}
                    value={formValues[name]}
                    onChange={handleChange}
                    className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Job Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Probation">Probation</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                ) : name === "department_id" ? (
                  <select
                    name={name}
                    value={formValues[name]}
                    onChange={handleChange}
                    className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                ) : name === "id_input" ? (
                  <input
                    type={type}
                    name={name}
                    value={formValues[name]}
                    readOnly
                    className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={type}
                    name={name}
                    value={formValues[name]}
                    onChange={handleChange}
                    className="w-full sm:w-[20rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {errors[name] && (
                  <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isSubmitting || !isValid || (initialData ? !isDirty : false)
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 space-y-6">
          {fields.map(({ name, label }) => (
            <div key={name} className="flex items-start space-x-4">
              <span className="w-32 text-md font-semibold text-gray-800">
                {label}
              </span>
              <span className="text-gray-600">
                {(name !== "department_id"
                  ? formValues[name]
                  : departments.filter(
                      (dep) => dep.id === formValues.department_id
                    )[0]?.name) || "Data unavailable"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
