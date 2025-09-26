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
  EyeOff
} from 'lucide-react';
import { useStakeholders } from '@/hooks/useStakeholders';
import { useEmployees } from '@/hooks/useEmployees';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/lib/auth/auth-context';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TabView, { TabItem } from '@/components/ui/TabView';
import { Stakeholder } from '@/lib/types/schemas';
import { fadeInUp, staggerContainer } from '@/components/ui/animations';

export default function StakeholderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const stakeholderId = parseInt(params.id as string);
  
  const [activeTab, setActiveTab] = useState('info');
  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchStakeholders, stakeholders } = useStakeholders();
  const { employees, fetchEmployees } = useEmployees();
  const { accounts, fetchAccounts } = useAccounts();
  const { user, employeeInfo } = useAuth();

  // Find stakeholder from existing data or fetch if needed
  useEffect(() => {
    const existingStakeholder = stakeholders.find(s => s.id === stakeholderId);
    if (existingStakeholder) {
      setStakeholder(existingStakeholder);
      setLoading(false);
    } else {
      // Need to fetch stakeholders if not already loaded
      fetchStakeholders().then(() => {
        const foundStakeholder = stakeholders.find(s => s.id === stakeholderId);
        if (foundStakeholder) {
          setStakeholder(foundStakeholder);
        } else {
          setError('Stakeholder not found');
        }
        setLoading(false);
      }).catch((err) => {
        setError('Failed to load stakeholder');
        setLoading(false);
      });
    }
  }, [stakeholderId, stakeholders, fetchStakeholders]);

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

// Issues Tab Component (Placeholder for now)
function StakeholderIssuesTab({ stakeholderId }: { stakeholderId: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-gray-500 text-center py-8">
        Issues functionality will be implemented in the next phase.
      </p>
    </div>
  );
}

// Transactions Tab Component (Placeholder for now)
function StakeholderTransactionsTab({ 
  stakeholderId, 
  transactions, 
  assignedEmployees 
}: { 
  stakeholderId: number; 
  transactions: any[]; 
  assignedEmployees: any[]; 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Transactions ({transactions.length})
        </h3>
        {/* TODO: Add transaction creation button */}
      </div>
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{transaction.title}</h4>
                  <p className="text-sm text-gray-600">
                    {transaction.from_source} • {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} {transaction.currency}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.status === 'Complete' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No transactions found for this stakeholder.
        </p>
      )}
    </div>
  );
}