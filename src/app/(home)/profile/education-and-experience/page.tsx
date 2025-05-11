"use client";

import { useEffect, useState } from "react";
import EducationModal from "@/components/education-and-experience/EducationModal";
import { useEducation } from "@/hooks/useEducation";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";
import { useExperience } from "@/hooks/useExperience";
import ExperienceModal from "@/components/education-and-experience/ExperienceModal";
import { ProfileTabs } from "@/components/profile/tab-bar";

export default function EducationExperiencePage() {
  const {
    education,
    fetchEducation,
    createEducation,
    updateEducation,
    deleteEducation,
  } = useEducation();
  const [editEducation, setEditEducation] = useState<number | null>(null);
  const [isCreatingEducation, setIsCreatingEducation] = useState(false);

  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

  const handleCreateEducation = async (values: any) => {
    try {
      await createEducation(values);
      alert("Education created!");
      setIsCreatingEducation(false);
      fetchEducation();
    } catch {
      alert("Error creating education.");
    }
  };

  const handleUpdateEducation = async (values: any) => {
    try {
      await updateEducation(values);
      alert("Education updated!");
      setEditEducation(null);
      fetchEducation();
    } catch {
      alert("Error updating education.");
    }
  };

  const handleDeleteEducation = async (id: number) => {
    try {
      await deleteEducation(id);
      alert("Education deleted!");
      fetchEducation();
    } catch {
      alert("Error deleting education.");
    }
  };

  const selectedEducationEdit = education.find((d) => d.id === editEducation);

  //Experience states and functions
  const {
    experience,
    fetchExperience,
    createExperience,
    updateExperience,
    deleteExperience,
  } = useExperience();
  const [editExperience, setEditExperience] = useState<number | null>(null);
  const [isCreatingExperience, setIsCreatingExperience] = useState(false);

  useEffect(() => {
    fetchExperience();
  }, [fetchExperience]);

  const handleCreateExperience = async (values: any) => {
    try {
      await createExperience(values);
      alert("Experience created!");
      setIsCreatingExperience(false);
      fetchExperience();
    } catch {
      alert("Error creating experience.");
    }
  };

  const handleUpdateExperience = async (values: any) => {
    try {
      await updateExperience(values);
      alert("Experience updated!");
      setEditExperience(null);
      fetchExperience();
    } catch {
      alert("Error updating experience.");
    }
  };

  const handleDeleteExperience = async (id: number) => {
    try {
      await deleteExperience(id);
      alert("Experience deleted!");
      fetchExperience();
    } catch {
      alert("Error deleting experience.");
    }
  };

  const selectedExperienceEdit = experience.find(
    (d) => d.id === editExperience
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <ProfileTabs />
      <div className="mb-6" />
      <h2 className="text-2xl font-bold text-blue-700">Education</h2>
      <div className="overflow-x-auto border rounded-md mb-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Degree</th>
              <th className="px-4 py-2 border">Institution</th>
              <th className="px-4 py-2 border">From</th>
              <th className="px-4 py-2 border">To</th>
              <th className="px-4 py-2 border">CGPA</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {education.length > 0 ? (
              education.map((edu, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{edu.name}</td>
                  <td className="px-4 py-2 border">{edu.institute}</td>
                  <td className="px-4 py-2 border">{edu.from_date}</td>
                  <td className="px-4 py-2 border">{edu.to_date}</td>
                  <td className="px-4 py-2 border">{edu.result}</td>
                  <td className="px-4 py-2 border flex gap-2">
                    <button
                      onClick={() => setEditEducation(edu.id ?? 0)}
                      className="p-2"
                    >
                      <PencilSimple size={24} />
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(edu.id ?? 0)}
                      className="p-2"
                    >
                      <TrashSimple className="text-red-600" size={24} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="hover:bg-gray-50">
                <td
                  className="px-4 py-2 border text-center font-medium text-lg"
                  colSpan={6}
                >
                  No education records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => setIsCreatingEducation(true)}
        type="button"
        className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
      >
        +
      </button>

      <h2 className="text-2xl font-bold text-blue-700 mb-6 mt-12">
        Experience
      </h2>

      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Company Name</th>
              <th className="px-4 py-2 border">Position</th>
              <th className="px-4 py-2 border">From</th>
              <th className="px-4 py-2 border">To</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {experience.length > 0 ? (
              experience.map((exp, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{exp.company_name}</td>
                  <td className="px-4 py-2 border">{exp.designation}</td>
                  <td className="px-4 py-2 border">{exp.from_date}</td>
                  <td className="px-4 py-2 border">{exp.to_date}</td>
                  <td className="px-4 py-2 border">{exp.description}</td>
                  <td className="px-4 py-2 border flex gap-2">
                    <button
                      onClick={() => setEditExperience(exp.id ?? 0)}
                      className="p-2"
                    >
                      <PencilSimple size={24} />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(exp.id ?? 0)}
                      className="p-2"
                    >
                      <TrashSimple className="text-red-600" size={24} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="hover:bg-gray-50">
                <td
                  className="px-4 py-2 border text-center font-medium text-lg"
                  colSpan={6}
                >
                  No experience records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => setIsCreatingExperience(true)}
        type="button"
        className="mt-6 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
      >
        +
      </button>

      {isCreatingEducation && (
        <EducationModal
          onSubmit={handleCreateEducation}
          onClose={() => setIsCreatingEducation(false)}
        />
      )}
      {selectedEducationEdit && (
        <EducationModal
          initialData={selectedEducationEdit}
          onSubmit={handleUpdateEducation}
          onClose={() => setEditEducation(null)}
        />
      )}

      {isCreatingExperience && (
        <ExperienceModal
          onSubmit={handleCreateExperience}
          onClose={() => setIsCreatingExperience(false)}
        />
      )}
      {selectedExperienceEdit && (
        <ExperienceModal
          initialData={selectedExperienceEdit}
          onSubmit={handleUpdateExperience}
          onClose={() => setEditExperience(null)}
        />
      )}
    </div>
  );
}
