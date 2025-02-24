"use client";

import { EmployeeInfo, getEmployeeBasicInfo } from "@/lib/api/employee";
import Image from "next/image"
import { useState } from "react";
import { useEffect } from "react";

export default function BasicInfo({ uid }: { uid: string }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeInfo | null>(null);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const data = await getEmployeeBasicInfo(uid);
      setCurrentEmployee(data);
    };
    fetchEmployeeInfo();
  }, [uid]);

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };


  const handleInputChange = (key: keyof EmployeeInfo, value: string) => {
    setCurrentEmployee((prev) => {
      if (prev) {
        return { ...prev, [key]: value };
      }
      return prev;
    });
  };

  useEffect(() => {
    
  }, []);
  
  return (
    <div>
      <div className="my-10 flex gap-5">
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
          {currentEmployee && Object.entries(currentEmployee).length > 0 ? (
            Object.entries(currentEmployee).map(([key, value]) => (
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
        <div>
          <Image src="/Account.png" alt="signature" width={300} height={100} />
        </div>
      </div>
    </div>
  );
}
