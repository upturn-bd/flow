"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company } from "@/lib/types/schemas";
import { filterEmployeesBySearch } from "@/lib/utils/user-search";
import { 
  Plus, 
  Trash, 
  MagnifyingGlass, 
  ShieldCheck, 
  X,
  Check,
  User,
  Buildings,
  Calendar,
  Lightning as Power,
  AlertTriangle as Warning,
  Star as Crown,
  CaretDown
} from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  designation: string | null;
}

interface Superadmin {
  id?: number;
  employee_id: number;
  is_active: boolean;
  granted_at?: string;
  notes?: string;
  employee?: Employee;
}

export default function SuperadminUsersPage() {
  const [superadmins, setSuperadmins] = useState<Superadmin[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [superadminsResult, companiesResult] = await Promise.all([
        supabase
          .from("superadmins")
          .select("*, employee:employees(id, first_name, last_name, email, designation)")
          .order("granted_at", { ascending: false }),
        supabase.from("companies").select("*").order("name"),
      ]);

      if (superadminsResult.data) setSuperadmins(superadminsResult.data);
      if (companiesResult.data) setCompanies(companiesResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch employees when company is selected
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!selectedCompany) {
        setEmployees([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name, email, designation")
          .eq("company_id", selectedCompany)
          .order("first_name");

        if (error) throw error;
        
        // Filter out employees who are already superadmins
        const superadminEmployeeIds = superadmins.map(sa => sa.employee_id);
        const availableEmployees = (data || []).filter(
          emp => !superadminEmployeeIds.includes(emp.id)
        );
        
        setEmployees(availableEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees");
      }
    };

    fetchEmployees();
  }, [selectedCompany, superadmins]);

  const handleAddSuperadmin = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("superadmins").insert([
        {
          employee_id: selectedEmployee.id,
          is_active: true,
          notes: notes || null,
        },
      ]);

      if (error) throw error;

      toast.success("Superadmin added successfully");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error adding superadmin:", error);
      toast.error("Failed to add superadmin");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSuperadmin = async (id: number) => {
    try {
      const { error } = await supabase.from("superadmins").delete().eq("id", id);
      if (error) throw error;
      toast.success("Superadmin removed successfully");
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Error removing superadmin:", error);
      toast.error("Failed to remove superadmin");
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("superadmins")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      
      setSuperadmins(prev => prev.map(sa => 
        sa.id === id ? { ...sa, is_active: !currentStatus } : sa
      ));
      toast.success(`Superadmin ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error("Error toggling superadmin status:", error);
      toast.error("Failed to update superadmin status");
    }
  };

  const resetForm = () => {
    setSelectedCompany(null);
    setSelectedEmployee(null);
    setSearchTerm("");
    setNotes("");
    setEmployees([]);
  };

  // Filter employees based on search term using unified search utility
  const filteredEmployees = filterEmployeesBySearch(
    employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      designation: emp.designation || undefined,
    })),
    searchTerm
  );

  const filteredSuperadmins = superadmins.filter(sa => {
    if (filterActive === "active") return sa.is_active;
    if (filterActive === "inactive") return !sa.is_active;
    return true;
  });

  const stats = {
    total: superadmins.length,
    active: superadmins.filter(sa => sa.is_active).length,
    inactive: superadmins.filter(sa => !sa.is_active).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={28} weight="duotone" className="text-amber-600" />
            Superadmin Users
          </h1>
          <p className="text-gray-600 mt-1">Manage users with superadmin privileges</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 shadow-sm transition-all"
        >
          <Plus size={20} weight="bold" />
          <span>Add Superadmin</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilterActive("all")}
          className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filterActive === "all" ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ShieldCheck size={20} className="text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Superadmins</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilterActive("active")}
          className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filterActive === "active" ? "border-green-300 ring-2 ring-green-100" : "border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Power size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilterActive("inactive")}
          className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filterActive === "inactive" ? "border-gray-400 ring-2 ring-gray-200" : "border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Power size={20} className="text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              <p className="text-xs text-gray-500">Inactive</p>
            </div>
          </div>
        </button>
      </div>

      {/* Superadmins List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mb-4"></div>
            <p>Loading superadmins...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredSuperadmins.map((superadmin) => (
              <motion.div
                key={superadmin.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  superadmin.is_active ? "border-gray-100 hover:border-amber-200" : "border-gray-200 opacity-75"
                }`}
              >
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${superadmin.is_active ? "bg-amber-100" : "bg-gray-100"}`}>
                      <Crown size={24} className={superadmin.is_active ? "text-amber-600" : "text-gray-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {superadmin.employee
                            ? `${superadmin.employee.first_name} ${superadmin.employee.last_name}`
                            : "Unknown User"}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          superadmin.is_active 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {superadmin.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {superadmin.employee?.email && (
                          <span className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            {superadmin.employee.email}
                          </span>
                        )}
                        {superadmin.employee?.designation && (
                          <span className="flex items-center gap-1">
                            <Buildings size={14} className="text-gray-400" />
                            {superadmin.employee.designation}
                          </span>
                        )}
                        {superadmin.granted_at && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            Granted {new Date(superadmin.granted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {superadmin.notes && (
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          {superadmin.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(superadmin.id!, superadmin.is_active)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                        superadmin.is_active
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      <Power size={16} />
                      {superadmin.is_active ? "Deactivate" : "Activate"}
                    </button>
                    {deleteConfirm === superadmin.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveSuperadmin(superadmin.id!)}
                          className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(superadmin.id!)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredSuperadmins.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {filterActive !== "all" 
              ? `No ${filterActive} superadmins found`
              : "No superadmins found"}
          </p>
        </div>
      )}

      {/* Add Superadmin Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <ShieldCheck size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Add Superadmin</h2>
                      <p className="text-sm text-gray-500">Grant superadmin privileges to an employee</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Step 1: Select Company */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">1</span>
                    Select Company
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCompany || ""}
                      onChange={(e) => {
                        setSelectedCompany(e.target.value ? parseInt(e.target.value) : null);
                        setSelectedEmployee(null);
                        setSearchTerm("");
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <CaretDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Step 2: Search and Select Employee */}
                <div className={selectedCompany ? "" : "opacity-50 pointer-events-none"}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">2</span>
                    Search and Select Employee
                  </label>
                  
                  {selectedEmployee ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <User size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedEmployee.first_name} {selectedEmployee.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
                          {selectedEmployee.designation && (
                            <p className="text-sm text-gray-500">{selectedEmployee.designation}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedEmployee(null)}
                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <X size={20} className="text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-3">
                        <MagnifyingGlass
                          size={20}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search by name, email, or designation..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        />
                      </div>

                      {searchTerm && (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => {
                              const employee = employees.find(e => e.id === emp.id)!;
                              return (
                                <button
                                  key={employee.id}
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setSearchTerm("");
                                  }}
                                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                >
                                  <div className="p-2 bg-gray-100 rounded-lg">
                                    <User size={18} className="text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {employee.first_name} {employee.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{employee.email}</p>
                                    {employee.designation && (
                                      <p className="text-sm text-gray-500">{employee.designation}</p>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-6 text-center text-gray-500">
                              <User size={32} className="mx-auto text-gray-300 mb-2" />
                              <p>No employees found</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!searchTerm && selectedCompany && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Start typing to search for employees
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Step 3: Notes */}
                <div className={selectedEmployee ? "" : "opacity-50 pointer-events-none"}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">3</span>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                    placeholder="Add any notes about this superadmin grant..."
                  />
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Warning size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Important</p>
                    <p className="mt-1">Superadmin privileges grant full access to all companies and system settings. Only grant to trusted employees.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSuperadmin}
                  disabled={saving || !selectedEmployee}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Add Superadmin
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
