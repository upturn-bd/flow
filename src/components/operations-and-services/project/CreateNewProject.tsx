"use client";

import { useDepartments } from "@/hooks/useDepartments";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { updateProject } from "@/lib/api/operations-and-services/project";
import { getCompanyId } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { milestoneSchema, projectSchema } from "@/lib/types";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Pencil, 
  Trash2, 
  Info, 
  Plus, 
  ChevronDown, 
  Calendar, 
  Users,
  Building2, 
  UserCircle, 
  Search,
  AlertCircle,
  X,
  Check,
  Milestone,
  ArrowRight,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

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
      toast.success("Project created successfully!");
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors({ ...errors, project_title: "Error creating project" });
      toast.error("Error creating project. Please try again.");
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6"
    >
      <motion.h1 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-2xl font-bold text-blue-800 mb-8"
      >
        Create New Project
      </motion.h1>
      
      <form onSubmit={updateProject} className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            name="project_title"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.project_title}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
          />
          {errors.project_title && (
            <p className="mt-1 text-red-500 text-sm flex items-center">
              <AlertCircle size={14} className="mr-1" />
              {errors.project_title}
            </p>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            onChange={handleInputChange}
            value={projectDetails.description}
            className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            Goal <Info size={16} className="text-gray-400" />
          </label>
          <input
            name="goal"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.goal}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Building2 size={16} className="text-blue-500" />
              Department
            </label>
            <div className="relative">
              <select
                name="department_id"
                onChange={handleInputChange}
                value={projectDetails.department_id}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 appearance-none"
              >
                <option value={0}>Select Department</option>
                {departments.length > 0 &&
                  departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.department_id && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.department_id}
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <UserCircle size={16} className="text-blue-500" />
              Project Lead
            </label>
            <div className="relative">
              <select
                name="project_lead_id"
                onChange={handleInputChange}
                value={projectDetails.project_lead_id}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 appearance-none"
              >
                <option value={""}>Select Project Lead</option>
                {employees.length > 0 &&
                  employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.project_lead_id && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.project_lead_id}
                </p>
              )}
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="text-blue-500" />
              Start Date
            </label>
            <input
              onChange={handleInputChange}
              name="start_date"
              type="date"
              value={projectDetails.start_date}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
            />
            {errors.start_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.start_date}
              </p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="text-blue-500" />
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
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
            />
            {errors.end_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.end_date}
              </p>
            )}
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Users size={16} className="text-blue-500" />
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
              placeholder="Search for assignees..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 pr-10"
            />
            <Search 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />

            <AnimatePresence>
              {dropdownOpen && filteredEmployees.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredEmployees.map((emp) => (
                    <motion.li
                      key={emp.id}
                      onClick={() => handleAddAssignee(emp.id)}
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
              {projectAssignees.map((assignee) => {
                const emp = employees.find((e) => e.id === assignee);
                return (
                  <motion.span
                    key={assignee}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {emp?.name}
                    <button
                      type="button"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                      onClick={() => handleRemoveAssignee(assignee)}
                    >
                      <X size={14} />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
        
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
            {milestones.reduce((acc, m) => acc + m.weightage, 0) < 100 && (
              <motion.button
                type="button"
                onClick={() => setIsCreatingMilestone(true)}
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
                    key={m.project_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    className="bg-white rounded-lg p-4 space-y-2 border border-blue-100 shadow-sm"
                  >
                    <div className="font-bold text-lg text-blue-900">
                      Milestone {m.project_id}
                    </div>
                    <p className="text-sm text-gray-700">{m.milestone_title}</p>
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
                    <div className="flex justify-end gap-2">
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          handleDisplayUpdateMilestoneModal(m.project_id)
                        }
                        className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"
                      >
                        <Pencil size={16} />
                      </motion.button>
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteMilestone(m.project_id)}
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
                onClick={() => setIsCreatingMilestone(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add Milestone
              </motion.button>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          className="flex justify-end pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            type="submit"
            disabled={!isValid || isSubmitting}
            whileHover={isValid && !isSubmitting ? { scale: 1.03 } : {}}
            whileTap={isValid && !isSubmitting ? { scale: 0.97 } : {}}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Create Project
              </>
            )}
          </motion.button>
        </motion.div>
      </form>

      {isCreatingMilestone && (
        // Modal for creating a new milestone
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Milestone size={20} className="mr-2 text-blue-600" />
              Add Milestone
            </h2>
            
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone Title
                </label>
                <input
                  name="milestone_title"
                  type="text"
                  onChange={handleMilestoneChange}
                  value={milestone.milestone_title}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                />
                {milestoneErrors.milestone_title && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {milestoneErrors.milestone_title}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  onChange={handleMilestoneChange}
                  value={milestone.description}
                  className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="text-blue-500" />
                    Start Date
                  </label>
                  <input
                    onChange={handleMilestoneChange}
                    name="start_date"
                    type="date"
                    value={milestone.start_date}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                  />
                  {milestoneErrors.start_date && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {milestoneErrors.start_date}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="text-blue-500" />
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
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                  />
                  {milestoneErrors.end_date && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {milestoneErrors.end_date}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  <Users size={14} className="text-blue-500" />
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
                    placeholder="Search for assignees..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 pr-10"
                  />
                  <Search 
                    size={16} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />

                  <AnimatePresence>
                    {isMilestoneDropdownOpen && filteredMilestoneEmployees.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredMilestoneEmployees.map((emp) => (
                          <motion.li
                            key={emp.id}
                            onClick={() => handleAddMilestoneAssignee(emp.id)}
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
                    {milestoneAssignees.map((assignee) => {
                      const emp = employees.find((e) => e.id === assignee);
                      return (
                        <motion.span
                          key={assignee}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                          {emp?.name}
                          <button
                            type="button"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => handleRemoveMilestoneAssignee(assignee)}
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
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    onChange={handleMilestoneChange}
                    value={milestone.status}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 appearance-none"
                  >
                    <option value={""}>Select status</option>
                    {["Ongoing", "Completed", "Archived"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  {milestoneErrors.status && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {milestoneErrors.status}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  Weightage (%)
                </label>
                <input
                  name="weightage"
                  type="number"
                  onChange={handleMilestoneChange}
                  value={milestone.weightage}
                  max={100 - milestones.reduce((acc, m) => acc + m.weightage, 0)}
                  min={1}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                />
                {milestoneErrors.weightage && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {milestoneErrors.weightage}
                  </p>
                )}
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                  onClick={closeCreateModal}
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isMilestoneValid}
                >
                  <Check size={16} className="mr-2" />
                  Add Milestone
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {selectedMilestone && (
        // Modal for updating an existing milestone
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Pencil size={20} className="mr-2 text-blue-600" />
              Update Milestone
            </h2>
            
            <form onSubmit={handleUpdateMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone Title
                </label>
                <input
                  name="milestone_title"
                  type="text"
                  onChange={handleMilestoneChange}
                  value={milestone.milestone_title}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                />
                {milestoneErrors.milestone_title && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {milestoneErrors.milestone_title}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  onChange={handleMilestoneChange}
                  value={milestone.description}
                  className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="text-blue-500" />
                    Start Date
                  </label>
                  <input
                    onChange={handleMilestoneChange}
                    name="start_date"
                    type="date"
                    value={milestone.start_date}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                  />
                  {milestoneErrors.start_date && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {milestoneErrors.start_date}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="text-blue-500" />
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
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                  />
                  {milestoneErrors.end_date && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {milestoneErrors.end_date}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  <Users size={14} className="text-blue-500" />
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
                    placeholder="Search for assignees..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 pr-10"
                  />
                  <Search 
                    size={16} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />

                  <AnimatePresence>
                    {isMilestoneDropdownOpen && filteredMilestoneEmployees.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredMilestoneEmployees.map((emp) => (
                          <motion.li
                            key={emp.id}
                            onClick={() => handleAddMilestoneAssignee(emp.id)}
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
                    {milestoneAssignees.map((assignee) => {
                      const emp = employees.find((e) => e.id === assignee);
                      return (
                        <motion.span
                          key={assignee}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                          {emp?.name}
                          <button
                            type="button"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => handleRemoveMilestoneAssignee(assignee)}
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
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    onChange={handleMilestoneChange}
                    value={milestone.status}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 appearance-none"
                  >
                    <option value={""}>Select status</option>
                    {["Ongoing", "Completed", "Archived"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  {milestoneErrors.status && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {milestoneErrors.status}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  Weightage (%)
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
                />
                {milestoneErrors.weightage && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {milestoneErrors.weightage}
                  </p>
                )}
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                  onClick={closeUpdateModal}
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isMilestoneValid}
                >
                  <Check size={16} className="mr-2" />
                  Update Milestone
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
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
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error updating project. Please try again.");
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="md:max-w-6xl mx-auto p-6 md:p-10 space-y-6"
    >
      <motion.h1 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-2xl font-bold text-blue-800 mb-8"
      >
        Update Project
      </motion.h1>
      
      <form onSubmit={updateProject} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            name="project_title"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.project_title}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
          />
          {errors.project_title && (
            <p className="mt-1 text-red-500 text-sm flex items-center">
              <AlertCircle size={14} className="mr-1" />
              {errors.project_title}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            onChange={handleInputChange}
            value={projectDetails.description}
            className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            Goal <Info size={16} className="text-gray-400" />
          </label>
          <input
            name="goal"
            type="text"
            onChange={handleInputChange}
            value={projectDetails.goal}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Building2 size={16} className="text-blue-500" />
              Department
            </label>
            <div className="relative">
              <select
                name="department_id"
                onChange={handleInputChange}
                value={projectDetails.department_id}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 appearance-none"
              >
                <option value={0}>Select Department</option>
                {departments.length > 0 &&
                  departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.department_id && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.department_id}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <UserCircle size={16} className="text-blue-500" />
              Project Lead
            </label>
            <div className="relative">
              <select
                name="project_lead_id"
                onChange={handleInputChange}
                value={projectDetails.project_lead_id}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-[#EAF4FF] p-3 appearance-none"
              >
                <option value={""}>Select Project Lead</option>
                {employees.length > 0 &&
                  employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.project_lead_id && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.project_lead_id}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="text-blue-500" />
              Start Date
            </label>
            <input
              onChange={handleInputChange}
              name="start_date"
              type="date"
              value={projectDetails.start_date}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white p-3"
            />
            {errors.start_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.start_date}
              </p>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="text-blue-500" />
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
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white p-3"
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
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Users size={16} className="text-blue-500" />
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
              placeholder="Search for assignees..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white p-3 pr-10"
            />
            <Search 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />

            <AnimatePresence>
              {dropdownOpen && filteredEmployees.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredEmployees.map((emp) => (
                    <motion.li
                      key={emp.id}
                      onClick={() => handleAddAssignee(emp.id)}
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
              {projectAssignees.map((assignee) => {
                const emp = employees.find((e) => e.id === assignee);
                return (
                  <motion.span
                    key={assignee}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {emp?.name}
                    <button
                      type="button"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                      onClick={() => handleRemoveAssignee(assignee)}
                    >
                      <X size={14} />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors duration-150 flex items-center"
            >
              <X size={16} className="mr-2" />
              Cancel
            </motion.button>
            
            <motion.button
              type="submit"
              whileHover={isValid && !isSubmitting ? { scale: 1.03 } : {}}
              whileTap={isValid && !isSubmitting ? { scale: 0.97 } : {}}
              disabled={!isValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-md font-medium shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Update Project
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
