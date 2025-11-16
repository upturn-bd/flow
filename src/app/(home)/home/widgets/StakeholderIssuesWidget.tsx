'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Plus, RefreshCw, FileText } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/components/ui/animations';
import SectionHeader from '@/app/(home)/home/components/SectionHeader';
import SectionContainer from '@/app/(home)/home/components/SectionContainer';
import LoadingSection from '@/app/(home)/home/components/LoadingSection';
import EmptyState from '@/app/(home)/home/components/EmptyState';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import { useStakeholderIssues } from '@/hooks/useStakeholderIssues';
import { useAuth } from '@/lib/auth/auth-context';
import StakeholderIssueModal from './StakeholderIssueModal';
import { cn } from '@/components/ui/class';

const priorityColors = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  Pending: 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
};

export default function StakeholderIssuesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const { employeeInfo } = useAuth();
  const { fetchIssuesByAssignedEmployee, issues, loading } = useStakeholderIssues();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);

  // Check if user has permission to create issues (manager or admin)
  const canCreateIssues = employeeInfo?.role === 'manager' || employeeInfo?.role === 'admin';

  useEffect(() => {
    if (employeeInfo?.id) {
      fetchIssuesByAssignedEmployee(employeeInfo.id);
    }
  }, [employeeInfo, fetchIssuesByAssignedEmployee]);

  const handleRefresh = async () => {
    if (employeeInfo?.id) {
      await fetchIssuesByAssignedEmployee(employeeInfo.id);
    }
  };

  const handleOpenModal = () => {
    setSelectedIssue(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIssue(null);
  };

  const handleIssueClick = (issueId: number) => {
    setSelectedIssue(issueId);
    setIsModalOpen(true);
  };

  const handleIssueCreated = () => {
    handleRefresh();
    handleCloseModal();
  };

  return (
    <>
      <BaseWidget config={config} isEditMode={isEditMode} onToggle={onToggle} onSizeChange={onSizeChange}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
          <div className="p-5 flex-shrink-0">
            <SectionHeader 
              title="Stakeholder Issues" 
              icon={AlertCircle} 
              iconColor="text-red-600" 
            />
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <LoadingSection text="Loading issues..." icon={AlertCircle} />
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="px-5 pb-5 flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-500">Assigned to You</h3>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleRefresh}
                    className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw size={16} className="text-gray-600" />
                  </motion.button>
                  {canCreateIssues && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenModal}
                      className="rounded-full p-2 bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <Plus size={16} className="text-white" />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                {issues.length > 0 ? (
                  issues.slice(0, 5).map((issue) => (
                    <motion.div
                      key={issue.id}
                      variants={fadeInUp}
                      onClick={() => handleIssueClick(issue.id!)}
                      className="px-4 py-3 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                          </div>
                          {issue.stakeholder && (
                            <p className="text-xs text-gray-500 truncate">
                              {typeof issue.stakeholder === 'object' ? issue.stakeholder.name : 'Stakeholder'}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 items-end flex-shrink-0">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
                            priorityColors[issue.priority]
                          )}>
                            {issue.priority}
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
                            statusColors[issue.status]
                          )}>
                            {issue.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState 
                    icon={FileText} 
                    message={canCreateIssues ? "No issues assigned to you. Click + to create one." : "No issues assigned to you"} 
                  />
                )}
              </div>
            </motion.div>
          )}
        </div>
      </BaseWidget>

      {isModalOpen && (
        <StakeholderIssueModal
          issueId={selectedIssue}
          onClose={handleCloseModal}
          onSuccess={handleIssueCreated}
        />
      )}
    </>
  );
}
