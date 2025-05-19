"use client";

import React, { useEffect, useRef, useState } from "react";
import { taskSchema } from "@/lib/types";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { z } from "zod";
import { getUserInfo } from "@/lib/auth/getUser";
import { useTasks } from "@/hooks/useTasks";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  ChevronDown, 
  AlertCircle, 
  Check,
  X,
  Plus,
  Search,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type Task = z.infer<typeof taskSchema>;

const initialTaskRecord = {
  task_title: "",
  task_description: "",
  start_date: "",
  end_date: "",
  status: false,
  department_id: 0,
  assignees: [],
  priority: "Medium",
  created_by: "",
};

interface TaskUpdateModalProps {
  initialData: Task;
  onSubmit: (data: Task) => void;
  onClose?: () => void;
}

export default function TaskCreateModal() {
  const [task, setTask] = useState<Task>(initialTaskRecord);
  const [errors, setErrors] = useState<Partial<Task>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [isValid, setIsValid] = useState(false);
  const { employees, fetchEmployees } = useEmployees();
  const { createTask } = useTasks();
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "valid_from" || name === "valid_till") {
      setTask((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "department_id") {
      setTask((prev) => ({
        ...prev,
        [name]: value === "" ? null : parseInt(value),
      }));
    } else {
      setTask((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const result = taskSchema.safeParse(task);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Task> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof Task;
        if (path) {
          newErrors[path as keyof Task] = err.message as unknown as undefined;
        }
      });
      setErrors(newErrors);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = taskSchema.safeParse(task);
    const user = await getUserInfo();

    if (!result.success) {
      const fieldErrors: Partial<Task> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof Task;
        if (path) {
          fieldErrors[path as keyof Task] = issue.message as unknown as undefined; 
        }
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    try {
      await createTask({
        ...result.data,
        assignees: taskAssignees,
        created_by: user.id,
      });
      alert("Task created!");
      setTaskAssignees([]);
      setTask(initialTaskRecord);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [fetchDepartments, fetchEmployees]);

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
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6">
      <motion.form 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit} 
        className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200"
      >
        <h2 className="text-xl font-bold text-blue-700 mb-6">Create New Task</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name
            </label>
            <input
              name="task_title"
              type="text"
              onChange={handleChange}
              value={task.task_title}
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
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
              className="w-full h-32 rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Building2 size={16} className="mr-2" />
                Department
              </label>
              <div className="relative">
                <select
                  name="department_id"
                  onChange={handleChange}
                  value={task.department_id ?? ""}
                  className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
                >
                  <option value={""}>Select Department</option>
                  {departments.length > 0 &&
                    departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                {errors.department_id && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.department_id}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock size={16} className="mr-2" />
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  onChange={(e) =>
                    setTask((prev) => ({
                      ...prev,
                      status: e.target.value === "Completed" ? true : false,
                    }))
                  }
                  value={task.status ? "Completed" : "Ongoing"}
                  className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
                >
                  <option value={""}>Select status</option>
                  {["Ongoing", "Completed"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex gap-4">
              {["High", "Medium", "Low"].map((priority) => (
                <label 
                  key={priority} 
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                    task.priority === priority 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={task.priority === priority}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full ${
                    priority === 'High' ? 'bg-red-500' : 
                    priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                  <span>{priority}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" />
                Start Date
              </label>
              <input
                onChange={handleChange}
                name="start_date"
                type="date"
                value={task.start_date}
                className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
              />
              {errors.start_date && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.start_date}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" />
                End Date
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
                className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
              />
              {errors.end_date && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users size={16} className="mr-2" />
              Assignees
            </label>

            <div className="relative" ref={taskDropdownRef}>
              <div className="flex items-center border border-gray-300 bg-gray-50 rounded-md focus-within:ring focus-within:ring-blue-200 transition-shadow">
                <Search size={16} className="ml-3 text-gray-400" />
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
                  className="w-full p-2 bg-transparent border-none focus:outline-none"
                />
              </div>

              {isTaskDropdownOpen && filteredTaskEmployees.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredTaskEmployees.map((emp) => (
                    <motion.li
                      key={emp.id}
                      onClick={() => handleAddTaskAssignee(emp.id)}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"
                      whileHover={{ x: 5 }}
                    >
                      <Plus size={14} className="text-blue-500" />
                      {emp.name}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              {taskAssignees.map((assignee) => {
                const emp = employees.find((e) => e.id === assignee);
                return (
                  <motion.span
                    key={assignee}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {emp?.name}
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      type="button"
                      className="ml-2 text-blue-700 hover:text-red-500 transition-colors"
                      onClick={() => handleRemoveTaskAssignee(assignee)}
                    >
                      <X size={14} />
                    </motion.button>
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="pt-4 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Create Task</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

export function TaskUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: TaskUpdateModalProps) {
  const [task, setTask] = useState<Task>(initialTaskRecord);
  const [errors, setErrors] = useState<Partial<Task>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [isValid, setIsValid] = useState(false);
  const { employees, fetchEmployees } = useEmployees();
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "valid_from" || name === "valid_till") {
      setTask((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "department_id") {
      setTask((prev) => ({
        ...prev,
        [name]: value === "" ? null : parseInt(value),
      }));
    } else {
      setTask((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const result = taskSchema.safeParse(task);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Task> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof Task;
        if (path) {
          newErrors[path as keyof Task] = err.message as unknown as undefined;
        }
      });
      setErrors(newErrors);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = taskSchema.safeParse(task);

    if (!result.success) {
      const fieldErrors: Partial<Task> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof Task;
        if (path) {
          fieldErrors[path as keyof Task] = issue.message as unknown as undefined;
        }
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit({ ...result.data, assignees: taskAssignees });
    setIsSubmitting(false);
    alert("Task updated!");
    setTaskAssignees([]);
    setTask(initialTaskRecord);
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [fetchDepartments, fetchEmployees]);

  useEffect(() => {
    if (initialData) {
      const { project_id, milestone_id, ...rest } = initialData;
      setTask(rest);
      if (rest.assignees) {
        setTaskAssignees(rest.assignees);
      } else {
        setTaskAssignees([]);
      }
    }
  }, [initialData]);

  useEffect(() => {
    console.log("Errors:", errors);
  }, [errors]);

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
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6">
      <motion.form 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit} 
        className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200"
      >
        <h2 className="text-xl font-bold text-blue-700 mb-6">Update Task</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name
            </label>
            <input
              name="task_title"
              type="text"
              onChange={handleChange}
              value={task.task_title}
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
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
              className="w-full h-32 rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Building2 size={16} className="mr-2" />
                Department
              </label>
              <div className="relative">
                <select
                  name="department_id"
                  onChange={handleChange}
                  value={task.department_id ?? ""}
                  className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
                >
                  <option value={""}>Select Department</option>
                  {departments.length > 0 &&
                    departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                {errors.department_id && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.department_id}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock size={16} className="mr-2" />
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  onChange={(e) =>
                    setTask((prev) => ({
                      ...prev,
                      status: e.target.value === "Completed" ? true : false,
                    }))
                  }
                  value={task.status ? "Completed" : "Ongoing"}
                  className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
                >
                  <option value={""}>Select status</option>
                  {["Ongoing", "Completed"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex gap-4">
              {["High", "Medium", "Low"].map((priority) => (
                <label 
                  key={priority} 
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                    task.priority === priority 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={task.priority === priority}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full ${
                    priority === 'High' ? 'bg-red-500' : 
                    priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                  <span>{priority}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" />
                Start Date
              </label>
              <input
                onChange={handleChange}
                name="start_date"
                type="date"
                value={task.start_date}
                className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
              />
              {errors.start_date && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.start_date}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" />
                End Date
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
                className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
              />
              {errors.end_date && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users size={16} className="mr-2" />
              Assignees
            </label>

            <div className="relative" ref={taskDropdownRef}>
              <div className="flex items-center border border-gray-300 bg-gray-50 rounded-md focus-within:ring focus-within:ring-blue-200 transition-shadow">
                <Search size={16} className="ml-3 text-gray-400" />
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
                  className="w-full p-2 bg-transparent border-none focus:outline-none"
                />
              </div>

              {isTaskDropdownOpen && filteredTaskEmployees.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredTaskEmployees.map((emp) => (
                    <motion.li
                      key={emp.id}
                      onClick={() => handleAddTaskAssignee(emp.id)}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"
                      whileHover={{ x: 5 }}
                    >
                      <Plus size={14} className="text-blue-500" />
                      {emp.name}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              {taskAssignees.map((assignee) => {
                const emp = employees.find((e) => e.id === assignee);
                return (
                  <motion.span
                    key={assignee}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {emp?.name}
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      type="button"
                      className="ml-2 text-blue-700 hover:text-red-500 transition-colors"
                      onClick={() => handleRemoveTaskAssignee(assignee)}
                    >
                      <X size={14} />
                    </motion.button>
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="pt-4 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Back</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Update Task</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
