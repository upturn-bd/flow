"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { IoMdCalendar } from "react-icons/io";
import { useEmployees } from "@/hooks/useEmployees";
import { z } from "zod";
import { requisitionSchema } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Calendar, 
  Clock, 
  ChevronLeft,
  ChevronDown,
  PackageOpen,
  AlertCircle,
  Save,
  Check,
  Loader2,
  X,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useRequisitionInventories } from "@/hooks/useConfigTypes";
import { useRequisitionTypes } from "@/hooks/useConfigTypes";

// Define a proper interface that mirrors the requisition schema
interface RequisitionFormState {
  requisition_category_id: number;
  employee_id: string;
  item_id: number;
  quantity: number;
  status: "Pending" | "Approved" | "Rejected"; // Using the exact enum values
  is_one_off: boolean;
  from_time: string;
  to_time: string;
  date: string;
  attachments: string[];
  description: string;
  id?: number;
  company_id?: number;
  asset_owner?: string;
  approved_by_id?: string;
  comment?: string;
  remark?: string;
}

const initialRequisitionState: RequisitionFormState = {
  requisition_category_id: 0,
  employee_id: "",
  item_id: 0,
  quantity: 0,
  status: "Pending", // Using valid enum value
  is_one_off: false,
  from_time: "",
  to_time: "",
  date: "",
  attachments: [],
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

// Define a type to handle draft with ID
interface RequisitionDraft extends Omit<RequisitionFormState, 'attachments'> {
  draft_id: number;
  attachments: string[];
}

function saveDraftToLocalStorage(draftId: number, requisitionState: RequisitionFormState) {
  // Check if drafts exist in localStorage
  const drafts = localStorage.getItem("requisition-drafts");
  const parsedDrafts = drafts ? JSON.parse(drafts) : [];
  
  // Create a draft object with draft_id
  const draftToSave: RequisitionDraft = {
    ...requisitionState,
    draft_id: draftId,
    attachments: [], // We can't store File objects in localStorage
  };
  
  // Check if a draft with this ID already exists
  const existingDraftIndex = parsedDrafts.findIndex(
    (draft: RequisitionDraft) => draft.draft_id === draftId
  );

  if (existingDraftIndex !== -1) {
    // Replace existing draft
    parsedDrafts[existingDraftIndex] = draftToSave;
  } else {
    // Add new draft
    parsedDrafts.push(draftToSave);
  }

  // Save back to localStorage
  localStorage.setItem("requisition-drafts", JSON.stringify(parsedDrafts));
}

export default function RequisitionCreatePage({
  onClose,
}: RequisitionCreatePageProps) {
  const [isOneOff, setIsOneOff] = useState(false);
  const [requisitionState, setRequisitionState] = useState<RequisitionFormState>(
    initialRequisitionState
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const { employees, fetchEmployees } = useEmployees();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
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
      const { data, error } = await supabase
        .from("requisition_records")
        .insert(formattedRequisitionState);

      if (error) throw error;
      toast.success("Requisition created successfully!");
      setRequisitionState(initialRequisitionState);
      setAttachments([]);
    } catch (error) {
      console.error("Error creating Requisition:", error);
      toast.error("Error creating Requisition. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDraft() {
    const drafts = localStorage.getItem("requisition-drafts");
    const draftId = drafts ? JSON.parse(drafts).length + 1 : 1;
    
    saveDraftToLocalStorage(draftId, requisitionState);
    toast.success("Draft saved successfully!");
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
    // Perform our own validation instead of using the schema directly
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Basic validation of required fields
    if (!requisitionState.requisition_category_id) {
      newErrors.requisition_category_id = "Please select a category";
      valid = false;
    }

    if (!requisitionState.item_id) {
      newErrors.item_id = "Please select an item";
      valid = false;
    }

    if (!requisitionState.quantity || requisitionState.quantity <= 0) {
      newErrors.quantity = "Please enter a valid quantity";
      valid = false;
    }

    if (!requisitionState.date) {
      newErrors.date = "Please select a date";
      valid = false;
    }

    // Time validation for non-one-off requisitions
    if (!isOneOff) {
      if (!requisitionState.from_time) {
        newErrors.from_time = "Please specify the start time";
        valid = false;
      }
      
      if (!requisitionState.to_time) {
        newErrors.to_time = "Please specify the end time";
        valid = false;
      }
    }

    setErrors(newErrors as Record<string, string>);
    setIsValid(valid);
  }, [requisitionState, isOneOff]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
    fetchEmployees();
  }, [fetchRequisitionTypes, fetchRequisitionInventories, fetchEmployees]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">Create Requisition</h1>
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
        onClick={() => setIsOneOff(!isOneOff)}
      >
        <div className={`w-12 h-6 rounded-full relative ${isOneOff ? 'bg-blue-500' : 'bg-gray-300'} transition-colors duration-300`}>
          <motion.div 
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{ 
              left: isOneOff ? 'calc(100% - 1.25rem - 0.125rem)' : '0.125rem' 
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">One-Off Request</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <PackageOpen size={16} className="mr-2" />
              Category
            </label>
            <div className="relative">
              <select
                name="requisition_category_id"
                value={requisitionState.requisition_category_id}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
              >
                <option value={""}>Select category</option>
                {requisitionTypes.length > 0 &&
                  requisitionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.requisition_category_id && (
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
                value={requisitionState.item_id}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
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
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              {errors.item_id && (
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
              value={requisitionState.quantity}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
            />
            {errors.quantity && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.quantity}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" />
                Date
              </label>
              <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
                <Calendar size={16} className="ml-3 text-gray-500" />
                <input
                  type="date"
                  name="date"
                  value={requisitionState.date}
                  onChange={handleInputChange}
                  className="w-full p-2 outline-none bg-transparent"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.date}
                </p>
              )}
            </div>

            {!isOneOff && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock size={16} className="mr-2" />
                    From
                  </label>
                  <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
                    <Clock size={16} className="ml-3 text-gray-500" />
                    <input
                      type="time"
                      name="from_time"
                      value={requisitionState.from_time}
                      onChange={handleInputChange}
                      className="w-full p-2 outline-none bg-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock size={16} className="mr-2" />
                    To
                  </label>
                  <div className="relative bg-gray-50 border border-gray-300 rounded-md flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-500">
                    <Clock size={16} className="ml-3 text-gray-500" />
                    <input
                      type="time"
                      name="to_time"
                      value={requisitionState.to_time}
                      onChange={handleInputChange}
                      className="w-full p-2 outline-none bg-transparent"
                    />
                  </div>
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
              value={requisitionState.description}
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

export function RequisitionDraftPage({
  draftId,
  onClose,
}: RequisitionDraftPageProps) {
  const [isOneOff, setIsOneOff] = useState(false);
  const [requisitionState, setRequisitionState] = useState<RequisitionFormState & { draft_id?: number }>({
    ...initialRequisitionState,
    draft_id: undefined
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const { employees, fetchEmployees } = useEmployees();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
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
    const company_id = await getCompanyId();
    const user = await getUserInfo();
    setIsSubmitting(true);
    try {
      const { uploadedFilePaths, error: uploadError } = await uploadManyFiles(
        attachments,
        "requisition"
      );

      if (uploadError) throw uploadError;

      // Remove draft_id before submitting to database
      const { draft_id, ...requisitionData } = requisitionState;

      const formattedRequisitionState = {
        ...requisitionData,
        attachments: uploadedFilePaths,
        employee_id: user.id,
        company_id,
        asset_owner: requisitionInventories.filter(
          (inv) => inv.id === requisitionState.item_id
        )[0]?.asset_owner,
      };
      
      const { data, error } = await supabase
        .from("requisition_records")
        .insert(formattedRequisitionState);
        
      if (error) throw error;
      
      toast.success("Requisition created successfully!");
      setRequisitionState(initialRequisitionState);
      setAttachments([]);
      
      // Remove the draft from localStorage
      const drafts = localStorage.getItem("requisition-drafts");
      if (drafts) {
        const updatedDrafts = JSON.parse(drafts).filter(
          (draft: RequisitionDraft) => draft.draft_id !== draft_id
        );
        localStorage.setItem("requisition-drafts", JSON.stringify(updatedDrafts));
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating Requisition:", error);
      toast.error("Error creating Requisition. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveDraft() {
    if (requisitionState.draft_id) {
      const drafts = localStorage.getItem("requisition-drafts");
      if (drafts) {
        const parsedDrafts = JSON.parse(drafts);
        const updatedDrafts = parsedDrafts
          .filter((draft: RequisitionDraft) => draft.draft_id !== requisitionState.draft_id)
          .concat({
            ...requisitionState,
            attachments: [] // We can't store File objects
          });
          
        localStorage.setItem("requisition-drafts", JSON.stringify(updatedDrafts));
        toast.success("Draft updated successfully!");
        setRequisitionState(initialRequisitionState);
        setAttachments([]);
        onClose();
      }
    }
  }

  useEffect(() => {
    const drafts = localStorage.getItem("requisition-drafts");
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts);
      const draft = parsedDrafts.find((draft: RequisitionDraft) => draft.draft_id === draftId);
      if (draft) {
        setRequisitionState({
          ...draft,
          // Keep the draft_id so we can reference it later
          draft_id: draft.draft_id
        });
        setIsOneOff(draft.is_one_off);
        // Note: attachments won't be restored from localStorage
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
    // Perform our own validation instead of using the schema directly
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Basic validation of required fields
    if (!requisitionState.requisition_category_id) {
      newErrors.requisition_category_id = "Please select a category";
      valid = false;
    }

    if (!requisitionState.item_id) {
      newErrors.item_id = "Please select an item";
      valid = false;
    }

    if (!requisitionState.quantity || requisitionState.quantity <= 0) {
      newErrors.quantity = "Please enter a valid quantity";
      valid = false;
    }

    if (!requisitionState.date) {
      newErrors.date = "Please select a date";
      valid = false;
    }

    // Time validation for non-one-off requisitions
    if (!isOneOff) {
      if (!requisitionState.from_time) {
        newErrors.from_time = "Please specify the start time";
        valid = false;
      }
      
      if (!requisitionState.to_time) {
        newErrors.to_time = "Please specify the end time";
        valid = false;
      }
    }

    setErrors(newErrors as Record<string, string>);
    setIsValid(valid);
  }, [requisitionState, isOneOff]);

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
    fetchEmployees();
  }, [fetchRequisitionTypes, fetchRequisitionInventories, fetchEmployees]);

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
