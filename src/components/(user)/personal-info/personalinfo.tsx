"use client"

import { useState } from "react";

interface PersonalDetails {
  gender: string;
  dateOfBirth: string;
  religion: string;
  bloodGroup: string;
  maritalStatus: string;
  children: string;
  nidNumber: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  emergencyContact: string;
  relationWithEC: string;
  phoneEC: string;
  address: string;
}

export default function PersonalInfo() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalDetails>({
    gender: "Male",
    fatherName: "Dilder Hossain",
    dateOfBirth: "10 August 1999",
    motherName: "Tahmina Khanom",
    religion: "Islam",
    spouseName: "Not Applicable",
    bloodGroup: "AB+ ve",
    emergencyContact: "Dilder Hossain",
    maritalStatus: "Unmarried",
    relationWithEC: "Father",
    children: "0",
    phoneEC: "+8801640480530",
    nidNumber: "24175004",
    address: "154 Shantinagar, Paltan, Dhaka",
  });

  const handleInputChange = (key: keyof PersonalDetails, value: string) => {
    setPersonalInfo((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      {/* Header Section */}
      <div className="my-10 flex gap-5">
        <h2 className="text-3xl font-semibold text-[#1D65E9]">Personal Information</h2>
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
        {Object.entries(personalInfo).map(([key, value]) => (
          <div key={key} className="flex items-center">
            {/* Label */}
            <div className="w-40 text-left text-[#002568] pr-2 font-semibold text-2xl">
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
            </div>
            {/* Separator */}
           
            {/* Value or Editable Input */}
            <div className="flex-1">
              {isEnabled ? (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(key as keyof PersonalDetails, e.target.value)}
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
        ))}
      </div>
    </div>
  );
}
