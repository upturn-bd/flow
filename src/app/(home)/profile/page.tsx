'use client';

import { EmployeeInfo, getEmployeeBasicInfo, setEmployeeBasicInfo } from "@/lib/api/employee";
import Image from "next/image"
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { set } from "react-hook-form";

export default function ProfilePage() {

  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [isEnabled, setIsEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeInfo | null>(null);
  const [updatedEmployee, setUpdatedEmployee] = useState<EmployeeInfo | null>(null);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const data = await getEmployeeBasicInfo(uid);
      setCurrentEmployee(data);
      setUpdatedEmployee(data);
    };
    fetchEmployeeInfo();
  }, [uid]);

  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };


  const handleInputChange = (key: keyof EmployeeInfo, value: string) => {
    setUpdatedEmployee((prev) => {
      if (prev) {
        return { ...prev, [key]: value };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setUpdating(true);
    if (!updatedEmployee) {
      return;
    }
    // get partial updatedEmployee according to changes
    const toUpdate: Partial<EmployeeInfo> = Object.entries(updatedEmployee).reduce(
      (acc, [key, value]) => {
        if (currentEmployee && currentEmployee[key as keyof EmployeeInfo] !== value) {
          return { ...acc, [key]: value };
        }
        return acc;
      },
      {} as Partial<EmployeeInfo>
    );
    const { error } = await setEmployeeBasicInfo(uid, toUpdate);
    if (error) {
      console.error(error);
    } else {
      setIsEnabled(false);
    }
    setUpdating(false);
  }

  return (
    <div>
      <div className="flex gap-5 mb-5">
        <div>
          <h2 className="text-3xl font-semibold text-[#1D65E9]">Basic Information</h2>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-8 rounded-full cursor-pointer"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            <div
              className={`absolute w-full h-full rounded-full transition-colors duration-200 ${isEnabled ? "bg-blue-400" : "bg-gray-200"
                }`}
            />
            <div
              className={`absolute w-7 h-7 bg-white rounded-full shadow transform transition-transform duration-200 ${isEnabled ? "translate-x-8" : "translate-x-1"
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
            Object.entries(updatedEmployee).map(([key, value]) => (
              <div key={key} className="flex items-center pb-2">
                <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                  {formatLabel(key)}
                </div>
                <div className="flex-1">
                  {isEnabled ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleInputChange(key as keyof EmployeeInfo, e.target.value)}
                      className="pl-5 bg-[#E3F3FF]  text-2xl p-1 rounded "
                    />
                  ) : (
                    <>
                      <span className="inline-block ">:</span>
                      <span className="pl-5 text-2xl p-1">{value !== undefined ? value.toString() : ''}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>Loading...</div>
          )}
        </div>
        {/* Save button */}
        <div>
          <Image src="/Account.png" alt="signature" width={300} height={100} />
        </div>
        <div className="flex justify-center items-center">
          <button
            className="bg-[#1D65E9] text-white px-5 py-2 rounded-lg"
            onClick={handleSave}
            disabled={updating}
          >
            {updating ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}