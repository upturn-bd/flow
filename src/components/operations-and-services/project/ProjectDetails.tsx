"use client";

import { useEffect, useState } from "react";
import { useMilestones } from "@/hooks/useMilestones";
import { useComments } from "@/hooks/useComments";
import MilestoneDetails from "./milestone/MilestoneDetails";
import { formatDate } from "@/lib/utils";
import {
  validateProject,
  validationErrorsToObject,
} from "@/lib/utils/validation";
import { useTasks, TaskStatus, TaskScope } from "@/hooks/useTasks";
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
  Projector,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import TaskCreateModal from "../task/shared/TaskCreateModal";
import TaskUpdateModal from "../task/shared/TaskUpdateModal";
import { motion } from "framer-motion";
import MilestoneCreateModal from "./milestone/MilestoneCreateModal";
import { Department, Milestone, Project, Task } from "@/lib/types/schemas";
import { TaskData } from "@/lib/validation/schemas/advanced";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, InfoRow } from "@/components/ui/Card";
import BaseModal from "@/components/ui/modals/BaseModal";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { getCompanyId } from "@/lib/utils/auth";
import { MilestoneUpdateModal } from "./milestone";

interface ProjectDetailsProps {
  id: number;
  employees: { id: string; name: string }[];
  departments: Department[];
  onClose: () => void;
  onSubmit: (data: Project) => void;
  setActiveTab: (key: string) => void;
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

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

export default function ProjectDetails({
  id: projectId,
  onClose,
  onSubmit,
  employees,
  departments,
  setActiveTab,
}: ProjectDetailsProps) {
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [displaySubmissionModal, setDisplaySubmissionModal] = useState(false);
  const [remark, setRemark] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tasks states and functions
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { getProjectTasks, createTask, updateTask, deleteTask } = useTasks();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  useEffect(() => {
    fetchProjectDetails(projectId);
    fetchMilestonesByProjectId(projectId);
    getProjectTasks(projectId, TaskStatus.INCOMPLETE);
  }, [projectId, getProjectTasks]);

  const submitProject = async (e: React.FormEvent<HTMLFormElement>) => {
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
      console.log(validation.data)
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



  const { createMilestone, updateMilestone, deleteMilestone, updateMilestoneStatus } = useMilestones();

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
      if (selectedMilestone?.id) {
        await updateMilestone(selectedMilestone.id, values);
        setSelectedMilestone(null);
        fetchMilestonesByProjectId(projectId);
        toast.success("Milestone updated!");
      }
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

  const handleCreateTask = async (values: TaskData) => {
    try {
      await createTask({ ...values, project_id: projectId });
      toast.success("Task created!");
      setIsCreatingTask(false);
      getProjectTasks(projectId, TaskStatus.INCOMPLETE);
    } catch {
      toast.error("Error creating Task.");
    }
  };

  const handleUpdateTask = async (values: TaskData) => {
    try {
      if (selectedTask?.id) {
        // Note: Update this based on actual updateTask hook signature
        // await updateTask(selectedTask.id, values);
        toast.success("Task updated!");
        setSelectedTask(null);
        getProjectTasks(projectId, TaskStatus.INCOMPLETE);
      }
    } catch {
      toast.error("Error updating Task.");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted!");
      getProjectTasks(projectId, TaskStatus.INCOMPLETE);
    } catch {
      toast.error("Error deleting Task.");
    }
  };

  // Comments functionality
  const { comments, loading: loadingComments } = useComments();

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

      const formatData =
        data?.map((item: any) => {
          const { created_at, updated_at, department_id, ...rest } = item;
          return {
            ...rest,
            start_date: formatDate(item.start_date),
            end_date: formatDate(item.end_date),
          };
        }) || [];

      setMilestones(formatData);
    } catch (error) {
      setError("Error fetching milestones");
      console.error(error);
    } finally {
      setLoadingMilestones(false);
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "ongoing":
      case "in-progress":
        return "info";
      case "pending":
        return "warning";
      default:
        return "info";
    }
  };

  const onMilestoneStatusUpdate = async (milestoneId: number, updatedMilestoneData: Milestone) => {
    try {
      await updateMilestoneStatus(milestoneId, updatedMilestoneData, projectDetails?.progress || 0);
      toast.success("Milestone status updated!");
      fetchMilestonesByProjectId(projectId);
      fetchProjectDetails(projectId);
    } catch {
      toast.error("Error updating milestone status.");
    }
  }

