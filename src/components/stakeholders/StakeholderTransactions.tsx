"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity
} from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { Account } from "@/lib/types/schemas";
import { formatDate } from "@/lib/utils";
import { fadeInUp } from "@/components/ui/animations";

interface StakeholderTransactionsProps {
  stakeholderId: number;
  stakeholderName: string;
}

export default function StakeholderTransactions({ 
  stakeholderId, 
  stakeholderName 
}: StakeholderTransactionsProps) {
  const { fetchAccountsByStakeholder, getStakeholderTransactionSummary, loading } = useAccounts();
  const [transactions, setTransactions] = useState<Account[]>([]);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const txns = await fetchAccountsByStakeholder(stakeholderId);
        setTransactions(txns);
        
        const summaryData = await getStakeholderTransactionSummary(stakeholderId);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error loading stakeholder transactions:', error);
      }
    };
    
    loadData();
  }, [stakeholderId, fetchAccountsByStakeholder, getStakeholderTransactionSummary]);

  const formatAmount = (amount: number, currency: string) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {summary.totalTransactions}
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <Activity className="text-blue-700" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {summary.totalIncome.toLocaleString()} BDT
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <TrendingUp className="text-green-700" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Expense</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {summary.totalExpense.toLocaleString()} BDT
              </p>
            </div>
            <div className="p-3 bg-red-200 rounded-lg">
              <TrendingDown className="text-red-700" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Net Amount</p>
              <p className={`text-2xl font-bold mt-1 ${
                summary.netAmount >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {summary.netAmount.toLocaleString()} BDT
              </p>
            </div>
            <div className="p-3 bg-purple-200 rounded-lg">
              <Wallet className="text-purple-700" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-600 mt-1">
            All financial activities for {stakeholderName}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No transactions found</p>
            <p className="text-gray-400 text-xs mt-1">
              Transactions will appear here once created
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <motion.tr 
                    key={txn.id} 
                    variants={fadeInUp}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(txn.transaction_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{txn.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {txn.method || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {txn.from_source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatAmount(txn.amount, txn.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        txn.status === 'Complete' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
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
        )}
      </div>
    </div>
  );
}
