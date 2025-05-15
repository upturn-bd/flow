"use client";

import { Milestone } from "@/hooks/useMilestones";
import { useEmployees } from "@/hooks/useEmployees";
import { milestoneSchema } from "@/lib/types";
import { useEffect, useState } from "react";
import { getCompanyId } from "@/lib/auth/getUser";

interface MilestoneCreateModalProps {
  currentTotalWeightage: number;
  projectId: number;
  onSubmit: (values: Milestone) => void;
  onClose: () => void;
}

interface MilestoneUpdateModalProps {
  currentTotalWeightage: number;
  initialData: Milestone;
  onSubmit: (values: Milestone) => void;
  onClose: () => void;
}

const initialMilestone: Milestone = {
  milestone_title: "",
  description: "",
  start_date: "",
  end_date: "",
  weightage: 0,
  status: "",
  project_id: 1,
  assignees: [],
};

export default function MilestoneCreateModal({
  currentTotalWeightage,
  projectId,
  onSubmit,
  onClose,
}: MilestoneCreateModalProps) {
  const { employees, fetchEmployees } = useEmployees();
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Milestone>>({});
  const [isMilestoneValid, setIsMilestoneValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = milestoneSchema.safeParse(milestone);

    if (!result.success) {
      const fieldErrors: Partial<Milestone> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Milestone] = issue.message;
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
    setMilestone(initialMilestone);
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "weightage") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setMilestone((prev: Milestone) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const result = milestoneSchema.safeParse(milestone);
    if (result.success) {
      setIsMilestoneValid(true);
      setErrors({});
    } else {
      setIsMilestoneValid(false);
      const newErrors: Partial<Milestone> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [milestone]);

  useEffect(() => {
    setMilestone((prev: Milestone) => ({
      ...prev,
      assignees: milestoneAssignees,
    }));
  }, [milestoneAssignees]);

  useEffect(() => {
    setMilestone((prev: Milestone) => ({
      ...prev,
      project_id: projectId,
    }));
  }, [projectId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Add Milestone</h2>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Milestone Title
          </label>
          <input
            name="milestone_title"
            type="text"
            onChange={handleChange}
            value={milestone.milestone_title}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.milestone_title && (
            <p className="text-red-500 text-sm">{errors.milestone_title}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="description"
            onChange={handleChange}
            value={milestone.description}
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
            value={milestone.start_date}
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
            value={milestone.end_date}
            min={
              milestone.start_date
                ? new Date(new Date(milestone.start_date).getTime() + 86400000)
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
                setMilestoneAssignees((prev) => [...prev, e.target.value])
              }
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select assignee</option>
              {employees.length > 0 &&
                employees
                  .filter((emp) => !milestoneAssignees.includes(emp.id))
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
            {milestoneAssignees.map((assignee) => (
              <span
                key={assignee}
                className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm"
              >
                {employees.find((e) => e.id === assignee)?.name}
                <button
                  type="button"
                  className="ml-2 text-red-500"
                  onClick={() =>
                    setMilestoneAssignees((prev) =>
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
            Status
          </label>
          <div className="relative">
            <select
              name="status"
              onChange={handleChange}
              value={milestone.status}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select status</option>
              {["Ongoing", "Completed", "Archived"].map((status) => (
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
            Weightage
          </label>
          <input
            name="weightage"
            type="number"
            onChange={handleChange}
            value={milestone.weightage}
            max={100 - currentTotalWeightage}
            min={1}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.weightage && (
            <p className="text-red-500 text-sm">{errors.weightage}</p>
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
            disabled={!isMilestoneValid || isSubmitting}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function MilestoneUpdateModal({
  currentTotalWeightage,
  initialData,
  onSubmit,
  onClose,
}: MilestoneUpdateModalProps) {
  const { employees, fetchEmployees } = useEmployees();
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Milestone>>({});
  const [isMilestoneValid, setIsMilestoneValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = milestoneSchema.safeParse(milestone);

    if (!result.success) {
      const fieldErrors: Partial<Milestone> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Milestone] = issue.message;
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
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "weightage") {
      setMilestone((prev: Milestone) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setMilestone((prev: Milestone) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const result = milestoneSchema.safeParse(milestone);
    if (result.success) {
      setIsMilestoneValid(true);
      setErrors({});
    } else {
      setIsMilestoneValid(false);
      const newErrors: Partial<Milestone> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [milestone]);

  useEffect(() => {
    console.log("Errors: ", errors);
  }, [errors]);
  useEffect(() => {
    setMilestone(initialData);
    setMilestoneAssignees(initialData.assignees || []);
  }, [initialData]);

  useEffect(() => {
    setMilestone((prev: Milestone) => ({
      ...prev,
      assignees: milestoneAssignees,
    }));
  }, [milestoneAssignees]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Add Milestone</h2>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Milestone Title
          </label>
          <input
            name="milestone_title"
            type="text"
            onChange={handleChange}
            value={milestone.milestone_title}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.milestone_title && (
            <p className="text-red-500 text-sm">{errors.milestone_title}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="description"
            onChange={handleChange}
            value={milestone.description}
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
            value={milestone.start_date}
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
            value={milestone.end_date}
            min={
              milestone.start_date
                ? new Date(new Date(milestone.start_date).getTime() + 86400000)
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
                setMilestoneAssignees((prev) => [...prev, e.target.value])
              }
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select assignee</option>
              {employees.length > 0 &&
                employees
                  .filter((emp) => !milestoneAssignees.includes(emp.id))
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
            {milestoneAssignees.map((assignee) => (
              <span
                key={assignee}
                className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm"
              >
                {employees.find((e) => e.id === assignee)?.name}
                <button
                  type="button"
                  className="ml-2 text-red-500"
                  onClick={() =>
                    setMilestoneAssignees((prev) =>
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
            Status
          </label>
          <div className="relative">
            <select
              name="status"
              onChange={handleChange}
              value={milestone.status}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select status</option>
              {["Ongoing", "Completed", "Archived"].map((status) => (
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
            Weightage
          </label>
          <input
            name="weightage"
            type="number"
            onChange={handleChange}
            value={milestone.weightage}
            max={100 - currentTotalWeightage + initialData.weightage}
            min={1}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.weightage && (
            <p className="text-red-500 text-sm">{errors.weightage}</p>
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
            disabled={!isMilestoneValid || isSubmitting}
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}
