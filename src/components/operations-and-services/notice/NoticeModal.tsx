"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Notice } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface NoticeFormData {
  title: string;
  description: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  department_id?: number;
  valid_from: string;
  valid_till: string;
}

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Notice>) => Promise<void>;
  initialData?: Notice | null;
  departments?: Array<{ id: number; name: string }>;
}

export function NoticeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments = [],
}: NoticeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoticeFormData>({
    defaultValues: {
      title: "",
      description: "",
      urgency: "Medium",
      department_id: undefined,
      valid_from: "",
      valid_till: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        urgency: (initialData.urgency as "Low" | "Medium" | "High" | "Critical") || "Medium",
        department_id: initialData.department_id || undefined,
        valid_from: initialData.valid_from || "",
        valid_till: initialData.valid_till || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        urgency: "Medium",
        department_id: undefined,
        valid_from: "",
        valid_till: "",
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: NoticeFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Failed to submit notice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Notice" : "Create Notice"}
        </h2>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter notice title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register("description", { required: "Description is required" })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter notice description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              {...register("urgency")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department (optional)
            </label>
            <select
              {...register("department_id", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments (Global)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to send notice to all departments
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From *
              </label>
              <input
                {...register("valid_from", { required: "Valid from date is required" })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.valid_from && (
                <p className="mt-1 text-sm text-red-600">{errors.valid_from.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Till *
              </label>
              <input
                {...register("valid_till", { required: "Valid till date is required" })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.valid_till && (
                <p className="mt-1 text-sm text-red-600">{errors.valid_till.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoticeModal;
