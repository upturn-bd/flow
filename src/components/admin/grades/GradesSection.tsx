"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import GradeModal from "./GradeModal";
import { GraduationCap, Plus, Trash } from "@/lib/icons";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type GradesSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function GradesSection({ showNotification }: GradesSectionProps) {
  // Use context instead of individual hook
  const { 
    grades, 
    gradesLoading, 
    createGrade, 
    deleteGrade 
  } = useAdminData();
  const [isCreatingGrade, setIsCreatingGrade] = useState(false);
  const [gradeDeleteLoading, setGradeDeleteLoading] = useState<number | null>(null);

  const handleCreateGrade = async (values: any) => {
    try {
      await createGrade(values);
      setIsCreatingGrade(false);
      showNotification("Grade created successfully");
    } catch {
      showNotification("Error creating Grade", true);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    try {
      setGradeDeleteLoading(id);
      await deleteGrade(id.toString());
      showNotification("Grade deleted successfully");
    } catch {
      showNotification("Error deleting Grade", true);
    } finally {
      setGradeDeleteLoading(null);
    }
  };

  return (
    <section className="bg-surface-primary p-3 sm:p-6 rounded-lg border border-border-primary shadow-sm">
      <div className="border-b border-border-primary pb-3 sm:pb-4 mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground-primary flex items-center">
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-foreground-tertiary" />
          Grades
        </h3>
        <p className="text-xs sm:text-sm text-foreground-tertiary">Manage employee grades and levels</p>
      </div>

      {gradesLoading ? (
        <LoadingSpinner
          icon={GraduationCap}
          text="Loading grades..."
          height="h-32 sm:h-40"
          color="gray"
        />
      ) : (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {grades.length === 0 ? (
            <div className="p-4 sm:p-6 bg-background-secondary rounded-lg text-center text-foreground-tertiary w-full text-xs sm:text-sm">
              No grades added yet. Click the plus button to add one.
            </div>
          ) : (
            grades.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center bg-background-secondary border border-border-primary rounded-md px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm text-xs sm:text-sm"
              >
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-foreground-tertiary mr-1.5 sm:mr-2" />
                <span className="text-foreground-primary">{grade.name}</span>
                <button
                  className="ml-1.5 sm:ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                  onClick={() => handleDeleteGrade(grade.id ?? 0)}
                  disabled={gradeDeleteLoading === grade.id}
                >
                  <Trash size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
      
      <div className="flex justify-center sm:justify-start mt-4">
        <button
          onClick={() => setIsCreatingGrade(true)}
          className="flex items-center justify-center text-white bg-primary-700 dark:bg-primary-600 rounded-full w-7 h-7 sm:w-8 sm:h-8 shadow-sm hover:bg-primary-800 dark:hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} className="sm:size-18" />
        </button>
      </div>

      <AnimatePresence>
        {isCreatingGrade && (
          <GradeModal
            isOpen={isCreatingGrade}
            onSubmit={handleCreateGrade}
            onClose={() => setIsCreatingGrade(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
} 