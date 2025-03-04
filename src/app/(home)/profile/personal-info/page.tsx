"use client";

import {
  EmployeePersonalInfo,
  getEmployeePersonalInfo,
  setEmployeePersonalInfo,
} from "@/lib/api/employee";
import { formatLabel } from "@/lib/helpers/formatter";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PersonalInfo() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [isEnabled, setIsEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPersonalInfo, setCurrentPersonalInfo] =
    useState<EmployeePersonalInfo | null>(null);
  const [updatedPersonalInfo, setUpdatedPersonalInfo] =
    useState<EmployeePersonalInfo | null>(null);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const data = await getEmployeePersonalInfo(uid);
      setCurrentPersonalInfo(data);
      setUpdatedPersonalInfo(data);
    };
    fetchEmployeeInfo();
  }, [uid]);

  const handleInputChange = (
    key: keyof EmployeePersonalInfo,
    value: string
  ) => {
    setUpdatedPersonalInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsUpdating(true);
    if (!updatedPersonalInfo) {
      return;
    }
    // get partial updatedPersonalInfo according to changes
    const toUpdate: Partial<EmployeePersonalInfo> = Object.entries(
      updatedPersonalInfo
    ).reduce((acc, [key, value]) => {
      if (
        currentPersonalInfo &&
        currentPersonalInfo[key as keyof EmployeePersonalInfo] !== value
      ) {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {} as Partial<EmployeePersonalInfo>);
    const { error } = await setEmployeePersonalInfo(uid, toUpdate);
    if (error) {
      console.error(error);
    } else {
      setIsEnabled(false);
    }
    setIsUpdating(false);
  };

  return (
    <div>
      {/* Header Section */}
      <div className="my-10 flex gap-5">
        <h2 className="text-3xl font-semibold text-[#1D65E9]">
          Personal Information
        </h2>
        <div className="flex items-center space-x-2">
          {/* Toggle Button for Edit Mode */}
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

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
        {updatedPersonalInfo &&
        Object.entries(updatedPersonalInfo).length > 0 ? (
          Object.entries(updatedPersonalInfo!).map(([key, value]) => (
            <div key={key} className="flex items-center">
              {/* Label */}
              <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                {formatLabel(key)}
              </div>
              {/* Separator */}

              {/* Value or Editable Input */}
              <div className="flex-1">
                {isEnabled ? (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      handleInputChange(
                        key as keyof EmployeePersonalInfo,
                        e.target.value
                      )
                    }
                    className="pl-5 bg-[#E3F3FF]  text-2xl p-1 rounded "
                  />
                ) : (
                  <>
                    <span className="inline-block ">:</span>
                    <span className="pl-5 text-2xl p-1">{value}</span>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div>Loading...</div>
        )}
        {/* Save button */}
      </div>
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
  );
}
