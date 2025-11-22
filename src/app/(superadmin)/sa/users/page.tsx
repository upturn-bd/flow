"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Superadmin, Company } from "@/lib/types/schemas";
import { Plus, Trash, MagnifyingGlass, X } from "@phosphor-icons/react";
import { filterEmployeesBySearch } from "@/lib/utils/user-search";
import { toast } from "sonner";

interface EmployeeSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  designation?: string;
  company_id: number;
}

export default function SuperadminUsersPage() {
  const [superadmins, setSuperadmins] = useState<Superadmin[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchEmployees();
    } else {
      setEmployees([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch superadmins with joined employee data
      const { data: superadminsData, error: superadminsError } = await supabase
        .from("superadmins")
        .select("*")
        .order("created_at", { ascending: false });

      if (superadminsError) throw superadminsError;

      // Fetch employee data for each superadmin
      let enrichedSuperadmins: Superadmin[] = [];
      if (superadminsData) {
        const employeeIds = superadminsData.map(sa => sa.user_id);
        const { data: employeesData } = await supabase
          .from("employees")
          .select("id, first_name, last_name, email, designation")
          .in("id", employeeIds);

        enrichedSuperadmins = superadminsData.map(sa => ({
          ...sa,
          employee: employeesData?.find(emp => emp.id === sa.user_id)
        }));
      }

      const { data: companiesData } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      setSuperadmins(enrichedSuperadmins);
      if (companiesData) setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load superadmins");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!selectedCompany) return;

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, designation, company_id")
        .eq("company_id", selectedCompany)
        .order("first_name");

      if (error) throw error;
      if (data) setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleAddSuperadmin = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    try {
      // Get the current user (who is granting superadmin access)
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("superadmins").insert([
        {
          user_id: selectedEmployee.id,
          granted_by: user?.id,
          notes: notes || null,
          is_active: true,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error("This user is already a superadmin");
        } else {
          throw error;
        }
      } else {
        toast.success("Superadmin added successfully");
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error adding superadmin:", error);
      toast.error("Failed to add superadmin");
    }
  };

  const handleRemoveSuperadmin = async (id: number) => {
    if (!confirm("Are you sure you want to remove superadmin access for this user?")) {
      return;
    }

    try {
      await supabase.from("superadmins").delete().eq("id", id);
      toast.success("Superadmin access removed");
      fetchData();
    } catch (error) {
      console.error("Error removing superadmin:", error);
      toast.error("Failed to remove superadmin");
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await supabase
        .from("superadmins")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      toast.success(`Superadmin ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
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
      designation: emp.designation,
    })),
    searchTerm
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Superadmin Users</h1>
          <p className="text-gray-600 mt-1">Manage users with superadmin privileges</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Superadmin</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {superadmins.map((superadmin) => (
                  <tr key={superadmin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {superadmin.employee
                          ? `${superadmin.employee.first_name} ${superadmin.employee.last_name}`
                          : "Unknown User"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {superadmin.employee?.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {superadmin.employee?.designation || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(superadmin.id!, superadmin.is_active)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          superadmin.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {superadmin.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {superadmin.granted_at
                        ? new Date(superadmin.granted_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemoveSuperadmin(superadmin.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {superadmins.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No superadmins found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Superadmin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Superadmin User</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Step 1: Select Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  1. Select Company *
                </label>
                <select
                  value={selectedCompany || ""}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value ? parseInt(e.target.value) : null);
                    setSelectedEmployee(null);
                    setSearchTerm("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Search and Select Employee */}
              {selectedCompany && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    2. Search and Select Employee *
                  </label>
                  <div className="relative mb-2">
                    <MagnifyingGlass
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search by name, email, or designation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {selectedEmployee && (
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{selectedEmployee.email}</div>
                        {selectedEmployee.designation && (
                          <div className="text-sm text-gray-600">{selectedEmployee.designation}</div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedEmployee(null)}
                        className="p-1 hover:bg-blue-100 rounded"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}

                  {!selectedEmployee && searchTerm && (
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
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
                              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-sm text-gray-600">{employee.email}</div>
                              {employee.designation && (
                                <div className="text-sm text-gray-500">{employee.designation}</div>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500">No employees found</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Add Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3. Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this superadmin grant..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSuperadmin}
                  disabled={!selectedEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Superadmin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
