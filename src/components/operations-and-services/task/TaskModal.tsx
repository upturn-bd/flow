"use client";

import React, { useEffect, useState } from "react";
import { taskSchema } from "@/lib/types";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { z } from "zod";
import { getUserInfo } from "@/lib/auth/getUser";
import { useTasks } from "@/hooks/useTasks";

type Task = z.infer<typeof taskSchema>;

const initialTaskRecord = {
  id: 0,
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
        newErrors[err.path[0]] = err.message;
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
        fieldErrors[issue.path[0] as keyof Task] = issue.message;
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

  return (
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Task Name
          </label>
          <input
            name="task_title"
            type="text"
            onChange={handleChange}
            value={task.task_title}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.task_title && (
            <p className="text-red-500 text-sm">{errors.task_title}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="task_description"
            onChange={handleChange}
            value={task.task_description}
            className="w-full h-32 bg-blue-100 rounded p-3"
          />
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Department
          </label>
          <div className="relative">
            <select
              name="department_id"
              onChange={handleChange}
              value={task.department_id ?? ""}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select Department</option>
              {departments.length > 0 &&
                departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
            {errors.department_id && (
              <p className="text-red-500 text-sm">{errors.department_id}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
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
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select status</option>
              {["Ongoing", "Completed"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.status && (
            <p className="text-red-500 text-sm">{errors.status}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Priority
          </label>
          <div className="relative">
            <select
              name="priority"
              onChange={handleChange}
              value={task.priority}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select priority</option>
              {["High", "Medium", "Low"].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.priority && (
            <p className="text-red-500 text-sm">{errors.priority}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Start Date
          </label>
          <input
            onChange={handleChange}
            name="start_date"
            type="date"
            value={task.start_date}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.start_date && (
            <p className="text-red-500 text-sm">{errors.start_date}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
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
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.end_date && (
            <p className="text-red-500 text-sm">{errors.end_date}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Assignees
          </label>
          <div className="relative">
            <select
              onChange={(e) =>
                setTaskAssignees((prev) => [...prev, e.target.value])
              }
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select assignees</option>
              {employees.length > 0 &&
                employees
                  .filter((emp) => !taskAssignees.includes(emp.id))
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
            </select>

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {taskAssignees.map((assignee) => (
              <span
                key={assignee}
                className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm"
              >
                {employees.find((e) => e.id === assignee)?.name}
                <button
                  type="button"
                  className="ml-2 text-red-500"
                  onClick={() =>
                    setTaskAssignees((prev) =>
                      prev.filter((a) => a !== assignee)
                    )
                  }
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={
              "bg-[#192D46] text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
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
        newErrors[err.path[0]] = err.message;
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
        fieldErrors[issue.path[0] as keyof Task] = issue.message;
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
      setTaskAssignees(rest.assignees);
    }
  }, [initialData]);

  useEffect(() => {
    console.log("Errors:", errors);
  }, [errors]);

  return (
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Task Name
          </label>
          <input
            name="task_title"
            type="text"
            onChange={handleChange}
            value={task.task_title}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.task_title && (
            <p className="text-red-500 text-sm">{errors.task_title}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="task_description"
            onChange={handleChange}
            value={task.task_description}
            className="w-full h-32 bg-blue-100 rounded p-3"
          />
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Department
          </label>
          <div className="relative">
            <select
              name="department_id"
              onChange={handleChange}
              value={task.department_id ?? ""}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select Department</option>
              {departments.length > 0 &&
                departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
            {errors.department_id && (
              <p className="text-red-500 text-sm">{errors.department_id}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Priority
          </label>
          <div className="relative">
            <select
              name="priority"
              onChange={handleChange}
              value={task.priority}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select priority</option>
              {["High", "Medium", "Low"].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.priority && (
            <p className="text-red-500 text-sm">{errors.priority}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
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
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select status</option>
              {["Ongoing", "Completed"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.status && (
            <p className="text-red-500 text-sm">{errors.status}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Start Date
          </label>
          <input
            onChange={handleChange}
            name="start_date"
            type="date"
            value={task.start_date}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.start_date && (
            <p className="text-red-500 text-sm">{errors.start_date}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
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
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.end_date && (
            <p className="text-red-500 text-sm">{errors.end_date}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Assignees
          </label>
          <div className="relative">
            <select
              onChange={(e) =>
                setTaskAssignees((prev) => [...prev, e.target.value])
              }
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select assignees</option>
              {employees.length > 0 &&
                employees
                  .filter((emp) => !taskAssignees.includes(emp.id))
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
            </select>

            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {taskAssignees.map((assignee) => (
              <span
                key={assignee}
                className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm"
              >
                {employees.find((e) => e.id === assignee)?.name}
                <button
                  type="button"
                  className="ml-2 text-red-500"
                  onClick={() =>
                    setTaskAssignees((prev) =>
                      prev.filter((a) => a !== assignee)
                    )
                  }
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={
              "bg-[#192D46] text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
