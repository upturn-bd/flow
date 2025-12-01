"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Industry } from "@/lib/types/schemas";
import { 
  Plus, 
  Pencil, 
  Trash, 
  Factory,
  Buildings,
  Check,
  X,
} from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, SearchBar, StatCard, EmptyState, InlineDeleteConfirm, InlineSpinner } from "@/components/ui";
import SuperadminFormModal from "@/components/ui/modals/SuperadminFormModal";

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
    { bg: "bg-purple-50 dark:bg-purple-950/30", icon: "text-purple-600 dark:text-purple-400", hover: "group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40" },
    { bg: "bg-primary-50 dark:bg-primary-950/30", icon: "text-primary-600 dark:text-primary-400", hover: "group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40" },
    { bg: "bg-cyan-50 dark:bg-cyan-950/30", icon: "text-cyan-600 dark:text-cyan-400", hover: "group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40" },
    { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "text-teal-600 dark:text-teal-400", hover: "group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400", hover: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40" },
    { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-600 dark:text-amber-400", hover: "group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40" },
    { bg: "bg-orange-50 dark:bg-orange-950/30", icon: "text-orange-600 dark:text-orange-400", hover: "group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40" },
    { bg: "bg-rose-50 dark:bg-rose-950/30", icon: "text-rose-600 dark:text-rose-400", hover: "group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40" },
  ];

  const getColor = (index: number) => colors[index % colors.length];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={Factory}
        title="Industries"
        description="Manage industry categories for companies"
        actions={[
          {
            label: "Add Industry",
            icon: <Plus size={20} weight="bold" />,
            onClick: () => {
              setEditingIndustry(null);
              setFormData({ name: "" });
              setShowModal(true);
            },
            variant: "gradient",
            color: "violet",
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Factory}
          value={industries.length}
          label="Total Industries"
          color="purple"
        />
        <StatCard
          icon={Buildings}
          value={industries.filter(i => industryStats[i.id] > 0).length}
          label="With Companies"
          color="blue"
        />
        <StatCard
          icon={Factory}
          value={industries.filter(i => (industryStats[i.id] || 0) === 0).length}
          label="Unused"
          color="amber"
        />
      </div>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search industries..."
        withContainer
      />

      {/* Industries Grid */}
      {loading ? (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-12">
          <div className="flex flex-col items-center justify-center text-foreground-tertiary">
            <InlineSpinner size="xl" color="violet" className="mb-4" />
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
                  className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-4 hover:shadow-md transition-all group"
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
                            className="w-full px-2 py-1 text-sm border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <p 
                            className="font-medium text-foreground-primary truncate cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            onDoubleClick={() => {
                              setInlineEditing(industry.id);
                              setInlineValue(industry.name);
                            }}
                            title="Double-click to edit"
                          >
                            {industry.name}
                          </p>
                        )}
                        <p className="text-xs text-foreground-tertiary">
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
                        className="p-1.5 text-foreground-tertiary hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <InlineDeleteConfirm
                        isConfirming={deleteConfirm === industry.id}
                        onConfirm={() => handleDelete(industry.id)}
                        onCancel={() => setDeleteConfirm(null)}
                        onDelete={() => setDeleteConfirm(industry.id)}
                        disabled={(industryStats[industry.id] || 0) > 0}
                        disabledTitle="Cannot delete: has companies"
                        title="Delete industry"
                        colorScheme="violet"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredIndustries.length === 0 && !loading && (
        <EmptyState
          icon={Factory}
          title="No industries found"
          description={searchTerm ? "Try adjusting your search criteria" : "Get started by creating your first industry"}
          action={!searchTerm ? {
            label: "Add Industry",
            onClick: () => {
              setEditingIndustry(null);
              setFormData({ name: "" });
              setShowModal(true);
            }
          } : undefined}
        />
      )}

      {/* Modal */}
      <SuperadminFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingIndustry(null);
          setFormData({ name: "" });
        }}
        onSubmit={handleSubmit}
        title={editingIndustry ? "Edit Industry" : "Add Industry"}
        subtitle={editingIndustry ? "Update industry name" : "Add a new industry"}
        icon={Factory}
        colorScheme="violet"
        saving={saving}
        submitDisabled={!formData.name.trim()}
        isEditing={!!editingIndustry}
      >
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            Industry Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            className="w-full px-3 py-2.5 border border-border-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-surface-primary text-foreground-primary"
            placeholder="e.g., Technology"
            autoFocus
          />
        </div>
      </SuperadminFormModal>
    </div>
  );
}
