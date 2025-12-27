"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { captureSupabaseError } from "@/lib/sentry";
import type { Company } from "@/lib/types/schemas";
import { DeviceMobile, Check, X, User, Buildings, Desktop, DeviceMobileCamera, Laptop, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, EmptyState, SearchBar } from "@/components/ui";
import { SelectField } from "@/components/forms";

interface DeviceRequest {
  id: string;
  user_id: string;
  device_id: string;
  device_info: string | null;
  status: 'approved' | 'pending' | 'rejected';
  last_login: string;
  created_at: string;
  browser?: string;
  os?: string;
  device_type?: string;
  model?: string;
  ip_address?: string;
  location?: string;
  user_agent?: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    designation: string | null;
    company_id: number;
    company?: {
      id: number;
      name: string;
    };
  };
}

export default function SuperadminDevicesPage() {
  const [devices, setDevices] = useState<DeviceRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [devicesResult, companiesResult] = await Promise.all([
        supabase
          .from("user_devices")
          .select(`
            *,
            employee:employees!user_devices_user_id_fkey(
              id,
              first_name,
              last_name,
              email,
              designation,
              company_id,
              company:companies!employees_company_id_fkey(id, name)
            )
          `)
          .order("created_at", { ascending: false }),
        supabase.from("companies").select("*").order("name"),
      ]);

      if (devicesResult.error) {
        captureSupabaseError(devicesResult.error, "fetchDevices");
        toast.error("Failed to fetch devices");
        return;
      }

      // Transform the data to match expected structure
      const devicesWithEmployees = (devicesResult.data || []).map((device) => ({
        ...device,
        employee: device.employee ? {
          ...device.employee,
          company: Array.isArray(device.employee.company) 
            ? device.employee.company[0] 
            : device.employee.company
        } : null,
      }));

      setDevices(devicesWithEmployees as DeviceRequest[]);
      if (companiesResult.data) {
        setCompanies(companiesResult.data);
      }
    } catch (error) {
      captureSupabaseError(error as { code?: string; message?: string }, "fetchDevices");
      toast.error("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (deviceId: string, status: 'approved' | 'rejected') => {
    setActionLoading(deviceId);
    try {
      const { error } = await supabase
        .from("user_devices")
        .update({ status })
        .eq("id", deviceId);

      if (error) throw error;

      toast.success(`Device ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Update local state
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status } : d
      ));
    } catch (error) {
      captureSupabaseError(error as { code?: string; message?: string }, "updateDeviceStatus", { deviceId, status });
      toast.error("Failed to update device status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setActionLoading(deviceId);
    try {
      const { error } = await supabase
        .from("user_devices")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;

      toast.success("Device removed successfully");
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (error) {
      captureSupabaseError(error as { code?: string; message?: string }, "deleteDevice", { deviceId });
      toast.error("Failed to remove device");
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return DeviceMobileCamera;
      case 'tablet':
        return DeviceMobile;
      case 'laptop':
        return Laptop;
      default:
        return Desktop;
    }
  };

  const filteredDevices = devices.filter(device => {
    // Status filter
    if (filterStatus !== "all" && device.status !== filterStatus) return false;
    
    // Company filter
    if (filterCompany !== "all" && device.employee?.company_id?.toString() !== filterCompany) return false;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const employeeName = `${device.employee?.first_name || ''} ${device.employee?.last_name || ''}`.toLowerCase();
      const email = device.employee?.email?.toLowerCase() || '';
      const companyName = device.employee?.company?.name?.toLowerCase() || '';
      const deviceInfo = device.device_info?.toLowerCase() || '';
      
      return employeeName.includes(search) || 
             email.includes(search) || 
             companyName.includes(search) ||
             deviceInfo.includes(search);
    }
    
    return true;
  });

  const stats = {
    total: devices.length,
    pending: devices.filter(d => d.status === 'pending').length,
    approved: devices.filter(d => d.status === 'approved').length,
    rejected: devices.filter(d => d.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Device Management"
        description="Manage device access requests across all companies"
        icon={DeviceMobile}
        iconColor="text-emerald-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl p-4 border border-border-primary">
          <p className="text-sm text-foreground-tertiary">Total Devices</p>
          <p className="text-2xl font-bold text-foreground-primary">{stats.total}</p>
        </div>
        <div className="bg-warning/10 rounded-xl p-4 border border-warning/30">
          <p className="text-sm text-warning">Pending</p>
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
        </div>
        <div className="bg-success/10 rounded-xl p-4 border border-success/30">
          <p className="text-sm text-success">Approved</p>
          <p className="text-2xl font-bold text-success">{stats.approved}</p>
        </div>
        <div className="bg-error/10 rounded-xl p-4 border border-error/30">
          <p className="text-sm text-error">Rejected</p>
          <p className="text-2xl font-bold text-error">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-border-primary p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by employee, email, or company..."
            />
          </div>
          <div className="flex gap-3">
            <SelectField
              label=""
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              options={[
                { value: "all", label: "All Companies" },
                ...companies.map(c => ({ value: c.id.toString(), label: c.name }))
              ]}
            />
            <SelectField
              label=""
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Device List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface-primary rounded-xl border border-border-primary p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-background-tertiary rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-background-tertiary rounded w-48 mb-2"></div>
                  <div className="h-3 bg-background-tertiary rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-surface-primary rounded-xl border border-border-primary p-12">
          <EmptyState
            icon={DeviceMobile}
            title={filterStatus === "pending" ? "No pending device requests" : "No devices found"}
            description={filterStatus === "pending" 
              ? "All device requests have been processed" 
              : "Try adjusting your search or filters"}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.device_type);
              const isPending = device.status === 'pending';
              const isApproved = device.status === 'approved';
              const isRejected = device.status === 'rejected';
              
              return (
                <motion.div
                  key={device.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-surface-primary rounded-xl border p-5 ${
                    isPending ? 'border-warning/50' : 
                    isApproved ? 'border-success/30' : 
                    'border-error/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Device Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isPending ? 'bg-warning/10 text-warning' :
                        isApproved ? 'bg-success/10 text-success' :
                        'bg-error/10 text-error'
                      }`}>
                        <DeviceIcon size={24} weight="duotone" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground-primary">
                            {device.employee?.first_name} {device.employee?.last_name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isPending ? 'bg-warning/20 text-warning' :
                            isApproved ? 'bg-success/20 text-success' :
                            'bg-error/20 text-error'
                          }`}>
                            {device.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-foreground-tertiary mt-1">
                          {device.employee?.email}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-foreground-tertiary flex-wrap">
                          <span className="flex items-center gap-1">
                            <Buildings size={12} />
                            {device.employee?.company?.name || 'Unknown Company'}
                          </span>
                          <span className="flex items-center gap-1">
                            <DeviceIcon size={12} />
                            {device.browser || 'Unknown'} / {device.os || 'Unknown OS'}
                          </span>
                          {device.location && (
                            <span className="flex items-center gap-1">
                              📍 {device.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(device.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        {device.device_info && (
                          <div className="text-xs text-foreground-tertiary mt-1 bg-background-tertiary dark:bg-surface-secondary px-2 py-1 rounded inline-block">
                            {device.device_info}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(device.id, 'rejected')}
                            disabled={actionLoading === device.id}
                            className="flex items-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X size={18} />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(device.id, 'approved')}
                            disabled={actionLoading === device.id}
                            className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check size={18} />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                        </>
                      )}
                      {!isPending && (
                        <>
                          {isRejected && (
                            <button
                              onClick={() => handleUpdateStatus(device.id, 'approved')}
                              disabled={actionLoading === device.id}
                              className="flex items-center gap-2 px-4 py-2 bg-success/10 hover:bg-success/20 text-success rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check size={18} />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                          )}
                          {isApproved && (
                            <button
                              onClick={() => handleUpdateStatus(device.id, 'rejected')}
                              disabled={actionLoading === device.id}
                              className="flex items-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X size={18} />
                              <span className="hidden sm:inline">Revoke</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            disabled={actionLoading === device.id}
                            className="flex items-center gap-2 px-4 py-2 bg-background-tertiary hover:bg-surface-hover text-foreground-secondary rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X size={18} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
