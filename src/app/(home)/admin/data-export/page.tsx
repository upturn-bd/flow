"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Users,
  Building,
  CheckCircle,
  FileSpreadsheet,
  WarningCircle,
  FolderKanban,
  ListTodo,
  Calendar,
  ClipboardCheck,
} from "@/lib/icons";
import { useEmployees } from "@/hooks/useEmployees";
import { useStakeholders } from "@/hooks/useStakeholders";
import { useProjects } from "@/hooks/useProjects";
import { useTasks, TaskStatus, TaskScope } from "@/hooks/useTasks";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";
import { useAttendances } from "@/hooks/useAttendance";
import { 
  exportEmployeesToCSV, 
  exportStakeholdersToCSV,
  exportProjectsToCSV,
  exportTasksToCSV,
  exportLeavesToCSV,
  exportAttendanceToCSV,
} from "@/lib/utils/csv-export";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

type ExportType = "employees" | "stakeholders" | "projects" | "tasks" | "leaves" | "attendance";

interface EmployeeExportConfig {
  includeEmail: boolean;
  includePhone: boolean;
  includeDepartment: boolean;
  includeDesignation: boolean;
  includeJoinDate: boolean;
  includeSalary: boolean;
}

interface StakeholderExportConfig {
  includeAddress: boolean;
  includeContactPersons: boolean;
  includeStatus: boolean;
  includeProcess: boolean;
  includeKAM: boolean;
  includeType: boolean;
  includeStepData: boolean;
}

interface ProjectExportConfig {
  includeDescription: boolean;
  includeDates: boolean;
  includeStatus: boolean;
  includeProgress: boolean;
  includeGoal: boolean;
  includeAssignees: boolean;
}

interface TaskExportConfig {
  includeDescription: boolean;
  includeDates: boolean;
  includePriority: boolean;
  includeStatus: boolean;
  includeProject: boolean;
  includeAssignees: boolean;
}

interface LeaveExportConfig {
  includeDates: boolean;
  includeStatus: boolean;
  includeType: boolean;
  includeRemarks: boolean;
  includeEmployee: boolean;
}

interface AttendanceExportConfig {
  includeCheckInTime: boolean;
  includeCheckOutTime: boolean;
  includeTag: boolean;
  includeSite: boolean;
  includeCoordinates: boolean;
  includeSiteTimings: boolean;
  includeLateIndicator: boolean;
  includeLocationStatus: boolean;
}

