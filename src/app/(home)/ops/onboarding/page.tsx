// app/(dashboard)/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { UserPlus, Loader, Check, X, AlertTriangle, Users, User, RefreshCw } from "@/lib/icons";
import { toast, Toaster } from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useEmployees } from "@/hooks/useEmployees";
import { useOnboarding, PendingEmployee } from "@/hooks/useOnboarding";
import { useDepartments } from "@/hooks/useDepartments";
import { ModulePermissionsBanner, PermissionGate, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

const Button = ({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`text-white rounded-lg px-4 py-2 text-sm font-semibold ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);

const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`w-full p-3 text-sm border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${className}`}
    {...props}
  />
);

export default function OnboardingApprovalPage() {
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});
  const { employees, fetchEmployees } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();
  const {
    loading,
    error,
    pendingEmployees,
    fetchPendingEmployees,
    processOnboardingAction,
    subscribeToOnboardingUpdates,
  } = useOnboarding();

  useEffect(() => {
    fetchPendingEmployees();
    fetchEmployees();
    fetchDepartments();

    // Set up polling for updates (replaces realtime)
    const unsubscribe = subscribeToOnboardingUpdates((payload) => {
      console.log("Onboarding list polled and updated!");
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInputChange = (id: string, value: string) => {
    setRejectionReasons((prev) => ({ ...prev, [id]: value }));
  };

  const handleAction = async (id: string, action: "ACCEPTED" | "REJECTED") => {
    const reason = rejectionReasons[id] || undefined;
    
    try {
      const result = await processOnboardingAction(id, action, reason);
      if (result.success) {
        toast.success(result.message);
        // Clear the rejection reason for this employee
        setRejectionReasons((prev) => {
          const { [id]: removed, ...rest } = prev;
          return rest;
        });
        // Refresh the list manually
        await fetchPendingEmployees();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchPendingEmployees();
      toast.success("List refreshed!");
    } catch (error) {
      toast.error("Failed to refresh list");
    }
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: {
        duration: 0.5,
        when: "beforeChildren"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const,
        stiffness: 260,
        damping: 20 
      } 
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        color="purple"
        text="Loading onboarding requests..."
        icon={UserPlus}
      />
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="w-full p-4 sm:p-6 lg:p-8"
    >
      <Toaster position="top-right" />
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground-primary flex items-center">
          <UserPlus className="mr-2 h-7 w-7 text-purple-600" />
          Employee Onboarding
        </h1>
      </motion.div>

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.ONBOARDING} title="Onboarding" compact />

      {pendingEmployees.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center p-10 bg-purple-50/50 rounded-xl border border-purple-100"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Users className="h-16 w-16 text-purple-300 mb-4" />
          </motion.div>
          <h3 className="text-xl font-medium text-foreground-secondary mb-2">No Pending Requests</h3>
          <p className="text-foreground-secondary text-center max-w-md">
            There are currently no pending onboarding requests that require approval.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          variants={contentVariants}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground-primary">New User Requests</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="text-sm text-foreground-tertiary">
                {pendingEmployees.length} request{pendingEmployees.length !== 1 ? 's' : ''} pending
              </div>
            </div>
          </div>

          {pendingEmployees.map((emp: PendingEmployee) => (
            <motion.div
              key={emp.id}
              variants={itemVariants}
              layout
              whileHover={{ 
                y: -4,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
              }}
              className="bg-surface-primary rounded-xl p-6 shadow-sm border border-border-primary space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground-primary">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-sm text-foreground-tertiary">{emp.designation}</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-white bg-purple-500 px-2 py-1 rounded-full">
                  New Request
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-tertiary">Department</span>
                    <span className="font-medium text-foreground-secondary">
                      {departments.find(d => d.id === emp.department_id)?.name || 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-tertiary">Phone</span>
                    <span className="font-medium text-foreground-secondary">{emp.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-tertiary">Email</span>
                    <span className="font-medium text-foreground-secondary">{emp.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-tertiary">Job Status</span>
                    <span className="font-medium text-foreground-secondary">{emp.job_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-tertiary">Joining Date</span>
                    <span className="font-medium text-foreground-secondary">
                      {new Date(emp.hire_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-tertiary">Supervisor</span>
                    <span className="font-medium text-foreground-secondary">
                      {employees.length > 0 && employees.filter((e) => e.id === emp.supervisor_id)[0]?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>

              <Textarea
                placeholder="Reason for rejection (required if rejecting)"
                value={rejectionReasons[emp.id] || ""}
                onChange={(e) => handleInputChange(emp.id, e.target.value)}
              />

              <div className="flex gap-4 justify-end">
                <PermissionGate 
                  module={PERMISSION_MODULES.ONBOARDING} 
                  action="can_approve"
                  fallback={
                    <PermissionTooltip message="You don't have permission to approve onboarding requests">
                      <div className="flex gap-4">
                        <button
                          disabled
                          className="bg-gray-300 text-foreground-tertiary rounded-lg px-4 py-2 text-sm font-semibold cursor-not-allowed opacity-60 flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          disabled
                          className="bg-gray-300 text-foreground-tertiary rounded-lg px-4 py-2 text-sm font-semibold cursor-not-allowed opacity-60 flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </button>
                      </div>
                    </PermissionTooltip>
                  }
                >
                  <Button
                    className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                    onClick={() => handleAction(emp.id, "REJECTED")}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                    onClick={() => handleAction(emp.id, "ACCEPTED")}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                </PermissionGate>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
