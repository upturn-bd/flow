"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Filter,
  LoaderCircle,
} from "lucide-react";
import FormInputField from "@/components/ui/FormInputField";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
import { ExtendedEmployee, useEmployees } from "@/hooks/useEmployees";

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
    // Search query (case-insensitive)
    const matchesSearch =
      searchQuery === "" ||
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-6xl mx-auto p-4 sm:p-6 pb-12"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-2 rounded-lg bg-indigo-100 text-indigo-700 mr-3"
        >
          <Users size={24} />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Finder</h1>
          <p className="text-gray-600">
            Search and find detailed information about employees
          </p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={fadeIn} className="bg-white rounded-xl shadow-sm mb-8">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-indigo-700 flex items-center">
            <Search className="w-5 h-5 mr-2" />
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
            <FormInputField
              name="search"
              label="Search employees by name, email, position, or department"
              icon={<Search size={18} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) =>
                        setFilters({ ...filters, department: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-[#EAF4FF] px-3 py-2 text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={filters.designation}
                      onChange={(e) =>
                        setFilters({ ...filters, designation: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-[#EAF4FF] px-3 py-2 text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          <h2 className="text-lg font-semibold text-gray-800">
            Results{" "}
            {filteredEmployees.length > 0 && `(${filteredEmployees.length})`}
          </h2>
        </div>

        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm p-6"
            >
              <LoaderCircle className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-gray-600">Loading employee data...</p>
            </motion.div>
          ) : filteredEmployees.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-sm p-8 text-center"
            >
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No employees found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No employees match your search criteria. Try adjusting your
                filters or search query.
              </p>
            </motion.div>
          ) : (
            <>
              {/* ✅ Table for large screens */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-100">
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
                  <tbody className="divide-y divide-gray-100">
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-gray-800 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-500" />
                          {employee.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {employee.email}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {employee.phone}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {employee.department}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {employee.designation}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
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
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-200"
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-600 mr-4">
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
                        <Mail className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">
                          {employee.email}
                        </span>
                      </div>
                      <div className="flex">
                        <Phone className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">
                          {employee.phone}
                        </span>
                      </div>
                      <div className="flex">
                        <Building className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">
                          {employee.department}
                        </span>
                      </div>
                      <div className="flex">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">
                          Joined:{" "}
                          {employee.joinDate
                            ? formatDate(employee.joinDate)
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 p-4">
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