export default function DataExportPage() {
  const [selectedExport, setSelectedExport] = useState<ExportType | null>(null);
  const [employeeConfig, setEmployeeConfig] = useState<EmployeeExportConfig>({
    includeEmail: true,
    includePhone: true,
    includeDepartment: true,
    includeDesignation: true,
    includeJoinDate: true,
    includeSalary: false,
  });

  const [stakeholderConfig, setStakeholderConfig] = useState<StakeholderExportConfig>({
    includeAddress: true,
    includeContactPersons: true,
    includeStatus: true,
    includeProcess: true,
    includeKAM: true,
    includeType: true,
    includeStepData: true,
  });

  const [projectConfig, setProjectConfig] = useState<ProjectExportConfig>({
    includeDescription: true,
    includeDates: true,
    includeStatus: true,
    includeProgress: true,
    includeGoal: false,
    includeAssignees: true,
  });

  const [taskConfig, setTaskConfig] = useState<TaskExportConfig>({
    includeDescription: true,
    includeDates: true,
    includePriority: true,
    includeStatus: true,
    includeProject: true,
    includeAssignees: true,
  });

  const [leaveConfig, setLeaveConfig] = useState<LeaveExportConfig>({
    includeDates: true,
    includeStatus: true,
    includeType: true,
    includeRemarks: true,
    includeEmployee: true,
  });

  const [attendanceConfig, setAttendanceConfig] = useState<AttendanceExportConfig>({
    includeCheckInTime: true,
    includeCheckOutTime: true,
    includeTag: true,
    includeSite: true,
    includeCoordinates: false,
    includeSiteTimings: true,
    includeLateIndicator: true,
    includeLocationStatus: true,
  });

  const { extendedEmployees, fetchExtendedEmployees, loading: employeesLoading } = useEmployees();
  const { stakeholders, fetchStakeholders, loading: stakeholdersLoading } = useStakeholders();
  const { ongoingProjects, completedProjects, fetchOngoingProjects, fetchCompletedProjects } = useProjects();
  const { ongoingTasks, completedTasks, fetchTasks } = useTasks();
  const { leaveRequests, fetchLeaveRequests, loading: leavesLoading } = useLeaveRequests();
  const { items: attendanceRecords, fetchItems: fetchAttendance, loading: attendanceLoading } = useAttendances();

  const [dataLoadedFor, setDataLoadedFor] = useState<Set<ExportType>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Lazy load data only when export type is selected
  useEffect(() => {
    if (!selectedExport || dataLoadedFor.has(selectedExport)) return;

    const loadDataForExport = async () => {
      setIsLoadingData(true);
      try {
        switch (selectedExport) {
          case "employees":
            await fetchExtendedEmployees();
            break;
          case "stakeholders":
            await fetchStakeholders();
            break;
          case "projects":
            await Promise.all([
              fetchOngoingProjects(50, true),
              fetchCompletedProjects(50, true)
            ]);
            break;
          case "tasks":
            await fetchTasks({ scope: TaskScope.COMPANY_TASKS, status: TaskStatus.ALL });
            break;
          case "leaves":
            await fetchLeaveRequests();
            break;
          case "attendance":
            await fetchAttendance();
            break;
        }
        setDataLoadedFor(prev => new Set(prev).add(selectedExport));
      } catch (error) {
        console.error(`Error loading ${selectedExport} data:`, error);
        toast.error(`Failed to load ${selectedExport} data`);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDataForExport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExport]);

  // Fetch attendance records with site information for enhanced export
  const fetchAttendanceWithSiteData = useCallback(async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { getCompanyId } = await import("@/lib/utils/auth");
      
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          site:sites(id, name, check_in, check_out, latitude, longitude)
        `)
        .eq("company_id", company_id)
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching attendance with site data:", error);
      toast.error("Failed to fetch attendance site data");
      return [];
    }
  }, []);

  // Fetch stakeholders with step data when selected
  const fetchStakeholdersWithStepData = useCallback(async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { getCompanyId } = await import("@/lib/utils/auth");
      
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholders")
        .select(`
          *,
          process:stakeholder_processes(id, name, is_sequential),
          current_step:stakeholder_process_steps(id, name, step_order),
          stakeholder_type:stakeholder_types(id, name, description),
          parent_stakeholder:stakeholders!parent_stakeholder_id(id, name, status),
          kam:employees!kam_id(id, first_name, last_name, email),
          step_data:stakeholder_step_data(
            *,
            step:stakeholder_process_steps(id, name, step_order, field_definitions)
          )
        `)
        .eq("company_id", company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform kam data to match expected structure
      const transformedData = data?.map((stakeholder) => ({
        ...stakeholder,
        kam: stakeholder.kam ? {
          id: stakeholder.kam.id,
          name: `${stakeholder.kam.first_name} ${stakeholder.kam.last_name}`,
          email: stakeholder.kam.email,
        } : undefined,
      })) || [];

      return transformedData;
    } catch (error) {
      console.error("Error fetching stakeholders with step data:", error);
      toast.error("Failed to fetch stakeholder step data");
      return [];
    }
  }, []);

  const handleExportEmployees = () => {
    if (extendedEmployees.length === 0) {
      toast.error("No employee data available to export");
      return;
    }

    try {
      exportEmployeesToCSV(extendedEmployees, employeeConfig);
      toast.success(`Exported ${extendedEmployees.length} employee(s) to CSV`);
    } catch (error) {
      console.error("Error exporting employees:", error);
      toast.error("Failed to export employee data");
    }
  };

  const handleExportStakeholders = async () => {
    if (stakeholders.length === 0) {
      toast.error("No stakeholder data available to export");
      return;
    }

    try {
      // Fetch stakeholders with step data if step data is included in config
      let dataToExport = stakeholders;
      if (stakeholderConfig.includeStepData) {
        toast.info("Fetching stakeholder step data...");
        dataToExport = await fetchStakeholdersWithStepData();
        if (dataToExport.length === 0) {
          dataToExport = stakeholders; // Fallback to stakeholders without step data
        }
      }
      
      exportStakeholdersToCSV(dataToExport, stakeholderConfig);
      toast.success(`Exported ${dataToExport.length} stakeholder(s) to CSV`);
    } catch (error) {
      console.error("Error exporting stakeholders:", error);
      toast.error("Failed to export stakeholder data");
    }
  };

  const handleExportProjects = () => {
    const allProjects = [...ongoingProjects, ...completedProjects];
    if (allProjects.length === 0) {
      toast.error("No project data available to export");
      return;
    }

    try {
      exportProjectsToCSV(allProjects, projectConfig);
      toast.success(`Exported ${allProjects.length} project(s) to CSV`);
    } catch (error) {
      console.error("Error exporting projects:", error);
      toast.error("Failed to export project data");
    }
  };

  const handleExportTasks = () => {
    const allTasks = [...ongoingTasks, ...completedTasks];
    if (allTasks.length === 0) {
      toast.error("No task data available to export");
      return;
    }

    try {
      exportTasksToCSV(allTasks, taskConfig);
      toast.success(`Exported ${allTasks.length} task(s) to CSV`);
    } catch (error) {
      console.error("Error exporting tasks:", error);
      toast.error("Failed to export task data");
    }
  };

  const handleExportLeaves = () => {
    if (leaveRequests.length === 0) {
      toast.error("No leave data available to export");
      return;
    }

    try {
      exportLeavesToCSV(leaveRequests, leaveConfig);
      toast.success(`Exported ${leaveRequests.length} leave record(s) to CSV`);
    } catch (error) {
      console.error("Error exporting leaves:", error);
      toast.error("Failed to export leave data");
    }
  };

  const handleExportAttendance = async () => {
    if (attendanceRecords.length === 0) {
      toast.error("No attendance data available to export");
      return;
    }

    try {
      // Fetch attendance with site data for enhanced export
      toast.info("Fetching attendance details with site information...");
      const attendanceWithSiteData = await fetchAttendanceWithSiteData();
      const dataToExport = attendanceWithSiteData.length > 0 ? attendanceWithSiteData : attendanceRecords;
      
      exportAttendanceToCSV(dataToExport, attendanceConfig);
      toast.success(`Exported ${dataToExport.length} attendance record(s) to CSV`);
    } catch (error) {
      console.error("Error exporting attendance:", error);
      toast.error("Failed to export attendance data");
    }
  };

  // Memoize export options to avoid unnecessary recalculations
  const exportOptions = useMemo(() => [
    {
      type: "employees" as ExportType,
      title: "HRIS Employee Data",
      description: "Export employee information including personal details and job info",
      icon: Users,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      count: extendedEmployees.length,
      loading: employeesLoading,
    },
    {
      type: "stakeholders" as ExportType,
      title: "Stakeholder Data",
      description: "Export stakeholder and lead information with contact details and process status",
      icon: Building,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      count: stakeholders.length,
      loading: stakeholdersLoading,
    },
    {
      type: "projects" as ExportType,
      title: "Project Data",
      description: "Export project records including status, progress, and assignees",
      icon: FolderKanban,
      color: "bg-green-100 text-green-700 border-green-200",
      count: ongoingProjects.length + completedProjects.length,
      loading: false,
    },
    {
      type: "tasks" as ExportType,
      title: "Task Data",
      description: "Export task records with priority, status, and assignment details",
      icon: ListTodo,
      color: "bg-orange-100 text-orange-700 border-orange-200",
      count: ongoingTasks.length + completedTasks.length,
      loading: false,
    },
    {
      type: "leaves" as ExportType,
      title: "Leave Management Data",
      description: "Export leave records including dates, status, and type",
      icon: Calendar,
      color: "bg-red-100 text-red-700 border-red-200",
      count: leaveRequests.length,
      loading: leavesLoading,
    },
    {
      type: "attendance" as ExportType,
      title: "Attendance Data",
      description: "Export attendance records with check-in/out times and locations",
      icon: ClipboardCheck,
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      count: attendanceRecords.length,
      loading: attendanceLoading,
    },
  ], [
    extendedEmployees.length, employeesLoading,
    stakeholders.length, stakeholdersLoading,
    ongoingProjects.length, completedProjects.length,
    ongoingTasks.length, completedTasks.length,
    leaveRequests.length, leavesLoading,
    attendanceRecords.length, attendanceLoading
  ]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export Center</h1>
          <p className="text-sm text-gray-600 mt-1">
            Export company data to CSV format for analysis and reporting
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <FileSpreadsheet className="text-blue-600" size={20} />
          <span className="text-sm font-medium text-blue-900">CSV Format</span>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3"
      >
        <WarningCircle className="text-amber-600 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-amber-900">Data Privacy Notice</h3>
          <p className="text-sm text-amber-800 mt-1">
            Exported data contains sensitive information. Ensure proper handling and storage of CSV files.
            Only authorized personnel should have access to exported data.
          </p>
        </div>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedExport === option.type;

          return (
            <motion.div
              key={option.type}
              variants={fadeInUp}
              className={`
                bg-white rounded-lg border-2 transition-all cursor-pointer
                ${isSelected ? "border-blue-500 shadow-lg ring-2 ring-blue-100" : "border-border-primary hover:border-border-secondary hover:shadow-md"}
              `}
              onClick={() => setSelectedExport(option.type)}
            >
              <div className="p-6 flex flex-col h-full min-h-[200px]">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${option.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <CheckCircle className="text-blue-600" size={24} />
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {option.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="text-sm">
                    {option.loading || (isSelected && isLoadingData) ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-border-secondary border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {option.count} records
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Configuration Panel */}
      {selectedExport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg">
            <CardHeader
              title={
                selectedExport === "employees"
                  ? "Employee Export Configuration"
                  : selectedExport === "stakeholders"
                  ? "Stakeholder Export Configuration"
                  : selectedExport === "projects"
                  ? "Project Export Configuration"
                  : selectedExport === "tasks"
                  ? "Task Export Configuration"
                  : selectedExport === "leaves"
                  ? "Leave Export Configuration"
                  : "Attendance Export Configuration"
              }
              subtitle="Select the fields to include in your export"
            />
            <CardContent>
              <div className="space-y-4">
                {selectedExport === "employees" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeConfig.includeEmail}
                          onChange={(e) =>
                            setEmployeeConfig({
                              ...employeeConfig,
                              includeEmail: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Email Address</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeConfig.includePhone}
                          onChange={(e) =>
                            setEmployeeConfig({
                              ...employeeConfig,
                              includePhone: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Phone Number</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeConfig.includeDepartment}
                          onChange={(e) =>
                            setEmployeeConfig({
                              ...employeeConfig,
                              includeDepartment: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Department</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeConfig.includeDesignation}
                          onChange={(e) =>
                            setEmployeeConfig({
                              ...employeeConfig,
                              includeDesignation: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Designation</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeConfig.includeJoinDate}
                          onChange={(e) =>
                            setEmployeeConfig({
                              ...employeeConfig,
                              includeJoinDate: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Join Date</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer bg-red-50/50">
                        <input
                          type="checkbox"
                          checked={employeeConfig.includeSalary}
                          onChange={(e) =>
                            setEmployeeConfig({
                              ...employeeConfig,
                              includeSalary: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-red-900">
                          Basic Salary (Sensitive)
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary">
                      <button
                        onClick={handleExportEmployees}
                        disabled={employeesLoading || isLoadingData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Employee Data
                      </button>
                    </div>
                  </>
                )}

                {selectedExport === "stakeholders" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeAddress}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeAddress: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Address</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeContactPersons}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeContactPersons: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Contact Persons</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeStatus}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeStatus: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Status</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeProcess}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeProcess: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Process</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeKAM}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeKAM: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Key Account Manager</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeType}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeType: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Stakeholder Type</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer bg-green-50/50">
                        <input
                          type="checkbox"
                          checked={stakeholderConfig.includeStepData}
                          onChange={(e) =>
                            setStakeholderConfig({
                              ...stakeholderConfig,
                              includeStepData: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-green-900">Step Data (Process Steps)</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary">
                      <button
                        onClick={handleExportStakeholders}
                        disabled={stakeholdersLoading || isLoadingData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Stakeholder Data
                      </button>
                    </div>
                  </>
                )}

                {selectedExport === "projects" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectConfig.includeDescription}
                          onChange={(e) =>
                            setProjectConfig({
                              ...projectConfig,
                              includeDescription: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Description</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectConfig.includeDates}
                          onChange={(e) =>
                            setProjectConfig({
                              ...projectConfig,
                              includeDates: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Start & End Dates</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectConfig.includeStatus}
                          onChange={(e) =>
                            setProjectConfig({
                              ...projectConfig,
                              includeStatus: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Status</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectConfig.includeProgress}
                          onChange={(e) =>
                            setProjectConfig({
                              ...projectConfig,
                              includeProgress: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Progress</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectConfig.includeGoal}
                          onChange={(e) =>
                            setProjectConfig({
                              ...projectConfig,
                              includeGoal: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Goal</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectConfig.includeAssignees}
                          onChange={(e) =>
                            setProjectConfig({
                              ...projectConfig,
                              includeAssignees: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Assignees</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary">
                      <button
                        onClick={handleExportProjects}
                        disabled={isLoadingData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Project Data
                      </button>
                    </div>
                  </>
                )}

                {selectedExport === "tasks" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.includeDescription}
                          onChange={(e) =>
                            setTaskConfig({
                              ...taskConfig,
                              includeDescription: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Description</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.includeDates}
                          onChange={(e) =>
                            setTaskConfig({
                              ...taskConfig,
                              includeDates: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Start & End Dates</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.includePriority}
                          onChange={(e) =>
                            setTaskConfig({
                              ...taskConfig,
                              includePriority: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Priority</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.includeStatus}
                          onChange={(e) =>
                            setTaskConfig({
                              ...taskConfig,
                              includeStatus: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Status</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.includeProject}
                          onChange={(e) =>
                            setTaskConfig({
                              ...taskConfig,
                              includeProject: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Project ID</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.includeAssignees}
                          onChange={(e) =>
                            setTaskConfig({
                              ...taskConfig,
                              includeAssignees: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Assignees</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary">
                      <button
                        onClick={handleExportTasks}
                        disabled={isLoadingData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Task Data
                      </button>
                    </div>
                  </>
                )}

                {selectedExport === "leaves" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaveConfig.includeDates}
                          onChange={(e) =>
                            setLeaveConfig({
                              ...leaveConfig,
                              includeDates: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Start & End Dates</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaveConfig.includeStatus}
                          onChange={(e) =>
                            setLeaveConfig({
                              ...leaveConfig,
                              includeStatus: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Status</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaveConfig.includeType}
                          onChange={(e) =>
                            setLeaveConfig({
                              ...leaveConfig,
                              includeType: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Leave Type</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaveConfig.includeRemarks}
                          onChange={(e) =>
                            setLeaveConfig({
                              ...leaveConfig,
                              includeRemarks: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Remarks</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaveConfig.includeEmployee}
                          onChange={(e) =>
                            setLeaveConfig({
                              ...leaveConfig,
                              includeEmployee: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Employee ID</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary">
                      <button
                        onClick={handleExportLeaves}
                        disabled={leavesLoading || isLoadingData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Leave Data
                      </button>
                    </div>
                  </>
                )}

                {selectedExport === "attendance" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeCheckInTime}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeCheckInTime: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Check In Time</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeCheckOutTime}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeCheckOutTime: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Check Out Time</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeTag}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeTag: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Tag/Status</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeSite}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeSite: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Site Name</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeSiteTimings}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeSiteTimings: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Site Timings</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer bg-green-50/50">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeLateIndicator}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeLateIndicator: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-green-900">Late Status Indicator</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer bg-green-50/50">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeLocationStatus}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeLocationStatus: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-green-900">Location Status (Wrong Location)</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attendanceConfig.includeCoordinates}
                          onChange={(e) =>
                            setAttendanceConfig({
                              ...attendanceConfig,
                              includeCoordinates: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">GPS Coordinates</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-primary">
                      <button
                        onClick={handleExportAttendance}
                        disabled={attendanceLoading || isLoadingData}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Attendance Data
                      </button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
