"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dirtyValuesChecker } from "@/lib/utils";
import { Division } from "@/hooks/useDivisions";
import { Layers, User, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

// Define the schema using Zod
const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(50),
  head_id: z.string().min(1, "Please select a division head"),
  company_id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
});

interface DivisionModalProps {
  initialData?: Division | null;
  onSubmit: (values: Division) => void;
  onClose: () => void;
  employees: { id: string; name: string }[];
}

export default function DivisionModal({
  initialData,
  onSubmit,
  onClose,
  employees,
}: DivisionModalProps) {
  const [formValues, setFormValues] = useState<Division>({
    id: initialData?.id,
    name: initialData?.name ?? "",
    head_id: initialData?.head_id ?? "",
  });

  const [errors, setErrors] = useState<Partial<Division>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

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

  useEffect(() => {
    const result = schema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Partial<Division> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Division] = issue.message as any;
      }
      setErrors(fieldErrors);
      setIsValid(false);
    } else {
      setIsValid(result.success);
      setErrors({});
    }
  }, [formValues]);

  useEffect(() => {
    if (initialData) {
      setIsDirty(dirtyValuesChecker(initialData, formValues));
    } else {
      const dirty = Object.values(formValues).some((v) => v !== "");
      setIsDirty(dirty);
    }
  }, [initialData, formValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "id" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = schema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<Division> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Division] = issue.message as any;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(formValues);
    setIsSubmitting(false);
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
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {initialData ? "Edit Division" : "Create Division"}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Division Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers className="h-5 w-5 text-gray-500" />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                placeholder="Enter Division Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name as string}</p>}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Division Head
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
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
            {errors.head_id && <p className="text-red-500 text-sm mt-1">{errors.head_id as string}</p>}
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
            disabled={isSubmitting || !isValid || (initialData ? !isDirty : false)}
            className="bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}
