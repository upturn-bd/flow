"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Grade } from "@/hooks/useGrades";
import { z } from "zod";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { dirtyValuesChecker } from "@/lib/utils";
import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(50),
  company_id: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

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
  const [isDirty, setIsDirty] = useState(false);

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

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      id: 0,
      name: "",
      company_id: 0,
    },
  });

  const formValues = watch();

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (initialData) {
      const dirty = dirtyValuesChecker(
        {
          id: initialData.id,
          name: initialData.name,
          company_id: initialData.company_id,
        },
        formValues
      );
      setIsDirty(dirty);
    } else {
      const dirty = Object.values(formValues).some((v) => v !== "" && v !== 0);
      setIsDirty(dirty);
    }
  }, [formValues, initialData]);

  const submitHandler = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={handleSubmit(submitHandler)}
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
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-200 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all"
                    placeholder="Enter Grade Name"
                  />
                )}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
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
            disabled={isSubmitting || !isValid || !isDirty}
            className="bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}
