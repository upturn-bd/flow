"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowFatRight as ArrowFatRightIcon } from "@phosphor-icons/react";


type FormData = {
  first_name: string;
  last_name: string;
  id_input: string;
  email: string;
  phone_number: string;
  division: string;
  department: string;
  designation: string;
  role: string;
  hire_date: string;
  is_supervisor: string;
  company_name: string;
  company_code: string;
};

export default function EmployeeOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const generateIdInput= () => {
    const letters = Array(3)
      .fill(null)
      .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      .join("");
  
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    return letters + digits;
  }

  const { control, handleSubmit, formState } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      first_name: "",
      id_input: generateIdInput(),
      last_name: "",
      email: "",
      phone_number: "",
      division: "",
      department: "",
      designation: "",
      role: "",
      hire_date: "",
      is_supervisor: "yes",
      company_name: "",
      company_code: "",
    },
  });


  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/employees", {
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
    console.log(formState)
  }, [formState]);

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
          <div className="mb-6 p-4 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
            Your data has been sent for review.
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
                    rules={{ required: true }}
                    render={({ field }) => (
                      <div className="flex items-center space-x-4">
                        <label className="w-32 text-md font-semibold text-gray-800">
                          Company Name
                        </label>
                        <input
                          {...field}
                          className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="company_code"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <div className="flex items-center space-x-4">
                        <label className="w-32 text-md font-semibold text-gray-800">
                          Company Code
                        </label>
                        <input
                          {...field}
                          className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                    ["email", "E-mail"],
                    ["phone_number", "Phone Number"],
                    ["department", "Department"],
                    ["designation", "Designation"],
                    ["role", "Job Status"],
                    ["hire_date", "Joining Date"],
                    ["is_supervisor", "Supervisor"],
                  ].map(([name, label]) => (
                    <Controller
                      key={name}
                      name={name as keyof FormData}
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <div className="flex items-center space-x-4">
                          <label className="w-32 text-md font-semibold text-gray-800">
                            {label}
                          </label>
                          {name === "is_supervisor" ? (
                            <select
                              {...field}
                              name="is_supervisor"
                              className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          ) : (
                            <input
                              {...field}
                              type={name === "hire_date" ? "date" : "text"}
                              className="w-full lg:w-[20rem] xl:w-[25rem] rounded-md border border-gray-200 bg-blue-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              {status === "rejected" && reason && (
                <div className="mb-4 p-4 rounded-md bg-red-100 text-red-800 border border-red-300">
                  {reason}
                </div>
              )}
              {!status && (
                <button
                  className={`bg-[#192D46] text-white px-6 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50`}
                  disabled={!formState.isValid || loading}
                  type="submit"
                >
                  Send for review
                </button>
              )}
              {status === "rejected" && (
                <button
                  className={`bg-[#192D46] text-white px-6 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50`}
                  disabled={!formState.isValid || loading}
                  type="submit"
                >
                  Resubmit
                </button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
