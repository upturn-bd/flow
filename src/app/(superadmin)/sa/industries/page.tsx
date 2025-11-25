"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Industry } from "@/lib/types/schemas";
import { Plus, Pencil, Trash, MagnifyingGlass } from "@/lib/icons";
import { toast } from "sonner";

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("industries")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setIndustries(data);
    } catch (error) {
      console.error("Error fetching industries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingIndustry) {
        await supabase
          .from("industries")
          .update({ name: formData.name })
          .eq("id", editingIndustry.id);
        toast.success("Industry updated successfully");
      } else {
        await supabase.from("industries").insert([{ name: formData.name }]);
        toast.success("Industry created successfully");
      }

      setShowModal(false);
      setFormData({ name: "" });
      setEditingIndustry(null);
      fetchIndustries();
    } catch (error) {
      console.error("Error saving industry:", error);
      toast.error("Failed to save industry");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this industry?")) {
      return;
    }

    try {
      await supabase.from("industries").delete().eq("id", id);
      toast.success("Industry deleted successfully");
      fetchIndustries();
    } catch (error) {
      console.error("Error deleting industry:", error);
      toast.error("Cannot delete industry. It may be in use by companies.");
    }
  };

  const handleEdit = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({ name: industry.name });
    setShowModal(true);
  };

  const filteredIndustries = industries.filter((industry) =>
    industry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Industries</h1>
          <p className="text-gray-600 mt-1">Manage all industries in the system</p>
        </div>
        <button
          onClick={() => {
            setEditingIndustry(null);
            setFormData({ name: "" });
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Industry</span>
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
              placeholder="Search industries..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredIndustries.map((industry) => (
                  <tr key={industry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {industry.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{industry.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(industry)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(industry.id)}
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

            {filteredIndustries.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No industries found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingIndustry ? "Edit Industry" : "Add Industry"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technology"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: "" });
                    setEditingIndustry(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingIndustry ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
