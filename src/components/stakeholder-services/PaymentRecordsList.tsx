"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Money,
  MagnifyingGlass,
  FunnelSimple,
  CalendarBlank,
  CurrencyDollar,
  DotsThree,
  Eye,
  CheckCircle,
  Clock,
  Warning,
  XCircle,
  ArrowLeft,
  Plus,
  Receipt,
  Buildings,
  Hash,
  Pencil,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import { useServicePayments } from "@/hooks/useServicePayments";
import { useStakeholderServices } from "@/hooks/useStakeholderServices";
import {
  StakeholderServicePayment,
  StakeholderService,
  ServicePaymentStatus,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import PaymentFormModal from "./PaymentFormModal";
import PaymentDetailModal from "./PaymentDetailModal";
import { toast } from "sonner";

interface PaymentRecordsListProps {
  stakeholderId?: number;
  serviceId?: number;
  stakeholderName?: string;
  showServiceColumn?: boolean;
  direction?: "incoming" | "all"; // Filter by service direction
}

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 10;

export default function PaymentRecordsList({
  stakeholderId,
  serviceId,
  stakeholderName,
  showServiceColumn = true,
  direction = "incoming",
}: PaymentRecordsListProps) {
  const { canWrite, canApprove, employeeInfo } = useAuth();
  const { payments, loading, fetchPayments, updatePaymentStatus } = useServicePayments();
  const { services, fetchServices } = useStakeholderServices();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Summary state
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  // Modals
  const [viewingPayment, setViewingPayment] = useState<StakeholderServicePayment | null>(null);
  const [creatingForService, setCreatingForService] = useState<StakeholderService | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Load services for the stakeholder
  useEffect(() => {
    if (stakeholderId && employeeInfo?.company_id) {
      fetchServices({
        stakeholder_id: stakeholderId,
        direction: direction === "all" ? undefined : direction,
        status: "active",
      });
    }
  }, [stakeholderId, employeeInfo?.company_id, direction, fetchServices]);

  // Load payments
  const loadPayments = useCallback(async () => {
    if (!employeeInfo?.company_id) return;

    const result = await fetchPayments({
      stakeholder_id: stakeholderId,
      service_id: serviceId,
      status: statusFilter !== "all" ? (statusFilter as ServicePaymentStatus) : undefined,
      from_date: dateFrom || undefined,
      to_date: dateTo || undefined,
      page: currentPage,
      page_size: PAGE_SIZE,
    });

    // Update pagination state
    if (result) {
      setTotalCount(result.total_count);
      setTotalPages(result.total_pages);
    }

    // Calculate summary from results
    if (result?.payments) {
      const total = result.payments.reduce((sum, p) => sum + p.total_amount, 0);
      const pending = result.payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.total_amount, 0);
      const paid = result.payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.total_amount, 0);

      setSummary({
        totalPayments: result.total_count,
        totalAmount: total,
        pendingAmount: pending,
        paidAmount: paid,
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
    fetchPayments,
  ]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Filter by search locally
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const search = searchTerm.toLowerCase();
    return payments.filter(
      (p) =>
        p.reference_number?.toLowerCase().includes(search) ||
        p.service?.service_name?.toLowerCase().includes(search)
    );
  }, [payments, searchTerm]);

  // Handle mark as paid
  const handleMarkPaid = async (payment: StakeholderServicePayment) => {
    const success = await updatePaymentStatus(Number(payment.id), "paid", new Date().toISOString().split("T")[0]);
    if (success) {
      toast.success("Payment marked as paid");
      loadPayments();
    } else {
      toast.error("Failed to update payment");
    }
    setActiveMenuId(null);
  };

  // Handle cancel payment
  const handleCancelPayment = async (payment: StakeholderServicePayment) => {
    if (!confirm("Are you sure you want to cancel this payment?")) return;

    const success = await updatePaymentStatus(Number(payment.id), "cancelled");
    if (success) {
      toast.success("Payment cancelled");
      loadPayments();
    } else {
      toast.error("Failed to cancel payment");
    }
    setActiveMenuId(null);
  };

  // Get status badge
  const getStatusBadge = (status: ServicePaymentStatus) => {
    const configs: Record<ServicePaymentStatus, { variant: "default" | "info" | "success" | "warning" | "error"; icon: typeof Money }> = {
      pending: { variant: "warning", icon: Clock },
      paid: { variant: "success", icon: CheckCircle },
      cancelled: { variant: "error", icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} size="xs" icon={<Icon size={12} />}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Handle create new payment record
  const handleCreateNew = () => {
    if (serviceId) {
      // If service is already specified, find it and open form
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setCreatingForService(service);
      }
    } else {
      // Show service picker
      setShowServicePicker(true);
    }
  };

  // Get incoming services only
  const incomingServices = useMemo(() => {
    return services.filter((s) => s.direction === "incoming" && s.status === "active");
  }, [services]);

  if (loading && payments.length === 0) {
    return (
      <LoadingSpinner
        icon={Money}
        text="Loading payment records..."
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
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Total Records</p>
          <p className="text-xl font-bold text-foreground-primary">{summary.totalPayments}</p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Total Amount</p>
          <p className="text-xl font-bold text-primary-600">
            {formatCurrency(summary.totalAmount, "USD")}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Pending</p>
          <p className="text-xl font-bold text-warning">
            {formatCurrency(summary.pendingAmount, "USD")}
          </p>
        </div>
        <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
          <p className="text-xs text-foreground-tertiary">Paid</p>
          <p className="text-xl font-bold text-success">
            {formatCurrency(summary.paidAmount, "USD")}
          </p>
        </div>
      </motion.div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Money size={20} className="text-primary-500" />
          <h3 className="text-lg font-semibold text-foreground-primary">
            Payment Records
            <span className="text-sm font-normal text-foreground-tertiary ml-2">
              (Incoming Services)
            </span>
          </h3>
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
              placeholder="Search payments..."
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

          {/* Record Payment Button */}
          {canWrite("stakeholders") && stakeholderId && incomingServices.length > 0 && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Record Payment
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

      {/* Payments Table */}
      {filteredPayments.length > 0 ? (
        <>
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Billing Period
                    </th>
                    {showServiceColumn && (
                      <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                        Service
                      </th>
                    )}
                    <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Reference
                    </th>
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-border-primary hover:bg-surface-secondary transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-foreground-primary">
                          {formatDate(payment.billing_period_start)} - {formatDate(payment.billing_period_end)}
                        </span>
                        {payment.payment_date && (
                          <span className="block text-xs text-foreground-tertiary">
                            Paid: {formatDate(payment.payment_date)}
                          </span>
                        )}
                      </td>
                      {showServiceColumn && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ArrowLeft size={14} className="text-info" />
                            <span className="text-foreground-secondary">
                              {payment.service?.service_name || "Unknown"}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-foreground-primary">
                          {formatCurrency(payment.total_amount, payment.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground-secondary font-mono text-xs">
                          {payment.reference_number || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === payment.id ? null : (payment.id ?? null))
                            }
                            className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
                          >
                            <DotsThree size={20} className="text-foreground-secondary" />
                          </button>

                          {activeMenuId === payment.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-primary border border-border-primary rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => {
                                  setViewingPayment(payment);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                              >
                                <Eye size={16} />
                                View Details
                              </button>

                              {payment.status === "pending" && canWrite("stakeholders") && (
                                <>
                                  <button
                                    onClick={() => handleMarkPaid(payment)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success hover:bg-success/10"
                                  >
                                    <CheckCircle size={16} />
                                    Mark as Paid
                                  </button>
                                  <button
                                    onClick={() => handleCancelPayment(payment)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
                                  >
                                    <XCircle size={16} />
                                    Cancel
                                  </button>
                                </>
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
          icon={Money}
          title="No payment records found"
          description={
            searchTerm || statusFilter !== "all" || dateFrom || dateTo
              ? "Try adjusting your filters"
              : stakeholderName
                ? `No payment records for ${stakeholderName} yet`
                : "No payment records have been created yet"
          }
          action={
            canWrite("stakeholders") && stakeholderId && incomingServices.length > 0
              ? {
                  label: "Record Payment",
                  onClick: handleCreateNew,
                  icon: <Plus size={18} />,
                }
              : undefined
          }
        />
      )}

      {/* No Incoming Services Warning */}
      {stakeholderId && incomingServices.length === 0 && !loading && (
        <div className="flex items-center gap-2 p-4 bg-warning/10 text-warning rounded-lg">
          <Warning size={18} />
          <span className="text-sm">
            No active incoming services found for this stakeholder. Payment records are for incoming
            services only.
          </span>
        </div>
      )}

      {/* Service Picker Modal */}
      {showServicePicker && (
        <ServicePickerModal
          isOpen={showServicePicker}
          onClose={() => setShowServicePicker(false)}
          services={incomingServices}
          onSelect={(service) => {
            setShowServicePicker(false);
            setCreatingForService(service);
          }}
        />
      )}

      {/* Payment Form Modal */}
      {creatingForService && (
        <PaymentFormModal
          isOpen={!!creatingForService}
          onClose={() => setCreatingForService(null)}
          service={creatingForService}
          onSuccess={() => {
            setCreatingForService(null);
            loadPayments();
          }}
        />
      )}

      {/* Payment Detail Modal */}
      {viewingPayment && (
        <PaymentDetailModal
          isOpen={!!viewingPayment}
          onClose={() => setViewingPayment(null)}
          payment={viewingPayment}
          onStatusChanged={loadPayments}
        />
      )}

      {/* Click outside to close menu */}
      {activeMenuId && (
        <div className="fixed inset-0 z-5" onClick={() => setActiveMenuId(null)} />
      )}
    </div>
  );
}

// Service Picker Modal Component for Payments
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
            Choose an incoming service to record payment for
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
                <ArrowLeft size={18} className="text-info" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground-primary truncate">
                    {service.service_name}
                  </p>
                  <p className="text-xs text-foreground-tertiary">
                    {service.service_type} • Incoming
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
              No incoming services found
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
