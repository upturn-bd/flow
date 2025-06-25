"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  Target,
  Users,
} from "lucide-react";
import { type Milestone as MilestoneType } from "./MilestoneForm";

interface MilestoneListProps {
  milestones: MilestoneType[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  employees: { id: string; name: string }[];
}

export default function MilestoneList({
  milestones,
  onEdit,
  onDelete,
  onAdd,
  employees,
}: MilestoneListProps) {
  const totalWeightage = milestones.reduce((sum, m) => sum + m.weightage, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target size={20} className="mr-2 text-gray-600" strokeWidth={2} />
          Milestones
        </h2>
        {totalWeightage < 100 && (
          <motion.button
            type="button"
            onClick={onAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white bg-gray-800 hover:bg-gray-900 rounded-full w-8 h-8 grid place-items-center shadow-sm transition-colors duration-150"
          >
            <Plus size={16} strokeWidth={2.5} />
          </motion.button>
        )}
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {milestones.length > 0 &&
            milestones.map((m) => (
              <motion.div
                key={m.milestone_title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-white rounded-lg p-5 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="font-semibold text-lg text-gray-900">
                  {m.milestone_title}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{m.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} strokeWidth={2} />
                    <span>{m.start_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ArrowRight size={14} strokeWidth={2} />
                    <span>{m.end_date}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-700 font-medium">
                  <span>Weightage: {m.weightage}%</span>
                </div>
                {m.assignees && m.assignees.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} strokeWidth={2} />
                    <div className="flex flex-wrap gap-1">
                      {m.assignees.map((assigneeId: string) => {
                        const employee = employees.find(e => e.id === assigneeId);
                        return employee ? (
                          <span 
                            key={assigneeId}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {employee.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(m.project_id!)}
                    className="text-gray-600 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-150"
                  >
                    <Pencil size={15} strokeWidth={2} />
                  </motion.button>
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(m.project_id!)}
                    className="text-gray-600 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors duration-150"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      
      {milestones.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg p-10 text-center flex flex-col items-center"
        >
          <Target size={40} className="text-gray-300 mb-3" strokeWidth={1.5} />
          <p className="text-gray-500 mb-4">No milestones added yet</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onAdd}
            className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm flex items-center shadow-sm hover:bg-gray-900 transition-colors duration-150"
          >
            <Plus size={16} className="mr-2" strokeWidth={2.5} />
            Add Milestone
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
} 