'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WarningCircle, User, Building, Tag, UsersThree } from "@phosphor-icons/react";
import { useStakeholderIssues, StakeholderIssueFormData } from '@/hooks/useStakeholderIssues';
import { useStakeholders } from '@/hooks/useStakeholders';
import { useStakeholderIssueCategories } from '@/hooks/useStakeholderIssueCategories';
import { useTeams } from '@/hooks/useTeams';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/components/ui/class';
import { LoadingSpinner } from '@/components/ui';

// Alias for backward compatibility
const Building2 = Building;

interface StakeholderIssueModalProps {
  issueId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StakeholderIssueModal({
  issueId,
  onClose,
  onSuccess,
}: StakeholderIssueModalProps) {
  const { employeeInfo } = useAuth();
  const { createIssue, updateIssue, fetchIssueById, loading } = useStakeholderIssues();
  const { stakeholders, fetchStakeholders } = useStakeholders();
  const { categories, fetchCategories } = useStakeholderIssueCategories();
  const { teams, fetchTeams } = useTeams();
  const { employees, fetchEmployees } = useEmployees();
  const [issue, setIssue] = useState<any>(null);
  const [loadingIssue, setLoadingIssue] = useState(!!issueId);
  const [isEditing, setIsEditing] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'employee' | 'team'>('employee');
  const [formData, setFormData] = useState<Partial<StakeholderIssueFormData>>({
    stakeholder_id: 0,
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    assigned_to: employeeInfo?.id,
    assigned_team_id: undefined,
    category_id: undefined,
    subcategory_id: undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const availableSubcategories = selectedCategory?.subcategories?.filter(s => s.is_active) || [];

  useEffect(() => {
    if (issueId) {
      loadIssue();
    }
    loadStakeholders();
    fetchCategories();
    fetchTeams();
    fetchEmployees();
  }, [issueId]);

  const loadIssue = async () => {
    if (!issueId) return;
    setLoadingIssue(true);
    const data = await fetchIssueById(issueId);
    if (data) {
      setIssue(data);
      // Set assignment type based on existing data
      setAssignmentType(data.assigned_team_id ? 'team' : 'employee');
      // Populate form data for editing
      setFormData({
        stakeholder_id: data.stakeholder_id,
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        assigned_to: data.assigned_to,
        assigned_team_id: data.assigned_team_id,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
      });
    }
    setLoadingIssue(false);
  };

  const loadStakeholders = async () => {
    await fetchStakeholders();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.stakeholder_id) return;

    setSubmitting(true);
    try {
      if (issueId) {
        await updateIssue(issueId, formData as StakeholderIssueFormData);
      } else {
        await createIssue(formData as StakeholderIssueFormData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving issue:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsResolved = async () => {
    if (!issueId) return;
    setSubmitting(true);
    try {
      await updateIssue(issueId, { status: 'Resolved' });
      setShowResolveConfirm(false);
      onSuccess();
    } catch (error) {
      console.error('Error resolving issue:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isViewMode = !!issueId && !isEditing;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-surface-primary rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-surface-primary border-b border-border-primary px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WarningCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-foreground-primary">
                {issueId ? (isEditing ? 'PencilSimple Issue' : 'Issue Details') : 'Create Stakeholder Issue'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>

          <div className="p-6">
            {loadingIssue ? (
              // Loading state
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner text="Loading issue details..." />
              </div>
            ) : isViewMode && issue ? (
              // View mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Title</label>
                  <p className="text-base font-semibold">{issue.title}</p>
                </div>
                
                {issue.stakeholder && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Stakeholder</label>
                    <p className="text-base">
                      {typeof issue.stakeholder === 'object' ? issue.stakeholder.name : 'Unknown'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Description</label>
                  <p className="text-base text-foreground-secondary">{issue.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Status</label>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-sm font-medium',
                      issue.status === 'Pending' && 'bg-background-tertiary text-foreground-primary',
                      issue.status === 'In Progress' && 'bg-primary-100 text-primary-700',
                      issue.status === 'Resolved' && 'bg-green-100 text-green-700'
                    )}>
                      {issue.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Priority</label>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-sm font-medium',
                      issue.priority === 'Low' && 'bg-green-100 text-green-700',
                      issue.priority === 'Medium' && 'bg-yellow-100 text-yellow-700',
                      issue.priority === 'High' && 'bg-orange-100 text-orange-700',
                      issue.priority === 'Urgent' && 'bg-red-100 text-red-700'
                    )}>
                      {issue.priority}
                    </span>
                  </div>
                </div>

                {/* Category & Subcategory */}
                {issue.category && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Category</label>
                    <div className="flex items-center gap-2">
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: issue.category.color }}
                      >
                        <Tag className="w-3 h-3" />
                        {issue.category.name}
                        {issue.subcategory && (
                          <span className="opacity-75">/ {issue.subcategory.name}</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Assignment - Employee or Team */}
                {(issue.assigned_employee || issue.assigned_team) && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Assigned To</label>
                    <div className="flex items-center gap-2">
                      {issue.assigned_team ? (
                        <>
                          <UsersThree className="w-4 h-4 text-foreground-tertiary" />
                          <span>{issue.assigned_team.name} (Team)</span>
                        </>
                      ) : issue.assigned_employee ? (
                        <>
                          <User className="w-4 h-4 text-foreground-tertiary" />
                          <span>{issue.assigned_employee.name}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-border-primary">
                  {issue.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => setShowResolveConfirm(true)}
                      className="px-4 py-2 text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors font-medium"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  <div className={cn("flex gap-3", issue.status === 'Resolved' && 'ml-auto')}>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      PencilSimple Issue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Create mode
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-1">
                    Stakeholder <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary" />
                    <select
                      value={formData.stakeholder_id}
                      onChange={(e) => setFormData({ ...formData, stakeholder_id: Number(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                      required
                    >
                      <option value={0}>Select a stakeholder</option>
                      {stakeholders.map((stakeholder) => (
                        <option key={stakeholder.id} value={stakeholder.id}>
                          {stakeholder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    placeholder="Enter issue title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    placeholder="Enter issue description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-primary mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-primary mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-primary mb-1">Category</label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => {
                        const categoryId = e.target.value ? Number(e.target.value) : undefined;
                        setFormData({ 
                          ...formData, 
                          category_id: categoryId,
                          subcategory_id: undefined // Reset subcategory when category changes
                        });
                      }}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    >
                      <option value="">No category</option>
                      {categories.filter(c => c.is_active).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-primary mb-1">Subcategory</label>
                    <select
                      value={formData.subcategory_id || ''}
                      onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value ? Number(e.target.value) : undefined })}
                      disabled={!formData.category_id || availableSubcategories.length === 0}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary disabled:opacity-50"
                    >
                      <option value="">No subcategory</option>
                      {availableSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assignment Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-2">Assign To</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentType('employee');
                        setFormData({ ...formData, assigned_team_id: undefined });
                      }}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                        assignmentType === 'employee'
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'border-border-primary text-foreground-secondary hover:bg-surface-hover'
                      )}
                    >
                      <User className="w-4 h-4" />
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentType('team');
                        setFormData({ ...formData, assigned_to: undefined });
                      }}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                        assignmentType === 'team'
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'border-border-primary text-foreground-secondary hover:bg-surface-hover'
                      )}
                    >
                      <UsersThree className="w-4 h-4" />
                      Team
                    </button>
                  </div>

                  {assignmentType === 'employee' ? (
                    <select
                      value={formData.assigned_to || ''}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    >
                      <option value="">No assignee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={formData.assigned_team_id || ''}
                      onChange={(e) => setFormData({ ...formData, assigned_team_id: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-surface-primary"
                    >
                      <option value="">No team assigned</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (issueId && isEditing) {
                        setIsEditing(false);
                      } else {
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-foreground-primary bg-background-tertiary hover:bg-background-secondary rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.title || !formData.stakeholder_id}
                    className={cn(
                      'px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors',
                      (submitting || !formData.title || !formData.stakeholder_id) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {submitting ? (issueId ? 'Updating...' : 'Creating...') : (issueId ? 'Update Issue' : 'Create Issue')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Resolve Confirmation Dialog */}
        {showResolveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 flex items-center justify-center z-10"
            onClick={() => setShowResolveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-primary rounded-lg shadow-xl p-6 max-w-md mx-4"
            >
              <h3 className="text-lg font-bold text-foreground-primary mb-2">Mark as Resolved?</h3>
              <p className="text-foreground-secondary mb-6">
                Are you sure you want to mark this issue as resolved? This action can be undone later by editing the issue.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResolveConfirm(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-foreground-primary bg-background-tertiary hover:bg-background-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkAsResolved}
                  disabled={submitting}
                  className={cn(
                    'px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors',
                    submitting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {submitting ? 'Resolving...' : 'Mark as Resolved'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
