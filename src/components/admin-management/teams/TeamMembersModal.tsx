'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MagnifyingGlass, UserPlus, Trash } from '@phosphor-icons/react';
import { TeamWithMembers } from '@/lib/types';
import { useEmployees, ExtendedEmployee } from '@/hooks/useEmployees';
import { useTeams } from '@/hooks/useTeams';
import { matchesEmployeeSearch } from '@/lib/utils/user-search';

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

  // Filter available employees (not already members) - use extendedEmployees for more info
  const availableEmployees = useMemo(() => {
    const employeeList = extendedEmployees.length > 0 ? extendedEmployees : employees;
    if (!employeeList) return [];
    return employeeList.filter((emp) => !memberIds.has(emp.id));
  }, [employees, extendedEmployees, memberIds]);

  // Filter employees by search term
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Team Members
            </h2>
            <p className="text-sm text-gray-500 mt-1">{team.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Member Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Member
              </h3>

              {/* Search Input */}
              <div className="relative mb-4">
                <MagnifyingGlass
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Employee Selection */}
              <div className="border border-gray-300 rounded-lg max-h-[300px] overflow-y-auto">
                {employeesLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading employees...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm
                      ? 'No employees found matching your search'
                      : 'All employees are already members of this team'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="employee"
                          value={employee.id}
                          checked={selectedEmployeeId === employee.id}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {employee.name}
                          </div>
                          {(employee as ExtendedEmployee).email && (
                            <div className="text-sm text-gray-500">
                              {(employee as ExtendedEmployee).email}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddMember}
                disabled={!selectedEmployeeId || teamLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus size={20} />
                {teamLoading ? 'Adding...' : 'Add to Team'}
              </button>
            </div>

            {/* Current Members Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Members ({teamMembers.length})
              </h3>

              <div className="border border-gray-300 rounded-lg max-h-[400px] overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No members in this team yet
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    <AnimatePresence>
                      {teamMembers.map((member) => (
                        <motion.div
                          key={member.employee_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {member.employee_name || 'Unknown Employee'}
                            </div>
                            {member.employee_email && (
                              <div className="text-sm text-gray-500">
                                {member.employee_email}
                              </div>
                            )}
                            {member.joined_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                Added {new Date(member.joined_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.employee_id)}
                            disabled={teamLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove from team"
                          >
                            <Trash size={20} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
