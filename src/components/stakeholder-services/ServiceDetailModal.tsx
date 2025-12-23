"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  ArrowRight,
  ArrowLeft,
  ArrowsClockwise,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  CurrencyDollar,
  CalendarBlank,
  PencilSimple,
  Percent,
  ListBullets,
  FileText,
  Receipt,
  Info,
  ClockCounterClockwise,
  CaretDown,
  CaretUp,
  Money,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  StakeholderService,
  StakeholderServiceLineItem,
  ServiceDirection,
  ServiceStatus,
  ServiceType,
  BillingCycleType,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import InvoiceGenerationForm from "./InvoiceGenerationForm";
import InvoicesList from "./InvoicesList";
import PaymentRecordsList from "./PaymentRecordsList";
import PaymentFormModal from "./PaymentFormModal";
import { toast } from "sonner";

interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: StakeholderService;
  onEdit?: () => void;
}

export default function ServiceDetailModal({
  isOpen,
  onClose,
  service,
  onEdit,
}: ServiceDetailModalProps) {
  const { canWrite } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "invoices" | "payments">("details");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Reset tab when service changes or modal closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
    }
  }, [isOpen, service.id]);

  const getDirectionIcon = (direction: ServiceDirection) => {
    return direction === "outgoing" ? (
      <ArrowRight size={18} className="text-primary-500" />
    ) : (
      <ArrowLeft size={18} className="text-info" />
    );
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const configs = {
      active: { variant: "success" as const, icon: CheckCircle, label: "Active" },
      paused: { variant: "warning" as const, icon: Pause, label: "Paused" },
      cancelled: { variant: "error" as const, icon: XCircle, label: "Cancelled" },
      completed: { variant: "info" as const, icon: CheckCircle, label: "Completed" },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} icon={<Icon size={14} />}>
        {config.label}
      </Badge>
    );
  };

  const getBillingCycleDescription = (): string => {
    if (service.service_type !== "recurring") return "One-off service";

    switch (service.billing_cycle_type) {
      case "monthly":
        return `Monthly on day ${service.billing_day_of_month}`;
      case "weekly":
        const day = DAYS_OF_WEEK.find((d) => d.value === service.billing_day_of_week);
        return `Weekly on ${day?.label || ""}`;
      case "yearly":
        const month = MONTHS_OF_YEAR.find((m) => m.value === service.billing_month_of_year);
        return `Yearly on ${month?.label || ""} ${service.billing_day_of_month}`;
      case "x_days":
        return `Every ${service.billing_interval_days} days`;
      default:
        return "Custom";
    }
  };

  const calculateSubtotal = (): number => {
    if (!service.line_items) return 0;
    return service.line_items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = (): number => {
    return calculateSubtotal() * (service.tax_rate / 100);
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  const handleGenerateInvoice = () => {
    setShowInvoiceForm(true);
  };

  const handleRecordPayment = () => {
    setShowPaymentForm(true);
  };

  // Tab configuration based on service direction
  const tabs = [
    { id: "details" as const, label: "Details", icon: Package },
    ...(service.direction === "outgoing"
      ? [{ id: "invoices" as const, label: "Invoices", icon: Receipt }]
      : [{ id: "payments" as const, label: "Payments", icon: Money }]),
  ];

  return (
    <>
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Service Details"
      icon={<Package size={24} className="text-primary-500" />}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getDirectionIcon(service.direction)}
              <h3 className="text-lg font-bold text-foreground-primary">{service.service_name}</h3>
            </div>
            {getStatusBadge(service.status)}
          </div>

          <div className="flex gap-2">
            {service.direction === "outgoing" && service.status === "active" && (
              <Button variant="outline" onClick={handleGenerateInvoice}>
                <Receipt size={16} className="mr-2" />
                Generate Invoice
              </Button>
            )}
            {service.direction === "incoming" && service.status === "active" && (
              <Button variant="outline" onClick={handleRecordPayment}>
                <Money size={16} className="mr-2" />
                Record Payment
              </Button>
            )}
            {canWrite("stakeholders") && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <PencilSimple size={16} className="mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-primary">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-foreground-secondary hover:text-foreground-primary"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
        {/* Description */}
        {service.description && (
          <div className="bg-surface-secondary rounded-lg p-4 border border-border-primary">
            <p className="text-sm text-foreground-secondary">{service.description}</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stakeholder */}
          {service.stakeholder && (
            <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
              <FileText size={18} className="text-foreground-tertiary mt-0.5" />
              <div>
                <p className="text-xs text-foreground-tertiary">Stakeholder</p>
                <p className="text-sm font-medium text-foreground-primary">
                  {service.stakeholder.name}
                </p>
              </div>
            </div>
          )}

          {/* Direction */}
          <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
            {service.direction === "outgoing" ? (
              <ArrowRight size={18} className="text-primary-500 mt-0.5" />
            ) : (
              <ArrowLeft size={18} className="text-info mt-0.5" />
            )}
            <div>
              <p className="text-xs text-foreground-tertiary">Direction</p>
              <p className="text-sm font-medium text-foreground-primary">
                {service.direction === "outgoing" ? "Outgoing (We bill them)" : "Incoming (They bill us)"}
              </p>
            </div>
          </div>

          {/* Service Type */}
          <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
            {service.service_type === "recurring" ? (
              <ArrowsClockwise size={18} className="text-foreground-tertiary mt-0.5" />
            ) : (
              <Package size={18} className="text-foreground-tertiary mt-0.5" />
            )}
            <div>
              <p className="text-xs text-foreground-tertiary">Type</p>
              <p className="text-sm font-medium text-foreground-primary">
                {service.service_type === "recurring" ? "Recurring" : "One-off"}
              </p>
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
            <Clock size={18} className="text-foreground-tertiary mt-0.5" />
            <div>
              <p className="text-xs text-foreground-tertiary">Billing Cycle</p>
              <p className="text-sm font-medium text-foreground-primary">
                {getBillingCycleDescription()}
              </p>
            </div>
          </div>

          {/* Start Date */}
          <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
            <CalendarBlank size={18} className="text-foreground-tertiary mt-0.5" />
            <div>
              <p className="text-xs text-foreground-tertiary">Start Date</p>
              <p className="text-sm font-medium text-foreground-primary">
                {formatDate(service.start_date)}
              </p>
            </div>
          </div>

          {/* End Date */}
          <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
            <CalendarBlank size={18} className="text-foreground-tertiary mt-0.5" />
            <div>
              <p className="text-xs text-foreground-tertiary">End Date</p>
              <p className="text-sm font-medium text-foreground-primary">
                {service.end_date ? formatDate(service.end_date) : "Ongoing (No end date)"}
              </p>
            </div>
          </div>

          {/* Next Billing Date */}
          {service.service_type === "recurring" && service.next_billing_date && (
            <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-950 rounded-lg border border-primary-200 dark:border-primary-800">
              <CalendarBlank size={18} className="text-primary-500 mt-0.5" />
              <div>
                <p className="text-xs text-primary-600 dark:text-primary-400">Next Billing Date</p>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {formatDate(service.next_billing_date)}
                </p>
              </div>
            </div>
          )}

          {/* Last Billed Date */}
          {service.last_billed_date && (
            <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg">
              <CalendarBlank size={18} className="text-foreground-tertiary mt-0.5" />
              <div>
                <p className="text-xs text-foreground-tertiary">Last Billed</p>
                <p className="text-sm font-medium text-foreground-primary">
                  {formatDate(service.last_billed_date)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Incoming Service Info */}
        {service.direction === "incoming" && (
          <div className="p-4 bg-info/5 rounded-lg border border-info/30">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-info mt-0.5" />
              <div>
                <p className="text-sm font-medium text-info">Incoming Service</p>
                <p className="text-xs text-info/80 mt-1">
                  Account Category: <span className="font-medium">{service.payment_account_category || "Income"}</span>
                </p>
                <p className="text-xs text-info/80">
                  Auto-create payments: <span className="font-medium">{service.auto_create_payment ? "Yes" : "No"}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ListBullets size={18} className="text-foreground-tertiary" />
            <h4 className="font-semibold text-foreground-primary">Line Items</h4>
          </div>

          {service.line_items && service.line_items.length > 0 ? (
            <div className="border border-border-primary rounded-lg overflow-hidden">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-surface-secondary text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Items */}
              {service.line_items
                .sort((a, b) => a.item_order - b.item_order)
                .map((item, index) => (
                  <div
                    key={item.id || index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-3 border-t border-border-primary"
                  >
                    <div className="sm:col-span-6 text-sm text-foreground-primary">
                      {item.description}
                    </div>
                    <div className="sm:col-span-2 text-sm text-foreground-secondary sm:text-right">
                      <span className="sm:hidden text-xs text-foreground-tertiary">Qty: </span>
                      {item.quantity}
                    </div>
                    <div className="sm:col-span-2 text-sm text-foreground-secondary sm:text-right">
                      <span className="sm:hidden text-xs text-foreground-tertiary">Unit: </span>
                      {formatCurrency(item.unit_price, service.currency)}
                    </div>
                    <div className="sm:col-span-2 text-sm font-medium text-foreground-primary sm:text-right">
                      <span className="sm:hidden text-xs text-foreground-tertiary">Amount: </span>
                      {formatCurrency(item.amount, service.currency)}
                    </div>
                  </div>
                ))}

              {/* Totals */}
              <div className="bg-surface-secondary border-t border-border-primary px-4 py-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground-secondary">Subtotal</span>
                  <span className="text-foreground-primary">
                    {formatCurrency(calculateSubtotal(), service.currency)}
                  </span>
                </div>
                {service.tax_rate > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground-secondary flex items-center gap-1">
                      <Percent size={14} />
                      Tax ({service.tax_rate}%)
                    </span>
                    <span className="text-foreground-primary">
                      {formatCurrency(calculateTax(), service.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-border-primary">
                  <span className="text-foreground-primary">Total</span>
                  <span className="text-foreground-primary">
                    {formatCurrency(calculateTotal(), service.currency)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground-tertiary text-center py-4">No line items</p>
          )}
        </div>

        {/* History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground-primary transition-colors"
        >
          <ClockCounterClockwise size={16} />
          <span>Service History</span>
          {showHistory ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>

        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 bg-surface-secondary rounded-lg border border-border-primary"
          >
            <p className="text-xs text-foreground-tertiary text-center">
              Service history tracking is available. Use the history hook to load change records for pro-rata calculations.
            </p>
          </motion.div>
        )}
            </motion.div>
          )}

          {/* Invoices Tab (for outgoing services) */}
          {activeTab === "invoices" && service.direction === "outgoing" && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InvoicesList
                stakeholderId={service.stakeholder_id}
                serviceId={service.id}
                showServiceColumn={false}
              />
            </motion.div>
          )}

          {/* Payments Tab (for incoming services) */}
          {activeTab === "payments" && service.direction === "incoming" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PaymentRecordsList
                stakeholderId={service.stakeholder_id}
                serviceId={service.id}
                showServiceColumn={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </BaseModal>

    {/* Invoice Generation Modal */}
    {showInvoiceForm && (
      <InvoiceGenerationForm
        isOpen={showInvoiceForm}
        onClose={() => setShowInvoiceForm(false)}
        service={service}
        onSuccess={() => {
          setShowInvoiceForm(false);
          setActiveTab("invoices");
        }}
      />
    )}

    {/* Payment Form Modal */}
    {showPaymentForm && (
      <PaymentFormModal
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        service={service}
        onSuccess={() => {
          setShowPaymentForm(false);
          setActiveTab("payments");
        }}
      />
    )}
    </>
  );
}
