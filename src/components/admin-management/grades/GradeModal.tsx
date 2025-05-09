"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Grade } from "@/hooks/useGrades";
import { z } from "zod";
import { useEffect, useState } from "react";
import { dirtyValuesChecker } from "@/lib/utils";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit(submitHandler)}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Division" : "Create Division"}
        </h2>

        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Grade Name
          </label>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <input
                {...field}
                className="w-full rounded-md bg-blue-50 p-2"
                placeholder="Enter Name"
              />
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
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
            disabled={isSubmitting || !isValid || !isDirty}
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
