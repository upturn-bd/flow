"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { IoMdCalendar } from "react-icons/io";
import { z } from "zod";
import { settlementRecordSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";
import { useClaimTypes } from "@/hooks/useClaimAndSettlement";

const initialSettlementRecord = {
  settlement_type_id: 0,
  description: "",
  event_date: "",
  amount: 0,
  comment: "",
  status: "Pending",
  in_advance: false,
  attachments: [],
};

interface SettlementCreatePageProps {
  onClose: () => void;
}

interface SettlementDraftPageProps {
  draftId: number;
  onClose: () => void;
}

export type SettlementState = z.infer<typeof settlementRecordSchema>;

function saveDraftToLocalStorage(draftId, settlementState) {
  // Check if drafts exist in localStorage
  const drafts = localStorage.getItem("settlement_drafts");
  const parsedDrafts = drafts ? JSON.parse(drafts) : [];
  // Check if a draft with this ID already exists
  const existingDraftIndex = parsedDrafts.findIndex(
    (draft: SettlementState) => draft.id === draftId
  );

  if (existingDraftIndex !== -1) {
    // Replace existing draft
    parsedDrafts[existingDraftIndex] = {
      draft_id: draftId,
      ...settlementState,
    };
  } else {
    // Add new draft
    parsedDrafts.push({ draft_id: draftId, ...settlementState });
  }

  // Save back to localStorage
  localStorage.setItem("settlement_drafts", JSON.stringify(parsedDrafts));
}

export default function SettlementCreatePage({
  onClose,
}: SettlementCreatePageProps) {
  const [inAdvance, setInAdvance] = useState(false);
  const [settlementState, setSettlementState] = useState(
    initialSettlementRecord
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [errors, setErrors] = useState<Partial<SettlementState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === "amount" || name === "settlement_type_id") {
      setSettlementState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setSettlementState((prev) => ({ ...prev, [name]: value }));
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
        "settlement"
      );

      if (uploadError) throw uploadError;

      const formattedSettlementState = {
        ...settlementState,
        attachments: uploadedFilePaths,
        claimant_id: user.id,
        company_id,
        requested_to: claimTypes.filter(
          (type) => type.id === settlementState.settlement_type_id
        )[0].settler_id,
      };
      const { data, error } = await client
        .from("settlement_records")
        .insert(formattedSettlementState);
      console.log("Error:", error);
      if (error) throw error;
      alert("Settlement created successfully!");
      setSettlementState(initialSettlementRecord);
      setAttachments([]);
    } catch (error) {
      console.error("Error creating Settlement:", error);
      alert("Error creating Settlement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDraft() {
    const drafts = localStorage.getItem("settlement_drafts");
    const draftId = drafts ? JSON.parse(drafts).length + 1 : 1;
    saveDraftToLocalStorage(draftId, {
      ...settlementState,
      attachments: attachments,
    });
    alert("Draft saved successfully!");
    setSettlementState(initialSettlementRecord);
    setAttachments([]);
    onClose();
  }

  useEffect(() => {
    setSettlementState((prev) => ({
      ...prev,
      in_advance: inAdvance,
    }));
  }, [inAdvance]);

  useEffect(() => {
    const result = settlementRecordSchema.safeParse(settlementState);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<SettlementState> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [settlementState]);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      <div>
        <div className="flex justify-between">
          <h1 className="text-xl font-bold text-blue-600">Settlement</h1>
          <button
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
        </div>
        <div
          className="flex items-center cursor-pointer gap-2"
          onClick={() => setInAdvance(!inAdvance)}
        >
          {inAdvance ? (
            <PiToggleRightFill size={36} className="text-blue-500" />
          ) : (
            <PiToggleLeftFill size={36} className="text-gray-400" />
          )}
          <span className="text-sm text-blue-600">In Advance</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Category
          </label>
          <div className="relative">
            <select
              name="settlement_type_id"
              value={settlementState.settlement_type_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select category</option>
              {claimTypes.length > 0 &&
                claimTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.settlement_item}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.settlement_type_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.settlement_type_id}
            </p>
          )}
        </div>
        <div>
          <label className="block font-bold text-[#003366] mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={settlementState.amount}
            onChange={handleInputChange}
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold text-[#003366] mb-1">Date</label>
            <div className="relative bg-white shadow px-4 py-2 rounded-md flex items-center gap-2">
              <IoMdCalendar className="text-gray-600" />
              <input
                type="date"
                name="event_date"
                value={settlementState.event_date}
                onChange={handleInputChange}
                className="outline-none w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            maxLength={35}
            value={settlementState.description}
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

export function SettlementDraftPage({
  draftId,
  onClose,
}: SettlementDraftPageProps) {
  const [inAdvance, setInAdvance] = useState(false);
  const [settlementState, setSettlementState] = useState(
    initialSettlementRecord
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [errors, setErrors] = useState<Partial<SettlementState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === "amount" || name === "settlement_type_id") {
      setSettlementState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setSettlementState((prev) => ({ ...prev, [name]: value }));
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
        "settlement"
      );

      if (uploadError) throw uploadError;

      const { draft_id, ...rest } = settlementState;

      const formattedSettlementState = {
        ...rest,
        attachments: uploadedFilePaths,
        claimant_id: user.id,
        company_id,
        requested_to: claimTypes.filter(
          (type) => type.id === settlementState.settlement_type_id
        )[0].settler_id,
      };
      const { data, error } = await client
        .from("settlement_records")
        .insert(formattedSettlementState);
      if (error) throw error;
      alert("Settlement created successfully!");
      setSettlementState(initialSettlementRecord);
      setAttachments([]);
      const drafts = localStorage.getItem("settlement_drafts");
      const updatedDrafts = JSON.parse(drafts).filter(
        (draft) => draft.draft_id !== draft_id
      );
      localStorage.setItem("settlement_drafts", JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error("Error creating Settlement:", error);
      alert("Error creating Settlement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDraft() {
    const drafts = localStorage.getItem("settlement_drafts");
    const updatedDrafts = JSON.parse(drafts)
      .filter((draft) => draft.draft_id !== settlementState.draft_id)
      .concat(settlementState);
    localStorage.setItem("settlement_drafts", JSON.stringify(updatedDrafts));
    alert("Draft saved successfully!");
    setSettlementState(initialSettlementRecord);
    setAttachments([]);
    onClose();
  }

  useEffect(() => {
    const drafts = localStorage.getItem("settlement_drafts");
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts);
      const draft = parsedDrafts.find((draft) => draft.draft_id === draftId);
      if (draft) {
        setSettlementState(draft);
        setAttachments(draft.attachments);
        setInAdvance(draft.in_advance);
      }
    }
  }, [draftId]);

  useEffect(() => {
    setSettlementState((prev) => ({
      ...prev,
      in_advance: inAdvance,
    }));
  }, [inAdvance]);

  useEffect(() => {
    const result = settlementRecordSchema.safeParse(settlementState);
    setErrors({});
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<SettlementState> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [settlementState]);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  useEffect(() => {
    console.log("Settlement State:", settlementState);
    console.log("Attachments:", attachments);
  }, [settlementState, attachments]);

  useEffect(() => {
    console.log("Errors:", errors);
  }, [errors]);
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      <div>
        <div className="flex justify-between">
          <h1 className="text-xl font-bold text-blue-600">Settlement</h1>
          <button
            onClick={onClose}
            className="bg-yellow-500 px-4 py-2 rounded-md"
          >
            Back
          </button>
        </div>
        <div
          className="flex items-center cursor-pointer gap-2"
          onClick={() => setInAdvance(!inAdvance)}
        >
          {inAdvance ? (
            <PiToggleRightFill size={36} className="text-blue-500" />
          ) : (
            <PiToggleLeftFill size={36} className="text-gray-400" />
          )}
          <span className="text-sm text-blue-600">In Advance</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Category
          </label>
          <div className="relative">
            <select
              name="settlement_type_id"
              value={settlementState.settlement_type_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select category</option>
              {claimTypes.length > 0 &&
                claimTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.settlement_item}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.settlement_type_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.settlement_type_id}
            </p>
          )}
        </div>
        <div>
          <label className="block font-bold text-[#003366] mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={settlementState.amount}
            onChange={handleInputChange}
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold text-[#003366] mb-1">Date</label>
            <div className="relative bg-white shadow px-4 py-2 rounded-md flex items-center gap-2">
              <IoMdCalendar className="text-gray-600" />
              <input
                type="date"
                name="event_date"
                value={settlementState.event_date}
                onChange={handleInputChange}
                className="outline-none w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            maxLength={35}
            value={settlementState.description}
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
