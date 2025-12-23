"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Package,
  ArrowRight,
  ArrowLeft,
  ArrowsClockwise,
  Clock,
  CheckCircle,
  Pause,
  CurrencyDollar,
  CalendarBlank,
  MagnifyingGlass,
  FunnelSimple,
  Pulse,
  Receipt
} from "@phosphor-icons/react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

// Types for public service view
interface PublicServiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PublicService {
  id: number;
  service_name: string;
  description?: string;
  direction: 'outgoing' | 'incoming';
  service_type: 'recurring' | 'one_off';
  currency: string;
  status: string;
  start_date: string;
  end_date?: string;
  billing_cycle_type?: string;
  next_billing_date?: string;
  line_items: PublicServiceLineItem[];
}

interface PublicStakeholderServicesProps {
  services: PublicService[];
  loading?: boolean;
  stakeholderName: string;
  onViewInvoices?: (serviceId: number) => void;
}

interface ServiceSummary {
  totalServices: number;
  activeServices: number;
  outgoingServices: number;
  incomingServices: number;
  monthlyValue: number;
}

export default function PublicStakeholderServices({ 
  services: allServices,
  loading = false,
  stakeholderName,
  onViewInvoices
}: PublicStakeholderServicesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'recurring' | 'one_off'>('all');
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Get the most common currency
  const displayCurrency = useMemo(() => {
    if (allServices.length === 0) return 'BDT';
    
    const currencyCount = allServices.reduce((acc, s) => {
      const currency = s.currency || 'BDT';
      acc[currency] = (acc[currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'BDT';
  }, [allServices]);

  // Calculate summary
  const summary: ServiceSummary = useMemo(() => {
    const activeServices = allServices.filter(s => s.status === 'active');
    const monthlyValue = activeServices.reduce((sum, s) => {
      const lineTotal = s.line_items.reduce((lt, item) => lt + (item.amount || 0), 0);
      // For recurring, estimate monthly; for one-off, count as is
      if (s.service_type === 'recurring') {
        if (s.billing_cycle_type === 'monthly') return sum + lineTotal;
        if (s.billing_cycle_type === 'weekly') return sum + (lineTotal * 4);
        if (s.billing_cycle_type === 'yearly') return sum + (lineTotal / 12);
      }
      return sum;
    }, 0);

    return {
      totalServices: allServices.length,
      activeServices: activeServices.length,
      outgoingServices: allServices.filter(s => s.direction === 'outgoing').length,
      incomingServices: allServices.filter(s => s.direction === 'incoming').length,
      monthlyValue
    };
  }, [allServices]);

  // Filter services
  const filteredServices = useMemo(() => {
    return allServices.filter(service => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = service.service_name.toLowerCase().includes(term);
        const matchesDesc = service.description?.toLowerCase().includes(term);
        if (!matchesName && !matchesDesc) return false;
      }

      // Direction filter
      if (directionFilter !== 'all' && service.direction !== directionFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && service.service_type !== typeFilter) return false;

      return true;
    });
  }, [allServices, searchTerm, directionFilter, typeFilter]);

  // Paginate
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage]);

  const totalPages = Math.ceil(filteredServices.length / pageSize);

  // Helper functions
  const getDirectionInfo = (direction: 'outgoing' | 'incoming') => {
    return direction === 'outgoing' 
      ? { icon: <ArrowRight size={14} />, label: 'Outgoing', color: 'text-primary-500' }
      : { icon: <ArrowLeft size={14} />, label: 'Incoming', color: 'text-info' };
  };

  const getTypeInfo = (type: 'recurring' | 'one_off') => {
    return type === 'recurring'
      ? { icon: <ArrowsClockwise size={14} />, label: 'Recurring' }
      : { icon: <Package size={14} />, label: 'One-time' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" icon={<CheckCircle size={12} />}>Active</Badge>;
      case 'paused':
        return <Badge variant="warning" icon={<Pause size={12} />}>Paused</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getBillingCycleLabel = (service: PublicService) => {
    if (service.service_type === 'one_off') return 'One-time';
    
    switch (service.billing_cycle_type) {
      case 'monthly': return 'Monthly';
      case 'weekly': return 'Weekly';
      case 'yearly': return 'Yearly';
      case 'x_days': return 'Custom interval';
      default: return service.billing_cycle_type || 'N/A';
    }
  };

  const calculateTotal = (lineItems: PublicServiceLineItem[]) => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading services..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div 
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className="text-foreground-tertiary" />
            <span className="text-sm text-foreground-secondary">Total Services</span>
          </div>
          <p className="text-2xl font-bold text-foreground-primary">{summary.totalServices}</p>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pulse size={18} className="text-success" />
            <span className="text-sm text-foreground-secondary">Active</span>
          </div>
          <p className="text-2xl font-bold text-success">{summary.activeServices}</p>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={18} className="text-primary-500" />
            <span className="text-sm text-foreground-secondary">Services Received</span>
          </div>
          <p className="text-2xl font-bold text-foreground-primary">{summary.outgoingServices}</p>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeft size={18} className="text-info" />
            <span className="text-sm text-foreground-secondary">Services Provided</span>
          </div>
          <p className="text-2xl font-bold text-foreground-primary">{summary.incomingServices}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
          >
            <option value="all">All Directions</option>
            <option value="outgoing">Services Received</option>
            <option value="incoming">Services Provided</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
          >
            <option value="all">All Types</option>
            <option value="recurring">Recurring</option>
            <option value="one_off">One-time</option>
          </select>
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title="No services found"
          description={searchTerm || directionFilter !== 'all' || typeFilter !== 'all' 
            ? "Try adjusting your filters"
            : "You don't have any services yet"}
        />
      ) : (
        <div className="space-y-4">
          {paginatedServices.map((service, index) => {
            const directionInfo = getDirectionInfo(service.direction);
            const typeInfo = getTypeInfo(service.service_type);
            const total = calculateTotal(service.line_items);
            const isExpanded = expandedServiceId === service.id;

            return (
              <motion.div
                key={service.id}
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.05 }}
                className="bg-surface-primary border border-border-primary rounded-lg overflow-hidden"
              >
                {/* Service Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-surface-secondary transition-colors"
                  onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={directionInfo.color}>{directionInfo.icon}</span>
                        <h3 className="font-semibold text-foreground-primary truncate">
                          {service.service_name}
                        </h3>
                        {getStatusBadge(service.status)}
                      </div>
                      
                      {service.description && (
                        <p className="text-sm text-foreground-secondary line-clamp-1 mb-2">
                          {service.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-tertiary">
                        <span className="flex items-center gap-1">
                          {typeInfo.icon}
                          {typeInfo.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarBlank size={12} />
                          {getBillingCycleLabel(service)}
                        </span>
                        {service.next_billing_date && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Next: {formatDate(service.next_billing_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground-primary">
                        {formatCurrency(total, service.currency)}
                      </p>
                      <p className="text-xs text-foreground-tertiary">
                        {service.service_type === 'recurring' ? `per ${service.billing_cycle_type?.replace('_', ' ')}` : 'one-time'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border-primary"
                  >
                    <div className="p-4 space-y-4 bg-surface-secondary/50">
                      {/* Service Period */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-foreground-tertiary">Start Date:</span>
                          <span className="ml-2 text-foreground-primary font-medium">
                            {formatDate(service.start_date)}
                          </span>
                        </div>
                        {service.end_date && (
                          <div>
                            <span className="text-foreground-tertiary">End Date:</span>
                            <span className="ml-2 text-foreground-primary font-medium">
                              {formatDate(service.end_date)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Line Items */}
                      {service.line_items.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground-secondary mb-2">Line Items</h4>
                          <div className="bg-surface-primary rounded-lg border border-border-primary overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-surface-secondary">
                                <tr>
                                  <th className="text-left px-3 py-2 text-foreground-secondary font-medium">Description</th>
                                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Qty</th>
                                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Unit Price</th>
                                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {service.line_items.map((item) => (
                                  <tr key={item.id} className="border-t border-border-primary">
                                    <td className="px-3 py-2 text-foreground-primary">{item.description}</td>
                                    <td className="px-3 py-2 text-right text-foreground-secondary">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right text-foreground-secondary">
                                      {formatCurrency(item.unit_price, service.currency)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-foreground-primary">
                                      {formatCurrency(item.amount, service.currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-surface-secondary">
                                <tr>
                                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-foreground-primary">
                                    Total
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-foreground-primary">
                                    {formatCurrency(total, service.currency)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* View Invoices Button (for outgoing services) */}
                      {service.direction === 'outgoing' && onViewInvoices && (
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewInvoices(service.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            <Receipt size={16} />
                            View Invoices
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={filteredServices.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
