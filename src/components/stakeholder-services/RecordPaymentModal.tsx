"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  CalendarBlank,
  CurrencyDollar,
  Hash,
  FileText,
  Receipt,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { useServiceInvoices } from "@/hooks/useServiceInvoices";
import { StakeholderServiceInvoice } from "@/lib/types/stakeholder-services";
import { formatCurrency } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormInputField from "@/components/ui/FormInputField";
import { toast } from "sonner";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: StakeholderServiceInvoice;
  onSuccess?: () => void;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: RecordPaymentModalProps) {
  const { recordPayment, loading } = useServiceInvoices();

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");

  // Calculate balance
  const balance = invoice.total_amount - invoice.paid_amount;

  // Quick amount options
  const quickAmounts = useMemo(() => {
    const amounts = [];
    if (balance > 0) {
      amounts.push({ label: "Full Balance", value: balance });
      if (balance > 100) {
        amounts.push({ label: "50%", value: Math.round(balance * 0.5 * 100) / 100 });
        amounts.push({ label: "25%", value: Math.round(balance * 0.25 * 100) / 100 });
      }
    }
    return amounts;
  }, [balance]);

  // Validate form
  const isValid = useMemo(() => {
    const parsedAmount = parseFloat(amount);
    return !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= balance && paymentDate;
  }, [amount, balance, paymentDate]);

  // Get payment status after this payment
  const getResultingStatus = () => {
    const parsedAmount = parseFloat(amount) || 0;
    const newPaid = invoice.paid_amount + parsedAmount;
    if (newPaid >= invoice.total_amount) {
      return "Paid in Full";
    }
    return "Partially Paid";
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid) return;

    const parsedAmount = parseFloat(amount);

    try {
      const success = await recordPayment(
        Number(invoice.id),
        parsedAmount,
        paymentDate,
        reference || undefined
      );

      if (success) {
        toast.success(
          `Payment of ${formatCurrency(parsedAmount, invoice.currency)} recorded successfully`
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error("Failed to record payment");
      }
    } catch (err) {
      toast.error("Failed to record payment");
    }
  };

  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
    { value: "credit_card", label: "Credit Card" },
    { value: "online", label: "Online Payment" },
    { value: "other", label: "Other" },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      size="md"
    >
      <div className="space-y-6">
        {/* Invoice Info Banner */}
        <motion.div
          variants={fadeInUp}
          className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-start gap-3">
            <Receipt size={20} className="text-primary-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground-primary">{invoice.invoice_number}</h3>
              <p className="text-sm text-foreground-secondary mt-1">
                {invoice.service?.service_name}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <span className="text-foreground-tertiary">
                  Total: {formatCurrency(invoice.total_amount, invoice.currency)}
                </span>
                {invoice.paid_amount > 0 && (
                  <span className="text-success">
                    Paid: {formatCurrency(invoice.paid_amount, invoice.currency)}
                  </span>
                )}
                <span className="font-medium text-foreground-primary">
                  Balance: {formatCurrency(balance, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Amount Buttons */}
        {quickAmounts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Quick Amount
            </label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => setAmount(qa.value.toString())}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    parseFloat(amount) === qa.value
                      ? "bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700"
                      : "border-border-primary text-foreground-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {qa.label} ({formatCurrency(qa.value, invoice.currency)})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount Input */}
        <FormInputField
          name="amount"
          label="Payment Amount"
          type="number"
          icon={<CurrencyDollar size={18} />}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          max={balance.toString()}
        />
        <p className="text-xs text-foreground-tertiary -mt-3">
          Maximum: {formatCurrency(balance, invoice.currency)}
        </p>

        {/* Amount Validation */}
        {amount && parseFloat(amount) > balance && (
          <div className="flex items-center gap-2 text-sm text-error">
            <Warning size={14} />
            <span>Amount exceeds balance due</span>
          </div>
        )}

        {/* Payment Date */}
        <FormInputField
          name="payment_date"
          label="Payment Date"
          type="date"
          icon={<CalendarBlank size={18} />}
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
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
              name="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Check #1234, Transfer ID, etc."
              className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <p className="text-xs text-foreground-tertiary mt-1">Optional payment reference for tracking</p>
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
          <p className="text-xs text-foreground-tertiary mt-1">Optional notes about this payment</p>
        </div>

        {/* Result Preview */}
        {amount && isValid && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg"
          >
            <CheckCircle size={18} />
            <span className="text-sm font-medium">
              After this payment: {getResultingStatus()}
            </span>
          </motion.div>
        )}

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
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
