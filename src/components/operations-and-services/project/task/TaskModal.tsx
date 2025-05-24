"use client";

import { Task } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { taskSchema } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  AlertCircle, 
  X, 
  Check,
  ChevronDown,
  AlertOctagon,
  User
} from "lucide-react";
import { toast } from "sonner";

interface TaskCreateModalProps {
  milestoneId: number;
  projectId: number;
  onSubmit: (values: Task) => void;
  onClose: () => void;
}

interface TaskUpdateModalProps {
  initialData: Task;
  onSubmit: (values: Task) => void;
  onClose: () => void;
}

const initialTask: Task = {
  task_title: "",
  task_description: "",
  start_date: "",
  end_date: "",
  priority: "Medium",
  project_id: undefined,
  assignees: [],
  status: false,
};

export default function TaskCreateModal({
  milestoneId,
  projectId,
  onSubmit,
  onClose,
}: TaskCreateModalProps) {
  const { employees, fetchEmployees } = useEmployees();
  const [task, setTask] = useState<Task>(initialTask);
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTaskValid, setIsTaskValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = taskSchema.safeParse(task);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0].toString();
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    const company_id = await getCompanyId();
    try {
      const formattedData = {
        ...result.data,
        company_id,
      };
      onSubmit(formattedData);
      toast.success("Task created successfully");
      setTask(initialTask);
      setTaskAssignees([]);
    } catch (error) {
      toast.error("Failed to create task");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setTask((prev: Task) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else {
      setTask((prev: Task) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const result = taskSchema.safeParse(task);
    if (result.success) {
      setIsTaskValid(true);
      setErrors({});
    } else {
      setIsTaskValid(false);
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0].toString();
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
    }
  }, [task]);

  useEffect(() => {
    setTask((prev: Task) => ({
      ...prev,
      assignees: taskAssignees,
    }));
  }, [taskAssignees]);

  useEffect(() => {
    setTask((prev: Task) => ({
      ...prev,
      project_id: projectId,
      milestone_id: milestoneId,
    }));
  }, [projectId, milestoneId]);

  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const taskDropdownRef = useRef<HTMLDivElement>(null);

  const filteredTaskEmployees = employees.filter(
    (emp) =>
      !taskAssignees.includes(emp.id) &&
      emp.name.toLowerCase().includes(taskSearchTerm.toLowerCase())
  );

  const handleAddTaskAssignee = (id: string) => {
    setTaskAssignees((prev) => [...prev, id]);
    setTaskSearchTerm("");
    setIsTaskDropdownOpen(false);
    taskInputRef.current?.focus();
  };

  const handleRemoveTaskAssignee = (id: string) => {
    setTaskAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        taskDropdownRef.current &&
        !taskDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTaskDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FileText size={20} className="mr-2 text-blue-600" />
          Add Task
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              name="task_title"
              type="text"
              onChange={handleChange}
              value={task.task_title}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            {errors.task_title && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.task_title}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="task_description"
              onChange={handleChange}
              value={task.task_description}
              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                Start Date
              </div>
            </label>
            <input
              onChange={handleChange}
              name="start_date"
              type="date"
              value={task.start_date}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            {errors.start_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.start_date}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                End Date
              </div>
            </label>
            <input
              name="end_date"
              type="date"
              onChange={handleChange}
              value={task.end_date}
              min={
                task.start_date
                  ? new Date(new Date(task.start_date).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            {errors.end_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.end_date}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                Assignees
              </div>
            </label>

            <div className="relative" ref={taskDropdownRef}>
              <input
                type="text"
                ref={taskInputRef}
                value={taskSearchTerm}
                onChange={(e) => {
                  setTaskSearchTerm(e.target.value);
                  setIsTaskDropdownOpen(true);
                }}
                onFocus={() => setIsTaskDropdownOpen(true)}
                placeholder="Search for employees..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 pr-10"
              />
              <User 
                size={16} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />

              <AnimatePresence>
                {isTaskDropdownOpen && filteredTaskEmployees.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredTaskEmployees.map((emp) => (
                      <motion.li
                        key={emp.id}
                        onClick={() => handleAddTaskAssignee(emp.id)}
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {emp.name}
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              <AnimatePresence>
                {taskAssignees.map((assignee) => {
                  const emp = employees.find((e) => e.id === assignee);
                  return (
                    <motion.span
                      key={assignee}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {emp?.name}
                      <button
                        type="button"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => handleRemoveTaskAssignee(assignee)}
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <AlertOctagon size={16} className="mr-2" />
                Priority
              </div>
            </label>
            <div className="relative">
              <select
                name="priority"
                onChange={handleChange}
                value={task.priority}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 appearance-none pr-10"
              >
                <option value={""}>Select priority</option>
                {["High", "Medium", "Low"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            {errors.priority && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.priority}
              </p>
            )}
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
              onClick={onClose}
            >
              <X size={16} className="mr-2" />
              Cancel
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isTaskValid || isSubmitting}
            >
              <Check size={16} className="mr-2" />
              {isSubmitting ? "Creating..." : "Create Task"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function TaskUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: TaskUpdateModalProps) {
  const { employees, fetchEmployees } = useEmployees();
  const [task, setTask] = useState<Task>(initialTask);
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTaskValid, setIsTaskValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = taskSchema.safeParse(task);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0].toString();
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    try {
      onSubmit(result.data);
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setTask((prev: Task) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else {
      setTask((prev: Task) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const result = taskSchema.safeParse(task);
    if (result.success) {
      setIsTaskValid(true);
      setErrors({});
    } else {
      setIsTaskValid(false);
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0].toString();
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
    }
  }, [task]);

  useEffect(() => {
    setTask(initialData);
    setTaskAssignees(initialData.assignees || []);
  }, [initialData]);

  useEffect(() => {
    setTask((prev: Task) => ({
      ...prev,
      assignees: taskAssignees,
    }));
  }, [taskAssignees]);

  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const taskDropdownRef = useRef<HTMLDivElement>(null);

  const filteredTaskEmployees = employees.filter(
    (emp) =>
      !taskAssignees.includes(emp.id) &&
      emp.name.toLowerCase().includes(taskSearchTerm.toLowerCase())
  );

  const handleAddTaskAssignee = (id: string) => {
    setTaskAssignees((prev) => [...prev, id]);
    setTaskSearchTerm("");
    setIsTaskDropdownOpen(false);
    taskInputRef.current?.focus();
  };

  const handleRemoveTaskAssignee = (id: string) => {
    setTaskAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        taskDropdownRef.current &&
        !taskDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTaskDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FileText size={20} className="mr-2 text-blue-600" />
          Update Task
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              name="task_title"
              type="text"
              onChange={handleChange}
              value={task.task_title}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            {errors.task_title && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.task_title}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="task_description"
              onChange={handleChange}
              value={task.task_description}
              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                Start Date
              </div>
            </label>
            <input
              onChange={handleChange}
              name="start_date"
              type="date"
              value={task.start_date}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            {errors.start_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.start_date}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                End Date
              </div>
            </label>
            <input
              name="end_date"
              type="date"
              onChange={handleChange}
              value={task.end_date}
              min={
                task.start_date
                  ? new Date(new Date(task.start_date).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            {errors.end_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.end_date}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                Assignees
              </div>
            </label>

            <div className="relative" ref={taskDropdownRef}>
              <input
                type="text"
                ref={taskInputRef}
                value={taskSearchTerm}
                onChange={(e) => {
                  setTaskSearchTerm(e.target.value);
                  setIsTaskDropdownOpen(true);
                }}
                onFocus={() => setIsTaskDropdownOpen(true)}
                placeholder="Search for employees..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 pr-10"
              />
              <User 
                size={16} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />

              <AnimatePresence>
                {isTaskDropdownOpen && filteredTaskEmployees.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredTaskEmployees.map((emp) => (
                      <motion.li
                        key={emp.id}
                        onClick={() => handleAddTaskAssignee(emp.id)}
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {emp.name}
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              <AnimatePresence>
                {taskAssignees.map((assignee) => {
                  const emp = employees.find((e) => e.id === assignee);
                  return (
                    <motion.span
                      key={assignee}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {emp?.name}
                      <button
                        type="button"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => handleRemoveTaskAssignee(assignee)}
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <AlertOctagon size={16} className="mr-2" />
                Priority
              </div>
            </label>
            <div className="relative">
              <select
                name="priority"
                onChange={handleChange}
                value={task.priority}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 appearance-none pr-10"
              >
                <option value={""}>Select priority</option>
                {["High", "Medium", "Low"].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            {errors.priority && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.priority}
              </p>
            )}
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
              onClick={onClose}
            >
              <X size={16} className="mr-2" />
              Cancel
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isTaskValid || isSubmitting}
            >
              <Check size={16} className="mr-2" />
              {isSubmitting ? "Updating..." : "Update Task"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
