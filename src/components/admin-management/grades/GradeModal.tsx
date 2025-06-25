"use client";

import { useEffect, useState } from "react";
import { Grade } from "@/lib/types/schemas";
import { validateGrade, validationErrorsToObject } from "@/lib/utils/validation";
import { motion } from "framer-motion";
import { dirtyValuesChecker } from "@/lib/utils";
import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

type FormValues = Grade;

interface GradeModalProps {
  initialData?: Grade | null;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function GradeModal({
  initialData,
  onSubmit,
  onClose,
}: GradeModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: initialData?.id,
    name: initialData?.name ?? "",
  });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
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
    const result = validateGrade(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues]);

  useEffect(() => {
    if (initialData) {
      const dirty = dirtyValuesChecker(initialData, formValues);
      setIsDirty(dirty);
    } else {
      const dirty = Object.values(formValues).some((v) => v !== "" && v !== 0);
      setIsDirty(dirty);
    }
  }, [formValues, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = validateGrade(formValues);

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
            <GraduationCap className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {initialData ? "Edit Grade" : "Create Grade"}
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
              Grade Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-5 w-5 text-gray-500" />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                placeholder="Enter Grade Name"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name as string}</p>
            )}
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
