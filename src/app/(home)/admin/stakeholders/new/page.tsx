"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStakeholders } from "@/hooks/useStakeholders";
import { useEmployees } from "@/hooks/useEmployees";
import { useStakeholderTypes } from "@/hooks/useStakeholderTypes";
import { ArrowLeft, WarningCircle, Plus, TrashSimple } from "@phosphor-icons/react";
import { ContactPerson } from "@/lib/types/schemas";
import { FormField, TextAreaField, SelectField, ToggleField } from "@/components/forms";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

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

  const [createAsPermanent, setCreateAsPermanent] = useState(false);

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

    // Process is only required for leads, not permanent stakeholders
    if (!createAsPermanent && !formData.process_id) {
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
      // FunnelSimple out empty contact persons
      const validContactPersons = contactPersons.filter(
        (cp) => cp.name.trim() && (cp.email?.trim() || cp.phone?.trim())
      );

      await createStakeholder({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        process_id: formData.process_id ? parseInt(formData.process_id) : undefined,
        stakeholder_type_id: formData.stakeholder_type_id ? parseInt(formData.stakeholder_type_id) : undefined,
        parent_stakeholder_id: formData.parent_stakeholder_id ? parseInt(formData.parent_stakeholder_id) : undefined,
        contact_persons: validContactPersons,
        is_active: true,
        kam_id: formData.kam_id || undefined,
        createAsPermanent, // Pass the permanent flag
      });

      router.push("/admin/stakeholders");
    } catch (error) {
      console.error("Error creating stakeholder:", error);
      setErrors({ submit: "Failed to create stakeholder. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Show error if no processes exist (only for lead creation)
  if (!loading && !createAsPermanent && activeProcesses.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-warning/10 border-2 border-warning/30 dark:bg-warning/20 rounded-lg p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-warning/20 rounded-full mb-3 sm:mb-4">
              <WarningCircle className="text-warning" size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground-primary mb-2">
              No Stakeholder Processes Found
            </h2>
            <p className="text-sm sm:text-base text-foreground-secondary mb-4 sm:mb-6">
              You need to create at least one active stakeholder process before adding leads.
              Processes define the workflow and steps for converting leads into stakeholders.
            </p>
            <button
              onClick={() => router.push("/admin/config/stakeholder-process")}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Go to Process Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumbs */}
      <AdminBreadcrumbs 
        section="Company Logs"
        pageName="Add New Lead"
        icon={<Plus className="w-4 h-4" />}
      />
      
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-primary mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground-primary mb-4 sm:mb-6">
          {createAsPermanent ? "Add Permanent Stakeholder" : "Add New Lead"}
        </h1>

        {/* Stakeholder Type Toggle */}
        <div className="bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
          <ToggleField
            label="Create as Permanent Stakeholder"
            description={createAsPermanent 
              ? "Will be created directly as a permanent stakeholder, skipping the lead process workflow"
              : "Will be created as a lead and must go through the configured process to become permanent"}
            checked={createAsPermanent}
            onChange={(checked) => {
              setCreateAsPermanent(checked);
              // Clear process_id when switching to permanent
              if (checked) {
                setFormData({ ...formData, process_id: "" });
              }
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground-primary">Basic Information</h2>

            <FormField
              name="name"
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              placeholder="Enter stakeholder/company name"
            />

            <TextAreaField
              name="address"
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              placeholder="Enter full address (optional)"
            />

            <SelectField
              name="stakeholder_type_id"
              label="Stakeholder Type"
              value={formData.stakeholder_type_id}
              onChange={(e) => setFormData({ ...formData, stakeholder_type_id: e.target.value })}
              options={[
                { value: "", label: "None (No type selected)" },
                ...activeStakeholderTypes.filter((type) => type.id !== undefined).map((type) => ({
                  value: type.id!.toString(),
                  label: type.name
                }))
              ]}
            />
            <p className="text-foreground-tertiary text-sm -mt-3 mb-2">
              Optional categorization (e.g., Client, Vendor, Partner)
            </p>

            {!createAsPermanent && (
              <>
                <SelectField
                  name="process_id"
                  label="Process"
                  required
                  value={formData.process_id}
                  onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
                  error={errors.process_id}
                  options={[
                    { value: "", label: "Select a process" },
                    ...activeProcesses.filter((process) => process.id !== undefined).map((process) => ({
                      value: process.id!.toString(),
                      label: `${process.name} (${process.is_sequential ? "Sequential" : "Independent"})`
                    }))
                  ]}
                />
                <p className="text-foreground-tertiary text-sm -mt-3 mb-2">
                  Select the workflow process this lead will follow
                </p>
              </>
            )}

            <SelectField
              name="parent_stakeholder_id"
              label="Parent Stakeholder"
              value={formData.parent_stakeholder_id}
              onChange={(e) => setFormData({ ...formData, parent_stakeholder_id: e.target.value })}
              options={[
                { value: "", label: "None (No parent stakeholder)" },
                ...stakeholders.filter(s => s.status !== 'Rejected' && s.id !== undefined).map((stakeholder) => ({
                  value: stakeholder.id!.toString(),
                  label: `${stakeholder.name} (${stakeholder.status})`
                }))
              ]}
            />
            <p className="text-foreground-tertiary text-sm -mt-3 mb-2">
              Optional parent stakeholder for hierarchical relationships (e.g., subsidiary companies)
            </p>

            <SelectField
              name="kam_id"
              label="Key Accounts Manager (KAM)"
              value={formData.kam_id}
              onChange={(e) => setFormData({ ...formData, kam_id: e.target.value })}
              options={[
                { value: "", label: "None (No KAM assigned)" },
                ...employees.map((employee) => ({
                  value: employee.id,
                  label: employee.name
                }))
              ]}
            />
            <p className="text-foreground-tertiary text-sm -mt-3 mb-2">
              Assign a Key Accounts Manager who will receive notifications for any changes (optional)
            </p>
          </div>

          {/* Contact Persons */}
          <div className="bg-surface-primary rounded-lg border border-border-primary p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground-primary">Contact Persons</h2>
              <button
                type="button"
                onClick={handleAddContactPerson}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded transition-colors"
              >
                <Plus size={16} />
                Add Contact
              </button>
            </div>

            {contactPersons.length === 0 ? (
              <div className="text-center py-8 text-foreground-tertiary text-sm">
                No contact persons added yet. Click "Add Contact" to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {contactPersons.map((contact, index) => (
                  <div
                    key={index}
                    className="border border-border-primary rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground-secondary">
                        Contact Person {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContactPerson(index)}
                        className="text-error hover:text-error/80 p-1"
                      >
                        <TrashSimple size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        name={`contact_${index}_name`}
                        label="Name"
                        value={contact.name}
                        onChange={(e) =>
                          handleContactPersonChange(index, "name", e.target.value)
                        }
                        placeholder="Full name"
                      />

                      <FormField
                        name={`contact_${index}_email`}
                        label="Email"
                        type="email"
                        value={contact.email || ""}
                        onChange={(e) =>
                          handleContactPersonChange(index, "email", e.target.value)
                        }
                        error={errors[`contact_${index}_email`]}
                        placeholder="email@example.com"
                      />

                      <FormField
                        name={`contact_${index}_phone`}
                        label="Phone"
                        type="tel"
                        value={contact.phone || ""}
                        onChange={(e) =>
                          handleContactPersonChange(index, "phone", e.target.value)
                        }
                        placeholder="+1234567890"
                      />
                    </div>

                    {errors[`contact_${index}`] && (
                      <p className="text-error text-xs">{errors[`contact_${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-border-secondary text-foreground-secondary rounded-lg hover:bg-background-secondary dark:bg-background-tertiary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting 
                ? "Creating..." 
                : createAsPermanent 
                  ? "Create Permanent Stakeholder" 
                  : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
