"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Tag, Trash, PencilSimple, FolderOpen, CaretDown, CaretRight } from "@/lib/icons";
import { useStakeholderIssueCategories, IssueCategoryFormData, IssueSubcategoryFormData } from "@/hooks/useStakeholderIssueCategories";
import { IssueCategoryFormModal, IssueSubcategoryFormModal } from "./IssueCategoryFormModal";
import Collapsible from "../CollapsibleComponent";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { StakeholderIssueCategory, StakeholderIssueSubcategory } from "@/lib/types/schemas";
import { captureError } from "@/lib/sentry";

export default function IssueCategoryManagementView() {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    processingId,
  } = useStakeholderIssueCategories();

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isSubcategoryFormOpen, setIsSubcategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StakeholderIssueCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<StakeholderIssueSubcategory | null>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<number | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories(true);
  }, [fetchCategories]);

  const toggleCategoryExpand = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: StakeholderIssueCategory) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category? All subcategories will also be deleted.")) return;
    
    try {
      setDeleteLoading(categoryId);
      await deleteCategory(categoryId);
    } catch (err) {
      captureError(err, { operation: "deleteCategory", categoryId });
      console.error("Error deleting category:", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSaveCategory = async (data: IssueCategoryFormData) => {
    try {
      setIsLoading(true);
      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
    } catch (err) {
      captureError(err, { operation: "saveCategory" });
      console.error("Error saving category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubcategory = (categoryId: number) => {
    setEditingSubcategory(null);
    setSelectedCategoryForSubcategory(categoryId);
    setIsSubcategoryFormOpen(true);
  };

  const handleEditSubcategory = (subcategory: StakeholderIssueSubcategory) => {
    setEditingSubcategory(subcategory);
    setSelectedCategoryForSubcategory(subcategory.category_id);
    setIsSubcategoryFormOpen(true);
  };

  const handleDeleteSubcategory = async (subcategoryId: number) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    
    try {
      setDeleteLoading(subcategoryId);
      await deleteSubcategory(subcategoryId);
    } catch (err) {
      captureError(err, { operation: "deleteSubcategory", subcategoryId });
      console.error("Error deleting subcategory:", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSaveSubcategory = async (data: IssueSubcategoryFormData) => {
    try {
      setIsLoading(true);
      if (editingSubcategory?.id) {
        await updateSubcategory(editingSubcategory.id, data);
      } else {
        await createSubcategory(data);
      }
      setIsSubcategoryFormOpen(false);
      setEditingSubcategory(null);
      setSelectedCategoryForSubcategory(undefined);
      // Refresh categories to get updated subcategories
      fetchCategories(true);
    } catch (err) {
      captureError(err, { operation: "saveSubcategory" });
      console.error("Error saving subcategory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Collapsible title="Stakeholder Issue Categories">
      <div className="px-4 space-y-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Tag size={22} weight="duotone" className="text-foreground-secondary" />
          <h3 className="text-lg font-semibold text-foreground-primary">Issue Categories</h3>
        </div>

        <p className="text-sm text-foreground-tertiary mb-4">
          Organize stakeholder issues with categories and subcategories. Each category can have a color for visual distinction.
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner
            icon={Tag}
            text="Loading issue categories..."
            height="h-40"
            color="gray"
          />
        ) : (
          <div>
            {categories.length > 0 ? (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-background-secondary dark:bg-background-tertiary rounded-lg border border-border-primary overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-3 p-3">
                      <button
                        onClick={() => category.id && toggleCategoryExpand(category.id)}
                        className="p-1 hover:bg-surface-hover rounded transition-colors"
                        title={expandedCategories.has(category.id!) ? "Collapse" : "Expand"}
                      >
                        {expandedCategories.has(category.id!) ? (
                          <CaretDown size={16} className="text-foreground-secondary" />
                        ) : (
                          <CaretRight size={16} className="text-foreground-secondary" />
                        )}
                      </button>
                      
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                        title={category.color}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground-primary truncate">
                            {category.name}
                          </span>
                          {!category.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-foreground-secondary rounded-full">
                              Inactive
                            </span>
                          )}
                          {category.subcategories && category.subcategories.length > 0 && (
                            <span className="text-xs text-foreground-tertiary">
                              ({category.subcategories.length} subcategories)
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-xs text-foreground-tertiary truncate mt-0.5">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => category.id && handleAddSubcategory(category.id)}
                          className="p-1.5 rounded-full text-foreground-tertiary hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600"
                          title="Add Subcategory"
                        >
                          <Plus size={16} weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="p-1.5 rounded-full text-foreground-tertiary hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600"
                          title="Edit Category"
                        >
                          <PencilSimple size={16} weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => category.id && handleDeleteCategory(category.id)}
                          isLoading={deleteLoading === category.id}
                          disabled={deleteLoading === category.id}
                          className="p-1.5 rounded-full text-foreground-tertiary hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500"
                          title="Delete Category"
                        >
                          <Trash size={16} weight="bold" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Subcategories */}
                    <AnimatePresence>
                      {expandedCategories.has(category.id!) && category.subcategories && category.subcategories.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-0 space-y-2 ml-8">
                            {category.subcategories.map((subcategory) => (
                              <div
                                key={subcategory.id}
                                className="flex items-center gap-2 p-2 bg-surface-primary dark:bg-surface-secondary rounded border border-border-secondary"
                              >
                                <FolderOpen size={14} className="text-foreground-tertiary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-foreground-primary truncate">
                                    {subcategory.name}
                                  </span>
                                  {!subcategory.is_active && (
                                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-foreground-secondary rounded-full">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSubcategory(subcategory)}
                                    className="p-1 rounded-full text-foreground-tertiary hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600"
                                    title="Edit Subcategory"
                                  >
                                    <PencilSimple size={14} weight="bold" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => subcategory.id && handleDeleteSubcategory(subcategory.id)}
                                    isLoading={deleteLoading === subcategory.id}
                                    disabled={deleteLoading === subcategory.id}
                                    className="p-1 rounded-full text-foreground-tertiary hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500"
                                    title="Delete Subcategory"
                                  >
                                    <Trash size={14} weight="bold" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Empty subcategories state */}
                    {expandedCategories.has(category.id!) && (!category.subcategories || category.subcategories.length === 0) && (
                      <div className="px-3 pb-3 pt-0 ml-8">
                        <p className="text-xs text-foreground-tertiary italic">
                          No subcategories yet. Click + to add one.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-background-secondary rounded-lg p-6 text-center border border-border-primary">
                <div className="flex justify-center mb-3">
                  <Tag size={40} weight="duotone" className="text-foreground-tertiary" />
                </div>
                <p className="text-foreground-tertiary mb-1">No issue categories found</p>
                <p className="text-foreground-tertiary text-sm mb-4">
                  Create categories to organize stakeholder issues
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="primary"
            onClick={handleAddCategory}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
          >
            <Plus size={16} weight="bold" />
            Add Category
          </Button>
        </div>

        {/* Category Form Modal */}
        <AnimatePresence>
          {isCategoryFormOpen && (
            <IssueCategoryFormModal
              category={editingCategory}
              onClose={() => {
                setIsCategoryFormOpen(false);
                setEditingCategory(null);
              }}
              onSubmit={handleSaveCategory}
              isOpen={isCategoryFormOpen}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        {/* Subcategory Form Modal */}
        <AnimatePresence>
          {isSubcategoryFormOpen && (
            <IssueSubcategoryFormModal
              subcategory={editingSubcategory}
              categories={categories}
              defaultCategoryId={selectedCategoryForSubcategory}
              onClose={() => {
                setIsSubcategoryFormOpen(false);
                setEditingSubcategory(null);
                setSelectedCategoryForSubcategory(undefined);
              }}
              onSubmit={handleSaveSubcategory}
              isOpen={isSubcategoryFormOpen}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
