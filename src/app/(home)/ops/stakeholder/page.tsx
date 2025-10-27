"use client";

import { useState, useEffect } from 'react';
import { Building2, Plus, Filter, Search, AlertTriangle, Users, FileText } from 'lucide-react';
import ServicePageTemplate from '@/components/ui/ServicePageTemplate';
import { TabItem } from '@/components/ui/TabView';
import { useStakeholders } from '@/hooks/useStakeholders';
import { motion } from 'framer-motion';
import StakeholderList from './components/StakeholderList';
import StakeholderForm from './components/StakeholderForm';
import StakeholderIssueList from './components/StakeholderIssueList';
import StakeholderIssueForm from './components/StakeholderIssueForm';
import { useModalState } from '@/hooks/core/useModalState';

export default function StakeholderPage() {
  const [activeTab, setActiveTab] = useState('stakeholders');
  const {
    stakeholders,
    stakeholderTypes,
    stakeholderIssues,
    loading,
    error,
    fetchStakeholders,
    fetchStakeholderTypes,
    fetchStakeholderIssues,
  } = useStakeholders();

  const {
    modalState: stakeholderModalState,
    openCreateModal: openStakeholderModal,
    closeModal: closeStakeholderModal,
  } = useModalState();

  const {
    modalState: issueModalState,
    openCreateModal: openIssueModal,
    closeModal: closeIssueModal,
  } = useModalState();

  // Load initial data
  useEffect(() => {
    fetchStakeholderTypes();
    fetchStakeholders();
    fetchStakeholderIssues();
  }, [fetchStakeholderTypes, fetchStakeholders, fetchStakeholderIssues]);

  const tabs: TabItem[] = [
    {
      key: 'stakeholders',
      label: 'Stakeholders',
      icon: <Building2 className="h-4 w-4" />,
      color: 'text-purple-600',
      content: (
        <div className="space-y-6">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Stakeholders</h2>
              <p className="text-sm text-gray-600">Manage company stakeholders and their relationships</p>
            </div>
            <button
              onClick={openStakeholderModal}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </button>
          </div>

          {/* Stakeholders List */}
          <StakeholderList 
            stakeholders={stakeholders}
            stakeholderTypes={stakeholderTypes}
            loading={loading}
            error={error}
          />
        </div>
      ),
    },
    {
      key: 'issues',
      label: 'Issues',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-600',
      content: (
        <div className="space-y-6">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Stakeholder Issues</h2>
              <p className="text-sm text-gray-600">Track and manage stakeholder-related issues</p>
            </div>
            <button
              onClick={openIssueModal}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Issue
            </button>
          </div>

          {/* Issues List */}
          <StakeholderIssueList 
            issues={stakeholderIssues}
            stakeholders={stakeholders}
            loading={loading}
            error={error}
          />
        </div>
      ),
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-600',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Stakeholder Analytics</h2>
            <p className="text-sm text-gray-600">Overview of stakeholder relationships and issue trends</p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Stakeholders</p>
                  <p className="text-2xl font-semibold text-gray-900">{stakeholders.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Issues</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stakeholderIssues.filter(issue => issue.status === 'Open').length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority Issues</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stakeholderIssues.filter(issue => 
                      issue.priority === 'High' || issue.priority === 'Critical'
                    ).length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stakeholder Types</p>
                  <p className="text-2xl font-semibold text-gray-900">{stakeholderTypes.length}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <ServicePageTemplate
        title="Stakeholder Management"
        description="Manage stakeholder relationships, track issues, and monitor engagement"
        icon={<Building2 className="h-7 w-7" />}
        primaryColor="text-purple-600"
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        actionButtonLabel="Quick Actions"
        actionButtonIcon={<Plus className="h-4 w-4" />}
        actionButtonOnClick={() => {
          if (activeTab === 'stakeholders') {
            openStakeholderModal();
          } else if (activeTab === 'issues') {
            openIssueModal();
          }
        }}
      />

      {/* Stakeholder Form Modal */}
      {stakeholderModalState.isOpen && (
        <StakeholderForm
          isOpen={stakeholderModalState.isOpen}
          onClose={closeStakeholderModal}
          stakeholderTypes={stakeholderTypes}
          onSuccess={() => {
            fetchStakeholders();
            closeStakeholderModal();
          }}
        />
      )}

      {/* Issue Form Modal */}
      {issueModalState.isOpen && (
        <StakeholderIssueForm
          isOpen={issueModalState.isOpen}
          onClose={closeIssueModal}
          stakeholders={stakeholders}
          onSuccess={() => {
            fetchStakeholderIssues();
            closeIssueModal();
          }}
        />
      )}
    </>
  );
}