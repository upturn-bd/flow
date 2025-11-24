"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle 
} from "lucide-react";
import { useEmployeesContext, ExtendedEmployee } from "@/contexts";
import { USER_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import FormInputField from "@/components/ui/FormInputField";
import BaseModal from "@/components/ui/modals/BaseModal";
import toast from "react-hot-toast";

// Role options for dropdown
const ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: "Admin" },
  { value: USER_ROLES.MANAGER, label: "Manager" },
  { value: USER_ROLES.EMPLOYEE, label: "Employee" },
];

export default function RoleManagementTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<ExtendedEmployee | null>(null);
  const [newRole, setNewRole] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    employees: ExtendedEmployee[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } | null>(null);
  
  const { loading, error, searchEmployeesForRoleManagement, updateEmployeeRole } = useEmployeesContext();

  const pageSize = 25;

  // Fetch employees on component mount and when search/page changes
  useEffect(() => {
    const performSearch = async () => {
      try {
        const result = await searchEmployeesForRoleManagement({
          searchQuery,
          page: currentPage,
          pageSize,
        });
        setSearchResult(result);
      } catch (err) {
        console.error("Failed to search employees:", err);
      }
    };
    performSearch();
  }, [searchQuery, currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRoleChange = (employee: ExtendedEmployee, role: string) => {
    setSelectedEmployee(employee);
    setNewRole(role);
    
    // Show confirmation for admin role changes
    if (role === USER_ROLES.ADMIN) {
      setIsConfirmModalOpen(true);
    } else {
      handleConfirmRoleChange();
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedEmployee || !newRole) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateEmployeeRole(selectedEmployee.id, newRole);
      if ('data' in result) {
        toast.success(`Successfully updated ${selectedEmployee.name}'s role to ${newRole}`);
        
        // Refresh the employee list
        const refreshResult = await searchEmployeesForRoleManagement({
          searchQuery,
          page: currentPage,
          pageSize,
        });
        setSearchResult(refreshResult);
      } else {
        toast.error("Failed to update employee role");
      }
    } catch (error) {
      toast.error("Failed to update employee role");
      console.error("Role update error:", error);
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setSelectedEmployee(null);
      setNewRole("");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (!searchResult || searchResult.totalPages <= 1) return null;

    const { currentPage, totalPages, totalCount } = searchResult;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center text-sm text-gray-600">
          Showing {startItem} to {endItem} of {totalCount} employees
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="px-3 py-1 min-w-[32px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1"
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200"
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-indigo-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Role Management</h2>
              <p className="text-sm text-gray-600">Assign and manage employee roles</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users size={16} />
            <span>{searchResult?.totalCount || 0} employees</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <FormInputField
          name="search"
          label="Search employees by name or email"
          icon={<Search size={18} />}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading.fetching ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error.fetchError ? (
          <div className="flex items-center justify-center h-64 text-red-600">
            <p>Error loading employees: {error.fetchError}</p>
          </div>
        ) : !searchResult || searchResult.employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users size={48} className="mb-4" />
            <h3 className="text-lg font-medium mb-2">No employees found</h3>
            <p>Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResult.employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <Users size={16} className="text-indigo-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.role === USER_ROLES.ADMIN
                          ? "bg-red-100 text-red-800"
                          : employee.role === USER_ROLES.MANAGER
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {employee.role || "Employee"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={employee.role || USER_ROLES.EMPLOYEE}
                        onChange={(e) => handleRoleChange(employee, e.target.value)}
                        disabled={isSubmitting}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Confirmation Modal for Admin Role */}
      <BaseModal
        isOpen={isConfirmModalOpen}
        onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}
        title="Confirm Admin Role Assignment"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">
              Are you sure?
            </h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            You are about to assign <strong>{selectedEmployee?.name}</strong> the <strong>Admin</strong> role. 
            This will give them full administrative access to the system.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmRoleChange}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Confirm
            </Button>
          </div>
        </div>
      </BaseModal>
    </motion.div>
  );
}