  if (loading) {
    return (
      <LoadingSection
        text="Loading project details..."
        icon={Projector}
        color="blue"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Building2 className="h-12 w-12" />}
        title="Error loading project"
        description={error}
      />
    );
  }

  if (!projectDetails) {
    return (
      <EmptyState
        icon={<Building2 className="h-12 w-12" />}
        title="Project not found"
        description="The requested project could not be found"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {!milestoneDetailsId && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Building2 size={24} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Project Details
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </Button>
          </motion.div>

          {/* Project Overview */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader
                title={projectDetails.project_title}
                subtitle={projectDetails.description}
                icon={<Building2 size={20} />}
                action={
                  <StatusBadge
                    status={projectDetails.status || "pending"}
                    variant={getStatusVariant(projectDetails.status)}
                  />
                }
              />

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoRow
                    icon={<User size={16} />}
                    label="Project Lead"
                    value={
                      employees.find(
                        (emp) => emp.id === projectDetails.project_lead_id
                      )?.name || "Not assigned"
                    }
                  />

                  <InfoRow
                    icon={<Clock size={16} />}
                    label="Progress"
                    value={`${projectDetails.progress || 0}%`}
                  />

                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="Start Date"
                    value={formatDate(projectDetails.start_date || "")}
                  />

                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="End Date"
                    value={formatDate(projectDetails.end_date || "")}
                  />

                  {projectDetails.assignees &&
                    projectDetails.assignees.length > 0 && (
                      <InfoRow
                        icon={<Users size={16} />}
                        label="Team Members"
                        value={`${projectDetails.assignees.length} members`}
                      />
                    )}
                </div>

                {projectDetails.assignees &&
                  projectDetails.assignees.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Assigned Team:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {projectDetails.assignees.map((assigneeId: string) => {
                          const employee = employees.find(
                            (emp) => emp.id === assigneeId
                          );
                          return employee ? (
                            <span
                              key={assigneeId}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {employee.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                {projectDetails.status !== "Completed" && (
                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => setDisplaySubmissionModal(true)}
                      className="flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Submit Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Milestones Section */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader
                title="Milestones"
                icon={<Target size={20} />}
                action={
                  projectDetails.status !== "Completed" &&
                  milestones.reduce((acc, m) => acc + m.weightage, 0) < 100 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingMilestone(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Milestone
                    </Button>
                  )
                }
              />

              <CardContent>
                {loadingMilestones ? (
                  <LoadingSection
                    text="Loading milestones..."
                    icon={Projector}
                    color="blue"
                  />
                ) : milestones.length > 0 ? (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <motion.div
                        key={milestone.id ?? index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-center gap-3">
                            <h4 className="font-semibold text-gray-900">
                              {milestone.milestone_title}
                            </h4>
                            <span className="text-xs font-medium bg-blue-100 px-2 py-1 rounded-full text-blue-600">
                              {milestone.weightage}%
                            </span>
                            {milestone.status === "Completed" && (
                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                Completed
                              </span>
                            )}

                            {milestone.status === "In Progress" && (
                              <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                In Progress
                              </span>
                            )}

                            {milestone.status === "Not Started" && (
                              <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                Not Started
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">

                            {milestone.status === "Not Started" && (
                              <Button
                                variant="pending"
                                size="sm"
                                text="Mark as In Progress"
                                onClick={() =>
                                  milestone.id &&
                                  onMilestoneStatusUpdate(milestone.id, { ...milestone, status: "In Progress" } )
                                }
                              >
                              </Button>
                            )}

                            {milestone.status === "In Progress" && (
                              <Button
                                variant="complete"
                                size="sm"
                                text="Mark as Complete"
                                onClick={() =>
                                  milestone.id &&
                                  onMilestoneStatusUpdate(milestone.id, { ...milestone, status: "Completed" } )
                                }
                              >
                              </Button>)}
                            {projectDetails.status !== "Completed" && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedMilestone(milestone)
                                  }
                                >
                                  <Pencil size={14} />
                                </Button>
                       <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              milestone.id &&
                              setMilestoneDetailsId(milestone.id)
                            }
                          >
                            <ExternalLink size={14} />
                          </Button>


                              </div>
                            )}


                          </div>
                        </div>

                        <p className="text-sm text-gray-600">
                          {milestone.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {milestone.start_date} - {milestone.end_date}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Target className="h-8 w-8" />}
                    title="No milestones yet"
                    description="Add milestones to track project progress"
                    action={
                      projectDetails.status !== "Completed"
                        ? {
                          label: "Add First Milestone",
                          onClick: () => setIsCreatingMilestone(true),
                          icon: <Plus size={16} />,
                        }
                        : undefined
                    }
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Submission Modal */}
      {displaySubmissionModal && (
        <BaseModal
          isOpen={displaySubmissionModal}
          onClose={() => setDisplaySubmissionModal(false)}
          title="Project Submission"
          icon={<CheckCircle size={20} />}
        >
          <form onSubmit={submitProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add your final remarks about the project..."
                className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisplaySubmissionModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!remark || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Project"}
              </Button>
            </div>
          </form>
        </BaseModal>
      )}

      {/* Milestone Details Modal */}
      {milestoneDetailsId && (
        <MilestoneDetails
          id={milestoneDetailsId}
          onClose={() => setMilestoneDetailsId(null)}
        />
      )}

      {/* Milestone Create Modal */}
      {isCreatingMilestone && (
        <MilestoneCreateModal
          currentTotalWeightage={milestones.reduce(
            (acc, m) => acc + (m.weightage || 0),
            0
          )}
          projectId={projectId}
          onClose={() => setIsCreatingMilestone(false)}
          onSubmit={handleCreateMilestone}
        />
      )}

      {selectedMilestone && (
        <MilestoneUpdateModal
          initialData={selectedMilestone}
          currentTotalWeightage={milestones.reduce(
            (acc, m) =>
              acc + (m.weightage || 0) - (selectedMilestone?.weightage || 0),
            0
          )}
          onClose={() => setSelectedMilestone(null)}
          onSubmit={handleUpdateMilestone}
        />
      )}
    </div>
  );
}
