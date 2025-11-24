import { useDepartmentsContext, useNoticesContext } from "@/contexts";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Loader2,
  XCircle,
  Calendar,
  Bell,
  AlertCircle,
  Building2,
  FileText,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useNoticeTypes } from "@/hooks/useNotice";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow, PriorityBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import BaseModal from "@/components/ui/modals/BaseModal";
import { EmptyState } from "@/components/ui/EmptyState";

interface NoticeDetailsProps {
  id: number;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";

  const [year, month, dayStr] = dateStr.split("-");
  const day = parseInt(dayStr, 10);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = months[parseInt(month, 10) - 1];

  return `${day} ${monthName}, ${year}`;
}

export default function NoticeDetails({ id, onClose }: NoticeDetailsProps) {
  const [error, setError] = useState<string | null>(null);
  const { noticeType, loading: loadingNoticeType, fetchNoticeType } = useNoticeTypes();
  const { departments, loading: departmentsLoading, getDepartmentById, fetchDepartments } = useDepartmentsContext();
  const { notices, loading: loadingNotices, fetchNotices } = useNoticesContext();
  
  // Get the specific notice from context
  const notice = useMemo(() => notices.find(n => n.id === id), [notices, id]);
  
  // Get the department for this notice
  const department = useMemo(() => {
    if (!notice?.department_id) return null;
    return getDepartmentById(notice.department_id);
  }, [notice?.department_id, getDepartmentById]);

  // Fetch notices if not already loaded
  useEffect(() => {
    if (!loadingNotices && notices.length === 0) {
      fetchNotices().catch((err) => {
        setError("Error fetching notices");
        toast.error("Error fetching notices");
        console.error(err);
      });
    }
  }, []);
  
  // Fetch departments if not already loaded
  useEffect(() => {
    if (!departmentsLoading.fetching && departments.length === 0) {
      fetchDepartments();
    }
  }, []);

  useEffect(() => {
    if (notice?.notice_type_id) {
      fetchNoticeType(notice.notice_type_id.toString());
    }
  }, [notice?.notice_type_id, fetchNoticeType]);

  if (loadingNotices || loadingNoticeType || departmentsLoading.fetching) {
    return (
      <BaseModal
        isOpen={true}
        onClose={onClose}
        title="Notice Details"
        icon={<Bell size={24} />}
        size="xl"
      >
        <LoadingSection 
          text="Loading notice details..."
          icon={AlertCircleIcon}
          color="blue"
        />
      </BaseModal>
    );
  }

  if (error) {
    return (
      <BaseModal
        isOpen={true}
        onClose={onClose}
        title="Notice Details"
        icon={<Bell size={24} />}
        size="xl"
      >
        <EmptyState
          icon={<XCircle className="h-12 w-12" />}
          title="Error loading notice"
          description={error}
          action={{
            label: "Go back",
            onClick: onClose,
            icon: <ChevronLeft size={16} />
          }}
        />
      </BaseModal>
    );
  }

  if (!notice) {
    return (
      <EmptyState 
        icon={<Bell className="h-12 w-12" />}
        title="Notice not found"
        description="The requested notice could not be found"
        action={{
          label: "Go back",
          onClick: onClose,
          icon: <ChevronLeft size={16} />
        }}
      />
    );
  }

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Notice Details"
      icon={<Bell size={24} />}
      size="xl"
    >
      <div className="space-y-6">
      {/* Main Notice Card */}
      <Card variant="elevated">
        <CardHeader
          title={notice?.title || "Untitled Notice"}
          icon={<AlertCircle size={20} className="text-amber-500" />}
          action={
            <PriorityBadge
              priority={
                (() => {
                  const u = notice?.urgency ?? "Low";
                  const key = String(u).toLowerCase();
                  if (key === "urgent") return "urgent";
                  if (key === "high") return "high";
                  if (key === "medium" || key === "normal") return "normal";
                  return "low";
                })()
              }
            />
          }
        />
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <InfoRow
              icon={<FileText size={16} />}
              label="Notice Type"
              value={
                <StatusBadge 
                  status={noticeType?.name || "Unknown"} 
                  variant="info" 
                  size="sm" 
                />
              }
            />
            <InfoRow
              icon={<Building2 size={16} />}
              label="Department"
              value={
                <StatusBadge 
                  status={department?.name || "Unknown"} 
                  variant="info" 
                  size="sm" 
                />
              }
            />
            <InfoRow
              icon={<Calendar size={16} />}
              label="Valid From"
              value={formatDate(notice?.valid_from || "")}
            />
            <InfoRow
              icon={<Calendar size={16} />}
              label="Valid Till"
              value={formatDate(notice?.valid_till || "")}
            />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Description</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {notice?.description || "No description provided."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </BaseModal>
  );
}
