"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Envelope, Phone, Building, Calendar, FunnelSimple, Download } from "@phosphor-icons/react";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
import { ExtendedEmployee, useEmployees } from "@/hooks/useEmployees";
import { matchesEmployeeSearch } from "@/lib/utils/user-search";
import { exportEmployeesToCSV } from "@/lib/utils/csv-export";
import { toast } from "sonner";
import { ModulePermissionsBanner } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

// Filter options
type FilterOptions = {
  department: string;
  designation: string;
};

export default function FinderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<
    ExtendedEmployee[]
  >([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    department: "",
    designation: "",
  });

  const { extendedEmployees, loading, fetchExtendedEmployees } = useEmployees();

  useEffect(() => { 
    fetchExtendedEmployees();
  }, [fetchExtendedEmployees]);

useEffect(() => {
  if (extendedEmployees.length === 0) return;

  const filtered = extendedEmployees.filter((employee) => {
    // Search query using unified search (includes name, email, designation)
    // Note: department is not part of the unified search fields but kept here for backward compatibility
    const matchesSearch =
      searchQuery === "" ||
      matchesEmployeeSearch(employee, searchQuery) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filters
    const matchesDepartment =
      filters.department === "" || employee.department === filters.department;

    const matchesDesignation =
      filters.designation === "" || employee.designation === filters.designation;

    return matchesDepartment && matchesDesignation;
  });

  setFilteredEmployees(filtered);
}, [searchQuery, filters, extendedEmployees]);


  const departments = [...new Set(extendedEmployees.map((e) => e.department))];
  const positions = [...new Set(extendedEmployees.map((e) => e.designation))];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return "N/A";
    }
  };

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      toast.error("No employees to export");
      return;
    }

    try {
      exportEmployeesToCSV(filteredEmployees, {
        includeEmail: true,
        includePhone: true,
        includeDepartment: true,
        includeDesignation: true,
        includeJoinDate: true,
        includeSalary: false, // Don't include salary by default
      });
      toast.success(`Exported ${filteredEmployees.length} employee(s) to CSV`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="w-full p-4 sm:p-6 lg:p-8 pb-12"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
        <PageHeader
          title="Employee Finder"
          description="Search and find detailed information about employees"
          icon={Users}
          iconColor="text-indigo-700"
          className="mb-0"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportCSV}
          disabled={loading || filteredEmployees.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          Export CSV
        </motion.button>
      </motion.div>

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.HRIS} title="HRIS" compact />

      {/* Search and Filters */}
      <motion.div variants={fadeIn} className="bg-surface-primary rounded-xl shadow-sm mb-8">
        <div className="border-b border-border-primary px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-indigo-700">
            Search Employees
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Filter size={16} />
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

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-primary">
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) =>
                        setFilters({ ...filters, department: e.target.value })
                      }
                      className="w-full rounded-lg border border-border-secondary bg-[#EAF4FF] px-3 py-2 text-foreground-secondary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                      Position
                    </label>
                    <select
                      value={filters.designation}
                      onChange={(e) =>
                        setFilters({ ...filters, designation: e.target.value })
                      }
                      className="w-full rounded-lg border border-border-secondary bg-[#EAF4FF] px-3 py-2 text-foreground-secondary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Positions</option>
                      {positions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      setFilters({
                        department: "",
                        designation: "",
                      })
                    }
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Reset Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div variants={fadeInUp}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground-primary">
            Results{" "}
            {filteredEmployees.length > 0 && `(${filteredEmployees.length})`}
          </h2>
        </div>

        <AnimatePresence>
          {loading ? (
            <LoadingSpinner
              text="Loading employee data..."
              height="h-64"
              className="bg-surface-primary rounded-xl shadow-sm"
            />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No employees found"
              description="No employees match your search criteria. Try adjusting your filters or search query."
            />
          ) : (
            <>
              {/* ✅ Table for large screens */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full bg-surface-primary rounded-xl shadow-sm border border-border-primary">
                  <thead>
                    <tr className="bg-indigo-50 text-indigo-700 text-left text-sm font-medium">
                      <th className="px-6 py-3 truncate">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Designation</th>
                      <th className="px-6 py-3">Join Date</th>
                      <th className="px-6 py-3 text-center">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-background-secondary dark:bg-background-tertiary transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-foreground-primary flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-500" />
                          {employee.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground-secondary">
                          {employee.email}
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground-secondary">
                          {employee.phone}
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground-secondary">
                          {employee.department}
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground-secondary">
                          {employee.designation}
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground-secondary">
                          {employee.joinDate
                            ? formatDate(employee.joinDate)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <a
                            href={`/hris?uid=${employee.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✅ Card view for small screens */}
              <div className="grid md:grid-cols-2 sm:grid-cols-1 lg:hidden gap-6">
                {filteredEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    variants={fadeIn}
                    whileHover={{
                      y: -5,
                      boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                    className="bg-surface-primary rounded-xl shadow-sm overflow-hidden border border-border-primary transition-all duration-200"
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-surface-primary rounded-full flex items-center justify-center text-indigo-600 mr-4">
                          <User size={28} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{employee.name}</h3>
                          <p className="text-indigo-100 text-sm">
                            {employee.designation}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex">
                        <Envelope className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                        <span className="text-foreground-secondary text-sm">
                          {employee.email}
                        </span>
                      </div>
                      <div className="flex">
                        <Phone className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                        <span className="text-foreground-secondary text-sm">
                          {employee.phone}
                        </span>
                      </div>
                      <div className="flex">
                        <Building className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                        <span className="text-foreground-secondary text-sm">
                          {employee.department}
                        </span>
                      </div>
                      <div className="flex">
                        <Calendar className="w-5 h-5 text-foreground-tertiary mr-3 shrink-0" />
                        <span className="text-foreground-secondary text-sm">
                          Joined:{" "}
                          {employee.joinDate
                            ? formatDate(employee.joinDate)
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border-primary p-4">
                      <motion.a
                        href={`/hris?uid=${employee.id}`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="block w-full py-2 text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View Full Profile
                      </motion.a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
