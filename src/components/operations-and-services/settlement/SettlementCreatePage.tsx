"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { z } from "zod";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, DollarSign } from "lucide-react";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

// Define the settlement schema
const settlementSchema = z.object({
  id: z.number().optional(),
  settlement_type_id: z.number().min(1, { message: "Settlement type is required" }),
  description: z.string().optional(),
  event_date: z.string().min(1, { message: "Event date is required" }),
  amount: z.number().min(0.01, { message: "Amount must be greater than 0" }),
  comment: z.string().optional(),
  status: z.string().min(1, { message: "Status is required" }),
  approved_by_id: z.string().optional(),
  claimant_id: z.string().optional(),
  requested_to: z.string().optional(),
  in_advance: z.boolean().optional(),
  attachments: z.array(z.string()).optional(),
});

// Define the settlement state type
interface SettlementState {
  id: number;
  settlement_type_id: number;
  amount: number;
  event_date: string;
  requested_to: string;
  description: string;
  comment: string;
  status: string;
  in_advance: boolean;
  attachments: string[];
  claimant_id: string;
  company_id?: number; // Optional in the form but required for API
}

// Initial state
const initialSettlementState: SettlementState = {
  id: 0,
  settlement_type_id: 0,
  amount: 0,
  event_date: "",
  requested_to: "",
  description: "",
  comment: "",
  status: "Submitted",
  in_advance: false,
  attachments: [],
  claimant_id: "",
};

export default function SettlementCreatePage() {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "settlement_type_id") {
      const typeId = Number(value);
      setSelectedType(typeId);
      
      const claimType = claimTypes.find(type => type.id === typeId);
      setAllowance(claimType?.allowance || null);
      
      setSettlementState(prev => ({ 
        ...prev, 
        [name]: typeId,
        requested_to: claimType?.settler_id || prev.requested_to
      }));
    }
    else if (name === "amount") {
      setSettlementState(prev => ({ ...prev, [name]: Number(value) }));
    } 
    else {
      setSettlementState(prev => ({ 
        ...prev, 
        [name]: value 
      }));
    }
  };

  const removeFile = (name: string) => {
    setAttachments(prev => prev.filter(file => file.name !== name));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const company_id = await getCompanyId();
      const user = await getUserInfo();

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
    } catch (error: any) {
      console.error("Error creating Settlement:", error);
      toast.error(`Error creating Settlement: ${error.message || "Please try again"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setSettlementState(prev => ({
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
    } else if (!isValidDate(settlementState.event_date)) {
      newErrors.event_date = "Please provide a valid date";
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

  function isValidDate(dateString: string) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      <div>
        <h1 className="text-xl font-bold text-blue-600">Claims & Settlement</h1>
        <div
          className="flex items-center cursor-pointer gap-2 mt-2"
          onClick={() => setIsAdvance(!isAdvance)}
        >
          {isAdvance ? (
            <PiToggleRightFill size={36} className="text-blue-500" />
          ) : (
            <PiToggleLeftFill size={36} className="text-gray-400" />
          )}
          <span className="text-sm text-blue-600">In advance</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Settlement Type
          </label>
          <div className="relative">
            <select
              name="settlement_type_id"
              value={settlementState.settlement_type_id || ""}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value="">Select Type</option>
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

          {selectedType && allowance !== null && (
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
          <label className="block text-lg font-bold text-blue-700">Amount</label>
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
              className="w-full bg-blue-100 rounded p-3 pl-14"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <DollarSign size={16} className="text-gray-400" />
            </div>
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-bold text-blue-700">Date</label>
          <div className="relative">
            <input
              type="date"
              name="event_date"
              value={settlementState.event_date}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Calendar size={16} className="text-gray-400" />
            </div>
          </div>
          {errors.event_date && (
            <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-bold text-blue-700">
            Settlement Level
          </label>
          {settlementState.requested_to && (
            <div className="mt-2 bg-blue-50 p-3 rounded-md">
              <p className="text-sm">
                Your request will be forwarded to:{" "}
                <span className="font-medium">
                  {employees.find(emp => emp.id === settlementState.requested_to)?.name || "Unknown"}
                </span>
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-lg font-bold text-blue-700">
            Description
          </label>
          <textarea
            name="description"
            value={settlementState.description || ""}
            onChange={handleInputChange}
            rows={4}
            className="w-full bg-blue-100 rounded p-3"
            placeholder="Describe what this claim is for..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block font-bold text-blue-700 mb-1">
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
            <div className="flex flex-wrap gap-3 mt-8 text-gray-600">
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
          <p className="text-xs text-gray-500 mt-2">
            Attach receipts or supporting documents (optional)
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-blue-700 text-white px-6 py-2 rounded-full hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
