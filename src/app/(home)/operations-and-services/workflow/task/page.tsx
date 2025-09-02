"use client";

import { useEffect, useMemo } from "react";
import OngoingTaskPage from "@/components/operations-and-services/task/OngoingTasks";
import CompletedTasksList from "@/components/operations-and-services/task/CompletedTasks";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckSquare,
  PlusSquare,
  ArchiveIcon
} from "lucide-react";
import TabView, { TabItem } from "@/components/ui/TabView";
import TaskCreateModal from "@/components/operations-and-services/task/shared/TaskModal";
import { Task, useTasks } from "@/hooks/useTasks";
import { TaskData } from "@/lib/validation/schemas/advanced";
import { toast } from "sonner";
import {  useAuth } from "@/lib/auth/auth-context";

const TABS = [
  {
    key: "ongoing",
    label: "Ongoing",
    icon: <ClipboardList className="h-5 w-5" />,
    color: "text-indigo-600"
  },
  {
    key: "completed",
    label: "Completed",
    icon: <CheckSquare className="h-5 w-5" />,
    color: "text-green-600"
  },
  {
    key: "archived",
    label: "Archived",
    icon: <ArchiveIcon className="h-5 w-5" />,
    color: "text-gray-600"
  }
];

export default function TasksPage() {
  
  const [activeTab, setActiveTab] = useState("ongoing");
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { employeeInfo } = useAuth();
  const { createTask } = useTasks();

  // Create stable component instances that won't change on re-renders
  const ongoingTaskPage = useMemo(() => <OngoingTaskPage />, []);
  const completedTasksList = useMemo(() => <CompletedTasksList />, []);
  const archivedContent = useMemo(() => (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-xl border border-gray-200 text-center">
      <ArchiveIcon className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Archived Tasks</h3>
      <p className="text-gray-500 max-w-md mb-6">
        This section will store your archived tasks that are no longer active but you want to keep for reference.
      </p>
      <p className="text-gray-400 text-sm">
        Feature coming soon...
      </p>
    </div>
  ), []);

  const handleCreateTask = async (taskData: TaskData) => {
    // Convert TaskData to Task format
    const task: Task = {
      task_title: taskData.task_title,
      task_description: taskData.task_description || '',
      start_date: taskData.start_date || new Date().toISOString().split('T')[0],
      end_date: taskData.end_date || new Date().toISOString().split('T')[0],
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
      setActiveTab("ongoing");
    } else {
      toast.error("Failed to create task");
    }
  };

  function getTabContent(key: string) {
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
  }

  // Set up tabs with content on mount
  useEffect(() => {
    setTabs(TABS.map(tab => ({ ...tab, content: getTabContent(tab.key) })));
    // eslint-disable-next-line
  }, []);

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
      
      {tabs.length > 0 && (
        <TabView
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
