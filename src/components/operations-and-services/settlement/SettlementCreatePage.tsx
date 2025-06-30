"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { getEmployeeInfo } from "@/lib/api";
import { getCompanyId } from "@/lib/api";
import { uploadManyFiles } from "@/lib/api";
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
  User,
  AlertCircle,
  Paperclip
} from "lucide-react";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { FormLayout, FormSection, FormGrid } from "@/components/ui/FormLayout";
import { Button } from "@/components/ui/button";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";

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

  useEffect(() => {
    fetchClaimTypes();
    fetchEmployees();
  }, [fetchClaimTypes, fetchEmployees]);

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!settlementState.settlement_type_id) {
      newErrors.settlement_type_id = "Settlement type is required";
    }
    if (!settlementState.amount || settlementState.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!settlementState.event_date) {
      newErrors.event_date = "Event date is required";
    }
    if (!settlementState.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    try {
      // Your submit logic here
      toast.success("Settlement request created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to create settlement request");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      // Your draft save logic here
      toast.success("Draft saved successfully");
    } catch (error) {
      toast.error("Failed to save draft");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormLayout
      title="Create Settlement Request"
      subtitle="Submit a new settlement or claim request"
      onBack={onClose}
      onSave={handleSubmit}
      onCancel={onClose}
      isLoading={isSubmitting}
      saveLabel="Submit Request"
    >
      <div className="space-y-8">
        {/* Basic Information */}
        <FormSection 
          title="Basic Information" 
          description="Provide the basic details of your settlement request"
        >
          <FormGrid columns={2}>
            <FormSelectField
              name="settlement_type_id"
              label="Settlement Type"
              icon={<FileText size={18} />}
              value={settlementState.settlement_type_id?.toString() || ""}
              onChange={handleInputChange}
              placeholder="Select settlement type"
              options={claimTypes.map(type => ({
                value: type.id?.toString() || "",
                label: type.settlement_item || "Unknown"
              }))}
              error={errors.settlement_type_id}
            />
            
            <FormInputField
              name="amount"
              label="Amount"
              icon={<DollarSign size={18} />}
              value={settlementState.amount.toString()}
              onChange={handleInputChange}
              type="number"
              error={errors.amount}
            />
            
            <FormInputField
              name="event_date"
              label="Event Date"
              icon={<Calendar size={18} />}
              value={settlementState.event_date}
              onChange={handleInputChange}
              type="date"
              error={errors.event_date}
            />

            <FormSelectField
              name="requested_to"
              label="Requested To"
              icon={<User size={18} />}
              value={settlementState.requested_to}
              onChange={handleInputChange}
              placeholder="Select approver"
              options={employees.map(emp => ({
                value: emp.id.toString(),
                label: emp.name
              }))}
            />
          </FormGrid>

          {/* Advance Payment Toggle */}
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <input
              type="checkbox"
              id="in_advance"
              checked={settlementState.in_advance}
              onChange={(e) => setSettlementState(prev => ({ 
                ...prev, 
                in_advance: e.target.checked 
              }))}
              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="in_advance" className="flex items-center gap-2 text-sm font-medium text-orange-800">
              <AlertCircle size={16} />
              Request as advance payment
            </label>
          </div>
        </FormSection>

        {/* Description */}
        <FormSection 
          title="Description & Comments" 
          description="Provide detailed information about your request"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={settlementState.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the reason for this settlement request..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              name="comment"
              value={settlementState.comment}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional comments or notes..."
            />
          </div>
        </FormSection>

        {/* Attachments */}
        <FormSection 
          title="Attachments" 
          description="Upload supporting documents (receipts, invoices, etc.)"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Paperclip size={16} />
                Choose Files
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <span className="text-sm text-gray-600">
                Supported formats: PDF, DOC, DOCX, Images
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="p-1 h-6 w-6 hover:bg-red-100 hover:text-red-600"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            Save as Draft
          </Button>
          
          {allowance && (
            <div className="text-sm text-gray-600">
              Maximum allowance: <span className="font-semibold">${allowance.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </FormLayout>
  );
}
