"use client";

import { useEffect, useState, useMemo } from "react";
import { useEducation } from "@/hooks/useEducation";
import { useExperience } from "@/hooks/useExperience";
import EducationModal from "@/components/education-and-experience/EducationModal";
import ExperienceModal from "@/components/education-and-experience/ExperienceModal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Briefcase, 
  Plus, 
  Pencil, 
  Trash, 
  FileText, 
  BookOpen,
  Building,
  Calendar 
} from "lucide-react";
import { Education } from "@/hooks/useEducation";
import { Experience } from "@/hooks/useExperience";
import { extractFilenameFromUrl } from "@/lib/utils";
import { FilePdf } from "@phosphor-icons/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
        showNotification('Education created successfully', 'success');
        setIsCreatingEducation(false);
      },
      setIsEducationActionLoading,
      undefined,
      () => showNotification('Error creating education', 'error')
    );

  const handleUpdateEducation = (values: Education) =>
    handleAsyncAction(
      async () => {
        await updateEducation(values);
        fetchEducation();
        showNotification('Education updated successfully', 'success');
        setEditEducation(null);
      },
      setIsEducationActionLoading,
      undefined,
      () => showNotification('Error updating education', 'error')
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
        showNotification('Education deleted successfully', 'success');
      },
      setIsEducationActionLoading,
      undefined,
      () => showNotification('Error deleting education', 'error')
    );
  };

  const handleCreateExperience = (values: Omit<Experience, "id">) =>
    handleAsyncAction(
      async () => {
        await createExperience(values);
        fetchExperience();
        showNotification('Experience created successfully', 'success');
        setIsCreatingExperience(false);
      },
      setIsExperienceActionLoading,
      undefined,
      () => showNotification('Error creating experience', 'error')
    );

  const handleUpdateExperience = (values: Experience) =>
    handleAsyncAction(
      async () => {
        await updateExperience(values);
        fetchExperience();
        showNotification('Experience updated successfully', 'success');
        setEditExperience(null);
      },
      setIsExperienceActionLoading,
      undefined,
      () => showNotification('Error updating experience', 'error')
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
        showNotification('Experience deleted successfully', 'success');
      },
      setIsExperienceActionLoading,
      undefined,
      () => showNotification('Error deleting experience', 'error')
    );
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up ${
      type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
  };

  const selectedEducationEdit = useMemo(
    () => education.find((d) => d.id === editEducation) ?? null,
    [education, editEducation]
  );
  const selectedExperienceEdit = useMemo(
    () => experience.find((d) => d.id === editExperience) ?? null,
    [experience, editExperience]
  );

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(extension)) {
      return <FilePdf className="text-red-600 h-5 w-5" />;
    }
    return <FileText className="text-blue-600 h-5 w-5" />;
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20 
      } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={contentVariants}
      className="space-y-8"
    >
      {/* Education Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <GraduationCap className="mr-2 h-6 w-6 text-emerald-600" />
            Education
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreatingEducation(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
            disabled={isEducationActionLoading}
          >
            <Plus className="h-4 w-4" /> Add Education
          </motion.button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {educationLoading ? (
            <LoadingSpinner 
              color="emerald"
              height="h-40"
              horizontal={true}
              text="Loading education records..."
              icon={GraduationCap}
            />
          ) : (
            <div className="overflow-x-auto">
              {education.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degree</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachments</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {education.map((edu) => (
                        <motion.tr 
                          key={edu.id ?? edu.name} 
                          className="hover:bg-gray-50"
                          variants={itemVariants}
                          exit={{ opacity: 0, height: 0 }}
                          layout
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{edu.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{edu.institute}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{edu.from_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{edu.to_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{edu.result}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col gap-2">
                              {edu.attachments && edu.attachments.length > 0 ? (
                                edu.attachments.map((attachment) => (
                                  <motion.div
                                    key={attachment}
                                    whileHover={{ scale: 1.03 }}
                                    onClick={() => {
                                      window.open(attachment, "_blank");
                                    }}
                                    className="flex items-center gap-2 p-1.5 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                  >
                                    {getFileIcon(extractFilenameFromUrl(attachment))}
                                    <span className="truncate max-w-[150px]">
                                      {extractFilenameFromUrl(attachment)}
                                    </span>
                                  </motion.div>
                                ))
                              ) : (
                                <span className="text-gray-500 text-sm">No attachments</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                                onClick={() => setEditEducation(edu.id ?? 0)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                aria-label="Edit education"
                                disabled={isEducationActionLoading}
                              >
                                <Pencil className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                onClick={() => handleDeleteEducation(edu.id ?? 0)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                aria-label="Delete education"
                                disabled={isEducationActionLoading}
                              >
                                <Trash className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center p-12 text-gray-500 flex flex-col items-center"
                >
                  <GraduationCap className="h-12 w-12 text-emerald-200 mb-3" />
                  <p className="mb-4">No education records found.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreatingEducation(true)}
                    className="px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Education Record
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Experience Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-blue-600" />
            Experience
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreatingExperience(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
            disabled={isExperienceActionLoading}
          >
            <Plus className="h-4 w-4" /> Add Experience
          </motion.button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {experienceLoading ? (
            <LoadingSpinner 
              color="blue"
              height="h-40"
              horizontal={true}
              text="Loading experience records..."
              icon={Briefcase}
            />
          ) : (
            <div className="overflow-x-auto">
              {experience.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {experience.map((exp) => (
                        <motion.tr 
                          key={exp.id ?? exp.company_name} 
                          className="hover:bg-gray-50"
                          variants={itemVariants}
                          exit={{ opacity: 0, height: 0 }}
                          layout
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">{exp.company_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{exp.designation}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{exp.from_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{exp.to_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                            <div className="line-clamp-2">{exp.description}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                                onClick={() => setEditExperience(exp.id ?? 0)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                aria-label="Edit experience"
                                disabled={isExperienceActionLoading}
                              >
                                <Pencil className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                onClick={() => handleDeleteExperience(exp.id ?? 0)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                aria-label="Delete experience"
                                disabled={isExperienceActionLoading}
                              >
                                <Trash className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center p-12 text-gray-500 flex flex-col items-center"
                >
                  <Building className="h-12 w-12 text-blue-200 mb-3" />
                  <p className="mb-4">No experience records found.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreatingExperience(true)}
                    className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Experience Record
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {/* Education Modal */}
        {(isCreatingEducation || editEducation !== null) && (
          <EducationModal
            initialData={selectedEducationEdit}
            onSubmit={selectedEducationEdit ? handleUpdateEducation : handleCreateEducation}
            onClose={() => {
              setIsCreatingEducation(false);
              setEditEducation(null);
            }}
          />
        )}

        {/* Experience Modal */}
        {(isCreatingExperience || editExperience !== null) && (
          <ExperienceModal
            initialData={selectedExperienceEdit}
            onSubmit={selectedExperienceEdit ? handleUpdateExperience : handleCreateExperience}
            onClose={() => {
              setIsCreatingExperience(false);
              setEditExperience(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
