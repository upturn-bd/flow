"use client";

import { useEffect, useState } from "react";
import { claimTypeSchema } from "@/lib/types";
import { z } from "zod";
import { ClaimType } from "@/hooks/useConfigTypes";
import { dirtyValuesChecker } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { Receipt, X, Money, Buildings, UserPlus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

type ClaimTypeFormValues = z.infer<typeof claimTypeSchema>;

interface Position {
  id: number;
  name: string;
}

interface ClaimTypeCreateModalProps {
  onSubmit: (values: ClaimTypeFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface ClaimTypeUpdateModalProps {
  initialData: ClaimType;
  onSubmit: (values: ClaimTypeFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ClaimTypeCreateModal({
  onSubmit,
  onClose,
  isLoading = false,
}: ClaimTypeCreateModalProps) {
  const [formValues, setFormValues] = useState<ClaimTypeFormValues>({
    id: 1,
    settlement_item: "",
    allowance: 0,
    settler_id: "",
    settlement_level_id: 0,
    company_id: 1,
  });
  const [errors, setErrors] = useState<Partial<ClaimTypeFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const { employees: allSettlers, loading: loadingEmployees, fetchEmployees } = useEmployees();

  useEffect(() => {
    const result = claimTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ClaimTypeFormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof ClaimTypeFormValues] = err.message as unknown as undefined;
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
    if (name === "allowance" || name === "settlement_level_id") {
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
    const result = claimTypeSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<ClaimTypeFormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof ClaimTypeFormValues] = issue.message as unknown as undefined; 
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
    async function fetchPositions() {
      try {
        const positions = await import("@/lib/api/company").then(
          (module) => module.getPositions()
        );
        setAllPositions(positions);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPositions();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
            <Receipt size={24} weight="duotone" className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Add Settlement Type</h2>
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
                <Receipt size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="settlement_item"
                value={formValues.settlement_item}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Item Name"
              />
            </div>
            {errors.settlement_item && (
              <p className="text-red-500 text-sm mt-1">{errors.settlement_item}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Claim Level
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Buildings size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="settlement_level_id"
                value={formValues.settlement_level_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value="">Select Claim Level</option>
                {allPositions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.settlement_level_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.settlement_level_id}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Allowance
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Money size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="allowance"
                type="number"
                min={1}
                value={formValues.allowance}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Allowance"
              />
            </div>
            {errors.allowance && (
              <p className="text-red-500 text-sm mt-1">{errors.allowance}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Settler
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserPlus size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="settler_id"
                value={formValues.settler_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value="">Select Settler</option>
                {!loadingEmployees && allSettlers.map((settler) => (
                  <option key={settler.id} value={settler.id}>
                    {settler.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.settler_id && (
              <p className="text-red-500 text-sm mt-1">{errors.settler_id}</p>
            )}
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
            Create Settlement Type
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}

export function ClaimTypeUpdateModal({
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}: ClaimTypeUpdateModalProps) {
  const [formValues, setFormValues] = useState<ClaimTypeFormValues>({
    id: 1,
    settlement_item: "",
    allowance: 0,
    settler_id: "",
    settlement_level_id: 0,
    company_id: 1,
  });
  const [errors, setErrors] = useState<Partial<ClaimTypeFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const { employees: allSettlers, loading: loadingEmployees, fetchEmployees } = useEmployees();

  useEffect(() => {
    setFormValues(initialData);
  }, [initialData]);

  useEffect(() => {
    const result = claimTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ClaimTypeFormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof ClaimTypeFormValues] = err.message as unknown as undefined;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [initialData, formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "allowance" || name === "settlement_level_id") {
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
    const result = claimTypeSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<ClaimTypeFormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof ClaimTypeFormValues] = issue.message as unknown as undefined; 
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
    async function fetchPositions() {
      try {
        const positions = await import("@/lib/api/company").then(
          (module) => module.getPositions()
        );
        setAllPositions(positions);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPositions();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
            <Receipt size={24} weight="duotone" className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Update Settlement Type</h2>
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
                <Receipt size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="settlement_item"
                value={formValues.settlement_item}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Item Name"
              />
            </div>
            {errors.settlement_item && (
              <p className="text-red-500 text-sm mt-1">{errors.settlement_item}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Claim Level
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Buildings size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="settlement_level_id"
                value={formValues.settlement_level_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value="">Select Claim Level</option>
                {allPositions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.settlement_level_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.settlement_level_id}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Allowance
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Money size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="allowance"
                type="number"
                min={1}
                value={formValues.allowance}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Allowance"
              />
            </div>
            {errors.allowance && (
              <p className="text-red-500 text-sm mt-1">{errors.allowance}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Settler
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserPlus size={18} weight="duotone" className="text-gray-500" />
              </div>
              <select
                name="settler_id"
                value={formValues.settler_id}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all appearance-none"
              >
                <option value="">Select Settler</option>
                {!loadingEmployees && allSettlers.map((settler) => (
                  <option key={settler.id} value={settler.id}>
                    {settler.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.settler_id && (
              <p className="text-red-500 text-sm mt-1">{errors.settler_id}</p>
            )}
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
              Object.keys(errors).length > 0 ||
              !isDirty
            }
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            Update Settlement Type
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}
