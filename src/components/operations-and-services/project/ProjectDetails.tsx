"use client";
import { useEmployees } from "@/hooks/useEmployees";
import { Project } from "@/hooks/useProjects";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { useEffect, useState } from "react";
import { Milestone } from "./CreateNewProject";
import { useMilestones } from "@/hooks/useMilestones";
import MilestoneCreateModal, {
  MilestoneUpdateModal,
} from "./milestone/MilestoneModal";
import { Comment, useComments } from "@/hooks/useComments";
import MilestoneDetails from "./milestone/MilestoneDetails";
import { formatDate } from "@/lib/utils";
import { projectSchema } from "@/lib/types";
import { 
  Pencil, 
  Trash2, 
  Calendar, 
  ExternalLink, 
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';

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
  const [user, setUser] = useState<any>(null);
  const [remark, setRemark] = useState<string>("");
  const [displaySubmissionModal, setDisplaySubmissionModal] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

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
      const validated = projectSchema.safeParse({
        ...projectDetails,
        remark: remark,
        status: "Completed",
      });
      if (!validated.success) throw validated.error;
      onSubmit(validated.data);
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

  const handleCreateMilestone = async (values: any) => {
    try {
      await createMilestone(values);
      toast.success("Milestone created!");
      setIsCreatingMilestone(false);
      fetchMilestonesByProjectId(projectId);
    } catch {
      toast.error("Error creating Milestone.");
    }
  };

  const handleUpdateMilestone = async (values: any) => {
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
    const user = await getUserInfo();
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

  async function fetchTasksByProjectId(id: number) {
    setLoadingTasks(true);
    const client = createClient();
    const company_id = await getCompanyId();

    try {
      const { data, error } = await client
        .from("task_records")
        .select("*")
        .eq("project_id", id)
        .eq("company_id", company_id)
        .is("milestone_id", null);

      if (error) {
        setError("Error fetching tasks");
        console.error(error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      setError("Error fetching tasks");
      console.error(error);
    } finally {
      setLoadingTasks(false);
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
      fetchTasksByProjectId(id);
      fetchCommentsByProjectId(id);
      setProjectId(id);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUserInfo();
      setUser(user);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
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
        <div className="md:max-w-6xl mx-auto p-6 md:p-10 text-[#2F2F2F] font-sans">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-[#0074FF] mb-4">
              Project Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="bg-blue-900 text-white px-4 py-2 rounded-md"
            >
              Back
            </button>
          </div>

          <div className="grid gap-2">
            <div className="flex gap-2">
              <span className="font-bold">Project Name</span>:
              <span className="text-[#555]">
                {projectDetails?.project_title}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Lead</span>:
              <span>
                {employees.filter(
                  (employee) => employee.id === projectDetails?.project_lead_id
                )[0]?.name || "N/A"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Progress</span>:
              <span>{projectDetails?.progress || "N/A"}</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="font-bold">Assignee</span>:
              <div className="flex flex-wrap gap-2">
                {projectDetails?.assignees && projectDetails?.assignees.length > 0 &&
                  projectDetails?.assignees.map((assignee, i) => (
                    <span
                      key={i}
                      className="bg-[#E6F0FF] text-[#0074FF] text-xs px-2 py-1 rounded"
                    >
                      {employees.filter(
                        (employee) => employee.id === assignee
                      )[0]?.name || "N/A"}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span>
                <span className="font-semibold">Start:</span>{" "}
                {formatDate(projectDetails?.start_date || "")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span>
                <span className="font-semibold">End:</span>{" "}
                {formatDate(projectDetails?.end_date || "")}
              </span>
            </div>
          </div>

          {/* Flow Guidebook */}
          <div className="mt-6">
            <p>{projectDetails?.description}</p>
          </div>

          {projectDetails?.status !== "Completed" && (
            <button
              type="button"
              onClick={() => setDisplaySubmissionModal(true)}
              className="w-full mt-8 bg-[#FFB800] font-semibold py-2 px-6 rounded-md"
            >
              Submit Project
            </button>
          )}
          {/* Milestones */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#2F2F2F]">
                Milestones
              </h3>
              {projectDetails?.status !== "Completed" &&
                milestones.reduce((acc, m) => acc + m.weightage, 0) < 100 && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingMilestone(true)}
                    className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
                  >
                    +
                  </button>
                )}
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {!loadingMilestones &&
                milestones.length > 0 &&
                milestones.map((m, i) => (
                  <div key={m.id} className="bg-blue-100 rounded p-4 space-y-1">
                    <div className="flex justify-between">
                      <div className="font-bold text-lg text-blue-900">
                        Milestone {i + 1}
                      </div>
                      <ExternalLink
                        onClick={() => m.id !== undefined && setMilestoneDetailsId(m.id)}
                        size={18}
                        className="text-slate-800 hover:text-blue-800 cursor-pointer ml-4 md:ml-8"
                      />
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
                      <Pencil
                        size={16}
                        onClick={() => m.id !== undefined && handleDisplayUpdateMilestoneModal(m.id)}
                        className="text-gray-600 cursor-pointer"
                      />
                      <Trash2
                        onClick={() => m.id !== undefined && handleDeleteMilestone(m.id)}
                        size={16}
                        className="text-red-600 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              {loadingMilestones && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">Loading...</p>
                </div>
              )}
              {!loadingMilestones && milestones.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No milestones found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#2F2F2F]">Comments</h3>
              {projectDetails?.status !== "Completed" && (
                <button
                  type="button"
                  onClick={() => setIsCreatingComment(true)}
                  className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
                >
                  +
                </button>
              )}
            </div>
            <div className="bg-[#F3F3F3] p-4 rounded-lg mt-4">
              {!loadingComments &&
                [...comments]
                  .sort(
                    (a, b) => {
                      const dateA = b.created_at ? new Date(b.created_at).getTime() : 0;
                      const dateB = a.created_at ? new Date(a.created_at).getTime() : 0;
                      return dateA - dateB;
                    }
                  )
                  .map((c, i) => (
                    <div key={i} className={"bg-white p-3 rounded-md mb-3 "}>
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 w-14 h-7 md:w-10 md:h-10 rounded-full bg-gray-300 flex items-center justify-center text-xs md:text-sm">
                            {employees
                              .filter(
                                (employee) => employee.id === c.commenter_id
                              )[0]
                              ?.name.charAt(0)}
                          </span>
                          <p className="text-sm">{c.comment}</p>
                        </div>
                        {c.commenter_id === user.id && (
                          <Trash2
                            onClick={() => c.id !== undefined && handleDeleteComment(c.id)}
                            size={16}
                            className="text-red-600 cursor-pointer w-7 h-7 md:w-4 md:h-4"
                          />
                        )}
                      </div>
                      <p className="text-xs text-right text-gray-500 mt-1">
                        {formatTime(c.created_at!)}
                      </p>
                    </div>
                  ))}
              {loadingComments && (
                <div className="flex items-center justify-center h-32">
                  Loading...
                </div>
              )}

              {!loadingComments && comments.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  No comments found.
                </div>
              )}
            </div>
          </div>
          {isCreatingMilestone && (
            <MilestoneCreateModal
              currentTotalWeightage={milestones.reduce(
                (acc, m) => acc + m.weightage,
                0
              )}
              projectId={projectId}
              onClose={() => setIsCreatingMilestone(false)}
              onSubmit={handleCreateMilestone}
            />
          )}

          {selectedMilestone && (
            <MilestoneUpdateModal
              currentTotalWeightage={milestones.reduce(
                (acc, m) => acc + m.weightage,
                0
              )}
              initialData={selectedMilestone}
              onClose={() => setSelectedMilestone(null)}
              onSubmit={handleUpdateMilestone}
            />
          )}

          {/* Comment Modal */}
          {isCreatingComment && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
              <form
                onSubmit={handleCreateComment}
                className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
              >
                <h2 className="text-xl font-semibold">Add Comment</h2>
                <div>
                  <textarea
                    name="comment"
                    onChange={(e) => setComment(e.target.value)}
                    value={comment}
                    className="w-full h-32 bg-blue-100 rounded p-3 mt-2"
                  />
                </div>
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setIsCreatingComment(false)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!comment}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/*Submission Modal */}
      {displaySubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
          <form
            onSubmit={submitProject}
            className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold">Project Submission</h2>

            <div className="mt-4 space-y-2">
              <label
                htmlFor="remark"
                className="block text-sm font-medium text-blue-900"
              >
                Remarks
              </label>
              <textarea
                name="remark"
                onChange={(e) => setRemark(e.target.value)}
                value={remark}
                className="w-full h-32 bg-blue-100 rounded p-3 mt-2"
              />
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setDisplaySubmissionModal(false)}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!remark || isSubmitting}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
      {milestoneDetailsId && <MilestoneDetails id={milestoneDetailsId} onClose={()=> setMilestoneDetailsId(null)}/>}
    </div>
  );
}
