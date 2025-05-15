"use client";

import { Task } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { taskSchema } from "@/lib/types";
import { useEffect, useState } from "react";
import { getCompanyId } from "@/lib/auth/getUser";

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
  project_id: 1,
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
  const [errors, setErrors] = useState<Partial<Task>>({});
  const [isTaskValid, setIsTaskValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const company_id = await getCompanyId();
    const formattedData = {
      ...result.data,
      company_id,
    };
    onSubmit(formattedData);
    setTask(initialTask);
    setTaskAssignees([]);
    setIsSubmitting(false);
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
      const newErrors: Partial<Task> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
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

  useEffect(() => {
    console.log("Task:",task)
  }, [task]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Add task</h2>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Task Title
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
              <option value={""}>Select assignee</option>
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
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isTaskValid || isSubmitting}
          >
            Save
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
  const { employees, fetchEmployees } = useEmployees();
  const [task, setTask] = useState<Task>(initialTask);
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Task>>({});
  const [isTaskValid, setIsTaskValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
    onSubmit(result.data);
    setIsSubmitting(false);
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
      const newErrors: Partial<Task> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [task]);

  useEffect(() => {
    console.log("Errors: ", errors);
  }, [errors]);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Add task</h2>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Task Title
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
              <option value={""}>Select assignee</option>
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
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isTaskValid || isSubmitting}
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}
