"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Users,
  Building2,
  CheckCircle,
  FileSpreadsheet,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useEmployees, ExtendedEmployee } from "@/hooks/useEmployees";
import { useStakeholders } from "@/hooks/useStakeholders";
import { exportEmployeesToCSV, exportStakeholdersToCSV } from "@/lib/utils/csv-export";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

type ExportType = "employees" | "stakeholders";

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
  });

  const { extendedEmployees, fetchExtendedEmployees, loading: employeesLoading } = useEmployees();
  const { stakeholders, fetchStakeholders, loading: stakeholdersLoading } = useStakeholders();

  useEffect(() => {
    // Preload both datasets for faster exports
    fetchExtendedEmployees();
    fetchStakeholders();
  }, [fetchExtendedEmployees, fetchStakeholders]);

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

  const handleExportStakeholders = () => {
    if (stakeholders.length === 0) {
      toast.error("No stakeholder data available to export");
      return;
    }

    try {
      exportStakeholdersToCSV(stakeholders, stakeholderConfig);
      toast.success(`Exported ${stakeholders.length} stakeholder(s) to CSV`);
    } catch (error) {
      console.error("Error exporting stakeholders:", error);
      toast.error("Failed to export stakeholder data");
    }
  };

  const exportOptions = [
    {
      type: "employees" as ExportType,
      title: "HRIS Employee Data",
      description: "Export all employee information including personal details, job info, and salary data",
      icon: Users,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      count: extendedEmployees.length,
      loading: employeesLoading,
    },
    {
      type: "stakeholders" as ExportType,
      title: "Stakeholder Data",
      description: "Export stakeholder and lead information with contact details and process status",
      icon: Building2,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      count: stakeholders.length,
      loading: stakeholdersLoading,
    },
  ];

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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
        <AlertCircle className="text-amber-600 mt-0.5" size={20} />
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
                ${isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"}
              `}
              onClick={() => setSelectedExport(option.type)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${option.color}`}>
                    <Icon size={24} />
                  </div>
                  {isSelected && (
                    <CheckCircle className="text-blue-600" size={24} />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {option.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {option.loading ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {option.count} records
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedExport(option.type);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Configure →
                  </button>
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
                  : "Stakeholder Export Configuration"
              }
              subtitle="Select the fields to include in your export"
            />
            <CardContent>
              <div className="space-y-4">
                {selectedExport === "employees" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Exporting <span className="font-semibold">{extendedEmployees.length}</span> employee records
                      </div>
                      <button
                        onClick={handleExportEmployees}
                        disabled={employeesLoading}
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
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Exporting <span className="font-semibold">{stakeholders.length}</span> stakeholder records
                      </div>
                      <button
                        onClick={handleExportStakeholders}
                        disabled={stakeholdersLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        Export Stakeholder Data
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
