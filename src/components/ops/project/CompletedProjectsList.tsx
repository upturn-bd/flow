"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { toast } from "sonner";
import { CheckCircle, Search } from "lucide-react";

import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Project, useProjects } from "@/hooks/useProjects";
import { getEmployeeId } from "@/lib/utils/auth";

import ProjectDetails from "./ProjectDetails";
import ProjectCard from "./ProjectCard";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadMore from "@/components/ui/LoadMore";
import { fadeInUp, staggerContainer } from "@/components/ui/animations";

function CompletedProjectsList({ setActiveTab }: { setActiveTab: (key: string) => void }) {
  const {
    completedProjects,
    fetchCompletedProjects,
    updateProject,
    deleteProject,
    hasMoreCompletedProjects,
    completedLoading,
    searchCompletedProjects,
  } = useProjects();

  const { employees, fetchEmployees } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();

  const [projectDetailsId, setProjectDetailsId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [searching, setSearching] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Prevent duplicate fetches
  const hasFetched = useRef(false);

  /** Initialize user ID and fetch data */
  useEffect(() => {
    // Prevent duplicate calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    const initData = async () => {
      const id = await getEmployeeId();
      setUserId(id);
      await fetchCompletedProjects(10, true);
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
      const results = await searchCompletedProjects(term, 20, false);
      setSearchResults(results);
      setSearching(false);
    }, 400),
    [searchCompletedProjects]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const displayProjects = searchTerm ? searchResults : completedProjects;

  /** Empty state only after initial load is complete */
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Only show empty state after initial load is complete
    if (initialLoadComplete && !completedLoading && !searching && displayProjects.length === 0) {
      timer = setTimeout(() => setShowEmpty(true), 300);
    } else {
      setShowEmpty(false);
    }

    return () => clearTimeout(timer);
  }, [displayProjects.length, completedLoading, searching, initialLoadComplete]);

  /** Update Project */
  const handleUpdateProject = async (values: Project) => {
    try {
      if (!values?.id) return;
      await updateProject(values.id, values);
      toast.success("Project updated successfully");
      setSelectedProject(null);
      if (values.status === "Ongoing") setActiveTab("ongoing");
      await fetchCompletedProjects(10, true);
    } catch (error) {
      toast.error("Error updating project");
      console.error(error);
    }
  };

  /** Delete Project */
  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
      await fetchCompletedProjects(10, true);
    } catch (error) {
      toast.error("Error deleting project");
      console.error(error);
    }
  };

  /** Pagination: Load More */
  const handleLoadMore = async () => {
    await fetchCompletedProjects(10, false);
  };

  /** Loading on first load only */
  if (!initialLoadComplete && completedLoading && completedProjects.length === 0) {
    return <LoadingSection icon={CheckCircle} text="Loading completed projects..." color="blue" />;
  }

  return (
    <AnimatePresence mode="wait">
      {!selectedProject && !projectDetailsId && (
        <motion.div
          key="completed-project-list"
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
              placeholder="Search completed projects..."
              className="w-full border rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
          </motion.div>

          {/* Project Cards */}
          <motion.div variants={fadeInUp}>
            <AnimatePresence>
              {searching ? (
                <LoadingSection icon={CheckCircle} text="Searching completed projects..." color="blue" />
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
                            onEdit={undefined}
                            onDelete={() => handleDeleteProject(project.id!)}
                            onDetails={() => setProjectDetailsId(project.id!)}
                            showEdit={false}
                            showDelete={project.created_by === userId}
                            showDetails={true}
                            statusIcon={
                              <CheckCircle
                                size={18}
                                className="text-green-500 mt-1 flex-shrink-0"
                              />
                            }
                            progressColor="bg-green-100 text-green-800"
                          />
                        )
                    )}
                  </div>

                  {!searchTerm && (
                    <LoadMore
                      isLoading={completedLoading}
                      hasMore={hasMoreCompletedProjects}
                      onLoadMore={handleLoadMore}
                    />
                  )}
                </>
              ) : (
                showEmpty && (
                  <EmptyState
                    icon={<CheckCircle className="h-12 w-12" />}
                    title={searchTerm ? "No matching projects" : "No completed projects yet"}
                    description={
                      searchTerm
                        ? "Try a different keyword."
                        : "Projects will appear here once they're marked as complete."
                    }
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
    </AnimatePresence>
  );
}

export default CompletedProjectsList;