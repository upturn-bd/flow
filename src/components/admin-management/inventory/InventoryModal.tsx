"use client";

import { useEffect, useState } from "react";
import { requisitionInventorySchema, requisitionTypeSchema } from "@/lib/types";
import { z } from "zod";
import { RequisitionInventory, RequisitionType } from "@/hooks/useConfigTypes";
import { dirtyValuesChecker } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";

type FormValues = z.infer<typeof requisitionTypeSchema>;

interface RequisitionTypesModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function RequisitionTypeCreateModal({
  onSubmit,
  onClose,
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

  useEffect(() => {
    console.log("Form Values:", formValues);
  }, [formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Category</h2>
        <div className="mt-4">
          <label className="block font-semibold text-blue-800 mb-1">Name</label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
              isSubmitting || !isValid || Object.keys(errors).length > 0
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
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
}

interface RequisitionInventoryUpdateModalProps {
  initialData: RequisitionInventory;
  requisitionCategories: RequisitionType[];
  onSubmit: (values: RequisitionInventoryFormValues) => void;
  onClose: () => void;
}

export function RequisitionInventoryCreateModal({
  requisitionCategories,
  onSubmit,
  onClose,
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
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] =
          issue.message as unknown as undefined;
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
    console.log("Form Values:", formValues);
  }, [formValues]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
              isSubmitting || !isValid || Object.keys(errors).length > 0
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function RequisitionInventoryUpdateModal({
  initialData,
  requisitionCategories,
  onSubmit,
  onClose,
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
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] =
          issue.message as unknown as undefined;
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
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0 ||
              !isDirty
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
