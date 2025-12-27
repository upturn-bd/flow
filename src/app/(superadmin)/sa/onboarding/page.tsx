"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, User, Building, Check, X, ArrowsClockwise, DeviceMobile, Calendar, Envelope, Phone, Briefcase } from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, EmptyState, InlineSpinner } from "@/components/ui";

interface PendingDevice {
  id: string;
  device_info: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  model: string | null;
}

interface PendingEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: number;
  designation: string;
  job_status: string;
  hire_date: string;
  supervisor_id: string;
  company_id: number;
  has_approval: string;
  rejection_reason?: string;
  company?: {
    name: string;
  } | null;
  department?: {
    name: string;
  } | null;
  supervisor?: {
    first_name: string;
    last_name: string;
  } | null;
  pending_device?: PendingDevice | null;
}

const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`w-full p-3 text-sm border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-surface-primary text-foreground-primary placeholder:text-foreground-tertiary ${className}`}
    {...props}
  />
);

export default function SAOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const fetchPendingEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          designation,
          job_status,
          hire_date,
          supervisor_id,
          company_id,
          has_approval,
          rejection_reason,
          company:companies!inner(name),
          department:departments(name),
          supervisor:employees!employees_supervisor_id_fkey(first_name, last_name)
        `)
        .eq("has_approval", "PENDING")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch pending device info for each employee and normalize the data
      const employeesWithDevices = await Promise.all(
        (data || []).map(async (emp: any) => {
          const { data: deviceData } = await supabase
            .from("user_devices")
            .select("id, device_info, browser, os, device_type, model")
            .eq("user_id", emp.id)
            .eq("status", "pending")
            .maybeSingle();

          return {
            ...emp,
            company: Array.isArray(emp.company) ? emp.company[0] : emp.company,
            department: Array.isArray(emp.department) ? emp.department[0] : emp.department,
            supervisor: Array.isArray(emp.supervisor) ? emp.supervisor[0] : emp.supervisor,
            pending_device: deviceData || null
          };
        })
      );

      setPendingEmployees(employeesWithDevices);
    } catch (error: any) {
      console.error("Error fetching pending employees:", error);
      toast.error("Failed to fetch pending employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingEmployees();

    // Set up polling for updates
    const intervalId = setInterval(fetchPendingEmployees, 30000);
    return () => clearInterval(intervalId);
  }, [fetchPendingEmployees]);

  const handleInputChange = (id: string, value: string) => {
    setRejectionReasons((prev) => ({ ...prev, [id]: value }));
  };

  const handleAction = async (id: string, action: "ACCEPTED" | "REJECTED") => {
    const reason = rejectionReasons[id] || undefined;

    if (action === "REJECTED" && !reason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(id);
    try {
      // Update employee approval status
      const { data: updateData, error: updateError } = await supabase
        .from("employees")
        .update({
          has_approval: action,
          rejection_reason: action === "REJECTED" ? reason : null,
        })
        .eq("id", id)
        .select("supervisor_id, company_id")
        .single();

      if (updateError) throw updateError;

      // If accepted, also approve any pending devices for this employee
      if (action === "ACCEPTED") {
        const { error: deviceError } = await supabase
          .from("user_devices")
          .update({ status: "approved" })
          .eq("user_id", id)
          .eq("status", "pending");

        if (deviceError) {
          console.error("Error approving device:", deviceError);
        }
      }

      // If accepted and has supervisor, add to supervisor_employees
      if (action === "ACCEPTED" && updateData.supervisor_id && updateData.supervisor_id !== "Not Applicable") {
        const { error: supervisorError } = await supabase
          .from("supervisor_employees")
          .insert({
            supervisor_id: updateData.supervisor_id,
            employee_id: id,
            company_id: updateData.company_id,
          });

        if (supervisorError) {
          console.error("Error adding supervisor relationship:", supervisorError);
        }
      }

      toast.success(`Employee ${action.toLowerCase()} successfully`);
      
      // Clear the rejection reason for this employee
      setRejectionReasons((prev) => {
        const { [id]: removed, ...rest } = prev;
        return rest;
      });

      // Refresh the list
      await fetchPendingEmployees();
    } catch (error: any) {
      console.error("Error processing onboarding:", error);
      toast.error(error.message || "Failed to process request");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <InlineSpinner size="xl" color="primary" className="mb-4" />
          <p className="text-foreground-tertiary">Loading onboarding requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Onboarding"
        description="Review and approve pending employee onboarding requests across all companies"
        icon={UserPlus}
        iconColor="text-primary-600"
        action={{
          label: "Refresh",
          onClick: fetchPendingEmployees,
          icon: ArrowsClockwise,
          variant: "secondary"
        }}
      />

      {pendingEmployees.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No Pending Requests"
          description="There are currently no pending onboarding requests that require approval."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-foreground-primary">
              Pending Requests
            </h2>
            <div className="text-sm text-foreground-tertiary">
              {pendingEmployees.length} request{pendingEmployees.length !== 1 ? 's' : ''} pending
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {pendingEmployees.map((emp: PendingEmployee) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-surface-primary rounded-xl p-6 shadow-sm border border-border-primary space-y-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground-primary">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <p className="text-sm text-foreground-secondary">{emp.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-white dark:text-foreground-primary bg-primary-500 dark:bg-primary-500/20 px-2 py-1 rounded-full">
                      New Request
                    </div>
                    <div className="flex items-center gap-1 text-xs text-foreground-tertiary bg-background-secondary px-2 py-1 rounded-full">
                      <Building className="h-3 w-3" />
                      {emp.company?.name || 'Unknown Company'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-tertiary flex items-center gap-1">
                        <Envelope className="h-4 w-4" />
                        Email
                      </span>
                      <span className="font-medium text-foreground-secondary">{emp.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-tertiary flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone
                      </span>
                      <span className="font-medium text-foreground-secondary">{emp.phone_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-tertiary flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        Department
                      </span>
                      <span className="font-medium text-foreground-secondary">
                        {emp.department?.name || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-tertiary flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        Job Status
                      </span>
                      <span className="font-medium text-foreground-secondary">{emp.job_status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-tertiary flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joining Date
                      </span>
                      <span className="font-medium text-foreground-secondary">
                        {new Date(emp.hire_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-tertiary flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Supervisor
                      </span>
                      <span className="font-medium text-foreground-secondary">
                        {emp.supervisor ? `${emp.supervisor.first_name} ${emp.supervisor.last_name}` : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device Information Section */}
                {emp.pending_device && (
                  <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="flex items-center gap-2 mb-2">
                      <DeviceMobile className="h-4 w-4 text-primary-600" weight="duotone" />
                      <span className="text-sm font-medium text-foreground-primary">Pending Device</span>
                      <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/50 px-2 py-0.5 rounded-full">
                        Auto-approves on accept
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {emp.pending_device.browser && (
                        <div>
                          <span className="text-foreground-tertiary">Browser: </span>
                          <span className="font-medium text-foreground-secondary">{emp.pending_device.browser}</span>
                        </div>
                      )}
                      {emp.pending_device.os && (
                        <div>
                          <span className="text-foreground-tertiary">OS: </span>
                          <span className="font-medium text-foreground-secondary">{emp.pending_device.os}</span>
                        </div>
                      )}
                      {emp.pending_device.device_type && (
                        <div>
                          <span className="text-foreground-tertiary">Type: </span>
                          <span className="font-medium text-foreground-secondary capitalize">{emp.pending_device.device_type}</span>
                        </div>
                      )}
                      {emp.pending_device.model && emp.pending_device.model !== 'Desktop Computer' && (
                        <div>
                          <span className="text-foreground-tertiary">Model: </span>
                          <span className="font-medium text-foreground-secondary">{emp.pending_device.model}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Textarea
                  placeholder="Reason for rejection (required if rejecting)"
                  value={rejectionReasons[emp.id] || ""}
                  onChange={(e) => handleInputChange(emp.id, e.target.value)}
                  rows={2}
                />

                <div className="flex gap-3 justify-end">
                  <button
                    className="bg-error hover:bg-error/90 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAction(emp.id, "REJECTED")}
                    disabled={processing !== null}
                  >
                    {processing === emp.id ? (
                      <InlineSpinner size="sm" color="white" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Reject
                  </button>
                  <button
                    className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAction(emp.id, "ACCEPTED")}
                    disabled={processing !== null}
                  >
                    {processing === emp.id ? (
                      <InlineSpinner size="sm" color="white" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Accept
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
