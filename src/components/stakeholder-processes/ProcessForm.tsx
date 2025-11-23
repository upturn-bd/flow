"use client";

import { useState, useEffect } from "react";
import { StakeholderProcess } from "@/lib/types/schemas";
import { X } from "@/lib/icons";
import Toggle from "@/components/ui/Toggle";

interface ProcessFormProps {
  process?: StakeholderProcess | null;
  onSubmit: (data: ProcessFormData) => Promise<void>;
  onClose: () => void;
}

export interface ProcessFormData {
  name: string;
  description?: string;
  is_active: boolean;
  is_sequential: boolean;
  allow_rollback: boolean;
}

export default function ProcessForm({ process, onSubmit, onClose }: ProcessFormProps) {
  const [formData, setFormData] = useState<ProcessFormData>({
    name: "",
    description: "",
    is_active: true,
    is_sequential: true,
    allow_rollback: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (process) {
      setFormData({
        name: process.name,
        description: process.description || "",
        is_active: process.is_active,
        is_sequential: process.is_sequential,
        allow_rollback: process.allow_rollback,
      });
    }
  }, [process]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Process name is required";
    }

    if (!formData.is_sequential && formData.allow_rollback) {
      newErrors.allow_rollback = "Rollback is only applicable for sequential processes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {process ? "Edit Process" : "Create New Process"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Process Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.name ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="e.g., Client Onboarding Process"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              placeholder="Describe the purpose of this process..."
            />
          </div>

          {/* Status */}
          <div className="pt-2">
            <Toggle
              checked={formData.is_active}
              onChange={(checked) => setFormData({ ...formData, is_active: checked })}
              label="Active Process"
              description="Only active processes can be assigned to new stakeholders"
            />
          </div>

          {/* Process Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Process Type
            </label>

            <div className="space-y-2.5 sm:space-y-3">
              <label className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.is_sequential
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                <div>
                  <input
                    type="radio"
                    checked={formData.is_sequential}
                    onChange={() => setFormData({ ...formData, is_sequential: true })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Sequential Steps</div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Steps must be completed in order (1 → 2 → 3)
                  </p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${!formData.is_sequential
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                <div>
                  <input
                    type="radio"
                    checked={!formData.is_sequential}
                    onChange={() => setFormData({ ...formData, is_sequential: false, allow_rollback: false })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Independent Steps</div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Steps can be completed in any order
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Allow Rollback (only for sequential) */}
          {formData.is_sequential && (
            <div className="pl-3 sm:pl-4 border-l-2 border-blue-500 py-1">
              <Toggle
                checked={formData.allow_rollback}
                onChange={(checked) => setFormData({ ...formData, allow_rollback: checked })}
                label="Allow Rollback"
                description="Users can go back to previous steps after completing them"
              />
              {errors.allow_rollback && (
                <p className="mt-2 text-sm text-red-600">{errors.allow_rollback}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {process ? "Updating..." : "Creating..."}
                </span>
              ) : (
                process ? "Update Process" : "Create Process"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
