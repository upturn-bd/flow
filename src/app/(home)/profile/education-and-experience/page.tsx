"use client";

import { useState, useEffect } from "react";
import Education from "../education/page";
import {
  deleteEmployeeExperienceInfo,
  EmployeeExperienceInfo,
  getEmployeeExperienceInfos,
  setEmployeeExperienceInfos,
} from "@/lib/api/employee";
import { useSearchParams } from "next/navigation";
import { Trash } from "@phosphor-icons/react";

export default function Experience() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [editMode, setEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentExperiences, setCurrentExperiences] = useState<
    EmployeeExperienceInfo[]
  >([]);
  const [updatedExperiences, setUpdatedExperiences] = useState<
    EmployeeExperienceInfo[]
  >([]);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const data = await getEmployeeExperienceInfos(uid);
      setCurrentExperiences(data);
      setUpdatedExperiences(data);
    };
    fetchEmployeeInfo();
  }, [uid]);

  const handleAdd = () => {
    const newInfos = [];
    if (updatedExperiences) {
      newInfos.push(...updatedExperiences);
    }
    newInfos.push({
      company_name: "",
      designation: "",
      description: "",
      company_id: "",
      from: new Date(),
      to: new Date(),
      id: Math.floor(Math.random() * 10000000000000),
    });
    setUpdatedExperiences(newInfos);
  };

  const handleDelete = async (id: number) => {
    const { error } = await deleteEmployeeExperienceInfo(id);
    if (error) {
      console.error(error);
      return;
    }
    setUpdatedExperiences(
      updatedExperiences.filter((entry) => entry.id !== id)
    );
    setCurrentExperiences(
      currentExperiences.filter((entry) => entry.id !== id)
    );
  };

  const handleChange = (
    id: number,
    field: keyof EmployeeExperienceInfo,
    value: string
  ) => {
    setUpdatedExperiences(
      updatedExperiences.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  async function handleSave() {
    setIsUpdating(true);
    if (!updatedExperiences) {
      return;
    }

    // separate new entries from current ones, updatedEducation - currentEducation
    const newEntries = updatedExperiences.filter(
      (entry) => !currentExperiences?.find((e) => e.id === entry.id)
    );

    const oldEntries = updatedExperiences.filter((entry) =>
      currentExperiences?.find((e) => e.id === entry.id)
    );

    newEntries.forEach((entry) => {
      delete entry.id;
    });

    const toUpdate = [...oldEntries, ...newEntries];

    const { error, insertError } = await setEmployeeExperienceInfos(
      toUpdate,
      uid
    );

    //trigger reload of data
    const data = await getEmployeeExperienceInfos(uid);
    setCurrentExperiences(data);
    setUpdatedExperiences(data);

    if (error) {
      console.error(error);
    } else {
      setEditMode(false);
    }
    setIsUpdating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold text-[#1D65E9]">Experience</h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-8 rounded-full cursor-pointer"
            onClick={() => setEditMode(!editMode)}
          >
            <div
              className={`absolute w-full h-full rounded-full transition-colors duration-200 ${
                editMode ? "bg-blue-400" : "bg-gray-200"
              }`}
            />
            <div
              className={`absolute w-7 h-7 bg-white rounded-full shadow transform transition-transform duration-200 ${
                editMode ? "translate-x-8" : "translate-x-1"
              } top-0.5`}
            />
          </div>
          <span
            className="text-blue-600 cursor-pointer select-none text-lg"
            onClick={() => setEditMode(!editMode)}
          >
            Edit Mode
          </span>
        </div>
      </div>
      <table
        className="w-full border-collapse border border-gray-300"
        key={"experiences"}
      >
        <thead>
          <tr className="bg-gray-100 text-[#002568]">
            <th className="border p-2">Company Name</th>
            <th className="border p-2">Position</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Description</th>
            {editMode ? <th className="border p-2">Action</th> : null}
          </tr>
        </thead>
        <tbody className="text-blue-500">
          {updatedExperiences && updatedExperiences.length > 0 ? (
            updatedExperiences.map((entry) => (
              <tr key={entry.id} className={`border cursor-pointer`}>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      value={entry.company_name || ""}
                      onChange={(e) =>
                        handleChange(entry.id!, "company_name", e.target.value)
                      }
                    />
                  ) : (
                    entry.company_name
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      value={entry.designation || ""}
                      onChange={(e) =>
                        handleChange(entry.id!, "designation", e.target.value)
                      }
                    />
                  ) : (
                    entry.designation
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      type="date"
                      value={
                        entry.from
                          ? new Date(entry.from).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(entry.id!, "from", e.target.value)
                      }
                    />
                  ) : (
                    new Date(entry.from).toLocaleDateString()
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      type="date"
                      value={
                        entry.to
                          ? new Date(entry.to).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(entry.id!, "to", e.target.value)
                      }
                    />
                  ) : (
                    new Date(entry.to).toLocaleDateString()
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      value={entry.description || ""}
                      onChange={(e) =>
                        handleChange(entry.id!, "description", e.target.value)
                      }
                    />
                  ) : (
                    entry.description
                  )}
                </td>
                {editMode ? (
                  <td className="border p-2 text-center">
                    <button
                      className="text-red-500"
                      onClick={() => {
                        handleDelete(entry.id!);
                      }}
                    >
                      <Trash size={32} />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {editMode && (
        <div className="mt-4 flex space-x-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleAdd}
          >
            Add Entry
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleSave}
          >
            {isUpdating ? "Saving..." : "Save"}
          </button>
        </div>
      )}
      <Education />
    </div>
  );
}
