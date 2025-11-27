"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Calendar,
  Clock,
  ChevronDown,
  PackageOpen,
  AlertCircle,
  Check,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import BaseModal from "@/components/ui/modals/BaseModal";
import { useRequisitionInventories, useRequisitionTypes } from "@/hooks/useConfigTypes";
import { RequisitionState } from "@/hooks/useRequisition";
import { uploadManyFiles } from "@/lib/utils/files";

interface RequisitionEditModalProps {
  isOpen: boolean;
  requisition: RequisitionState;
  onClose: () => void;
  onSubmit: (id: number, data: Partial<RequisitionState>) => Promise<RequisitionState | null>;
}

interface EditFormState {
  requisition_category_id: number | undefined;
  item_id: number | undefined;
  quantity: number | undefined;
  is_one_off: boolean;
  from_time: string;
  to_time: string;
  date: string;
  description: string;
}

export default function RequisitionEditModal({
  isOpen,
  requisition,
  onClose,
  onSubmit,
}: RequisitionEditModalProps) {
  const [isOneOff, setIsOneOff] = useState(requisition.is_one_off || false);
  const [formState, setFormState] = useState<EditFormState>({
    requisition_category_id: requisition.requisition_category_id,
    item_id: requisition.item_id,
    quantity: requisition.quantity,
    is_one_off: requisition.is_one_off || false,
    from_time: requisition.from_time || "",
    to_time: requisition.to_time || "",
    date: requisition.date || "",
    description: requisition.description || "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    requisition.attachments || []
  );
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } = useRequisitionInventories();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    if (
      name === "quantity" ||
      name === "requisition_category_id" ||
      name === "item_id"
    ) {
      setFormState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  const removeExistingAttachment = (path: string) => {
    setExistingAttachments((prev) => prev.filter((p) => p !== path));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouchedFields({
      requisition_category_id: true,
      item_id: true,
      quantity: true,
      date: true,
      from_time: true,
      to_time: true,
    });

    if (!isValid) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedFilePaths: string[] = [];
      let publicUrls: string[] = [];

      // Upload new attachments if any
      if (attachments.length > 0) {
        const uploadResult = await uploadManyFiles(attachments, "requisition");
        if (uploadResult.error) throw uploadResult.error;
        uploadedFilePaths = uploadResult.uploadedFilePaths;
        publicUrls = uploadResult.publicUrls;
      }

      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...uploadedFilePaths];
      const allUrls = [
        ...(requisition.attachment_download_urls?.filter((_, i) =>
          existingAttachments.includes(requisition.attachments?.[i] || "")
        ) || []),
        ...publicUrls,
      ];

      const updatedData = {
        ...formState,
        is_one_off: isOneOff,
        attachments: allAttachments,
        attachment_download_urls: allUrls,
      };

      const result = await onSubmit(requisition.id, updatedData);
      if (result) {
        toast.success("Requisition updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error updating Requisition:", error);
      toast.error("Error updating Requisition. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      is_one_off: isOneOff,
    }));
  }, [isOneOff]);

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    if (!formState.requisition_category_id) {
      newErrors.requisition_category_id = "Please select a category";
      valid = false;
    }

    if (!formState.item_id) {
      newErrors.item_id = "Please select an item";
      valid = false;
    }

    if (!formState.quantity || formState.quantity <= 0) {
      newErrors.quantity = "Please enter a valid quantity";
      valid = false;
    }

    if (!formState.date) {
      newErrors.date = "Please select a date";
      valid = false;
    }

    if (!isOneOff) {
      if (!formState.from_time) {
        newErrors.from_time = "Please specify the start time";
        valid = false;
      }

      if (!formState.to_time) {
        newErrors.to_time = "Please specify the end time";
        valid = false;
      }
    }

    setErrors(newErrors);
    setIsValid(valid);
  }, [formState, isOneOff]);

  useEffect(() => {
    if (isOpen) {
      fetchRequisitionTypes();
      fetchRequisitionInventories();
    }
  }, [isOpen, fetchRequisitionTypes, fetchRequisitionInventories]);

  // Reset form when requisition changes
  useEffect(() => {
    if (requisition) {
      setFormState({
        requisition_category_id: requisition.requisition_category_id,
        item_id: requisition.item_id,
        quantity: requisition.quantity,
        is_one_off: requisition.is_one_off || false,
        from_time: requisition.from_time || "",
        to_time: requisition.to_time || "",
        date: requisition.date || "",
        description: requisition.description || "",
      });
      setIsOneOff(requisition.is_one_off || false);
      setExistingAttachments(requisition.attachments || []);
      setAttachments([]);
      setTouchedFields({});
    }
  }, [requisition]);

  const extractFileName = (path: string) => {
    return path.split("/").pop() || path;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Requisition"
      icon={<PackageOpen className="text-blue-600" size={24} />}
      size="lg"
    >
      <div className="space-y-6">
        <div
          className="flex items-center cursor-pointer gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200"
          onClick={() => setIsOneOff(!isOneOff)}
        >
          <div
            className={`w-12 h-6 rounded-full relative ${
              isOneOff ? "bg-blue-500" : "bg-gray-300"
            } transition-colors duration-300`}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
              animate={{
                left: isOneOff ? "calc(100% - 1.25rem - 0.125rem)" : "0.125rem",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            One-Off Request
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <PackageOpen size={16} className="mr-2" />
              Category
            </label>
            <div className="relative">
              <select
                name="requisition_category_id"
                value={formState.requisition_category_id}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("requisition_category_id")}
                className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
              >
                <option value={undefined}>Select category</option>
                {requisitionTypes.length > 0 &&
                  requisitionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              {touchedFields.requisition_category_id &&
                errors.requisition_category_id && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.requisition_category_id}
                  </p>
                )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <div className="relative">
              <select
                name="item_id"
                value={formState.item_id}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("item_id")}
                className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
              >
                <option value={undefined}>Select item</option>
                {requisitionInventories.length > 0 &&
                  requisitionInventories
                    .filter(
                      (inv) =>
                        inv.requisition_category_id ===
                        formState.requisition_category_id
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              {touchedFields.item_id && errors.item_id && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.item_id}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formState.quantity || ""}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur("quantity")}
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
            />
            {touchedFields.quantity && errors.quantity && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.quantity}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" />
                Date
              </label>
              <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
                <Calendar size={16} className="ml-3 text-gray-500" />
                <input
                  type="date"
                  name="date"
                  value={formState.date}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur("date")}
                  className="w-full p-2 outline-none bg-transparent"
                />
              </div>
              {touchedFields.date && errors.date && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.date}
                </p>
              )}
            </div>

            {!isOneOff && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock size={16} className="mr-2" />
                    From
                  </label>
                  <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
                    <Clock size={16} className="ml-3 text-gray-500" />
                    <input
                      type="time"
                      name="from_time"
                      value={formState.from_time}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("from_time")}
                      className="w-full p-2 outline-none bg-transparent"
                    />
                  </div>
                  {touchedFields.from_time && errors.from_time && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.from_time}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock size={16} className="mr-2" />
                    To
                  </label>
                  <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
                    <Clock size={16} className="ml-3 text-gray-500" />
                    <input
                      type="time"
                      name="to_time"
                      value={formState.to_time}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("to_time")}
                      className="w-full p-2 outline-none bg-transparent"
                    />
                  </div>
                  {touchedFields.to_time && errors.to_time && (
                    <p className="mt-1 text-red-500 text-sm flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.to_time}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              maxLength={35}
              value={formState.description}
              onChange={handleInputChange}
              placeholder="Max 35 characters"
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
            />
          </div>

          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Attachments
              </label>
              <div className="flex flex-wrap gap-2">
                {existingAttachments.map((path, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm"
                  >
                    <FileText size={14} className="text-blue-500" />
                    <span className="truncate max-w-xs">
                      {extractFileName(path)}
                    </span>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => removeExistingAttachment(path)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Attachments */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Upload size={16} className="mr-2" />
              Add Attachments
            </label>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
              <label
                htmlFor="edit_file_upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Upload size={16} className="mr-2" />
                Browse Files
              </label>
              <input
                type="file"
                id="edit_file_upload"
                name="attachments"
                className="hidden"
                accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAttachments((prev) => [
                    ...prev,
                    ...files.filter(
                      (file) => !prev.some((f) => f.name === file.name)
                    ),
                  ]);
                }}
              />

              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-wrap gap-2 mt-4 justify-center"
                  >
                    {attachments.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      >
                        <FileText size={14} className="text-blue-500" />
                        <span className="truncate max-w-xs">{file.name}</span>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => removeFile(file.name)}
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Update</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
