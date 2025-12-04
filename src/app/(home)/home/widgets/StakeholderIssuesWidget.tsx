'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WarningCircle, Plus, ArrowsClockwise, FileText } from '@/lib/icons';
import SectionHeader from '@/app/(home)/home/components/SectionHeader';
import LoadingSection from '@/app/(home)/home/components/LoadingSection';
import EmptyState from '@/app/(home)/home/components/EmptyState';
import BaseWidget from './BaseWidget';
import { WidgetProps } from '@/lib/types/widgets';
import { useStakeholderIssues } from '@/hooks/useStakeholderIssues';
import { useAuth } from '@/lib/auth/auth-context';
import StakeholderIssueModal from './StakeholderIssueModal';
import { cn } from '@/components/ui/class';
import { useRouter } from 'next/navigation';
import NoPermissionMessage from '@/components/ui/NoPermissionMessage';
import Portal from '@/components/ui/Portal';

const priorityColors = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  Pending: 'bg-background-tertiary text-foreground-primary',
  'In Progress': 'bg-primary-100 text-primary-700',
  Resolved: 'bg-green-100 text-green-700',
};

export default function StakeholderIssuesWidget({ config, isEditMode, onToggle, onSizeChange }: WidgetProps) {
  const router = useRouter();
  const { employeeInfo, canRead, canWrite } = useAuth();
  const { fetchIssuesByAssignedEmployee, issues, loading } = useStakeholderIssues();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);

  // Check permissions
  const canViewStakeholders = canRead('stakeholders');
  const canManageStakeholders = canWrite('stakeholders');

  useEffect(() => {
    if (canViewStakeholders && employeeInfo?.id) {
      fetchIssuesByAssignedEmployee(employeeInfo.id);
    }
  }, [employeeInfo, fetchIssuesByAssignedEmployee, canViewStakeholders]);

  const handleRefresh = async () => {
    if (employeeInfo?.id) {
      await fetchIssuesByAssignedEmployee(employeeInfo.id);
    }
  };

  const handleOpenModal = () => {
    router.push('/admin/stakeholders');
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
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary h-full flex flex-col overflow-hidden">
          <div className="p-5 shrink-0">
            <SectionHeader
              title="Stakeholder Issues"
              icon={WarningCircle}
              iconColor="text-error"
            />
          </div>

          {!canViewStakeholders ? (
            <NoPermissionMessage moduleName="stakeholder issues" />
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <LoadingSection text="Loading issues..." icon={WarningCircle} />
            </div>
          ) : (
            <div
              className="px-5 pb-5 flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-medium text-foreground-secondary">Assigned to You</h3>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleRefresh}
                    className="rounded-full p-2 bg-surface-secondary hover:bg-surface-hover transition-colors"
                  >
                    <ArrowsClockwise size={16} className="text-foreground-secondary" />
                  </motion.button>
                  {canManageStakeholders && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenModal}
                      className="rounded-full p-2 bg-primary-600 hover:bg-primary-700 transition-colors"
                      title="Go to Stakeholders page"
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      onClick={() => handleIssueClick(issue.id!)}
                      className="px-4 py-3 bg-background-secondary hover:bg-surface-hover rounded-lg transition-colors border border-border-primary cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                          </div>
                          {issue.stakeholder && (
                            <p className="text-xs text-foreground-tertiary truncate">
                              {typeof issue.stakeholder === 'object' ? issue.stakeholder.name : 'Stakeholder'}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
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
                    message={canManageStakeholders ? "No issues assigned to you. Click + to go to stakeholders." : "No issues assigned to you"}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </BaseWidget>

      {isModalOpen && (
        <Portal>
          <StakeholderIssueModal
            issueId={selectedIssue}
            onClose={handleCloseModal}
            onSuccess={handleIssueCreated}
          />
        </Portal>
      )}
    </>
  );
}
