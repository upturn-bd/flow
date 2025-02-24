"use client";

import { Employee, EmployeeBasicInfo } from "@/lib/models/employee";
import { revalidatePath } from "next/cache";
import Image from "next/image"
import { useEffect, useState } from "react"

// interface EmployeeInfo {
//   name: string
//   employeeId: string
//   designation: string
//   department: string
//   phoneNo: string
//   emailId: string
//   jobStatus: string
//   joiningDate: string
//   supervisor: string
// }

export default function BasicInfo() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(new Employee());
  // const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>({
  //   name: "Mahir Hossain",
  //   employeeId: "24175004",
  //   designation: "Founder",
  //   department: "Management",
  //   phoneNo: "+8801640480530",
  //   emailId: "mahir@upturn.com.bd",
  //   jobStatus: "Permanent",
  //   joiningDate: "22 October, 2022",
  //   supervisor: "Not Applicable",
  // });

  const handleInputChange = (key: keyof EmployeeBasicInfo, value: string) => {
    setCurrentEmployee(currentEmployee);
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };


  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const updatedEmployee = new Employee();
      await updatedEmployee.getBasicInfo();
      console.log(updatedEmployee.basicInfo);
      setCurrentEmployee(updatedEmployee);
    };
    fetchEmployeeInfo();
    
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
            {currentEmployee?.basicInfo && Object.entries(currentEmployee.basicInfo).length > 0 ? (
            Object.entries(currentEmployee.basicInfo).map(([key, value]) => (
              <div key={key} className="flex items-center pb-2">
              <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
                {formatLabel(key)}
              </div>
              <div className="flex-1">
                {isEnabled ? (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(key as keyof EmployeeBasicInfo, e.target.value)}
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
            <div>{JSON.stringify(currentEmployee?.basicInfo)}</div>
            )}
        </div>
        <div>
          <Image src="/Account.png" alt="signature" width={300} height={100} />
        </div>
      </div>
    </div>
  );
}
