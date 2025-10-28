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
    return <LoadingSection 
          text="Loading notice details..."
          icon={AlertCircleIcon}
          color="blue"
          />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="text-amber-500" size={28} />
          Notice Details
        </h1>
        <Button
          variant="outline"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back
        </Button>
      </div>

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
    </motion.div>
  );
}
