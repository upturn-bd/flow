"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  DeviceMobile, 
  Desktop, 
  Check, 
  X, 
  ArrowLeft,
  ArrowsClockwise,
  Clock,
  Warning,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDevices, DeviceRequest } from "@/hooks/useDevices";
import { ModulePermissionsBanner, PermissionGate, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

const Button = ({
  children,
  className,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${className} ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </motion.button>
);

export default function DevicesPage() {
  const router = useRouter();
  const {
    loading,
    pendingDevices,
    fetchPendingDevices,
    updateDeviceStatus,
  } = useDevices();

  useEffect(() => {
    fetchPendingDevices();
  }, [fetchPendingDevices]);

  const handleAction = async (
    deviceId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const result = await updateDeviceStatus(deviceId, status);
      if (result.success) {
        toast.success(result.message);
        await fetchPendingDevices();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchPendingDevices();
      toast.success("List refreshed!");
    } catch (error) {
      toast.error("Failed to refresh list");
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (!deviceType) return <DeviceMobile className="h-5 w-5" />;
    
    const type = deviceType.toLowerCase();
    if (type.includes("mobile") || type.includes("smartphone")) {
      return <DeviceMobile className="h-5 w-5" />;
    }
    return <Desktop className="h-5 w-5" />;
  };

  const parseDeviceInfo = (deviceInfo: string | null) => {
    if (!deviceInfo) return null;
    try {
      return JSON.parse(deviceInfo);
    } catch {
      return null;
    }
  };

  if (loading && pendingDevices.length === 0) {
    return (
      <LoadingSpinner
        text="Loading device requests..."
        icon={DeviceMobile}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full p-4 sm:p-6 lg:p-8"
    >
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-foreground-secondary" />
          </button>
          <h1 className="text-2xl font-bold text-foreground-primary flex items-center">
            <DeviceMobile className="mr-2 h-7 w-7 text-primary-600" />
            Device Approval Requests
          </h1>
        </div>
      </motion.div>

      {/* Permission Banner */}
      <ModulePermissionsBanner 
        module={PERMISSION_MODULES.ONBOARDING} 
        title="Device Management" 
        compact 
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-tertiary">Pending</p>
              <p className="text-2xl font-bold text-foreground-primary">
                {pendingDevices.length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </div>
        
        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-tertiary">Last Updated</p>
              <p className="text-sm font-medium text-foreground-secondary">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
              disabled={loading}
            >
              <ArrowsClockwise
                className={`h-6 w-6 text-primary-600 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-tertiary">Status</p>
              <p className="text-sm font-medium text-success">Active</p>
            </div>
            <Check className="h-8 w-8 text-success" />
          </div>
        </div>
      </div>

      {/* Device List */}
      {pendingDevices.length === 0 ? (
        <div className="mt-10 bg-surface-secondary rounded-xl border border-border-primary">
          <EmptyState
            icon={DeviceMobile}
            title="No Pending Requests"
            description="There are currently no pending device approval requests."
          />
        </div>
      ) : (
        <motion.div className="space-y-4">
          {pendingDevices.map((device: DeviceRequest) => {
            const parsedInfo = parseDeviceInfo(device.device_info);
            
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -4,
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-surface-primary rounded-xl p-6 shadow-sm border border-border-primary"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      {getDeviceIcon(device.device_type || parsedInfo?.device_type)}
                    </div>
                    <div>
                      {device.employee?.id ? (
                        <Link 
                          href={`/hris?uid=${device.employee.id}`}
                          className="font-semibold text-foreground-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1 group"
                        >
                          {device.employee.name}
                          <ArrowSquareOut 
                            className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" 
                          />
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-foreground-primary">
                          Unknown User
                        </h3>
                      )}
                      <p className="text-sm text-foreground-tertiary">
                        {device.employee?.designation || "No designation"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-white dark:text-foreground-primary bg-warning dark:bg-warning/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </div>
                </div>

                {/* Device Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">Email</span>
                      <span className="font-medium text-foreground-secondary">
                        {device.employee?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">Browser</span>
                      <span className="font-medium text-foreground-secondary">
                        {device.browser || parsedInfo?.browser || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">OS</span>
                      <span className="font-medium text-foreground-secondary">
                        {device.os || parsedInfo?.os || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">Device Type</span>
                      <span className="font-medium text-foreground-secondary">
                        {device.device_type || parsedInfo?.device_type || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">IP Address</span>
                      <span className="font-medium text-foreground-secondary">
                        {device.ip_address || parsedInfo?.ip_address || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">Request Date</span>
                      <span className="font-medium text-foreground-secondary">
                        {new Date(device.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device ID */}
                <div className="bg-surface-secondary rounded-lg p-3 mb-4">
                  <p className="text-xs text-foreground-tertiary mb-1">Device ID</p>
                  <p className="text-xs font-mono text-foreground-secondary break-all">
                    {device.device_id}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                  <PermissionGate
                    module={PERMISSION_MODULES.ONBOARDING}
                    action="can_approve"
                    fallback={
                      <PermissionTooltip message="You don't have permission to approve device requests">
                        <div className="flex gap-4">
                          <button
                            disabled
                            className="bg-background-tertiary text-foreground-tertiary rounded-lg px-4 py-2 text-sm font-semibold cursor-not-allowed opacity-60 flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                          <button
                            disabled
                            className="bg-background-tertiary text-foreground-tertiary rounded-lg px-4 py-2 text-sm font-semibold cursor-not-allowed opacity-60 flex items-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                        </div>
                      </PermissionTooltip>
                    }
                  >
                    <Button
                      className="bg-error hover:bg-error/80 text-white dark:text-foreground-primary flex items-center gap-2"
                      onClick={() => handleAction(device.id, "rejected")}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="bg-success hover:bg-success/80 text-white dark:text-foreground-primary flex items-center gap-2"
                      onClick={() => handleAction(device.id, "approved")}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </PermissionGate>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
