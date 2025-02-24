"use client";

import { useState } from "react";

interface ExperienceEntry {
  id: number;
  company?: string;
  position?: string;
  from?: string;
  to?: string;
  description?: string;
}

export default function Experience() {
  const [editMode, setEditMode] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [experience, setExperience] = useState<ExperienceEntry[]>([
    {
      id: 1,
      company: "KPMG Bangladesh",
      position: "Management Consultant",
      from: "Mar, 2023",
      to: "July, 2023",
      description: "",
    },
    {
      id: 2,
      company: "Southern Multipack",
      position: "Management Trainee",
      from: "Jan, 2023",
      to: "Mar, 2023",
      description: "",
    },
  ]);

  const handleAdd = () => {
    setExperience([...experience, { id: Date.now() }]);
  };

  const handleDelete = () => {
    if (selectedId !== null) {
      setExperience(experience.filter((entry) => entry.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleChange = (id: number, field: keyof ExperienceEntry, value: string) => {
    setExperience(
      experience.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  return (
    <div >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold text-[#1D65E9]">Experience</h2>
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
          <tr className="bg-gray-100  text-[#002568] ">
            <th className="border p-2">Company Name</th>
            <th className="border p-2">Position</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Description</th>
          </tr>
        </thead>
        <tbody className=" text-blue-500">
          {experience.map((entry) => (
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
                    value={entry.company || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "company", e.target.value)
                    }
                  />
                ) : (
                  entry.company
                )}
              </td>
              <td className="border p-2">
                {editMode ? (
                  <input
                    value={entry.position || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "position", e.target.value)
                    }
                  />
                ) : (
                  entry.position
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
                    value={entry.description || ""}
                    onChange={(e) =>
                      handleChange(entry.id, "description", e.target.value)
                    }
                  />
                ) : (
                  entry.description
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
