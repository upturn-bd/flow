'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, MagnifyingGlass, UserPlus, TrashSimple, Users } from "@phosphor-icons/react";
import { TeamWithMembers } from '@/lib/types';
import { useEmployees, ExtendedEmployee } from '@/hooks/useEmployees';
import { useTeams } from '@/hooks/useTeams';
import { matchesEmployeeSearch } from '@/lib/utils/user-search';
import InlineSpinner from '@/components/ui/InlineSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWithMembers;
  onMembersUpdated: () => void;
}

export default function TeamMembersModal({
  isOpen,
  onClose,
  team,
  onMembersUpdated,
}: TeamMembersModalProps) {
  const { employees, extendedEmployees, fetchEmployees, fetchExtendedEmployees, loading: employeesLoading } = useEmployees();
  const { addTeamMember, removeTeamMember, loading: teamLoading } = useTeams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Fetch employees when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExtendedEmployees();
    }
  }, [isOpen, fetchExtendedEmployees]);

  // Get current member IDs
  const memberIds = useMemo(
    () => new Set(team.members?.map((m) => m.employee_id) || []),
    [team.members]
  );

  // FunnelSimple available employees (not already members) - use extendedEmployees for more info
  const availableEmployees = useMemo(() => {
    const employeeList = extendedEmployees.length > 0 ? extendedEmployees : employees;
    if (!employeeList) return [];
    return employeeList.filter((emp) => !memberIds.has(emp.id));
  }, [employees, extendedEmployees, memberIds]);

  // FunnelSimple employees by search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return availableEmployees;
    return availableEmployees.filter(emp => 
      matchesEmployeeSearch(emp, searchTerm)
    );
  }, [availableEmployees, searchTerm]);

  // Current team members - data is already populated in team.members
  const teamMembers = useMemo(() => {
    if (!team.members) return [];
    // The members already have employee_name and employee_email from the query
    return team.members;
  }, [team.members]);

  const handleAddMember = async () => {
    if (!selectedEmployeeId || !team.id) return;

    const result = await addTeamMember(team.id, selectedEmployeeId);
    if (result.success) {
      setSelectedEmployeeId('');
      setSearchTerm('');
      onMembersUpdated();
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!team.id) return;
    
    if (confirm('Are you sure you want to remove this member from the team?')) {
      const result = await removeTeamMember(team.id, employeeId);
      if (result.success) {
        onMembersUpdated();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-primary rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-primary bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30">
          <div>
            <h2 className="text-2xl font-bold text-foreground-primary">
              Team Members
            </h2>
            <p className="text-sm text-foreground-tertiary mt-1 flex items-center gap-2">
              <span className="font-medium text-primary-600">{team.name}</span>
              <span className="text-foreground-tertiary">•</span>
              <span>{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-foreground-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Add New Member Section */}
            <div className="lg:col-span-2">
              <div className="sticky top-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                    <UserPlus size={20} className="text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground-primary">
                    Add New Member
                  </h3>
                </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <MagnifyingGlass
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
                />
                <input
                  type="text"
                  placeholder="Search by name, email, or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm bg-surface-primary text-foreground-primary"
                />
              </div>

              {/* Employee Selection */}
              <div className="border-2 border-border-primary rounded-xl overflow-hidden bg-surface-primary shadow-sm">
                <div className="max-h-[350px] overflow-y-auto">
                  {employeesLoading ? (
                    <div className="p-8 text-center text-foreground-tertiary">
                      <InlineSpinner size="md" color="primary" className="mx-auto mb-2" />
                      <p className="text-sm">Loading employees...</p>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <EmptyState
                      icon={MagnifyingGlass}
                      title={searchTerm ? 'No employees found' : 'All employees are members'}
                      description={searchTerm ? 'Try a different search term' : 'Everyone is already on this team'}
                    />
                  ) : (
                    <div className="divide-y divide-border-primary">
                      {filteredEmployees.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex gap-3 p-4 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer transition-colors group"
                        >
                          <div className="items-center flex">
                            <input
                              type="radio"
                              name="employee"
                              value={employee.id}
                              checked={selectedEmployeeId === employee.id}
                              onChange={(e) => setSelectedEmployeeId(e.target.value)}
                              className="w-4 h-4 text-primary-600 border-border-secondary focus:ring-primary-500 focus:ring-2"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground-primary truncate">
                              {employee.name}
                            </div>
                            {(employee as ExtendedEmployee).email && (
                              <div className="text-sm text-foreground-tertiary truncate">
                                {(employee as ExtendedEmployee).email}
                              </div>
                            )}
                            {(employee as ExtendedEmployee).designation && (
                              <div className="text-xs text-foreground-tertiary mt-0.5 truncate">
                                {(employee as ExtendedEmployee).designation}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddMember}
                disabled={!selectedEmployeeId || teamLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
              >
                <UserPlus size={20} />
                {teamLoading ? 'Adding...' : 'Add to Team'}
              </button>
              </div>
            </div>

            {/* Current Members Section */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Users size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground-primary">
                    Current Members
                  </h3>
                </div>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
                  {teamMembers.length}
                </span>
              </div>

              <div className="border-2 border-border-primary rounded-xl overflow-hidden bg-surface-primary shadow-sm">
                <div className="max-h-[500px] overflow-y-auto">
                  {teamMembers.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="bg-background-secondary rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Users size={32} className="text-foreground-tertiary" />
                      </div>
                      <p className="text-foreground-secondary font-medium text-lg">No members yet</p>
                      <p className="text-sm text-foreground-tertiary mt-2">Start by adding team members from the left</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-primary">
                      {teamMembers.map((member) => (
                        <div
                          key={member.employee_id}
                          className="flex items-center justify-between p-4 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors group"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                                {(member.employee_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground-primary truncate">
                                  {member.employee_name || 'Unknown Employee'}
                                </div>
                                {member.employee_email && (
                                  <div className="text-sm text-foreground-tertiary truncate">
                                    {member.employee_email}
                                  </div>
                                )}
                              </div>
                            </div>
                            {member.joined_at && (
                              <div className="text-xs text-foreground-tertiary mt-2 ml-12">
                                Added {new Date(member.joined_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.employee_id)}
                            disabled={teamLoading}
                            className="p-2 text-error hover:bg-error/10 dark:hover:bg-error/20 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 shrink-0"
                            title="Remove from team"
                          >
                            <TrashSimple size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-primary bg-background-secondary">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-foreground-secondary bg-surface-primary border-2 border-border-secondary rounded-lg hover:bg-surface-hover active:scale-[0.98] transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
