"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Users,
  AlertTriangle,
  DollarSign,
  Eye,
  EyeOff,
  X,
  Calendar,
  CreditCard,
  FileText,
  Building
} from 'lucide-react';
import { useStakeholders } from '@/hooks/useStakeholders';
import { useEmployees } from '@/hooks/useEmployees';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/lib/auth/auth-context';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TabView, { TabItem } from '@/components/ui/TabView';
import { useFormState } from '@/hooks/useFormState';
import { Stakeholder } from '@/lib/types/schemas';
import { fadeInUp, staggerContainer } from '@/components/ui/animations';
import BaseModal from '@/components/ui/modals/BaseModal';
import FormInputField from '@/components/ui/FormInputField';
import { createAccountNotification } from '@/lib/utils/notifications';

export default function StakeholderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const stakeholderId = parseInt(params.id as string);
  
  const [activeTab, setActiveTab] = useState('info');
  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchStakeholderById, error: stakeholderError } = useStakeholders();
  const { employees, fetchEmployees } = useEmployees();
  const { accounts, fetchAccounts } = useAccounts();
  const { user, employeeInfo } = useAuth();

  // Fetch individual stakeholder
  useEffect(() => {
    const loadStakeholder = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const foundStakeholder = await fetchStakeholderById(stakeholderId);
        if (foundStakeholder) {
          setStakeholder(foundStakeholder);
        } else {
          setError('Stakeholder not found');
        }
      } catch (err) {
        setError('Failed to load stakeholder');
        console.error('Error loading stakeholder:', err);
      } finally {
        setLoading(false);
      }
    };

    if (stakeholderId) {
      loadStakeholder();
    }
  }, [stakeholderId, fetchStakeholderById]);

  // Update error state from hook
  useEffect(() => {
    if (stakeholderError) {
      setError(stakeholderError);
    }
  }, [stakeholderError]);

  // Load related data
  useEffect(() => {
    fetchEmployees();
    fetchAccounts();
  }, [fetchEmployees, fetchAccounts]);

  // Get stakeholder transactions
  const stakeholderTransactions = accounts.filter(account => 
    account.additional_data?.stakeholder_id === stakeholderId
  );

  // Get assigned employees details
  const assignedEmployeeDetails = employees.filter(emp => 
    stakeholder?.assigned_employees?.includes(emp.id?.toString() || '')
  );

  // Check if user can edit/delete (creators and admins/managers)
  const canEditDelete = stakeholder && (
    stakeholder.created_by === user?.id || 
    employeeInfo?.role === 'Admin' || 
    employeeInfo?.role === 'Manager'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="h-8 w-8 text-purple-600" />
        <span className="ml-3 text-gray-600">Loading stakeholder details...</span>
      </div>
    );
  }

  if (error || !stakeholder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {error || 'Stakeholder Not Found'}
            </h2>
            <p className="text-red-600 mb-4">
              The stakeholder you're looking for could not be found or loaded.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: TabItem[] = [
    {
      key: 'info',
      label: 'Information',
      icon: <Building2 className="h-4 w-4" />,
      color: 'text-purple-600',
      content: (
        <StakeholderInfoTab 
          stakeholder={stakeholder}
          assignedEmployees={assignedEmployeeDetails}
          canEdit={canEditDelete || false}
        />
      ),
    },
    {
      key: 'issues',
      label: 'Issues',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-600',
      content: (
        <StakeholderIssuesTab stakeholderId={stakeholderId} />
      ),
    },
    {
      key: 'transactions',
      label: 'Transactions',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-green-600',
      content: (
        <StakeholderTransactionsTab 
          stakeholderId={stakeholderId}
          transactions={stakeholderTransactions}
          assignedEmployees={assignedEmployeeDetails}
          stakeholder={stakeholder}
        />
      ),
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{stakeholder.name}</h1>
                <p className="text-gray-600 mt-1">
                  {stakeholder.stakeholder_type?.name || 'Unknown Type'} • 
                  Added {new Date(stakeholder.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {canEditDelete && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {/* TODO: Implement edit modal */}}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {/* TODO: Implement delete confirmation */}}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <TabView
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </motion.div>
  );
}

// Info Tab Component
function StakeholderInfoTab({ 
  stakeholder, 
  assignedEmployees, 
  canEdit 
}: { 
  stakeholder: Stakeholder; 
  assignedEmployees: any[]; 
  canEdit: boolean; 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900 mt-1">{stakeholder.name}</p>
            </div>
            {stakeholder.address && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <div className="flex items-start mt-1">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-gray-900">{stakeholder.address}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="text-gray-900 mt-1">
                {stakeholder.stakeholder_type?.name || 'Not specified'}
              </p>
            </div>
            {stakeholder.manager && (
              <div>
                <label className="text-sm font-medium text-gray-500">Manager</label>
                <div className="flex items-center mt-1">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-gray-900 font-medium">{stakeholder.manager.name}</p>
                    {stakeholder.manager.email && (
                      <p className="text-sm text-gray-600">{stakeholder.manager.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Employees */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Employees</h3>
          {assignedEmployees.length > 0 ? (
            <div className="space-y-3">
              {assignedEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    <p className="text-xs text-gray-500">{employee.designation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No employees assigned</p>
          )}
        </div>
      </div>

      {/* Contact Details */}
      {stakeholder.contact_details?.contacts && stakeholder.contact_details.contacts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stakeholder.contact_details.contacts.map((contact, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{contact.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {contact.role}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  {contact.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{contact.phone}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{contact.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Issues Tab Component
function StakeholderIssuesTab({ stakeholderId }: { stakeholderId: number }) {
  const { stakeholderIssues, fetchStakeholderIssues } = useStakeholders();
  const [loading, setLoading] = useState(true);

  // Get issues for this stakeholder
  const stakeholderSpecificIssues = stakeholderIssues.filter(
    issue => issue.stakeholder_id === stakeholderId
  );

  useEffect(() => {
    fetchStakeholderIssues().finally(() => setLoading(false));
  }, [fetchStakeholderIssues]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner className="h-6 w-6 text-purple-600" />
          <span className="ml-3 text-gray-600">Loading issues...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Issues ({stakeholderSpecificIssues.length})
          </h3>
          <button className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </button>
        </div>

        {/* Issues Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => {
            const count = stakeholderSpecificIssues.filter(issue => issue.status === status).length;
            const colors = {
              'Open': 'bg-red-50 text-red-600',
              'In Progress': 'bg-yellow-50 text-yellow-600', 
              'Resolved': 'bg-green-50 text-green-600',
              'Closed': 'bg-gray-50 text-gray-600'
            };
            
            return (
              <div key={status} className={`rounded-lg p-4 ${colors[status as keyof typeof colors]}`}>
                <div className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {stakeholderSpecificIssues.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {stakeholderSpecificIssues.map((issue) => (
              <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{issue.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        issue.status === 'Open' ? 'bg-red-100 text-red-800' :
                        issue.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        issue.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        issue.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        issue.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                    {issue.description && (
                      <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created {new Date(issue.created_at || '').toLocaleDateString()}</span>
                      {issue.resolved_at && (
                        <span>Resolved {new Date(issue.resolved_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues reported</h3>
            <p className="text-gray-600 mb-4">
              This stakeholder has no reported issues at the moment.
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report First Issue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Transactions Tab Component 
function StakeholderTransactionsTab({ 
  stakeholderId, 
  transactions, 
  assignedEmployees,
  stakeholder
}: { 
  stakeholderId: number; 
  transactions: any[]; 
  assignedEmployees: any[];
  stakeholder: Stakeholder | null;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { createAccount } = useAccounts();
  const [creating, setCreating] = useState(false);

  const handleCreateTransaction = async (transactionData: any) => {
    setCreating(true);
    try {
      // Add stakeholder_id to additional_data
      const accountData = {
        ...transactionData,
        additional_data: {
          ...transactionData.additional_data,
          stakeholder_id: stakeholderId
        }
      };

      const newTransaction = await createAccount(accountData);
      setShowCreateForm(false);
      
      // Send notifications to assigned employees
      if (assignedEmployees.length > 0) {
        const notificationPromises = assignedEmployees.map(async (employee) => {
          try {
            // Determine notification type based on amount
            const isLargeTransaction = Math.abs(transactionData.amount) > 50000;
            const notificationType = isLargeTransaction ? 'stakeholderLargeTransaction' : 'stakeholderTransaction';
            
            await createAccountNotification(
              employee.id.toString(),
              notificationType,
              {
                title: transactionData.title,
                amount: transactionData.amount,
                currency: transactionData.currency,
                stakeholderName: stakeholder?.name || 'Unknown Stakeholder'
              },
              {
                referenceId: newTransaction.id,
                actionUrl: `/ops/stakeholder/${stakeholderId}?tab=transactions`
              }
            );
          } catch (notificationError) {
            console.warn(`Failed to send notification to ${employee.name}:`, notificationError);
          }
        });
        
        await Promise.all(notificationPromises);
      }
      
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Transactions ({transactions.length})
          </h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>

        {/* Transaction Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Income</p>
                <p className="text-xl font-semibold text-green-900">
                  {transactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()} BDT
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-xl font-semibold text-red-900">
                  {Math.abs(transactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, t) => sum + t.amount, 0))
                    .toLocaleString()} BDT
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Net Balance</p>
                <p className="text-xl font-semibold text-blue-900">
                  {transactions
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()} BDT
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{transaction.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'Complete' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{transaction.from_source}</span>
                      <span>•</span>
                      <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                      {transaction.method && (
                        <>
                          <span>•</span>
                          <span>{transaction.method}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} {transaction.currency}
                    </p>
                    <p className="text-xs text-gray-500">
                      Added {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking financial transactions for this stakeholder.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Add First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Transaction Form Modal */}
      {showCreateForm && (
        <StakeholderTransactionForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateTransaction}
          stakeholderId={stakeholderId}
          assignedEmployees={assignedEmployees}
          isSubmitting={creating}
        />
      )}
    </div>
  );
}
// Stakeholder Transaction Form Component
interface StakeholderTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  stakeholderId: number;
  assignedEmployees: any[];
  isSubmitting: boolean;
}

function StakeholderTransactionForm({
  isOpen,
  onClose,
  onSubmit,
  stakeholderId,
  assignedEmployees,
  isSubmitting
}: StakeholderTransactionFormProps) {
  const {
    formValues,
    errors,
    touched,
    handleChange,
    resetForm,
    isValid
  } = useFormState({
    initialData: {
      title: '',
      method: '',
      status: 'Pending',
      from_source: '',
      transaction_date: new Date().toISOString().split('T')[0],
      amount: '',
      currency: 'BDT'
    },
    validateFn: (data) => {
      const errors = [];
      
      if (!data.title.trim()) {
        errors.push({ field: 'title', message: 'Title is required' });
      }
      
      if (!data.from_source.trim()) {
        errors.push({ field: 'from_source', message: 'Source is required' });
      }
      
      if (!data.amount || isNaN(Number(data.amount))) {
        errors.push({ field: 'amount', message: 'Valid amount is required' });
      }
      
      if (!data.transaction_date) {
        errors.push({ field: 'transaction_date', message: 'Transaction date is required' });
      }
      
      return {
        success: errors.length === 0,
        errors
      };
    },
    validationErrorsToObject: (errors: any[]) => {
      return errors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {});
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;
    
    const transactionData = {
      ...formValues,
      amount: Number(formValues.amount),
      additional_data: {
        stakeholder_id: stakeholderId,
        assigned_employees: assignedEmployees.map(emp => emp.id)
      }
    };
    
    await onSubmit(transactionData);
    resetForm();
  };

  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank', label: 'Bank Transfer' },
    { value: 'Check', label: 'Check' },
    { value: 'Card', label: 'Card Payment' },
    { value: 'Mobile Banking', label: 'Mobile Banking' },
  ];

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Complete', label: 'Complete' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Transaction"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <FormInputField
            name="title"
            label="Transaction Title"
            icon={<FileText size={18} />}
            value={formValues.title}
            onChange={handleChange}
            error={touched.title ? errors.title : undefined}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment Method
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <CreditCard size={18} />
                </div>
                <select
                  name="method"
                  value={formValues.method}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-[#EAF4FF] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <AlertTriangle size={18} />
                </div>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-[#EAF4FF] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <FormInputField
            name="from_source"
            label="Source/Description"
            icon={<Building size={18} />}
            value={formValues.from_source}
            onChange={handleChange}
            error={touched.from_source ? errors.from_source : undefined}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              name="transaction_date"
              label="Transaction Date"
              icon={<Calendar size={18} />}
              type="date"
              value={formValues.transaction_date}
              onChange={handleChange}
              error={touched.transaction_date ? errors.transaction_date : undefined}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formValues.amount}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-16 py-2 border rounded-lg bg-[#EAF4FF] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    touched.amount && errors.amount
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">{formValues.currency}</span>
                </div>
              </div>
              {touched.amount && errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Use negative values for expenses (e.g., -1000 for a payment made)
              </p>
            </div>
          </div>

          {assignedEmployees.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Notification Recipients
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                The following assigned employees will be notified about this transaction:
              </p>
              <div className="flex flex-wrap gap-2">
                {assignedEmployees.map((employee) => (
                  <span
                    key={employee.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {employee.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              !isValid || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
