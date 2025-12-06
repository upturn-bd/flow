"use client";

import { IssueCategoryFormData, IssueSubcategoryFormData } from "@/hooks/useStakeholderIssueCategories";
import { validateIssueCategory, validateIssueSubcategory } from "@/lib/validation/schemas/stakeholder-issue-categories";
import { Tag, FolderOpen } from "@phosphor-icons/react";
import { FormModal } from "@/components/ui/modals";
import { FormField, TextAreaField, ToggleField, ColorField, SelectField } from "@/components/forms";
import { StakeholderIssueCategory } from "@/lib/types/schemas";

interface IssueCategoryFormModalProps {
  category?: StakeholderIssueCategory | null;
  onClose: () => void;
  onSubmit: (data: IssueCategoryFormData) => Promise<void>;
  isOpen: boolean;
  isLoading: boolean;
}

export function IssueCategoryFormModal({
  category,
  onClose,
  onSubmit,
  isOpen,
  isLoading,
}: IssueCategoryFormModalProps) {
  const initialValues: IssueCategoryFormData = {
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "#6366f1",
    is_active: category?.is_active !== undefined ? category.is_active : true,
  };

  return (
    <FormModal<IssueCategoryFormData>
      title={category ? "PencilSimple Issue Category" : "Add Issue Category"}
      icon={<Tag size={24} weight="duotone" />}
      initialValues={initialValues}
      validationFn={validateIssueCategory}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText={category ? "Update Category" : "Create Category"}
    >
      {({ values, errors, handleChange }) => (
        <div className="space-y-4">
          <FormField
            name="name"
            label="Category Name"
            icon={<Tag size={18} weight="duotone" />}
            placeholder="e.g., Technical Issue, Billing, Support"
            value={values.name}
            error={errors.name}
            onChange={handleChange}
            required
          />

          <ColorField
            label="Category Color"
            value={values.color}
            onChange={(color) =>
              handleChange({
                target: { name: "color", value: color },
              } as any)
            }
            error={errors.color}
          />

          <TextAreaField
            name="description"
            label="Description"
            value={values.description || ""}
            onChange={handleChange}
            error={errors.description}
            rows={3}
            placeholder="Optional description of this category"
          />

          <ToggleField
            label="Active"
            checked={values.is_active}
            onChange={(checked) =>
              handleChange({
                target: { name: "is_active", value: checked },
              } as any)
            }
          />
        </div>
      )}
    </FormModal>
  );
}

interface IssueSubcategoryFormModalProps {
  subcategory?: any;
  categories: StakeholderIssueCategory[];
  defaultCategoryId?: number;
  onClose: () => void;
  onSubmit: (data: IssueSubcategoryFormData) => Promise<void>;
  isOpen: boolean;
  isLoading: boolean;
}

export function IssueSubcategoryFormModal({
  subcategory,
  categories,
  defaultCategoryId,
  onClose,
  onSubmit,
  isOpen,
  isLoading,
}: IssueSubcategoryFormModalProps) {
  const initialValues: IssueSubcategoryFormData = {
    category_id: subcategory?.category_id || defaultCategoryId || 0,
    name: subcategory?.name || "",
    description: subcategory?.description || "",
    is_active: subcategory?.is_active !== undefined ? subcategory.is_active : true,
  };

  return (
    <FormModal<IssueSubcategoryFormData>
      title={subcategory ? "PencilSimple Subcategory" : "Add Subcategory"}
      icon={<FolderOpen size={24} weight="duotone" />}
      initialValues={initialValues}
      validationFn={validateIssueSubcategory}
      onSubmit={onSubmit}
      onClose={onClose}
      isOpen={isOpen}
      isLoading={isLoading}
      submitButtonText={subcategory ? "Update Subcategory" : "Create Subcategory"}
    >
      {({ values, errors, handleChange }) => (
        <div className="space-y-4">
          <SelectField
            name="category_id"
            label="Parent Category"
            value={values.category_id?.toString() || ""}
            onChange={(e) =>
              handleChange({
                target: { name: "category_id", value: parseInt(e.target.value) },
              } as any)
            }
            error={errors.category_id}
            required
            options={categories.map((cat) => ({
              value: cat.id?.toString() || "",
              label: cat.name,
            }))}
            placeholder="Select a category"
          />

          <FormField
            name="name"
            label="Subcategory Name"
            icon={<FolderOpen size={18} weight="duotone" />}
            placeholder="e.g., Network Issue, Invoice Query"
            value={values.name}
            error={errors.name}
            onChange={handleChange}
            required
          />

          <TextAreaField
            name="description"
            label="Description"
            value={values.description || ""}
            onChange={handleChange}
            error={errors.description}
            rows={3}
            placeholder="Optional description of this subcategory"
          />

          <ToggleField
            label="Active"
            checked={values.is_active}
            onChange={(checked) =>
              handleChange({
                target: { name: "is_active", value: checked },
              } as any)
            }
          />
        </div>
      )}
    </FormModal>
  );
}
