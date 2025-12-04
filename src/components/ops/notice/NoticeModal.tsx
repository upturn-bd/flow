"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Notice } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface NoticeFormData {
  title: string;
  description: string;
  urgency: "low" | "normal" | "high" | "urgent";
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
      urgency: "normal",
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
        urgency: (initialData.urgency as "low" | "normal" | "high" | "urgent") || "normal",
        department_id: initialData.department_id || undefined,
        valid_from: initialData.valid_from || "",
        valid_till: initialData.valid_till || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        urgency: "normal",
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Notice" : "Create Notice"}
        </h2>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-1">
              Title *
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              type="text"
              className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
              placeholder="Enter notice title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-error">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-1">
              Description *
            </label>
            <textarea
              {...register("description", { required: "Description is required" })}
              rows={4}
              className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
              placeholder="Enter notice description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-1">
              Urgency
            </label>
            <select
              {...register("urgency")}
              className="w-full px-3 py-2 border border-border-primary bg-surface-primary rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-1">
              Department (optional)
            </label>
            <select
              {...register("department_id", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border-primary bg-surface-primary rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Departments (Global)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-foreground-tertiary">
              Leave empty to send notice to all departments
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-primary mb-1">
                Valid From *
              </label>
              <input
                {...register("valid_from", { required: "Valid from date is required" })}
                type="date"
                className="w-full px-3 py-2 border border-border-primary bg-surface-primary rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.valid_from && (
                <p className="mt-1 text-sm text-error">{errors.valid_from.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground-primary mb-1">
                Valid Till *
              </label>
              <input
                {...register("valid_till", { required: "Valid till date is required" })}
                type="date"
                className="w-full px-3 py-2 border border-border-primary bg-surface-primary rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.valid_till && (
                <p className="mt-1 text-sm text-error">{errors.valid_till.message}</p>
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
