"use client";
import { useEmployees } from "@/hooks/useEmployees";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { useEffect, useState } from "react";
import { useMilestones } from "@/hooks/useMilestones";
import {  useComments } from "@/hooks/useComments";
import MilestoneDetails from "./milestone/MilestoneDetails";
import { formatDate } from "@/lib/utils";
import { validateProject, validationErrorsToObject } from "@/lib/utils/validation";
import {  useTasks } from "@/hooks/useTasks";
import { 
  Plus, 
  Building2,
  User,
  Clock,
  Users,
  CheckCircle,
  X,
  Target,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import TaskCreateModal, { TaskUpdateModal } from "../task/shared/TaskModal";
import { motion } from "framer-motion";
import MilestoneCreateModal from "./milestone/MilestoneModal";
import { Milestone, Project, Task } from "@/lib/types/schemas";

interface ProjectDetailsProps {
  id: number;
  onClose: () => void;
  onSubmit: (data: Project) => void;
}

function formatTime(timestamp: number | Date): string {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  // For recent time less than a week ago
  if (seconds < intervals.minute) {
    return "just now";
  } else if (seconds < intervals.hour) {
    const minutes = Math.floor(seconds / intervals.minute);
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  } else if (seconds < intervals.day) {
    const hours = Math.floor(seconds / intervals.hour);
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  } else if (seconds < intervals.week) {
    const days = Math.floor(seconds / intervals.day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  // For times more than a week ago
  const day = date.getDate();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];

  return `${day} ${month}`;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function ProjectDetails({
  id,
  onClose,
  onSubmit,
}: ProjectDetailsProps) {
  const [projectId, setProjectId] = useState<number>(id);
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { employees, fetchEmployees } = useEmployees();
  const [remark, setRemark] = useState<string>("");
  const [displaySubmissionModal, setDisplaySubmissionModal] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const calculateProgress = (milestones: Milestone[]) => {
    if (!projectDetails || !milestones.length) return;
    
    const completedWeightage = milestones
      .filter(m => m.status === 'Completed')
      .reduce((acc, m) => acc + (m.weightage || 0), 0);
    
    // Progress is a number in the schema
    if (projectDetails) {
      setProjectDetails({
        ...projectDetails,
        progress: completedWeightage
      });
    }
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validation = validateProject({
        ...projectDetails,
        remark: remark,
        status: "Completed",
      });
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }
      onSubmit(validation.data);
      setDisplaySubmissionModal(false);
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Milestones states and functions
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState<boolean>(false);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [milestoneDetailsId, setMilestoneDetailsId] = useState<number | null>(
    null
  );
  const { createMilestone, updateMilestone, deleteMilestone } = useMilestones();

  const handleCreateMilestone = async (values: Milestone) => {
    try {
      await createMilestone(values);
      toast.success("Milestone created!");
      setIsCreatingMilestone(false);
      fetchMilestonesByProjectId(projectId);
    } catch {
      toast.error("Error creating Milestone.");
    }
  };

  const handleUpdateMilestone = async (values: Milestone) => {
    try {
      await updateMilestone(values);
      toast.success("Milestone updated!");
      setSelectedMilestone(null);
      fetchMilestonesByProjectId(projectId);
    } catch {
      toast.error("Error updating Milestone.");
    }
  };

  const handleDeleteMilestone = async (id: number) => {
    try {
      await deleteMilestone(id);
      toast.success("Milestone deleted!");
      fetchMilestonesByProjectId(projectId);
    } catch {
      toast.error("Error deleting Milestone.");
    }
  };

  const handleDisplayUpdateMilestoneModal = (id: number) => {
    const selectedMilestone = milestones.filter(
      (milestone: Milestone) => milestone.id === id
    )[0];
    setSelectedMilestone(selectedMilestone);
  };

  // Comments states and functions
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState<string>("");
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const { createComment, deleteComment } = useComments();

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const company_id = await getCompanyId();
    const user = await getEmployeeInfo();
    try {
      const formatData = {
        comment: comment,
        project_id: projectId,
        company_id: company_id,
        commenter_id: user.id,
      };
      await createComment(formatData);
      toast.success("Comment created!");
      setIsCreatingComment(false);
      setComment("");
      fetchCommentsByProjectId(projectId);
    } catch {
      toast.error("Error creating Comment.");
    }
  };
  const handleDeleteComment = async (id: number) => {
    try {
      await deleteComment(id);
      toast.success("Comment deleted!");
      fetchCommentsByProjectId(projectId);
    } catch {
      toast.error("Error deleting Comment.");
    }
  };

  // Task states and functions
  const { createTask, updateTask, deleteTask, fetchTasks } = useTasks();
  const [isCreatingMilestoneTask, setIsCreatingMilestoneTask] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Handlers for project tasks
  const handleCreateProjectTask = async (values: Task) => {
    try {
      const result = await createTask(values);
      if (result.success) {
        toast.success("Task created successfully!");
        const updatedTasks = await fetchTasks({projectId});
        setTasks(updatedTasks);
        setIsCreatingMilestoneTask(null);
      } else {
        throw result.error;
      }
    } catch (error) {
      toast.error("Failed to create task");
      console.error(error);
    }
  };

  const handleUpdateProjectTask = async (values: Task) => {
    try {
      const result = await updateTask(values);
      if (result.success) {
        toast.success("Task updated successfully!");
        const updatedTasks = await fetchTasks({projectId});
        setTasks(updatedTasks);
        setSelectedTask(null);
      } else {
        throw result.error;
      }
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    }
  };

  const handleDeleteProjectTask = async (taskId: number, milestoneId?: number) => {
    try {
      const result = await deleteTask(taskId, projectId, milestoneId);
      if (result.success) {
        toast.success("Task deleted successfully!");
        const updatedTasks = await fetchTasks({projectId});
        setTasks(updatedTasks);
      } else {
        throw result.error;
      }
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
    }
  };

  // Remove all milestone task specific handlers since they're the same as project tasks
  const handleCreateMilestoneTask = handleCreateProjectTask;
  const handleUpdateMilestoneTask = handleUpdateProjectTask;
  const handleDeleteMilestoneTask = handleDeleteProjectTask;

  // Fetch tasks when project or milestones change
  useEffect(() => {
    if (projectId) {
      fetchTasks({projectId}).then(setTasks);
    }
  }, [projectId, fetchTasks]);

  async function fetchProjectDetails(id: number) {
    setLoading(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("project_records")
        .select("*")
        .eq("id", id)
        .eq("company_id", company_id);

      if (error) {
        setError("Error fetching Project details");
        console.error(error);
        return;
      }

      setProjectDetails(data[0]);
    } catch (error) {
      setError("Error fetching Project details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMilestonesByProjectId(id: number) {
    setLoadingMilestones(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("milestone_records")
        .select("*")
        .eq("project_id", id)
        .eq("company_id", company_id);

      if (error) {
        setError("Error fetching milestones");
        console.error(error);
        return;
      }

      const formatData = data?.map((item: any) => {
        const { created_at, updated_at, department_id, ...rest } = item;
        return {
          ...rest,
        };
      });

      setMilestones(formatData || []);
      calculateProgress(formatData || []);
    } catch (error) {
      setError("Error fetching milestones");
      console.error(error);
    } finally {
      setLoadingMilestones(false);
    }
  }

  async function fetchCommentsByProjectId(id: number) {
    setLoadingComments(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("comments")
        .select("*")
        .eq("project_id", id)
        .eq("company_id", company_id);

      if (error) {
        setError("Error fetching comments");
        console.error(error);
        return;
      }

      setComments(data);
    } catch (error) {
      setError("Error fetching comments");
      console.error(error);
    } finally {
      setLoadingComments(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
      fetchMilestonesByProjectId(id);
      fetchCommentsByProjectId(id);
      setProjectId(id);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {!milestoneDetailsId && (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="md:max-w-6xl mx-auto p-6 md:p-10 text-gray-800"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 size={24} className="text-gray-600" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold text-gray-800">Project Details</h2>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <X size={20} strokeWidth={2} />
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-500" strokeWidth={1.5} />
                <span className="font-medium">Project Name:</span>
                <span className="text-gray-600">
                  {projectDetails?.project_title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500" strokeWidth={1.5} />
                <span className="font-medium">Lead:</span>
                <span className="text-gray-600">
                  {employees.filter(
                    (employee) => employee.id === projectDetails?.project_lead_id
                  )[0]?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" strokeWidth={1.5} />
                <span className="font-medium">Progress:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  {projectDetails?.progress || "N/A"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Users size={16} className="text-gray-500 mt-1" strokeWidth={1.5} />
                <div>
                  <span className="font-medium">Assignees:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {projectDetails?.assignees && projectDetails?.assignees.length > 0 &&
                      projectDetails?.assignees.map((assignee, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                        >
                          {employees.filter(
                            (employee) => employee.id === assignee
                          )[0]?.name || "N/A"}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" strokeWidth={1.5} />
                <span>
                  <span className="font-medium">Start:</span>{" "}
                  {formatDate(projectDetails?.start_date || "")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" strokeWidth={1.5} />
                <span>
                  <span className="font-medium">End:</span>{" "}
                  {formatDate(projectDetails?.end_date || "")}
                </span>
              </div>
            </div>

            <div className="mt-6 text-gray-600 bg-gray-50 p-4 rounded-md">
              <p>{projectDetails?.description}</p>
            </div>

            {projectDetails?.status !== "Completed" && (
              <Button
                variant="primary"
                onClick={() => setDisplaySubmissionModal(true)}
                className="w-full mt-8 bg-gray-800 hover:bg-gray-900 text-white"
              >
                Submit Project
              </Button>
            )}
          </motion.div>

          {/* Milestones */}
          <motion.div variants={fadeInUp} className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-gray-600" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-800">Milestones</h3>
              </div>
              {projectDetails?.status !== "Completed" &&
                milestones.reduce((acc, m) => acc + m.weightage, 0) < 100 && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsCreatingMilestone(true)}
                    className="p-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                  >
                    <Plus size={20} strokeWidth={2} />
                  </Button>
                )}
            </div>

            <div className="space-y-4">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.id ?? i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">{m.milestone_title}</h4>
                    <div className="flex gap-2">
                      {typeof m.id === 'number' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisplayUpdateMilestoneModal(m.id!)}
                            className="p-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMilestone(m.id!)}
                            className="p-1 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{m.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" strokeWidth={1.5} />
                      <span className="text-gray-600">{m.start_date} - {m.end_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-gray-500" strokeWidth={1.5} />
                      <span className="text-gray-600">Weightage: {m.weightage}%</span>
                    </div>
                  </div>

                  {typeof m.id === 'number' && tasks
                    .filter(task => task.milestone_id === m.id)
                    .map((task: Task) => (
                      <div key={task.id} className="bg-gray-100 rounded-md p-3 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{task.task_title}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTask(task)}
                              className="p-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                            >
                              <Pencil size={14} strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMilestoneTask(task.id!, m.id)}
                              className="p-1 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500"
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {tasks.filter(task => task.milestone_id === m.id).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle size={32} className="mx-auto opacity-50" strokeWidth={1.5} />
                      <p>No tasks added yet</p>
                    </div>
                  )}
                  {
                    // Add a button to add a task to the milestone
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingMilestoneTask(m.id!)}
                    >
                      <Plus size={16} strokeWidth={2} />
                    </Button>
                  }
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tasks Section */}
          <motion.div variants={fadeInUp} className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-gray-600" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-800">Project Tasks</h3>
              </div>
            </div>

            <div className="space-y-4">
              {tasks
                .map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">{task.task_title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.task_description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} strokeWidth={1.5} />
                            <span>{formatDate(task.start_date)} - {formatDate(task.end_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} strokeWidth={1.5} />
                            <span>
                              {task.assignees?.map((id: string) => 
                                employees.find(e => e.id === id)?.name
                              ).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                          className="p-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                        >
                          <Pencil size={16} strokeWidth={2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProjectTask(task.id!)}
                          className="p-1 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

              {tasks.filter(task => !task.milestone_id).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-3 opacity-50" strokeWidth={1.5} />
                  <p>No tasks added yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Task Modals */}
          {selectedTask && !selectedTask.milestone_id && (
            <TaskUpdateModal
              initialData={selectedTask}
              onClose={() => setSelectedTask(null)}
              onSubmit={handleUpdateProjectTask}
            />
          )}

          {selectedTask && selectedTask.milestone_id && (
            <TaskUpdateModal
              initialData={selectedTask}
              onClose={() => setSelectedTask(null)}
              onSubmit={(values) => handleUpdateMilestoneTask(values)}
            />
          )}

          {isCreatingMilestoneTask !== null && (
            <TaskCreateModal
              projectId={projectId}
              milestoneId={isCreatingMilestoneTask}
              onClose={() => setIsCreatingMilestoneTask(null)}
              onSubmit={(values) => handleCreateMilestoneTask(values)}
            />
          )}
        </motion.div>
      )}

      {displaySubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8 backdrop-blur-sm">
          <motion.form
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            onSubmit={submitProject}
            className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-200"
          >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-gray-600" strokeWidth={1.5} />
                <h2 className="text-xl font-semibold text-gray-800">Project Submission</h2>
              </div>
              <Button
                variant="ghost"
                onClick={() => setDisplaySubmissionModal(false)}
                className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <X size={20} strokeWidth={2} />
              </Button>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  name="remark"
                  onChange={(e) => setRemark(e.target.value)}
                  value={remark}
                  className="w-full h-32 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex justify-end mt-8 gap-4">
              <Button
                variant="outline"
                onClick={() => setDisplaySubmissionModal(false)}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!remark || isSubmitting}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                Submit
              </Button>
            </motion.div>
          </motion.form>
        </div>
      )}

      {milestoneDetailsId && (
        <MilestoneDetails 
          id={milestoneDetailsId} 
          onClose={() => setMilestoneDetailsId(null)}
        />
      )}

      {/* Milestone Modals */}
      {isCreatingMilestone && (
        <MilestoneCreateModal
          currentTotalWeightage={milestones.reduce((acc, m) => acc + (m.weightage || 0), 0)}
          projectId={projectId}
          onClose={() => setIsCreatingMilestone(false)}
          onSubmit={handleCreateMilestone}
        />
      )}
    </div>
  );
}
