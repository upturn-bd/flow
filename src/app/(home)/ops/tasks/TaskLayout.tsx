"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckSquare,
  ArchiveIcon,
  PlusSquare
} from "@/lib/icons";
import TabView, { TabItem } from "@/components/ui/TabView";
import OngoingTaskPage from "@/components/ops/tasks/OngoingTasks";
import CompletedTasksList from "@/components/ops/tasks/CompletedTasks";
import TaskCreateModal from "@/components/ops/tasks/shared/TaskModal";
import { useTasks, Task } from "@/hooks/useTasks";
import { TaskData } from "@/lib/validation/schemas/advanced";

import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import TaskDetails from "@/components/ops/tasks/shared/TaskDetails";
import { useRouter } from "next/navigation";

const TABS = [
  {
    key: "ongoing",
    label: "Ongoing",
    icon: <ClipboardList className="h-5 w-5" />,
    color: "text-indigo-600",
  },
  {
    key: "completed",
    label: "Completed",
    icon: <CheckSquare className="h-5 w-5" />,
    color: "text-green-600",
  },
  {
    key: "archived",
    label: "Archived",
    icon: <ArchiveIcon className="h-5 w-5" />,
    color: "text-gray-600",
  },
];

export default function TaskLayout({
  selectedTaskId,
  activeTab,
  initialActiveTab = "ongoing",
  setActiveTab: setParentActiveTab,
}: {
  selectedTaskId?: string | null;
  activeTab?: string;
  initialActiveTab?: string;
  setActiveTab?: (tab: string) => void;
}) {
  const router = useRouter()
  const handleTabChange = (tab: string) => {
    router.push(`/ops/tasks?tab=${tab}`);
  };

  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { employeeInfo } = useAuth();

  const {
    hasMoreOngoingTasks,
    hasMoreCompletedTasks,

    ongoingTasks,
    completedTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    fetchOngoingTasks,
    fetchCompletedTasks,
  } = useTasks();

  // Load tasks
  useEffect(() => {
    if (employeeInfo) {
      fetchOngoingTasks();
      fetchCompletedTasks();
    }
  }, [employeeInfo, fetchOngoingTasks, fetchCompletedTasks]);

  // Tab content
  const ongoingTaskPage = useMemo(
    () => (
      <OngoingTaskPage
      hasMoreOngoingTasks={hasMoreOngoingTasks}
      onLoadMore={() => {
        fetchOngoingTasks(true, 10)
      }}
        ongoingTasks={ongoingTasks}
        loading={loading}
        updateTask={updateTask}
        deleteTask={deleteTask}
        adminScoped={false}

      />
    ),
    [ongoingTasks, loading, updateTask, deleteTask]
  );

  const completedTasksList = useMemo(
    () => (
      <CompletedTasksList
        tasks={completedTasks}
        loading={loading}
        deleteTask={deleteTask}
        adminScoped={false}
        hasMoreCompletedTasks={hasMoreCompletedTasks}
        onLoadMore={() => {
          fetchCompletedTasks(true, 10)
        }}
      />
    ),
    [completedTasks, loading, deleteTask]
  );

  const archivedContent = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-xl border border-gray-200 text-center">
        <ArchiveIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Archived Tasks
        </h3>
        <p className="text-gray-500 max-w-md mb-6">
          This section will store your archived tasks that are no longer active but you want to keep for reference.
        </p>
        <p className="text-gray-400 text-sm">Feature coming soon...</p>
      </div>
    ),
    []
  );

  const getTabContent = useMemo(() => {
    return (key: string) => {
      switch (key) {
        case "ongoing":
          return ongoingTaskPage;
        case "completed":
          return completedTasksList;
        case "archived":
          return archivedContent;
        default:
          return ongoingTaskPage;
      }
    };
  }, [ongoingTaskPage, completedTasksList, archivedContent]);

  useEffect(() => {
    setTabs(TABS.map(tab => ({ ...tab, content: getTabContent(tab.key) })));
  }, [getTabContent]);

  const handleCreateTask = async (taskData: TaskData) => {
    const task: Task = {
      task_title: taskData.task_title,
      task_description: taskData.task_description || "",
      start_date: taskData.start_date || new Date().toLocaleDateString("sv-SE"),
      end_date: taskData.end_date || new Date().toLocaleDateString("sv-SE"),
      priority: taskData.priority,
      project_id: taskData.project_id,
      milestone_id: taskData.milestone_id,
      department_id: taskData.department_id,
      assignees: taskData.assignees,
      status: taskData.status || false,
    };

    const { success, error } = await createTask(task);
    if (success) {
      toast.success("Task created successfully");
      setShowCreateModal(false);
      await fetchOngoingTasks();
    } else {
      toast.error("Failed to create task");
      console.error("Error creating task:", error);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <motion.div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
            <ClipboardList className="mr-2 h-6 w-6 text-indigo-500" />
            Task Management
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Manage and track your tasks efficiently. Create, assign, and monitor progress to ensure timely completion of all your activities.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusSquare className="h-5 w-5" />
          Create Task
        </button>
      </motion.div>

      <TabView
        tabs={tabs}
        activeTab={selectedTaskId ? "" : activeTab || ""} // no tab active if viewing task
        setActiveTab={handleTabChange}
      
      />

      {/* Only show tab content when no task is selected
      {!selectedTaskId && tabs.length > 0 && activeTab && (
        <div className="mt-4">
          {tabs.find((t) => t.key === activeTab)?.content}
        </div>
      )} */}


      {/* Task Details */}
      {selectedTaskId && (
        <TaskDetails
          id={selectedTaskId}
          onClose={() => window.history.back()}
          onTaskStatusUpdate={() => { }}
        />
      )}


      {showCreateModal && (
        <TaskCreateModal
          onSubmit={handleCreateTask}
          departmentId={employeeInfo?.department_id as number}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </motion.div>
  );
}
