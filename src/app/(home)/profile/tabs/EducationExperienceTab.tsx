"use client";

import { useEffect, useState, useMemo } from "react";
import { useEducation } from "@/hooks/useEducation";
import { useExperience } from "@/hooks/useExperience";
import EducationModal from "@/components/education-and-experience/EducationModal";
import ExperienceModal from "@/components/education-and-experience/ExperienceModal";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";
import { Education } from "@/hooks/useEducation";
import { Experience } from "@/hooks/useExperience";
import { FaFilePdf } from "react-icons/fa";
import { extractFilenameFromUrl } from "@/lib/utils";

export default function EducationExperienceTab() {
  const {
    education,
    loading: educationLoading,
    fetchEducation,
    createEducation,
    updateEducation,
    deleteEducation,
  } = useEducation();
  const [editEducation, setEditEducation] = useState<number | null>(null);
  const [isCreatingEducation, setIsCreatingEducation] = useState(false);
  const [isEducationActionLoading, setIsEducationActionLoading] =
    useState(false);

  const {
    experience,
    loading: experienceLoading,
    fetchExperience,
    createExperience,
    updateExperience,
    deleteExperience,
  } = useExperience();
  const [editExperience, setEditExperience] = useState<number | null>(null);
  const [isCreatingExperience, setIsCreatingExperience] = useState(false);
  const [isExperienceActionLoading, setIsExperienceActionLoading] =
    useState(false);

  useEffect(() => {
    fetchEducation();
    fetchExperience();
    // eslint-disable-next-line
  }, []);

  // Utility for async actions with loading and error handling
  const handleAsyncAction = async (
    action: () => Promise<any>,
    setLoading: (v: boolean) => void,
    onSuccess?: () => void,
    onError?: () => void
  ) => {
    setLoading(true);
    try {
      await action();
      onSuccess && onSuccess();
    } catch {
      onError && onError();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEducation = (values: Omit<Education, "id">) =>
    handleAsyncAction(
      async () => {
        await createEducation(values);
        fetchEducation();
        alert("Education created!");
        setIsCreatingEducation(false);
      },
      setIsEducationActionLoading,
      undefined,
      () => alert("Error creating education.")
    );

  const handleUpdateEducation = (values: Education) =>
    handleAsyncAction(
      async () => {
        await updateEducation(values);
        fetchEducation();
        alert("Education updated!");
        setEditEducation(null);
      },
      setIsEducationActionLoading,
      undefined,
      () => alert("Error updating education.")
    );

  const handleDeleteEducation = (id: number) => {
    if (
      !window.confirm("Are you sure you want to delete this education record?")
    )
      return;
    handleAsyncAction(
      async () => {
        await deleteEducation(id);
        fetchEducation();
        alert("Education deleted!");
      },
      setIsEducationActionLoading,
      undefined,
      () => alert("Error deleting education.")
    );
  };

  const handleCreateExperience = (values: Omit<Experience, "id">) =>
    handleAsyncAction(
      async () => {
        await createExperience(values);
        fetchExperience();
        alert("Experience created!");
        setIsCreatingExperience(false);
      },
      setIsExperienceActionLoading,
      undefined,
      () => alert("Error creating experience.")
    );

  const handleUpdateExperience = (values: Experience) =>
    handleAsyncAction(
      async () => {
        await updateExperience(values);
        fetchExperience();
        alert("Experience updated!");
        setEditExperience(null);
      },
      setIsExperienceActionLoading,
      undefined,
      () => alert("Error updating experience.")
    );

  const handleDeleteExperience = (id: number) => {
    if (
      !window.confirm("Are you sure you want to delete this experience record?")
    )
      return;
    handleAsyncAction(
      async () => {
        await deleteExperience(id);
        fetchExperience();
        alert("Experience deleted!");
      },
      setIsExperienceActionLoading,
      undefined,
      () => alert("Error deleting experience.")
    );
  };

  const selectedEducationEdit = useMemo(
    () => education.find((d) => d.id === editEducation) ?? null,
    [education, editEducation]
  );
  const selectedExperienceEdit = useMemo(
    () => experience.find((d) => d.id === editExperience) ?? null,
    [experience, editExperience]
  );

  return (
    <>
      <h2 className="text-2xl font-bold text-blue-700">Education</h2>
      <div className="overflow-x-auto border rounded-md mb-6">
        {educationLoading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Degree</th>
                <th className="px-4 py-2 border">Institution</th>
                <th className="px-4 py-2 border">From</th>
                <th className="px-4 py-2 border">To</th>
                <th className="px-4 py-2 border">CGPA</th>
                <th className="px-4 py-2 border">Attachments</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {education.length > 0 ? (
                education.map((edu) => (
                  <tr key={edu.id ?? edu.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{edu.name}</td>
                    <td className="px-4 py-2 border">{edu.institute}</td>
                    <td className="px-4 py-2 border">{edu.from_date}</td>
                    <td className="px-4 py-2 border">{edu.to_date}</td>
                    <td className="px-4 py-2 border">{edu.result}</td>
                    <td className="px-4 py-2 border space-y-2">
                      {edu.attachments?.length > 0 ? (
                        edu.attachments.map((attachment) => (
                          <div
                            key={attachment}
                            onClick={() => {
                              window.open(attachment, "_blank");
                            }}
                            className="flex items-center bg-white border border-gray-300 rounded-md px-4 py-2 gap-3 max-w-full cursor-pointer hover:bg-gray-50 transition duration-200"
                          >
                            <FaFilePdf className="text-red-600 text-xl" />
                            <div className="text-sm">
                              <p className="truncate whitespace-nowrap overflow-hidden max-w-[200px]">
                                {extractFilenameFromUrl(attachment)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No attachments</p>
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => setEditEducation(edu.id ?? 0)}
                        className="p-2"
                        aria-label="Edit education"
                        disabled={isEducationActionLoading}
                      >
                        <PencilSimple size={24} />
                      </button>
                      <button
                        onClick={() => handleDeleteEducation(edu.id ?? 0)}
                        className="p-2"
                        aria-label="Delete education"
                        disabled={isEducationActionLoading}
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
        )}
      </div>
      <button
        onClick={() => setIsCreatingEducation(true)}
        type="button"
        className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        aria-label="Add education"
        disabled={isEducationActionLoading}
      >
        +
      </button>
      <h2 className="text-2xl font-bold text-blue-700 mb-6 mt-12">
        Experience
      </h2>
      <div className="overflow-x-auto border rounded-md">
        {experienceLoading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
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
                experience.map((exp) => (
                  <tr
                    key={exp.id ?? exp.company_name}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 border">{exp.company_name}</td>
                    <td className="px-4 py-2 border">{exp.designation}</td>
                    <td className="px-4 py-2 border">{exp.from_date}</td>
                    <td className="px-4 py-2 border">{exp.to_date}</td>
                    <td className="px-4 py-2 border">{exp.description}</td>
                    <td className="px-4 py-2 border flex gap-2">
                      <button
                        onClick={() => setEditExperience(exp.id ?? 0)}
                        className="p-2"
                        aria-label="Edit experience"
                        disabled={isExperienceActionLoading}
                      >
                        <PencilSimple size={24} />
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id ?? 0)}
                        className="p-2"
                        aria-label="Delete experience"
                        disabled={isExperienceActionLoading}
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
        )}
      </div>
      <button
        onClick={() => setIsCreatingExperience(true)}
        type="button"
        className="mt-6 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        aria-label="Add experience"
        disabled={isExperienceActionLoading}
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
    </>
  );
}
