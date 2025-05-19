"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { updateProject } from "@/lib/api/operations-and-services/project";
import { getCompanyId } from "@/lib/api/company-info/employees"
import { createClient } from "@/lib/supabase/client";
import { milestoneSchema, projectSchema } from "@/lib/types";
import { PencilSimple, TrashSimple, Info } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { set, z } from "zod";

type ProjectDetails = z.infer<typeof projectSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
interface Employee {
  id: string;
  name: string;
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

const initialProjectDetails: ProjectDetails = {
  project_title: "",
  start_date: "",
  description: "",
  goal: "",
  end_date: "",
  project_lead_id: "",
  department_id: 0,
  status: "Ongoing",
  assignees: [],
};

export default function CreateNewProjectPage() {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(
    initialProjectDetails
  );
  const [projectAssignees, setProjectAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<ProjectDetails>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [milestone, setMilestone] = useState<Milestone>(initialMilestone);
  const [milestoneAssignees, setMilestoneAssignees] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<Milestone[] | []>([]);
  const [milestoneErrors, setMilestoneErrors] = useState<Partial<Milestone>>(
    {}
  );
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    null
  );
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [isMilestoneValid, setIsMilestoneValid] = useState(false);

  async function updateProject(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    const company_id = await getCompanyId();
    setIsSubmitting(true);
    try {
      const validated = projectSchema.safeParse(projectDetails);
      if (!validated.success) throw validated.error;
      const { data, error } = await client
        .from("project_records")
        .insert({
          ...projectDetails,
          company_id,
          assignees: projectAssignees,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (milestones.length > 0) {
        const formatMilestones = milestones.map((m) => ({
          ...m,
          project_id: data.id,
          assignees: m.assignees || [],
          company_id,
        }));

        const { error: milestoneError } = await client
          .from("milestone_records")
          .insert(formatMilestones);

        if (milestoneError) console.error(milestoneError);
      }
      setProjectDetails(initialProjectDetails);
      setProjectAssignees([]);
      setMilestones([]);
      setMilestone(initialMilestone);
      setMilestoneAssignees([]);
      alert("Project created successfully!");
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors({ ...errors, project_title: "Error creating project" });
      alert("Error creating project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "department_id") {
      setProjectDetails((prev) => ({ ...prev, [name]: Number(value) }));
    } else if (name === "start_date" || name === "end_date") {
      setProjectDetails((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else {
      setProjectDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMilestoneChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "start_date" || name === "end_date") {
      setMilestone((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "weightage") {
      setMilestone((prev) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setMilestone((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    setMilestones((prev) => [
      ...prev,
      {
        ...milestone,
        assignees: milestoneAssignees,
      },
    ]);
    setMilestone({ ...initialMilestone, project_id: milestones.length + 1 });
    setIsCreatingMilestone(false);
  };

  const handleDeleteMilestone = (id: number) => {
    setMilestones((prev) => prev.filter((m) => m.project_id !== id));
  };

  const handleDisplayUpdateMilestoneModal = (id: number) => {
    const milestoneToUpdate = milestones.find((m) => m.project_id === id);
    if (milestoneToUpdate) {
      setMilestone(milestoneToUpdate);
      setSelectedMilestone(milestoneToUpdate.project_id);
      setMilestoneAssignees(milestoneToUpdate.assignees || []);
    }
  };

  const handleUpdateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMilestones = milestones.map((m) => {
      if (m.project_id === selectedMilestone) {
        return {
          ...milestone,
          assignees: milestoneAssignees,
        };
      }
      return m;
    });
    setMilestones(updatedMilestones);
    setSelectedMilestone(null);
    setMilestone({ ...initialMilestone, project_id: milestones.length + 1 });
    setMilestoneAssignees([]);
  };

  const closeCreateModal = () => {
    setIsCreatingMilestone(false);
    setMilestone({ ...initialMilestone, project_id: milestones.length + 1 });
    setMilestoneAssignees([]);
  };

  const closeUpdateModal = () => {
    setSelectedMilestone(null);
    setMilestone({ ...initialMilestone, project_id: milestones.length + 1 });
    setMilestoneAssignees([]);
  };

  useEffect(() => {
    const result = projectSchema.safeParse(projectDetails);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ProjectDetails> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof ProjectDetails] = err.message as any;
      });
      setErrors(newErrors);
    }
  }, [projectDetails]);

  useEffect(() => {
    const result = milestoneSchema.safeParse(milestone);
    if (result.success) {
      setIsMilestoneValid(true);
      setMilestoneErrors({});
    } else {
      setIsMilestoneValid(false);
      const newErrors: Partial<Milestone> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof Milestone] = err.message as any;
      });
      setMilestoneErrors(newErrors);
    }
  }, [milestone]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data || []);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching asset owners:", error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const result = projectSchema.safeParse(projectDetails);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ProjectDetails> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof ProjectDetails] = err.message as any;
      });
      setErrors(newErrors);
    }
  }, [projectDetails]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !projectAssignees.includes(emp.id) &&
      emp.id !== projectDetails.project_lead_id
  );

