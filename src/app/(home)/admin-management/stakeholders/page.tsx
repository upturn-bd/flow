"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { Plus, Search, Filter, Eye, CheckCircle2, Clock } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

export default function StakeholdersPage() {
  const router = useRouter();
  const {
    stakeholders,
    leads,
    completedStakeholders,
    loading,
    error,
    searchStakeholders,
  } = useStakeholders();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "leads" | "completed">("all");
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
  }, [searchTerm, currentPage, filterStatus, searchStakeholders]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (status: "all" | "leads" | "completed") => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStepStatusColor = (stakeholder: any) => {
    if (stakeholder.is_completed) return "bg-green-100 text-green-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stakeholders & Leads</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your stakeholder pipeline and track progress
          </p>
        </div>
        <button
          onClick={() => router.push("/admin-management/stakeholders/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add New Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{leads.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stakeholders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {completedStakeholders.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {searchResult?.totalCount || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Filter className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stakeholders..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({searchResult?.totalCount || 0})
            </button>
            <button
              onClick={() => handleFilterChange("leads")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "leads"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Leads ({leads.length})
            </button>
            <button
              onClick={() => handleFilterChange("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "completed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Stakeholders ({completedStakeholders.length})
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900">No stakeholders found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm
              ? "Try adjusting your search or filters"
              : "Get started by adding your first lead"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => router.push("/admin-management/stakeholders/new")}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add New Lead
            </button>
          )}
        </div>
      )}

      {/* Stakeholder List */}
      {!loading && stakeholders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
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
            <tbody className="divide-y divide-gray-200">
              {stakeholders.map((stakeholder) => (
                <tr
                  key={stakeholder.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin-management/stakeholders/${stakeholder.id}`)}
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
                    {stakeholder.process?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {stakeholder.current_step ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStepStatusColor(
                          stakeholder
                        )}`}
                      >
                        Step {stakeholder.current_step.step_order}: {stakeholder.current_step.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not started</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {stakeholder.is_completed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 size={14} />
                        Stakeholder
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock size={14} />
                        Lead
                      </span>
                    )}
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
                        router.push(`/admin-management/stakeholders/${stakeholder.id}`);
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
      )}
    </div>
  );
}
