"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Calendar, MapPin, User, Building, Clock, ArrowSquareOut, CheckCircle, WarningCircle, Note } from "@phosphor-icons/react";
import {
  formatTimeFromISO,
  formatDateToDayMonth,
} from "@/lib/utils";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormSelectField from "@/components/ui/FormSelectField";
import { toast } from "sonner";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useNotifications } from "@/hooks/useNotifications";

interface AttendanceRequest {
  id: number;
  attendance_record_id: number;
  employee_id: string;
  supervisor_id: string | null;
  company_id: number;
  request_type: 'late' | 'wrong_location';
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  attendance_record: {
    check_in_time: string | null;
    check_out_time: string | null;
    site_id: number;
    attendance_date: string;
    check_in_coordinates: { x: number; y: number } | null;
    check_out_coordinates: { x: number; y: number } | null;
  };
}

export default function AttendanceRequestsPage() {
  const [requestsData, setRequestsData] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { sites, fetchSites } = useSites();
  const { employees, fetchEmployees } = useEmployees();
  const [selectedRequest, setSelectedRequest] = useState<AttendanceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createNotification } = useNotifications();

  async function fetchRequestsData() {
    setLoading(true);

    const user = await getEmployeeInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_requests")
        .select(`
          id,
          attendance_record_id,
          employee_id,
          supervisor_id,
          company_id,
          request_type,
          status,
          reason,
          created_at,
          reviewed_at,
          reviewed_by,
          attendance_record:attendance_records!attendance_record_id (
            check_in_time,
            check_out_time,
            site_id,
            attendance_date,
            check_in_coordinates,
            check_out_coordinates
          )
        `)
        .eq("company_id", user.company_id)
        .eq("status", "pending")
        .eq("supervisor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequestsData((data as any) ?? []);
    } catch (error) {
      console.log("Error fetching attendance requests:", error);
      toast.error("Failed to load attendance requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!updateStatus || !selectedRequest) return;

    setIsSubmitting(true);
    const user = await getEmployeeInfo();

    try {
      // Update the request status
      const { error: requestError } = await supabase
        .from("attendance_requests")
        .update({ 
          status: updateStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq("id", selectedRequest.id);

      if (requestError) throw requestError;

      // Update the attendance record tag based on approval
      if (updateStatus === 'approved') {
        const { error: recordError } = await supabase
          .from("attendance_records")
          .update({ tag: 'Present' })
          .eq("id", selectedRequest.attendance_record_id);

        if (recordError) throw recordError;
      }
      // If rejected, leave the tag as is (Late or Wrong_Location)

      const recipients = [selectedRequest.employee_id].filter(Boolean) as string[];
      createNotification({
        title: "Attendance Request Updated",
        message: `Your ${selectedRequest.request_type === 'late' ? 'late arrival' : 'wrong location'} request has been ${updateStatus}.`,
        priority: 'normal',
        type_id: 5,
        recipient_id: recipients,
        action_url: '/ops/attendance',
        company_id: user.company_id,
        department_id: user.department_id
      });

      toast.success("Attendance request updated successfully");
      fetchRequestsData();
      setSelectedRequest(null);
      setUpdateStatus("");
    } catch (error) {
      console.error("Error updating attendance request:", error);
      toast.error("Failed to update attendance request");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    fetchRequestsData();
    fetchSites();
    fetchEmployees();
  }, []);

  if (loading) {
    return <LoadingSection
      text="Loading attendance requests..."
      icon={User}
      color="blue"
    />;
  }

  return (
    <div className="space-y-6">
      {requestsData.length > 0 ? (
        <div className="space-y-4">
          {requestsData.map((request) => (
            <AttendanceRequestCard
              key={request.id}
              request={request}
              sites={sites}
              employees={employees}
              onReview={() => setSelectedRequest(request)}
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
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Review Attendance Request"
        icon={<Clock size={20} />}
        data-testid="review-attendance-modal"
      >
        {selectedRequest && (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-4">
              <InfoRow
                icon={<User size={16} />}
                label="Employee"
                value={employees.find(emp => emp.id === selectedRequest.employee_id)?.name || "Unknown"}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label="Date"
                value={formatDateToDayMonth(selectedRequest.attendance_record.attendance_date)}
              />
              <InfoRow
                icon={<Clock size={16} />}
                label="Check-in Time"
                value={selectedRequest.attendance_record.check_in_time ? formatTimeFromISO(selectedRequest.attendance_record.check_in_time) : 'N/A'}
              />
              <InfoRow
                icon={<Building size={16} />}
                label="Site"
                value={sites.find(site => site.id === selectedRequest.attendance_record.site_id)?.name || "Unknown"}
              />
              <InfoRow
                icon={<WarningCircle size={16} />}
                label="Request Type"
                value={selectedRequest.request_type === 'late' ? 'Late Arrival' : 'Wrong Location'}
              />
              {selectedRequest.reason && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                    <Note size={16} />
                    Reason
                  </div>
                  <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary">
                    <p className="text-sm text-foreground-primary whitespace-pre-wrap">
                      {selectedRequest.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <FormSelectField
              name="status"
              label="Decision"
              icon={<CheckCircle size={18} />}
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              placeholder="Select decision"
              data-testid="attendance-status-select"
              options={[
                { value: "approved", label: "Approve" },
                { value: "rejected", label: "Reject" },
              ]}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!updateStatus || isSubmitting}
                isLoading={isSubmitting}
              >
                Submit Decision
              </Button>
            </div>
          </form>
        )}
      </BaseModal>
    </div>
  );
}

function AttendanceRequestCard({
  request,
  sites,
  employees,
  onReview
}: {
  request: AttendanceRequest;
  sites: any[];
  employees: any[];
  onReview: () => void;
}) {
  const employee = employees.find(emp => emp.id === request.employee_id);
  const site = sites.find(site => site.id === request.attendance_record.site_id);

  const getLocationLink = (coordinates: { x: number; y: number } | null) => {
    if (!coordinates) return null;
    return `https://www.openstreetmap.org/?mlat=${coordinates.x}&mlon=${coordinates.y}`;
  };

  const getRequestTypeLabel = (type: 'late' | 'wrong_location') => {
    return type === 'late' ? 'Late Arrival' : 'Wrong Location';
  };

  const getRequestTypeVariant = (type: 'late' | 'wrong_location') => {
    return type === 'late' ? 'warning' : 'error';
  };

  const actions = (
    <Button
      data-testid="review-attendance-button"
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
        subtitle={formatDateToDayMonth(request.attendance_record.attendance_date)}
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
            label="Check-in Time"
            value={request.attendance_record.check_in_time ? formatTimeFromISO(request.attendance_record.check_in_time) : 'N/A'}
          />
        </div>

        <div className="space-y-3">
          <StatusBadge 
            status={getRequestTypeLabel(request.request_type)} 
            variant={getRequestTypeVariant(request.request_type)} 
            size="sm" 
          />

          {request.reason && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                <Note size={14} />
                Employee's Reason
              </div>
              <div className="p-3 bg-surface-secondary rounded-lg border border-border-primary">
                <p className="text-sm text-foreground-primary whitespace-pre-wrap line-clamp-3">
                  {request.reason}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm flex-wrap">
            {request.attendance_record.check_in_coordinates && (
              <a
                href={getLocationLink(request.attendance_record.check_in_coordinates) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <MapPin size={14} />
                Check-in Location
                <ArrowSquareOut size={12} />
              </a>
            )}
            {request.attendance_record.check_out_coordinates && (
              <a
                href={getLocationLink(request.attendance_record.check_out_coordinates) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <MapPin size={14} />
                Check-out Location
                <ArrowSquareOut size={12} />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
