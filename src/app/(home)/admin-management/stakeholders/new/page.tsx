"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { useEmployees } from "@/hooks/useEmployees";
import { useStakeholderTypes } from "@/hooks/useStakeholderTypes";
import { ArrowLeft, AlertCircle, Plus, Trash2 } from "lucide-react";
import { ContactPerson } from "@/lib/types/schemas";

export default function NewStakeholderPage() {
  const router = useRouter();
  const { processes, activeProcesses, stakeholders, loading, createStakeholder, fetchProcesses, fetchStakeholders } = useStakeholders();
  const { employees, fetchEmployees } = useEmployees();
  const { activeStakeholderTypes, fetchStakeholderTypes } = useStakeholderTypes();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    process_id: "",
    stakeholder_type_id: "",
    kam_id: "", // Changed from issue_handler_id
    parent_stakeholder_id: "",
  });

  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProcesses();
    fetchEmployees();
    fetchStakeholderTypes();
    fetchStakeholders(); // Fetch stakeholders for parent selection
  }, [fetchProcesses, fetchEmployees, fetchStakeholderTypes, fetchStakeholders]);

  const handleAddContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      { name: "", email: "", phone: "" },
    ]);
  };

  const handleRemoveContactPerson = (index: number) => {
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  const handleContactPersonChange = (
    index: number,
    field: keyof ContactPerson,
    value: string
  ) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.process_id) {
      newErrors.process_id = "Please select a process";
    }

    // Validate contact persons
    contactPersons.forEach((cp, index) => {
      if (cp.name && !cp.email && !cp.phone) {
        newErrors[`contact_${index}`] = "Contact person must have email or phone";
      }
      if (cp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cp.email)) {
        newErrors[`contact_${index}_email`] = "Invalid email format";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // Filter out empty contact persons
      const validContactPersons = contactPersons.filter(
        (cp) => cp.name.trim() && (cp.email?.trim() || cp.phone?.trim())
      );

      await createStakeholder({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        process_id: parseInt(formData.process_id),
        stakeholder_type_id: formData.stakeholder_type_id ? parseInt(formData.stakeholder_type_id) : undefined,
        parent_stakeholder_id: formData.parent_stakeholder_id ? parseInt(formData.parent_stakeholder_id) : undefined,
        contact_persons: validContactPersons,
        is_active: true, // New leads are active by default
        kam_id: formData.kam_id || undefined, // Changed from issue_handler_id
      });
        issue_handler_id: formData.issue_handler_id || undefined,
      });

      router.push("/admin-management/stakeholders");
    } catch (error) {
      console.error("Error creating stakeholder:", error);
      setErrors({ submit: "Failed to create stakeholder. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Show error if no processes exist
  if (!loading && activeProcesses.length === 0) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No Stakeholder Processes Found
            </h2>
            <p className="text-gray-600 mb-6">
              You need to create at least one active stakeholder process before adding leads.
              Processes define the workflow and steps for converting leads into stakeholders.
            </p>
            <button
              onClick={() => router.push("/admin-management/company-configurations/stakeholder-processes")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Go to Process Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Lead</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter stakeholder/company name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter full address (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stakeholder Type
              </label>
              <select
                value={formData.stakeholder_type_id}
                onChange={(e) => setFormData({ ...formData, stakeholder_type_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">None (No type selected)</option>
                {activeStakeholderTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Optional categorization (e.g., Client, Vendor, Partner)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Process <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.process_id}
                onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.process_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a process</option>
                {activeProcesses.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.name} ({process.is_sequential ? "Sequential" : "Independent"})
                  </option>
                ))}
              </select>
              {errors.process_id && (
                <p className="text-red-500 text-sm mt-1">{errors.process_id}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Select the workflow process this lead will follow
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Stakeholder
              </label>
              <select
                value={formData.parent_stakeholder_id}
                onChange={(e) => setFormData({ ...formData, parent_stakeholder_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">None (No parent stakeholder)</option>
                {stakeholders.filter(s => s.status !== 'Rejected').map((stakeholder) => (
                  <option key={stakeholder.id} value={stakeholder.id}>
                    {stakeholder.name} ({stakeholder.status})
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Optional parent stakeholder for hierarchical relationships (e.g., subsidiary companies)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Accounts Manager (KAM)
              </label>
              <select
                value={formData.kam_id}
                onChange={(e) => setFormData({ ...formData, kam_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">None (No KAM assigned)</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Assign a Key Accounts Manager who will receive notifications for any changes (optional)
              </p>
            </div>
          </div>

          {/* Contact Persons */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Contact Persons</h2>
              <button
                type="button"
                onClick={handleAddContactPerson}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus size={16} />
                Add Contact
              </button>
            </div>

            {contactPersons.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No contact persons added yet. Click "Add Contact" to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {contactPersons.map((contact, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Contact Person {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContactPerson(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) =>
                            handleContactPersonChange(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contact.email || ""}
                          onChange={(e) =>
                            handleContactPersonChange(index, "email", e.target.value)
                          }
                          className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                            errors[`contact_${index}_email`]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="email@example.com"
                        />
                        {errors[`contact_${index}_email`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`contact_${index}_email`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={contact.phone || ""}
                          onChange={(e) =>
                            handleContactPersonChange(index, "phone", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    {errors[`contact_${index}`] && (
                      <p className="text-red-500 text-xs">{errors[`contact_${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
