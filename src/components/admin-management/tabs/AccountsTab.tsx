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
  Clock,
  X,
  Minus,
  Users
} from "lucide-react";
import { staggerContainer, fadeInUp } from "@/components/ui/animations";
import { useAccounts } from "@/hooks/useAccounts";
import { useStakeholders } from "@/hooks/useStakeholders";
import { Account } from "@/lib/types/schemas";
import { PAYMENT_METHODS, CURRENCIES, STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import FormModal from "@/components/ui/modals/FormModal";
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
  additional_data: string; // We'll keep this as string for form compatibility
  stakeholder_id: string; // Add stakeholder reference (as string for form, will be converted to number)
}

// KeyValueEditor component for managing additional data
interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  error?: string;
}

function KeyValueEditor({ pairs, onChange, error }: KeyValueEditorProps) {
  const addPair = () => {
    onChange([...pairs, { key: '', value: '' }]);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const updatePair = (index: number, field: 'key' | 'value', newValue: string) => {
    const newPairs = [...pairs];
    newPairs[index][field] = newValue;
    onChange(newPairs);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Additional Data (Optional)
        </label>
        <button
          type="button"
          onClick={addPair}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Plus size={14} className="mr-1" />
          Add Field
        </button>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 italic">No additional data fields</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Field" to create key-value pairs</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {pairs.map((pair, index) => (
            <div key={index} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Key (e.g., reference)"
                value={pair.key}
                onChange={(e) => updatePair(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <span className="text-gray-400 font-mono">:</span>
              <input
                type="text"
                placeholder="Value (e.g., REF123)"
                value={pair.value}
                onChange={(e) => updatePair(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={() => removePair(index)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Remove field"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

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

  const {
    stakeholders,
    fetchStakeholders,
  } = useStakeholders();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Complete' | 'Pending'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Helper function to format additional data for display
  const formatAdditionalData = (data: any) => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return <span className="text-gray-500 italic text-xs">No additional data</span>;
    }

    const entries = Object.entries(data);
    const displayCount = Math.min(entries.length, 2); // Show max 2 chips to prevent overflow

    return (
      <div className="flex flex-wrap gap-1">
        {entries.slice(0, displayCount).map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border max-w-32"
            title={`${key}: ${value}`}
          >
            <span className="font-semibold">{key}:</span>
            <span className="ml-1 truncate">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </span>
        ))}
        {entries.length > displayCount && (
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 cursor-help"
            title={`Additional fields: ${entries.slice(displayCount).map(([k, v]) => `${k}: ${v}`).join(', ')}`}
          >
            +{entries.length - displayCount} more
          </span>
        )}
      </div>
    );
  };

  // Helper function to parse key-value pairs from array to object
  const parseAdditionalDataFromPairs = (pairs: KeyValuePair[]) => {
    const data: Record<string, string> = {};
    pairs.forEach(pair => {
      if (pair.key.trim() && pair.value.trim()) {
        data[pair.key.trim()] = pair.value.trim();
      }
    });
    return data;
  };

  // Helper function to parse key-value pairs from string to object
  const parseAdditionalData = (text: string) => {
    if (!text.trim()) return {};

    try {
      // Try to parse as JSON first (for backward compatibility)
      return JSON.parse(text);
    } catch {
      // If not JSON, treat as key:value pairs separated by newlines
      const data: Record<string, string> = {};
      const lines = text.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            data[key] = value;
          }
        }
      });
      return data;
    }
  };

  // Helper function to convert object to key-value pairs array
  const formatDataForEdit = (data: any): KeyValuePair[] => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return [];
    }

    return Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  };

  // Helper function to convert key-value pairs array to string
  const stringifyAdditionalData = (pairs: KeyValuePair[]): string => {
    return pairs
      .filter(pair => pair.key.trim() && pair.value.trim())
      .map(pair => `${pair.key.trim()}:${pair.value.trim()}`)
      .join('\n');
  };

  const handleCreateAccount = async (data: AccountFormData) => {
    const accountData = {
      title: data.title.trim(),
      method: data.method.trim() || null,
      status: data.status,
      from_source: data.from_source.trim(),
      transaction_date: data.transaction_date,
      amount: parseFloat(data.amount),
      currency: data.currency.trim(),
      additional_data: parseAdditionalData(data.additional_data),
      stakeholder_id: data.stakeholder_id ? parseInt(data.stakeholder_id) : null,
    };

    await createAccount(accountData);
    setIsCreateModalOpen(false);
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
      additional_data: parseAdditionalData(data.additional_data),
      stakeholder_id: data.stakeholder_id ? parseInt(data.stakeholder_id) : null,
    };

    await updateAccount(selectedAccount.id!, accountData);
    setIsEditModalOpen(false);
    setSelectedAccount(null);
  };

  useEffect(() => {
    fetchAccounts();
    fetchStakeholders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.from_source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.method?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate filtered summary based on current filters
  const filteredSummary = {
    total: filteredAccounts.length,
    complete: filteredAccounts.filter(account => account.status === 'Complete').length,
    pending: filteredAccounts.filter(account => account.status === 'Pending').length,
    totalAmount: filteredAccounts.reduce((sum, account) => sum + account.amount, 0)
  };

  const handleEditClick = (account: Account) => {
    setSelectedAccount(account);
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
                <span className="text-sm opacity-90">Net Amount (Status-wise)</span>
              </div>
              <span className="text-xl font-bold">
                {filteredSummary.totalAmount.toLocaleString('en-US', {
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stakeholder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Data</th>
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
                        {account.stakeholder ? (
                          <div className="flex items-center gap-1">
                            <Users size={14} className="text-blue-500" />
                            <span className="text-sm text-gray-900">{account.stakeholder.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No stakeholder</span>
                        )}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.status === 'Complete'
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
                      <td className="px-6 py-4 max-w-xs overflow-hidden">
                        {formatAdditionalData(account.additional_data)}
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

      {/* Create Account Modal */}
      <FormModal<AccountFormData>
        title="Create New Transaction"
        icon={<Plus size={24} />}
        isOpen={isCreateModalOpen}
        initialValues={{
          title: '',
          method: '',
          status: 'Pending',
          from_source: '',
          transaction_date: new Date().toISOString().split('T')[0],
          amount: '',
          currency: 'BDT',
          additional_data: '',
          stakeholder_id: ''
        }}
        validationFn={(values) => {
          const errors = [];
          if (!values.title.trim()) errors.push({ field: 'title', message: 'Title is required' });
          if (!values.from_source.trim()) errors.push({ field: 'from_source', message: 'From source is required' });
          if (!values.transaction_date) errors.push({ field: 'transaction_date', message: 'Transaction date is required' });
          if (!values.amount.trim()) errors.push({ field: 'amount', message: 'Amount is required' });
          if (!values.currency.trim()) errors.push({ field: 'currency', message: 'Currency is required' });
          if (!values.status) errors.push({ field: 'status', message: 'Status is required' });

          // Validate amount is a number
          if (values.amount.trim() && isNaN(parseFloat(values.amount))) {
            errors.push({ field: 'amount', message: 'Amount must be a valid number' });
          }

          return errors.length === 0 ? { success: true, data: values } : { success: false, errors };
        }}
        onSubmit={handleCreateAccount}
        onClose={() => setIsCreateModalOpen(false)}
        isLoading={loading}
        submitButtonText="Create Transaction"
      >
        {({ values, errors, handleChange }) => (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                icon={<DollarSign size={18} />}
                label="Transaction Title"
                name="title"
                value={values.title}
                onChange={handleChange}
                error={errors.title}
              />

              <FormSelectField
                icon={<CreditCard size={18} />}
                label="Payment Method"
                name="method"
                value={values.method}
                onChange={handleChange}
                error={errors.method}
                options={PAYMENT_METHODS.map(method => ({ value: method, label: method }))}
                placeholder="Select method (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                icon={<Building size={18} />}
                label="From Source"
                name="from_source"
                value={values.from_source}
                onChange={handleChange}
                error={errors.from_source}
              />

              <FormSelectField
                icon={<Users size={18} />}
                label="Stakeholder (Optional)"
                name="stakeholder_id"
                value={values.stakeholder_id}
                onChange={handleChange}
                error={errors.stakeholder_id}
                options={[
                  { value: '', label: 'No Stakeholder' },
                  ...stakeholders.map(s => ({
                    value: String(s.id),
                    label: `${s.name}${s.is_completed ? ' (Completed)' : ' (Active)'}`
                  }))
                ]}
                placeholder="Select stakeholder (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelectField
                icon={<CheckCircle size={18} />}
                label="Status"
                name="status"
                value={values.status}
                onChange={handleChange}
                error={errors.status}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Complete', label: 'Complete' }
                ]}
                placeholder="Select status"
              />

              <FormInputField
                icon={<Calendar size={18} />}
                label="Transaction Date"
                name="transaction_date"
                type="date"
                value={values.transaction_date}
                onChange={handleChange}
                error={errors.transaction_date}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                icon={<DollarSign size={18} />}
                label="Amount"
                name="amount"
                type="number"
                value={values.amount}
                onChange={handleChange}
                error={errors.amount}
              />

              <FormSelectField
                icon={<DollarSign size={18} />}
                label="Currency"
                name="currency"
                value={values.currency}
                onChange={handleChange}
                error={errors.currency}
                options={CURRENCIES.map(currency => ({ value: currency, label: currency }))}
                placeholder="Select currency"
              />
            </div>

            <KeyValueEditor
              pairs={formatDataForEdit(parseAdditionalData(values.additional_data))}
              onChange={(pairs) => {
                const stringValue = stringifyAdditionalData(pairs);
                const event = {
                  target: {
                    name: 'additional_data',
                    value: stringValue
                  }
                } as any;
                handleChange(event);
              }}
              error={errors.additional_data}
            />
          </>
        )}
      </FormModal>

      {/* Edit Account Modal */}
      {selectedAccount && (
        <FormModal<AccountFormData>
          title="Edit Transaction"
          icon={<Edit size={24} />}
          isOpen={isEditModalOpen}
          initialValues={{
            title: selectedAccount.title,
            method: selectedAccount.method || '',
            status: selectedAccount.status,
            from_source: selectedAccount.from_source,
            transaction_date: selectedAccount.transaction_date,
            amount: selectedAccount.amount.toString(),
            currency: selectedAccount.currency,
            additional_data: stringifyAdditionalData(formatDataForEdit(selectedAccount.additional_data)),
            stakeholder_id: selectedAccount.stakeholder_id ? String(selectedAccount.stakeholder_id) : ''
          }}
          validationFn={(values) => {
            const errors = [];
            if (!values.title.trim()) errors.push({ field: 'title', message: 'Title is required' });
            if (!values.from_source.trim()) errors.push({ field: 'from_source', message: 'From source is required' });
            if (!values.transaction_date) errors.push({ field: 'transaction_date', message: 'Transaction date is required' });
            if (!values.amount.trim()) errors.push({ field: 'amount', message: 'Amount is required' });
            if (!values.currency.trim()) errors.push({ field: 'currency', message: 'Currency is required' });
            if (!values.status) errors.push({ field: 'status', message: 'Status is required' });

            // Validate amount is a number
            if (values.amount.trim() && isNaN(parseFloat(values.amount))) {
              errors.push({ field: 'amount', message: 'Amount must be a valid number' });
            }

            return errors.length === 0 ? { success: true, data: values } : { success: false, errors };
          }}
          onSubmit={handleEditAccount}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAccount(null);
          }}
          isLoading={loading}
          submitButtonText="Update Transaction"
        >
          {({ values, errors, handleChange }) => (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputField
                  icon={<DollarSign size={18} />}
                  label="Transaction Title"
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  error={errors.title}
                />

                <FormSelectField
                  icon={<CreditCard size={18} />}
                  label="Payment Method"
                  name="method"
                  value={values.method}
                  onChange={handleChange}
                  error={errors.method}
                  options={PAYMENT_METHODS.map(method => ({ value: method, label: method }))}
                  placeholder="Select method (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputField
                  icon={<Building size={18} />}
                  label="From Source"
                  name="from_source"
                  value={values.from_source}
                  onChange={handleChange}
                  error={errors.from_source}
                />

                <FormSelectField
                  icon={<Users size={18} />}
                  label="Stakeholder (Optional)"
                  name="stakeholder_id"
                  value={values.stakeholder_id}
                  onChange={handleChange}
                  error={errors.stakeholder_id}
                  options={[
                    { value: '', label: 'No Stakeholder' },
                    ...stakeholders.map(s => ({
                      value: String(s.id),
                      label: `${s.name}${s.is_completed ? ' (Completed)' : ' (Active)'}`
                    }))
                  ]}
                  placeholder="Select stakeholder (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelectField
                  icon={<CheckCircle size={18} />}
                  label="Status"
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  error={errors.status}
                  options={[
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Complete', label: 'Complete' }
                  ]}
                  placeholder="Select status"
                />

                <FormInputField
                  icon={<Calendar size={18} />}
                  label="Transaction Date"
                  name="transaction_date"
                  type="date"
                  value={values.transaction_date}
                  onChange={handleChange}
                  error={errors.transaction_date}
                />

                <FormInputField
                  icon={<DollarSign size={18} />}
                  label="Amount"
                  name="amount"
                  type="number"
                  value={values.amount}
                  onChange={handleChange}
                  error={errors.amount}
                />

                <FormSelectField
                  icon={<DollarSign size={18} />}
                  label="Currency"
                  name="currency"
                  value={values.currency}
                  onChange={handleChange}
                  error={errors.currency}
                  options={CURRENCIES.map(currency => ({ value: currency, label: currency }))}
                  placeholder="Select currency"
                />
              </div>

              <KeyValueEditor
                pairs={formatDataForEdit(parseAdditionalData(values.additional_data))}
                onChange={(pairs) => {
                  const stringValue = stringifyAdditionalData(pairs);
                  const event = {
                    target: {
                      name: 'additional_data',
                      value: stringValue
                    }
                  } as any;
                  handleChange(event);
                }}
                error={errors.additional_data}
              />
            </>
          )}
        </FormModal>
      )}
    </>
  );
}