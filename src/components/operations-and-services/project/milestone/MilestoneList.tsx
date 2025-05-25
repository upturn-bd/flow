"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  Milestone,
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
      transition={{ delay: 0.9 }}
      className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center">
          <Milestone size={18} className="mr-2 text-blue-600" />
          Milestones
        </h2>
        {totalWeightage < 100 && (
          <motion.button
            type="button"
            onClick={onAdd}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-white bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 grid place-items-center"
          >
            <Plus size={16} />
          </motion.button>
        )}
      </div>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {milestones.length > 0 &&
            milestones.map((m) => (
              <motion.div
                key={m.milestone_title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-lg p-4 space-y-2 border border-blue-100 shadow-sm"
              >
                <div className="font-bold text-lg text-blue-900">
                  {m.milestone_title}
                </div>
                <p className="text-sm text-gray-700">{m.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar size={14} />
                    <span>{m.start_date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <ArrowRight size={14} />
                    <span>{m.end_date}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-blue-800 font-medium">
                  <span>Weightage: {m.weightage}%</span>
                </div>
                {m.assignees && m.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.assignees.map(assigneeId => {
                      const employee = employees.find(e => e.id === assigneeId);
                      return employee ? (
                        <span 
                          key={assigneeId}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                        >
                          {employee.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(m.project_id)}
                    className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"
                  >
                    <Pencil size={16} />
                  </motion.button>
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(m.project_id)}
                    className="text-gray-600 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                  >
                    <Trash2 size={16} />
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
          <Milestone size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">No milestones added yet</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onAdd}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Milestone
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
} 