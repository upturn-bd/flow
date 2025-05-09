"use client";

import { useEffect, useState } from "react";
import { leaveTypeSchema, holidayConfigSchema } from "@/lib/types";
import { z } from "zod";
import { LeaveType, holidayConfig } from "@/hooks/useLeaveManagement";
import { dirtyValuesChecker } from "@/lib/utils";

type FormValues = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeCreateModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

interface LeaveTypeUpdateModalProps {
  initialData: LeaveType;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function LeaveTypeCreateModal({
  onSubmit,
  onClose,
}: LeaveTypeCreateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    annual_quota: 0,
    company_id: 0,
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = leaveTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }

    console.log(errors);

    console.log("Validation Result:", result.success);
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "annual_quota" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = leaveTypeSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
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
        <h2 className="text-xl font-semibold">Configure Leave Type</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Leave Type
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
            Annual Quota
          </label>
          <input
            name="annual_quota"
            type="number"
            value={formValues.annual_quota}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.annual_quota && (
            <p className="text-red-500 text-sm">{errors.annual_quota}</p>
          )}
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

export function LeaveTypeUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: LeaveTypeUpdateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    annual_quota: 0,
    company_id: 0,
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = leaveTypeSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
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
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "annual_quota" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = leaveTypeSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
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
    console.log(initialData);
    setFormValues(initialData);
  }, [initialData]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [initialData, formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Leave Type</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Leave Type
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
            Annual Quota
          </label>
          <input
            name="annual_quota"
            type="number"
            value={formValues.annual_quota}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.annual_quota && (
            <p className="text-red-500 text-sm">{errors.annual_quota}</p>
          )}
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

type HolidayFormValues = z.infer<typeof holidayConfigSchema>;

interface LeaveHolidayCreateModalProps {
  onSubmit: (values: HolidayFormValues) => void;
  onClose: () => void;
}

interface LeaveHolidayUpdateModalProps {
  initialData: holidayConfig;
  onSubmit: (values: HolidayFormValues) => void;
  onClose: () => void;
}

export function LeaveHolidayCreateModal({
  onSubmit,
  onClose,
}: LeaveHolidayCreateModalProps) {
  const [formValues, setFormValues] = useState<HolidayFormValues>({
    id: 0,
    name: "",
    start_day: "",
    end_day: "",
    company_id: 0,
  });

  const [errors, setErrors] = useState<Partial<HolidayFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = holidayConfigSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<HolidayFormValues> = {};
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
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = holidayConfigSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<HolidayFormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof HolidayFormValues] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Holiday</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Holiday
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
            Start Day
          </label>
          <input
            name="start_day"
            type="date"
            value={formValues.start_day}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.start_day && (
            <p className="text-red-500 text-sm">{errors.start_day}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            End Day
          </label>
          <input
            name="end_day"
            type="date"
            value={formValues.end_day}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.end_day && (
            <p className="text-red-500 text-sm">{errors.end_day}</p>
          )}
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

export function LeaveHolidayUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: LeaveHolidayUpdateModalProps) {
  const [formValues, setFormValues] = useState<HolidayFormValues>({
    id: 0,
    name: "",
    start_day: "",
    end_day: "",
    company_id: 0,
  });

  const [errors, setErrors] = useState<Partial<HolidayFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = holidayConfigSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<HolidayFormValues> = {};
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
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "annual_quota" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = holidayConfigSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<HolidayFormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof HolidayFormValues] = issue.message;
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
    setFormValues(initialData);
  }, [initialData]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [initialData, formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Holiday</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Holiday
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
            Start Day
          </label>
          <input
            name="start_day"
            type="date"
            value={formValues.start_day}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.start_day && (
            <p className="text-red-500 text-sm">{errors.start_day}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            End Day
          </label>
          <input
            name="end_day"
            type="date"
            value={formValues.end_day}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.end_day && (
            <p className="text-red-500 text-sm">{errors.end_day}</p>
          )}
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
