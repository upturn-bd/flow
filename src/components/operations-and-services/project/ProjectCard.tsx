import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Edit, Clock, Calendar, Building2, User } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface Employee {
  id: number | string;
  name: string;
}

interface Department {
  id: number | string;
  name: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit?: () => void;
  onDelete?: () => void;
  onDetails?: () => void;
  employees: Employee[];
  departments: Department[];
  isDeleting?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showDetails?: boolean;
  progressColor?: string;
  statusIcon?: React.ReactNode;
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onDetails,
  employees,
  departments,
  isDeleting = false,
  showEdit = false,
  showDelete = false,
  showDetails = false,
  progressColor = "bg-blue-100 text-blue-800",
  statusIcon = null,
}: ProjectCardProps) {
  const {
    id,
    project_title,
    project_lead_id,
    department_id,
    end_date,
    progress,
    description,
  } = project;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {statusIcon}
          <h2 className="text-lg font-semibold text-gray-800">
            {project_title}
          </h2>
        </div>
        <div className="flex gap-2">
          {showEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="p-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-700"
            >
              <Edit size={16} strokeWidth={2} />
            </Button>
          )}
          {showDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              isLoading={isDeleting}
              className="p-1 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500"
            >
              <Trash2 size={16} strokeWidth={2} />
            </Button>
          )}
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDetails}
              className="p-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-700"
            >
              <ExternalLink size={16} strokeWidth={2} />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 size={16} className="text-gray-500" strokeWidth={1.5} />
          <span className="font-medium">Department:</span>
          <span>
            {departments.find((d) => d.id === department_id)?.name || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} className="text-gray-500" strokeWidth={1.5} />
          <span className="font-medium">Lead:</span>
          <span>
            {employees.find((e) => e.id === project_lead_id)?.name || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} className="text-gray-500" strokeWidth={1.5} />
          <span className="font-medium">Progress:</span>
          <span className={`${progressColor} px-2 py-0.5 rounded-full text-xs`}>
            {typeof progress === "number" ? `${progress}%` : progress || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} className="text-gray-500" strokeWidth={1.5} />
          <span className="font-medium">Deadline:</span>
          <span>{end_date}</span>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        <p>{description}</p>
      </div>
    </motion.div>
  );
} 