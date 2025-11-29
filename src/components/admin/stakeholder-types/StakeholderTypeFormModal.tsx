"use client";

import { StakeholderTypeFormData } from "@/hooks/useStakeholderTypes";
import { validateStakeholderType } from "@/lib/validation/schemas/stakeholders";
import { Tag } from "@/lib/icons";
import { FormModal } from "@/components/ui/modals";
import { FormField } from "@/components/forms";

interface StakeholderTypeFormModalProps {
  type: any;
  onClose: () => void;
  onSubmit: (data: StakeholderTypeFormData) => void;
  isOpen: boolean;
  isLoading: boolean;
}

export default function StakeholderTypeFormModal({
  type,
  onClose,
  onSubmit,
  isOpen,
  isLoading,
}: StakeholderTypeFormModalProps) {
  const initialValues: StakeholderTypeFormData = {
    name: type?.name || "",
    description: type?.description || "",
    is_active: type?.is_active !== undefined ? type.is_active : true,
  };

  return (
    <FormModal<StakeholderTypeFormData>
      title={type ? "Edit Stakeholder Type" : "Add Stakeholder Type"}
      icon={<Tag size={24} weight="duotone" />}
      initialValues={initialValues}
      validationFn={validateStakeholderType}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText={type ? "Update Type" : "Create Type"}
    >
      {({ values, errors, handleChange }) => (
        <div className="space-y-4">
          <FormField
            name="name"
            label="Type Name"
            icon={<Tag size={18} weight="duotone" />}
            placeholder="e.g., Client, Vendor, Partner"
            value={values.name}
            error={errors.name}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block font-medium text-foreground-primary mb-1 text-sm sm:text-base">
              Description
            </label>
            <textarea
              name="description"
              value={values.description || ""}
              onChange={handleChange}
              rows={3}
              className={`w-full rounded-lg border p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm text-sm sm:text-base bg-surface-primary text-foreground-primary ${
                errors.description ? "border-red-500 focus:ring-red-500" : "border-border-primary"
              }`}
              placeholder="Optional description of this stakeholder type"
            />
            {errors.description && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={values.is_active}
              onChange={(e) =>
                handleChange({
                  target: { name: "is_active", value: e.target.checked },
                } as any)
              }
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-foreground-primary">
              Active
            </label>
          </div>
        </div>
      )}
    </FormModal>
  );
}
