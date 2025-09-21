"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Building,
  LoaderCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { staggerContainer, fadeInUp } from "@/components/ui/animations";
import { useAccounts } from "@/hooks/useAccounts";
import { Account } from "@/lib/types/schemas";
import { PAYMENT_METHODS, CURRENCIES, STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import FormModal from "@/components/ui/modals/FormModal";
import BaseForm from "@/components/forms/BaseForm";
import { useFormValidation } from "@/hooks/core/useFormValidation";
import FormInputField from "@/components/ui/FormInputField";
import FormSelectField from "@/components/ui/FormSelectField";

interface AccountFormData {
  title: string;
  method: string;
  status: 'Complete' | 'Pending';
  from_source: string;
  transaction_date: string;
  amount: string;
  currency: string;
  additional_data: string; // JSON string for form input
}

const validateAccountForm = (data: AccountFormData) => {
  const errors: Array<{field: string, message: string}> = [];

  if (!data.title.trim()) errors.push({ field: 'title', message: 'Title is required' });
  if (!data.from_source.trim()) errors.push({ field: 'from_source', message: 'Source is required' });
  if (!data.transaction_date.trim()) errors.push({ field: 'transaction_date', message: 'Transaction date is required' });
  if (!data.amount.trim()) errors.push({ field: 'amount', message: 'Amount is required' });
  
  const amount = parseFloat(data.amount);
  if (isNaN(amount)) errors.push({ field: 'amount', message: 'Amount must be a valid number' });
  
  if (!data.currency.trim()) errors.push({ field: 'currency', message: 'Currency is required' });

  // Validate JSON format for additional_data if provided
  if (data.additional_data.trim()) {
    try {
      JSON.parse(data.additional_data);
    } catch {
      errors.push({ field: 'additional_data', message: 'Additional data must be valid JSON' });
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
};

export default function AccountsTab() {
  const {
    accounts,
    loading,
    error,
    summary,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    clearError,
  } = useAccounts();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Complete' | 'Pending'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleCreateAccount = async (data: AccountFormData) => {
    const accountData = {
      title: data.title.trim(),
      method: data.method.trim() || null,
      status: data.status,
      from_source: data.from_source.trim(),
      transaction_date: data.transaction_date,
      amount: parseFloat(data.amount),
      currency: data.currency.trim(),
      additional_data: data.additional_data.trim() ? JSON.parse(data.additional_data) : {},
    };

    await createAccount(accountData);
    setIsCreateModalOpen(false);
    createForm.resetForm();
  };

  const handleEditAccount = async (data: AccountFormData) => {
    if (!selectedAccount) return;

    const accountData = {
      title: data.title.trim(),
      method: data.method.trim() || null,
      status: data.status,
      from_source: data.from_source.trim(),
      transaction_date: data.transaction_date,
      amount: parseFloat(data.amount),
      currency: data.currency.trim(),
      additional_data: data.additional_data.trim() ? JSON.parse(data.additional_data) : {},
    };

    await updateAccount(selectedAccount.id!, accountData);
    setIsEditModalOpen(false);
    setSelectedAccount(null);
    editForm.resetForm();
  };

  const createForm = useFormValidation<AccountFormData>({
    initialValues: {
      title: "",
      method: "",
      status: "Pending" as const,
      from_source: "",
      transaction_date: new Date().toISOString().split('T')[0], // Today's date
      amount: "",
      currency: "BDT",
      additional_data: "",
    },
    validationFn: validateAccountForm,
    onSubmit: handleCreateAccount,
  });

  const editForm = useFormValidation<AccountFormData>({
    initialValues: {
      title: "",
      method: "",
      status: "Pending" as const,
      from_source: "",
      transaction_date: new Date().toISOString().split('T')[0],
      amount: "",
      currency: "BDT",
      additional_data: "",
    },
    validationFn: validateAccountForm,
    onSubmit: handleEditAccount,
  });

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.from_source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.method?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (account: Account) => {
    setSelectedAccount(account);
    editForm.setValues({
      title: account.title,
      method: account.method || "",
      status: account.status,
      from_source: account.from_source,
      transaction_date: account.transaction_date,
      amount: account.amount.toString(),
      currency: account.currency,
      additional_data: account.additional_data ? JSON.stringify(account.additional_data, null, 2) : "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete "${account.title}"?`)) {
      await deleteAccount(account.id!);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}${formatted} ${currency}`;
  };

  if (loading && accounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm p-6"
      >
        <LoaderCircle className="w-12 h-12 text-gray-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading accounts...</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header with Summary */}
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard size={28} />
              <h2 className="text-2xl font-bold">Accounts Management</h2>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Transaction
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building size={16} />
                <span className="text-sm opacity-90">Total Transactions</span>
              </div>
              <span className="text-2xl font-bold">{summary.total}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} />
                <span className="text-sm opacity-90">Complete</span>
              </div>
              <span className="text-2xl font-bold">{summary.complete}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} />
                <span className="text-sm opacity-90">Pending</span>
              </div>
              <span className="text-2xl font-bold">{summary.pending}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} />
                <span className="text-sm opacity-90">Net Amount</span>
              </div>
              <span className="text-xl font-bold">
                {summary.totalAmount.toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} BDT
              </span>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Complete">Complete</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </motion.div>

        {/* Accounts List */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No transactions found</p>
              <p>Create your first transaction to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{account.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {account.method || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.from_source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(account.transaction_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={account.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatAmount(account.amount, account.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.status === 'Complete' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {account.status === 'Complete' ? (
                            <><CheckCircle size={12} className="mr-1" />Complete</>
                          ) : (
                            <><Clock size={12} className="mr-1" />Pending</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(account)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(account)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Create Account Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          createForm.resetForm();
        }}
        title="Create New Transaction"
        description="Add a new financial transaction to the accounts system"
      >
        <BaseForm
          onSubmit={createForm.handleSubmit}
          isSubmitting={false} // We'll handle this differently
          submitText="Create Transaction"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              label="Transaction Title"
              name="title"
              value={createForm.values.title}
              onChange={createForm.handleChange}
              error={createForm.errors.title}
              placeholder="e.g., Office supplies purchase"
              required
            />
            
            <FormSelectField
              label="Payment Method"
              name="method"
              value={createForm.values.method}
              onChange={createForm.handleChange}
              error={createForm.errors.method}
              options={PAYMENT_METHODS.map(method => ({ value: method, label: method }))}
              placeholder="Select method (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              label="From Source"
              name="from_source"
              value={createForm.values.from_source}
              onChange={createForm.handleChange}
              error={createForm.errors.from_source}
              placeholder="e.g., Petty Cash, Bank Account"
              required
            />

            <FormSelectField
              label="Status"
              name="status"
              value={createForm.values.status}
              onChange={createForm.handleChange}
              error={createForm.errors.status}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Complete', label: 'Complete' }
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInputField
              label="Transaction Date"
              name="transaction_date"
              type="date"
              value={createForm.values.transaction_date}
              onChange={createForm.handleChange}
              error={createForm.errors.transaction_date}
              required
            />

            <FormInputField
              label="Amount"
              name="amount"
              type="number"
              step="0.01"
              value={createForm.values.amount}
              onChange={createForm.handleChange}
              error={createForm.errors.amount}
              placeholder="0.00"
              helpText="Use negative values for expenses"
              required
            />

            <FormSelectField
              label="Currency"
              name="currency"
              value={createForm.values.currency}
              onChange={createForm.handleChange}
              error={createForm.errors.currency}
              options={CURRENCIES.map(currency => ({ value: currency, label: currency }))}
              required
            />
          </div>

          <FormInputField
            label="Additional Data (JSON)"
            name="additional_data"
            value={createForm.values.additional_data}
            onChange={createForm.handleChange}
            error={createForm.errors.additional_data}
            placeholder='{"user_id": "EMP001", "category": "office_supplies"}'
            helpText="Optional JSON data for additional information"
            textarea
          />
        </BaseForm>
      </FormModal>

      {/* Edit Account Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAccount(null);
          editForm.resetForm();
        }}
        title="Edit Transaction"
        description="Modify the selected financial transaction"
      >
        <BaseForm
          onSubmit={editForm.handleSubmit}
          isSubmitting={false}
          submitText="Update Transaction"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              label="Transaction Title"
              name="title"
              value={editForm.values.title}
              onChange={editForm.handleChange}
              error={editForm.errors.title}
              placeholder="e.g., Office supplies purchase"
              required
            />
            
            <FormSelectField
              label="Payment Method"
              name="method"
              value={editForm.values.method}
              onChange={editForm.handleChange}
              error={editForm.errors.method}
              options={PAYMENT_METHODS.map(method => ({ value: method, label: method }))}
              placeholder="Select method (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              label="From Source"
              name="from_source"
              value={editForm.values.from_source}
              onChange={editForm.handleChange}
              error={editForm.errors.from_source}
              placeholder="e.g., Petty Cash, Bank Account"
              required
            />

            <FormSelectField
              label="Status"
              name="status"
              value={editForm.values.status}
              onChange={editForm.handleChange}
              error={editForm.errors.status}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Complete', label: 'Complete' }
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInputField
              label="Transaction Date"
              name="transaction_date"
              type="date"
              value={editForm.values.transaction_date}
              onChange={editForm.handleChange}
              error={editForm.errors.transaction_date}
              required
            />

            <FormInputField
              label="Amount"
              name="amount"
              type="number"
              step="0.01"
              value={editForm.values.amount}
              onChange={editForm.handleChange}
              error={editForm.errors.amount}
              placeholder="0.00"
              helpText="Use negative values for expenses"
              required
            />

            <FormSelectField
              label="Currency"
              name="currency"
              value={editForm.values.currency}
              onChange={editForm.handleChange}
              error={editForm.errors.currency}
              options={CURRENCIES.map(currency => ({ value: currency, label: currency }))}
              required
            />
          </div>

          <FormInputField
            label="Additional Data (JSON)"
            name="additional_data"
            value={editForm.values.additional_data}
            onChange={editForm.handleChange}
            error={editForm.errors.additional_data}
            placeholder='{"user_id": "EMP001", "category": "office_supplies"}'
            helpText="Optional JSON data for additional information"
            textarea
          />
        </BaseForm>
      </FormModal>
    </>
  );
}