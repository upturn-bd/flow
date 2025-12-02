"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Country } from "@/lib/types/schemas";
import { 
  Plus, 
  Pencil, 
  Trash, 
  GlobeHemisphereWest,
  Buildings,
  Check,
  X,
} from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, SearchBar, StatCard, EmptyState, InlineDeleteConfirm, InlineSpinner } from "@/components/ui";
import SuperadminFormModal from "@/components/ui/modals/SuperadminFormModal";
import { FormField } from "@/components/forms";

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
      <PageHeader
        icon={GlobeHemisphereWest}
        title="Countries"
        description="Manage countries available for companies"
        actions={[
          {
            label: "Add Country",
            icon: <Plus size={20} weight="bold" />,
            onClick: () => {
              setEditingCountry(null);
              setFormData({ name: "" });
              setShowModal(true);
            },
            variant: "gradient",
            color: "emerald",
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          icon={GlobeHemisphereWest}
          value={countries.length}
          label="Total Countries"
          color="green"
        />
        <StatCard
          icon={Buildings}
          value={countries.filter(c => countryStats[c.id] > 0).length}
          label="With Companies"
          color="blue"
        />
        <StatCard
          icon={GlobeHemisphereWest}
          value={countries.filter(c => (countryStats[c.id] || 0) === 0).length}
          label="Unused"
          color="amber"
        />
      </div>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search countries..."
        withContainer
      />

      {/* Countries Grid */}
      {loading ? (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-12">
          <div className="flex flex-col items-center justify-center text-foreground-tertiary">
            <InlineSpinner size="xl" color="emerald" className="mb-4" />
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
                className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
                      <GlobeHemisphereWest size={18} className="text-success" />
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
                          className="w-full px-2 py-1 text-sm border border-success/50 rounded-lg focus:ring-2 focus:ring-success focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <p 
                          className="font-medium text-foreground-primary truncate cursor-pointer hover:text-success transition-colors"
                          onDoubleClick={() => {
                            setInlineEditing(country.id);
                            setInlineValue(country.name);
                          }}
                          title="Double-click to edit"
                        >
                          {country.name}
                        </p>
                      )}
                      <p className="text-xs text-foreground-tertiary">
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
                      className="p-1.5 text-foreground-tertiary hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <InlineDeleteConfirm
                      isConfirming={deleteConfirm === country.id}
                      onConfirm={() => handleDelete(country.id)}
                      onCancel={() => setDeleteConfirm(null)}
                      onDelete={() => setDeleteConfirm(country.id)}
                      disabled={(countryStats[country.id] || 0) > 0}
                      disabledTitle="Cannot delete: has companies"
                      title="Delete country"
                      colorScheme="emerald"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredCountries.length === 0 && !loading && (
        <EmptyState
          icon={GlobeHemisphereWest}
          title="No countries found"
          description={searchTerm ? "Try adjusting your search" : "Add countries to get started"}
        />
      )}

      {/* Modal */}
      <SuperadminFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCountry(null);
          setFormData({ name: "" });
        }}
        onSubmit={handleSubmit}
        title={editingCountry ? "Edit Country" : "Add Country"}
        subtitle={editingCountry ? "Update country name" : "Add a new country"}
        icon={GlobeHemisphereWest}
        colorScheme="emerald"
        saving={saving}
        submitDisabled={!formData.name.trim()}
        isEditing={!!editingCountry}
      >
        <FormField
          name="name"
          label="Country Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ name: e.target.value })}
          placeholder="e.g., Bangladesh"
          autoFocus
        />
      </SuperadminFormModal>
    </div>
  );
}
