"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  CurrencyDollar, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendUp, 
  TrendDown, 
  Wallet, 
  Pulse, 
  MagnifyingGlass, 
  FunnelSimple,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { Account } from "@/lib/types/schemas";
import { formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";
import Pagination from "@/components/ui/Pagination";
import { InlineSpinner } from "@/components/ui";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PublicStakeholderTransactionsProps {
  transactions: Account[];
  loading?: boolean;
  stakeholderName: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
}

export default function PublicStakeholderTransactions({ 
  transactions: allTransactions,
  loading = false,
  stakeholderName 
}: PublicStakeholderTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Complete' | 'Pending'>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [amountFilter, setAmountFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Calculate summary from all transactions
  const summary: TransactionSummary = useMemo(() => {
    const aggregated = allTransactions.reduce<TransactionSummary>(
      (acc, t) => {
        if (t.amount >= 0) {
          acc.totalIncome += t.amount;
        } else {
          acc.totalExpense += Math.abs(t.amount);
        }

        if (t.status === "Pending") {
          acc.pendingTransactions += 1;
        } else if (t.status === "Complete") {
          acc.completedTransactions += 1;
        }

        return acc;
      },
      {
        totalTransactions: allTransactions.length,
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        pendingTransactions: 0,
        completedTransactions: 0,
      }
    );

    return {
      ...aggregated,
      netAmount: aggregated.totalIncome - aggregated.totalExpense,
    };
  }, [allTransactions]);

  // Apply date range filter using useMemo
  const dateFilteredTransactions = useMemo(() => {
    if (dateRangeFilter === 'all') {
      return allTransactions;
    }

    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
    };
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - daysMap[dateRangeFilter]);
    
    return allTransactions.filter(txn => {
      const txnDate = new Date(txn.transaction_date);
      return txnDate >= daysAgo;
    });
  }, [allTransactions, dateRangeFilter]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return dateFilteredTransactions.filter(txn => {
      const matchesSearch = 
        txn.title.toLowerCase().includes(lowerSearchTerm) ||
        txn.from_source.toLowerCase().includes(lowerSearchTerm) ||
        txn.method?.toLowerCase().includes(lowerSearchTerm) ||
        txn.amount.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'All' || txn.status === statusFilter;
      
      const matchesAmount = 
        amountFilter === 'all' ||
        (amountFilter === 'income' && txn.amount >= 0) ||
        (amountFilter === 'expense' && txn.amount < 0);
      
      return matchesSearch && matchesStatus && matchesAmount;
    });
  }, [dateFilteredTransactions, searchTerm, statusFilter, amountFilter]);

  // Paginate filtered transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, amountFilter, dateRangeFilter]);

  const formatAmount = (amount: number, currency: string) => {
    const sign = amount >= 0 ? '+' : '-';
    const absAmount = Math.abs(amount);
    return `${sign}${absAmount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <LoadingSpinner
        icon={ArrowsClockwise}
        text="Loading transactions..."
        color="blue"
        height="h-48"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/50 rounded-lg p-3 sm:p-4 border border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 font-medium">Total Transactions</p>
              <p className="text-xl sm:text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">
                {summary.totalTransactions}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-primary-200 dark:bg-primary-800 rounded-lg">
              <Pulse className="text-primary-700 dark:text-primary-300" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-success/20 to-success/30 rounded-lg p-3 sm:p-4 border border-success/40"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-success font-medium">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-success mt-1 truncate">
                {summary.totalIncome.toLocaleString()} BDT
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-success/30 rounded-lg shrink-0">
              <TrendUp className="text-success" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-error/20 to-error/30 rounded-lg p-3 sm:p-4 border border-error/40"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-error font-medium">Total Expense</p>
              <p className="text-lg sm:text-2xl font-bold text-error mt-1 truncate">
                {summary.totalExpense.toLocaleString()} BDT
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-error/30 rounded-lg shrink-0">
              <TrendDown className="text-error" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-primary-50/50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/30 rounded-lg p-3 sm:p-4 border border-primary-200/50 dark:border-primary-800/50"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 font-medium">Net Amount</p>
              <p className={`text-lg sm:text-2xl font-bold mt-1 truncate ${
                summary.netAmount >= 0 ? 'text-success' : 'text-error'
              }`}>
                {summary.netAmount.toLocaleString()} BDT
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-primary-200/50 dark:bg-primary-800/50 rounded-lg shrink-0">
              <Wallet className="text-primary-700 dark:text-primary-300" size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="bg-surface-primary rounded-lg border border-border-primary">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-primary">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground-primary">Transaction History</h3>
            <p className="text-xs sm:text-sm text-foreground-secondary mt-1 wrap-break-words">
              {dateRangeFilter === 'all' 
                ? `All transactions for ${stakeholderName}`
                : dateRangeFilter === '7days'
                ? `Last 7 days of transactions for ${stakeholderName}`
                : dateRangeFilter === '30days'
                ? `Last 30 days of transactions for ${stakeholderName}`
                : `Last 90 days of transactions for ${stakeholderName}`
              }
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-primary bg-surface-secondary space-y-3 sm:space-y-4">
          {/* Time Range Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs sm:text-sm font-medium text-foreground-secondary shrink-0">Time Period:</span>
            <button
              onClick={() => setDateRangeFilter('7days')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                dateRangeFilter === '7days'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              <span className="hidden sm:inline">Last 7 Days</span>
              <span className="sm:hidden">7d</span>
            </button>
            <button
              onClick={() => setDateRangeFilter('30days')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                dateRangeFilter === '30days'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              <span className="hidden sm:inline">Last 30 Days</span>
              <span className="sm:hidden">30d</span>
            </button>
            <button
              onClick={() => setDateRangeFilter('90days')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                dateRangeFilter === '90days'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              <span className="hidden sm:inline">Last 90 Days</span>
              <span className="sm:hidden">90d</span>
            </button>
            <button
              onClick={() => setDateRangeFilter('all')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                dateRangeFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              <span className="hidden sm:inline">All Time</span>
              <span className="sm:hidden">All</span>
            </button>
          </div>

          {/* Amount Type Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs sm:text-sm font-medium text-foreground-secondary shrink-0">Type:</span>
            <button
              onClick={() => setAmountFilter('all')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                amountFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAmountFilter('income')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                amountFilter === 'income'
                  ? 'bg-success text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              <span className="hidden sm:inline">Income Only</span>
              <span className="sm:hidden">Income</span>
            </button>
            <button
              onClick={() => setAmountFilter('expense')}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                amountFilter === 'expense'
                  ? 'bg-error text-white'
                  : 'bg-surface-primary text-foreground-secondary border border-border-primary hover:bg-surface-hover'
              }`}
            >
              <span className="hidden sm:inline">Expenses Only</span>
              <span className="sm:hidden">Expenses</span>
            </button>
          </div>

          {/* Search and Status Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary text-foreground-primary"
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <FunnelSimple size={16} className="text-foreground-tertiary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-border-primary rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary text-foreground-primary"
              >
                <option value="All">All Status</option>
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          
          {/* Results count and active filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-foreground-secondary">
              Showing {filteredTransactions.length} of {dateFilteredTransactions.length} transaction{dateFilteredTransactions.length !== 1 ? 's' : ''}
            </span>
            {(searchTerm || statusFilter !== 'All' || amountFilter !== 'all' || dateRangeFilter !== '30days') && (
              <>
                <span className="text-foreground-tertiary hidden sm:inline">•</span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setAmountFilter('all');
                    setDateRangeFilter('30days');
                  }}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <CurrencyDollar size={40} className="mx-auto text-foreground-tertiary mb-3" />
            <p className="text-foreground-secondary text-xs sm:text-sm">
              {dateFilteredTransactions.length === 0 
                ? 'No transactions found' 
                : 'No transactions match your search criteria'
              }
            </p>
            <p className="text-foreground-tertiary text-xs mt-1">
              {dateFilteredTransactions.length === 0
                ? 'Transactions will appear here once created'
                : 'Try adjusting your search or filter'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border-primary">
              {paginatedTransactions.map((txn) => (
                <motion.div
                  key={txn.id}
                  variants={fadeInUp}
                  className="p-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground-primary text-sm truncate">{txn.title}</h4>
                      <p className="text-xs text-foreground-secondary mt-1">{txn.from_source}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${
                      txn.status === 'Complete' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-warning/20 text-warning'
                    }`}>
                      {txn.status === 'Complete' ? (
                        <><CheckCircle size={10} className="mr-1" />Done</>
                      ) : (
                        <><Clock size={10} className="mr-1" />Pending</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-foreground-secondary">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(txn.transaction_date)}
                      </div>
                      {txn.method && (
                        <span className="px-2 py-0.5 bg-surface-secondary text-foreground-secondary rounded">
                          {txn.method}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      txn.amount >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      {formatAmount(txn.amount, txn.currency)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border-primary">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-primary divide-y divide-border-primary">
                  {paginatedTransactions.map((txn) => (
                    <motion.tr 
                      key={txn.id} 
                      variants={fadeInUp}
                      className="hover:bg-surface-hover"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(txn.transaction_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground-primary">{txn.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-secondary text-foreground-secondary">
                          {txn.method || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-primary">
                        {txn.from_source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={txn.amount >= 0 ? 'text-success' : 'text-error'}>
                          {formatAmount(txn.amount, txn.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          txn.status === 'Complete' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-warning/20 text-warning'
                        }`}>
                          {txn.status === 'Complete' ? (
                            <><CheckCircle size={12} className="mr-1" />Complete</>
                          ) : (
                            <><Clock size={12} className="mr-1" />Pending</>
                          )}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={filteredTransactions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
