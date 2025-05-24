"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { dirtyValuesChecker } from "@/lib/utils";
import { Position } from "@/hooks/usePositions";
import {
  BriefcaseBusiness,
  Building,
  GraduationCap,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

// Define the schema using Zod
const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().optional(),
  department_id: z.number().optional(),
  grade: z.number().optional(),
  company_id: z.number().optional(),
});

interface PositionModalProps {
  initialData?: Position | null;
  onSubmit: (values: Position) => void;
  onClose: () => void;
  departments: { id: number; name: string }[];
  grades: { id: number; name: string }[];
}

export default function PositionModal({
  initialData,
  onSubmit,
  departments,
  grades,
  onClose,
}: PositionModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [formValues, setFormValues] = useState<Position>({
    name: "",
    description: "",
    department_id: undefined,
    grade: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Position, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  // Reset form values when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormValues(initialData);
    }
  }, [initialData]);

  // Check for dirty values
  useEffect(() => {
    if (initialData) {
      const dirty = dirtyValuesChecker(initialData, formValues);
      if (initialData.grade !== formValues.grade) {
        setIsDirty(true);
      } else {
        setIsDirty(dirty);
      }
    } else {
      const dirty = Object.values(formValues).some((v) => v !== "");
      setIsDirty(dirty);
    }
  }, [formValues, initialData]);

  // Update validation state whenever form values change
  useEffect(() => {
    const result = schema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors as Partial<Record<keyof Position, string>>);
    }
  }, [formValues]);

  const handleChange =
    (field: keyof Position) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setFormValues((prev) => {
        if (field === "department_id" || field === "grade") {
          return { ...prev, [field]: parseInt(event.target.value) };
        }
        const newValues = { ...prev, [field]: event.target.value };
        return newValues;
      });
    };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      setIsSubmitting(true);
      await onSubmit(formValues);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={submitHandler}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl border border-gray-200"
      >
        <motion.div
          variants={fadeInUp}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {initialData ? "Edit Position" : "Create Position"}
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
              Position Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BriefcaseBusiness className="h-5 w-5 text-gray-500" />
              </div>
              <input
                value={formValues.name}
                onChange={handleChange("name")}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                placeholder="Enter Position Name"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Department
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-500" />
              </div>
              <select
                value={formValues.department_id}
                onChange={handleChange("department_id")}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all appearance-none"
              >
                <option value={undefined}>Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.department_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.department_id}
              </p>
            )}
            {formValues.department_id === undefined && (
              <p className="text-red-500 text-sm mt-1">
                Please select a department
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Grade
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-5 w-5 text-gray-500" />
              </div>
              <select
                value={formValues.grade}
                onChange={handleChange("grade")}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all appearance-none"
              >
                <option value={undefined}>Select Grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.grade && (
              <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
            )}
            {formValues.grade === undefined && (
              <p className="text-red-500 text-sm mt-1">Please select a grade</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Position Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <textarea
                value={formValues.description || ""}
                onChange={handleChange("description")}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                placeholder="Add Position Description"
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
            disabled={
              isSubmitting ||
              !isDirty ||
              !isValid ||
              Object.keys(errors).length > 0 ||
              formValues.department_id === undefined ||
              formValues.grade === undefined
            }
            className="bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}
