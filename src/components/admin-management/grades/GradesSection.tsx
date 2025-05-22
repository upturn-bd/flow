"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGrades } from "@/hooks/useGrades";
import GradeModal from "./GradeModal";
import { GraduationCap, Plus } from "lucide-react";
import { fadeInUp } from "@/components/ui/animations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TrashSimple } from "@phosphor-icons/react";

type GradesSectionProps = {
  showNotification: (message: string, isError?: boolean) => void;
};

export default function GradesSection({ showNotification }: GradesSectionProps) {
  const { grades, loading: gradesLoading, fetchGrades, createGrade, deleteGrade } = useGrades();
  const [isCreatingGrade, setIsCreatingGrade] = useState(false);
  const [gradeDeleteLoading, setGradeDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const handleCreateGrade = async (values: any) => {
    try {
      await createGrade(values);
      setIsCreatingGrade(false);
      fetchGrades();
      showNotification("Grade created successfully");
    } catch {
      showNotification("Error creating Grade", true);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    try {
      setGradeDeleteLoading(id);
      await deleteGrade(id);
      showNotification("Grade deleted successfully");
      fetchGrades();
    } catch {
      showNotification("Error deleting Grade", true);
    } finally {
      setGradeDeleteLoading(null);
    }
  };

  return (
    <motion.section 
      variants={fadeInUp}
      className="bg-white p-3 sm:p-6 rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="border-b border-gray-200 pb-3 sm:pb-4 mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-gray-600" />
          Grades
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">Manage employee grades and levels</p>
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
            <div className="p-4 sm:p-6 bg-gray-50 rounded-lg text-center text-gray-500 w-full text-xs sm:text-sm">
              No grades added yet. Click the plus button to add one.
            </div>
          ) : (
            grades.map((grade) => (
              <motion.div
                key={grade.id}
                className="flex items-center bg-gray-100 border border-gray-200 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
              >
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 mr-1.5 sm:mr-2" />
                <span className="text-gray-800">{grade.name}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="ml-1.5 sm:ml-2 text-red-600 hover:text-red-800 transition-colors"
                  onClick={() => handleDeleteGrade(grade.id)}
                  disabled={gradeDeleteLoading === grade.id}
                >
                  <TrashSimple size={12} className={`${gradeDeleteLoading === grade.id ? 'animate-spin' : ''}`} />
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
      )}
      
      <div className="flex justify-center sm:justify-start mt-4">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreatingGrade(true)}
          className="flex items-center justify-center text-white bg-gray-800 rounded-full w-7 h-7 sm:w-8 sm:h-8 shadow-sm hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} className="sm:size-18" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isCreatingGrade && (
          <GradeModal
            onSubmit={handleCreateGrade}
            onClose={() => setIsCreatingGrade(false)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
} 