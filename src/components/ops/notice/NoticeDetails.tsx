import { useDepartments } from "@/hooks/useDepartments";
import { useEffect, useState } from "react";
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
import { useNotices, useNoticeTypes } from "@/hooks/useNotice";
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
  const { noticeType, loading: loadingNoticeType,fetchNoticeType } = useNoticeTypes();
  const { department, loading: loadingDepartment,fetchDepartment } = useDepartments();
  const { notice, fetchNotice, loading: loadingNotice } = useNotices();

  useEffect(() => {
    if (id !== null) {
      const fetchNoticeDetails = async function (id: string) {
        try {
          await fetchNotice(id);

        } catch (error) {
          setError("Error fetching notice details");
          toast.error("Error fetching notice details");
          console.error(error);
        }
      };
      fetchNoticeDetails(id.toString());
    }
  }, [id]);

  useEffect(() => {
    if(!notice) return;
    fetchNoticeType(notice?.notice_type_id || "");
    fetchDepartment(notice?.department_id || "");
  }, [notice]);

  if (loadingNotice || loadingNoticeType || loadingDepartment) {
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
                  const u = notice?.urgency ?? "low";
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
