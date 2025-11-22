"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Team, TeamMember, TeamPermission, Permission } from "@/lib/types/schemas";
import { 
  ArrowLeft, 
  UserPlus, 
  Trash, 
  MagnifyingGlass, 
  Shield,
  X 
} from "@phosphor-icons/react";
import { filterEmployeesBySearch } from "@/lib/utils/user-search";
import { toast } from "sonner";

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

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Validate and parse route parameters
  const companyId = parseInt(params.companyId as string);
  const teamId = parseInt(params.teamId as string);

  // Validate that parameters are valid numbers
  const isValidParams = !isNaN(companyId) && !isNaN(teamId) && companyId > 0 && teamId > 0;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMemberWithEmployee[]>([]);
  const [permissions, setPermissions] = useState<TeamPermissionWithModule[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add member modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);

  useEffect(() => {
    if (!isValidParams) {
      console.error("Invalid route parameters:", { companyId: params.companyId, teamId: params.teamId });
      toast.error("Invalid team or company ID");
      router.push("/sa/teams");
      return;
    }
    
    fetchTeamData();
    fetchAllPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isValidParams]);

  const fetchTeamData = async () => {
    // Guard clause: Don't fetch if parameters are invalid
    if (!isValidParams) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .eq("company_id", companyId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch team members
      // Use !team_members_employee_id_fkey to specify which relationship to use
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select(`
          *,
          employee:employees!team_members_employee_id_fkey(id, first_name, last_name, email, designation)
        `)
        .eq("team_id", teamId);

      if (membersError) throw membersError;
      setMembers((membersData as TeamMemberWithEmployee[]) || []);

      // Fetch team permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from("team_permissions")
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq("team_id", teamId);

      if (permissionsError) throw permissionsError;
      setPermissions((permissionsData as TeamPermissionWithModule[]) || []);
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddMember = async () => {
    if (!selectedEmployee) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("team_members").insert([
        {
          team_id: teamId,
          employee_id: selectedEmployee.id,
          added_by: user?.id,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error("This employee is already a member of this team");
        } else {
          throw error;
        }
      } else {
        toast.success("Team member added successfully");
        setShowAddMemberModal(false);
        setSelectedEmployee(null);
        setSearchTerm("");
        fetchTeamData();
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return;
    }

    try {
      await supabase.from("team_members").delete().eq("id", memberId);
      toast.success("Team member removed successfully");
      fetchTeamData();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

  const handleUpdatePermission = async (
    permissionId: number,
    action: keyof TeamPermission,
    value: boolean
  ) => {
    try {
      // Check if permission already exists
      const existingPermission = permissions.find(
        (p) => p.permission_id === permissionId
      );

      if (existingPermission) {
        // Update existing permission
        await supabase
          .from("team_permissions")
          .update({ [action]: value })
          .eq("id", existingPermission.id);
      } else {
        // Create new permission
        await supabase.from("team_permissions").insert([
          {
            team_id: teamId,
            permission_id: permissionId,
            [action]: value,
            can_read: action === "can_read" ? value : false,
            can_write: action === "can_write" ? value : false,
            can_delete: action === "can_delete" ? value : false,
            can_approve: action === "can_approve" ? value : false,
            can_comment: action === "can_comment" ? value : false,
          },
        ]);
      }

      toast.success("Permission updated successfully");
      fetchTeamData();
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Failed to update permission");
    }
  };

  const getPermissionValue = (
    permissionId: number,
    action: keyof TeamPermission
  ): boolean => {
    const permission = permissions.find((p) => p.permission_id === permissionId);
    return permission ? (permission[action] as boolean) : false;
  };

  // Filter employees for search
  const filteredEmployees = filterEmployeesBySearch(
    employees.map(emp => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      designation: emp.designation,
    })),
    searchTerm
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading team details...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Team not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/sa/teams")}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600 mt-1">{team.description || "No description"}</p>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <button
            onClick={() => {
              fetchEmployees();
              setShowAddMemberModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus size={20} />
            <span>Add Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {member.employee
                        ? `${member.employee.first_name} ${member.employee.last_name}`
                        : "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {member.employee?.email || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {member.employee?.designation || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleRemoveMember(member.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No members in this team yet
            </div>
          )}
        </div>
      </div>

      {/* Team Permissions Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Shield size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Configure what this team can access and do
          </p>
        </div>

        <div className="p-6">
          {["workflow", "services", "operations", "admin"].map((category) => {
            const categoryPermissions = allPermissions.filter(
              (p) => p.category === category
            );

            if (categoryPermissions.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {permission.display_name}
                        </div>
                        {permission.description && (
                          <div className="text-sm text-gray-600">
                            {permission.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        {["can_read", "can_write", "can_delete", "can_approve", "can_comment"].map(
                          (action) => (
                            <label
                              key={action}
                              className="flex items-center space-x-1 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={getPermissionValue(
                                  permission.id!,
                                  action as keyof TeamPermission
                                )}
                                onChange={(e) =>
                                  handleUpdatePermission(
                                    permission.id!,
                                    action as keyof TeamPermission,
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-600">
                                {action.replace("can_", "").replace("_", " ")}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Team Member</h2>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedEmployee(null);
                  setSearchTerm("");
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Employee
                </label>
                <div className="relative mb-2">
                  <MagnifyingGlass
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, email, or designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedEmployee && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{selectedEmployee.email}</div>
                    </div>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {!selectedEmployee && searchTerm && (
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
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
                            className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-600">{employee.email}</div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500">No employees found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedEmployee(null);
                    setSearchTerm("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
