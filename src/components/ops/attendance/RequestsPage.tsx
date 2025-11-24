"use client";

import { Attendance } from "@/hooks/useAttendance";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  User,
  Building,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  User2
} from "lucide-react";
import {
  formatTimeFromISO,
  formatDateToDayMonth,
} from "@/lib/utils";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useEmployeesContext } from "@/contexts";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormSelectField from "@/components/ui/FormSelectField";
import { toast } from "sonner";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useNotifications } from "@/hooks/useNotifications";

export default function AttendanceRequestsPage() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const { sites, fetchSites } = useSites();
  const { employees } = useEmployees();
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [updateTag, setUpdateTag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createNotification } = useNotifications();

  async function fetchAttendanceData() {
    setLoading(true);

    const user = await getEmployeeInfo();
    console.log(user.supervisor_id)
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(
          "id, check_in_time, check_out_time, site_id, attendance_date, employee_id, check_out_coordinates, check_in_coordinates, tag"
        )
        .eq("company_id", user.company_id)
        .eq("tag", "Pending")
        .eq("supervisor_id", user.supervisor_id)
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data ?? []);
    } catch (error) {
      console.log("Error fetching attendance data:", error);
      toast.error("Failed to load attendance requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!updateTag || !selectedRecord) return;

    setIsSubmitting(true);
    const user = await getEmployeeInfo();

    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({ tag: updateTag })
        .eq("company_id", user.company_id)
        .eq("id", selectedRecord?.id);

      if (error) throw error;

      const recipients = [selectedRecord.employee_id].filter(Boolean) as string[];
      createNotification({
        title: "Attendance Request Updated",
        message: `Your attendance request for ${formatDateToDayMonth(selectedRecord.attendance_date)} has been updated to status: ${updateTag}.`,
        priority: 'normal',
        type_id: 5,
        recipient_id: recipients,
        action_url: '/ops/attendance',
        company_id: user.company_id,
        department_id: user.department_id
      });


      toast.success("Attendance request updated successfully");
      fetchAttendanceData();
      setSelectedRecord(null);
      setUpdateTag("");
    } catch (error) {
      console.error("Error updating attendance data:", error);
      toast.error("Failed to update attendance request");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetchAttendanceData();
    fetchSites();
    
  }, []);

  if (loading) {
    return <LoadingSection
      text="Loading attendance requests..."
      icon={User2}
      color="blue"
    />;
  }

  return (
    <div className="space-y-6">
      {attendanceData.length > 0 ? (
        <div className="space-y-4">
          {attendanceData.map((entry) => (
            <AttendanceRequestCard
              key={entry.id}
              entry={entry}
              sites={sites}
              employees={employees}
              onReview={() => setSelectedRecord(entry)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="w-12 h-12" />}
          title="No pending attendance requests"
          description="All attendance records have been reviewed."
        />
      )}

      {/* Review Modal */}
      <BaseModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Review Attendance Request"
        icon={<Clock size={20} />}
      >
        {selectedRecord && (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-4">
              <InfoRow
                icon={<User size={16} />}
                label="Employee"
                value={employees.find(emp => emp.id === selectedRecord.employee_id)?.name || "Unknown"}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label="Date"
                value={formatDateToDayMonth(selectedRecord.attendance_date)}
              />
              <InfoRow
                icon={<Clock size={16} />}
                label="Time"
                value={`${selectedRecord.check_in_time ? formatTimeFromISO(selectedRecord.check_in_time) : 'N/A'} - ${selectedRecord.check_out_time ? formatTimeFromISO(selectedRecord.check_out_time) : 'N/A'}`}
              />
              <InfoRow
                icon={<Building size={16} />}
                label="Site"
                value={sites.find(site => site.id === selectedRecord.site_id)?.name || "Unknown"}
              />
            </div>

            <FormSelectField
              name="status"
              label="Update Status"
              icon={<AlertCircle size={18} />}
              value={updateTag}
              onChange={(e) => setUpdateTag(e.target.value)}
              placeholder="Select new status"
              options={[
                { value: "Present", label: "Present" },
                { value: "Absent", label: "Absent" },
                { value: "Late", label: "Late" },
                { value: "Wrong_Location", label: "Wrong Location" },
              ]}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRecord(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!updateTag || isSubmitting}
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </BaseModal>
    </div>
  );
}

function AttendanceRequestCard({
  entry,
  sites,
  employees,
  onReview
}: {
  entry: Attendance;
  sites: any[];
  employees: any[];
  onReview: () => void;
}) {
  const employee = employees.find(emp => emp.id === entry.employee_id);
  const site = sites.find(site => site.id === entry.site_id);

  const getLocationLink = (coordinates: { x: number; y: number } | null) => {
    if (!coordinates) return null;
    return `https://www.openstreetmap.org/?mlat=${coordinates.x}&mlon=${coordinates.y}`;
  };

  const actions = (
    <Button
      variant="primary"
      size="sm"
      onClick={onReview}
      className="flex items-center gap-2"
    >
      <CheckCircle size={14} />
      Review
    </Button>
  );

  return (
    <Card>
      <CardHeader
        title={`${employee?.name || "Unknown Employee"}`}
        subtitle={formatDateToDayMonth(entry.attendance_date)}
        icon={<Clock size={20} className="text-blue-500" />}
        action={actions}
      />

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <InfoRow
            icon={<Building size={16} />}
            label="Site"
            value={site?.name || "Unknown Site"}
          />
          <InfoRow
            icon={<Clock size={16} />}
            label="Check-in / Check-out"
            value={`${entry.check_in_time ? formatTimeFromISO(entry.check_in_time) : 'N/A'} - ${entry.check_out_time ? formatTimeFromISO(entry.check_out_time) : 'N/A'}`}
          />
        </div>

        <div className="space-y-2">
          <StatusBadge status="Pending Review" variant="warning" size="sm" />

          <div className="flex items-center gap-4 text-sm">
            {entry.check_in_coordinates && (
              <a
                href={getLocationLink(entry.check_in_coordinates) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <MapPin size={14} />
                Check-in Location
                <ExternalLink size={12} />
              </a>
            )}
            {entry.check_out_coordinates && (
              <a
                href={getLocationLink(entry.check_out_coordinates) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <MapPin size={14} />
                Check-out Location
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
