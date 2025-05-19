"use client";

import { useEffect, useState } from "react";
import { claimTypeSchema } from "@/lib/types";
import { ClaimType } from "@/hooks/useClaimAndSettlement";
import { dirtyValuesChecker } from "@/lib/utils";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { z } from "zod";

type ClaimTypeFormValues = z.infer<typeof claimTypeSchema>;

interface Position {
  id: number;
  name: string;
}

interface ClaimTypeCreateModalProps {
  onSubmit: (values: ClaimTypeFormValues) => void;
  onClose: () => void;
}

interface ClaimTypeUpdateModalProps {
  initialData: ClaimType;
  onSubmit: (values: ClaimTypeFormValues) => void;
  onClose: () => void;
}

export function ClaimTypeCreateModal({
  onSubmit,
  onClose,
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
  const [allSettlers, setAllSettlers] = useState<
    { id: string; name: string }[]
  >([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);

  useEffect(() => {
    const result = claimTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ClaimTypeFormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
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
        fieldErrors[issue.path[0] as keyof ClaimTypeFormValues] = issue.message;
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
        const res = await fetch("/api/company-info/positions");
        const data = await res.json();
        setAllPositions(data.positions);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPositions();
  }, []);

  useEffect(() => {
    const fetchAllSettlers = async () => {
      try {
        const response = await getEmployeesInfo();
        setAllSettlers(response.data);
      } catch (error) {
        setAllSettlers([]);
        console.error("Error fetching asset owners:", error);
      }
    };

    fetchAllSettlers();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Add Settlement Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Item Name
            </label>
            <input
              name="settlement_item"
              value={formValues.settlement_item}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
              placeholder="Enter Name"
            />
            {errors.settlement_item && (
              <p className="text-red-500 text-sm">{errors.settlement_item}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Claim Level
            </label>
            <select
              name="settlement_level_id"
              value={formValues.settlement_level_id}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Claim Level</option>
              {allPositions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
            {errors.settlement_level_id && (
              <p className="text-red-500 text-sm">
                {errors.settlement_level_id}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Allowance
            </label>
            <input
              name="allowance"
              type="number"
              min={1}
              value={formValues.allowance}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
              placeholder="Enter Allowance"
            />
            {errors.allowance && (
              <p className="text-red-500 text-sm">{errors.allowance}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Setller
            </label>
            <select
              name="settler_id"
              value={formValues.settler_id}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Settler</option>
              {allSettlers.length > 0 ? (
                allSettlers.map((settler) => (
                  <option key={settler.id} value={settler.id}>
                    {settler.name}
                  </option>
                ))
              ) : (
                <option value={""}>loading....</option>
              )}
            </select>
            {errors.settler_id && (
              <p className="text-red-500 text-sm">{errors.settler_id}</p>
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

export function ClaimTypeUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: ClaimTypeUpdateModalProps) {
  const [formValues, setFormValues] = useState<ClaimTypeFormValues>({
    settlement_item: "",
    allowance: 0,
    settler_id: "",
    settlement_level_id: 0,
    company_id: 1,
  });
  const [errors, setErrors] = useState<Partial<ClaimTypeFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [allSettlers, setAllSettlers] = useState<
    { id: string; name: string }[]
  >([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = claimTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ClaimTypeFormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
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
        fieldErrors[issue.path[0] as keyof ClaimTypeFormValues] = issue.message;
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
        const res = await fetch("/api/company-info/positions");
        const data = await res.json();
        setAllPositions(data.positions);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPositions();
  }, []);

  useEffect(() => {
    const fetchAllSettlers = async () => {
      try {
        const response = await getEmployeesInfo();
        setAllSettlers(response.data);
      } catch (error) {
        setAllSettlers([]);
        console.error("Error fetching asset owners:", error);
      }
    };

    fetchAllSettlers();
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Item Name
            </label>
            <input
              name="settlement_item"
              value={formValues.settlement_item}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
              placeholder="Enter Name"
            />
            {errors.settlement_item && (
              <p className="text-red-500 text-sm">{errors.settlement_item}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Claim Level
            </label>
            <select
              name="settlement_level_id"
              value={formValues.settlement_level_id}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Claim Level</option>
              {allPositions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
            {errors.settlement_level_id && (
              <p className="text-red-500 text-sm">
                {errors.settlement_level_id}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Allowance
            </label>
            <input
              name="allowance"
              type="number"
              min={1}
              value={formValues.allowance}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
              placeholder="Enter Allowance"
            />
            {errors.allowance && (
              <p className="text-red-500 text-sm">{errors.allowance}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold text-blue-800 mb-1">
              Setller
            </label>
            <select
              name="settler_id"
              value={formValues.settler_id}
              onChange={handleChange}
              className="w-full rounded-md bg-blue-50 p-2"
            >
              <option value="">Select Settler</option>
              {allSettlers.length > 0 ? (
                allSettlers.map((settler) => (
                  <option key={settler.id} value={settler.id}>
                    {settler.name}
                  </option>
                ))
              ) : (
                <option value={""}>loading....</option>
              )}
            </select>
            {errors.settler_id && (
              <p className="text-red-500 text-sm">{errors.settler_id}</p>
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
