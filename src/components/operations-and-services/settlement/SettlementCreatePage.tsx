"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload,
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronDown,
  CheckCircle,
  Loader2,
  Check,
  X,
  FileText,
  MessageSquare,
  User
} from "lucide-react";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

// Define the settlement state type
interface SettlementState {
  id?: number;
  settlement_type_id: number | undefined;
  amount: number;
  event_date: string;
  requested_to: string;
  description: string;
  comment: string;
  status: string;
  in_advance: boolean;
  attachments: string[];
  claimant_id: string;
  company_id?: number;
}

// Initial state
const initialSettlementState: SettlementState = {
  settlement_type_id: undefined,
  amount: 0,
  event_date: "",
  requested_to: "",
  description: "",
  comment: "",
  status: "Pending",
  in_advance: false,
  attachments: [],
  claimant_id: "",
};

interface SettlementCreatePageProps {
  onClose: () => void;
  draftId?: number;
}

export default function SettlementCreatePage({ onClose }: SettlementCreatePageProps) {
  const [isAdvance, setIsAdvance] = useState(false);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [allowance, setAllowance] = useState<number | null>(null);
  const [settlementState, setSettlementState] = useState<SettlementState>(initialSettlementState);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const { employees, fetchEmployees } = useEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "settlement_type_id") {
      const typeId = Number(value);
      setSelectedType(typeId);

      const claimType = claimTypes.find((type) => type.id === typeId);
      setAllowance(claimType?.allowance || null);

      setSettlementState((prev) => ({
        ...prev,
        [name]: typeId,
        requested_to: claimType?.settler_id || prev.requested_to,
      }));
    } else if (name === "amount") {
      setSettlementState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setSettlementState((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const company_id = await getCompanyId();
      const user = await getEmployeeInfo();

      const { uploadedFilePaths, error: uploadError } = await uploadManyFiles(
        attachments,
        "settlements"
      );

      if (uploadError) throw uploadError;

      const formattedSettlementState = {
        ...settlementState,
        attachments: uploadedFilePaths,
        in_advance: isAdvance,
        claimant_id: user.id,
        company_id: Number(company_id),
      };

      const { error } = await supabase
        .from("settlement_records")
        .insert(formattedSettlementState);

      if (error) throw error;

      toast.success("Settlement request created successfully!");
      setSettlementState(initialSettlementState);
      setAttachments([]);
      setSelectedType(null);
      setAllowance(null);
      onClose();
    } catch (error: any) {
      console.error("Error creating Settlement:", error);
      toast.error(
        `Error creating Settlement: ${error.message || "Please try again"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setSettlementState((prev) => ({
      ...prev,
      in_advance: isAdvance,
    }));
  }, [isAdvance]);

  useEffect(() => {
    // Validate form
    const newErrors: Record<string, string> = {};
    let valid = true;

    if (!settlementState.settlement_type_id) {
      newErrors.settlement_type_id = "Settlement type is required";
      valid = false;
    }

    if (!settlementState.amount || settlementState.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
      valid = false;
    }

    if (allowance !== null && settlementState.amount > allowance) {
      newErrors.amount = `Amount cannot exceed the allowance (${allowance})`;
      valid = false;
    }

    if (!settlementState.event_date) {
      newErrors.event_date = "Date is required";
      valid = false;
    }

    if (!settlementState.description) {
      newErrors.description = "Description is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsValid(valid);
  }, [settlementState, allowance]);

  useEffect(() => {
    fetchClaimTypes();
    fetchEmployees();
  }, [fetchClaimTypes, fetchEmployees]);

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
        onClick={() => setIsAdvance(!isAdvance)}
      >
        <div
          className={`w-12 h-6 rounded-full relative ${
            isAdvance ? "bg-blue-500" : "bg-gray-300"
          } transition-colors duration-300`}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{
              left: isAdvance ? "calc(100% - 1.25rem - 0.125rem)" : "0.125rem",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">
          In Advance Request
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Settlement Type
            </label>
            <div className="relative">
              <select
                name="settlement_type_id"
                value={settlementState.settlement_type_id}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pr-8"
              >
                <option value={undefined}>Select type</option>
                {claimTypes.length > 0 &&
                  claimTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.settlement_item}
                    </option>
                  ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
            {errors.settlement_type_id && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <X size={14} className="mr-1" />
                {errors.settlement_type_id}
              </p>
            )}

            {selectedType !== undefined && allowance !== null && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded"
              >
                <CheckCircle size={16} />
                <span>Allowance: {allowance} BDT</span>
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                BDT
              </span>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={settlementState.amount || ""}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2 pl-14"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <X size={14} className="mr-1" />
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
                <X size={14} className="mr-1" />
                {errors.event_date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User size={16} className="mr-2" />
              Settlement Level
            </label>
            {settlementState.requested_to && (
              <div className="mt-2 bg-blue-50 p-3 rounded-md">
                <p className="text-sm">
                  Your request will be forwarded to:{" "}
                  <span className="font-medium">
                    {employees.find(
                      (emp) => emp.id === settlementState.requested_to
                    )?.name || "Unknown"}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MessageSquare size={16} className="mr-2" />
              Description
            </label>
            <textarea
              name="description"
              value={settlementState.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-md border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors p-2"
              placeholder="Describe what this claim is for..."
            />
            {errors.description && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <X size={14} className="mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Upload size={16} className="mr-2" />
              Attachment
            </label>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-4 text-gray-400 h-10 w-10" />
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop files here, or
              </p>
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
                accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .jpg, .jpeg, .png"
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
