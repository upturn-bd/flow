"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company, Country, Industry } from "@/lib/types/schemas";
import { 
  Plus, 
  Pencil, 
  Trash, 
  MagnifyingGlass,
  Buildings,
  Users,
  UsersThree,
  X,
  Check,
  Factory,
  Globe,
  Lightning,
  DollarSign as CurrencyDollar,
  LayoutGrid as TreeStructure,
  List,
  LayoutGrid as SquaresFour,
  Settings as Gear,
  CaretUp,
  CaretDown,
  AlertTriangle as Warning,
} from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
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
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateCode = (code: string): string => {
    if (code.length < 9) {
      return "Code must be at least 9 characters";
    }
    if (!/[a-z]/.test(code)) {
      return "Code must contain a lowercase letter";
    }
    if (!/[A-Z]/.test(code)) {
      return "Code must contain an uppercase letter";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(code)) {
      return "Code must contain a special character";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCode(formData.code);
    if (validationError) {
      setCodeError(validationError);
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        code: formData.code,
        industry_id: formData.industry_id ? parseInt(formData.industry_id) : null,
        country_id: formData.country_id ? parseInt(formData.country_id) : null,
        live_absent_enabled: formData.live_absent_enabled,
        payroll_generation_day: formData.payroll_generation_day,
        fiscal_year_start: formData.fiscal_year_start || null,
        live_payroll_enabled: formData.live_payroll_enabled,
        has_division: formData.has_division,
      };

      if (editingCompany) {
        const { error } = await supabase
          .from("companies")
          .update(dataToSave)
          .eq("id", editingCompany.id);
        if (error) throw error;
        toast.success("Company updated successfully");
      } else {
        const { error } = await supabase.from("companies").insert([dataToSave]);
        if (error) throw error;
        toast.success("Company created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
      toast.success("Company deleted successfully");
      setDeleteConfirm(null);
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
      industry_id: company.industry_id?.toString() || "",
      country_id: company.country_id?.toString() || "",
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

  const toggleFeature = async (company: Company, feature: 'live_absent_enabled' | 'live_payroll_enabled' | 'has_division') => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ [feature]: !company[feature] })
        .eq("id", company.id);
      if (error) throw error;
      
      setCompanies(prev => prev.map(c => 
        c.id === company.id ? { ...c, [feature]: !c[feature] } : c
      ));
      toast.success("Setting updated");
    } catch (error) {
      console.error("Error updating feature:", error);
      toast.error("Failed to update setting");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Buildings size={28} weight="duotone" className="text-blue-600" />
            Companies
          </h1>
          <p className="text-gray-600 mt-1">Manage all companies in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface-primary shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <SquaresFour size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${viewMode === "table" ? "bg-surface-primary shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List size={20} />
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all"
          >
            <Plus size={20} weight="bold" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl p-4 shadow-sm border border-border-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Buildings size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
              <p className="text-xs text-gray-500">Total Companies</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 shadow-sm border border-border-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(companyStats).reduce((a, b) => a + b.employees, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 shadow-sm border border-border-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UsersThree size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(companyStats).reduce((a, b) => a + b.teams, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Teams</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 shadow-sm border border-border-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lightning size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter(c => c.live_payroll_enabled).length}
              </p>
              <p className="text-xs text-gray-500">Payroll Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-4">
        <div className="relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search companies by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Companies Grid/Table */}
      {loading ? (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p>Loading companies...</p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCompanies.map((company) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{company.code}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      {deleteConfirm === company.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(company.id)}
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
                          onClick={() => setDeleteConfirm(company.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    {company.industry && (
                      <span className="flex items-center gap-1">
                        <Factory size={14} className="text-gray-400" />
                        {company.industry.name}
                      </span>
                    )}
                    {company.country && (
                      <span className="flex items-center gap-1">
                        <Globe size={14} className="text-gray-400" />
                        {company.country.name}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-gray-900">{companyStats[company.id]?.employees || 0}</p>
                      <p className="text-xs text-gray-500">Employees</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-gray-900">{companyStats[company.id]?.teams || 0}</p>
                      <p className="text-xs text-gray-500">Teams</p>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <button
                    onClick={() => setExpandedCard(expandedCard === company.id ? null : company.id)}
                    className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <Gear size={14} />
                      Settings
                    </span>
                    {expandedCard === company.id ? <CaretUp size={14} /> : <CaretDown size={14} />}
                  </button>

                  <AnimatePresence>
                    {expandedCard === company.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-2">
                          <label className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-sm flex items-center gap-2">
                              <Lightning size={16} className="text-green-600" />
                              Absent Tracking
                            </span>
                            <input
                              type="checkbox"
                              checked={company.live_absent_enabled}
                              onChange={() => toggleFeature(company, 'live_absent_enabled')}
                              className="rounded border-border-secondary text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                          <label className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-sm flex items-center gap-2">
                              <CurrencyDollar size={16} className="text-blue-600" />
                              Live Payroll
                            </span>
                            <input
                              type="checkbox"
                              checked={company.live_payroll_enabled}
                              onChange={() => toggleFeature(company, 'live_payroll_enabled')}
                              className="rounded border-border-secondary text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                          <label className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-sm flex items-center gap-2">
                              <TreeStructure size={16} className="text-purple-600" />
                              Has Divisions
                            </span>
                            <input
                              type="checkbox"
                              checked={company.has_division}
                              onChange={() => toggleFeature(company, 'has_division')}
                              className="rounded border-border-secondary text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Active Features Bar */}
                <div className="px-5 py-2 bg-gray-50 border-t flex flex-wrap gap-1.5">
                  {company.live_absent_enabled && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Absent</span>
                  )}
                  {company.live_payroll_enabled && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Payroll</span>
                  )}
                  {company.has_division && (
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Divisions</span>
                  )}
                  {!company.live_absent_enabled && !company.live_payroll_enabled && !company.has_division && (
                    <span className="text-xs text-gray-400">No features enabled</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500 font-mono">{company.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company.industry?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {company.country?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users size={14} className="text-gray-400" />
                          {companyStats[company.id]?.employees || 0}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <UsersThree size={14} className="text-gray-400" />
                          {companyStats[company.id]?.teams || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {company.live_absent_enabled && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Absent</span>
                        )}
                        {company.live_payroll_enabled && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Payroll</span>
                        )}
                        {company.has_division && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Divisions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        {deleteConfirm === company.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(company.id)}
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
                            onClick={() => setDeleteConfirm(company.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center">
              <Buildings size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No companies found</p>
            </div>
          )}
        </div>
      )}

      {filteredCompanies.length === 0 && !loading && viewMode === "grid" && (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-12 text-center">
          <Buildings size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No companies found</p>
        </div>
      )}

      {/* Modal */}
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
              className="bg-surface-primary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Buildings size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {editingCompany ? "Edit Company" : "Add Company"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {editingCompany ? "Update company details" : "Create a new company"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-surface-primary/50 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-border-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Code <span className="text-red-500">*</span>
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
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                        codeError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-border-primary'
                      }`}
                    />
                    {codeError ? (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <Warning size={12} />
                        {codeError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-gray-500">
                        9+ chars with uppercase, lowercase, and special character
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.industry_id}
                      onChange={(e) => setFormData({ ...formData, industry_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-border-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.country_id}
                      onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-border-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Payroll Generation Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.payroll_generation_day}
                      onChange={(e) => setFormData({ ...formData, payroll_generation_day: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-border-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Fiscal Year Start
                    </label>
                    <input
                      type="date"
                      value={formData.fiscal_year_start}
                      onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
                      className="w-full px-3 py-2.5 border border-border-primary rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Feature Settings</h3>
                  <label className="flex items-center justify-between p-3 bg-surface-primary rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <Lightning size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Live Absent Tracking</p>
                        <p className="text-xs text-gray-500">Track employee absences in real-time</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.live_absent_enabled}
                      onChange={(e) => setFormData({ ...formData, live_absent_enabled: e.target.checked })}
                      className="rounded border-border-secondary text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-surface-primary rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <CurrencyDollar size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Live Payroll</p>
                        <p className="text-xs text-gray-500">Enable live payroll processing</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.live_payroll_enabled}
                      onChange={(e) => setFormData({ ...formData, live_payroll_enabled: e.target.checked })}
                      className="rounded border-border-secondary text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-surface-primary rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <TreeStructure size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Has Divisions</p>
                        <p className="text-xs text-gray-500">Enable divisional structure</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.has_division}
                      onChange={(e) => setFormData({ ...formData, has_division: e.target.checked })}
                      className="rounded border-border-secondary text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </form>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 border border-border-secondary rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {editingCompany ? "Update Company" : "Create Company"}
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
