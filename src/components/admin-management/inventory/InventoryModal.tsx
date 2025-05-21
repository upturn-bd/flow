"use client";

import { useEffect, useState } from "react";
import { requisitionInventorySchema, requisitionTypeSchema } from "@/lib/types";
import { z } from "zod";
import { RequisitionInventory, RequisitionType } from "@/hooks/useConfigTypes";
import { dirtyValuesChecker } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import { Package, X, Buildings, UserPlus, TextAlignLeft, Plus, Minus, Tag } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

type FormValues = z.infer<typeof requisitionTypeSchema>;

interface RequisitionTypesModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function RequisitionTypeCreateModal({
  onSubmit,
  onClose,
  isLoading = false,
}: RequisitionTypesModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    company_id: 0,
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = requisitionTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof FormValues] = err.message as unknown as undefined;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = requisitionTypeSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message as unknown as undefined;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-200"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Tag size={24} weight="duotone" className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Configure Category</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <X size={20} weight="bold" />
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-2">Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Category Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex justify-end mt-8 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={!!(isLoading || isSubmitting)}
            disabled={
              isLoading ||
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0
            }
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            Create Category
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}

type RequisitionInventoryFormValues = z.infer<
  typeof requisitionInventorySchema
>;

interface RequisitionInventoryCreateModalProps {
  requisitionCategories: RequisitionType[];
  onSubmit: (values: RequisitionInventoryFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface RequisitionInventoryUpdateModalProps {
  initialData: RequisitionInventory;
  requisitionCategories: RequisitionType[];
  onSubmit: (values: RequisitionInventoryFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function RequisitionInventoryCreateModal({
  requisitionCategories,
  onSubmit,
  onClose,
  isLoading = false,
}: RequisitionInventoryCreateModalProps) {
  const [formValues, setFormValues] = useState<RequisitionInventoryFormValues>({
    name: "",
    description: "",
    quantity: 1,
    asset_owner: "",
    requisition_category_id: 0,
    department_id: 0,
    company_id: 1,
  });
  const [errors, setErrors] = useState<Partial<RequisitionInventoryFormValues>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const { employees: assetOwners, loading: loadingEmployees, fetchEmployees } = useEmployees();

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [fetchDepartments, fetchEmployees]);

  useEffect(() => {
    const result = requisitionInventorySchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<RequisitionInventoryFormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof RequisitionInventoryFormValues] = err.message as unknown as undefined ;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (
      name === "quantity" ||
      name === "requisition_category_id" ||
      name === "department_id"
    ) {
      setFormValues((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = requisitionInventorySchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<RequisitionInventoryFormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof RequisitionInventoryFormValues] = issue.message as unknown as undefined;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  const handleIncrement = () => {
    setFormValues(prev => ({
      ...prev,
      quantity: prev.quantity + 1
    }));
  };

  const handleDecrement = () => {
    if (formValues.quantity > 1) {
      setFormValues(prev => ({
        ...prev,
        quantity: prev.quantity - 1
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-200"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package size={24} weight="duotone" className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Configure Inventory Item</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <X size={20} weight="bold" />
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Item Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Package size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Item Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <TextAlignLeft size={18} weight="duotone" className="text-gray-500" />
              </div>
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Description"
                rows={3}
              />
            </div>
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center">
              <Button
                type="button"
                onClick={handleDecrement}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-l-md p-2.5"
              >
                <Minus size={16} weight="bold" />
              </Button>
              <input
                name="quantity"
                type="number"
                value={formValues.quantity}
                onChange={handleChange}
                min={1}
                className="w-16 text-center p-2.5 border-t border-b border-gray-300 outline-none"
              />
              <Button
                type="button"
                onClick={handleIncrement}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-r-md p-2.5"
              >
                <Plus size={16} weight="bold" />
              </Button>
            </div>
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Asset Owner
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserPlus size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="asset_owner"
                value={formValues.asset_owner}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value="">Select Asset Owner</option>
                {!loadingEmployees && assetOwners.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.asset_owner && <p className="text-red-500 text-sm mt-1">{errors.asset_owner}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="requisition_category_id"
                value={formValues.requisition_category_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value={0}>Select Category</option>
                {requisitionCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.requisition_category_id && <p className="text-red-500 text-sm mt-1">{errors.requisition_category_id}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Department
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Buildings size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="department_id"
                value={formValues.department_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value={0}>Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.department_id && <p className="text-red-500 text-sm mt-1">{errors.department_id}</p>}
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex justify-end mt-8 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={!!(isLoading || isSubmitting)}
            disabled={
              isLoading ||
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0
            }
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            Create Item
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}

export function RequisitionInventoryUpdateModal({
  initialData,
  requisitionCategories,
  onSubmit,
  onClose,
  isLoading = false,
}: RequisitionInventoryUpdateModalProps) {
  const [formValues, setFormValues] = useState<RequisitionInventoryFormValues>({
    name: "",
    description: "",
    quantity: 1,
    asset_owner: "",
    requisition_category_id: 0,
    department_id: 0,
    company_id: 1,
  });
  const [errors, setErrors] = useState<Partial<RequisitionInventoryFormValues>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const { employees: assetOwners, loading: loadingEmployees, fetchEmployees } = useEmployees();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = requisitionInventorySchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<RequisitionInventoryFormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof RequisitionInventoryFormValues] = err.message as unknown as undefined;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (
      name === "quantity" ||
      name === "requisition_category_id" ||
      name === "department_id"
    ) {
      setFormValues((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = requisitionInventorySchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<RequisitionInventoryFormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof RequisitionInventoryFormValues] = issue.message as unknown as undefined;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setFormValues(initialData);
  }, [initialData]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [formValues, initialData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Inventory/Equipment/Supplies</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Item Name
          </label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Item Description
          </label>
          <textarea
            rows={3}
            name="description"
            value={formValues.description}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Category
            </label>
            <select
              name="requisition_category_id"
              value={formValues.requisition_category_id}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Category</option>
              {requisitionCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.requisition_category_id && (
              <p className="text-red-500 text-sm">
                {errors.requisition_category_id}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Amount(Qty)
            </label>
            <input
              name="quantity"
              type="number"
              min={1}
              value={formValues.quantity}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
              placeholder="Enter Quantity"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm">{errors.quantity}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Department
            </label>
            <select
              name="department_id"
              value={formValues.department_id}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {errors.department_id && (
              <p className="text-red-500 text-sm">{errors.department_id}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Asset Owner
            </label>
            <select
              name="asset_owner"
              value={formValues.asset_owner}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Owner</option>
              {assetOwners.length > 0 ? (
                assetOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))
              ) : (
                <option value={""}>loading....</option>
              )}
            </select>
            {errors.asset_owner && (
              <p className="text-red-500 text-sm">{errors.asset_owner}</p>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isLoading ||
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0
            }
          >
            {isLoading ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
