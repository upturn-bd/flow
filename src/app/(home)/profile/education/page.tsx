"use client";

import {
  deleteEmployeeEducationInfo,
  EmployeeEducationInfo,
  getEmployeeEducationInfo,
  setEmployeeEducationInfos,
} from "@/lib/api/employee";
import { Trash } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Education() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [editMode, setEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentEducations, setCurrentEducation] = useState<
    EmployeeEducationInfo[]
  >([]);
  const [updatedEducations, setUpdatedEducation] = useState<
    EmployeeEducationInfo[]
  >([]);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      const data = await getEmployeeEducationInfo(uid);
      setCurrentEducation(data);
      setUpdatedEducation(data);
    };
    fetchEmployeeInfo();
  }, [uid]);

  const handleAdd = () => {
    const newInfos = [];
    if (updatedEducations) {
      newInfos.push(...updatedEducations);
    }
    newInfos.push({
      degree: "",
      institution: "",
      company_id: "",
      type: "High School",
      from: new Date(),
      to: new Date(),
      result: "",
      id: Math.floor(Math.random() * 10000000000000),
    });
    setUpdatedEducation(newInfos);
  };

  const handleDelete = async (id: number) => {
    const { error } = await deleteEmployeeEducationInfo(id);
    if (error) {
      console.error(error);
      return;
    }
    setUpdatedEducation(updatedEducations.filter((entry) => entry.id !== id));
    setCurrentEducation(currentEducations.filter((entry) => entry.id !== id));
  };

  const handleChange = (
    id: number,
    field: keyof EmployeeEducationInfo,
    value: string
  ) => {
    setUpdatedEducation(
      updatedEducations!.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
    console.log(updatedEducations);
  };

  async function handleSave() {
    setIsUpdating(true);
    if (!updatedEducations) {
      return;
    }

    // separate new entries from current ones, updatedEducation - currentEducation
    const newEntries = updatedEducations.filter(
      (entry) => !currentEducations?.find((e) => e.id === entry.id)
    );

    const oldEntries = updatedEducations.filter((entry) =>
      currentEducations?.find((e) => e.id === entry.id)
    );

    newEntries.forEach((entry) => {
      delete entry.id;
    });

    const toUpdate = [...oldEntries, ...newEntries];

    const { error, insertError } = await setEmployeeEducationInfos(
      toUpdate,
      uid
    );

    //trigger reload of data
    const data = await getEmployeeEducationInfo(uid);
    setCurrentEducation(data);
    setUpdatedEducation(data);

    if (error) {
      console.error(error);
    } else {
      setEditMode(false);
    }
    setIsUpdating(false);
  }

  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold text-[#1D65E9]">Education</h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-8 rounded-full cursor-pointer"
            onClick={() => {
              if (editMode) {
                setUpdatedEducation(currentEducations);
              }
              setEditMode(!editMode);
            }}
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
            onClick={() => {
              if (editMode) {
                setUpdatedEducation(currentEducations);
              }
              setEditMode(!editMode);
            }}
          >
            Edit Mode
          </span>
        </div>
      </div>
      <table
        className="w-full border-collapse border border-gray-300"
        key={"educations"}
      >
        <thead>
          <tr className="bg-gray-100  text-[#002568]">
            <th className="border p-2">Degree</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Institution</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">CGPA</th>
            {editMode ? <th className="border p-2">Action</th> : null}
          </tr>
        </thead>
        <tbody className="text-blue-500">
          {updatedEducations && updatedEducations.length > 0 ? (
            updatedEducations!.map((entry) => (
              <tr key={entry.id} className={`border cursor-pointer`}>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      value={entry.degree || ""}
                      onChange={(e) =>
                        handleChange(entry.id!, "degree", e.target.value)
                      }
                    />
                  ) : (
                    entry.degree
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <select
                      value={entry.type}
                      onChange={(e) =>
                        handleChange(entry.id!, "type", e.target.value)
                      }
                    >
                      <option value="High School">High School</option>
                      <option value="College">College</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelors">Bachelors</option>
                      <option value="Masters">Masters</option>
                      <option value="PGD">PGD</option>
                      <option value="PhD">PhD</option>
                      <option value="Post-Doc">Post-Doc</option>
                    </select>
                  ) : (
                    entry.type
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      value={entry.institution || ""}
                      onChange={(e) =>
                        handleChange(entry.id!, "institution", e.target.value)
                      }
                    />
                  ) : (
                    entry.institution
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
                    new Date(entry.to ?? "").toLocaleDateString()
                  )}
                </td>
                <td className="border p-2">
                  {editMode ? (
                    <input
                      value={entry.result || ""}
                      onChange={(e) =>
                        handleChange(entry.id!, "result", e.target.value)
                      }
                    />
                  ) : (
                    entry.result
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
                      <Trash size={32}/>
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr><td colSpan={6} className="text-center">No data</td></tr>
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
    </div>
  );
}
