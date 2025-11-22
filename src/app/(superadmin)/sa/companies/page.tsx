"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company, Country, Industry } from "@/lib/types/schemas";
import { Plus, Pencil, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyStats, setCompanyStats] = useState<Record<number, { employees: number; teams: number }>>({});
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    industry_id: "",
    country_id: "",
    live_absent_enabled: false,
    payroll_generation_day: 1,
    fiscal_year_start: "",
    live_payroll_enabled: false,
    has_division: false,
  });
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesResult, countriesResult, industriesResult] = await Promise.all([
        supabase
          .from("companies")
          .select("*, industry:industries(id, name), country:countries(id, name)")
          .order("name"),
        supabase.from("countries").select("*").order("name"),
        supabase.from("industries").select("*").order("name"),
      ]);

      if (companiesResult.data) {
        setCompanies(companiesResult.data as Company[]);
        
        // Fetch stats for each company
        const stats: Record<number, { employees: number; teams: number }> = {};
        await Promise.all(
          companiesResult.data.map(async (company) => {
            const [employeesCount, teamsCount] = await Promise.all([
              supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", company.id),
              supabase.from("teams").select("id", { count: "exact", head: true }).eq("company_id", company.id),
            ]);
            stats[company.id] = {
              employees: employeesCount.count || 0,
              teams: teamsCount.count || 0,
            };
          })
        );
        setCompanyStats(stats);
      }
      
      if (countriesResult.data) setCountries(countriesResult.data);
      if (industriesResult.data) setIndustries(industriesResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateCode = (code: string): string => {
    if (code.length <= 8) {
      return "Code must be more than 8 characters";
    }
    if (!/[A-Z]/.test(code)) {
      return "Code must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(code)) {
      return "Code must contain at least one lowercase letter";
    }
    if (!/\W/.test(code)) {
      return "Code must contain at least one special character";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate company code
    const codeValidationError = validateCode(formData.code);
    if (codeValidationError) {
      setCodeError(codeValidationError);
      toast.error(codeValidationError);
      return;
    }
    
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        industry_id: parseInt(formData.industry_id),
        country_id: parseInt(formData.country_id),
        live_absent_enabled: formData.live_absent_enabled,
        payroll_generation_day: formData.payroll_generation_day,
        fiscal_year_start: formData.fiscal_year_start || null,
        live_payroll_enabled: formData.live_payroll_enabled,
        has_division: formData.has_division,
      };

      if (editingCompany) {
        const { error } = await supabase
          .from("companies")
          .update(payload)
          .eq("id", editingCompany.id);
        
        if (error) {
          console.error("Error updating company:", error);
          toast.error(error.message || "Failed to update company");
          return;
        }
        
        toast.success("Company updated successfully");
      } else {
        const { error } = await supabase.from("companies").insert([payload]);
        
        if (error) {
          console.error("Error creating company:", error);
          toast.error(error.message || "Failed to create company");
          return;
        }
        
        toast.success("Company created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    }
  };

  const handleDelete = async (id: number) => {
    const stats = companyStats[id];
    const hasData = stats && (stats.employees > 0 || stats.teams > 0);
    
    let confirmMessage = "Are you sure you want to delete this company?";
    if (hasData) {
      confirmMessage = `This company has ${stats.employees} employee(s) and ${stats.teams} team(s). Deleting it will remove all related data. Are you sure?`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      
      if (error) {
        console.error("Error deleting company:", error);
        
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          toast.error("Cannot delete company: It has associated employees, teams, or other data. Please remove or reassign them first.");
        } else if (error.message) {
          toast.error(error.message);
        } else {
          toast.error("Failed to delete company");
        }
        return;
      }
      
      toast.success("Company deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      industry_id: company.industry_id.toString(),
      country_id: company.country_id.toString(),
      live_absent_enabled: company.live_absent_enabled || false,
      payroll_generation_day: company.payroll_generation_day || 1,
      fiscal_year_start: company.fiscal_year_start || "",
      live_payroll_enabled: company.live_payroll_enabled || false,
      has_division: company.has_division || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      code: "",
      industry_id: "",
      country_id: "",
      live_absent_enabled: false,
      payroll_generation_day: 1,
      fiscal_year_start: "",
      live_payroll_enabled: false,
      has_division: false,
    });
    setCodeError("");
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage all companies in the system</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Company</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settings</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{company.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {company.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {company.industry?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {company.country?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 text-xs text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {companyStats[company.id]?.employees || 0} employees
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {companyStats[company.id]?.teams || 0} teams
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {company.live_absent_enabled && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Absent Tracking</span>
                        )}
                        {company.live_payroll_enabled && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Payroll</span>
                        )}
                        {company.has_division && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Divisions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCompanies.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No companies found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingCompany ? "Edit Company" : "Add Company"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      setFormData({ ...formData, code: newCode });
                      if (newCode) {
                        setCodeError(validateCode(newCode));
                      } else {
                        setCodeError("");
                      }
                    }}
                    placeholder="e.g., MyCompany@2024"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      codeError ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {codeError && (
                    <p className="mt-1 text-xs text-red-600">{codeError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be 9+ characters with uppercase, lowercase, and special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry *
                  </label>
                  <select
                    required
                    value={formData.industry_id}
                    onChange={(e) => setFormData({ ...formData, industry_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Industry</option>
                    {industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    required
                    value={formData.country_id}
                    onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payroll Generation Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payroll_generation_day}
                    onChange={(e) => setFormData({ ...formData, payroll_generation_day: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiscal Year Start
                  </label>
                  <input
                    type="date"
                    value={formData.fiscal_year_start}
                    onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.live_absent_enabled}
                    onChange={(e) => setFormData({ ...formData, live_absent_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable Live Absent Tracking</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.live_payroll_enabled}
                    onChange={(e) => setFormData({ ...formData, live_payroll_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable Live Payroll</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.has_division}
                    onChange={(e) => setFormData({ ...formData, has_division: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Has Divisions</span>
                </label>
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
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCompany ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
