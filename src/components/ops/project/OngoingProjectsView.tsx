"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Plus, Search } from "lucide-react";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { getEmployeeId } from "@/lib/utils/auth";

import ProjectDetails from "./ProjectDetails";
import { UpdateProjectPage } from "./CreateNewProject";
import ProjectCard from "./ProjectCard";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadMore from "@/components/ui/LoadMore";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";

function ProjectsList({ setActiveTab }: { setActiveTab: (key: string) => void }) {
  const {
    ongoingProjects,
    fetchOngoingProjects,
    updateProject,
    deleteProject,
    hasMoreOngoingProjects,
    ongoingLoading,
    searchOngoingProjects,
  } = useProjects();

  const { employees, fetchEmployees } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();
  const router = useRouter();

  const [projectDetailsId, setProjectDetailsId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [searching, setSearching] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const hasFetched = useRef(false);

  /** Initialize user ID and fetch data */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const initData = async () => {
      const id = await getEmployeeId();
      setUserId(id);
      await fetchOngoingProjects(10, true);
      fetchEmployees();
      fetchDepartments();
      setInitialLoadComplete(true);
    };
    initData();
  }, []);

  /** Debounced Search */
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        setSearching(false);
        setShowEmpty(false);
        return;
      }
      setSearching(true);
      setShowEmpty(false);
      const results = await searchOngoingProjects(term, 20, false);
      setSearchResults(results);
      setSearching(false);
      
      // Show empty state after search completes if no results
      if (results.length === 0) {
        setTimeout(() => setShowEmpty(true), 100);
      }
    }, 400),
    [searchOngoingProjects]
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Hide empty state immediately when typing
    setShowEmpty(false);
    
    // If clearing search, reset immediately
    if (!term.trim()) {
      setSearchResults([]);
      setSearching(false);
      debouncedSearch.cancel();
    } else {
      debouncedSearch(term);
    }
  };

  const displayProjects = searchTerm ? searchResults : ongoingProjects;

  /** Empty state only after initial load is complete and not searching */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Only show empty if:
    // 1. Not currently searching
    // 2. Not loading
    // 3. Initial load complete
    // 4. No projects to display
    // 5. Not in the middle of typing (handled by handleSearchChange)
    if (
      initialLoadComplete && 
      !ongoingLoading && 
      !searching && 
      displayProjects.length === 0 &&
      (!searchTerm || searchResults.length === 0)
    ) {
      timer = setTimeout(() => setShowEmpty(true), 300);
    } else {
      setShowEmpty(false);
    }
    
    return () => clearTimeout(timer);
  }, [displayProjects.length, ongoingLoading, searching, initialLoadComplete, searchTerm, searchResults.length]);

  /** Update Project */
  const handleUpdateProject = async (values: Project) => {
    try {
      if (!values?.id) return;
      await updateProject(values.id, values);
      toast.success("Project updated successfully");
      setSelectedProject(null);
      if (values.status === "Completed") setActiveTab("completed");
      await fetchOngoingProjects(10, true);
    } catch (error) {
      toast.error("Error updating project");
      console.error(error);
    }
  };

  /** Create New Project */
  const handleCreateProject = () => {
    router.push("/ops/project?tab=create");
  };

  /** Delete Project */
  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
      await fetchOngoingProjects(10, true);
    } catch (error) {
      toast.error("Error deleting project");
      console.error(error);
    }
  };

  /** Pagination: Load More */
  const handleLoadMore = async () => {
    await fetchOngoingProjects(10, false);
  };

  return (
    <AnimatePresence mode="wait">
      {!selectedProject && !projectDetailsId && (
        <motion.div
          key="project-list"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="px-4 py-4 space-y-6"
        >
          {/* Search Bar */}
          <motion.div variants={fadeInUp} className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search projects..."
              className="w-full border rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
          </motion.div>

          {/* Loading below search bar */}
          {(ongoingLoading && !searchTerm && !searching && ongoingProjects.length === 0) && (
            <LoadingSection icon={Building2} text="Loading projects..." color="blue" />
          )}

          {/* Project Cards */}
          <motion.div variants={fadeInUp}>
            <AnimatePresence>
              {searching ? (
                <LoadingSection icon={Building2} text="Searching projects..." color="blue" />
              ) : displayProjects.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {displayProjects.map(
                      (project) =>
                        project.id && (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            employees={employees}
                            departments={departments.filter((d) => d.id != null) as any}
                            onEdit={() => setSelectedProject(project)}
                            onDelete={() => handleDeleteProject(project.id!)}
                            onDetails={() => setProjectDetailsId(project.id!)}
                            showEdit={project.created_by === userId}
                            showDelete={project.created_by === userId}
                            showDetails={true}
                          />
                        )
                    )}
                  </div>

                  {!searchTerm && (
                    <LoadMore
                      isLoading={ongoingLoading}
                      hasMore={hasMoreOngoingProjects}
                      onLoadMore={handleLoadMore}
                    />
                  )}
                </>
              ) : (
                showEmpty && (
                  <EmptyState
                    icon={<Building2 className="h-12 w-12" />}
                    title="No projects found"
                    description={
                      searchTerm 
                        ? "Try a different keyword or create a new project."
                        : "No ongoing projects available. Create one to get started."
                    }
                    action={{
                      label: "Create Project",
                      onClick: handleCreateProject,
                      icon: <Plus size={16} />,
                    }}
                  />
                )
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {/* Details View */}
      {!selectedProject && projectDetailsId && (
        <ProjectDetails
          id={projectDetailsId}
          employees={employees}
          departments={departments}
          onClose={() => setProjectDetailsId(null)}
          onSubmit={handleUpdateProject}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Update Form */}
      {!projectDetailsId && selectedProject && (
        <UpdateProjectPage
          initialData={selectedProject}
          employees={employees}
          departments={departments}
          onSubmit={handleUpdateProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </AnimatePresence>
  );
}

export default ProjectsList;