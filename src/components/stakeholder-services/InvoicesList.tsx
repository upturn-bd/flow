"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  MagnifyingGlass,
  FunnelSimple,
  CalendarBlank,
  CurrencyDollar,
  DotsThree,
  Eye,
  PaperPlaneTilt,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  FilePdf,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Plus,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import { useServiceInvoices } from "@/hooks/useServiceInvoices";
import { useStakeholderServices } from "@/hooks/useStakeholderServices";
import {
  StakeholderServiceInvoice,
  StakeholderService,
  ServiceInvoiceStatus,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import InvoiceDetailModal from "./InvoiceDetailModal";
import InvoiceGenerationForm from "./InvoiceGenerationForm";
import RecordPaymentModal from "./RecordPaymentModal";
import { toast } from "sonner";

interface InvoicesListProps {
  stakeholderId?: number;
  serviceId?: number;
  stakeholderName?: string;
  showServiceColumn?: boolean;
  initialStatus?: ServiceInvoiceStatus | "all";
}

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 10;

export default function InvoicesList({
  stakeholderId,
  serviceId,
  stakeholderName,
  showServiceColumn = true,
  initialStatus = "all",
}: InvoicesListProps) {
  const { canWrite, employeeInfo } = useAuth();
  const {
    invoices,
    loading,
    error,
    fetchInvoices,
    sendInvoice,
    updateInvoiceStatus,
  } = useServiceInvoices();
  const { services, fetchServices } = useStakeholderServices();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Summary state
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  });

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState<StakeholderServiceInvoice | null>(null);
  const [generatingForService, setGeneratingForService] = useState<StakeholderService | null>(null);
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<StakeholderServiceInvoice | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Load services for the stakeholder
  useEffect(() => {
    if (stakeholderId && employeeInfo?.company_id) {
      fetchServices({ stakeholder_id: stakeholderId, status: "active" });
    }
  }, [stakeholderId, employeeInfo?.company_id, fetchServices]);

  // Pagination state
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    if (!employeeInfo?.company_id) return;

    const result = await fetchInvoices({
      stakeholder_id: stakeholderId,
      service_id: serviceId,
      status: statusFilter !== "all" ? (statusFilter as ServiceInvoiceStatus) : undefined,
      from_date: dateFrom || undefined,
      to_date: dateTo || undefined,
      page: currentPage,
      page_size: PAGE_SIZE,
    });

    // Set pagination state
    setTotalCount(result.total_count);
    setTotalPages(result.total_pages);

    // Calculate summary from results
    if (result?.invoices) {
      const total = result.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paid = result.invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      const pending = result.invoices
        .filter((inv) => ["sent", "partially_paid"].includes(inv.status))
        .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0);
      const overdue = result.invoices
        .filter((inv) => inv.status === "overdue")
        .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0);

      setSummary({
        totalInvoices: result.total_count,
        totalAmount: total,
        paidAmount: paid,
        pendingAmount: pending,
        overdueAmount: overdue,
      });
    }
  }, [
    employeeInfo?.company_id,
    stakeholderId,
    serviceId,
    statusFilter,
    dateFrom,
    dateTo,
    currentPage,
    fetchInvoices,
  ]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Filter by search locally
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const search = searchTerm.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(search) ||
        inv.service?.service_name?.toLowerCase().includes(search)
    );
  }, [invoices, searchTerm]);

  // Handle send invoice
  const handleSendInvoice = async (invoice: StakeholderServiceInvoice) => {
    if (!invoice.id) return;
    const success = await sendInvoice(invoice.id);
    if (success) {
      toast.success(`Invoice ${invoice.invoice_number} sent successfully`);
      loadInvoices();
    } else {
      toast.error("Failed to send invoice");
    }
    setActiveMenuId(null);
  };

  // Handle void invoice
  const handleVoidInvoice = async (invoice: StakeholderServiceInvoice) => {
    if (!invoice.id) return;
    if (!confirm("Are you sure you want to void this invoice? This action cannot be undone.")) {
      return;
    }

    const success = await updateInvoiceStatus(invoice.id, "cancelled");
    if (success) {
      toast.success(`Invoice ${invoice.invoice_number} voided`);
      loadInvoices();
    } else {
      toast.error("Failed to void invoice");
    }
    setActiveMenuId(null);
  };

  // Get status badge
  const getStatusBadge = (status: ServiceInvoiceStatus) => {
    const configs: Record<ServiceInvoiceStatus, { variant: "default" | "info" | "success" | "warning" | "error"; icon: typeof Receipt }> = {
      draft: { variant: "default", icon: Receipt },
      sent: { variant: "info", icon: PaperPlaneTilt },
      viewed: { variant: "info", icon: Eye },
      paid: { variant: "success", icon: CheckCircle },
      partially_paid: { variant: "warning", icon: Clock },
      overdue: { variant: "error", icon: Warning },
      cancelled: { variant: "error", icon: XCircle },
      void: { variant: "error", icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} size="xs" icon={<Icon size={12} />}>
        {status.replace("_", " ").replace(/^\w/, (c: string) => c.toUpperCase())}
      </Badge>
    );
  };

  // Check if invoice is overdue
  const isOverdue = (invoice: StakeholderServiceInvoice) => {
    if (invoice.status === "paid" || invoice.status === "cancelled") return false;
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
  };

  // Handle generate new invoice
  const handleGenerateNew = () => {
    if (serviceId) {
      // If service is already specified, find it and open form
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setGeneratingForService(service);
      }
    } else {
      // Show service picker
      setShowServicePicker(true);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <LoadingSpinner
        icon={Receipt}
        text="Loading invoices..."
        color="blue"
        height="min-h-[300px]"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      >
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Total Invoices</p>
          <p className="text-xl font-bold text-foreground-primary">{summary.totalInvoices}</p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Total Value</p>
          <p className="text-xl font-bold text-primary-600">
            {formatCurrency(summary.totalAmount, "USD")}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Paid</p>
          <p className="text-xl font-bold text-success">
            {formatCurrency(summary.paidAmount, "USD")}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Pending</p>
          <p className="text-xl font-bold text-info">
            {formatCurrency(summary.pendingAmount, "USD")}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Overdue</p>
          <p className="text-xl font-bold text-error">
            {formatCurrency(summary.overdueAmount, "USD")}
          </p>
        </div>
      </motion.div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={20} className="text-primary-500" />
          <h3 className="text-lg font-semibold text-foreground-primary">Invoices</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices..."
              className="pl-9 pr-4 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-50"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters
                ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800"
                : "border-border-primary text-foreground-secondary hover:bg-surface-secondary"
            }`}
          >
            <FunnelSimple size={16} />
            Filters
          </button>

          {/* Generate Invoice Button */}
          {canWrite("stakeholders") && stakeholderId && (
            <button
              onClick={handleGenerateNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-surface-secondary rounded-lg border border-border-primary">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs text-foreground-tertiary mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
                  >
                    {statusFilters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-xs text-foreground-tertiary mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs text-foreground-tertiary mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setDateFrom("");
                      setDateTo("");
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 text-sm text-foreground-secondary hover:text-foreground-primary"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <>
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Invoice #
                    </th>
                    {showServiceColumn && (
                      <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                        Service
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Period
                    </th>
                    <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Due Date
                    </th>
                    <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={`border-t border-border-primary hover:bg-surface-secondary transition-colors ${
                        isOverdue(invoice) ? "bg-error/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground-primary">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      {showServiceColumn && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {invoice.service?.direction === "outgoing" ? (
                              <ArrowRight size={14} className="text-primary-500" />
                            ) : (
                              <ArrowLeft size={14} className="text-info" />
                            )}
                            <span className="text-foreground-secondary">
                              {invoice.service?.service_name || "Unknown"}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-foreground-secondary">
                        {formatDate(invoice.billing_period_start)} -{" "}
                        {formatDate(invoice.billing_period_end)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <span className="font-semibold text-foreground-primary">
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </span>
                          {invoice.paid_amount > 0 && invoice.status !== "paid" && (
                            <span className="block text-xs text-success">
                              {formatCurrency(invoice.paid_amount, invoice.currency)} paid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isOverdue(invoice) ? "text-error font-medium" : "text-foreground-secondary"
                          }
                        >
                          {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === invoice.id ? null : (invoice.id ?? null))
                            }
                            className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
                          >
                            <DotsThree size={20} className="text-foreground-secondary" />
                          </button>

                          {activeMenuId === invoice.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-primary border border-border-primary rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => {
                                  setViewingInvoice(invoice);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                              >
                                <Eye size={16} />
                                View Details
                              </button>

                              {invoice.status === "draft" && canWrite("stakeholders") && (
                                <button
                                  onClick={() => handleSendInvoice(invoice)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                                >
                                  <PaperPlaneTilt size={16} />
                                  Send Invoice
                                </button>
                              )}

                              {["sent", "partially_paid", "overdue"].includes(invoice.status) &&
                                canWrite("stakeholders") && (
                                  <button
                                    onClick={() => {
                                      setRecordingPaymentFor(invoice);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                                  >
                                    <CreditCard size={16} />
                                    Record Payment
                                  </button>
                                )}

                              <button
                                onClick={() => {
                                  // TODO: Generate PDF
                                  toast.info("PDF generation coming soon");
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                              >
                                <FilePdf size={16} />
                                Download PDF
                              </button>

                              {invoice.status !== "paid" &&
                                invoice.status !== "cancelled" &&
                                canWrite("stakeholders") && (
                                  <button
                                    onClick={() => handleVoidInvoice(invoice)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
                                  >
                                    <XCircle size={16} />
                                    Void Invoice
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description={
            searchTerm || statusFilter !== "all" || dateFrom || dateTo
              ? "Try adjusting your filters"
              : stakeholderName
                ? `No invoices have been created for ${stakeholderName} yet`
                : "No invoices have been created yet"
          }
          action={
            canWrite("stakeholders") && stakeholderId
              ? {
                  label: "Generate Invoice",
                  onClick: handleGenerateNew,
                  icon: <Plus size={18} />,
                }
              : undefined
          }
        />
      )}

      {/* Service Picker Modal */}
      {showServicePicker && (
        <ServicePickerModal
          isOpen={showServicePicker}
          onClose={() => setShowServicePicker(false)}
          services={services.filter((s) => s.status === "active")}
          onSelect={(service) => {
            setShowServicePicker(false);
            setGeneratingForService(service);
          }}
        />
      )}

      {/* Invoice Generation Modal */}
      {generatingForService && (
        <InvoiceGenerationForm
          isOpen={!!generatingForService}
          onClose={() => setGeneratingForService(null)}
          service={generatingForService}
          onSuccess={() => {
            setGeneratingForService(null);
            loadInvoices();
          }}
        />
      )}

      {/* Invoice Detail Modal */}
      {viewingInvoice && viewingInvoice.id && (
        <InvoiceDetailModal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          invoiceId={viewingInvoice.id}
          onPaymentRecorded={loadInvoices}
          onStatusChanged={loadInvoices}
        />
      )}

      {/* Record Payment Modal */}
      {recordingPaymentFor && (
        <RecordPaymentModal
          isOpen={!!recordingPaymentFor}
          onClose={() => setRecordingPaymentFor(null)}
          invoice={recordingPaymentFor}
          onSuccess={() => {
            setRecordingPaymentFor(null);
            loadInvoices();
          }}
        />
      )}

      {/* Click outside to close menu */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setActiveMenuId(null)}
        />
      )}
    </div>
  );
}

// Service Picker Modal Component
interface ServicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: StakeholderService[];
  onSelect: (service: StakeholderService) => void;
}

function ServicePickerModal({ isOpen, onClose, services, onSelect }: ServicePickerModalProps) {
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    if (!search) return services;
    return services.filter((s) =>
      s.service_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [services, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface-primary rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="p-4 border-b border-border-primary">
          <h3 className="text-lg font-semibold text-foreground-primary">Select Service</h3>
          <p className="text-sm text-foreground-secondary mt-1">
            Choose a service to generate an invoice for
          </p>
        </div>

        <div className="p-4 border-b border-border-primary">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors text-left border-b border-border-primary last:border-b-0"
              >
                {service.direction === "outgoing" ? (
                  <ArrowRight size={18} className="text-primary-500" />
                ) : (
                  <ArrowLeft size={18} className="text-info" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground-primary truncate">
                    {service.service_name}
                  </p>
                  <p className="text-xs text-foreground-tertiary">
                    {service.service_type} • {service.billing_cycle_type || "one-time"}
                  </p>
                </div>
                <span className="text-sm font-medium text-foreground-secondary">
                  {formatCurrency(
                    service.line_items?.reduce((sum, item) => sum + item.amount, 0) || 0,
                    service.currency
                  )}
                </span>
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-foreground-tertiary">
              No active services found
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground-primary"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
