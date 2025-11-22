import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, StatusBadge, InfoRow } from "@/components/ui/Card";
import { ExternalLink, Trash2, Edit, Clock, Calendar, Building2, User, Target } from "lucide-react";
import { Project } from "@/hooks/useProjects";
import Link from "next/link";
import { Employee } from "@/lib/types/schemas";

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
    department_ids,
    end_date,
    progress,
    description,
  } = project;

  const getProgressVariant = (progress: string | number) => {
    if (typeof progress === 'number') {
      if (progress >= 80) return 'success';
      if (progress >= 50) return 'info';
      if (progress >= 25) return 'warning';
      return 'error';
    }
    return 'info';
  };

  const actions = (
    <div className="flex items-center gap-2">
      {showEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
        >
          <Edit size={14} />
        </Button>
      )}
      {showDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          isLoading={isDeleting}
          className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </Button>
      )}
      {showDetails && (
        <Link href={`/ops/project/${id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 hover:bg-gray-50 hover:text-gray-700"
          >
            <ExternalLink size={14} />
          </Button>

        </Link>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader
        title={project_title}
        icon={statusIcon}
        action={actions}
      />

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow
            icon={<Building2 size={16} />}
            label="Departments"
            value={
              project.department_ids && project.department_ids.length > 0
                ? project.department_ids
                  .map((id) => departments.find((d) => d.id === id)?.name || "N/A")
                  .join(", ")
                : "N/A"
            }
          />

          <InfoRow
            icon={<User size={16} />}
            label="Lead"
            value={employees.find((e) => e.id === project_lead_id)?.name || "N/A"}
          />
          <InfoRow
            icon={<Target size={16} />}
            label="Progress"
            value={
              <StatusBadge
                status={typeof progress === "number" ? `${progress}%` : progress || "N/A"}
                variant={getProgressVariant(progress || 0)}
              />
            }
          />
          <InfoRow
            icon={<Calendar size={16} />}
            label="Deadline"
            value={end_date || "Not set"}
          />
        </div>

        {description && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 