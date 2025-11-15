'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, User, Building2 } from 'lucide-react';
import { useStakeholderIssues, StakeholderIssueFormData } from '@/hooks/useStakeholderIssues';
import { useStakeholders } from '@/hooks/useStakeholders';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/components/ui/class';

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
  const { createIssue, fetchIssueById, loading } = useStakeholderIssues();
  const { stakeholders, fetchStakeholders } = useStakeholders();
  const [issue, setIssue] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<StakeholderIssueFormData>>({
    stakeholder_id: 0,
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    assigned_to: employeeInfo?.id,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (issueId) {
      loadIssue();
    }
    loadStakeholders();
  }, [issueId]);

  const loadIssue = async () => {
    if (!issueId) return;
    const data = await fetchIssueById(issueId);
    if (data) {
      setIssue(data);
    }
  };

  const loadStakeholders = async () => {
    await fetchStakeholders();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.stakeholder_id) return;

    setSubmitting(true);
    try {
      await createIssue(formData as StakeholderIssueFormData);
      onSuccess();
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isViewMode = !!issueId;

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
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-800">
                {isViewMode ? 'Issue Details' : 'Create Stakeholder Issue'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {isViewMode && issue ? (
              // View mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-base font-semibold">{issue.title}</p>
                </div>
                
                {issue.stakeholder && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stakeholder</label>
                    <p className="text-base">
                      {typeof issue.stakeholder === 'object' ? issue.stakeholder.name : 'Unknown'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-base text-gray-600">{issue.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-sm font-medium',
                      issue.status === 'Pending' && 'bg-gray-100 text-gray-700',
                      issue.status === 'In Progress' && 'bg-blue-100 text-blue-700',
                      issue.status === 'Resolved' && 'bg-green-100 text-green-700'
                    )}>
                      {issue.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
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

                {issue.assigned_employee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{issue.assigned_employee.name}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Create mode
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stakeholder <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.stakeholder_id}
                      onChange={(e) => setFormData({ ...formData, stakeholder_id: Number(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter issue title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter issue description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
                    {submitting ? 'Creating...' : 'Create Issue'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
