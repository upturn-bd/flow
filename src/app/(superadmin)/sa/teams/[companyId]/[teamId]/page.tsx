"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Team, TeamMember, TeamPermission, Permission } from "@/lib/types/schemas";
import { 
  ArrowLeft, 
  UserPlus, 
  Trash, 
  MagnifyingGlass, 
  Shield,
  X, 
  FloppyDisk,
  Spinner,
  Check,
  Warning,
  Star,
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
  CheckCircle,
  Pencil,
  Users
} from "@phosphor-icons/react";
import { filterEmployeesBySearch } from "@/lib/utils/user-search";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface EmployeeSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  designation?: string;
}

interface TeamMemberWithEmployee extends TeamMember {
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    designation?: string;
  };
}

interface TeamPermissionWithModule extends TeamPermission {
  permission?: Permission;
}

// Local permission state for batched updates
interface LocalPermissionState {
  [permissionId: number]: {
    can_read: boolean;
    can_write: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_comment: boolean;
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const companyId = parseInt(params.companyId as string);
  const teamId = parseInt(params.teamId as string);
  const isValidParams = !isNaN(companyId) && !isNaN(teamId) && companyId > 0 && teamId > 0;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMemberWithEmployee[]>([]);
  const [permissions, setPermissions] = useState<TeamPermissionWithModule[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local permission state for batched updates
  const [localPermissions, setLocalPermissions] = useState<LocalPermissionState>({});
  const [permissionsDirty, setPermissionsDirty] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  
  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    workflow: true,
    services: true,
    operations: true,
    admin: true,
  });
  
