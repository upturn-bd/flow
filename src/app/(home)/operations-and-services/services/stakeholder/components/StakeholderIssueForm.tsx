"use client";

import { useState, useCallback } from 'react';
import BaseModal from '@/components/ui/modals/BaseModal';
import { useFormState } from '@/hooks/useFormState';
import { useStakeholders } from '@/hooks/useStakeholders';
import { Stakeholder, StakeholderIssueStatus, StakeholderIssuePriority } from '@/lib/types/schemas';
import { 
  STAKEHOLDER_ISSUE_STATUS_OPTIONS, 
  STAKEHOLDER_ISSUE_PRIORITY_OPTIONS 
} from '@/lib/constants';
import { validateStakeholderIssue, validationErrorsToObject } from '@/lib/validation/schemas/stakeholders';

interface StakeholderIssueFormProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholders: Stakeholder[];
  onSuccess: () => void;
}

export default function StakeholderIssueForm({ 
  isOpen, 
  onClose, 
  stakeholders, 
  onSuccess 
}: StakeholderIssueFormProps) {
  const { createStakeholderIssue } = useStakeholders();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    formValues,
    errors,
    touched,
    isDirty,
    isValid,
    handleChange,
    handleBlur,
    resetForm
  } = useFormState({
    initialData: {
      stakeholder_id: '',
      transaction_id: '',
      title: '',
      description: '',
      status: 'Open' as StakeholderIssueStatus,
      priority: 'Medium' as StakeholderIssuePriority,
      assigned_to: '',
    },
    validateFn: (data) => {
      const formattedData = {
        ...data,
        stakeholder_id: data.stakeholder_id ? Number(data.stakeholder_id) : undefined,
        transaction_id: data.transaction_id ? Number(data.transaction_id) : undefined,
        assigned_to: data.assigned_to ? Number(data.assigned_to) : undefined,
      };
      
      const validationErrors = validateStakeholderIssue(formattedData);
      return {
        success: validationErrors.length === 0,
        errors: validationErrors
      };
    },
    validationErrorsToObject
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);

      const formattedData = {
        stakeholder_id: Number(formValues.stakeholder_id),
        transaction_id: formValues.transaction_id ? Number(formValues.transaction_id) : undefined,
        title: formValues.title,
        description: formValues.description || undefined,
        status: formValues.status,
        priority: formValues.priority,
        assigned_to: formValues.assigned_to ? Number(formValues.assigned_to) : undefined,
      };

      const result = await createStakeholderIssue(formattedData);
      
      if (result.success) {
        onSuccess();
      } else {
        setSubmitError(result.error || 'Failed to create issue');
      }
      setIsSubmitting(false);
    },
    [formValues, createStakeholderIssue, onSuccess]
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Stakeholder Issue"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{submitError}</p>
          </div>
        )}

        <div className="space-y-6">
        {/* Issue Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Issue Details</h3>
          
          <div>
            <label htmlFor="stakeholder_id" className="block text-sm font-medium text-gray-700 mb-1">
              Stakeholder *
            </label>
            <select
              id="stakeholder_id"
              name="stakeholder_id"
              value={formValues.stakeholder_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.stakeholder_id && touched.stakeholder_id
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
            >
              <option value="">Select stakeholder</option>
              {stakeholders.map(stakeholder => (
                <option key={stakeholder.id} value={stakeholder.id}>
                  {stakeholder.name} - {stakeholder.stakeholder_type?.name || 'Unknown Type'}
                </option>
              ))}
            </select>
            {errors.stakeholder_id && touched.stakeholder_id && (
              <p className="mt-1 text-sm text-red-600">{errors.stakeholder_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formValues.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.title && touched.title
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Enter issue title"
            />
            {errors.title && touched.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.description && touched.description
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Describe the issue in detail"
            />
            {errors.description && touched.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formValues.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.status && touched.status
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
              >
                {STAKEHOLDER_ISSUE_STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && touched.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                value={formValues.priority}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.priority && touched.priority
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
              >
                {STAKEHOLDER_ISSUE_PRIORITY_OPTIONS.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              {errors.priority && touched.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          
          <div>
            <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700 mb-1">
              Related Transaction ID
            </label>
            <input
              type="number"
              id="transaction_id"
              name="transaction_id"
              value={formValues.transaction_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.transaction_id && touched.transaction_id
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Enter transaction ID if applicable"
            />
            {errors.transaction_id && touched.transaction_id && (
              <p className="mt-1 text-sm text-red-600">{errors.transaction_id}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional: Link this issue to a specific transaction
            </p>
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <input
              type="number"
              id="assigned_to"
              name="assigned_to"
              value={formValues.assigned_to}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.assigned_to && touched.assigned_to
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Enter employee ID to assign this issue"
            />
            {errors.assigned_to && touched.assigned_to && (
              <p className="mt-1 text-sm text-red-600">{errors.assigned_to}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional: Employee ID responsible for resolving this issue
            </p>
          </div>
        </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Issue'
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}