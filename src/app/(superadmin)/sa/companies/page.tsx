"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company, Country, Industry } from "@/lib/types/schemas";
import { Plus, Pencil, Trash, MagnifyingGlass } from "@phosphor-icons/react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
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

      if (companiesResult.data) setCompanies(companiesResult.data as Company[]);
      if (countriesResult.data) setCountries(countriesResult.data);
      if (industriesResult.data) setIndustries(industriesResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        await supabase
          .from("companies")
          .update(payload)
          .eq("id", editingCompany.id);
      } else {
        await supabase.from("companies").insert([payload]);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company? This will delete all related data.")) {
      return;
    }

    try {
      await supabase.from("companies").delete().eq("id", id);
      fetchData();
    } catch (error) {
      console.error("Error deleting company:", error);
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
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
