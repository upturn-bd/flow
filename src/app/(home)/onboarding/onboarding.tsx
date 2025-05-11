"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { ArrowFatRight as ArrowFatRightIcon } from "@phosphor-icons/react";
import { validateCompanyCode } from "@/lib/api/company-ss";
import {
  getDepartmentsByCompanyId,
  getEmployeesByCompanyId,
  getUser,
} from "@/lib/auth/getUser";

const jobStatuses = [
  "Active",
  "Inactive",
  "Probation",
  "Resigned",
  "Terminated",
] as const;

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  department_id: z.number().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  job_status: z.enum(jobStatuses, {
    errorMap: () => ({ message: "Job status is required" }),
  }),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  company_name: z.string().min(1, "Company name is required"),
  company_id: z.number().min(1, "Company ID is required"),
  supervisor_id: z.string().optional(),
});

export default function EmployeeOnboarding() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    department_id: 0,
    designation: "",
    job_status: "",
    hire_date: "",
    company_name: "",
    company_id: 0,
    supervisor_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const [isCompanyCodeValid, setIsCompanyCodeValid] = useState(false);
  const [companyCode, setCompanyCode] = useState("");
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [employees, setEmployees] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const fetchRejectedData = async () => {
      if (status === "rejected") {
        try {
          setLoading(true);
          const res = await fetch("/api/onboarding");
          if (res.ok) {
            const { data } = await res.json();
            if (data) {
              const formatted = {
                ...formData,
                ...data.userData,
                company_name: data.companyData.name,
                company_id: data.userData.company_id,
              };
              setCompanyCode(data.companyData.code);
              setIsCompanyCodeValid(true);
              setFormData(formatted);
            }
          }
        } catch (e) {
          console.error("Failed to fetch rejected data:", e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRejectedData();
  }, [status]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "department_id" ? parseInt(value) : value,
    }));
    setDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = formSchema.parse(formData);
      setErrors({});
      setLoading(true);
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = await res.json();
      if (!res.ok) return alert(result.error || "Something went wrong");
      router.push("/onboarding?status=pending");
    } catch (err: any) {
      const errorMap: Record<string, string> = {};
      if (err?.errors) {
        err.errors.forEach((e: any) => (errorMap[e.path[0]] = e.message));
        setErrors(errorMap);
      } else {
        alert("Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCompanyCode = async () => {
    try {
      setLoading(true);
      const { isValid, id } = await validateCompanyCode(
        formData.company_name,
        companyCode
      );
      if (isValid && id) {
        setFormData((prev) => ({ ...prev, company_id: id }));
        setIsCompanyCodeValid(isValid);
      } else {
        alert("Invalid company code or name. Please check and try again.");
      }
    } catch (error) {
      console.error("Error verifying company code:", error);
      alert("Failed to verify company code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async (companyId: number) => {
      try {
        const res = await getDepartmentsByCompanyId(companyId);
        setDepartments(res);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchEmployees = async (companyId: number) => {
      try {
        const res = await getEmployeesByCompanyId(companyId);
        setEmployees(res ?? []);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const getUserId = async () => {
      try {
        const { user } = await getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    if (isCompanyCodeValid && formData.company_id) {
      fetchDepartments(formData.company_id);
      fetchEmployees(formData.company_id);
      getUserId();
    }
  }, [formData.company_id, isCompanyCodeValid]);

  const renderInput = (
    name: keyof typeof formData,
    label: string,
    type = "text",
    readOnly = false
  ) => (
    <div className="flex items-center space-x-4">
      <label className="w-32 text-md font-semibold text-gray-800">
        {label}
      </label>
      <input
        name={name}
        value={formData[name]}
        onChange={handleChange}
        type={type}
        readOnly={readOnly}
        className={`w-full lg:w-[20rem] xl:w-[25rem] rounded-md border px-4 py-2 text-sm ${
          readOnly
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-blue-50 border-gray-200 text-gray-900"
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600 ml-36">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row">
      <div
        className="relative w-[100px] md:flex flex-col items-center justify-center hidden"
        style={{
          background:
            "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
        }}
      >
        <div className="absolute top-10 right-0 translate-x-1/3 p-5 rounded-full bg-[#001731] flex items-center justify-center">
          <ArrowFatRightIcon
            size={70}
            className="-rotate-45 text-yellow-500"
            weight="fill"
          />
        </div>
      </div>
      <main className="w-full p-6 lg:py-12 lg:px-20">
        <h1 className="text-3xl font-semibold text-blue-700 mb-6">
          Employee Onboarding
        </h1>

        {status === "pending" ? (
          <div className="mt-20 lg:w-4/5 mb-6 p-4 rounded-lg bg-[#FFC700] border border-yellow-300">
            <h2 className="text-xl font-bold">Data sent for review.</h2>
            <p className="mt-2 text-gray-800">
              Please wait while your data is being reviewed by the admins.
              Contact your supervisor if needed.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col lg:flex-row lg:justify-between gap-6 mt-12"
          >
            <div className="space-y-6 lg:max-w-5xl">
              <div className="bg-white p-4 space-y-4">
                <h2 className="text-xl font-bold text-blue-700">
                  Company Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderInput("company_name", "Company Name")}
                  <div className="flex items-center space-x-4">
                    <label className="w-32 text-md font-semibold text-gray-800">
                      Company Code
                    </label>
                    <input
                      name="companyCode"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                      type="text"
                      required
                      className={
                        "w-full lg:w-[20rem] xl:w-[25rem] rounded-md border px-4 py-2 text-sm bg-blue-50 border-gray-200 text-gray-900$ focus:outline-none focus:ring-2 focus:ring-blue-500"
                      }
                    />
                  </div>
                  {(isCompanyCodeValid || status === "rejected") && (
                    <button
                      disabled
                      className="md:w-1/3 bg-[#192D46] text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verified
                    </button>
                  )}

                  {!isCompanyCodeValid && status !== "rejected" && (
                    <button
                      onClick={handleValidateCompanyCode}
                      type="button"
                      disabled={!formData.company_name || !companyCode}
                      className="md:w-1/3 bg-[#192D46] text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>

              {isCompanyCodeValid && (
                <div className="bg-white p-4 space-y-4">
                  <h2 className="text-xl font-bold text-blue-700">
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {renderInput("first_name", "First Name")}
                    {renderInput("last_name", "Last Name")}
                    {renderInput("email", "Email")}
                    {renderInput("phone_number", "Phone Number")}
                    <div className="flex items-center space-x-4">
                      <label className="w-32 text-md font-semibold text-gray-800">
                        Department
                      </label>
                      <select
                        name="department_id"
                        value={formData.department_id}
                        onChange={(e) => handleChange(e)}
                        className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border px-4 py-2 text-sm bg-blue-50 border-gray-200 text-gray-900$ focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      {errors.department_id && (
                        <p className="text-red-500 text-sm">
                          {errors.department_id}
                        </p>
                      )}
                    </div>
                    {renderInput("designation", "Designation")}
                    <div className="flex items-center space-x-4">
                      <label className="w-32 text-md font-semibold text-gray-800">
                        Job Status
                      </label>
                      <select
                        name="job_status"
                        value={formData.job_status}
                        onChange={(e) => handleChange(e)}
                        className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border px-4 py-2 text-sm bg-blue-50 border-gray-200 text-gray-900$ focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Job Status</option>
                        {jobStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {errors.department_id && (
                        <p className="text-red-500 text-sm">
                          {errors.department_id}
                        </p>
                      )}
                    </div>
                    {renderInput("hire_date", "Joining Date", "date")}
                    <div className="flex items-center space-x-4">
                      <label className="w-32 text-md font-semibold text-gray-800">
                        Supervisor
                      </label>
                      <select
                        value={formData.supervisor_id}
                        name="supervisor_id"
                        onChange={handleChange}
                        className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border px-4 py-2 text-sm bg-blue-50 border-gray-200 text-gray-900$ focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Not Applicable</option>
                        {status !== "rejected" &&
                          employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        {status === "rejected" &&
                          employees
                            .filter((employee) => employee.id !== userId)
                            .map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              {status === "rejected" && (
                <div className="mb-4 p-4 rounded-md bg-[#FF4646] text-white border border-red-300">
                  <h2 className="text-xl font-bold">Reason for rejection:</h2>
                  <p className="mt-2">{reason || "Reason unavailable"}</p>
                </div>
              )}
              {!status || status === "rejected" ? (
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (status === "rejected" && !dirty) ||
                    !formSchema.safeParse(formData).success
                  }
                  className="bg-[#192D46] text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading...
                    </span>
                  ) : status === "rejected" ? (
                    "Resubmit"
                  ) : (
                    "Send for review"
                  )}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
