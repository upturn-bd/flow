"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Receipt,
  Calendar,
  Clock,
  CheckCircle,
  Warning,
  Eye,
  Download,
  MagnifyingGlass,
  CurrencyDollar,
  ArrowLeft
} from "@phosphor-icons/react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import BaseModal from "@/components/ui/modals/BaseModal";

// Types for public invoice view
interface PublicInvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PublicInvoiceService {
  id: number;
  service_name: string;
  direction: string;
}

interface PublicInvoice {
  id: number;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date?: string;
  status: string;
  paid_amount: number;
  paid_date?: string;
  notes?: string;
  pdf_url?: string;
  service?: PublicInvoiceService;
  line_items: PublicInvoiceLineItem[];
}

interface PublicStakeholderInvoicesProps {
  invoices: PublicInvoice[];
  loading?: boolean;
  stakeholderName: string;
  serviceId?: number;
  onBack?: () => void;
}

interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueCount: number;
}

export default function PublicStakeholderInvoices({ 
  invoices: allInvoices,
  loading = false,
  stakeholderName,
  serviceId,
  onBack
}: PublicStakeholderInvoicesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingInvoice, setViewingInvoice] = useState<PublicInvoice | null>(null);
  const pageSize = 10;

  // Get the most common currency
  const displayCurrency = useMemo(() => {
    if (allInvoices.length === 0) return 'BDT';
    
    const currencyCount = allInvoices.reduce((acc, inv) => {
      const currency = inv.currency || 'BDT';
      acc[currency] = (acc[currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'BDT';
  }, [allInvoices]);

  // Calculate summary
  const summary: InvoiceSummary = useMemo(() => {
    return allInvoices.reduce((acc, inv) => {
      acc.totalInvoices += 1;
      acc.totalAmount += inv.total_amount;
      acc.paidAmount += inv.paid_amount;
      
      if (inv.status === 'overdue') {
        acc.overdueCount += 1;
        acc.pendingAmount += (inv.total_amount - inv.paid_amount);
      } else if (inv.status !== 'paid') {
        acc.pendingAmount += (inv.total_amount - inv.paid_amount);
      }
      
      return acc;
    }, {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueCount: 0
    } as InvoiceSummary);
  }, [allInvoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNumber = invoice.invoice_number.toLowerCase().includes(term);
        const matchesService = invoice.service?.service_name.toLowerCase().includes(term);
        if (!matchesNumber && !matchesService) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid' && invoice.status !== 'paid') return false;
        if (statusFilter === 'pending' && invoice.status === 'paid') return false;
        if (statusFilter === 'overdue' && invoice.status !== 'overdue') return false;
      }

      return true;
    });
  }, [allInvoices, searchTerm, statusFilter]);

  // Paginate
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" icon={<CheckCircle size={12} />}>Paid</Badge>;
      case 'sent':
      case 'viewed':
        return <Badge variant="info" icon={<Clock size={12} />}>Pending</Badge>;
      case 'partially_paid':
        return <Badge variant="warning" icon={<CurrencyDollar size={12} />}>Partial</Badge>;
      case 'overdue':
        return <Badge variant="error" icon={<Warning size={12} />}>Overdue</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const isOverdue = (invoice: PublicInvoice) => {
    if (invoice.status === 'paid') return false;
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading invoices..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button if viewing specific service invoices */}
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Services
        </Button>
      )}

      {/* Summary Cards */}
      <motion.div 
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={18} className="text-foreground-tertiary" />
            <span className="text-sm text-foreground-secondary">Total Invoices</span>
          </div>
          <p className="text-2xl font-bold text-foreground-primary">{summary.totalInvoices}</p>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollar size={18} className="text-foreground-tertiary" />
            <span className="text-sm text-foreground-secondary">Total Amount</span>
          </div>
          <p className="text-2xl font-bold text-foreground-primary">
            {formatCurrency(summary.totalAmount, displayCurrency)}
          </p>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-success" />
            <span className="text-sm text-foreground-secondary">Paid</span>
          </div>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(summary.paidAmount, displayCurrency)}
          </p>
        </div>

        <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className={summary.overdueCount > 0 ? 'text-error' : 'text-warning'} />
            <span className="text-sm text-foreground-secondary">
              {summary.overdueCount > 0 ? `Outstanding (${summary.overdueCount} overdue)` : 'Outstanding'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${summary.overdueCount > 0 ? 'text-error' : 'text-warning'}`}>
            {formatCurrency(summary.pendingAmount, displayCurrency)}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
          <input
            type="text"
            placeholder="Search by invoice number or service..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-sm border border-border-primary rounded-lg bg-surface-primary text-foreground-primary"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title="No invoices found"
          description={searchTerm || statusFilter !== 'all'
            ? "Try adjusting your filters"
            : "You don't have any invoices yet"}
        />
      ) : (
        <div className="bg-surface-primary border border-border-primary rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">Invoice</th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium hidden sm:table-cell">Service</th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium hidden md:table-cell">Period</th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">Due Date</th>
                  <th className="text-right px-4 py-3 text-foreground-secondary font-medium">Amount</th>
                  <th className="text-center px-4 py-3 text-foreground-secondary font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-foreground-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: index * 0.03 }}
                    className={`border-t border-border-primary hover:bg-surface-secondary/50 ${
                      isOverdue(invoice) ? 'bg-error/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground-primary">{invoice.invoice_number}</p>
                        <p className="text-xs text-foreground-tertiary">{formatDate(invoice.invoice_date)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-foreground-secondary">
                      {invoice.service?.service_name || '-'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-foreground-secondary text-xs">
                      {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={isOverdue(invoice) ? 'text-error font-medium' : 'text-foreground-secondary'}>
                        {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-foreground-primary">
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </p>
                      {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                        <p className="text-xs text-success">
                          Paid: {formatCurrency(invoice.paid_amount, invoice.currency)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(isOverdue(invoice) ? 'overdue' : invoice.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingInvoice(invoice)}
                          className="p-2 text-foreground-tertiary hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-foreground-tertiary hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={18} />
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={filteredInvoices.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Invoice Detail Modal */}
      <BaseModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={`Invoice ${viewingInvoice?.invoice_number || ''}`}
        icon={<Receipt size={24} className="text-primary-500" />}
        size="lg"
      >
        {viewingInvoice && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-tertiary">Invoice Date</p>
                <p className="font-medium text-foreground-primary">{formatDate(viewingInvoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-tertiary">Due Date</p>
                <p className={`font-medium ${isOverdue(viewingInvoice) ? 'text-error' : 'text-foreground-primary'}`}>
                  {viewingInvoice.due_date ? formatDate(viewingInvoice.due_date) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground-tertiary">Billing Period</p>
                <p className="font-medium text-foreground-primary">
                  {formatDate(viewingInvoice.billing_period_start)} - {formatDate(viewingInvoice.billing_period_end)}
                </p>
              </div>
              <div>
                <p className="text-sm text-foreground-tertiary">Status</p>
                <div className="mt-1">{getStatusBadge(isOverdue(viewingInvoice) ? 'overdue' : viewingInvoice.status)}</div>
              </div>
            </div>

            {/* Service Info */}
            {viewingInvoice.service && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-sm text-foreground-tertiary">Service</p>
                <p className="font-medium text-foreground-primary">{viewingInvoice.service.service_name}</p>
              </div>
            )}

            {/* Line Items */}
            {viewingInvoice.line_items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground-secondary mb-3">Line Items</h4>
                <div className="border border-border-primary rounded-lg overflow-hidden">
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
                      {viewingInvoice.line_items.map((item) => (
                        <tr key={item.id} className="border-t border-border-primary">
                          <td className="px-3 py-2 text-foreground-primary">{item.description}</td>
                          <td className="px-3 py-2 text-right text-foreground-secondary">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-foreground-secondary">
                            {formatCurrency(item.unit_price, viewingInvoice.currency)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-foreground-primary">
                            {formatCurrency(item.amount, viewingInvoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Subtotal</span>
                  <span className="text-foreground-primary">{formatCurrency(viewingInvoice.subtotal, viewingInvoice.currency)}</span>
                </div>
                {viewingInvoice.tax_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Tax ({viewingInvoice.tax_rate}%)</span>
                    <span className="text-foreground-primary">{formatCurrency(viewingInvoice.tax_amount, viewingInvoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-border-primary pt-2">
                  <span className="text-foreground-primary">Total</span>
                  <span className="text-foreground-primary">{formatCurrency(viewingInvoice.total_amount, viewingInvoice.currency)}</span>
                </div>
                {viewingInvoice.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-success">
                      <span>Paid</span>
                      <span>-{formatCurrency(viewingInvoice.paid_amount, viewingInvoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span className={viewingInvoice.total_amount - viewingInvoice.paid_amount > 0 ? 'text-warning' : 'text-success'}>
                        Balance Due
                      </span>
                      <span className={viewingInvoice.total_amount - viewingInvoice.paid_amount > 0 ? 'text-warning' : 'text-success'}>
                        {formatCurrency(viewingInvoice.total_amount - viewingInvoice.paid_amount, viewingInvoice.currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {viewingInvoice.notes && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-sm text-foreground-tertiary mb-1">Notes</p>
                <p className="text-sm text-foreground-primary whitespace-pre-wrap">{viewingInvoice.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
              {viewingInvoice.pdf_url && (
                <a
                  href={viewingInvoice.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Download size={18} />
                  Download PDF
                </a>
              )}
              <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}
