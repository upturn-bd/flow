"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Money,
  CalendarBlank,
  CurrencyDollar,
  Hash,
  FileText,
  ArrowLeft,
  Info,
  Warning,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { useServicePayments } from "@/hooks/useServicePayments";
import {
  StakeholderService,
  StakeholderPaymentLineItem,
  ProRataDetails,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormInputField from "@/components/ui/FormInputField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: StakeholderService;
  onSuccess?: (payment: any) => void;
}

interface PaymentPreview {
  lineItems: StakeholderPaymentLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  proRataDetails: ProRataDetails | null;
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  service,
  onSuccess,
}: PaymentFormModalProps) {
  const { createPayment, loading } = useServicePayments();

  // Form state
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Preview state (calculated from service line items)
  const [preview, setPreview] = useState<PaymentPreview | null>(null);

  // Initialize billing period based on service
  useEffect(() => {
    if (isOpen && service) {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      // Start from service start date or today
      startDate = service.start_date ? new Date(service.start_date) : today;

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

      // Format dates
      setBillingPeriodStart(startDate.toISOString().split("T")[0]);
      setBillingPeriodEnd(endDate.toISOString().split("T")[0]);

      // Clear other fields
      setReferenceNumber("");
      setNotes("");
    }
  }, [isOpen, service]);

  // Calculate preview from service line items
  useEffect(() => {
    if (!billingPeriodStart || !billingPeriodEnd || !service) return;

    // For payment records, we use the service's current line items
    const lineItems = service.line_items || [];

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (service.tax_rate / 100);
    const totalAmount = subtotal + taxAmount;

    setPreview({
      lineItems: lineItems.map((item, index) => ({
        id: undefined,
        payment_id: 0,
        item_order: index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      })),
      subtotal,
      taxAmount,
      totalAmount,
      proRataDetails: null, // Pro-rata could be applied later
    });
  }, [billingPeriodStart, billingPeriodEnd, service]);

  // Form validation
  const isValid = useMemo(() => {
    return billingPeriodStart && billingPeriodEnd && preview;
  }, [billingPeriodStart, billingPeriodEnd, preview]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      const payment = await createPayment({
        service_id: service.id!,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });

      if (payment) {
        toast.success("Payment record created successfully");
        onSuccess?.(payment);
        onClose();
      } else {
        toast.error("Failed to create payment record");
      }
    } catch (err) {
      toast.error("Failed to create payment record");
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
      title="Record Payment"
      size="lg"
    >
      <div className="space-y-6">
        {/* Service Info Banner */}
        <motion.div
          variants={fadeInUp}
          className="p-4 bg-info/10 rounded-lg border border-info/20"
        >
          <div className="flex items-start gap-3">
            <ArrowLeft size={20} className="text-info mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground-primary">{service.service_name}</h3>
              <p className="text-sm text-foreground-secondary mt-1">{service.description}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <Badge variant="info">Incoming Service</Badge>
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

        {/* Info Notice */}
        <div className="flex items-start gap-2 p-3 bg-surface-secondary rounded-lg">
          <Info size={18} className="text-foreground-tertiary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground-secondary">
            Payment records track expected payments from stakeholders for services they provide to
            your company. Once created, these records can be approved and linked to your accounts.
          </p>
        </div>

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

        {/* Preview Section */}
        <div className="border-t border-border-primary pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground-primary mb-4">
            <Sparkle size={18} className="text-warning" />
            Payment Preview
          </h4>

          {preview ? (
            <motion.div variants={fadeInUp} className="space-y-4">
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
                          <span className="text-foreground-primary">{item.description}</span>
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
              Select billing period to preview payment
            </div>
          )}
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Reference Number
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary">
              <Hash size={18} />
            </div>
            <input
              name="reference_number"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Invoice #, PO #, Contract ref"
              className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <p className="text-xs text-foreground-tertiary mt-1">Optional reference for tracking</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Notes
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
          <p className="text-xs text-foreground-tertiary mt-1">Optional notes about this payment record</p>
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
            {loading ? "Creating..." : "Create Payment Record"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
