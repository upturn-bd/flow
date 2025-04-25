"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowFatRight as ArrowFatRightIcon } from "@phosphor-icons/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  company_name: z.string().min(1, "Company name is required"),
  company_id: z.string().min(1, "Company ID is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function EmployeeOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const [rejectedData, setRejectedData] = useState<FormData | null>(null);

  const { control, handleSubmit, formState, reset } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: rejectedData || {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      department: "",
      designation: "",
      job_status: "",
      hire_date: "",
      company_name: "",
      company_id: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Something went wrong");
        return;
      }

      router.push("/onboarding?status=pending");
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong. Please try again later.");
    }
  };

  useEffect(() => {
    const fetchRejectedData = async () => {
      if (status === "rejected") {
        try {
          setLoading(true);
          const res = await fetch("/api/onboarding");
          if (res.ok) {
            const { data } = await res.json();
            if (data) {
              const formattedData = {
                ...data,
                company_name: data.company_name || "",
                company_id: data.company_id.toString() || "",
                hire_date: data.hire_date || "",
              };
              setRejectedData(formattedData);
              reset(formattedData);
            }
          }
        } catch (error) {
          console.error("Failed to fetch rejected data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRejectedData();
  }, [status, reset]);

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
        {status === "pending" && (
          <div className="mt-20 lg:w-4/5 mb-6 p-4 rounded-lg bg-[#FFC700] border border-yellow-300">
            <h2 className="text-xl font-bold">Data sent for review.</h2>
            <p className="mt-2 text-gray-800">
              Please wait while your data is being reviewed by the admins.
              Please contact your supervisor/ admin if you feel like there is a
              problem.
            </p>
          </div>
        )}
        {status != "pending" && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col lg:flex-row lg:justify-between gap-6 mt-12"
          >
            <div className="space-y-6 lg:max-w-5xl">
              <div className="bg-white p-4 space-y-4">
                <h2 className="text-xl font-bold text-blue-700">
                  Company Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <Controller
                    name="company_name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex items-center space-x-4">
                        <label className="w-32 text-md font-semibold text-gray-800">
                          Company Name
                        </label>
                        <input
                          {...field}
                          className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {fieldState.error && (
                          <p className="mt-1 text-sm text-red-600 ml-36">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="company_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex items-center space-x-4">
                        <label className="w-32 text-md font-semibold text-gray-800">
                          Company Code
                        </label>
                        <input
                          {...field}
                          className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {fieldState.error && (
                          <p className="mt-1 text-sm text-red-600 ml-36">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="bg-white p-4 space-y-4">
                <h2 className="text-xl font-bold text-blue-700">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    ["first_name", "First Name"],
                    ["last_name", "Last Name"],
                    ["email", "Email"],
                    ["phone_number", "Phone Number"],
                    ["department", "Department"],
                    ["designation", "Designation"],
                    ["job_status", "Job Status"],
                    ["hire_date", "Joining Date"],
                  ].map(([name, label]) => (
                    <Controller
                      key={name}
                      name={name as keyof FormData}
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="flex items-center space-x-4">
                          <label className="w-32 text-md font-semibold text-gray-800">
                            {label}
                          </label>

                          <input
                            {...field}
                            type={name === "hire_date" ? "date" : "text"}
                            className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          {fieldState.error && (
                            <p className="mt-1 text-sm text-red-600 ml-36">
                              {fieldState.error.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  ))}
                  <div className="flex items-center space-x-4">
                    <label className="w-32 text-md font-semibold text-gray-800">
                      Supervisor
                    </label>
                    <input
                      value="Not Applicable"
                      readOnly
                      className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              {status === "rejected" && reason && (
                <div className="mb-4 p-4 rounded-md bg-[#FF4646] text-white border border-red-300">
                  <h2 className="text-xl font-bold">Reason for rejection:</h2>
                  <p className="mt-2">{reason}</p>
                </div>
              )}
              {status === "rejected" && !reason && (
                <div className="mb-4 p-4 rounded-md bg-[#FF4646] text-white border border-red-300">
                  <h2 className="text-xl font-bold">Reason for rejection:</h2>
                  <p className="mt-2">Reason unavailable</p>
                </div>
              )}
              {!status && (
                <button
                  className={`bg-[#192D46] text-white px-6 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50 disbaled:cursor-not-allowed`}
                  disabled={!formState.isValid || loading}
                  type="submit"
                >
                  Send for review
                </button>
              )}
              {status === "rejected" && (
                <button
                  className={`
      bg-[#192D46] text-white px-6 py-2 rounded-md 
      hover:bg-blue-800 transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
    `}
                  disabled={
                    !formState.isValid ||
                    loading ||
                    Object.keys(formState.dirtyFields).length === 0
                  }
                  type="submit"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Resubmit"
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
