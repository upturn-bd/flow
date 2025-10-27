"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle, XCircle, Filter, Search, Building2, User } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StakeholderIssue, Stakeholder } from '@/lib/types/schemas';
import { STAKEHOLDER_ISSUE_STATUS_OPTIONS, STAKEHOLDER_ISSUE_PRIORITY_OPTIONS } from '@/lib/constants';

interface StakeholderIssueListProps {
  issues: StakeholderIssue[];
  stakeholders: Stakeholder[];
  loading: boolean;
  error: string | null;
}

export default function StakeholderIssueList({ 
  issues, 
  stakeholders, 
  loading, 
  error 
}: StakeholderIssueListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Filter issues based on search, status, and priority
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.stakeholder?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === '' || issue.status === selectedStatus;
    const matchesPriority = selectedPriority === '' || issue.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-4 w-4" />;
      case 'In Progress': return <Clock className="h-4 w-4" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4" />;
      case 'Closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8 text-purple-600" />
        <span className="ml-3 text-gray-600">Loading issues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
            >
              <option value="">All Status</option>
              {STAKEHOLDER_ISSUE_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
            >
              <option value="">All Priority</option>
              {STAKEHOLDER_ISSUE_PRIORITY_OPTIONS.map(priority => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedStatus || selectedPriority 
              ? 'Try adjusting your filters' 
              : 'No stakeholder issues have been created yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      <span className="ml-1">{issue.status}</span>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {issue.title}
                  </h3>
                  {issue.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {issue.description}
                    </p>
                  )}

                  {/* Stakeholder Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      <span>{issue.stakeholder?.name || 'Unknown Stakeholder'}</span>
                    </div>
                    {issue.assigned_to && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Assigned to Employee #{issue.assigned_to}</span>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>
                        Created {new Date(issue.created_at || '').toLocaleDateString()}
                      </span>
                      {issue.resolved_at && (
                        <span>
                          Resolved {new Date(issue.resolved_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {issue.transaction_id && (
                      <span className="text-purple-600">
                        Transaction #{issue.transaction_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex-shrink-0">
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}