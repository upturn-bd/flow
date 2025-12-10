"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, User, Envelope, Phone, Building, Calendar, FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { ExtendedEmployee, useEmployees } from "@/hooks/useEmployees";
import { matchesEmployeeSearch } from "@/lib/utils/user-search";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// FunnelSimple options
type FilterOptions = {
  department: string;
  designation: string;
};

export default function FinderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    department: "",
    designation: "",
  });

  // Use the useEmployees hook
  const { extendedEmployees, loading, fetchExtendedEmployees } = useEmployees();

  // Fetch basic employee data on mount
  useEffect(() => {
    fetchExtendedEmployees();
  }, [fetchExtendedEmployees]);

  // Memoized filtered employees - only recalculates when dependencies change
  const filteredEmployees = useMemo(() => {
    if (extendedEmployees.length === 0) return [];

    return extendedEmployees.filter(employee => {
      // First check search query using unified search
      const matchesSearch = searchQuery === "" || matchesEmployeeSearch(employee, searchQuery);
      
      if (!matchesSearch) return false;
      
      // Then check filters
      const matchesDepartment = filters.department === "" || employee.department === filters.department;
      const matchesDesignation = filters.designation === "" || employee.designation === filters.designation;
      
      return matchesDepartment && matchesDesignation;
    });
  }, [searchQuery, filters, extendedEmployees]);

  // Get unique values for filter dropdowns - memoized
  const departments = useMemo(() => 
    [...new Set(extendedEmployees.map(e => e.department).filter(Boolean))],
    [extendedEmployees]
  );
  
  const positions = useMemo(() => 
    [...new Set(extendedEmployees.map(e => e.designation).filter(Boolean))],
    [extendedEmployees]
  );

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full p-4 sm:p-6 lg:p-8 pb-12"
    >
      {/* Header */}
      <PageHeader
        icon={Users}
        iconColor="text-indigo-600"
        title="Employee Finder"
        description="Search and find detailed information about employees"
      />

      {/* Search and Filters */}
      <div className="bg-surface-primary rounded-xl shadow-sm mb-8">
        <div className="border-b border-border-primary px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-indigo-700 flex items-center">
            <MagnifyingGlass className="w-5 h-5 mr-2" />
            Search Employees
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <FunnelSimple size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </motion.button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search employees by name, email, position, or department"
            />
          </div>
          
          {showFilters && (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-primary">
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({...filters, department: e.target.value})}
                      className="w-full rounded-lg border border-border-secondary bg-[#EAF4FF] px-3 py-2 text-foreground-secondary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Position</label>
                    <select
                      value={filters.designation}
                      onChange={(e) => setFilters({...filters, designation: e.target.value})}
                      className="w-full rounded-lg border border-border-secondary bg-[#EAF4FF] px-3 py-2 text-foreground-secondary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Positions</option>
                      {positions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({
                      department: "",
                      designation: "",
                    })}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground-primary">
            Results {filteredEmployees.length > 0 && `(${filteredEmployees.length})`}
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner
            icon={Users}
            text="Loading employee data..."
            color="purple"
            height="h-64"
          />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="No employees match your search criteria. Try adjusting your filters or search query."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee, index) => (
              <div
                  key={employee.id}
                  className="bg-surface-primary rounded-xl shadow-sm overflow-hidden border border-border-primary transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-surface-primary rounded-full flex items-center justify-center text-indigo-600 mr-4">
                        <User size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{employee.name}</h3>
                        <p className="text-indigo-100 text-sm">{employee.designation}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-3">
                    <div className="flex">
                      <Envelope className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                      <span className="text-foreground-secondary text-sm">{employee.email}</span>
                    </div>
                    <div className="flex">
                      <Phone className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                      <span className="text-foreground-secondary text-sm">{employee.phone}</span>
                    </div>
                    <div className="flex">
                      <Building className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                      <span className="text-foreground-secondary text-sm">{employee.department}</span>
                    </div>
                    <div className="flex">
                      <Calendar className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                      <span className="text-foreground-secondary text-sm">Joined: {employee.joinDate ? formatDate(employee.joinDate) : "N/A"}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-border-primary p-4">
                    <a
                      href={`/hris?uid=${employee.id}`}
                      className="block w-full py-2 text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      View Full Profile
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </motion.div>
  );
}
