"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { z } from "zod";
import { settlementRecordSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";
import { useClaimTypes } from "@/hooks/useClaimAndSettlement";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Calendar, 
  ChevronLeft,
  ChevronDown,
  DollarSign, 
  AlertCircle,
  Save,
  Check,
  Loader2,
  X,
  FileText,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { IoMdCalendar } from "react-icons/io";
import { FiUploadCloud } from "react-icons/fi";

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

function saveDraftToLocalStorage(draftId: number, settlementState: SettlementState) {
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
        newErrors[err.path[0] as keyof SettlementState] = err.message as unknown as undefined;
      });
      setErrors(newErrors);
    }
  }, [settlementState]);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">Create Settlement</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </motion.button>
      </div>
      
      <div
        className="flex items-center cursor-pointer gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200"
        onClick={() => setInAdvance(!inAdvance)}
      >
        <div className={`w-12 h-6 rounded-full relative ${inAdvance ? 'bg-blue-500' : 'bg-gray-300'} transition-colors duration-300`}>
          <motion.div 
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{ 
              left: inAdvance ? 'calc(100% - 1.25rem - 0.125rem)' : '0.125rem' 
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">In Advance</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Category
            </label>
            <div className="relative">
              <select
                name="settlement_type_id"
                value={settlementState.settlement_type_id}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
              >
                <option value={""}>Select category</option>
                {claimTypes.length > 0 &&
                  claimTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.settlement_item}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.settlement_type_id && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.settlement_type_id}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-500" />
              </div>
              <input
                type="number"
                name="amount"
                value={settlementState.amount}
                onChange={handleInputChange}
                className="w-full pl-10 rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.amount}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar size={16} className="mr-2" />
              Date
            </label>
            <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
              <Calendar size={16} className="ml-3 text-gray-500" />
              <input
                type="date"
                name="event_date"
                value={settlementState.event_date}
                onChange={handleInputChange}
                className="w-full p-2 outline-none bg-transparent"
              />
            </div>
            {errors.event_date && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.event_date}
              </p>
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
              value={settlementState.description}
              onChange={handleInputChange}
              placeholder="Max 35 characters"
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Upload size={16} className="mr-2" />
              Attachment
            </label>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-4 text-gray-400 h-10 w-10" />
              <p className="text-sm text-gray-500 mb-4">Drag and drop files here, or</p>
              <label
                htmlFor="file_upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Upload size={16} className="mr-2" />
                Browse Files
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
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => removeFile(file.name)}
                        >
                          <X size={16} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            <span>Save as Draft</span>
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
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Submit</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
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
      const updatedDrafts = JSON.parse(drafts!).filter(
        (draft: { draft_id: number }) => draft.draft_id !== draft_id
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
    const updatedDrafts = JSON.parse(drafts!)
      .filter((draft: { draft_id: number }) => draft.draft_id !== settlementState.draft_id)
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
      const draft = parsedDrafts.find((draft: { draft_id: number }) => draft.draft_id === draftId);
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
        newErrors[err.path[0] as keyof SettlementState] = err.message as unknown as undefined;
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
