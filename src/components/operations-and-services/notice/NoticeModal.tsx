"use client";

import React, { useEffect, useState } from "react";
import { noticeSchema } from "@/lib/types";
import { Notice } from "@/hooks/useNotice";
import { useDepartments } from "@/hooks/useDepartments";
import { useNewsAndNoticesTypes } from "@/hooks/useNewsAndNotices";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  Info,
  AlertCircle,
  X,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { BuildingOffice } from "@phosphor-icons/react";

const initialNoticeRecord = {
  notice_type_id: undefined,
  title: "",
  description: "",
  urgency: "",
  valid_from: "",
  valid_till: "",
  department_id: undefined,
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
        newErrors[err.path[0] as keyof Notice] = err.message as unknown as any;
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
        fieldErrors[issue.path[0] as keyof Notice] =
          issue.message as unknown as any;
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

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto space-y-6"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
    >
      <motion.div
        className="flex justify-between items-center"
        variants={itemVariants}
      >
        <h1 className="text-xl font-bold text-amber-700 flex items-center">
          <Bell className="mr-2 h-5 w-5 text-amber-500" />
          New Notice
        </h1>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:bg-amber-50 shadow-sm"
          >
            <X className="h-4 w-4" />
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: isSubmitting || !isValid ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting || !isValid ? 1 : 0.95 }}
            disabled={isSubmitting || !isValid}
            onClick={handleSubmit}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
          >
            <CheckCircle className="h-4 w-4" />
            Post Notice
          </motion.button>
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl space-y-5 shadow-sm border border-amber-100"
        variants={formVariants}
      >
        <motion.div variants={itemVariants}>
          <div className="mb-1 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            {errors.title && (
              <span className="ml-2 text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title}
              </span>
            )}
          </div>
          <input
            name="title"
            value={notice.title}
            onChange={handleChange}
            placeholder="Enter notice title"
            className={`flex-1 w-full px-4 py-2.5 rounded-lg border ${
              errors.title
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-white"
            } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="mb-1 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            {errors.description && (
              <span className="ml-2 text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.description}
              </span>
            )}
          </div>
          <textarea
            name="description"
            value={notice.description}
            onChange={handleChange}
            placeholder="Enter notice details"
            rows={4}
            className={`flex-1 w-full px-4 py-2.5 rounded-lg border ${
              errors.description
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-white"
            } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors resize-none`}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Notice Type
              </label>
              {errors.notice_type_id && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a notice type
                </span>
              )}
              {notice.notice_type_id === undefined && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a notice type
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.notice_type_id ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageCircle className="h-4 w-4 text-amber-500" />
              </div>
              <select
                name="notice_type_id"
                value={notice.notice_type_id}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.notice_type_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value={undefined}>Select notice type</option>
                {newsAndNoticeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Urgency
              </label>
              {errors.urgency && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.urgency}
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.urgency ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Info className="h-4 w-4 text-amber-500" />
              </div>
              <select
                name="urgency"
                value={notice.urgency}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.urgency
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value="">Select urgency</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Valid From
              </label>
              {errors.valid_from && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.valid_from}
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.valid_from ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <input
                name="valid_from"
                type="date"
                value={notice.valid_from}
                onChange={handleChange}
                className={`w-full pl-10 py-2.5 rounded-lg border ${
                  errors.valid_from
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Valid To
              </label>
              {errors.valid_till && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.valid_till}
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.valid_till ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <input
                name="valid_till"
                type="date"
                value={notice.valid_till}
                onChange={handleChange}
                className={`w-full pl-10 py-2.5 rounded-lg border ${
                  errors.valid_till
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              {errors.department_id && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a department
                </span>
              )}
              {notice.department_id === undefined && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a department
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.department_id ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingOffice className="h-4 w-4 text-amber-500" />
              </div>
              <select
                name="department_id"
                value={notice.department_id}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.department_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value={undefined}>Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
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
        newErrors[err.path[0] as keyof Notice] = err.message as unknown as any;
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
        fieldErrors[issue.path[0] as keyof Notice] =
          issue.message as unknown as any;
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
      setNotice(initialData);
    }
  }, [initialData]);

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto space-y-6"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
    >
      <motion.div
        className="flex justify-between items-center"
        variants={itemVariants}
      >
        <h1 className="text-xl font-bold text-amber-700 flex items-center">
          <Bell className="mr-2 h-5 w-5 text-amber-500" />
          Edit Notice
        </h1>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:bg-amber-50 shadow-sm"
          >
            <X className="h-4 w-4" />
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: isSubmitting || !isValid ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting || !isValid ? 1 : 0.95 }}
            disabled={isSubmitting || !isValid}
            onClick={handleSubmit}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
          >
            <CheckCircle className="h-4 w-4" />
            Update Notice
          </motion.button>
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl space-y-5 shadow-sm border border-amber-100"
        variants={formVariants}
      >
        <motion.div variants={itemVariants}>
          <div className="mb-1 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            {errors.title && (
              <span className="ml-2 text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title}
              </span>
            )}
          </div>
          <input
            name="title"
            value={notice.title}
            onChange={handleChange}
            placeholder="Enter notice title"
            className={`flex-1 w-full px-4 py-2.5 rounded-lg border ${
              errors.title
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-white"
            } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="mb-1 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            {errors.description && (
              <span className="ml-2 text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.description}
              </span>
            )}
          </div>
          <textarea
            name="description"
            value={notice.description}
            onChange={handleChange}
            placeholder="Enter notice details"
            rows={4}
            className={`flex-1 w-full px-4 py-2.5 rounded-lg border ${
              errors.description
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-white"
            } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors resize-none`}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Notice Type
              </label>
              {errors.notice_type_id && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a notice type
                </span>
              )}
              {notice.notice_type_id === undefined && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a notice type
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.notice_type_id ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageCircle className="h-4 w-4 text-amber-500" />
              </div>
              <select
                name="notice_type_id"
                value={notice.notice_type_id}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.notice_type_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value={undefined}>Select notice type</option>
                {newsAndNoticeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Urgency
              </label>
              {errors.urgency && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.urgency}
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.urgency ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Info className="h-4 w-4 text-amber-500" />
              </div>
              <select
                name="urgency"
                value={notice.urgency}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.urgency
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value="">Select urgency</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Valid From
              </label>
              {errors.valid_from && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.valid_from}
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.valid_from ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <input
                name="valid_from"
                type="date"
                value={notice.valid_from}
                onChange={handleChange}
                className={`w-full pl-10 py-2.5 rounded-lg border ${
                  errors.valid_from
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Valid To
              </label>
              {errors.valid_till && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.valid_till}
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.valid_till ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <input
                name="valid_till"
                type="date"
                value={notice.valid_till}
                onChange={handleChange}
                className={`w-full pl-10 py-2.5 rounded-lg border ${
                  errors.valid_till
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              {errors.department_id && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a department
                </span>
              )}
              {notice.department_id === undefined && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a department
                </span>
              )}
            </div>
            <div
              className={`relative rounded-lg ${
                errors.department_id ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingOffice className="h-4 w-4 text-amber-500" />
              </div>
              <select
                name="department_id"
                value={notice.department_id}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.department_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value={undefined}>Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
}
