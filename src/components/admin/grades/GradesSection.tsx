"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAdminData } from "@/contexts/AdminDataContext";
import GradeModal from "./GradeModal";
import { GraduationCap, Trash } from "@/lib/icons";
import { Section } from "@/components/ui";

type GradesSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function GradesSection({ showNotification }: GradesSectionProps) {
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
    <>
      <Section
        title="Grades"
        description="Manage employee grades and levels"
        icon={<GraduationCap size={20} weight="duotone" />}
        loading={gradesLoading}
        loadingIcon={GraduationCap}
        loadingText="Loading grades..."
        emptyState={{
          show: grades.length === 0,
          icon: <GraduationCap size={32} weight="duotone" />,
          message: "No grades added yet. Click the plus button to add one.",
          action: {
            label: "Add Grade",
            onClick: () => setIsCreatingGrade(true),
          },
        }}
        addButton={{
          onClick: () => setIsCreatingGrade(true),
          label: "Add Grade",
        }}
      >
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {grades.map((grade) => (
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
          ))}
        </div>
      </Section>

      <AnimatePresence>
        {isCreatingGrade && (
          <GradeModal
            isOpen={isCreatingGrade}
            onSubmit={handleCreateGrade}
            onClose={() => setIsCreatingGrade(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 