"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { useStakeholderTypes } from "@/hooks/useStakeholderTypes";
import { useFormState } from "@/hooks/useFormState";
import { validateStakeholderType, validationErrorsToObject } from "@/lib/validation/schemas/stakeholders";
import { StakeholderTypeFormData } from "@/hooks/useStakeholderTypes";
import FormModal from "@/components/ui/modals/FormModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fadeInUp } from "@/components/ui/animations";

export default function StakeholderTypeManagementView() {
  const {
    stakeholderTypes,
    loading,
    error,
    fetchStakeholderTypes,
    createStakeholderType,
    updateStakeholderType,
    deleteStakeholderType,
    processingId,
  } = useStakeholderTypes();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  useEffect(() => {
    fetchStakeholderTypes(true); // Include inactive types
  }, [fetchStakeholderTypes]);

  const handleAdd = () => {
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async (typeId: number) => {
    if (confirm("Are you sure you want to delete this stakeholder type?")) {
      await deleteStakeholderType(typeId);
    }
  };

  const handleToggleActive = async (type: any) => {
    await updateStakeholderType(type.id, { is_active: !type.is_active });
  };

  return (
    <motion.div variants={fadeInUp}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Stakeholder Types</h3>
            <p className="text-sm text-gray-600">
              Configure stakeholder type categories (e.g., Client, Vendor, Partner)
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Type
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading && stakeholderTypes.length === 0 ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : stakeholderTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No stakeholder types configured yet.</p>
            <p className="text-sm mt-1">Click "Add Type" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stakeholderTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {type.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {type.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(type)}
                        disabled={processingId === type.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          type.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id!)}
                          disabled={processingId === type.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isFormOpen && (
          <StakeholderTypeFormModal
            type={editingType}
            onClose={() => {
              setIsFormOpen(false);
              setEditingType(null);
            }}
            onSave={async (data) => {
              if (editingType) {
                await updateStakeholderType(editingType.id, data);
              } else {
                await createStakeholderType(data);
              }
              setIsFormOpen(false);
              setEditingType(null);
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ==============================================================================
// Form Modal Component
// ==============================================================================

interface StakeholderTypeFormModalProps {
  type: any;
  onClose: () => void;
  onSave: (data: StakeholderTypeFormData) => Promise<void>;
}

function StakeholderTypeFormModal({
  type,
  onClose,
  onSave,
}: StakeholderTypeFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const initialData: StakeholderTypeFormData = {
    name: type?.name || "",
    description: type?.description || "",
    is_active: type?.is_active !== undefined ? type.is_active : true,
  };

  const { formData, errors, isDirty, handleChange, setErrors } =
    useFormState<StakeholderTypeFormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateStakeholderType(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrorsToObject(validationErrors));
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving stakeholder type:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      title={type ? "Edit Stakeholder Type" : "Add Stakeholder Type"}
      onSubmit={handleSubmit}
      submitText={type ? "Update" : "Create"}
      submitting={submitting}
      isDirty={isDirty}
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Client, Vendor, Partner"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Optional description of this stakeholder type"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={(e) =>
              handleChange({
                target: { name: "is_active", value: e.target.checked },
              } as any)
            }
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
      </div>
    </FormModal>
  );
}
