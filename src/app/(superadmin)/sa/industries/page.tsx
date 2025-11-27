"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Industry } from "@/lib/types/schemas";
import { 
  Plus, 
  Pencil, 
  Trash, 
  MagnifyingGlass, 
  Factory, 
  X,
  Check,
  Buildings
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [industryStats, setIndustryStats] = useState<Record<number, number>>({});
  const [inlineEditing, setInlineEditing] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("industries")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) {
        setIndustries(data);
        
        // Fetch company counts for each industry
        const stats: Record<number, number> = {};
        await Promise.all(
          data.map(async (industry) => {
            const { count } = await supabase
              .from("companies")
              .select("id", { count: "exact", head: true })
              .eq("industry_id", industry.id);
            stats[industry.id] = count || 0;
          })
        );
        setIndustryStats(stats);
      }
    } catch (error) {
      console.error("Error fetching industries:", error);
      toast.error("Failed to fetch industries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingIndustry) {
        const { error } = await supabase
          .from("industries")
          .update({ name: formData.name.trim() })
          .eq("id", editingIndustry.id);
        if (error) throw error;
        toast.success("Industry updated successfully");
      } else {
        const { error } = await supabase
          .from("industries")
          .insert([{ name: formData.name.trim() }]);
        if (error) throw error;
        toast.success("Industry created successfully");
      }

      setShowModal(false);
      setEditingIndustry(null);
      setFormData({ name: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving industry:", error);
      toast.error("Failed to save industry");
    } finally {
      setSaving(false);
    }
  };

  const handleInlineEdit = async (industry: Industry) => {
    if (!inlineValue.trim() || inlineValue.trim() === industry.name) {
      setInlineEditing(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("industries")
        .update({ name: inlineValue.trim() })
        .eq("id", industry.id);
      if (error) throw error;
      
      setIndustries(prev => prev.map(i => 
        i.id === industry.id ? { ...i, name: inlineValue.trim() } : i
      ));
      toast.success("Industry updated");
    } catch (error) {
      console.error("Error updating industry:", error);
      toast.error("Failed to update industry");
    } finally {
      setInlineEditing(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("industries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Industry deleted successfully");
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting industry:", error);
      toast.error("Failed to delete industry. It may be in use by companies.");
    }
  };

  const filteredIndustries = industries.filter((industry) =>
    industry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Color palette for industry cards
  const colors = [
    { bg: "bg-violet-50", icon: "text-violet-600", hover: "group-hover:bg-violet-100" },
    { bg: "bg-blue-50", icon: "text-blue-600", hover: "group-hover:bg-blue-100" },
    { bg: "bg-cyan-50", icon: "text-cyan-600", hover: "group-hover:bg-cyan-100" },
    { bg: "bg-teal-50", icon: "text-teal-600", hover: "group-hover:bg-teal-100" },
    { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "group-hover:bg-emerald-100" },
    { bg: "bg-amber-50", icon: "text-amber-600", hover: "group-hover:bg-amber-100" },
    { bg: "bg-orange-50", icon: "text-orange-600", hover: "group-hover:bg-orange-100" },
    { bg: "bg-rose-50", icon: "text-rose-600", hover: "group-hover:bg-rose-100" },
  ];

  const getColor = (index: number) => colors[index % colors.length];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory size={28} weight="duotone" className="text-violet-600" />
            Industries
          </h1>
          <p className="text-gray-600 mt-1">Manage industry categories for companies</p>
        </div>
        <button
          onClick={() => {
            setEditingIndustry(null);
            setFormData({ name: "" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg hover:from-violet-700 hover:to-violet-800 shadow-sm transition-all"
        >
          <Plus size={20} weight="bold" />
          <span>Add Industry</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Factory size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{industries.length}</p>
              <p className="text-xs text-gray-500">Total Industries</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Buildings size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {industries.filter(i => industryStats[i.id] > 0).length}
              </p>
              <p className="text-xs text-gray-500">With Companies</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Factory size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {industries.filter(i => (industryStats[i.id] || 0) === 0).length}
              </p>
              <p className="text-xs text-gray-500">Unused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Industries Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-4"></div>
            <p>Loading industries...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredIndustries.map((industry, index) => {
              const color = getColor(index);
              return (
                <motion.div
                  key={industry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 ${color.bg} rounded-lg ${color.hover} transition-colors`}>
                        <Factory size={18} className={color.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {inlineEditing === industry.id ? (
                          <input
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={() => handleInlineEdit(industry)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleInlineEdit(industry);
                              if (e.key === "Escape") setInlineEditing(null);
                            }}
                            className="w-full px-2 py-1 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="font-medium text-gray-900 truncate cursor-pointer hover:text-violet-600 transition-colors"
                            onDoubleClick={() => {
                              setInlineEditing(industry.id);
                              setInlineValue(industry.name);
                            }}
                            title="Double-click to edit"
                          >
                            {industry.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {industryStats[industry.id] || 0} companies
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setInlineEditing(industry.id);
                          setInlineValue(industry.name);
                        }}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      {deleteConfirm === industry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(industry.id)}
                            className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(industry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={(industryStats[industry.id] || 0) > 0}
                          title={(industryStats[industry.id] || 0) > 0 ? "Cannot delete: has companies" : "Delete industry"}
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredIndustries.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Factory size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No industries found</p>
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
              setEditingIndustry(null);
              setFormData({ name: "" });
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b bg-gradient-to-r from-violet-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-xl">
                      <Factory size={24} className="text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {editingIndustry ? "Edit Industry" : "Add Industry"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {editingIndustry ? "Update industry name" : "Add a new industry"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingIndustry(null);
                      setFormData({ name: "" });
                    }}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Industry Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    placeholder="e.g., Technology"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingIndustry(null);
                      setFormData({ name: "" });
                    }}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.name.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {editingIndustry ? "Update" : "Create"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
