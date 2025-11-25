"use client";

import React, { useEffect, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import TabView from "@/components/ui/TabView";
import { Loader, Trash, RotateCcw, CheckCircle, Edit } from "@/lib/icons";
import { toast } from "sonner";
import TaskUpdateModal from "@/components/ops/tasks/shared/TaskUpdateModal";
import { getEmployeeName } from "@/lib/utils/auth";
import { useAuth } from "@/lib/auth/auth-context";

export default function CompanyTaskLogsPage() {
   const {
      fetchOngoingTasks,
      fetchCompletedTasks,
      ongoingTasks,
      completedTasks,
      deleteTask,
      completeTask,
      reopenTask,
      updateTask,
      loading,
      error,
   } = useTasks();

   const {
      canWrite,
      canDelete,
      canApprove,
   } = useAuth();

   const MODULE = "tasks";

   const [activeTab, setActiveTab] = useState<"ongoing" | "completed">("ongoing");
   const [search, setSearch] = useState("");
   const [selectedTask, setSelectedTask] = useState<any | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});

   useEffect(() => {
      fetchOngoingTasks(true);
      fetchCompletedTasks(true);
   }, [fetchOngoingTasks, fetchCompletedTasks]);

   useEffect(() => {
      const fetchEmployeeNames = async () => {
         const allTasks = [...ongoingTasks, ...completedTasks];
         const namesMap: Record<string, string> = {};
         await Promise.all(
            allTasks.map(async (task) => {
               if (task.created_by && !namesMap[task.created_by]) {
                  namesMap[task.created_by] = await getEmployeeName(task.created_by);
               }
            })
         );
         setEmployeeNames(namesMap);
      };
      fetchEmployeeNames();
   }, [ongoingTasks, completedTasks]);

   const filteredOngoing = ongoingTasks.filter((task) =>
      task.task_title.toLowerCase().includes(search.toLowerCase())
   );

   const filteredCompleted = completedTasks.filter((task) =>
      task.task_title.toLowerCase().includes(search.toLowerCase())
   );

   const handleComplete = async (id: string) => {
      await completeTask(id);
      toast.success("Task Completed Successfully");
      await fetchOngoingTasks(true);
      await fetchCompletedTasks(true);
   };

   const handleReopen = async (id: string) => {
      await reopenTask(id);
      toast.success("Task Reopened Successfully");
      await fetchOngoingTasks(true);
      await fetchCompletedTasks(true);
   };

   const handleDelete = async (id: string) => {
      if (confirm("Are you sure you want to delete this task?")) {
         await deleteTask(id, undefined, undefined, true);
         await fetchOngoingTasks(true);
         await fetchCompletedTasks(true);
         toast.success("Task Deleted Successfully");
      }
   };

   const handleEdit = (task: any) => {
      setSelectedTask(task);
      setIsModalOpen(true);
   };

   const handleUpdate = async (data: any) => {
      try {
         await updateTask(data);
         setIsModalOpen(false);
         setSelectedTask(null);
         toast.success("Task Updated Successfully");
      } catch (error) {
         console.error(error);
         toast.error("Failed to update task");
      }
   };

   const renderTaskList = (tasks: any[], completed: boolean) => {
      if (tasks.length === 0) {
         return <p className="text-foreground-tertiary text-sm mt-2">No tasks found.</p>;
      }

      return (
         <div className="space-y-4 mt-3">
            {tasks.map((task) => (
               <Card
                  key={task.id}
                  className="border border-border-primary shadow-sm hover:shadow-lg transition-all rounded-xl"
               >
                  <CardContent className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 gap-3">
                     {/* Task info */}
                     {/* Task info */}
                     <div className="flex flex-col gap-2 w-full sm:w-2/3">
                        <h3 className="font-semibold text-lg break-words">{task.task_title}</h3>


                        {/* Badges: Created At, Start Date, End Date */}
                        <div className="flex flex-wrap gap-2 text-sm mt-1">
                           <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              Start: {task.start_date ? task.start_date : "N/A"}
                           </span>
                           <span className={`px-2 py-0.5 rounded-full ${completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              Due: {task.end_date ? task.end_date : "No due date"}
                           </span>
                        </div>


                        {/* Created by as plain text */}
                        <p className="text-foreground-secondary text-sm mt-1">
                           Created by: {employeeNames[task.created_by] || "Unknown"}
                        </p>

                        <p className="text-foreground-secondary text-sm">
                           Created: {task.created_at ? new Date(task.created_at).toLocaleDateString("en-GB") : "N/A"}
                        </p>

                     </div>

                     {/* Action buttons */}
                     <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
                        {canApprove(MODULE) && (
                           <>
                              {!completed ? (
                                 <Button
                                    size="sm"
                                    variant="complete"
                                    onClick={() => task.id && handleComplete(task.id)}
                                    className="p-2"
                                 >
                                    <CheckCircle size={16} />
                                 </Button>
                              ) : (
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => task.id && handleReopen(task.id)}
                                    className="p-2"
                                 >
                                    <RotateCcw size={16} />
                                 </Button>
                              )}
                           </>


                        )}


                        {canWrite(MODULE) &&
                           (
                              <Button
                                 size="sm"
                                 variant="secondary"
                                 onClick={() => handleEdit(task)}
                                 className="p-2"
                              >
                                 <Edit size={16} />
                              </Button>
                           )}


                        {canDelete(MODULE) && (
                           <Button
                              size="sm"
                              variant="danger"
                              onClick={() => task.id && handleDelete(task.id)}
                              className="p-2"
                           >
                              <Trash size={16} />
                           </Button>
                        )}
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      );
   };

   return (
      <div className="max-w-6xl mx-auto py-8 px-4">
         <Card>
            <CardHeader
               title="Company Task Logs"
               subtitle="View, manage, and track all company-wide tasks."
            />
            <CardContent>
               <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                  <input
                     placeholder="Search tasks..."
                     value={search}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearch(e.target.value)
                     }
                     className="w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
               </div>

               <TabView
                  tabs={[
                     {
                        key: "ongoing",
                        label: "Ongoing Tasks",
                        icon: <></>,
                        color: "text-blue-500",
                        content: (
                           <>
                              {loading ? (
                                 <div className="flex justify-center items-center h-32">
                                    <Loader className="animate-spin text-gray-500" />
                                 </div>
                              ) : error ? (
                                 <p className="text-red-500">
                                    Error loading tasks: {error.message}
                                 </p>
                              ) : (
                                 renderTaskList(filteredOngoing, false)
                              )}
                           </>
                        ),
                     },
                     {
                        key: "completed",
                        label: "Completed Tasks",
                        icon: <></>,
                        color: "text-green-500",
                        content: (
                           <>
                              {loading ? (
                                 <div className="flex justify-center items-center h-32">
                                    <Loader className="animate-spin text-gray-500" />
                                 </div>
                              ) : error ? (
                                 <p className="text-red-500">
                                    Error loading tasks: {error.message}
                                 </p>
                              ) : (
                                 renderTaskList(filteredCompleted, true)
                              )}
                           </>
                        ),
                     },
                  ]}
                  activeTab={activeTab}
                  setActiveTab={(v: string) => setActiveTab(v as any)}
               />
            </CardContent>
         </Card>

         {isModalOpen && selectedTask && (
            <TaskUpdateModal
               initialData={selectedTask}
               onSubmit={handleUpdate}
               onClose={() => {
                  setIsModalOpen(false);
                  setSelectedTask(null);
               }}
            />
         )}
      </div>
   );
}
