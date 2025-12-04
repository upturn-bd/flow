"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
} from "@/lib/icons";
import { Education } from "@/hooks/useProfile";
import { Experience } from "@/lib/types";
import { extractFilenameFromUrl } from "@/lib/utils";
import { FilePdf } from "@/lib/icons";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useProfile } from "@/hooks/useProfile";
import { showNotification } from "@/lib/utils/notifications";

interface EducationExperienceTabProps {
  uid?: string | null;
}

export default function EducationExperienceTab({ uid }: EducationExperienceTabProps) {
  const {
    educations,
    experiences,
    loading,
    fetchUserEducation,
    fetchUserExperience,
    fetchCurrentUserEducation,
    fetchCurrentUserExperience,
    createEducation,
    updateEducation,
    deleteEducation,
    createExperience,
    updateExperience,
    deleteExperience,
    isCurrentUser
  } = useProfile();

  // Local state for UI management
  const [editEducation, setEditEducation] = useState<number | null>(null);
  const [isCreatingEducation, setIsCreatingEducation] = useState(false);
  const [isEducationActionLoading, setIsEducationActionLoading] = useState(false);
  const [editExperience, setEditExperience] = useState<number | null>(null);
  const [isCreatingExperience, setIsCreatingExperience] = useState(false);
  const [isExperienceActionLoading, setIsExperienceActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (uid) {
        try {
          await fetchUserEducation(uid);
          await fetchUserExperience(uid);
        } catch (e) {
          console.error("Error fetching user data:", e);
        }
      } else {
        // Fetch current user's data
        try {
          await fetchCurrentUserEducation();
          await fetchCurrentUserExperience();
        } catch (e) {
          console.error("Error fetching current user data:", e);
        }
      }
    };
    
    loadData();
  }, [uid, fetchUserEducation, fetchUserExperience, fetchCurrentUserEducation, fetchCurrentUserExperience]);

  // Utility for async actions with loading and error handling
  const handleAsyncAction = useCallback(async (
    action: () => Promise<any>,
    setLoading: (v: boolean) => void,
    successMessage: string,
    errorMessage: string,
    onSuccess?: () => void
  ) => {
    setLoading(true);
    try {
      await action();
      showNotification({ message: successMessage, type: 'success' });
      onSuccess?.();
    } catch (error) {
      showNotification({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateEducation = useCallback((values: Omit<Education, "id">) =>
    handleAsyncAction(
      async () => {
        await createEducation(values);
        // Refresh data based on context
        if (uid) {
          await fetchUserEducation(uid);
        } else {
          await fetchCurrentUserEducation();
        }
        setIsCreatingEducation(false);
      },
      setIsEducationActionLoading,
      'Education created successfully',
      'Error creating education'
    ), [createEducation, uid, fetchUserEducation, fetchCurrentUserEducation, handleAsyncAction]);

  const handleUpdateEducation = useCallback((values: Education) =>
    handleAsyncAction(
      async () => {
        if (editEducation) {
          await updateEducation(editEducation, values);
          // Refresh data based on context
          if (uid) {
            await fetchUserEducation(uid);
          } else {
            await fetchCurrentUserEducation();
          }
          setEditEducation(null);
        }
      },
      setIsEducationActionLoading,
      'Education updated successfully',
      'Error updating education'
    ), [editEducation, updateEducation, uid, fetchUserEducation, fetchCurrentUserEducation, handleAsyncAction]);

  const handleDeleteEducation = useCallback((id: number) => {
    if (!window.confirm("Are you sure you want to delete this education record?")) return;
    
    handleAsyncAction(
      async () => {
        await deleteEducation(id);
        // Refresh data based on context
        if (uid) {
          await fetchUserEducation(uid);
        } else {
          await fetchCurrentUserEducation();
        }
      },
      setIsEducationActionLoading,
      'Education deleted successfully',
      'Error deleting education'
    );
  }, [deleteEducation, uid, fetchUserEducation, fetchCurrentUserEducation, handleAsyncAction]);

  const handleCreateExperience = useCallback((values: Omit<Experience, "id">) =>
    handleAsyncAction(
      async () => {
        await createExperience(values);
        // Refresh data based on context
        if (uid) {
          await fetchUserExperience(uid);
        } else {
          await fetchCurrentUserExperience();
        }
        setIsCreatingExperience(false);
      },
      setIsExperienceActionLoading,
      'Experience created successfully',
      'Error creating experience'
    ), [createExperience, uid, fetchUserExperience, fetchCurrentUserExperience, handleAsyncAction]);

  const handleUpdateExperience = useCallback((values: Experience) =>
    handleAsyncAction(
      async () => {
        if (editExperience) {
          await updateExperience(editExperience, values);
          // Refresh data based on context
          if (uid) {
            await fetchUserExperience(uid);
          } else {
            await fetchCurrentUserExperience();
          }
          setEditExperience(null);
        }
      },
      setIsExperienceActionLoading,
      'Experience updated successfully',
      'Error updating experience'
    ), [editExperience, updateExperience, uid, fetchUserExperience, fetchCurrentUserExperience, handleAsyncAction]);

  const handleDeleteExperience = useCallback((id: number) => {
    if (!window.confirm("Are you sure you want to delete this experience record?")) return;
    
    handleAsyncAction(
      async () => {
        await deleteExperience(id);
        // Refresh data based on context
        if (uid) {
          await fetchUserExperience(uid);
        } else {
          await fetchCurrentUserExperience();
        }
      },
      setIsExperienceActionLoading,
      'Experience deleted successfully',
      'Error deleting experience'
    );
  }, [deleteExperience, uid, fetchUserExperience, fetchCurrentUserExperience, handleAsyncAction]);

  const selectedEducationEdit = useMemo(
    () => educations.find((d: Education) => d.id === editEducation) ?? null,
    [educations, editEducation]
  );
  const selectedExperienceEdit = useMemo(
    () => experiences.find((d: Experience) => d.id === editExperience) ?? null,
    [experiences, editExperience]
  );

  // Use the same data source for both viewing and editing since we're using the consolidated hook
  const educationToShow = educations;
  const experienceToShow = experiences;
  const isDataLoading = loading;

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(extension)) {
      return <FilePdf className="text-red-600 h-5 w-5" />;
    }
    return <FileText className="text-primary-600 h-5 w-5" />;
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
        type: "spring" as const,
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
          <h2 className="text-xl font-bold text-foreground-primary flex items-center">
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
        
        <div className="bg-background-primary rounded-lg border border-border-primary overflow-hidden shadow-sm">
          {isDataLoading ? (
            <LoadingSpinner 
              color="emerald"
              height="h-40"
              horizontal={true}
              text="Loading education records..."
            />
          ) : educationToShow.length === 0 ? (
            <div className="px-6 py-12 text-center border-t">
              <BookOpen className="h-12 w-12 mx-auto text-foreground-tertiary mb-4" />
              <h3 className="text-lg font-medium text-foreground-primary mb-1">No Education Records</h3>
              <p className="text-foreground-tertiary">
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
            <div className="divide-y divide-border-primary">
              {educationToShow.map((edu) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={edu.id}
                  className="p-6 hover:bg-background-secondary flex flex-col md:flex-row md:items-start gap-4"
                >
                  <div className="grow">
                    <h3 className="font-semibold text-foreground-primary mb-1">{edu.institute}</h3>
                    <p className="text-foreground-primary">{edu.type}</p>
                    <div className="flex items-center text-foreground-tertiary text-sm mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(edu.from_date).toLocaleDateString()} - {edu.to_date ? new Date(edu.to_date).toLocaleDateString() : 'Present'}</span>
                    </div>
                    {edu.result && (
                      <p className="mt-2 text-foreground-secondary text-sm">{edu.result}</p>
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
          <h2 className="text-xl font-bold text-foreground-primary flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-primary-600" />
            Work Experience
          </h2>
          {isCurrentUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingExperience(true)}
              className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
              disabled={isExperienceActionLoading}
            >
              <Plus className="h-4 w-4" /> Add Experience
            </motion.button>
          )}
        </div>
        
        <div className="bg-background-primary rounded-lg border border-border-primary overflow-hidden shadow-sm">
          {isDataLoading ? (
            <LoadingSpinner 
              color="blue"
              height="h-40"
              horizontal={true}
              text="Loading work experience records..."
            />
          ) : experienceToShow.length === 0 ? (
            <div className="px-6 py-12 text-center border-t">
              <Building className="h-12 w-12 mx-auto text-foreground-tertiary mb-4" />
              <h3 className="text-lg font-medium text-foreground-primary mb-1">No Work Experience</h3>
              <p className="text-foreground-tertiary">
                {isCurrentUser
                  ? "Add your professional experience to showcase your career journey."
                  : "No work experience records found for this user."}
              </p>
              {isCurrentUser && (
                <button 
                  className="mt-4 inline-flex items-center gap-1 text-primary-600 font-medium hover:text-blue-700"
                  onClick={() => setIsCreatingExperience(true)}
                >
                  <Plus className="h-4 w-4" /> Add Experience
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border-primary">
              {experienceToShow.map((exp) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={exp.id}
                  className="p-6 hover:bg-background-secondary flex flex-col md:flex-row md:items-start gap-4"
                >
                  <div className="grow">
                    <h3 className="font-semibold text-foreground-primary mb-1">{exp.company_name}</h3>
                    <p className="text-foreground-primary">{exp.designation}</p>
                    <div className="flex flex-wrap items-center gap-x-4 text-foreground-tertiary text-sm mt-1">
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
                      <p className="mt-2 text-foreground-secondary text-sm">{exp.description}</p>
                    )}
                  </div>
                  {isCurrentUser && (
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <button
                        onClick={() => setEditExperience(exp.id ?? null)}
                        className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-full transition-colors"
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