  const handleAddAssignee = (id: string) => {
    setProjectAssignees((prev) => [...prev, id]);
    setSearchTerm("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveAssignee = (id: string) => {
    setProjectAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [milestoneSearchTerm, setMilestoneSearchTerm] = useState("");
  const [isMilestoneDropdownOpen, setIsMilestoneDropdownOpen] = useState(false);
  const milestoneInputRef = useRef<HTMLInputElement>(null);
  const milestoneDropdownRef = useRef<HTMLDivElement>(null);

  const filteredMilestoneEmployees = employees.filter(
    (emp) =>
      !milestoneAssignees.includes(emp.id) &&
      emp.name.toLowerCase().includes(milestoneSearchTerm.toLowerCase())
  );

  const handleAddMilestoneAssignee = (id: string) => {
    setMilestoneAssignees((prev) => [...prev, id]);
    setMilestoneSearchTerm("");
    setIsMilestoneDropdownOpen(false);
    milestoneInputRef.current?.focus();
  };

  const handleRemoveMilestoneAssignee = (id: string) => {
    setMilestoneAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        milestoneDropdownRef.current &&
        !milestoneDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMilestoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6">
      <form onSubmit={updateProject} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Project Name
          </label>
          <input
            name="project_title"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.project_title}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.project_title && (
            <p className="text-red-500 text-sm">{errors.project_title}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="description"
            onChange={handleInputChange}
            value={projectDetails.description}
            className="w-full h-32 bg-blue-100 rounded p-3"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-lg font-bold text-blue-700">
            Goal <Info size={16} className="text-gray-500" />
          </label>
          <input
            name="goal"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.goal}
            className="w-full bg-blue-100 rounded p-3"
          />
        </div>

        <div>
          <label className="block text-lg font-bold text-blue-700">
            Department
          </label>
          <div className="relative">
            <select
              name="department_id"
              onChange={handleInputChange}
              value={projectDetails.department_id}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={0}>Select Department</option>
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
            Project Lead
          </label>
          <div className="relative">
            <select
              name="project_lead_id"
              onChange={handleInputChange}
              value={projectDetails.project_lead_id}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select Project Lead</option>
              {employees.length > 0 &&
                employees.map((employee) => (
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
            {errors.project_lead_id && (
              <p className="text-red-500 text-sm">{errors.project_lead_id}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Start Date
          </label>
          <input
            onChange={handleInputChange}
            name="start_date"
            type="date"
            value={projectDetails.start_date}
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
            onChange={handleInputChange}
            value={projectDetails.end_date}
            min={
              projectDetails.start_date
                ? new Date(
                    new Date(projectDetails.start_date).getTime() + 86400000
                  )
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
          <label className="block text-lg font-bold text-blue-700 mb-1">
            Assignees
          </label>

          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Select assignees"
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>

            {dropdownOpen && filteredEmployees.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <li
                    key={emp.id}
                    onClick={() => handleAddAssignee(emp.id)}
                    className="cursor-pointer px-4 py-2 hover:bg-blue-100 text-sm"
                  >
                    {emp.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2 mt-2 flex-wrap">
            {projectAssignees.map((assignee) => {
              const emp = employees.find((e) => e.id === assignee);
              return (
                <span
                  key={assignee}
                  className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm text-sm flex items-center"
                >
                  {emp?.name}
                  <button
                    type="button"
                    className="ml-2 text-red-500"
                    onClick={() => handleRemoveAssignee(assignee)}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-8">
            <h2 className="text-xl font-bold text-blue-900">Milestones</h2>
            {milestones.reduce((acc, m) => acc + m.weightage, 0) < 100 && (
              <button
                type="button"
                onClick={() => setIsCreatingMilestone(true)}
                className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
              >
                +
              </button>
            )}
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.length > 0 &&
              milestones.map((m) => (
                <div
                  key={m.project_id}
                  className="bg-blue-100 rounded p-4 space-y-1"
                >
                  <div className="font-bold text-lg text-blue-900">
                    Milestone {m.project_id}
                  </div>
                  <p className="text-sm text-gray-700">{m.milestone_title}</p>
                  <p className="text-sm font-semibold text-black">
                    Start Date: {m.start_date}
                  </p>
                  <p className="text-sm font-semibold text-black">
                    End Date: {m.end_date}
                  </p>
                  <p className="text-sm font-semibold text-black">
                    Weightage: {m.weightage}
                  </p>
                  <div className="flex justify-end gap-2">
                    <PencilSimple
                      size={16}
                      onClick={() =>
                        handleDisplayUpdateMilestoneModal(m.project_id)
                      }
                      className="text-gray-600 cursor-pointer"
                    />
                    <TrashSimple
                      onClick={() => handleDeleteMilestone(m.project_id)}
                      size={16}
                      className="text-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
          </div>
          {milestones.length === 0 && (
            <div className="rounded p-4 text-center text-lg text-gray-500">
              No milestones added yet.
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-blue-900 text-white py-2 px-6 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </form>

      {isCreatingMilestone && (
        // Modal for creating a new milestone
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
          <form
            onSubmit={handleAddMilestone}
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
                onChange={handleMilestoneChange}
                value={milestone.milestone_title}
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.milestone_title && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.milestone_title}
                </p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Description
              </label>
              <textarea
                name="description"
                onChange={handleMilestoneChange}
                value={milestone.description}
                className="w-full h-32 bg-blue-100 rounded p-3"
              />
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Start Date
              </label>
              <input
                onChange={handleMilestoneChange}
                name="start_date"
                type="date"
                value={milestone.start_date}
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.start_date && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.start_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                End Date
              </label>
              <input
                name="end_date"
                type="date"
                onChange={handleMilestoneChange}
                value={milestone.end_date}
                min={
                  milestone.start_date
                    ? new Date(
                        new Date(milestone.start_date).getTime() + 86400000
                      )
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.end_date && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.end_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700 mb-1">
                Assignees
              </label>

              <div className="relative" ref={milestoneDropdownRef}>
                <input
                  type="text"
                  ref={milestoneInputRef}
                  value={milestoneSearchTerm}
                  onChange={(e) => {
                    setMilestoneSearchTerm(e.target.value);
                    setIsMilestoneDropdownOpen(true);
                  }}
                  onFocus={() => setIsMilestoneDropdownOpen(true)}
                  placeholder="Select assignee"
                  className="w-full bg-blue-100 rounded p-3 appearance-none"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="fill-yellow-400" width="10" height="10">
                    <polygon points="0,0 10,0 5,6" />
                  </svg>
                </div>

                {isMilestoneDropdownOpen &&
                  filteredMilestoneEmployees.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
                      {filteredMilestoneEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          onClick={() => handleAddMilestoneAssignee(emp.id)}
                          className="cursor-pointer px-4 py-2 hover:bg-blue-100 text-sm"
                        >
                          {emp.name}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {milestoneAssignees.map((assignee) => {
                  const emp = employees.find((e) => e.id === assignee);
                  return (
                    <span
                      key={assignee}
                      className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm text-sm flex items-center"
                    >
                      {emp?.name}
                      <button
                        type="button"
                        className="ml-2 text-red-500"
                        onClick={() => handleRemoveMilestoneAssignee(assignee)}
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  onChange={handleMilestoneChange}
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
              {milestoneErrors.status && (
                <p className="text-red-500 text-sm">{milestoneErrors.status}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Weightage
              </label>
              <input
                name="weightage"
                type="number"
                onChange={handleMilestoneChange}
                value={milestone.weightage}
                max={100 - milestones.reduce((acc, m) => acc + m.weightage, 0)}
                min={1}
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.weightage && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.weightage}
                </p>
              )}
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={closeCreateModal}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isMilestoneValid}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedMilestone && (
        // Modal for updating an existing milestone
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
          <form
            onSubmit={handleUpdateMilestone}
            className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold">Update Milestone</h2>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Milestone Title
              </label>
              <input
                name="milestone_title"
                type="text"
                onChange={handleMilestoneChange}
                value={milestone.milestone_title}
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.milestone_title && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.milestone_title}
                </p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Description
              </label>
              <textarea
                name="description"
                onChange={handleMilestoneChange}
                value={milestone.description}
                className="w-full h-32 bg-blue-100 rounded p-3"
              />
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Start Date
              </label>
              <input
                onChange={handleMilestoneChange}
                name="start_date"
                type="date"
                value={milestone.start_date}
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.start_date && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.start_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                End Date
              </label>
              <input
                name="end_date"
                type="date"
                onChange={handleMilestoneChange}
                value={milestone.end_date}
                min={
                  milestone.start_date
                    ? new Date(
                        new Date(milestone.start_date).getTime() + 86400000
                      )
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.end_date && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.end_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700 mb-1">
                Assignees
              </label>

              <div className="relative" ref={milestoneDropdownRef}>
                <input
                  type="text"
                  ref={milestoneInputRef}
                  value={milestoneSearchTerm}
                  onChange={(e) => {
                    setMilestoneSearchTerm(e.target.value);
                    setIsMilestoneDropdownOpen(true);
                  }}
                  onFocus={() => setIsMilestoneDropdownOpen(true)}
                  placeholder="Select assignee"
                  className="w-full bg-blue-100 rounded p-3 appearance-none"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="fill-yellow-400" width="10" height="10">
                    <polygon points="0,0 10,0 5,6" />
                  </svg>
                </div>

                {isMilestoneDropdownOpen &&
                  filteredMilestoneEmployees.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
                      {filteredMilestoneEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          onClick={() => handleAddMilestoneAssignee(emp.id)}
                          className="cursor-pointer px-4 py-2 hover:bg-blue-100 text-sm"
                        >
                          {emp.name}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {milestoneAssignees.map((assignee) => {
                  const emp = employees.find((e) => e.id === assignee);
                  return (
                    <span
                      key={assignee}
                      className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm text-sm flex items-center"
                    >
                      {emp?.name}
                      <button
                        type="button"
                        className="ml-2 text-red-500"
                        onClick={() => handleRemoveMilestoneAssignee(assignee)}
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  onChange={handleMilestoneChange}
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
              {milestoneErrors.status && (
                <p className="text-red-500 text-sm">{milestoneErrors.status}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Weightage
              </label>
              <input
                name="weightage"
                type="number"
                onChange={handleMilestoneChange}
                value={milestone.weightage}
                max={
                  milestones.length > 1
                    ? 100 - milestones.reduce((acc, m) => acc + m.weightage, 0)
                    : 100
                }
                min={1}
                className="w-full bg-blue-100 rounded p-3"
              />
              {milestoneErrors.weightage && (
                <p className="text-red-500 text-sm">
                  {milestoneErrors.weightage}
                </p>
              )}
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={closeUpdateModal}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isMilestoneValid}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface UpdateProjectPageProps {
  initialData: ProjectDetails;
  onSubmit: (projectDetails: ProjectDetails) => void;
  onClose: () => void;
}

export function UpdateProjectPage({
  initialData,
  onSubmit,
  onClose,
}: UpdateProjectPageProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(
    initialProjectDetails
  );
  const [projectAssignees, setProjectAssignees] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<ProjectDetails>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [employees, setEmployees] = useState<Employee[]>([]);

  async function updateProject(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validated = projectSchema.safeParse(projectDetails);
      if (!validated.success) throw validated.error;
      onSubmit({
        ...projectDetails,
        assignees: projectAssignees,
      });
      setProjectDetails(initialProjectDetails);
      setProjectAssignees([]);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "department_id") {
      setProjectDetails((prev) => ({ ...prev, [name]: Number(value) }));
    } else if (name === "start_date" || name === "end_date") {
      setProjectDetails((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else {
      setProjectDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const result = projectSchema.safeParse(projectDetails);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ProjectDetails> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof ProjectDetails] = err.message as any;
      });
      setErrors(newErrors);
    }
  }, [projectDetails]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data || []);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching asset owners:", error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const result = projectSchema.safeParse(projectDetails);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ProjectDetails> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof ProjectDetails] = err.message as any;
      });
      setErrors(newErrors);
    }
  }, [projectDetails]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (initialData) {
      setProjectDetails(initialData);
      setProjectAssignees(initialData.assignees || []);
    }
  }, [initialData]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !projectAssignees.includes(emp.id) &&
      emp.id !== projectDetails.project_lead_id
  );

  const handleAddAssignee = (id: string) => {
    setProjectAssignees((prev) => [...prev, id]);
    setSearchTerm("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveAssignee = (id: string) => {
    setProjectAssignees((prev) => prev.filter((a) => a !== id));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6">
      <form onSubmit={updateProject} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Project Name
          </label>
          <input
            name="project_title"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.project_title}
            className="w-full bg-blue-100 rounded p-3"
          />
          {errors.project_title && (
            <p className="text-red-500 text-sm">{errors.project_title}</p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="description"
            onChange={handleInputChange}
            value={projectDetails.description}
            className="w-full h-32 bg-blue-100 rounded p-3"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-lg font-bold text-blue-700">
            Goal <Info size={16} className="text-gray-500" />
          </label>
          <input
            name="goal"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.goal}
            className="w-full bg-blue-100 rounded p-3"
          />
        </div>

        <div>
          <label className="block text-lg font-bold text-blue-700">
            Department
          </label>
          <div className="relative">
            <select
              name="department_id"
              onChange={handleInputChange}
              value={projectDetails.department_id}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={0}>Select Department</option>
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
            Project Lead
          </label>
          <div className="relative">
            <select
              name="project_lead_id"
              onChange={handleInputChange}
              value={projectDetails.project_lead_id}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select Project Lead</option>
              {employees.length > 0 &&
                employees.map((employee) => (
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
            {errors.project_lead_id && (
              <p className="text-red-500 text-sm">{errors.project_lead_id}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Start Date
          </label>
          <input
            onChange={handleInputChange}
            name="start_date"
            type="date"
            value={projectDetails.start_date}
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
            onChange={handleInputChange}
            value={projectDetails.end_date}
            min={
              projectDetails.start_date
                ? new Date(
                    new Date(projectDetails.start_date).getTime() + 86400000
                  )
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
          <label className="block text-lg font-bold text-blue-700 mb-1">
            Assignees
          </label>

          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Select assignees"
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>

            {dropdownOpen && filteredEmployees.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <li
                    key={emp.id}
                    onClick={() => handleAddAssignee(emp.id)}
                    className="cursor-pointer px-4 py-2 hover:bg-blue-100 text-sm"
                  >
                    {emp.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2 mt-2 flex-wrap">
            {projectAssignees.map((assignee) => {
              const emp = employees.find((e) => e.id === assignee);
              return (
                <span
                  key={assignee}
                  className="bg-gray-200 text-blue-800 px-2 py-1 rounded-sm text-sm flex items-center"
                >
                  {emp?.name}
                  <button
                    type="button"
                    className="ml-2 text-red-500"
                    onClick={() => handleRemoveAssignee(assignee)}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
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
              className="bg-blue-900 text-white py-2 px-4 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
