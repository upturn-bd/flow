"use client";

import React, { useEffect, useState } from "react";
import { isValid, z } from "zod";
import { noticeSchema } from "@/lib/types";
import { Notice } from "@/hooks/useNotice";
import { useDepartments } from "@/hooks/useDepartments";
import { useNewsAndNoticesTypes } from "@/hooks/useNewsAndNotices";

const initialNoticeRecord = {
  notice_type_id: 0,
  title: "",
  description: "",
  urgency: "",
  valid_from: "",
  valid_till: "",
  department_id: 0,
};

interface NoticeCreateModalProps {
  onSubmit: (data: Notice) => void;
  onClose?: () => void;
}

interface NoticeUpdateModalProps {
  initialData: Notice;
  onSubmit: (data: Notice) => void;
  onClose?: () => void;
}

export default function NoticeCreateModal({
  onSubmit,
  onClose,
}: NoticeCreateModalProps) {
  const [notice, setNotice] = useState<Notice>(initialNoticeRecord);
  const [errors, setErrors] = useState<Partial<Notice>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [isValid, setIsValid] = useState(false);
  const { newsAndNoticeTypes, fetchNewsAndNoticesTypes } =
    useNewsAndNoticesTypes();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "valid_from" || name === "valid_till") {
      setNotice((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "notice_type_id" || name === "department_id") {
      setNotice((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setNotice((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const result = noticeSchema.safeParse(notice);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Notice> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = noticeSchema.safeParse(notice);

    if (!result.success) {
      const fieldErrors: Partial<Notice> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Notice] = issue.message;
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
    fetchDepartments();
    fetchNewsAndNoticesTypes();
  }, [fetchDepartments, fetchNewsAndNoticesTypes]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#003366]">New Notice</h1>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
          <button
            disabled={isSubmitting || !isValid}
            onClick={handleSubmit}
            className="bg-[#001F4D] hover:bg-[#002a66] text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Notice
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-6 rounded-xl space-y-4 shadow-sm"
      >
        <div>
          <input
            name="title"
            value={notice.title}
            onChange={handleChange}
            placeholder="Title"
            className="flex-1 w-full px-4 py-2 rounded-md border border-gray-100 bg-white"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <textarea
            name="description"
            value={notice.description}
            onChange={handleChange}
            placeholder="Description"
            rows={4}
            className="flex-1 w-full px-4 py-2 rounded-md border border-gray-100 bg-white resize-none"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Type:
            </label>
            <select
              name="notice_type_id"
              value={notice.notice_type_id}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            >
              <option value="">Select notice type</option>
              {newsAndNoticeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.notice_type_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.notice_type_id}
              </p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Urgency:
            </label>
            <select
              name="urgency"
              value={notice.urgency}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            >
              <option value="">Select urgency</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.urgency && (
              <p className="text-red-500 text-sm mt-1">{errors.urgency}</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Valid From:
            </label>
            <input
              name="valid_from"
              type="date"
              value={notice.valid_from}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            />
            {errors.valid_from && (
              <p className="text-red-500 text-sm mt-1">{errors.valid_from}</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Valid To:
            </label>
            <input
              name="valid_till"
              type="date"
              value={notice.valid_till}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            />
            {errors.valid_till && (
              <p className="text-red-500 text-sm mt-1">{errors.valid_till}</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Department:
            </label>
            <select
              name="department_id"
              value={notice.department_id}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}

export function NoticeUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: NoticeUpdateModalProps) {
  const [notice, setNotice] = useState<Notice>(initialNoticeRecord);
  const [errors, setErrors] = useState<Partial<Notice>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { departments, fetchDepartments } = useDepartments();
  const [isValid, setIsValid] = useState(false);
  const { newsAndNoticeTypes, fetchNewsAndNoticesTypes } =
    useNewsAndNoticesTypes();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "valid_from" || name === "valid_till") {
      setNotice((prev) => ({
        ...prev,
        [name]: new Date(value).toISOString().split("T")[0],
      }));
    } else if (name === "notice_type_id" || name === "department_id") {
      setNotice((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setNotice((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const result = noticeSchema.safeParse(notice);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Notice> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = noticeSchema.safeParse(notice);

    if (!result.success) {
      const fieldErrors: Partial<Notice> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof Notice] = issue.message;
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
    fetchDepartments();
    fetchNewsAndNoticesTypes();
  }, [fetchDepartments, fetchNewsAndNoticesTypes]);

  useEffect(() => {
    if (initialData) {
      const { updated_at, ...rest } = initialData;
      setNotice(rest);
    }
  }, [initialData]);

  useEffect(() => {
    console.log("Errors:", errors);
  }, [errors]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#003366]">Edit Notice</h1>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
          <button
            disabled={isSubmitting || !isValid}
            onClick={handleSubmit}
            className="bg-[#001F4D] hover:bg-[#002a66] text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Notice
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-6 rounded-xl space-y-4 shadow-sm"
      >
        <div>
          <input
            name="title"
            value={notice.title}
            onChange={handleChange}
            placeholder="Title"
            className="flex-1 w-full px-4 py-2 rounded-md border border-gray-100 bg-white"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <textarea
            name="description"
            value={notice.description}
            onChange={handleChange}
            placeholder="Description"
            rows={4}
            className="flex-1 w-full px-4 py-2 rounded-md border border-gray-100 bg-white resize-none"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Type:
            </label>
            <select
              name="notice_type_id"
              value={notice.notice_type_id}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            >
              <option value="">Select notice type</option>
              {newsAndNoticeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.notice_type_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.notice_type_id}
              </p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Urgency:
            </label>
            <select
              name="urgency"
              value={notice.urgency}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            >
              <option value="">Select urgency</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.urgency && (
              <p className="text-red-500 text-sm mt-1">{errors.urgency}</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Valid From:
            </label>
            <input
              name="valid_from"
              type="date"
              value={notice.valid_from}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            />
            {errors.valid_from && (
              <p className="text-red-500 text-sm mt-1">{errors.valid_from}</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Valid To:
            </label>
            <input
              name="valid_till"
              type="date"
              value={notice.valid_till}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            />
            {errors.valid_till && (
              <p className="text-red-500 text-sm mt-1">{errors.valid_till}</p>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-1/5 block text-sm font-semibold text-gray-800">
              Department:
            </label>
            <select
              name="department_id"
              value={notice.department_id}
              onChange={handleChange}
              className="w-4/5 px-4 py-2 rounded-md border border-gray-100 bg-white"
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