  // Team editing
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editedTeam, setEditedTeam] = useState({ name: "", description: "" });
  const [savingTeam, setSavingTeam] = useState(false);
  
  // Add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  
  // Member to remove
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberWithEmployee | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  useEffect(() => {
    if (!isValidParams) {
      toast.error("Invalid team or company ID");
      router.push("/sa/teams");
      return;
    }
    
    fetchTeamData();
    fetchAllPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isValidParams]);

  // Initialize local permissions when permissions are loaded
  useEffect(() => {
    const localState: LocalPermissionState = {};
    allPermissions.forEach(perm => {
      const existingPerm = permissions.find(p => p.permission_id === perm.id);
      localState[perm.id!] = {
        can_read: existingPerm?.can_read ?? false,
        can_write: existingPerm?.can_write ?? false,
        can_delete: existingPerm?.can_delete ?? false,
        can_approve: existingPerm?.can_approve ?? false,
        can_comment: existingPerm?.can_comment ?? false,
      };
    });
    setLocalPermissions(localState);
    setPermissionsDirty(false);
  }, [permissions, allPermissions]);

  const fetchTeamData = useCallback(async () => {
    if (!isValidParams) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .eq("company_id", companyId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);
      setEditedTeam({ name: teamData.name, description: teamData.description || "" });

      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select(`
          *,
          employee:employees!team_members_employee_id_fkey(id, first_name, last_name, email, designation)
        `)
        .eq("team_id", teamId);

      if (membersError) throw membersError;
      setMembers((membersData as TeamMemberWithEmployee[]) || []);

      const { data: permissionsData, error: permissionsError } = await supabase
        .from("team_permissions")
        .select(`*, permission:permissions(*)`)
        .eq("team_id", teamId);

      if (permissionsError) throw permissionsError;
      setPermissions((permissionsData as TeamPermissionWithModule[]) || []);
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [isValidParams, teamId, companyId]);

  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("category", { ascending: true })
        .order("display_name", { ascending: true });

      if (error) throw error;
      setAllPermissions(data || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, designation")
        .eq("company_id", companyId)
        .order("first_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Handle local permission change (no API call)
  const handleLocalPermissionChange = (permissionId: number, action: string, value: boolean) => {
    setLocalPermissions(prev => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        [action]: value,
      },
    }));
    setPermissionsDirty(true);
  };

  // Batch save permissions
  const savePermissions = async () => {
    setSavingPermissions(true);
    try {
      // Delete all existing permissions for this team
      await supabase
        .from("team_permissions")
        .delete()
        .eq("team_id", teamId);

      // Insert new permissions (only those with at least one true value)
      const permissionsToInsert = Object.entries(localPermissions)
        .filter(([, perms]) => 
          perms.can_read || perms.can_write || perms.can_delete || perms.can_approve || perms.can_comment
        )
        .map(([permissionId, perms]) => ({
          team_id: teamId,
          permission_id: parseInt(permissionId),
          ...perms,
        }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from("team_permissions")
          .insert(permissionsToInsert);
        
        if (error) throw error;
      }

      toast.success("Permissions saved successfully");
      setPermissionsDirty(false);
      
      // Refetch to sync state
      const { data: permissionsData } = await supabase
        .from("team_permissions")
        .select(`*, permission:permissions(*)`)
        .eq("team_id", teamId);
      
      setPermissions((permissionsData as TeamPermissionWithModule[]) || []);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Reset permissions to saved state
  const resetPermissions = () => {
    const localState: LocalPermissionState = {};
    allPermissions.forEach(perm => {
      const existingPerm = permissions.find(p => p.permission_id === perm.id);
      localState[perm.id!] = {
        can_read: existingPerm?.can_read ?? false,
        can_write: existingPerm?.can_write ?? false,
        can_delete: existingPerm?.can_delete ?? false,
        can_approve: existingPerm?.can_approve ?? false,
        can_comment: existingPerm?.can_comment ?? false,
      };
    });
    setLocalPermissions(localState);
    setPermissionsDirty(false);
  };

  // Save team details
  const saveTeamDetails = async () => {
    if (!editedTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setSavingTeam(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: editedTeam.name.trim(),
          description: editedTeam.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamId);

      if (error) throw error;

      setTeam(prev => prev ? { ...prev, name: editedTeam.name.trim(), description: editedTeam.description.trim() || undefined } : null);
      setIsEditingTeam(false);
      toast.success("Team details updated");
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    } finally {
      setSavingTeam(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedEmployee) return;

    setAddingMember(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("team_members").insert([{
        team_id: teamId,
        employee_id: selectedEmployee.id,
        added_by: user?.id,
      }]);

      if (error) {
        if (error.code === '23505') {
          toast.error("This employee is already a member of this team");
        } else {
          throw error;
        }
      } else {
        // Add to local state
        const newMember: TeamMemberWithEmployee = {
          team_id: teamId,
          employee_id: selectedEmployee.id,
          employee: selectedEmployee,
          joined_at: new Date().toISOString(),
        };
        setMembers(prev => [...prev, newMember]);
        
        toast.success("Team member added successfully");
        setShowAddMemberModal(false);
        setSelectedEmployee(null);
        setSearchTerm("");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemovingMember(true);
    try {
      const { error } = await supabase.from("team_members").delete().eq("id", memberToRemove.id);
      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
      toast.success("Team member removed");
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    } finally {
      setRemovingMember(false);
    }
  };

  // Filter employees for search (exclude already members)
  const filteredEmployees = useMemo(() => {
    const memberIds = new Set(members.map(m => m.employee_id));
    const availableEmployees = employees.filter(e => !memberIds.has(e.id));
    
    return filterEmployeesBySearch(
      availableEmployees.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        designation: emp.designation,
      })),
      searchTerm
    );
  }, [employees, members, searchTerm]);

  // Toggle all permissions in a category
  const toggleCategoryPermissions = (category: string, action: string, value: boolean) => {
    const categoryPermissions = allPermissions.filter(p => p.category === category);
    const updates: LocalPermissionState = { ...localPermissions };
    
    categoryPermissions.forEach(perm => {
      if (updates[perm.id!]) {
        updates[perm.id!] = {
          ...updates[perm.id!],
          [action]: value,
        };
      }
    });
    
    setLocalPermissions(updates);
    setPermissionsDirty(true);
  };

  // Check if all permissions in category have a specific action
  const getCategoryActionState = (category: string, action: string): boolean | 'indeterminate' => {
    const categoryPermissions = allPermissions.filter(p => p.category === category);
    if (categoryPermissions.length === 0) return false;
    
    const checkedCount = categoryPermissions.filter(p => 
      localPermissions[p.id!]?.[action as keyof typeof localPermissions[number]]
    ).length;
    
    if (checkedCount === 0) return false;
    if (checkedCount === categoryPermissions.length) return true;
    return 'indeterminate';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size={40} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Warning size={48} className="text-amber-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Team not found</p>
          <button
            onClick={() => router.push("/sa/teams")}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/sa/teams")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          
          {isEditingTeam ? (
            <div className="space-y-3 flex-1">
              <input
                type="text"
                value={editedTeam.name}
                onChange={(e) => setEditedTeam(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold text-gray-900 w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Team name"
                autoFocus
              />
              <textarea
                value={editedTeam.description}
                onChange={(e) => setEditedTeam(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-600 resize-none"
                placeholder="Team description (optional)"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditingTeam(false);
                    setEditedTeam({ name: team.name, description: team.description || "" });
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTeamDetails}
                  disabled={savingTeam}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {savingTeam ? <Spinner size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                {team.is_default && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    <Star size={12} weight="fill" />
                    Default
                  </span>
                )}
                <button
                  onClick={() => setIsEditingTeam(true)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit team details"
                >
                  <Pencil size={18} />
                </button>
              </div>
              <p className="text-gray-600 mt-1">{team.description || "No description"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchEmployees();
              setShowAddMemberModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <UserPlus size={18} />
            <span>Add Member</span>
          </button>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No members yet</p>
            <p className="text-sm text-gray-400 mt-1">Add employees to this team</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id || member.employee_id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {member.employee?.first_name?.[0]}{member.employee?.last_name?.[0]}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.employee ? `${member.employee.first_name} ${member.employee.last_name}` : "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{member.employee?.email}</span>
                      {member.employee?.designation && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>{member.employee.designation}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMemberToRemove(member)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove member"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Permissions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-purple-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Permissions</h2>
              <p className="text-sm text-gray-500">Configure what this team can access</p>
            </div>
          </div>
          
          {/* Save/Reset buttons */}
          <div className="flex items-center gap-2">
            {permissionsDirty && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 mr-2"
              >
                <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
              </motion.div>
            )}
            <button
              onClick={resetPermissions}
              disabled={!permissionsDirty || savingPermissions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowCounterClockwise size={16} />
              Reset
            </button>
            <button
              onClick={savePermissions}
              disabled={!permissionsDirty || savingPermissions}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {savingPermissions ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FloppyDisk size={16} weight="bold" />
                  Save Permissions
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {["workflow", "services", "operations", "admin"].map((category) => {
            const categoryPermissions = allPermissions.filter(p => p.category === category);
            if (categoryPermissions.length === 0) return null;

            const isExpanded = expandedCategories[category];
            const actions = ["can_read", "can_write", "can_delete", "can_approve", "can_comment"];

            return (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 uppercase">{category}</span>
                    <span className="text-xs text-gray-400">({categoryPermissions.length} permissions)</span>
                  </div>
                  {isExpanded ? <CaretUp size={20} className="text-gray-400" /> : <CaretDown size={20} className="text-gray-400" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Category-level toggles */}
                      <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-200 flex items-center justify-end gap-4">
                        <span className="text-xs text-gray-500 mr-2">Toggle all:</span>
                        {actions.map(action => {
                          const state = getCategoryActionState(category, action);
                          return (
                            <label key={action} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state === true}
                                ref={(el) => {
                                  if (el) el.indeterminate = state === 'indeterminate';
                                }}
                                onChange={(e) => toggleCategoryPermissions(category, action, e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs text-gray-500 capitalize">{action.replace("can_", "")}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="divide-y divide-gray-100">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="font-medium text-gray-900 text-sm">{permission.display_name}</div>
                              {permission.description && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{permission.description}</div>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              {actions.map(action => (
                                <label key={action} className="flex items-center gap-1.5 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={localPermissions[permission.id!]?.[action as keyof typeof localPermissions[number]] ?? false}
                                    onChange={(e) => handleLocalPermissionChange(permission.id!, action, e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-xs text-gray-500 group-hover:text-gray-700 capitalize w-14">
                                    {action.replace("can_", "")}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && !addingMember && setShowAddMemberModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserPlus size={20} className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setSelectedEmployee(null);
                      setSearchTerm("");
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Search Employee
                  </label>
                  <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or designation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{selectedEmployee.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <X size={18} className="text-blue-600" />
                    </button>
                  </div>
                )}

                {!selectedEmployee && searchTerm && (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const employee = employees.find(e => e.id === emp.id)!;
                        return (
                          <button
                            key={employee.id}
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setSearchTerm("");
                            }}
                            className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-xs text-gray-500">{employee.email}</div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">No employees found</div>
                    )}
                  </div>
                )}

                {!selectedEmployee && !searchTerm && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Start typing to search for employees
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedEmployee(null);
                    setSearchTerm("");
                  }}
                  disabled={addingMember}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedEmployee || addingMember}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingMember ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} weight="bold" />
                      Add Member
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {memberToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && !removingMember && setMemberToRemove(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash size={24} className="text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Remove Member</h2>
                </div>
                
                <p className="text-gray-600">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-gray-900">
                    {memberToRemove.employee?.first_name} {memberToRemove.employee?.last_name}
                  </span>{" "}
                  from this team?
                </p>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  disabled={removingMember}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={removingMember}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {removingMember ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash size={16} weight="bold" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
