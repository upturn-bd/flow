"use client";

import { useEffect, useState } from "react";
import { Department } from "@/lib/types/schemas";
import { validateDepartment, validationErrorsToObject } from "@/lib/utils/validation";
import { dirtyValuesChecker } from "@/lib/utils";
import { Building, User, FileText, StackSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

type FormValues = Department;

interface DepartmentModalProps {
  initialData?: Department | null;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  divisions: { id?: number; name: string }[];
  employees: { id: string; name: string }[];
  isLoading?: boolean;
}

export default function DepartmentModal({
  initialData,
  onSubmit,
  divisions,
  onClose,
  employees,
  isLoading = false,
}: DepartmentModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    head_id: "",
    description: "",
    division_id: undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues({
        id: initialData.id,
        name: initialData.name,
        head_id: initialData.head_id || "",
        description: initialData.description || "",
        division_id: initialData.division_id || undefined,
      });
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = validateDepartment(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "division_id") {
      setFormValues((prev) => ({ ...prev, [name]: value === "" ? undefined : parseInt(value) }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = validateDepartment(formValues);

    if (!result.success) {
      const fieldErrors = validationErrorsToObject(result.errors);
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data!);
    setIsSubmitting(false);
  };

  // Check if form values are dirty
  useEffect(() => {
    if (initialData) {
      const initialDataForComparison: FormValues = {
        id: initialData.id,
        name: initialData.name,
        head_id: initialData.head_id || "",
        description: initialData.description || "",
        division_id: initialData.division_id || undefined,
      };
      setIsDirty(dirtyValuesChecker(initialDataForComparison, formValues));
    }
  }, [initialData, formValues]);

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl border border-gray-200"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Building size={24} weight="duotone" className="text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? "Edit Department" : "Create Department"}
          </h2>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Department Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building
                  size={18}
                  weight="duotone"
                  className="text-gray-500"
                />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                placeholder="Enter Department Name"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Department Head
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="head_id"
                value={formValues.head_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all appearance-none"
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.head_id && (
              <p className="text-red-500 text-sm mt-1">{errors.head_id}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Division
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <StackSimple
                  size={18}
                  weight="duotone"
                  className="text-gray-500"
                />
              </div>
              <select
                name="division_id"
                value={formValues.division_id ?? ""}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">Select Division</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.division_id && (
              <p className="text-red-500 text-sm mt-1">{errors.division_id}</p>
            )}

          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Department Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FileText
                  size={18}
                  weight="duotone"
                  className="text-gray-500"
                />
              </div>
              <textarea
                name="description"
                value={
                  formValues.description === null ? "" : formValues.description
                }
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                placeholder="Add Department Description"
                rows={4}
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-gray-200 text-gray-700 hover:bg-gray-50"
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
              (initialData! && !isDirty)
            }
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            {initialData ? "Update" : "Create"}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}
