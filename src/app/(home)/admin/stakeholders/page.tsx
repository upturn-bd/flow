"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { Plus, Search, Filter, Eye, CheckCircle, Clock, Download } from "@/lib/icons";
import Pagination from "@/components/ui/Pagination";
import { exportStakeholdersToCSV } from "@/lib/utils/csv-export";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { ModulePermissionsBanner, PermissionTooltip } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

export default function StakeholdersPage() {
  const router = useRouter();
  const { canWrite } = useAuth();
  const {
    stakeholders,
    leads,
    completedStakeholders,
    loading,
    error,
    searchStakeholders,
  } = useStakeholders();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Lead" | "Permanent" | "Rejected">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchResult, setSearchResult] = useState<{
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } | null>(null);

  const pageSize = 25;

  useEffect(() => {
    const loadStakeholders = async () => {
      const result = await searchStakeholders({
        searchQuery: searchTerm,
        page: currentPage,
        pageSize,
        filterStatus,
      });
      setSearchResult(result);
    };
    
    loadStakeholders();
  }, [searchTerm, currentPage, filterStatus]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (status: "all" | "Lead" | "Permanent" | "Rejected") => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "Lead":
        return "bg-yellow-100 text-yellow-800";
      case "Permanent":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const handleExportCSV = () => {
    if (stakeholders.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    try {
      exportStakeholdersToCSV(stakeholders, {
        includeAddress: true,
        includeContactPersons: true,
        includeStatus: true,
        includeProcess: true,
        includeKAM: true,
        includeType: true,
      });
      toast.success(`Exported ${stakeholders.length} stakeholder(s) to CSV`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Stakeholders & Leads</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
            Manage your stakeholder pipeline and track progress
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={loading || stakeholders.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Export</span>
          </button>
          {canWrite(PERMISSION_MODULES.STAKEHOLDERS) ? (
            <button
              onClick={() => router.push("/admin/stakeholders/new")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Add Lead</span>
            </button>
          ) : (
            <PermissionTooltip message="You don't have permission to create stakeholders">
              <button
                disabled
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-60"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Add Lead</span>
              </button>
            </PermissionTooltip>
          )}
        </div>
      </div>

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.STAKEHOLDERS} title="Stakeholders" compact />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
        <div className="bg-white rounded-lg border border-border-primary p-3.5 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 truncate">Active Leads</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{leads.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 ml-2">
              <Clock className="text-blue-600" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-primary p-3.5 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 truncate">Stakeholders</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {completedStakeholders.length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0 ml-2">
              <CheckCircle className="text-green-600" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-primary p-3.5 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 truncate">Total Records</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {searchResult?.totalCount || 0}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0 ml-2">
              <Filter className="text-purple-600" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border-primary p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search stakeholders..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              All ({searchResult?.totalCount || 0})
            </button>
            <button
              onClick={() => handleFilterChange("Lead")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === "Lead"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Leads ({leads.length})
            </button>
            <button
              onClick={() => handleFilterChange("Permanent")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === "Permanent"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Permanent ({completedStakeholders.length})
            </button>
            <button
              onClick={() => handleFilterChange("Rejected")}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === "Rejected"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && stakeholders.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stakeholders.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-border-secondary px-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">No stakeholders found</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {searchTerm
              ? "Try adjusting your search or filters"
              : "Get started by adding your first lead"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => router.push("/admin/stakeholders/new")}
              className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 text-sm"
            >
              <Plus size={18} />
              Add New Lead
            </button>
          )}
        </div>
      )}

      {/* Stakeholder List */}
      {!loading && stakeholders.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg border border-border-primary overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border-primary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Process
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {stakeholders.map((stakeholder) => (
                  <tr
                    key={stakeholder.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/stakeholders/${stakeholder.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{stakeholder.name}</div>
                          {stakeholder.address && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {stakeholder.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stakeholder.stakeholder_type ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {stakeholder.stakeholder_type.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stakeholder.process?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {stakeholder.current_step ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Step {stakeholder.current_step.step_order}: {stakeholder.current_step.name}
                          </span>
                          {(() => {
                            // Find step data for current step and extract status
                            const currentStepData = stakeholder.step_data?.find(
                              (sd) => sd.step_id === stakeholder.current_step_id
                            );
                            const stepStatus = currentStepData?.data?.["__step_status"];
                            
                            if (stepStatus && stakeholder.current_step?.status_field?.enabled) {
                              const statusOption = stakeholder.current_step.status_field.options?.find(
                                opt => opt.value === stepStatus
                              );
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {statusOption?.label || stepStatus}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not started</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStepStatusColor(
                          stakeholder.status
                        )}`}
                      >
                        {stakeholder.status === 'Lead' && <Clock size={14} />}
                        {stakeholder.status === 'Permanent' && <CheckCircle size={14} />}
                        {stakeholder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {stakeholder.created_at
                        ? new Date(stakeholder.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/stakeholders/${stakeholder.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {searchResult && (
              <Pagination
                currentPage={searchResult.currentPage}
                totalPages={searchResult.totalPages}
                totalCount={searchResult.totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2.5">
            {stakeholders.map((stakeholder) => (
              <div
                key={stakeholder.id}
                onClick={() => router.push(`/admin/stakeholders/${stakeholder.id}`)}
                className="bg-white rounded-lg border border-border-primary p-3 space-y-2.5 active:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{stakeholder.name}</h3>
                    {stakeholder.address && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{stakeholder.address}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 leading-tight ${getStepStatusColor(
                      stakeholder.status
                    )}`}
                  >
                    {stakeholder.status === 'Lead' && <Clock size={10} />}
                    {stakeholder.status === 'Permanent' && <CheckCircle size={10} />}
                    {stakeholder.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Type</p>
                      {stakeholder.stakeholder_type ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                          {stakeholder.stakeholder_type.name}
                        </span>
                      ) : (
                        <p className="text-gray-400">—</p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Process</p>
                      <p className="text-gray-900 truncate">{stakeholder.process?.name || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Current Step</p>
                    {stakeholder.current_step ? (
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                          Step {stakeholder.current_step.step_order}: {stakeholder.current_step.name}
                        </span>
                        {(() => {
                          const currentStepData = stakeholder.step_data?.find(
                            (sd) => sd.step_id === stakeholder.current_step_id
                          );
                          const stepStatus = currentStepData?.data?.["__step_status"];
                          
                          if (stepStatus && stakeholder.current_step?.status_field?.enabled) {
                            const statusOption = stakeholder.current_step.status_field.options?.find(
                              opt => opt.value === stepStatus
                            );
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                                {statusOption?.label || stepStatus}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-400">Not started</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Created</p>
                    <p className="text-gray-900">
                      {stakeholder.created_at
                        ? new Date(stakeholder.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/stakeholders/${stakeholder.id}`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100 transition-colors font-medium"
                >
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            ))}

            {/* Mobile Pagination */}
            {searchResult && (
              <div className="pt-1">
                <Pagination
                  currentPage={searchResult.currentPage}
                  totalPages={searchResult.totalPages}
                  totalCount={searchResult.totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
