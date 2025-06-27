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
import { FilePdf, MapPin } from "@phosphor-icons/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useProfile } from "@/hooks/useProfile";

interface EducationExperienceTabProps {
  uid?: string | null;
}

export default function EducationExperienceTab({ uid }: EducationExperienceTabProps) {
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
  const [isEducationActionLoading, setIsEducationActionLoading] = useState(false);

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
  const [isExperienceActionLoading, setIsExperienceActionLoading] = useState(false);

  const {
    educations: userEducations,
    experiences: userExperiences,
    loading,
    fetchUserEducation,
    fetchUserExperience,
    isCurrentUser
  } = useProfile();

  useEffect(() => {
    const loadData = async () => {
      if (uid) {
        // Fetch specific user's data
        await fetchUserEducation(uid);
        await fetchUserExperience(uid);
      } else {
        // Fetch current user's data using the hooks
        fetchEducation();
        fetchExperience();
      }
    };
    
    loadData();
  }, [uid, fetchEducation, fetchExperience, fetchUserEducation, fetchUserExperience]);

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
        if (editEducation) {
          await updateEducation(editEducation, values);
          fetchEducation();
          showNotification('Education updated successfully', 'success');
          setEditEducation(null);
        }
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
        if (editExperience) {
          await updateExperience(editExperience, values);
          fetchExperience();
          showNotification('Experience updated successfully', 'success');
          setEditExperience(null);
        }
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

  // Determine which data set to use
  const educationToShow = uid ? userEducations : education;
  const experienceToShow = uid ? userExperiences : experience;
  const isDataLoading = uid ? loading : (educationLoading || experienceLoading);

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
          {isCurrentUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingEducation(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
              disabled={isEducationActionLoading}
            >
              <Plus className="h-4 w-4" /> Add Education
            </motion.button>
          )}
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {isDataLoading ? (
            <LoadingSpinner 
              color="emerald"
              height="h-40"
              horizontal={true}
              text="Loading education records..."
            />
          ) : educationToShow.length === 0 ? (
            <div className="px-6 py-12 text-center border-t">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">No Education Records</h3>
              <p className="text-gray-500">
                {isCurrentUser 
                  ? "Add your academic qualifications to showcase your educational background."
                  : "No education records found for this user."}
              </p>
              {isCurrentUser && (
                <button 
                  className="mt-4 inline-flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700"
                  onClick={() => setIsCreatingEducation(true)}
                >
                  <Plus className="h-4 w-4" /> Add Education
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {educationToShow.map((edu) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={edu.id}
                  className="p-6 hover:bg-gray-50 flex flex-col md:flex-row md:items-start gap-4"
                >
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900 mb-1">{edu.institute}</h3>
                    <p className="text-gray-800">{edu.type}</p>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(edu.from_date).toLocaleDateString()} - {edu.to_date ? new Date(edu.to_date).toLocaleDateString() : 'Present'}</span>
                    </div>
                    {edu.result && (
                      <p className="mt-2 text-gray-600 text-sm">{edu.result}</p>
                    )}
                    {edu.attachments && edu.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {edu.attachments.map((attachment, index) => (
                          <a 
                            key={index}
                            href={attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            {getFileIcon(extractFilenameFromUrl(attachment))}
                            <span className="ml-1 truncate max-w-[150px]">{extractFilenameFromUrl(attachment)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {isCurrentUser && (
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <button
                        onClick={() => setEditEducation(edu.id ?? null)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEducation(edu.id ?? 0)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        disabled={isEducationActionLoading}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Experience Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-blue-600" />
            Work Experience
          </h2>
          {isCurrentUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingExperience(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
              disabled={isExperienceActionLoading}
            >
              <Plus className="h-4 w-4" /> Add Experience
            </motion.button>
          )}
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {isDataLoading ? (
            <LoadingSpinner 
              color="blue"
              height="h-40"
              horizontal={true}
              text="Loading work experience records..."
            />
          ) : experienceToShow.length === 0 ? (
            <div className="px-6 py-12 text-center border-t">
              <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">No Work Experience</h3>
              <p className="text-gray-500">
                {isCurrentUser
                  ? "Add your professional experience to showcase your career journey."
                  : "No work experience records found for this user."}
              </p>
              {isCurrentUser && (
                <button 
                  className="mt-4 inline-flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700"
                  onClick={() => setIsCreatingExperience(true)}
                >
                  <Plus className="h-4 w-4" /> Add Experience
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {experienceToShow.map((exp) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={exp.id}
                  className="p-6 hover:bg-gray-50 flex flex-col md:flex-row md:items-start gap-4"
                >
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900 mb-1">{exp.company_name}</h3>
                    <p className="text-gray-800">{exp.designation}</p>
                    <div className="flex flex-wrap items-center gap-x-4 text-gray-500 text-sm mt-1">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(exp.from_date).toLocaleDateString()} - {exp.to_date ? new Date(exp.to_date).toLocaleDateString() : 'Present'}</span>
                      </div>
                      {/* {exp.location && (
                        <div className="flex items-center mt-1 md:mt-0">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{exp.location}</span>
                        </div>
                      )} */}
                    </div>
                    {exp.description && (
                      <p className="mt-2 text-gray-600 text-sm">{exp.description}</p>
                    )}
                  </div>
                  {isCurrentUser && (
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <button
                        onClick={() => setEditExperience(exp.id ?? null)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id ?? 0)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        disabled={isExperienceActionLoading}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {/* Education Modal */}
        {(isCreatingEducation || editEducation !== null) && (
          <EducationModal
            isOpen={isCreatingEducation || editEducation !== null}
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
            isOpen={isCreatingExperience || editExperience !== null}
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
