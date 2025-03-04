"use client";

import { getDepartments, getDesignations } from "@/lib/api/company";
import {
  EmployeeInfo,
  getEmployeeBasicInfo,
  setEmployeeBasicInfo,
} from "@/lib/api/employee";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [isEnabled, setIsEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeInfo | null>(
    null
  );
  const [updatedEmployee, setUpdatedEmployee] = useState<EmployeeInfo | null>(
    null
  );

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const data = await getEmployeeBasicInfo(uid);
      setCurrentEmployee(data);
      setUpdatedEmployee(data);
    };
    fetchEmployeeInfo();
  }, [uid]);

  // get all designations and departments
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDesignations = async () => {
      const data = await getDesignations(uid);
      setDesignations(data);
    };
    const fetchDepartments = async () => {
      const data = await getDepartments(uid);
      console.log(data);
      setDepartments(data);
    };
    fetchDesignations();
    fetchDepartments();
  }, []);

  const handleInputChange = (key: keyof EmployeeInfo, value: string) => {
    setUpdatedEmployee((prev) => {
      if (prev) {
        return { ...prev, [key]: value };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setIsUpdating(true);
    if (!updatedEmployee) {
      return;
    }
    // get partial updatedEmployee according to changes
    const toUpdate: Partial<EmployeeInfo> = Object.entries(
      updatedEmployee
    ).reduce((acc, [key, value]) => {
      if (
        currentEmployee &&
        currentEmployee[key as keyof EmployeeInfo] !== value
      ) {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {} as Partial<EmployeeInfo>);
    const { error } = await setEmployeeBasicInfo(uid, toUpdate);
    if (error) {
      console.error(error);
    } else {
      setIsEnabled(false);
    }
    setIsUpdating(false);
  };

  return (
    <>
      <div className="flex gap-5 mb-5">
        <div>
          <h2 className="text-3xl font-semibold text-[#1D65E9]">
            Basic Information
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-8 rounded-full cursor-pointer"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            <div
              className={`absolute w-full h-full rounded-full transition-colors duration-200 ${
                isEnabled ? "bg-blue-400" : "bg-gray-200"
              }`}
            />
            <div
              className={`absolute w-7 h-7 bg-white rounded-full shadow transform transition-transform duration-200 ${
                isEnabled ? "translate-x-8" : "translate-x-1"
              } top-0.5`}
            />
          </div>
          <span
            className="text-blue-600 cursor-pointer select-none text-lg"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            Edit Mode
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="space-y-4">
          {updatedEmployee && Object.entries(updatedEmployee).length > 0 ? (
            <>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  First Name
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.first_name || ""}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.first_name || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Last Name
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.last_name || ""}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.last_name || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Email
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.email || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Phone Number
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.phone_number || ""}
                      onChange={(e) =>
                        handleInputChange("phone_number", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.phone_number || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Department
                </div>
                <div className="flex-1">
                    {isEnabled ? (
                    <select
                      value={updatedEmployee?.department || ""}
                      onChange={(e) =>
                      handleInputChange("department", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    >
                      {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                      ))}
                    </select>
                    ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                      {updatedEmployee?.department || ""}
                      </span>
                    </>
                    )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Designation
                </div>
                <div className="flex-1">
                    {isEnabled ? (
                    <select
                      value={updatedEmployee?.designation || ""}
                      onChange={(e) =>
                      handleInputChange("designation", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded flex w-full"
                    >
                      {designations.map((designation) => (
                      <option key={designation.id} value={designation.positions.name}>
                        {designation.positions.name}
                      </option>
                      ))}
                    </select>
                    ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                      {updatedEmployee?.designation || ""}
                      </span>
                    </>
                    )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Job Status
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.job_status || ""}
                      onChange={(e) =>
                        handleInputChange("job_status", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.job_status || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Hire Date
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.hire_date || ""}
                      onChange={(e) =>
                        handleInputChange("hire_date", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.hire_date || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Supervisor
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={updatedEmployee?.supervisor || ""}
                      onChange={(e) =>
                        handleInputChange("supervisor", e.target.value)
                      }
                      className="pl-6 bg-[#E3F3FF] text-2xl rounded"
                    />
                  ) : (
                    <>
                      <span className="inline-block">:</span>
                      <span className="pl-5 text-2xl p-1">
                        {updatedEmployee?.supervisor || ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pb-5">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  Employee ID
                </div>
                <div className="flex-1">
                  <span className="inline-block">:</span>
                  <span className="pl-5 text-2xl p-1">
                    {updatedEmployee?.employee_id || ""}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div>Loading...</div>
          )}
        </div>
        <div>
          <Image src="/Account.png" alt="signature" width={300} height={100} />
        </div>
        {/* Save button */}
        {isEnabled ? (
          <div className="flex justify-center items-center">
            <button
              className="bg-[#1D65E9] text-white px-5 py-2 rounded-lg"
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
