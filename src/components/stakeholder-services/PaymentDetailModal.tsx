"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Money,
  CalendarBlank,
  CurrencyDollar,
  Package,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  ArrowLeft,
  Buildings,
  MapPin,
  Hash,
  Percent,
  Info,
  Copy,
  LinkSimple,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import { useServicePayments } from "@/hooks/useServicePayments";
import {
  StakeholderServicePayment,
  ServicePaymentStatus,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import { toast } from "sonner";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: StakeholderServicePayment;
  onStatusChanged?: () => void;
}

export default function PaymentDetailModal({
  isOpen,
  onClose,
  payment,
  onStatusChanged,
}: PaymentDetailModalProps) {
  const { canWrite, canApprove } = useAuth();
  const { updatePaymentStatus, loading } = useServicePayments();

  const [loadingAction, setLoadingAction] = useState(false);

  // Get status badge config
  const getStatusBadge = (status: ServicePaymentStatus) => {
    const configs: Record<ServicePaymentStatus, { variant: "default" | "info" | "success" | "warning" | "error"; icon: typeof Money }> = {
      pending: { variant: "warning", icon: Clock },
      paid: { variant: "success", icon: CheckCircle },
      cancelled: { variant: "error", icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} icon={<Icon size={14} />}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Handle mark as paid
  const handleMarkPaid = async () => {
    setLoadingAction(true);
    try {
      const success = await updatePaymentStatus(Number(payment.id), "paid", new Date().toISOString().split("T")[0]);
      if (success) {
        toast.success("Payment marked as paid");
        onStatusChanged?.();
        onClose();
      } else {
        toast.error("Failed to update payment");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle cancel payment
  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this payment?")) return;

    setLoadingAction(true);
    try {
      const success = await updatePaymentStatus(Number(payment.id), "cancelled");
      if (success) {
        toast.success("Payment cancelled");
        onStatusChanged?.();
        onClose();
      } else {
        toast.error("Failed to cancel payment");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Copy reference number
  const handleCopyReference = () => {
    if (payment.reference_number) {
      navigator.clipboard.writeText(payment.reference_number);
      toast.success("Reference number copied");
    }
  };

  const stakeholder = payment.stakeholder;
  const service = payment.service;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="lg" title="Payment Record Details">
      <div className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Money size={24} className="text-info" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground-primary">
                  Payment Record
                </h2>
              </div>
              <p className="text-sm text-foreground-secondary">
                Created: {formatDate(payment.created_at!)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(payment.status)}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-secondary">
              <X size={20} className="text-foreground-secondary" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Service & Stakeholder Info */}
            <div className="space-y-4">
              {/* Service Info */}
              <div className="p-4 bg-surface-secondary rounded-lg">
                <h3 className="text-sm font-medium text-foreground-tertiary mb-3 flex items-center gap-2">
                  <Package size={16} />
                  Service
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeft size={16} className="text-info" />
                  <span className="font-medium text-foreground-primary">
                    {service?.service_name || "Unknown Service"}
                  </span>
                </div>
                <p className="text-sm text-foreground-tertiary">
                  Incoming Service (Payment to stakeholder)
                </p>
              </div>

              {/* Stakeholder Info */}
              <div className="p-4 bg-surface-secondary rounded-lg">
                <h3 className="text-sm font-medium text-foreground-tertiary mb-3 flex items-center gap-2">
                  <Buildings size={16} />
                  Pay To
                </h3>
                <p className="font-medium text-foreground-primary">
                  {stakeholder?.name || payment.vendor_snapshot?.name || "Unknown"}
                </p>
                {(stakeholder?.address || payment.vendor_snapshot?.address) && (
                  <p className="text-sm text-foreground-secondary mt-1 flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    {stakeholder?.address || payment.vendor_snapshot?.address}
                  </p>
                )}
              </div>

              {/* Billing Period */}
              <div className="p-4 bg-surface-secondary rounded-lg">
                <h3 className="text-sm font-medium text-foreground-tertiary mb-3 flex items-center gap-2">
                  <CalendarBlank size={16} />
                  Billing Period
                </h3>
                <p className="text-foreground-primary">
                  {formatDate(payment.billing_period_start)} - {formatDate(payment.billing_period_end)}
                </p>
                {payment.payment_date && (
                  <p className="text-sm text-foreground-secondary mt-2">
                    <span className="font-medium">Payment Date:</span> {formatDate(payment.payment_date)}
                  </p>
                )}
              </div>

              {/* Reference Number */}
              {payment.reference_number && (
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <h3 className="text-sm font-medium text-foreground-tertiary mb-3 flex items-center gap-2">
                    <Hash size={16} />
                    Reference Number
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground-primary">
                      {payment.reference_number}
                    </span>
                    <button
                      onClick={handleCopyReference}
                      className="p-1 rounded hover:bg-surface-tertiary"
                      title="Copy reference"
                    >
                      <Copy size={14} className="text-foreground-tertiary" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Amounts */}
            <div className="space-y-4">
              {/* Amount Summary */}
              <div className="p-4 bg-surface-secondary rounded-lg">
                <h3 className="text-sm font-medium text-foreground-tertiary mb-3 flex items-center gap-2">
                  <CurrencyDollar size={16} />
                  Amount Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Subtotal</span>
                    <span className="text-foreground-primary">
                      {formatCurrency(payment.subtotal, payment.currency)}
                    </span>
                  </div>
                  {payment.tax_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary flex items-center gap-1">
                        <Percent size={12} />
                        Tax ({payment.tax_rate}%)
                      </span>
                      <span className="text-foreground-primary">
                        {formatCurrency(payment.tax_amount, payment.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-border-primary pt-2 mt-2">
                    <span className="text-foreground-primary">Total</span>
                    <span className="text-primary-600">
                      {formatCurrency(payment.total_amount, payment.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Account */}
              {payment.account && (
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <h3 className="text-sm font-medium text-foreground-tertiary mb-3 flex items-center gap-2">
                    <LinkSimple size={16} />
                    Linked Account
                  </h3>
                  <p className="font-medium text-foreground-primary">
                    {payment.account.title}
                  </p>
                  <Badge variant="success" size="xs" className="mt-2">
                    {payment.account.status}
                  </Badge>
                </div>
              )}

              {/* Pro-rata Notice */}
              {payment.pro_rata_details && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 text-warning rounded-lg">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Pro-rata calculation applied</p>
                    <p className="text-foreground-secondary mt-1">
                      Adjustments made for mid-period service changes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          {payment.line_items && payment.line_items.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground-tertiary mb-3">Line Items</h3>
              <div className="border border-border-primary rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary">
                    <tr>
                      <th className="text-left px-4 py-2 text-foreground-secondary font-medium">
                        Description
                      </th>
                      <th className="text-right px-4 py-2 text-foreground-secondary font-medium">
                        Qty
                      </th>
                      <th className="text-right px-4 py-2 text-foreground-secondary font-medium">
                        Unit Price
                      </th>
                      <th className="text-right px-4 py-2 text-foreground-secondary font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.line_items.map((item, index) => (
                      <tr key={index} className="border-t border-border-primary">
                        <td className="px-4 py-3">
                          <span className="text-foreground-primary">{item.description}</span>
                          {item.pro_rata_days && (
                            <span className="block text-xs text-foreground-tertiary">
                              ({item.pro_rata_days}/{item.pro_rata_total_days} days)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground-secondary">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground-secondary">
                          {formatCurrency(item.unit_price, payment.currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground-primary">
                          {formatCurrency(item.amount, payment.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div className="p-4 bg-surface-secondary rounded-lg">
              <h3 className="text-sm font-medium text-foreground-tertiary mb-2">Notes</h3>
              <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                {payment.notes}
              </p>
            </div>
          )}

          {/* Status Timeline would go here */}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 p-4 border-t border-border-primary bg-surface-secondary">
          {payment.status === "pending" && canWrite("stakeholders") && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={loadingAction}
              >
                <XCircle size={16} className="mr-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkPaid}
                disabled={loadingAction}
              >
                <CheckCircle size={16} className="mr-2" />
                Mark as Paid
              </Button>
            </>
          )}

          {(payment.status === "paid" || payment.status === "cancelled") && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
