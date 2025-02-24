"use client";

import { useState } from "react";

interface Entry {
  id: number;
  degree?: string;
  institution?: string;
  from?: string;
  to?: string;
  cgpa?: string;
}

export default function Education() {
  const [editMode, setEditMode] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [education, setEducation] = useState<Entry[]>([
    {
      id: 1,
      degree: "Masters of Science in Applied Economics",
      institution: "Brac University",
      from: "2024",
      to: "2025",
      cgpa: "3.72",
    },
    {
      id: 2,
      degree: "Bachelor of Business Administration",
      institution: "IBA, University of Dhaka",
      from: "2019",
      to: "2022",
      cgpa: "3.62",
    },
  ]);

  const handleAdd = () => {
    setEducation([...education, { id: Date.now() }]);
  };

  const handleDelete = () => {
    if (selectedId !== null) {
      setEducation(education.filter((entry) => entry.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleChange = (id: number, field: keyof Entry, value: string) => {
    setEducation(
      education.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold text-[#1D65E9]">Education</h2>
        <div className="flex items-center space-x-2">
          <div
            className="relative w-16 h-8 rounded-full cursor-pointer"
            onClick={() => {
              setIsEnabled(!isEnabled);
              setEditMode(!editMode);
            }}
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
            onClick={() => {
              setIsEnabled(!isEnabled);
              setEditMode(!editMode);
            }}
          >
            Edit Mode
          </span>
        </div>
      </div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100  text-[#002568]">
            <th className="border p-2">Degree</th>
            <th className="border p-2">Institution</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">CGPA</th>
          </tr>
        </thead>
        <tbody className="text-blue-500">
          {education.map((entry) => (
            <tr
              key={entry.id}
              className={`border cursor-pointer ${
                selectedId === entry.id ? "bg-blue-200" : ""
              }`}
              onClick={() => setSelectedId(entry.id)}
            >
              <td className="border p-2">
                {editMode ? (
                  <input
                    value={entry.degree || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "degree", e.target.value)
                    }
                  />
                ) : (
                  entry.degree
                )}
              </td>
              <td className="border p-2">
                {editMode ? (
                  <input
                    value={entry.institution || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "institution", e.target.value)
                    }
                  />
                ) : (
                  entry.institution
                )}
              </td>
              <td className="border p-2">
                {editMode ? (
                  <input
                    value={entry.from || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "from", e.target.value)
                    }
                  />
                ) : (
                  entry.from
                )}
              </td>
              <td className="border p-2">
                {editMode ? (
                  <input
                    value={entry.to || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "to", e.target.value)
                    }
                  />
                ) : (
                  entry.to
                )}
              </td>
              <td className="border p-2">
                {editMode ? (
                  <input
                    value={entry.cgpa || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "cgpa", e.target.value)
                    }
                  />
                ) : (
                  entry.cgpa
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editMode && (
        <div className="mt-4 flex space-x-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleAdd}>
            Add Entry
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
