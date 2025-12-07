'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WarningCircle, User, Building, Tag, UsersThree, Link as LinkIcon, CaretDown, CaretRight } from "@phosphor-icons/react";
import { useStakeholderIssues, StakeholderIssueFormData } from '@/hooks/useStakeholderIssues';
import { useStakeholders } from '@/hooks/useStakeholders';
import { useStakeholderIssueCategories } from '@/hooks/useStakeholderIssueCategories';
import { useTeams } from '@/hooks/useTeams';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/components/ui/class';
import { LoadingSpinner } from '@/components/ui';
import { formatDisplayValue, getFieldLabel } from '@/lib/utils/step-data-utils';
import { FieldDefinitionsSchema, LinkedStepField } from '@/lib/types/schemas';

// Alias for backward compatibility
const Building2 = Building;

interface StakeholderIssueModalProps {
  issueId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Interface for enriched linked field data display
interface EnrichedLinkedField extends LinkedStepField {
  currentValue?: any; // Current value from step data (may have changed since linking)
}

// Interface for linked step data display (for legacy support)
interface LinkedStepDataItem {
  id: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  data: Record<string, any>;
  fieldDefinitions?: FieldDefinitionsSchema;
}

export default function StakeholderIssueModal({
  issueId,
  onClose,
  onSuccess,
}: StakeholderIssueModalProps) {
  const { employeeInfo } = useAuth();
  const { createIssue, updateIssue, fetchIssueById, fetchStakeholderStepData, loading } = useStakeholderIssues();
  const { stakeholders, fetchStakeholders } = useStakeholders();
  const { categories, fetchCategories } = useStakeholderIssueCategories();
  const { teams, fetchTeams } = useTeams();
  const { employees, fetchEmployees } = useEmployees();
  const [issue, setIssue] = useState<any>(null);
  const [loadingIssue, setLoadingIssue] = useState(!!issueId);
  const [isEditing, setIsEditing] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'employee' | 'team'>('employee');
  const [linkedFields, setLinkedFields] = useState<EnrichedLinkedField[]>([]);
  const [linkedStepData, setLinkedStepData] = useState<LinkedStepDataItem[]>([]); // Legacy support
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
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

  // Load linked step data when issue is loaded
  useEffect(() => {
    const loadLinkedData = async () => {
      if (!issue?.stakeholder_id) {
        setLinkedFields([]);
        setLinkedStepData([]);
        return;
      }
      
      try {
        const allStepData = await fetchStakeholderStepData(issue.stakeholder_id);
        
        // Handle new linked_fields format
        if (issue.linked_fields && issue.linked_fields.length > 0) {
          const enrichedFields: EnrichedLinkedField[] = issue.linked_fields.map((field: LinkedStepField) => {
            const stepData = allStepData.find((sd: any) => sd.id === field.stepDataId);
            // Get step info - handle both array and object formats from Supabase
            const stepInfo = Array.isArray(stepData?.step) ? stepData?.step[0] : stepData?.step;
            return {
              ...field,
              stepName: field.stepName || stepInfo?.name || `Step ${field.stepDataId}`,
              stepOrder: field.stepOrder || stepInfo?.step_order || 0,
              fieldLabel: field.fieldLabel || getFieldLabel(field.fieldKey, stepInfo?.field_definitions),
              currentValue: stepData?.data?.[field.fieldKey],
            };
          });
          setLinkedFields(enrichedFields);
          setLinkedStepData([]);
        }
        // Legacy support: handle old linked_step_data_ids format
        else if (issue.linked_step_data_ids && issue.linked_step_data_ids.length > 0) {
          const linked = allStepData
            .filter((sd: any) => issue.linked_step_data_ids.includes(sd.id))
            .map((sd: any) => {
              // Get step info - handle both array and object formats from Supabase
              const stepInfo = Array.isArray(sd.step) ? sd.step[0] : sd.step;
              return {
                id: sd.id,
                stepName: stepInfo?.name || `Step ${sd.step_id}`,
                stepOrder: stepInfo?.step_order || 0,
                isCompleted: sd.is_completed,
                data: sd.data || {},
                fieldDefinitions: stepInfo?.field_definitions,
              };
            })
            .sort((a: LinkedStepDataItem, b: LinkedStepDataItem) => a.stepOrder - b.stepOrder);
          
          setLinkedStepData(linked);
          setLinkedFields([]);
        } else {
          setLinkedFields([]);
          setLinkedStepData([]);
        }
      } catch (err) {
        console.error("Error loading linked data:", err);
      }
    };
    
    loadLinkedData();
  }, [issue, fetchStakeholderStepData]);

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

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
              <WarningCircle className="w-5 h-5 text-warning" />
              <h2 className="text-xl font-bold text-foreground-primary">
                {issueId ? (isEditing ? 'Edit Issue' : 'Issue Details') : 'Create Stakeholder Issue'}
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
                      issue.status === 'Resolved' && 'bg-success/10 text-success'
                    )}>
                      {issue.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">Priority</label>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-sm font-medium',
                      issue.priority === 'Low' && 'bg-success/10 text-success',
                      issue.priority === 'Medium' && 'bg-warning/10 text-warning',
                      issue.priority === 'High' && 'bg-warning/20 text-warning',
                      issue.priority === 'Urgent' && 'bg-error/10 text-error'
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

                {/* Linked Fields (new format) */}
                {linkedFields.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        <span>Linked Fields ({linkedFields.length})</span>
                      </div>
                    </label>
                    <div className="space-y-2 border border-border-primary rounded-lg p-3 bg-background-secondary">
                      {/* Group fields by step */}
                      {(() => {
                        const groupedByStep = linkedFields.reduce((acc, field) => {
                          const key = field.stepDataId;
                          if (!acc[key]) {
                            acc[key] = {
                              stepName: field.stepName || `Step ${field.stepDataId}`,
                              stepOrder: field.stepOrder || 0,
                              fields: [],
                            };
                          }
                          acc[key].fields.push(field);
                          return acc;
                        }, {} as Record<number, { stepName: string; stepOrder: number; fields: EnrichedLinkedField[] }>);
                        
                        return Object.entries(groupedByStep)
                          .sort(([, a], [, b]) => a.stepOrder - b.stepOrder)
                          .map(([stepDataId, group]) => (
                            <div key={stepDataId} className="bg-surface-primary rounded-lg border border-border-secondary overflow-hidden">
                              <div className="px-3 py-2 bg-surface-secondary border-b border-border-secondary">
                                <span className="text-xs font-medium text-foreground-secondary">
                                  {group.stepName}
                                </span>
                              </div>
                              <div className="p-3 space-y-2">
                                {group.fields.map((field) => (
                                  <div key={`${field.stepDataId}-${field.fieldKey}`} className="flex justify-between gap-4 text-sm">
                                    <span className="text-foreground-secondary font-medium">
                                      {field.fieldLabel || field.fieldKey}:
                                    </span>
                                    <span className="text-foreground-primary text-right">
                                      {formatDisplayValue(field.currentValue ?? field.fieldValue)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Legacy: Linked Step Data (old format - for backward compatibility) */}
                {linkedStepData.length > 0 && linkedFields.length === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        <span>Linked Step Data ({linkedStepData.length})</span>
                      </div>
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-border-primary rounded-lg p-3 bg-background-secondary">
                      {linkedStepData.map((stepItem) => {
                        const isExpanded = expandedSteps.has(stepItem.id);
                        return (
                          <div
                            key={stepItem.id}
                            className="bg-surface-primary rounded-lg border border-border-secondary overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleStepExpansion(stepItem.id)}
                              className="w-full flex items-center gap-2 p-3 hover:bg-surface-hover transition-colors text-left"
                            >
                              {isExpanded ? (
                                <CaretDown className="w-4 h-4 text-foreground-tertiary shrink-0" />
                              ) : (
                                <CaretRight className="w-4 h-4 text-foreground-tertiary shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-foreground-primary">
                                    Step {stepItem.stepOrder}: {stepItem.stepName}
                                  </span>
                                  {stepItem.isCompleted && (
                                    <span className="px-1.5 py-0.5 text-xs bg-success/10 dark:bg-success/20 text-success rounded">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                {!isExpanded && (
                                  <p className="text-xs text-foreground-tertiary mt-1">
                                    {Object.keys(stepItem.data).length} field{Object.keys(stepItem.data).length !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </button>
                            
                            {isExpanded && Object.keys(stepItem.data).length > 0 && (
                              <div className="px-3 pb-3 border-t border-border-secondary">
                                <div className="pt-3 space-y-2">
                                  {Object.entries(stepItem.data)
                                    .filter(([, value]) => {
                                      // Skip file fields
                                      if (typeof value === 'object' && value !== null && 'path' in (value as Record<string, unknown>)) {
                                        return false;
                                      }
                                      return true;
                                    })
                                    .map(([key, value]) => (
                                      <div key={key} className="flex justify-between gap-4 text-sm">
                                        <span className="text-foreground-secondary font-medium">
                                          {getFieldLabel(key, stepItem.fieldDefinitions)}:
                                        </span>
                                        <span className="text-foreground-primary text-right">
                                          {formatDisplayValue(value)}
                                        </span>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-border-primary">
                  {issue.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => setShowResolveConfirm(true)}
                      className="px-4 py-2 text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors font-medium"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  <div className={cn("flex gap-3", issue.status === 'Resolved' && 'ml-auto')}>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      Edit Issue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Create mode
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-1">
                    Stakeholder <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary" />
                    <select
                      value={formData.stakeholder_id}
                      onChange={(e) => setFormData({ ...formData, stakeholder_id: Number(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                    Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
                    placeholder="Enter issue title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-primary mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary disabled:opacity-50"
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
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                      className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-surface-primary"
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
                      'px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors',
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
                    'px-4 py-2 text-white bg-success hover:bg-success/90 rounded-lg transition-colors',
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
