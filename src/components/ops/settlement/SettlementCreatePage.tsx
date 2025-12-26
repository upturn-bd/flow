"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { Calendar, CurrencyDollar, X, FileText, User, WarningCircle, Paperclip, CheckCircle } from "@phosphor-icons/react";
import { useClaimTypes } from "@/hooks/useConfigTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { useSettlementRequests } from "@/hooks/useSettlement";
import { toast } from "sonner";
import { FormLayout, FormSection, FormGrid } from "@/components/ui/FormLayout";
import { Button } from "@/components/ui/button";
import { FormField, SelectField, NumberField, DateField } from "@/components/forms";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { uploadManyFiles } from "@/lib/utils/files";
import { useRouter } from "next/navigation";

// Define the settlement state type
interface SettlementState {
  id?: number;
  settlement_type_id: number | undefined;
  amount: number | null;
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
  amount: null,
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
  setActiveTab: (tab: string) => void;
}

export default function SettlementCreatePage({ onClose, setActiveTab }: SettlementCreatePageProps) {
  const [isAdvance, setIsAdvance] = useState(false);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [allowance, setAllowance] = useState<number | null>(null);
  const [settlementState, setSettlementState] = useState<SettlementState>(initialSettlementState);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const { employees, fetchEmployees } = useEmployees();
  const { createSettlementRequest, loading: submitting } = useSettlementRequests();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter()

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
    if (!settlementState.requested_to) {
      newErrors.requested_to = "Approver is required";
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
      const result = await createSettlementRequest(settlementState, attachments);

      if (result.success) {
        toast.success("Settlement request created successfully");
        // Reset form
        setSettlementState(initialSettlementState);
        setAttachments([]);
        setErrors({});
        onClose();
      } else {
        throw new Error(result.error || "Failed to create settlement request");
      }

      router.push("/ops/settlement?tab=history");
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
      // For now, we'll save drafts to localStorage
      // You can implement proper draft saving to database later
      const draftData = {
        settlementState,
        attachments: attachments.map(file => ({ name: file.name, size: file.size })),
        timestamp: new Date().toLocaleDateString('sv-SE')
      };

      localStorage.setItem('settlement_draft', JSON.stringify(draftData));
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
      isLoading={isSubmitting || submitting}
    >
      <div className="space-y-8">
        {/* Basic Information */}
        <FormSection
          title="Basic Information"
          description="Provide the basic details of your settlement request"
        >
          <FormGrid columns={2}>
            <SelectField
              name="settlement_type_id"
              label="Settlement Type"
              value={settlementState.settlement_type_id?.toString() || ""}
              onChange={handleInputChange}
              placeholder="Select settlement type"
              options={claimTypes.map(type => ({
                value: type.id?.toString() || "",
                label: type.settlement_item || "Unknown"
              }))}
              error={errors.settlement_type_id}
            />

            <NumberField
              name="amount"
              label="Amount"
              value={settlementState.amount !== null ? settlementState.amount : ""}
              onChange={handleInputChange}
              error={errors.amount}
            />

            <DateField
              name="event_date"
              label="Event Date"
              value={settlementState.event_date}
              onChange={handleInputChange}
              error={errors.event_date}
            />

            <SelectField
              name="requested_to"
              label="Requested To"
              value={settlementState.requested_to}
              onChange={handleInputChange}
              placeholder="Select approver"
              options={employees.map(emp => ({
                value: emp.id.toString(),
                label: emp.name
              }))}
              error={errors.requested_to}
            />
          </FormGrid>

          {/* Advance Payment Toggle */}
          <div className="flex items-center p-4 bg-warning/10 dark:bg-warning/20 border border-warning/20 rounded-lg">
            <input
              type="checkbox"
              id="in_advance"
              checked={settlementState.in_advance}
              onChange={(e) => setSettlementState(prev => ({
                ...prev,
                in_advance: e.target.checked
              }))}
              className="w-4 h-4 text-warning bg-surface-secondary border-border-secondary rounded focus:ring-warning"
              style={{ display: 'block', flex: 'none' }}
            />
            <label htmlFor="in_advance" className="flex items-center gap-2 text-sm font-medium text-foreground-primary ml-2">
              <WarningCircle size={16} />
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
            <label className="block text-sm font-semibold text-foreground-secondary mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={settlementState.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.description ? 'border-error ring-1 ring-error' : 'border-border-secondary'
                }`}
              placeholder="Describe the reason for this settlement request..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground-secondary mb-2">
              Additional Comments
            </label>
            <textarea
              name="comment"
              value={settlementState.comment}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="flex items-center gap-2 px-4 py-2 border border-border-secondary rounded-lg cursor-pointer hover:bg-background-secondary dark:hover:bg-background-tertiary transition-colors"
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
              <span className="text-sm text-foreground-tertiary">
                Supported formats: PDF, DOC, DOCX, Images
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground-secondary">Selected Files:</h4>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background-secondary dark:bg-background-tertiary rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-foreground-tertiary" />
                      <span className="text-sm text-foreground-secondary">{file.name}</span>
                      <span className="text-xs text-foreground-tertiary">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="p-1 h-6 w-6 hover:bg-error/10 hover:text-error"
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
        {/* Allowance info
        {allowance && (
          <div className="text-sm text-foreground-secondary ml-4">
            Maximum allowance:{" "}
            <span className="font-semibold">
              ${allowance.toLocaleString()}
            </span>
          </div>
        )} */}

        <div className="flex justify-between items-center pt-6 border-t border-border-primary">
          {/* Left side */}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || submitting}
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            Save as Draft
          </Button>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || submitting}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || submitting}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Submit
            </Button>
          </div>
        </div>

      </div>
    </FormLayout>
  );
}
