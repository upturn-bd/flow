'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, FloppyDisk } from '@phosphor-icons/react';
import { TeamWithPermissions, TeamPermission, PermissionCategory, Permission } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useTeams } from '@/hooks/useTeams';
import { 
  PERMISSION_ACTIONS, 
  MODULE_CATEGORIES,
  MODULE_INFO,
  ModuleInfo,
} from '@/lib/constants';

interface TeamPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWithPermissions;
  onPermissionsUpdated: () => void;
}

interface PermissionState {
  [moduleName: string]: {
    can_read: boolean;
    can_write: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_comment: boolean;
  };
}

export default function TeamPermissionsModal({
  isOpen,
  onClose,
  team,
  onPermissionsUpdated,
}: TeamPermissionsModalProps) {
  const { updateTeamPermissions, loading } = useTeams();
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Fetch all permissions from database
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('permissions')
          .select('*')
          .order('category', { ascending: true });

        if (error) throw error;
        if (data) setAllPermissions(data);
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, []);

  // Initialize permissions from team data
  useEffect(() => {
    if (team.permissions && team.permissions.length > 0) {
      const initialPermissions: PermissionState = {};
      
      // Initialize all modules with false
      Object.values(MODULE_INFO).forEach((module) => {
        initialPermissions[module.name] = {
          can_read: false,
          can_write: false,
          can_delete: false,
          can_approve: false,
          can_comment: false,
        };
      });

      // Set permissions from team data
      team.permissions.forEach((perm) => {
        if (perm.module_name) {
          initialPermissions[perm.module_name] = {
            can_read: perm.can_read,
            can_write: perm.can_write,
            can_delete: perm.can_delete,
            can_approve: perm.can_approve,
            can_comment: perm.can_comment,
          };
        }
      });

      setPermissions(initialPermissions);
    }
  }, [team.permissions]);

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    const grouped: Record<PermissionCategory, ModuleInfo[]> = {
      workflow: [],
      services: [],
      operations: [],
      admin: [],
    };

    Object.values(MODULE_INFO).forEach((module) => {
      grouped[module.category].push(module);
    });

    return grouped;
  }, []);

  const handlePermissionToggle = (moduleName: string, action: keyof PermissionState[string]) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [action]: !prev[moduleName]?.[action],
      },
    }));
  };

  const handleSelectAll = (category: PermissionCategory, action: keyof PermissionState[string]) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      modulesByCategory[category].forEach((module) => {
        if (!updated[module.name]) {
          updated[module.name] = {
            can_read: false,
            can_write: false,
            can_delete: false,
            can_approve: false,
            can_comment: false,
          };
        }
        updated[module.name] = {
          ...updated[module.name],
          [action]: true,
        };
      });
      return updated;
    });
  };

  const handleClearAll = (category: PermissionCategory, action: keyof PermissionState[string]) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      modulesByCategory[category].forEach((module) => {
        if (!updated[module.name]) {
          updated[module.name] = {
            can_read: false,
            can_write: false,
            can_delete: false,
            can_approve: false,
            can_comment: false,
          };
        }
        updated[module.name] = {
          ...updated[module.name],
          [action]: false,
        };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!team.id) return;

    setIsSaving(true);

    // Transform permissions state into array format expected by API
    // Use team.permissions to get permission_id since it already has the data
    const permissionsArray = Object.entries(permissions).map(([moduleName, perms]) => {
      // First try to find in team.permissions (already has permission_id)
      const existingPerm = team.permissions?.find(p => p.module_name === moduleName);
      if (existingPerm?.permission_id) {
        return {
          permission_id: existingPerm.permission_id,
          can_read: perms.can_read,
          can_write: perms.can_write,
          can_delete: perms.can_delete,
          can_approve: perms.can_approve,
          can_comment: perms.can_comment,
        };
      }
      
      // Fallback to allPermissions if available
      const permission = allPermissions.find(p => p.module_name === moduleName);
      if (!permission?.id) {
        console.warn(`No permission_id found for module: ${moduleName}`);
        return null;
      }

      return {
        permission_id: permission.id,
        can_read: perms.can_read,
        can_write: perms.can_write,
        can_delete: perms.can_delete,
        can_approve: perms.can_approve,
        can_comment: perms.can_comment,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    const result = await updateTeamPermissions(team.id, permissionsArray);
    setIsSaving(false);

    if (result.success) {
      onPermissionsUpdated();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Configure Permissions
            </h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span className="font-medium text-purple-600">{team.name}</span>
              <span className="text-gray-400">•</span>
              <span>Set granular access controls</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loadingPermissions ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <div className="text-gray-600 font-medium">Loading permissions...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Iterate over permission categories */}
              {(Object.entries(modulesByCategory) as [PermissionCategory, ModuleInfo[]][]).map(
                ([categoryKey, modules]) => {
                  if (!modules || modules.length === 0) return null;

                  // Get category display name
                  const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

                  return (
                    <div key={categoryKey} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2">
                        <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                          {categoryName} Permissions
                        </h3>
                      </div>

                      {/* Permission Matrix */}
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/3 sticky left-0 bg-gray-50">
                                  Module
                                </th>
                                {Object.values(PERMISSION_ACTIONS).map((action) => (
                                  <th
                                    key={action}
                                    className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider"
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <span>{action}</span>
                                      <div className="flex gap-1.5 text-xs font-normal normal-case">
                                        <button
                                          onClick={() => handleSelectAll(categoryKey, `can_${action.toLowerCase()}` as keyof PermissionState[string])}
                                          className="px-2 py-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors font-medium"
                                          title="Select all"
                                        >
                                          All
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                          onClick={() => handleClearAll(categoryKey, `can_${action.toLowerCase()}` as keyof PermissionState[string])}
                                          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors font-medium"
                                          title="Clear all"
                                        >
                                          None
                                        </button>
                                      </div>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {modules.map((module) => (
                                <tr key={module.name} className="hover:bg-purple-50/50 transition-colors">
                                  <td className="px-6 py-4 sticky left-0 bg-white">
                                    <div className="font-semibold text-gray-900">
                                      {module.displayName}
                                    </div>
                                    {module.description && (
                                      <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {module.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={permissions[module.name]?.can_read || false}
                                      onChange={() => handlePermissionToggle(module.name, 'can_read')}
                                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={permissions[module.name]?.can_write || false}
                                      onChange={() => handlePermissionToggle(module.name, 'can_write')}
                                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={permissions[module.name]?.can_delete || false}
                                      onChange={() => handlePermissionToggle(module.name, 'can_delete')}
                                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={permissions[module.name]?.can_approve || false}
                                      onChange={() => handlePermissionToggle(module.name, 'can_approve')}
                                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={permissions[module.name]?.can_comment || false}
                                      onChange={() => handlePermissionToggle(module.name, 'can_comment')}
                                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                );
              }
            )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
          <p className="text-sm text-gray-600">
            Changes will apply to all team members
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              <FloppyDisk size={20} />
              {isSaving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
