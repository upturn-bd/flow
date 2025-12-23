"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  MagnifyingGlass,
  FunnelSimple,
  ArrowRight,
  ArrowLeft,
  ArrowsClockwise,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  CurrencyDollar,
  CalendarBlank,
  DotsThree,
  PencilSimple,
  TrashSimple,
  Receipt,
  Eye,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStakeholderServices } from "@/hooks/useStakeholderServices";
import {
  StakeholderService,
  ServiceDirection,
  ServiceStatus,
  ServiceType,
} from "@/lib/types/stakeholder-services";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import ServiceFormModal from "./ServiceFormModal";
import ServiceDetailModal from "./ServiceDetailModal";
import { toast } from "sonner";

interface StakeholderServicesListProps {
  stakeholderId: number;
  stakeholderName: string;
}

const directionFilters = [
  { value: "all", label: "All Directions" },
  { value: "outgoing", label: "Outgoing" },
  { value: "incoming", label: "Incoming" },
];

const typeFilters = [
  { value: "all", label: "All Types" },
  { value: "recurring", label: "Recurring" },
  { value: "one_off", label: "One-off" },
];

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export default function StakeholderServicesList({
  stakeholderId,
  stakeholderName,
}: StakeholderServicesListProps) {
  const { canWrite, canDelete, employeeInfo } = useAuth();
  const { services, loading, error, fetchServices, deleteService, fetchServiceSummary } =
    useStakeholderServices();

  const [summary, setSummary] = useState<{
    total_services: number;
    active_services: number;
    outgoing_services: number;
    incoming_services: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<StakeholderService | null>(null);
  const [viewingService, setViewingService] = useState<StakeholderService | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Load services
  useEffect(() => {
    if (employeeInfo?.company_id) {
      fetchServices({
        stakeholder_id: stakeholderId,
      });
      fetchServiceSummary(stakeholderId).then((data) => {
        if (data) setSummary(data);
      });
    }
  }, [employeeInfo?.company_id, stakeholderId, fetchServices, fetchServiceSummary]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !service.service_name.toLowerCase().includes(search) &&
          !service.description?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Direction filter
      if (directionFilter !== "all" && service.direction !== directionFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && service.service_type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [services, searchTerm, directionFilter, typeFilter, statusFilter]);

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    setDeletingServiceId(serviceId);
    try {
      const success = await deleteService(serviceId);
      if (success) {
        toast.success("Service deleted successfully");
        // Refresh the list
        fetchServices({ stakeholder_id: stakeholderId });
        fetchServiceSummary(stakeholderId).then((data) => {
          if (data) setSummary(data);
        });
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      toast.error("Failed to delete service");
    } finally {
      setDeletingServiceId(null);
      setActiveMenuId(null);
    }
  };

  const handleServiceSaved = () => {
    // Refresh the list
    fetchServices({ stakeholder_id: stakeholderId });
    fetchServiceSummary(stakeholderId).then((data) => {
      if (data) setSummary(data);
    });
    setShowCreateModal(false);
    setEditingService(null);
  };

  const getDirectionIcon = (direction: ServiceDirection) => {
    return direction === "outgoing" ? (
      <ArrowRight size={14} className="text-primary-500" />
    ) : (
      <ArrowLeft size={14} className="text-info" />
    );
  };

  const getTypeIcon = (type: ServiceType) => {
    return type === "recurring" ? (
      <ArrowsClockwise size={14} className="text-foreground-tertiary" />
    ) : (
      <Package size={14} className="text-foreground-tertiary" />
    );
  };

  const getStatusBadge = (status: ServiceStatus) => {
    const configs = {
      active: { variant: "success" as const, icon: CheckCircle },
      paused: { variant: "warning" as const, icon: Pause },
      cancelled: { variant: "error" as const, icon: XCircle },
      completed: { variant: "info" as const, icon: CheckCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} size="xs" icon={<Icon size={12} />}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateTotal = (service: StakeholderService): number => {
    if (!service.line_items) return 0;
    return service.line_items.reduce((sum, item) => sum + item.amount, 0);
  };

  if (loading && services.length === 0) {
    return (
      <LoadingSpinner
        icon={Package}
        text="Loading services..."
        color="blue"
        height="min-h-[300px]"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
            <p className="text-xs text-foreground-tertiary">Total Services</p>
            <p className="text-xl font-bold text-foreground-primary">{summary.total_services}</p>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
            <p className="text-xs text-foreground-tertiary">Active</p>
            <p className="text-xl font-bold text-success">{summary.active_services}</p>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
            <p className="text-xs text-foreground-tertiary flex items-center gap-1">
              <ArrowRight size={12} /> Outgoing
            </p>
            <p className="text-xl font-bold text-primary-600">{summary.outgoing_services}</p>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3 border border-border-primary">
            <p className="text-xs text-foreground-tertiary flex items-center gap-1">
              <ArrowLeft size={12} /> Incoming
            </p>
            <p className="text-xl font-bold text-info">{summary.incoming_services}</p>
          </div>
        </motion.div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-primary-500" />
          <h3 className="text-lg font-semibold text-foreground-primary">Services</h3>
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
              placeholder="Search services..."
              className="pl-9 pr-4 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-50"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters
                ? "border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950"
                : "border-border-primary bg-surface-primary text-foreground-secondary hover:bg-surface-secondary"
            }`}
          >
            <FunnelSimple size={16} />
            Filters
          </button>

          {/* Add Service Button */}
          {canWrite("stakeholders") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Add Service
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
            className="flex flex-wrap gap-3 p-3 bg-surface-secondary rounded-lg border border-border-primary"
          >
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
            >
              {directionFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
            >
              {typeFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
            >
              {statusFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {(directionFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setDirectionFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={Package}
          title={services.length === 0 ? "No Services" : "No Matching Services"}
          description={
            services.length === 0
              ? "Add services to track billing with this stakeholder"
              : "Try adjusting your search or filters"
          }
          action={
            services.length === 0 && canWrite("stakeholders")
              ? {
                  label: "Add Service",
                  onClick: () => setShowCreateModal(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="bg-surface-primary rounded-lg border border-border-primary p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Service Name & Status */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h4 className="font-semibold text-foreground-primary truncate">
                      {service.service_name}
                    </h4>
                    {getStatusBadge(service.status)}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                    <span className="inline-flex items-center gap-1">
                      {getDirectionIcon(service.direction)}
                      {service.direction === "outgoing" ? "Outgoing" : "Incoming"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {getTypeIcon(service.service_type)}
                      {service.service_type === "recurring" ? "Recurring" : "One-off"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarBlank size={14} />
                      {formatDate(service.start_date)}
                      {service.end_date && ` - ${formatDate(service.end_date)}`}
                    </span>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-foreground-tertiary mt-2 line-clamp-1">
                      {service.description}
                    </p>
                  )}

                  {/* Amount */}
                  <div className="flex items-center gap-2 mt-3">
                    <CurrencyDollar size={16} className="text-foreground-tertiary" />
                    <span className="text-lg font-bold text-foreground-primary">
                      {formatCurrency(calculateTotal(service), service.currency)}
                    </span>
                    {service.service_type === "recurring" && (
                      <span className="text-xs text-foreground-tertiary">
                        / {service.billing_cycle_type}
                      </span>
                    )}
                    {service.tax_rate > 0 && (
                      <span className="text-xs text-foreground-tertiary">
                        +{service.tax_rate}% tax
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === service.id ? null : service.id!)}
                    className="p-2 text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-secondary rounded-lg transition-colors"
                  >
                    <DotsThree size={20} weight="bold" />
                  </button>

                  {/* Action Menu */}
                  <AnimatePresence>
                    {activeMenuId === service.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-surface-primary border border-border-primary rounded-lg shadow-lg z-10 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setViewingService(service);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-primary hover:bg-surface-secondary transition-colors"
                        >
                          <Eye size={16} />
                          View Details
                        </button>

                        {service.direction === "outgoing" && (
                          <button
                            onClick={() => {
                              // TODO: Navigate to invoice generation
                              toast.info("Invoice generation coming soon");
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-primary hover:bg-surface-secondary transition-colors"
                          >
                            <Receipt size={16} />
                            Generate Invoice
                          </button>
                        )}

                        {canWrite("stakeholders") && (
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground-primary hover:bg-surface-secondary transition-colors"
                          >
                            <PencilSimple size={16} />
                            Edit
                          </button>
                        )}

                        {canDelete("stakeholders") && (
                          <button
                            onClick={() => handleDeleteService(service.id!)}
                            disabled={deletingServiceId === service.id}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                          >
                            <TrashSimple size={16} />
                            {deletingServiceId === service.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setActiveMenuId(null)} />
      )}

      {/* Modals */}
      <ServiceFormModal
        isOpen={showCreateModal || !!editingService}
        onClose={() => {
          setShowCreateModal(false);
          setEditingService(null);
        }}
        stakeholderId={stakeholderId}
        stakeholderName={stakeholderName}
        existingService={editingService || undefined}
        onSuccess={handleServiceSaved}
      />

      {viewingService && (
        <ServiceDetailModal
          isOpen={!!viewingService}
          onClose={() => setViewingService(null)}
          service={viewingService}
          onEdit={() => {
            setEditingService(viewingService);
            setViewingService(null);
          }}
        />
      )}
    </div>
  );
}
