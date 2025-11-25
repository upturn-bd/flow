"use client";

import { Department } from "@/hooks/useDepartments";
import { Grade } from "@/hooks/useGrades";
import { Position } from "@/hooks/usePositions";
import { PencilSimple, TrashSimple } from "@/lib/icons";
import { BriefcaseBusiness, Building, GraduationCap, FileText, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

interface PositionDetailsModalProps {
  position: Position;
  onClose: () => void;
  editPosition: () => void;
  deletePosition: () => void;
  departments: Department[];
  grades: Grade[];
}

export default function PositionDetailsModal({
  position,
  onClose,
  editPosition,
  deletePosition,
  departments,
  grades,
}: PositionDetailsModalProps) {
  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  const department = departments?.find((dep) => dep.id === position.department_id);
  const grade = grades?.find((g) => g.id === position.grade);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Position Details</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <X className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-6 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <BriefcaseBusiness className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-600 font-medium">Position Name</div>
              <div className="font-medium text-gray-800">{position?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <Building className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-600 font-medium">Department</div>
              <div className="font-medium text-gray-800">
                {department ? department.name : "No department assigned"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <GraduationCap className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-600 font-medium">Grade</div>
              <div className="font-medium text-gray-800">{grade ? grade.name : "No grade assigned"}</div>
            </div>
          </div>

          {position?.description && (
            <div className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <FileText className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 font-medium">Description</div>
                <div className="text-gray-800">{position.description}</div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeIn} className="flex justify-end pt-6 gap-2">
          <Button
            variant="outline"
            onClick={editPosition}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <PencilSimple size={18} weight="bold" />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={deletePosition}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300"
          >
            <TrashSimple size={18} weight="bold" />
            Delete
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
