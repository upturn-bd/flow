"use client";

import React, { useEffect, useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import TabView from "@/components/ui/TabView";
import { Loader2, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { getEmployeeName } from "@/lib/utils/auth";
import { UpdateProjectPage } from "@/components/operations-and-services/project/CreateNewProject";
import { ProjectDetails } from "@/components/operations-and-services/project/ProjectForm";

export default function CompanyProjectsPage() {
   const {
      ongoingProjects,
      ongoingLoading,
      fetchOngoingProjects,
      projects,
      fetchProjects,
      updateProject,
      deleteProject,
   } = useProjects();

   const { employees, fetchEmployeeInfo } = useEmployeeInfo();
   const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});

   const [activeTab, setActiveTab] = useState<"ongoing" | "completed">("ongoing");
   const [search, setSearch] = useState("");
   const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
   const [isEditing, setIsEditing] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Fetch projects and employees on mount
   useEffect(() => {
      fetchOngoingProjects();
      fetchProjects();
      fetchEmployeeInfo();
   }, []);

   // Fetch employee names for "Created by"
   useEffect(() => {
      const fetchEmployeeNames = async () => {
         const allProjects = [...ongoingProjects, ...projects];
         const namesMap: Record<string, string> = {};
         await Promise.all(
            allProjects.map(async (project) => {
               if (project.created_by && !namesMap[project.created_by]) {
                  namesMap[project.created_by] = await getEmployeeName(project.created_by);
               }
            })
         );
         setEmployeeNames(namesMap);
      };
      fetchEmployeeNames();
   }, [ongoingProjects, projects]);

   const filteredOngoing = ongoingProjects.filter((project) =>
      project.project_title.toLowerCase().includes(search.toLowerCase())
   );

   const filteredCompleted = projects
      .filter(p => p.status === "Completed")
      .filter((project) =>
         project.project_title.toLowerCase().includes(search.toLowerCase())
      );

   const handleDelete = async (id: number) => {
      if (confirm("Are you sure you want to delete this project?")) {
         await deleteProject(id);
         toast.success("Project Deleted Successfully");
         fetchOngoingProjects();
         fetchProjects();
      }
   };

   const handleEdit = (project: ProjectDetails) => {
      setSelectedProject(project);
      setIsEditing(true);
   };

   const handleUpdate = async (data: ProjectDetails) => {
      try {
         setIsSubmitting(true);
         await updateProject(data.id || 0, data);
         toast.success("Project Updated Successfully");
         setIsEditing(false);
         setSelectedProject(null);
         fetchOngoingProjects();
         fetchProjects();
      } catch (error) {
         console.error(error);
         toast.error("Failed to update project");
      } finally {
         setIsSubmitting(false);
      }
   };

   const renderProjectList = (projectsList: ProjectDetails[]) => {
      if (projectsList.length === 0) {
         return <p className="text-gray-500 text-sm mt-2">No projects found.</p>;
      }

      return (
         <div className="space-y-4 mt-3">
            {projectsList.map((project) => (
               <Card
                  key={project.id}
                  className="border border-gray-200 shadow-sm hover:shadow-lg transition-all rounded-xl"
               >
                  <CardContent className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 gap-3">
                     <div className="flex flex-col gap-2 w-full sm:w-2/3">
                        <h3 className="font-semibold text-lg break-words">{project.project_title}</h3>

                        {/* Desktop badges */}
                        <div className="hidden sm:flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                           <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Start: {project.start_date || "N/A"}
                           </span>
                           <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              End: {project.end_date || "N/A"}
                           </span>
                           <span className={`px-2 py-0.5 rounded-full ${project.status === "Completed" ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              Status: {project.status || "N/A"}
                           </span>
                        </div>

                        {/* Created by plain text */}
                        <p className="text-gray-700 text-sm mt-1">
                           Created by: {employeeNames[project.created_by || 0] || "Unknown"}
                        </p>

                        <p className="text-gray-700 text-sm">
                           Created: {project.created_at ? new Date(project.created_at).toLocaleDateString("en-GB") : "N/A"}
                        </p>



                        {/* Mobile info */}
                        <div className="flex flex-col gap-1 text-sm text-gray-600 sm:hidden mt-1">
                           <p>Start: {project.start_date || "N/A"}</p>
                           <p>End: {project.end_date || "N/A"}</p>
                           <p>Status: {project.status || "N/A"}</p>
                        </div>
                     </div>

                     {/* Action buttons */}
                     <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
                        <Button
                           size="sm"
                           variant="secondary"
                           onClick={() => handleEdit(project)}
                           className="p-2"
                        >
                           <Edit3 size={16} />
                        </Button>

                        <Button
                           size="sm"
                           variant="danger"
                           onClick={() => handleDelete(project.id || 0)}
                           className="p-2"
                        >
                           <Trash2 size={16} />
                        </Button>
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
               title="Company Projects"
               subtitle="View, manage, and track all company-wide projects."
            />
            <CardContent>
               <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                  <input
                     placeholder="Search projects..."
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
                        label: "Ongoing Projects",
                        icon: <></>,
                        color: "text-blue-500",
                        content: (
                           <>
                              {ongoingLoading ? (
                                 <div className="flex justify-center items-center h-32">
                                    <Loader2 className="animate-spin text-gray-500" />
                                 </div>
                              ) : (
                                 renderProjectList(filteredOngoing)
                              )}
                           </>
                        ),
                     },
                     {
                        key: "completed",
                        label: "Completed Projects",
                        icon: <></>,
                        color: "text-green-500",
                        content: (
                           <>
                              {ongoingLoading ? (
                                 <div className="flex justify-center items-center h-32">
                                    <Loader2 className="animate-spin text-gray-500" />
                                 </div>
                              ) : (
                                 renderProjectList(filteredCompleted)
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

         {/* Update Modal */}
         {isEditing && selectedProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
               <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto relative p-6">
                  <UpdateProjectPage
                     initialData={selectedProject}
                     employees={employees}
                     departments={[]} // TODO: replace with actual department list
                     onSubmit={handleUpdate}
                     onClose={() => {
                        setIsEditing(false);
                        setSelectedProject(null);
                     }}
                  />
               </div>
            </div>
         )}
      </div>
   );
}
