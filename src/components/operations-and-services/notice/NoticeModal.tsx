"use client";

import React, { useEffect, useState } from "react";
import { Notice } from "@/lib/types";
import { validateNotice, validationErrorsToObject } from "@/lib/utils/validation";
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
  notice_type_id: 0,
  title: "",
  description: "",
  urgency: "",
  valid_from: "",
  valid_till: "",
  department_id: 0,
};

interface NoticeModalProps {
  mode: "create" | "update";
  initialData?: Notice;
  onSubmit: (data: Notice) => void;
  onClose?: () => void;
}

interface NoticeCreateModalProps {
  onSubmit: (data: Notice) => void;
  onClose?: () => void;
}

interface NoticeUpdateModalProps {
  initialData: Notice;
  onSubmit: (data: Notice) => void;
  onClose?: () => void;
}

function NoticeModal({ mode, initialData, onSubmit, onClose }: NoticeModalProps) {
  const [notice, setNotice] = useState<Notice>(
    mode === "update" && initialData ? initialData : initialNoticeRecord
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  const { departments, fetchDepartments } = useDepartments();
  const { newsAndNoticeTypes, fetchNewsAndNoticesTypes } = useNewsAndNoticesTypes();

  // Common logic for handling form field changes
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
      setNotice((prev) => ({ 
        ...prev, 
        [name]: value === "" ? 0 : parseInt(value) 
      }));
    } else {
      setNotice((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validation effect
  useEffect(() => {
    // Transform data for validation (convert 0 to undefined for optional fields)
    const dataToValidate = {
      ...notice,
      notice_type_id: notice.notice_type_id === 0 ? undefined : notice.notice_type_id,
      department_id: notice.department_id === 0 ? undefined : notice.department_id,
    };
    
    const validation = validateNotice(dataToValidate);
    if (validation.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(validation.errors);
      setErrors(newErrors);
    }
  }, [notice]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Transform data for validation (convert 0 to undefined for optional fields)
    const dataToValidate = {
      ...notice,
      notice_type_id: notice.notice_type_id === 0 ? undefined : notice.notice_type_id,
      department_id: notice.department_id === 0 ? undefined : notice.department_id,
    };
    
    const validation = validateNotice(dataToValidate);

    if (!validation.success) {
      const fieldErrors = validationErrorsToObject(validation.errors);
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(validation.data);
    setIsSubmitting(false);
  };

  // Initialize data and fetch dependencies
  useEffect(() => {
    fetchDepartments();
    fetchNewsAndNoticesTypes();
  }, [fetchDepartments, fetchNewsAndNoticesTypes]);

  useEffect(() => {
    if (mode === "update" && initialData) {
      setNotice(initialData);
    }
  }, [mode, initialData]);

  // Animation variants
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
          {mode === "create" ? "New Notice" : "Edit Notice"}
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
            {mode === "create" ? "Post Notice" : "Update Notice"}
          </motion.button>
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl space-y-5 shadow-sm border border-amber-100"
        variants={formVariants}
      >
        {/* Title Field */}
        <motion.div variants={itemVariants}>
          <div className="mb-1 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
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

        {/* Description Field */}
        <motion.div variants={itemVariants}>
          <div className="mb-1 flex items-center">
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
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
          {/* Notice Type Field */}
          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Notice Type <span className="text-red-500">*</span>
              </label>
              {errors.notice_type_id && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.notice_type_id}
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
                value={notice.notice_type_id || ""}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.notice_type_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value="">Select notice type</option>
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

          {/* Urgency Field */}
          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Urgency <span className="text-red-500">*</span>
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

          {/* Valid From Field */}
          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Valid From <span className="text-red-500">*</span>
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

          {/* Valid Till Field */}
          <motion.div variants={itemVariants}>
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Valid To <span className="text-red-500">*</span>
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

          {/* Department Field */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="mb-1 flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              {errors.department_id && (
                <span className="ml-2 text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.department_id}
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
                value={notice.department_id || ""}
                onChange={handleChange}
                className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.department_id
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-300 transition-colors`}
              >
                <option value="">Select department</option>
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

// Wrapper components for backward compatibility
export function NoticeCreateModal({
  onSubmit,
  onClose,
}: NoticeCreateModalProps) {
  return (
    <NoticeModal 
      mode="create" 
      onSubmit={onSubmit} 
      onClose={onClose} 
    />
  );
}

export function NoticeUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: NoticeUpdateModalProps) {
  return (
    <NoticeModal 
      mode="update" 
      initialData={initialData} 
      onSubmit={onSubmit} 
      onClose={onClose} 
    />
  );
}
