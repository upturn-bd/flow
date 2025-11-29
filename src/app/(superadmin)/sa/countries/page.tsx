"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Country } from "@/lib/types/schemas";
import { 
  Plus, 
  Pencil, 
  Trash, 
  MagnifyingGlass,
  GlobeHemisphereWest,
  Buildings,
  X,
  Check,
} from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [countryStats, setCountryStats] = useState<Record<number, number>>({});
  const [inlineEditing, setInlineEditing] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) {
        setCountries(data);
        
        // Fetch company counts for each country
        const stats: Record<number, number> = {};
        await Promise.all(
          data.map(async (country) => {
            const { count } = await supabase
              .from("companies")
              .select("id", { count: "exact", head: true })
              .eq("country_id", country.id);
            stats[country.id] = count || 0;
          })
        );
        setCountryStats(stats);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to fetch countries");
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
      if (editingCountry) {
        const { error } = await supabase
          .from("countries")
          .update({ name: formData.name.trim() })
          .eq("id", editingCountry.id);
        if (error) throw error;
        toast.success("Country updated successfully");
      } else {
        const { error } = await supabase
          .from("countries")
          .insert([{ name: formData.name.trim() }]);
        if (error) throw error;
        toast.success("Country created successfully");
      }

      setShowModal(false);
      setEditingCountry(null);
      setFormData({ name: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving country:", error);
      toast.error("Failed to save country");
    } finally {
      setSaving(false);
    }
  };

  const handleInlineEdit = async (country: Country) => {
    if (!inlineValue.trim() || inlineValue.trim() === country.name) {
      setInlineEditing(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("countries")
        .update({ name: inlineValue.trim() })
        .eq("id", country.id);
      if (error) throw error;
      
      setCountries(prev => prev.map(c => 
        c.id === country.id ? { ...c, name: inlineValue.trim() } : c
      ));
      toast.success("Country updated");
    } catch (error) {
      console.error("Error updating country:", error);
      toast.error("Failed to update country");
    } finally {
      setInlineEditing(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("countries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Country deleted successfully");
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting country:", error);
      toast.error("Failed to delete country. It may be in use by companies.");
    }
  };

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GlobeHemisphereWest size={28} weight="duotone" className="text-emerald-600" />
            Countries
          </h1>
          <p className="text-gray-600 mt-1">Manage countries available for companies</p>
        </div>
        <button
          onClick={() => {
            setEditingCountry(null);
            setFormData({ name: "" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-sm transition-all"
        >
          <Plus size={20} weight="bold" />
          <span>Add Country</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <GlobeHemisphereWest size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{countries.length}</p>
              <p className="text-xs text-gray-500">Total Countries</p>
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
                {countries.filter(c => countryStats[c.id] > 0).length}
              </p>
              <p className="text-xs text-gray-500">With Companies</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <GlobeHemisphereWest size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {countries.filter(c => (countryStats[c.id] || 0) === 0).length}
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
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Countries Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
            <p>Loading countries...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredCountries.map((country) => (
              <motion.div
                key={country.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <GlobeHemisphereWest size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {inlineEditing === country.id ? (
                        <input
                          type="text"
                          value={inlineValue}
                          onChange={(e) => setInlineValue(e.target.value)}
                          onBlur={() => handleInlineEdit(country)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleInlineEdit(country);
                            if (e.key === "Escape") setInlineEditing(null);
                          }}
                          className="w-full px-2 py-1 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <p 
                          className="font-medium text-gray-900 truncate cursor-pointer hover:text-emerald-600 transition-colors"
                          onDoubleClick={() => {
                            setInlineEditing(country.id);
                            setInlineValue(country.name);
                          }}
                          title="Double-click to edit"
                        >
                          {country.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {countryStats[country.id] || 0} companies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setInlineEditing(country.id);
                        setInlineValue(country.name);
                      }}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    {deleteConfirm === country.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(country.id)}
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
                        onClick={() => setDeleteConfirm(country.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={(countryStats[country.id] || 0) > 0}
                        title={(countryStats[country.id] || 0) > 0 ? "Cannot delete: has companies" : "Delete country"}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredCountries.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <GlobeHemisphereWest size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No countries found</p>
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
              setEditingCountry(null);
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
              <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <GlobeHemisphereWest size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {editingCountry ? "Edit Country" : "Add Country"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {editingCountry ? "Update country name" : "Add a new country"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingCountry(null);
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
                    Country Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="e.g., Bangladesh"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCountry(null);
                      setFormData({ name: "" });
                    }}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.name.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {editingCountry ? "Update" : "Create"}
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
