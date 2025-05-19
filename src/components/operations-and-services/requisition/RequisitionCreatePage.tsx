"use client";

import React, { useEffect, useState, ChangeEvent, use } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { IoMdCalendar } from "react-icons/io";
import { useRequisitionInventories } from "@/hooks/useInventory";
import { useRequisitionTypes } from "@/hooks/useRequisitionTypes";
import { z } from "zod";
import { requisitionSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";

const initialRequisitionState = {
  requisition_category_id: 0,
  employee_id: "",
  item_id: 0,
  quantity: 0,
  status: "Pending",
  is_one_off: false,
  from_time: "",
  to_time: "",
  date: "",
  attachments: [] as File[],
  description: "",
};

interface RequisitionCreatePageProps {
  onClose: () => void;
}

interface RequisitionDraftPageProps {
  draftId: number;
  onClose: () => void;
}

export type RequisitionState = z.infer<typeof requisitionSchema>;

function saveDraftToLocalStorage(draftId, requisitionState) {
  // Check if drafts exist in localStorage
  const drafts = localStorage.getItem("requisition-drafts");
  const parsedDrafts = drafts ? JSON.parse(drafts) : [];
  // Check if a draft with this ID already exists
  const existingDraftIndex = parsedDrafts.findIndex(
    (draft: RequisitionState) => draft.id === draftId
  );

  if (existingDraftIndex !== -1) {
    // Replace existing draft
    parsedDrafts[existingDraftIndex] = {
      draft_id: draftId,
      ...requisitionState,
    };
  } else {
    // Add new draft
    parsedDrafts.push({ draft_id: draftId, ...requisitionState });
  }

  // Save back to localStorage
  localStorage.setItem("requisition-drafts", JSON.stringify(parsedDrafts));
}

export default function RequisitionCreatePage({
  onClose,
}: RequisitionCreatePageProps) {
  const [isOneOff, setIsOneOff] = useState(false);
  const [requisitionState, setRequisitionState] = useState(
    initialRequisitionState
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const [errors, setErrors] = useState<Partial<RequisitionState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (
      name === "quantity" ||
      name === "requisition_category_id" ||
      name === "item_id"
    ) {
      setRequisitionState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setRequisitionState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    const company_id = await getCompanyId();
    const user = await getUserInfo();
    setIsSubmitting(true);
    try {
      const { uploadedFilePaths, error: uploadError } = await uploadManyFiles(
        attachments,
        "requisition"
      );

      if (uploadError) throw uploadError;

      const formattedRequisitionState = {
        ...requisitionState,
        attachments: uploadedFilePaths,
        employee_id: user.id,
        company_id,
        asset_owner: requisitionInventories.filter(
          (inv) => inv.id === requisitionState.item_id
        )[0]?.asset_owner,
      };
      const { data, error } = await client
        .from("requisition_records")
        .insert(formattedRequisitionState);
      console.log("Error:", error);
      if (error) throw error;
      alert("Requisition created successfully!");
      setRequisitionState(initialRequisitionState);
      setAttachments([]);
    } catch (error) {
      console.error("Error creating Requisition:", error);
      alert("Error creating Requisition. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDraft() {
    const drafts = localStorage.getItem("requisition-drafts");
    const draftId = drafts ? JSON.parse(drafts).length + 1 : 1;
    saveDraftToLocalStorage(draftId, {
      ...requisitionState,
      attachments: attachments,
    });
    alert("Draft saved successfully!");
    setRequisitionState(initialRequisitionState);
    setAttachments([]);
    onClose();
  }

  useEffect(() => {
    setRequisitionState((prev) => ({
      ...prev,
      is_one_off: isOneOff,
    }));
  }, [isOneOff]);

  useEffect(() => {
    const result = requisitionSchema.safeParse(requisitionState);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<RequisitionState> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [requisitionState]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      <div>
        <div className="flex justify-between">
          <h1 className="text-xl font-bold text-blue-600">Requisition</h1>
          <button
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
        </div>
        <div
          className="flex items-center cursor-pointer gap-2"
          onClick={() => setIsOneOff(!isOneOff)}
        >
          {isOneOff ? (
            <PiToggleRightFill size={36} className="text-blue-500" />
          ) : (
            <PiToggleLeftFill size={36} className="text-gray-400" />
          )}
          <span className="text-sm text-blue-600">One-Off</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Category
          </label>
          <div className="relative">
            <select
              name="requisition_category_id"
              value={requisitionState.requisition_category_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select category</option>
              {requisitionTypes.length > 0 &&
                requisitionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.requisition_category_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.requisition_category_id}
            </p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">Item</label>
          <div className="relative">
            <select
              name="item_id"
              value={requisitionState.item_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select item</option>
              {requisitionInventories.length > 0 &&
                requisitionInventories
                  .filter(
                    (inv) =>
                      inv.requisition_category_id ===
                      requisitionState.requisition_category_id
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.item_id && (
            <p className="text-red-500 text-sm mt-1">{errors.item_id}</p>
          )}
        </div>
        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={requisitionState.quantity}
            onChange={handleInputChange}
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold text-[#003366] mb-1">Date</label>
            <div className="relative bg-white shadow px-4 py-2 rounded-md flex items-center gap-2">
              <IoMdCalendar className="text-gray-600" />
              <input
                type="date"
                name="date"
                value={requisitionState.date}
                onChange={handleInputChange}
                className="outline-none w-full"
              />
            </div>
          </div>

          {!isOneOff && (
            <div className="flex-1">
              <label className="block font-bold text-[#003366] mb-1">
                From
              </label>
              <input
                type="time"
                name="from_time"
                value={requisitionState.from_time}
                onChange={handleInputChange}
                className="w-full bg-white shadow px-4 py-2 rounded-md"
              />
            </div>
          )}

          {!isOneOff && (
            <div className="flex-1">
              <label className="block font-bold text-[#003366] mb-1">To</label>
              <input
                type="time"
                name="to_time"
                value={requisitionState.to_time}
                onChange={handleInputChange}
                className="w-full bg-white shadow px-4 py-2 rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            maxLength={35}
            value={requisitionState.description}
            onChange={handleInputChange}
            placeholder="Max 35 characters."
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Attachment
          </label>
          <div className="bg-gray-100 rounded-md border border-gray-300 p-6 text-center text-sm text-gray-500">
            <FiUploadCloud className="mx-auto mb-4 text-2xl" />
            <label
              htmlFor="file_upload"
              className="px-4 py-2 bg-white border border-gray-400 text-sm rounded-md cursor-pointer hover:bg-gray-200 transition"
            >
              Browse File
            </label>
            <input
              type="file"
              id="file_upload"
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
            <div className="flex gap-3 mt-8 text-gray-600">
              {attachments.length > 0
                ? attachments.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-100 text-sm rounded-sm"
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 text-xl"
                        onClick={() => removeFile(file.name)}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                : "No files selected"}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
            className="bg-[#001F4D] text-white px-6 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Save as Draft"}
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[#001F4D] text-white px-6 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function RequisitionDraftPage({
  draftId,
  onClose,
}: RequisitionDraftPageProps) {
  const [isOneOff, setIsOneOff] = useState(false);
  const [requisitionState, setRequisitionState] = useState(
    initialRequisitionState
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const [errors, setErrors] = useState<Partial<RequisitionState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (
      name === "quantity" ||
      name === "requisition_category_id" ||
      name === "item_id"
    ) {
      setRequisitionState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setRequisitionState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    const company_id = await getCompanyId();
    const user = await getUserInfo();
    setIsSubmitting(true);
    try {
      const { uploadedFilePaths, error: uploadError } = await uploadManyFiles(
        attachments,
        "requisition"
      );

      if (uploadError) throw uploadError;

      const { draft_id, ...rest } = requisitionState;

      const formattedRequisitionState = {
        ...rest,
        attachments: uploadedFilePaths,
        employee_id: user.id,
        company_id,
        asset_owner: requisitionInventories.filter(
          (inv) => inv.id === requisitionState.item_id
        )[0]?.asset_owner,
      };
      const { data, error } = await client
        .from("requisition_records")
        .insert(formattedRequisitionState);
      if (error) throw error;
      alert("Requisition created successfully!");
      setRequisitionState(initialRequisitionState);
      setAttachments([]);
      const drafts = localStorage.getItem("requisition-drafts");
      const updatedDrafts = JSON.parse(drafts).filter(
        (draft) => draft.draft_id !== draft_id
      );
      localStorage.setItem("requisition-drafts", JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error("Error creating Requisition:", error);
      alert("Error creating Requisition. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDraft() {
    const drafts = localStorage.getItem("requisition-drafts");
    const updatedDrafts = JSON.parse(drafts)
      .filter((draft) => draft.draft_id !== requisitionState.draft_id)
      .concat(requisitionState);
    localStorage.setItem("requisition-drafts", JSON.stringify(updatedDrafts));
    alert("Draft saved successfully!");
    setRequisitionState(initialRequisitionState);
    setAttachments([]);
    onClose();
  }

  useEffect(() => {
    const drafts = localStorage.getItem("requisition-drafts");
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts);
      const draft = parsedDrafts.find((draft) => draft.draft_id === draftId);
      if (draft) {
        setRequisitionState(draft);
        setAttachments(draft.attachments);
        setIsOneOff(draft.is_one_off);
      }
    }
  }, [draftId]);

  useEffect(() => {
    setRequisitionState((prev) => ({
      ...prev,
      is_one_off: isOneOff,
    }));
  }, [isOneOff]);

  useEffect(() => {
    const result = requisitionSchema.safeParse(requisitionState);
    setErrors({});
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<RequisitionState> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [requisitionState]);

  useEffect(() => {
    console.log("Errors:", errors);
  }, [errors]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      <div>
        <div className="flex justify-between">
          <h1 className="text-xl font-bold text-blue-600">Requisition</h1>
          <button
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
        </div>
        <div
          className="flex items-center cursor-pointer gap-2"
          onClick={() => setIsOneOff(!isOneOff)}
        >
          {isOneOff ? (
            <PiToggleRightFill size={36} className="text-blue-500" />
          ) : (
            <PiToggleLeftFill size={36} className="text-gray-400" />
          )}
          <span className="text-sm text-blue-600">One-Off</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Category
          </label>
          <div className="relative">
            <select
              name="requisition_category_id"
              value={requisitionState.requisition_category_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select category</option>
              {requisitionTypes.length > 0 &&
                requisitionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.requisition_category_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.requisition_category_id}
            </p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">Item</label>
          <div className="relative">
            <select
              name="item_id"
              value={requisitionState.item_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select item</option>
              {requisitionInventories.length > 0 &&
                requisitionInventories
                  .filter(
                    (inv) =>
                      inv.requisition_category_id ===
                      requisitionState.requisition_category_id
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.item_id && (
            <p className="text-red-500 text-sm mt-1">{errors.item_id}</p>
          )}
        </div>
        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={requisitionState.quantity}
            onChange={handleInputChange}
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold text-[#003366] mb-1">Date</label>
            <div className="relative bg-white shadow px-4 py-2 rounded-md flex items-center gap-2">
              <IoMdCalendar className="text-gray-600" />
              <input
                type="date"
                name="date"
                value={requisitionState.date}
                onChange={handleInputChange}
                className="outline-none w-full"
              />
            </div>
          </div>

          {!isOneOff && (
            <div className="flex-1">
              <label className="block font-bold text-[#003366] mb-1">
                From
              </label>
              <input
                type="time"
                name="from_time"
                value={requisitionState.from_time}
                onChange={handleInputChange}
                className="w-full bg-white shadow px-4 py-2 rounded-md"
              />
            </div>
          )}

          {!isOneOff && (
            <div className="flex-1">
              <label className="block font-bold text-[#003366] mb-1">To</label>
              <input
                type="time"
                name="to_time"
                value={requisitionState.to_time}
                onChange={handleInputChange}
                className="w-full bg-white shadow px-4 py-2 rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            maxLength={35}
            value={requisitionState.description}
            onChange={handleInputChange}
            placeholder="Max 35 characters."
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Attachment
          </label>
          <div className="bg-gray-100 rounded-md border border-gray-300 p-6 text-center text-sm text-gray-500">
            <FiUploadCloud className="mx-auto mb-4 text-2xl" />
            <label
              htmlFor="file_upload"
              className="px-4 py-2 bg-white border border-gray-400 text-sm rounded-md cursor-pointer hover:bg-gray-200 transition"
            >
              Browse File
            </label>
            <input
              type="file"
              id="file_upload"
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
            <div className="flex gap-3 mt-8 text-gray-600">
              {attachments.length > 0
                ? attachments.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-100 text-sm rounded-sm"
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 text-xl"
                        onClick={() => removeFile(file.name)}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                : "No files selected"}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
            className="bg-[#001F4D] text-white px-6 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Save as Draft"}
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[#001F4D] text-white px-6 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
