'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
    if (team.permissions) {
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
    const permissionsArray = Object.entries(permissions).map(([moduleName, perms]) => {
      const permission = allPermissions.find(p => p.module_name === moduleName);
      if (!permission?.id) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configure Team Permissions
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading permissions...</div>
            </div>
          ) : (
            <div className="space-y-8">{(Object.entries(MODULE_CATEGORIES) as [PermissionCategory, string][]).map(
              ([categoryKey, categoryName]) => {
                const modules = modulesByCategory[categoryKey];
                if (modules.length === 0) return null;

                return (
                  <div key={categoryKey} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {categoryName}
                      </h3>
                    </div>

                    {/* Permission Matrix */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                              Module
                            </th>
                            {Object.values(PERMISSION_ACTIONS).map((action) => (
                              <th
                                key={action}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span>{action}</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleSelectAll(categoryKey, `can_${action.toLowerCase()}` as keyof PermissionState[string])}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                      title="Select all"
                                    >
                                      All
                                    </button>
                                    <span className="text-gray-400">|</span>
                                    <button
                                      onClick={() => handleClearAll(categoryKey, `can_${action.toLowerCase()}` as keyof PermissionState[string])}
                                      className="text-xs text-gray-600 hover:text-gray-800"
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
                        <tbody className="bg-white divide-y divide-gray-200">
                          {modules.map((module) => (
                            <tr key={module.name} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {module.displayName}
                                </div>
                                {module.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {module.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[module.name]?.can_read || false}
                                  onChange={() => handlePermissionToggle(module.name, 'can_read')}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[module.name]?.can_write || false}
                                  onChange={() => handlePermissionToggle(module.name, 'can_write')}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[module.name]?.can_delete || false}
                                  onChange={() => handlePermissionToggle(module.name, 'can_delete')}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[module.name]?.can_approve || false}
                                  onChange={() => handlePermissionToggle(module.name, 'can_approve')}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[module.name]?.can_comment || false}
                                  onChange={() => handlePermissionToggle(module.name, 'can_comment')}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
            )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FloppyDisk size={20} />
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
