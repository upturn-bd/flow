"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  CalendarBlank,
  CurrencyDollar,
  Percent,
  FileText,
  ArrowRight,
  Info,
  Warning,
  CheckCircle,
  ListBullets,
  Sparkle,
} from "@phosphor-icons/react";
import { useServiceInvoices } from "@/hooks/useServiceInvoices";
import {
  StakeholderService,
  StakeholderInvoiceLineItem,
  ProRataDetails,
  DAYS_OF_MONTH,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormInputField from "@/components/ui/FormInputField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

interface InvoiceGenerationFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: StakeholderService;
  onSuccess?: (invoice: any) => void;
}

interface InvoicePreview {
  lineItems: StakeholderInvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  proRataDetails: ProRataDetails | null;
}

export default function InvoiceGenerationForm({
  isOpen,
  onClose,
  service,
  onSuccess,
}: InvoiceGenerationFormProps) {
  const { previewInvoice, createInvoice, loading } = useServiceInvoices();

  // Form state
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Preview state
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Initialize billing period based on service
  useEffect(() => {
    if (isOpen && service) {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      // Determine billing period based on last billed date or service start
      if (service.last_billed_date) {
        // Start from day after last billed
        startDate = new Date(service.last_billed_date);
        startDate.setDate(startDate.getDate() + 1);
      } else {
        // Start from service start date
        startDate = new Date(service.start_date);
      }

      // Calculate end date based on billing cycle
      if (service.service_type === "recurring") {
        switch (service.billing_cycle_type) {
          case "monthly":
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
            break;
          case "weekly":
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            break;
          case "yearly":
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            endDate.setDate(endDate.getDate() - 1);
            break;
          case "x_days":
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (service.billing_interval_days || 30) - 1);
            break;
          default:
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
        }
      } else {
        // One-off: use today's date
        startDate = today;
        endDate = today;
      }

      // Don't go past service end date if set
      if (service.end_date && endDate > new Date(service.end_date)) {
        endDate = new Date(service.end_date);
      }

      // Format dates
      setBillingPeriodStart(startDate.toISOString().split("T")[0]);
      setBillingPeriodEnd(endDate.toISOString().split("T")[0]);

      // Set default due date (30 days from end of period)
      const due = new Date(endDate);
      due.setDate(due.getDate() + 30);
      setDueDate(due.toISOString().split("T")[0]);

      // Clear other fields
      setNotes("");
      setInternalNotes("");
      setPreview(null);
      setPreviewError(null);
    }
  }, [isOpen, service]);

  // Generate preview when dates change
  useEffect(() => {
    const generatePreview = async () => {
      if (!billingPeriodStart || !billingPeriodEnd || !service) return;

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const result = await previewInvoice({
          service_id: service.id!,
          billing_period_start: billingPeriodStart,
          billing_period_end: billingPeriodEnd,
        });

        if (result) {
          setPreview(result);
        } else {
          setPreviewError("Failed to generate preview");
        }
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : "Failed to generate preview");
      } finally {
        setPreviewLoading(false);
      }
    };

    const debounce = setTimeout(generatePreview, 500);
    return () => clearTimeout(debounce);
  }, [billingPeriodStart, billingPeriodEnd, service, previewInvoice]);

  // Form validation
  const isValid = useMemo(() => {
    return billingPeriodStart && billingPeriodEnd && preview && !previewError;
  }, [billingPeriodStart, billingPeriodEnd, preview, previewError]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValid || !service.id) return;

    try {
      const invoice = await createInvoice({
        service_id: service.id,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        due_date: dueDate || undefined,
        notes: notes || undefined,
        internal_notes: internalNotes || undefined,
      });

      if (invoice) {
        toast.success(`Invoice ${invoice.invoice_number} created successfully`);
        onSuccess?.(invoice);
        onClose();
      } else {
        toast.error("Failed to create invoice");
      }
    } catch (err) {
      toast.error("Failed to create invoice");
    }
  };

  // Calculate period days
  const periodDays = useMemo(() => {
    if (!billingPeriodStart || !billingPeriodEnd) return 0;
    const start = new Date(billingPeriodStart);
    const end = new Date(billingPeriodEnd);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [billingPeriodStart, billingPeriodEnd]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Invoice"
      size="lg"
    >
      <div className="space-y-6">
        {/* Service Info Banner */}
        <motion.div
          variants={fadeInUp}
          className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-start gap-3">
            <ArrowRight size={20} className="text-primary-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground-primary">{service.service_name}</h3>
              <p className="text-sm text-foreground-secondary mt-1">{service.description}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <Badge variant="info">
                  {service.service_type === "recurring" ? "Recurring" : "One-time"}
                </Badge>
                {service.billing_cycle_type && (
                  <Badge variant="default">{service.billing_cycle_type}</Badge>
                )}
                <span className="text-sm text-foreground-tertiary">
                  Currency: {service.currency}
                </span>
                {service.tax_rate > 0 && (
                  <span className="text-sm text-foreground-tertiary">
                    Tax: {service.tax_rate}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Last Billed Info */}
        {service.last_billed_date && (
          <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg">
            <Info size={18} className="text-info" />
            <span className="text-sm text-foreground-secondary">
              Last billed: {formatDate(service.last_billed_date)}
            </span>
          </div>
        )}

        {/* Billing Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInputField
            name="billing_period_start"
            label="Billing Period Start"
            type="date"
            icon={<CalendarBlank size={18} />}
            value={billingPeriodStart}
            onChange={(e) => setBillingPeriodStart(e.target.value)}
          />
          <FormInputField
            name="billing_period_end"
            label="Billing Period End"
            type="date"
            icon={<CalendarBlank size={18} />}
            value={billingPeriodEnd}
            onChange={(e) => setBillingPeriodEnd(e.target.value)}
          />
        </div>

        {/* Period Info */}
        {periodDays > 0 && (
          <div className="text-sm text-foreground-secondary">
            Billing period: <span className="font-medium">{periodDays} days</span>
          </div>
        )}

        {/* Due Date */}
        <div>
          <FormInputField
            name="due_date"
            label="Due Date"
            type="date"
            icon={<CalendarBlank size={18} />}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <p className="text-xs text-foreground-tertiary mt-1">Payment due date for the invoice</p>
        </div>

        {/* Preview Section */}
        <div className="border-t border-border-primary pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground-primary mb-4">
            <Sparkle size={18} className="text-warning" />
            Invoice Preview
          </h4>

          {previewLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Calculating invoice..." />
            </div>
          ) : previewError ? (
            <div className="flex items-center gap-2 p-4 bg-error/10 text-error rounded-lg">
              <Warning size={18} />
              <span>{previewError}</span>
            </div>
          ) : preview ? (
            <motion.div variants={fadeInUp} className="space-y-4">
              {/* Pro-rata Notice */}
              {preview.proRataDetails && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 text-warning rounded-lg">
                  <Info size={18} className="mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Pro-rata billing applied</p>
                    <p className="mt-1 text-foreground-secondary">
                      This invoice includes pro-rata adjustments due to mid-period service changes.
                    </p>
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div className="border border-border-primary rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary">
                    <tr>
                      <th className="text-left px-3 py-2 text-foreground-secondary font-medium">
                        Description
                      </th>
                      <th className="text-right px-3 py-2 text-foreground-secondary font-medium">
                        Qty
                      </th>
                      <th className="text-right px-3 py-2 text-foreground-secondary font-medium">
                        Unit Price
                      </th>
                      <th className="text-right px-3 py-2 text-foreground-secondary font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lineItems.map((item, index) => (
                      <tr key={index} className="border-t border-border-primary">
                        <td className="px-3 py-2">
                          <div>
                            <span className="text-foreground-primary">{item.description}</span>
                            {item.pro_rata_days && (
                              <span className="block text-xs text-foreground-tertiary">
                                ({item.pro_rata_days}/{item.pro_rata_total_days} days)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground-secondary">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground-secondary">
                          {formatCurrency(item.unit_price, service.currency)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground-primary">
                          {formatCurrency(item.amount, service.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Subtotal</span>
                    <span className="text-foreground-primary">
                      {formatCurrency(preview.subtotal, service.currency)}
                    </span>
                  </div>
                  {service.tax_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Tax ({service.tax_rate}%)</span>
                      <span className="text-foreground-primary">
                        {formatCurrency(preview.taxAmount, service.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t border-border-primary pt-2">
                    <span className="text-foreground-primary">Total</span>
                    <span className="text-primary-600">
                      {formatCurrency(preview.totalAmount, service.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8 text-foreground-tertiary">
              Select billing period to preview invoice
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Invoice Notes
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-foreground-tertiary">
                <FileText size={18} />
              </div>
              <textarea
                name="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={2}
                className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            <p className="text-xs text-foreground-tertiary mt-1">Notes visible to the stakeholder</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Internal Notes
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-foreground-tertiary">
                <FileText size={18} />
              </div>
              <textarea
                name="internal_notes"
                value={internalNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInternalNotes(e.target.value)}
                rows={2}
                className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            <p className="text-xs text-foreground-tertiary mt-1">Internal notes (not visible to stakeholder)</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
